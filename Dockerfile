# Multi-stage Dockerfile for NEBULA Backend & Full-Stack Deployment
# AWS Strands Decider 2B Agent Experience Hackathon 2026

FROM python:3.12-slim AS backend-base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/app /app/backend/app
COPY backend/__init__.py /app/backend/__init__.py
COPY pytest.ini /app/pytest.ini

# Install required Python packages
RUN pip install --upgrade pip && \
    pip install \
    fastapi==0.115.0 \
    uvicorn[standard]==0.30.6 \
    pydantic==2.8.2 \
    httpx==0.27.0 \
    boto3==1.35.0 \
    botocore==1.35.0 \
    pytest==8.3.2 \
    pytest-asyncio==0.24.0 \
    strands-agents \
    strands-decider

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
