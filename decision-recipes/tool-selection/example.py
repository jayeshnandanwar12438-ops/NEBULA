"""Standalone Minimal Example: Tool Selection using Strands Decider 2B.

Demonstrates how to:
1. Construct typed ChoiceQuestion matching the official Strands Decider schema.
2. Query the Strands Decider 2B endpoint.
3. Validate candidate choices and calibrated confidence scores.
4. Execute the chosen tool handler.
5. Apply safe fallback on service failure or low confidence.
"""

import time
from typing import Callable, Dict, Optional
import httpx
from pydantic import BaseModel, Field
from strands_decider.schema import (
    ChoiceAnswer,
    ChoiceQuestion,
    SystemOneRequest,
    SystemOneResponse,
)

# 1. Define allowed tool actions and candidate criteria
CRITERIA: Dict[str, str] = {
    "compare_epochs": "Compare photometric brightness and flux delta across epochs.",
    "track_motion": "Calculate angular displacement and proper motion from coordinates.",
    "check_quality": "Evaluate sensor quality flags, PSF residuals, and detector noise.",
    "request_more_data": "Request additional observations when data is insufficient.",
}

CONFIDENCE_THRESHOLD = 0.40
DECIDER_URL = "http://localhost:8000"


class DecisionResult(BaseModel):
    selected_tool: str
    confidence: Optional[float]
    probabilities: Dict[str, float]
    latency_ms: float
    is_real_decider: bool
    source: str
    reason: str


def select_tool(
    state_description: str,
    decider_endpoint: str = DECIDER_URL,
    threshold: float = CONFIDENCE_THRESHOLD,
) -> DecisionResult:
    """Select the next agent tool using Strands Decider 2B with safe fallback."""
    question = ChoiceQuestion(
        type="choice",
        instructions="Select the next analysis tool to execute based on the current state.",
        criteria=CRITERIA,
    )
    request = SystemOneRequest(
        state=state_description,
        questions={"next_tool": question},
        model="StrandsAgents/strands-decider-2B-hobson-v19",
    )

    t0 = time.perf_counter()

    # Attempt invocation of live Strands Decider 2B server
    try:
        with httpx.Client(timeout=3.0) as client:
            resp = client.post(
                f"{decider_endpoint.rstrip('/')}/v1/systemone",
                json=request.model_dump(),
            )
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        if resp.status_code == 200:
            parsed = SystemOneResponse.model_validate(resp.json())
            raw_ans = parsed.answers.get("next_tool")
            ans = ChoiceAnswer.model_validate(
                raw_ans if isinstance(raw_ans, dict) else raw_ans.model_dump()
            )

            # Validate candidate
            if ans.choice in CRITERIA:
                # Check confidence threshold
                if ans.confidence and ans.confidence < threshold:
                    return _safe_triage_fallback(
                        state_description,
                        reason=f"Model confidence ({ans.confidence:.2f}) was below safety threshold ({threshold:.2f})",
                        latency_ms=elapsed_ms,
                    )

                return DecisionResult(
                    selected_tool=ans.choice,
                    confidence=ans.confidence,
                    probabilities=ans.probabilities or {},
                    latency_ms=round(elapsed_ms, 2),
                    is_real_decider=True,
                    source=f"strands-decider-2b ({parsed.model})",
                    reason=f"Selected '{ans.choice}' with calibrated confidence {ans.confidence:.2f}.",
                )

    except Exception as exc:
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        return _safe_triage_fallback(
            state_description,
            reason=f"Decider endpoint unreachable or timed out ({exc}). Engaged safe triage.",
            latency_ms=elapsed_ms,
        )

    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return _safe_triage_fallback(
        state_description,
        reason="Model returned non-200 status. Engaged safe triage.",
        latency_ms=elapsed_ms,
    )


def _safe_triage_fallback(state: str, reason: str, latency_ms: float) -> DecisionResult:
    """Safe, transparent fallback when Decider 2B is unavailable or low-confidence."""
    state_low = state.lower()
    if "quality" not in state_low:
        chosen = "check_quality"
    elif "brightness" not in state_low and "flux" not in state_low:
        chosen = "compare_epochs"
    elif "motion" not in state_low and "coordinate" not in state_low:
        chosen = "track_motion"
    else:
        chosen = "request_more_data"

    return DecisionResult(
        selected_tool=chosen,
        confidence=None,
        probabilities={},
        latency_ms=round(latency_ms, 2),
        is_real_decider=False,
        source="fallback_triage",
        reason=f"{reason} -> Defaulting to safe scientific check '{chosen}'.",
    )


# -----------------------------------------------------------------------------
# Demo execution
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    sample_state = (
        "Object SN-2026-X1 exhibited sudden +2.8 mag brightening. "
        "Detector quality flags are unverified. No artifacts have been ruled out."
    )
    print("--- Evaluating State with Strands Decider 2B ---")
    print(f"State: {sample_state}\n")

    result = select_tool(sample_state)
    print(f"Selected Tool:    {result.selected_tool}")
    print(f"Decision Source:  {result.source}")
    print(f"Is Real Decider:  {result.is_real_decider}")
    print(f"Confidence:       {result.confidence}")
    print(f"Latency:          {result.latency_ms:.1f}ms")
    print(f"Rationale:        {result.reason}")
