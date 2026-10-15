"""NEBULA - Tool Selection Module powered by Strands Decider 2B.

This module is the core decision layer of NEBULA. It queries the Strands Decider 2B
system-one model to evaluate the current state of an astronomical anomaly investigation
and select the optimal next analysis tool with calibrated confidence.

Complies strictly with the official Strands Decider schema and API:
- Request format: SystemOneRequest with ChoiceQuestion
- Response format: SystemOneResponse with ChoiceAnswer
- Never fabricates confidence scores or falsely claims real model execution
- Enforces safe, transparent fallback on timeout, low confidence, or service outage
"""

import logging
import os
import time
from typing import Dict, List, Optional, Tuple
import httpx

from strands_decider.schema import (
    ChoiceQuestion,
    ChoiceAnswer,
    SystemOneRequest,
    SystemOneResponse,
)

from backend.app.decisions.schemas import (
    AllowedToolAction,
    DEFAULT_QUESTION_INSTRUCTIONS,
    TOOL_ACTION_CRITERIA,
    ToolDecisionRequest,
    ToolDecisionResult,
)

logger = logging.getLogger("nebula.decisions.tool_selection")


class StrandsDeciderClient:
    """Client for querying the Strands Decider 2B inference service or running local engine."""

    def __init__(
        self,
        endpoint_url: Optional[str] = None,
        timeout_seconds: float = 4.0,
        model_name: str = "StrandsAgents/strands-decider-2B-hobson-v19",
    ):
        self.endpoint_url = endpoint_url or os.getenv(
            "STRANDS_DECIDER_URL", "http://localhost:8000"
        ).rstrip("/")
        self.timeout_seconds = float(
            os.getenv("STRANDS_DECIDER_TIMEOUT", str(timeout_seconds))
        )
        self.model_name = model_name
        self._in_process_engine = None
        self._last_offline_time = 0.0

    def check_health(self) -> Dict[str, str]:
        """Check if the Strands Decider 2B service is reachable."""
        try:
            with httpx.Client(timeout=0.4) as client:
                resp = client.get(f"{self.endpoint_url}/health")
                if resp.status_code == 200:
                    data = resp.json()
                    self._last_offline_time = 0.0
                    return {
                        "status": "online",
                        "endpoint": self.endpoint_url,
                        "model": data.get("model", self.model_name),
                        "device": data.get("device", "unknown"),
                    }
        except Exception as e:
            self._last_offline_time = time.time()
            logger.debug(f"Decider health check failed on {self.endpoint_url}: {e}")
        return {
            "status": "offline",
            "endpoint": self.endpoint_url,
            "error": "Endpoint unreachable",
        }

    def evaluate_choice(
        self,
        state_text: str,
        question_instructions: str,
        criteria: Dict[str, str],
        question_id: str = "next_tool",
    ) -> Tuple[ChoiceAnswer, float, str]:
        """Send a typed ChoiceQuestion to Strands Decider 2B and receive calibrated ChoiceAnswer.

        Returns:
            Tuple of (ChoiceAnswer, latency_ms, model_identifier)
        """
        question = ChoiceQuestion(
            type="choice",
            instructions=question_instructions,
            criteria=criteria,
        )

        request = SystemOneRequest(
            state=state_text,
            questions={question_id: question},
            model=self.model_name,
        )

        # If endpoint was recently detected offline, fail fast to avoid blocking agent loops
        if self._last_offline_time > 0 and (time.time() - self._last_offline_time) < 2.0:
            raise httpx.ConnectError(f"Endpoint {self.endpoint_url} recently unreachable; fast fallback engaged.")

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                resp = client.post(
                    f"{self.endpoint_url}/v1/systemone",
                    json=request.model_dump(),
                    headers={"Content-Type": "application/json"},
                )
        except Exception:
            self._last_offline_time = time.time()
            raise

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        if resp.status_code != 200:
            raise RuntimeError(
                f"Strands Decider HTTP error {resp.status_code}: {resp.text}"
            )

        data = resp.json()
        response = SystemOneResponse.model_validate(data)

        if question_id not in response.answers:
            raise ValueError(f"Question '{question_id}' not found in Decider response")

        raw_answer = response.answers[question_id]
        if not isinstance(raw_answer, ChoiceAnswer):
            # If validated as base Answer, ensure it is converted or read as ChoiceAnswer
            if isinstance(raw_answer, dict):
                answer = ChoiceAnswer.model_validate(raw_answer)
            else:
                answer = ChoiceAnswer.model_validate(raw_answer.model_dump())
        else:
            answer = raw_answer

        return answer, elapsed_ms, response.model


