"""Unit tests for tool_selection module and Strands Decider 2B integration."""

from unittest.mock import patch
import httpx
import pytest

from backend.app.decisions.schemas import (
    AllowedToolAction,
    ToolDecisionRequest,
)
from backend.app.decisions.tool_selection import StrandsDeciderClient, select_next_tool


def test_decider_client_health_check_offline():
    """Client correctly reports offline status when server is unreachable."""
    client = StrandsDeciderClient(endpoint_url="http://localhost:59999")
    status = client.check_health()
    assert status["status"] == "offline"


def test_decider_successful_live_mock():
    """Verify parsing and validation of successful live Decider 2B response."""
    mock_json = {
        "model": "StrandsAgents/strands-decider-2B-hobson-v19",
        "answers": {
            "tool_selection": {
                "type": "choice",
                "choice": "check_quality",
                "confidence": 0.892,
                "probabilities": {
                    "check_quality": 0.892,
                    "compare_epochs": 0.055,
                    "track_motion": 0.033,
                    "request_more_data": 0.020,
                },
            }
        },
        "usage": {"input_tokens": 120, "output_tokens": 1},
    }

    class MockResp:
        status_code = 200
        def json(self):
            return mock_json

    with patch("httpx.Client.post", return_value=MockResp()):
        req = ToolDecisionRequest(
            investigation_id="TEST-01",
            state_summary="New alert. Quality unverified. Potential cosmic ray glitch.",
            step_number=1,
            allowed_actions=list(AllowedToolAction),
            confidence_threshold=0.40,
        )
        res = select_next_tool(req, client=StrandsDeciderClient())

        assert res.is_real_decider is True
        assert res.selected_action == AllowedToolAction.CHECK_QUALITY
        assert res.confidence == 0.892
        assert res.status == "success"
        assert res.fallback_occurred is False


def test_decider_low_confidence_triggers_fallback():
    """When Decider 2B confidence is below safety threshold, safe triage must engage."""
    low_conf_json = {
        "model": "StrandsAgents/strands-decider-2B-hobson-v19",
        "answers": {
            "tool_selection": {
                "type": "choice",
                "choice": "track_motion",
                "confidence": 0.22,  # Safety threshold is 0.40
                "probabilities": {
                    "track_motion": 0.22,
                    "check_quality": 0.26,
                    "compare_epochs": 0.26,
                    "request_more_data": 0.26,
                },
            }
        },
        "usage": {"input_tokens": 90, "output_tokens": 1},
    }

    class MockResp:
        status_code = 200
        def json(self):
            return low_conf_json

    with patch("httpx.Client.post", return_value=MockResp()):
        req = ToolDecisionRequest(
            investigation_id="TEST-02",
            state_summary="Ambiguous astronomical alert.",
            step_number=1,
            allowed_actions=list(AllowedToolAction),
            confidence_threshold=0.40,
        )
        res = select_next_tool(req, client=StrandsDeciderClient())

        assert res.is_real_decider is False
        assert res.fallback_occurred is True
        assert res.status == "fallback_low_confidence"
        assert res.confidence == 0.22
        assert "below calibrated safety threshold" in res.reason


def test_decider_timeout_triggers_fallback():
    """Verify timeout triggers graceful fallback with elapsed timing."""
    def timeout_post(*args, **kwargs):
        raise httpx.TimeoutException("Connection timed out after 3.0s")

    with patch("httpx.Client.post", side_effect=timeout_post):
        req = ToolDecisionRequest(
            investigation_id="TEST-03",
            state_summary="Alert with unmeasured coordinates.",
            step_number=1,
            allowed_actions=[AllowedToolAction.TRACK_MOTION, AllowedToolAction.REQUEST_MORE_DATA],
            confidence_threshold=0.40,
        )
        res = select_next_tool(req, client=StrandsDeciderClient())

        assert res.is_real_decider is False
        assert res.fallback_occurred is True
        assert res.status == "fallback_timeout"
        assert "timed out" in res.reason.lower()


def test_decider_invalid_choice_triggers_fallback():
    """If the model somehow outputs an invalid or unallowed action string, fallback is engaged."""
    invalid_json = {
        "model": "StrandsAgents/strands-decider-2B-hobson-v19",
        "answers": {
            "tool_selection": {
                "type": "choice",
                "choice": "hallucinated_radio_spectrometer",  # Not an allowed tool
                "confidence": 0.95,
                "probabilities": {},
            }
        },
        "usage": {"input_tokens": 50, "output_tokens": 1},
    }

    class MockResp:
        status_code = 200
        def json(self):
            return invalid_json

    with patch("httpx.Client.post", return_value=MockResp()):
        req = ToolDecisionRequest(
            investigation_id="TEST-04",
            state_summary="Check if object is moving.",
            step_number=1,
            allowed_actions=list(AllowedToolAction),
            confidence_threshold=0.40,
        )
        res = select_next_tool(req, client=StrandsDeciderClient())

        assert res.is_real_decider is False
        assert res.fallback_occurred is True
        assert res.status == "fallback_invalid_output"
