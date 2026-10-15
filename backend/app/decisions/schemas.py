"""NEBULA - Decision Schemas for Strands Decider 2B Tool Selection.

Defines the typed decision questions, allowed tool action enums, and request/response
structures matching the official Strands Decider 2B specifications.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AllowedToolAction(str, Enum):
    """The four strictly allowed tool actions for NEBULA astronomical anomaly investigation."""
    COMPARE_EPOCHS = "compare_epochs"
    TRACK_MOTION = "track_motion"
    CHECK_QUALITY = "check_quality"
    REQUEST_MORE_DATA = "request_more_data"


# Official criteria descriptions provided to Strands Decider 2B pointer head
TOOL_ACTION_CRITERIA: Dict[AllowedToolAction, str] = {
    AllowedToolAction.COMPARE_EPOCHS: (
        "Compare brightness, flux, and photometric measurements across observation epochs "
        "to determine if the object underwent significant brightening or fading."
    ),
    AllowedToolAction.TRACK_MOTION: (
        "Analyze celestial coordinates (Right Ascension and Declination) across epochs to "
        "detect angular displacement indicative of a moving solar system object (asteroid or NEO)."
    ),
    AllowedToolAction.CHECK_QUALITY: (
        "Investigate image quality flags, point-spread function (PSF) residuals, background noise, "
        "and potential detector artifacts (cosmic rays, edge bleeds, bad pixels)."
    ),
    AllowedToolAction.REQUEST_MORE_DATA: (
        "Request additional observational evidence or conclude that available data is insufficient "
        "when key measurements are missing or maximum investigation depth is reached."
    ),
}

DEFAULT_QUESTION_INSTRUCTIONS = (
    "Based on the astronomical anomaly investigation state and unresolved questions, "
    "which analysis tool should be executed next?"
)


class ToolDecisionRequest(BaseModel):
    """Request model for selecting the next agent tool using Strands Decider 2B."""
    investigation_id: str = Field(..., description="Unique ID of the ongoing investigation")
    state_summary: str = Field(..., description="Current textual state and evidence synthesis for the decider")
    step_number: int = Field(default=1, ge=1, description="Current investigation step count")
    allowed_actions: List[AllowedToolAction] = Field(
        default_factory=lambda: list(AllowedToolAction),
        description="Subset of valid tool actions candidate for this step"
    )
    confidence_threshold: float = Field(
        default=0.40,
        ge=0.0,
        le=1.0,
        description="Minimum calibrated confidence required from Decider 2B"
    )
    context_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional debugging or telemetry metadata"
    )


class ToolDecisionResult(BaseModel):
    """Result model capturing the decision made, latency, confidence, and provenance."""
    decision_number: int = Field(..., description="1-indexed sequence number of this decision")
    typed_question: str = Field(..., description="The typed question prompt passed to the decision layer")
    candidate_actions: List[str] = Field(..., description="List of allowed candidate action keys")
    selected_action: AllowedToolAction = Field(..., description="The validated tool action to execute")
    confidence: Optional[float] = Field(
        None,
        description="Calibrated probability/confidence score from Decider 2B (None if fallback)"
    )
    probabilities: Dict[str, float] = Field(
        default_factory=dict,
        description="Probability distribution across candidate actions returned by the model"
    )
    latency_ms: float = Field(..., description="Round-trip decision latency in milliseconds")
    investigation_state_input: str = Field(..., description="Exact state string provided to the decision layer")
    decision_source: str = Field(
        ...,
        description="'strands-decider-2b' for real model inference, or explicit fallback indicator"
    )
    is_real_decider: bool = Field(
        ...,
        description="Strictly True only if returned by the live Strands Decider 2B model"
    )
    status: str = Field(
        default="success",
        description="'success', 'fallback_low_confidence', 'fallback_timeout', 'fallback_service_unavailable', 'fallback_invalid_output'"
    )
    reason: str = Field(..., description="Rationale for selecting this action or triggering fallback")
    fallback_occurred: bool = Field(default=False, description="True if safe fallback logic was invoked")
