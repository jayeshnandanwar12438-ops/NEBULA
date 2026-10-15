"""NEBULA - FastAPI API Routes.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.agent.space_agent import NebulaSpaceAgent
from backend.app.decisions.schemas import (
    AllowedToolAction,
    DEFAULT_QUESTION_INSTRUCTIONS,
    TOOL_ACTION_CRITERIA,
    ToolDecisionRequest,
    ToolDecisionResult,
)
from backend.app.decisions.tool_selection import StrandsDeciderClient, select_next_tool
from backend.app.models.schemas import (
    AstronomicalTarget,
    InvestigationSession,
)
from backend.app.services.bedrock_service import BedrockService
from backend.app.services.benchmark_service import BenchmarkService, BenchmarkSuiteReport
from backend.app.services.observation_service import ObservationService

router = APIRouter(prefix="/api")

# Singleton services
observation_svc = ObservationService()
decider_client = StrandsDeciderClient()
bedrock_svc = BedrockService()
agent = NebulaSpaceAgent(
    decider_client=decider_client,
    bedrock_service=bedrock_svc,
)
benchmark_svc = BenchmarkService(
    decider_client=decider_client,
    bedrock_service=bedrock_svc,
)

# In-memory session store
_investigations: Dict[str, InvestigationSession] = {}


class StartInvestigationRequest(BaseModel):
    """Payload to launch a new anomaly investigation."""
    target_id: str = Field(..., description="Target catalog ID, e.g. 'SN-2026-X1'")
    user_query: str = Field(
        default=(
            "An astronomical object became significantly brighter between two observations. "
            "Determine whether the evidence suggests a transient event, a moving object, or a possible measurement artifact."
        ),
        description="Scientific investigation request prompt",
    )
    max_steps: Optional[int] = Field(default=4, ge=1, le=8)
    confidence_threshold: Optional[float] = Field(default=0.40, ge=0.0, le=1.0)


class DecisionLabRequest(BaseModel):
    """Payload to test Strands Decider 2B directly in the Decision Lab."""
    state: str = Field(..., description="Astronomical investigation state text")
    question_instructions: Optional[str] = Field(
        default=DEFAULT_QUESTION_INSTRUCTIONS,
        description="Typed question prompt",
    )
    candidate_actions: Optional[List[str]] = Field(
        default_factory=lambda: [a.value for a in AllowedToolAction],
        description="Candidate tool actions to evaluate",
    )
    confidence_threshold: Optional[float] = Field(default=0.40, ge=0.0, le=1.0)


@router.get("/health")
def get_health() -> Dict[str, Any]:
    """Return platform telemetry and service readiness."""
    decider_status = decider_client.check_health()
    bedrock_status = bedrock_svc.get_status()

    is_live_decider = decider_status.get("status") == "online"
    is_live_bedrock = not bedrock_status.get("is_development_mode", True)

    if is_live_decider and is_live_bedrock:
        runtime_mode = "LIVE_DECIDER_LIVE_BEDROCK"
    elif is_live_decider:
        runtime_mode = "LIVE_DECIDER_DEV_BEDROCK"
    elif is_live_bedrock:
        runtime_mode = "DEV_DECIDER_LIVE_BEDROCK"
    else:
        runtime_mode = "DEV_MODE"

    return {
        "status": "healthy",
        "project": "NEBULA — Autonomous Space Anomaly Investigator",
        "version": "1.0.0",
        "runtime_mode": runtime_mode,
        "strands_decider": decider_status,
        "amazon_bedrock": bedrock_status,
    }


@router.get("/observations", response_model=List[AstronomicalTarget])
def list_observations() -> List[AstronomicalTarget]:
    """List all available synthetic anomaly targets."""
    return observation_svc.list_targets()


@router.get("/observations/{target_id}", response_model=AstronomicalTarget)
def get_observation(target_id: str) -> AstronomicalTarget:
    """Retrieve an astronomical target and its observation epochs."""
    target = observation_svc.get_target(target_id)
    if not target:
        raise HTTPException(status_code=404, detail=f"Target '{target_id}' not found")
    return target


@router.post("/investigate", response_model=InvestigationSession)
def start_investigation(payload: StartInvestigationRequest) -> InvestigationSession:
    """Run an autonomous space anomaly investigation."""
    target = observation_svc.get_target(payload.target_id)
    if not target:
        raise HTTPException(status_code=404, detail=f"Target '{payload.target_id}' not found")

    custom_agent = NebulaSpaceAgent(
        decider_client=decider_client,
        bedrock_service=bedrock_svc,
        max_steps=payload.max_steps or 4,
        confidence_threshold=payload.confidence_threshold or 0.40,
    )

    session = custom_agent.investigate(
        target=target,
        user_query=payload.user_query,
    )

    _investigations[session.investigation_id] = session
    return session


@router.get("/investigations", response_model=List[InvestigationSession])
def list_investigations(limit: int = Query(default=20, ge=1, le=100)) -> List[InvestigationSession]:
    """List past investigation history."""
    sessions = list(_investigations.values())
    sessions.sort(key=lambda s: s.created_at, reverse=True)
    return sessions[:limit]


@router.get("/investigations/{investigation_id}", response_model=InvestigationSession)
def get_investigation(investigation_id: str) -> InvestigationSession:
    """Retrieve details and timeline for a specific investigation."""
    session = _investigations.get(investigation_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found")
    return session


@router.post("/decision-lab/evaluate", response_model=ToolDecisionResult)
def evaluate_decision_lab(payload: DecisionLabRequest) -> ToolDecisionResult:
    """Interactive Decision Lab endpoint: Test Strands Decider 2B on custom inputs."""
    allowed = []
    for action_str in (payload.candidate_actions or []):
        try:
            allowed.append(AllowedToolAction(action_str))
        except ValueError:
            pass

    if not allowed:
        allowed = list(AllowedToolAction)

    req = ToolDecisionRequest(
        investigation_id="DECISION-LAB",
        state_summary=payload.state,
        step_number=1,
        allowed_actions=allowed,
        confidence_threshold=payload.confidence_threshold or 0.40,
    )

    return select_next_tool(req, client=decider_client)


@router.post("/benchmark/run", response_model=BenchmarkSuiteReport)
def run_benchmark_suite() -> BenchmarkSuiteReport:
    """Execute evaluation benchmark comparing Decider 2B vs Bedrock LLM baseline."""
    return benchmark_svc.run_benchmark()
