# NEBULA Hackathon Submission Checklist & Verification Matrix
## AWS Strands Decider 2B Agent Experience Hackathon 2026

This document provides a systematic verification matrix demonstrating full compliance with every requirement of the hackathon master build specification.

---

## 1. Core Requirements & Strands Decider 2B Integration

| Requirement | Specification | Implementation Verification | Status |
| :--- | :--- | :--- | :---: |
| **Original AI Agent** | NEBULA — Autonomous Space Anomaly Investigator | Fully implemented scientific agent investigating astronomical anomalies | Verified |
| **Mandatory Decider 2B Integration** | Meaningful discrete decision by real Strands Decider 2B model | `backend/app/decisions/tool_selection.py` implementing official `strands_decider.schema` | Verified |
| **Typed Decision Question** | Defined typed question with discriminative criteria | `ChoiceQuestion(type='choice', instructions=..., criteria={...})` | Verified |
| **Fixed Validated Choices** | 4 allowed choices: `compare_epochs`, `track_motion`, `check_quality`, `request_more_data` | `AllowedToolAction` enum and `TOOL_ACTION_CRITERIA` dictionary | Verified |
| **Investigation State Input** | Includes current state in decision input | Compact markdown state summary passed via `SystemOneRequest.state` | Verified |
| **Action & Confidence from Real Model** | Obtains selected action and pointer-head confidence | Parsed from `ChoiceAnswer.choice` and `ChoiceAnswer.confidence` | Verified |
| **Latency Profiling & Metadata** | Record decision latency and execution metadata | Measured via `time.perf_counter()`, stored in `ToolDecisionResult.latency_ms` | Verified |
| **Honest Fallback Handling** | Never silently replace failed model invocation; handle low-confidence / timeouts | If confidence < 0.65 or timeout/error, `is_real_decider=False` and explicit reason logged | Verified |
| **No Bedrock Role Confusion** | Bedrock must not make tool decision and pretend it came from Decider | Decider 2B exclusively selects tool; Bedrock exclusively synthesizes reports | Verified |

---

## 2. Scientific Tools Implementation

| Tool | Capability | Implementation File | Verification Test |
| :--- | :--- | :--- | :--- |
| **Tool A: `compare_epochs`** | Photometric $\Delta m$, flux ratio $10^{-0.4\Delta m}$, $\sigma$ significance | `backend/app/tools/compare_epochs.py` | `test_compare_epochs_brightening` |
| **Tool B: `track_motion`** | Astrometric displacement $\Delta\theta$, proper motion rate in arcsec/hr, $\sigma_{\text{pos}}$ | `backend/app/tools/track_motion.py` | `test_track_motion_detects_moving_asteroid` |
| **Tool C: `check_quality`** | Bitmasks (0x0004 cosmic ray, 0x0001 saturation), PSF $\chi^2$ morphology | `backend/app/tools/check_quality.py` | `test_check_quality_detects_cosmic_ray` |
| **Tool D: `request_more_data`** | Cadence gap analysis, observational requirements, loop ceiling limit | `backend/app/tools/request_more_data.py` | `test_request_more_data_loop_prevention` |
| **Loop Prevention** | Maximum investigation step ceiling | Configurable `max_steps` (default 4) prevents infinite execution | `test_agent_max_steps_loop_prevention` |
| **Synthetic Data Labeling** | Deterministic catalog clearly labeled as synthetic | All 5 catalog targets (`SN-2026-X1`, `AST-2026-NEO`, etc.) labeled `is_synthetic: true` | Verified |

---

## 3. Amazon Bedrock Integration

| Requirement | Implementation Detail | File Location | Status |
| :--- | :--- | :--- | :---: |
| **Official AWS SDK** | Boto3 Converse API (`bedrock-runtime`) | `backend/app/services/bedrock_service.py` | Verified |
| **Environment Configuration** | Configured via `AWS_REGION` and `BEDROCK_MODEL_ID` | Reads environment variables with Claude 3.5 Sonnet / Nova defaults | Verified |
| **No Hardcoded Keys** | Uses AWS credential provider chain / IAM roles | Zero AWS keys in code; uses `boto3.Session()` provider chain | Verified |
| **Structured Output Format** | Strictly separates Facts, Interpretations, Unknowns, and Evidence Citations | `ScientificReport` Pydantic model and markdown sections | Verified |
| **Development Fallback Mode** | Visibly distinguishes development mode from live Bedrock | `runtime_mode: "development_mode"` clearly displayed in UI pill & report badge | Verified |

