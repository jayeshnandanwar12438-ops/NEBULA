"""NEBULA - Autonomous Space Anomaly Investigator Backend API.

AWS Strands Decider 2B Agent Experience Hackathon 2026.
"""

import sys
from pathlib import Path

# Ensure project root and backend directory are in sys.path
_current_dir = Path(__file__).resolve().parent  # app
_backend_dir = _current_dir.parent  # backend
_project_root = _backend_dir.parent  # NEBULA

for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router

app = FastAPI(
    title="NEBULA — Autonomous Space Anomaly Investigator API",
    description=(
        "Mission-control API powering autonomous astronomical anomaly investigations. "
        "Integrates Strands Decider 2B for system-one discrete tool selection decisions "
        "and Amazon Bedrock for generative scientific report synthesis."
    ),
    version="1.0.0",
)

# Enable CORS for local Next.js frontend development and production containers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "NEBULA Backend API",
        "hackathon": "AWS Strands Decider 2B Agent Experience Hackathon 2026",
        "docs_url": "/docs",
        "health_url": "/api/health",
    }


@app.get("/health")
def root_health():
    from backend.app.api.routes import get_health
    return get_health()
