#!/usr/bin/env bash
# ==============================================================================
# NEBULA — One-Click Startup Script (Linux / macOS / Git Bash)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==============================================================================="
echo "    NEBULA — Autonomous Space Anomaly Investigator"
echo "    AWS Strands Decider 2B Agent Experience Hackathon 2026"
echo "==============================================================================="

# 1. Virtual Environment & Dependencies
if [ ! -d "backend/.venv" ]; then
    echo "[*] Creating Python virtual environment in backend/.venv..."
    python3 -m venv backend/.venv
    source backend/.venv/bin/activate
    pip install -r backend/requirements.txt
else
    source backend/.venv/bin/activate
fi

# 2. Frontend Dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "[*] Installing frontend dependencies..."
    (cd frontend && npm install)
fi

# 3. Start Backend in Background
echo "[*] Launching NEBULA Backend API on http://localhost:8000..."
(cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

# 4. Start Frontend in Background
echo "[*] Launching NEBULA Frontend UI on http://localhost:3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT

sleep 3
echo "==============================================================================="
echo "   NEBULA IS LIVE!"
echo "   Dashboard:  http://localhost:3000"
echo "   Backend:    http://localhost:8000"
echo "   Docs:       http://localhost:8000/docs"
echo "==============================================================================="

# Try to open default browser
if which xdg-open > /dev/null; then
    xdg-open http://localhost:3000 &
elif which open > /dev/null; then
    open http://localhost:3000 &
fi

wait