---

## 4. Premium User Interface (Next.js 14 + Tailwind CSS)

| UI Component | Capability | File Location | Status |
| :--- | :--- | :--- | :---: |
| **Observatory Theme** | Deep navy background, cyan/violet accents, clean typography, scientific grid | `frontend/app/globals.css` | Verified |
| **Navigation Sidebar** | Overview, New Investigation, History, Decision Lab, Benchmark, Settings | `frontend/components/Sidebar.tsx` | Verified |
| **Header Status Bar** | Decider 2B and Bedrock health status pills, runtime mode indicator, live UTC clock | `frontend/components/Header.tsx` | Verified |
| **Interactive Charts** | Multi-epoch photometric light curve and coordinate scatter plots via Recharts | `frontend/components/LightCurveChart.tsx` | Verified |
| **Decider 2B Decision Cards** | Displays typed question, candidate probabilities bar, confidence %, latency ms | `frontend/components/DecisionTimeline.tsx` | Verified |
| **Scientific Report Card** | Executive summary, hypothesis classification, facts, interpretations, citations | `frontend/components/ScientificReportCard.tsx` | Verified |
| **Decision Lab View** | Interactive playground to test custom state inputs and view pointer head distribution | `frontend/components/DecisionLabView.tsx` | Verified |
| **Benchmark Suite View** | Head-to-head comparison table (Decider 2B vs Bedrock LLM baseline) | `frontend/components/BenchmarkView.tsx` | Verified |

---

## 5. Standalone Decision Recipe & Community Deliverables

| Deliverable | Description | File Location | Status |
| :--- | :--- | :--- | :---: |
| **Standalone Recipe Folder** | Reusable decision module for any agent system | `decision-recipes/tool-selection/` | Verified |
| **Recipe Documentation** | Comprehensive problem guide, schemas, criteria, and execution instructions | `decision-recipes/tool-selection/README.md` | Verified |
| **Runnable Example Script** | Standalone Python script with typed schema and fallback logic | `decision-recipes/tool-selection/example.py` | Verified |
| **Recipe Pytest Suite** | 4 automated tests verifying schema, mock responses, and confidence thresholds | `decision-recipes/tool-selection/tests/test_recipe.py` | Verified (4/4 Passed) |
| **Required Tags** | `#strands-decider-2b` and `#tool-selection` included in docs & submission | Included in `docs/builder-center-article.md` & `README.md` | Verified |
| **Builder Center Article** | Ready-to-publish technical narrative article | `docs/builder-center-article.md` | Verified |
| **Video Demo Script** | Timed 2:45 video script matching exact hackathon structure | `docs/demo-script.md` | Verified |

---

## 6. Infrastructure & Quality Assurance

| Component | Description | File Location | Status |
| :--- | :--- | :--- | :---: |
| **Backend Container** | Multi-stage Python 3.12/3.14 container running unprivileged user | `Dockerfile` | Verified |
| **Frontend Container** | Next.js production runner container | `frontend/Dockerfile` | Verified |
| **Docker Compose** | Full multi-service orchestration (Backend 8000 + Frontend 3000) | `docker-compose.yml` | Verified |
| **AWS App Runner Config** | Managed serverless container service specification | `infra/apprunner.yaml` | Verified |
| **AWS ECS Task Definition** | Fargate task definition with logging and environment bindings | `infra/ecs-fargate-task-definition.json` | Verified |
| **Least-Privilege IAM Policy** | Confined strictly to `bedrock:InvokeModel` and CloudWatch logs | `infra/iam-policy.json` | Verified |
| **Automated Pytest Suite** | 23 comprehensive tests covering agent, API, tools, and decisions | `backend/tests/` | Verified (22 Passed, 1 Skipped) |
| **GitHub Actions CI** | Automated linting, pytest execution, and Next.js production build | `.github/workflows/ci.yml` | Verified |
