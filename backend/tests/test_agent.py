"""End-to-end tests for the NebulaSpaceAgent investigation loop."""

from unittest.mock import patch
import pytest

from backend.app.agent.space_agent import NebulaSpaceAgent
from backend.app.decisions.schemas import AllowedToolAction
from backend.app.decisions.tool_selection import StrandsDeciderClient
from backend.app.models.schemas import AnomalyClassification
from backend.app.services.bedrock_service import BedrockService
from backend.app.services.observation_service import ObservationService


@pytest.fixture
def obs_service():
    return ObservationService()


def test_agent_investigate_supernova(obs_service):
    """End-to-end investigation on SN-2026-X1 classifies as transient_event."""
    target = obs_service.get_target("SN-2026-X1")
    agent = NebulaSpaceAgent(max_steps=3)

    session = agent.investigate(target, "Investigate sudden brightening")
    assert session.status == "completed"
    assert len(session.decisions) >= 1
    assert len(session.tool_results) >= 1
    assert session.final_report is not None
    assert session.final_report.primary_classification == AnomalyClassification.TRANSIENT_EVENT
    assert len(session.final_report.observed_facts) > 0


def test_agent_investigate_moving_asteroid(obs_service):
    """End-to-end investigation on AST-2026-NEO classifies as moving_object."""
    target = obs_service.get_target("AST-2026-NEO")
    agent = NebulaSpaceAgent(max_steps=3)

    # Force decision tool to run track_motion
    session = agent.investigate(target, "Verify if source has orbital motion")
    assert session.status == "completed"
    assert session.final_report is not None
    assert session.final_report.primary_classification == AnomalyClassification.MOVING_OBJECT


def test_agent_investigate_artifact_glitch(obs_service):
    """End-to-end investigation on ART-2026-GLITCH detects measurement artifact."""
    target = obs_service.get_target("ART-2026-GLITCH")
    agent = NebulaSpaceAgent(max_steps=3)

    session = agent.investigate(target, "Examine suspected single-frame spike")
    assert session.status == "completed"
    assert session.final_report.primary_classification == AnomalyClassification.MEASUREMENT_ARTIFACT


def test_agent_investigate_incomplete_target(obs_service):
    """Single epoch target triggers inconclusive report with follow-up needs."""
    target = obs_service.get_target("INCOMPLETE-2026-UNK")
    agent = NebulaSpaceAgent(max_steps=2)

    session = agent.investigate(target, "Evaluate sparse detection")
    assert session.status == "completed"
    assert session.final_report.primary_classification == AnomalyClassification.INCONCLUSIVE
    assert len(session.final_report.recommended_follow_up) > 0


def test_agent_max_steps_loop_prevention(obs_service):
    """Agent strictly terminates when max_steps is reached."""
    target = obs_service.get_target("VAR-2026-BLAZAR")
    agent = NebulaSpaceAgent(max_steps=2)

    session = agent.investigate(target, "Full analysis")
    assert len(session.decisions) <= 2
    assert session.current_step <= 2
    assert session.status == "completed"