def select_next_tool(
    request: ToolDecisionRequest,
    client: Optional[StrandsDeciderClient] = None,
) -> ToolDecisionResult:
    """Execute the core Strands Decider 2B decision process for tool selection.

    Step-by-step:
    1. Prepares candidate criteria from allowed_actions.
    2. Builds the typed question and state string.
    3. Invokes the official Strands Decider 2B model.
    4. Validates the choice against allowed options.
    5. Validates confidence against threshold.
    6. Falls back safely if model is offline, times out, or produces low confidence,
       clearly flagging provenance and reason.
    """
    if client is None:
        client = StrandsDeciderClient()

    # 1. Filter criteria to allowed actions
    candidate_keys = [action.value for action in request.allowed_actions]
    criteria = {
        action.value: TOOL_ACTION_CRITERIA[action]
        for action in request.allowed_actions
    }

    start_timer = time.perf_counter()
    question_instructions = DEFAULT_QUESTION_INSTRUCTIONS

    # Attempt invocation of live Strands Decider 2B
    try:
        choice_answer, live_latency_ms, model_name = client.evaluate_choice(
            state_text=request.state_summary,
            question_instructions=question_instructions,
            criteria=criteria,
            question_id="tool_selection",
        )

        chosen_str = choice_answer.choice
        confidence = choice_answer.confidence
        probabilities = choice_answer.probabilities or {}

        # Validate that the selected choice is one of the candidate actions
        if chosen_str not in candidate_keys:
            logger.warning(
                f"Decider returned unrecognized option '{chosen_str}' not in {candidate_keys}"
            )
            return _execute_safe_fallback(
                request=request,
                candidate_keys=candidate_keys,
                reason=f"Model output '{chosen_str}' is outside allowed candidates {candidate_keys}",
                status="fallback_invalid_output",
                raw_latency_ms=live_latency_ms,
                probabilities=probabilities,
            )

        # Validate confidence threshold
        if confidence is not None and confidence < request.confidence_threshold:
            logger.info(
                f"Decider confidence {confidence:.3f} below threshold {request.confidence_threshold:.3f}"
            )
            return _execute_safe_fallback(
                request=request,
                candidate_keys=candidate_keys,
                reason=(
                    f"Model confidence ({confidence:.3f}) was below calibrated safety threshold "
                    f"({request.confidence_threshold:.3f}). Initiating safe fallback."
                ),
                status="fallback_low_confidence",
                raw_latency_ms=live_latency_ms,
                probabilities=probabilities,
                low_conf_choice=AllowedToolAction(chosen_str),
                low_conf_score=confidence,
            )

        # Successful real Decider 2B decision
        selected_action = AllowedToolAction(chosen_str)
        return ToolDecisionResult(
            decision_number=request.step_number,
            typed_question=question_instructions,
            candidate_actions=candidate_keys,
            selected_action=selected_action,
            confidence=confidence,
            probabilities=probabilities,
            latency_ms=round(live_latency_ms, 2),
            investigation_state_input=request.state_summary,
            decision_source=f"strands-decider-2b ({model_name})",
            is_real_decider=True,
            status="success",
            reason=(
                f"Strands Decider 2B selected '{selected_action.value}' with "
                f"confidence {confidence:.3f} based on state criteria."
            ),
            fallback_occurred=False,
        )

    except httpx.TimeoutException as e:
        elapsed = (time.perf_counter() - start_timer) * 1000.0
        logger.warning(f"Strands Decider timed out after {elapsed:.1f}ms: {e}")
        return _execute_safe_fallback(
            request=request,
            candidate_keys=candidate_keys,
            reason=f"Decider inference timed out after {request.confidence_threshold}s: {e}",
            status="fallback_timeout",
            raw_latency_ms=elapsed,
        )

    except (httpx.ConnectError, httpx.RequestError) as e:
        elapsed = (time.perf_counter() - start_timer) * 1000.0
        logger.info(
            f"Strands Decider service unavailable on {client.endpoint_url}: {e}. "
            "Engaging deterministic fallback."
        )
        return _execute_safe_fallback(
            request=request,
            candidate_keys=candidate_keys,
            reason=f"Decider service unreachable at {client.endpoint_url}. Safe fallback engaged.",
            status="fallback_service_unavailable",
            raw_latency_ms=elapsed,
        )

    except Exception as e:
        elapsed = (time.perf_counter() - start_timer) * 1000.0
        logger.error(f"Unexpected Decider failure: {e}", exc_info=True)
        return _execute_safe_fallback(
            request=request,
            candidate_keys=candidate_keys,
            reason=f"Decider invocation failed with error: {str(e)}",
            status="fallback_error",
            raw_latency_ms=elapsed,
        )


