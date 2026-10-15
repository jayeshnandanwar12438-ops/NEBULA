"""Live integration test for the actual Strands Decider 2B model inference.

Per Hackathon Specification:
- Include at least one clearly documented live integration test that verifies the actual Decider 2B model can return a decision.
- Do not represent mocked tests as proof that the real model works.

HOW TO RUN LIVE TEST:
1. Start the official Strands Decider 2B server in another terminal:
   strands-decider serve StrandsAgents/strands-decider-2B-hobson-v19 --port 8000

2. Run this test:
   pytest backend/tests/test_live_decider.py -v -s
"""

import os
import pytest
from backend.app.decisions.schemas import (
    AllowedToolAction,
    DEFAULT_QUESTION_INSTRUCTIONS,
    TOOL_ACTION_CRITERIA,
    ToolDecisionRequest,
)
from backend.app.decisions.tool_selection import StrandsDeciderClient, select_next_tool


def test_live_strands_decider_inference():
    """Verify live Strands Decider 2B model returns an actual calibrated decision."""
    endpoint_url = os.getenv("STRANDS_DECIDER_URL", "http://localhost:8000")
    client = StrandsDeciderClient(endpoint_url=endpoint_url)

    health = client.check_health()
    if health.get("status") != "online":
        pytest.skip(
            f"Live Strands Decider 2B server is not currently reachable at {endpoint_url}. "
            "To execute this live test against the real 2B parameter model, start the server via:\n"
            "   strands-decider serve StrandsAgents/strands-decider-2B-hobson-v19 --port 8000\n"
            "and re-run pytest backend/tests/test_live_decider.py"
        )

    # Real model is reachable! Send typed choice question
    state_prompt = (
        "INVESTIGATION STEP 1/4. TARGET: Real-Sky-Alert-2026. "
        "Object underwent rapid 3.0-magnitude brightening in 2 hours. "
        "Detector quality flags are completely unverified. No bad-pixel or cosmic-ray tests have run."
    )

    req = ToolDecisionRequest(
        investigation_id="LIVE-VERIFICATION-RUN",
        state_summary=state_prompt,
        step_number=1,
        allowed_actions=list(AllowedToolAction),
        confidence_threshold=0.30,
    )

    result = select_next_tool(req, client=client)

    # Assertions on REAL model output
    assert result.is_real_decider is True, "Result MUST be confirmed from real Decider 2B model"
    assert result.fallback_occurred is False, "Fallback must not have occurred on live model run"
    assert result.selected_action in AllowedToolAction
    assert result.confidence is not None, "Real model MUST return calibrated confidence"
    assert 0.0 <= result.confidence <= 1.0
    assert len(result.probabilities) == 4, "Real model MUST return probabilities for all 4 candidate tools"
    assert result.latency_ms > 0.0
    assert "strands-decider-2b" in result.decision_source.lower()

    print(f"\n[LIVE DECIDER 2B VERIFIED]")
    print(f"Model ID:    {result.decision_source}")
    print(f"Selected:    {result.selected_action.value}")
    print(f"Confidence:  {result.confidence:.4f}")
    print(f"Latency:     {result.latency_ms:.1f}ms")
    print(f"Probabilities: {result.probabilities}")
