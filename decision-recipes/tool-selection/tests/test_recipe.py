"""Automated tests for the standalone tool selection recipe."""

import json
from unittest.mock import patch
import pytest
from strands_decider.schema import ChoiceAnswer, ChoiceQuestion, SystemOneRequest, SystemOneResponse, Usage

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from example import select_tool, CRITERIA, CONFIDENCE_THRESHOLD


def test_recipe_schema_validation():
    """Verify official Strands Decider schema creation."""
    q = ChoiceQuestion(
        type="choice",
        instructions="Select the next tool",
        criteria=CRITERIA,
    )
    assert q.type == "choice"
    assert len(q.criteria) == 4

    req = SystemOneRequest(
        state="Test state",
        questions={"next_tool": q},
    )
    dumped = req.model_dump()
    assert dumped["state"] == "Test state"
    assert "next_tool" in dumped["questions"]


def test_recipe_fallback_when_offline():
    """Verify transparent fallback when server is unreachable."""
    res = select_tool(
        state_description="Alert! Quality unverified.",
        decider_endpoint="http://localhost:9999",  # non-existent port
    )
    assert res.is_real_decider is False
    assert res.source == "fallback_triage"
    assert res.selected_tool in CRITERIA
    assert res.confidence is None
    assert "unreachable" in res.reason.lower() or "timeout" in res.reason.lower()


def test_recipe_live_mock_response():
    """Verify end-to-end parsing of a real Strands Decider 2B response payload."""
    mock_payload = {
        "model": "strands-decider-2B-hobson-v19",
        "answers": {
            "next_tool": {
                "type": "choice",
                "choice": "compare_epochs",
                "confidence": 0.825,
                "probabilities": {
                    "compare_epochs": 0.825,
                    "track_motion": 0.095,
                    "check_quality": 0.055,
                    "request_more_data": 0.025,
                },
            }
        },
        "usage": {"input_tokens": 85, "output_tokens": 1},
        "latency_ms": 32.5,
    }

    class MockResponse:
        status_code = 200
        def json(self):
            return mock_payload

    with patch("httpx.Client.post", return_value=MockResponse()):
        res = select_tool(
            state_description="Target SN-2026-X1. Need flux comparison.",
            decider_endpoint="http://mock-server:8000",
        )

        assert res.is_real_decider is True
        assert res.selected_tool == "compare_epochs"
        assert res.confidence == 0.825
        assert res.probabilities["compare_epochs"] == 0.825
        assert "strands-decider-2b" in res.source


def test_recipe_low_confidence_fallback():
    """Verify that decisions below calibrated confidence threshold trigger safe fallback."""
    low_conf_payload = {
        "model": "strands-decider-2B-hobson-v19",
        "answers": {
            "next_tool": {
                "type": "choice",
                "choice": "track_motion",
                "confidence": 0.28,  # Below threshold 0.40
                "probabilities": {
                    "compare_epochs": 0.25,
                    "track_motion": 0.28,
                    "check_quality": 0.24,
                    "request_more_data": 0.23,
                },
            }
        },
        "usage": {"input_tokens": 80, "output_tokens": 1},
    }

    class MockResponse:
        status_code = 200
        def json(self):
            return low_conf_payload

    with patch("httpx.Client.post", return_value=MockResponse()):
        res = select_tool(
            state_description="Ambiguous noisy observation.",
            decider_endpoint="http://mock-server:8000",
            threshold=0.40,
        )

        assert res.is_real_decider is False
        assert res.source == "fallback_triage"
        assert "below safety threshold" in res.reason