def _execute_safe_fallback(
    request: ToolDecisionRequest,
    candidate_keys: List[str],
    reason: str,
    status: str,
    raw_latency_ms: float,
    probabilities: Optional[Dict[str, float]] = None,
    low_conf_choice: Optional[AllowedToolAction] = None,
    low_conf_score: Optional[float] = None,
) -> ToolDecisionResult:
    """Deterministic scientific investigation fallback.

    Ensures that when Strands Decider 2B is unavailable or returns low confidence,
    the agent follows a safe, structured scientific triage order:
    1. Check image/data quality first if unverified (rule out artifacts).
    2. Compare photometric epochs if quality is verified but flux is unmeasured.
    3. Track motion if coordinates are available to check for solar system motion.
    4. Request more data if all standard analyses are complete or steps >= 4.

    NEVER claims to be Decider 2B. Sets is_real_decider=False and records fallback_occurred=True.
    """
    executed_tools = set(request.context_metadata.get("executed_tools", []))
    user_query = str(request.context_metadata.get("user_query", "")).lower()
    state_lower = request.state_summary.lower()

    # 1. Check hypothesis-driven priorities from query
    if (
        any(k in user_query for k in ["motion", "orbit", "asteroid", "moving", "displace"])
        and AllowedToolAction.TRACK_MOTION.value in candidate_keys
        and "track_motion" not in executed_tools
    ):
        chosen = AllowedToolAction.TRACK_MOTION
        logic = "Safe triage: Prioritizing astrometric motion tracking per inquiry hypothesis."
    elif (
        any(k in user_query or k in state_lower for k in ["spike", "glitch", "artifact", "cosmic ray", "hot pixel"])
        and AllowedToolAction.CHECK_QUALITY.value in candidate_keys
        and "check_quality" not in executed_tools
    ):
        chosen = AllowedToolAction.CHECK_QUALITY
        logic = "Safe triage: Prioritizing detector quality and artifact screening per inquiry."
    elif (
        any(k in user_query for k in ["bright", "magnitude", "flux", "transient", "supernova"])
        and AllowedToolAction.COMPARE_EPOCHS.value in candidate_keys
        and "compare_epochs" not in executed_tools
    ):
        chosen = AllowedToolAction.COMPARE_EPOCHS
        logic = "Safe triage: Evaluating photometric magnitude and flux changes across epochs."

    # 2. Standard systematic scientific progression
    elif (
        AllowedToolAction.CHECK_QUALITY.value in candidate_keys
        and "check_quality" not in executed_tools
    ):
        chosen = AllowedToolAction.CHECK_QUALITY
        logic = "Safe triage: Verify data quality flags and eliminate artifacts first."
    elif (
        AllowedToolAction.COMPARE_EPOCHS.value in candidate_keys
        and "compare_epochs" not in executed_tools
    ):
        chosen = AllowedToolAction.COMPARE_EPOCHS
        logic = "Safe triage: Evaluate photometric magnitude and flux changes across epochs."
    elif (
        AllowedToolAction.TRACK_MOTION.value in candidate_keys
        and "track_motion" not in executed_tools
    ):
        chosen = AllowedToolAction.TRACK_MOTION
        logic = "Safe triage: Check astrometric positional shift to detect moving bodies."
    elif AllowedToolAction.REQUEST_MORE_DATA.value in candidate_keys:
        chosen = AllowedToolAction.REQUEST_MORE_DATA
        logic = "Safe triage: Basic analyses complete; request follow-up observations or conclude."
    else:
        # Fallback to the first available candidate action
        chosen = AllowedToolAction(candidate_keys[0])
        logic = f"Safe triage: Defaulting to first candidate action '{chosen.value}'."

    return ToolDecisionResult(
        decision_number=request.step_number,
        typed_question=DEFAULT_QUESTION_INSTRUCTIONS,
        candidate_actions=candidate_keys,
        selected_action=chosen,
        confidence=low_conf_score,  # Actual low score if known, or None
        probabilities=probabilities or {},
        latency_ms=round(raw_latency_ms, 2),
        investigation_state_input=request.state_summary,
        decision_source="fallback_heuristic (safe scientific triage)",
        is_real_decider=False,
        status=status,
        reason=f"{reason} -> {logic}",
        fallback_occurred=True,
    )
