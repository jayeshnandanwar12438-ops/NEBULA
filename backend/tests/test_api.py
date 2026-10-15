"""Automated API integration tests for FastAPI backend routes."""

from fastapi.testclient import TestClient
import pytest

from backend.app.main import app

client = TestClient(app)


def test_api_health_endpoint():
    """Verify health endpoint structure and runtime mode."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "runtime_mode" in data
    assert "strands_decider" in data
    assert "amazon_bedrock" in data


def test_api_list_and_get_observations():
    """Verify listing and retrieving catalog targets."""
    resp = client.get("/api/observations")
    assert resp.status_code == 200
    targets = resp.json()
    assert len(targets) >= 5

    target_id = targets[0]["target_id"]
    detail_resp = client.get(f"/api/observations/{target_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["target_id"] == target_id
    assert len(detail["epochs"]) >= 1


def test_api_investigate_valid():
    """Verify POST /api/investigate executes end-to-end and returns session."""
    payload = {
        "target_id": "SN-2026-X1",
        "user_query": "Determine if evidence suggests a transient event.",
        "max_steps": 2,
    }
    resp = client.post("/api/investigate", json=payload)
    assert resp.status_code == 200
    session = resp.json()
    assert session["investigation_id"].startswith("INV-")
    assert session["status"] == "completed"
    assert len(session["decisions"]) >= 1
    assert session["final_report"] is not None

    # Retrieve by ID
    inv_id = session["investigation_id"]
    get_resp = client.get(f"/api/investigations/{inv_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["investigation_id"] == inv_id


def test_api_investigate_nonexistent_target():
    """Verify 404 for invalid target ID."""
    resp = client.post("/api/investigate", json={"target_id": "NONEXISTENT-TARGET-999"})
    assert resp.status_code == 404


def test_api_decision_lab_evaluate():
    """Verify Decision Lab endpoint returns structured decision."""
    payload = {
        "state": "Object showed 2-magnitude flux delta. Quality flags unverified.",
        "candidate_actions": ["check_quality", "compare_epochs"],
        "confidence_threshold": 0.40,
    }
    resp = client.post("/api/decision-lab/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "selected_action" in data
    assert "latency_ms" in data
    assert "decision_source" in data


def test_api_benchmark_run():
    """Verify benchmark run endpoint executes test suite."""
    resp = client.post("/api/benchmark/run")
    assert resp.status_code == 200
    bm = resp.json()
    assert bm["sample_size"] >= 8
    assert "decider_accuracy_pct" in bm
    assert "decision_agreement_pct" in bm
    assert len(bm["detailed_results"]) >= 8
