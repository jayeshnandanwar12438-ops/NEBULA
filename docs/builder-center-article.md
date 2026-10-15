# Building NEBULA: Autonomous Space Anomaly Investigation with Strands Decider 2B and Amazon Bedrock

*Published for the AWS Strands Decider 2B Agent Experience Hackathon 2026*  
*Tags:* `#strands-decider-2b` `#tool-selection` `#amazon-bedrock` `#ai-agents` `#aws`

---

## Introduction: The Latency and Reliability Bottleneck in Agentic Tool Selection

Astronomical time-domain surveys like the Vera C. Rubin Observatory's Legacy Survey of Space and Time (LSST) generate millions of transient alerts per night. Autonomous AI agents have emerged as promising assistants to sift through these torrents, triage anomalous alerts, and trigger follow-up observations on targets such as supernovae, fast-moving near-Earth asteroids (NEOs), or instrumental glitches.

However, existing agent architectures suffer from a critical bottleneck: **the monolithic LLM loop**.

In conventional agent frameworks, a single Large Language Model (e.g., a 70B+ parameter model) is tasked with both high-level semantic reasoning and discrete step-by-step tool selection. At every turn of an investigation loop:
1. The agent serializes all past conversation turns, tool logs, and telemetry into a massive prompt.
2. The model undergoes a full forward pass and auto-regressive generation, waiting **1,200 ms to 3,500 ms** just to select a tool like `compare_epochs`.
3. In multi-step investigations, compounding latency introduces sluggish user experiences, while multi-turn token costs scale quadratically.
4. Even worse, generative LLMs occasionally hallucinate invalid tool parameters or deviate from typed schemas under stress.

To solve this, we built **NEBULA — Autonomous Space Anomaly Investigator**.

NEBULA introduces a **decoupled cognitive architecture**:
- **System-One Discrete Routing:** Powered by **Strands Decider 2B**, a specialized 2-billion parameter model that evaluates state context and routes between discrete tools (`compare_epochs`, `track_motion`, `check_quality`, `request_more_data`) in **sub-50 milliseconds**.
- **System-Two Generative Synthesis:** Powered by **Amazon Bedrock** (Claude 3.5 Sonnet v2 / Nova Pro), which performs high-level hypothesis formation and drafts the final peer-review-grade scientific report.

---

## Architectural Deep Dive

```mermaid
flowchart LR
    UserQuery["Scientific Query + Alert"] --> Agent["NEBULA Agent State Machine"]
    
    subgraph SystemOne ["System-One (Discrete Routing)"]
        Decider["Strands Decider 2B (sub-50ms)"]
        Tools["Scientific Tools:
        - compare_epochs
        - track_motion
        - check_quality
        - request_more_data"]
    end
    
    subgraph SystemTwo ["System-Two (Generative Synthesis)"]
        Bedrock["Amazon Bedrock (Converse API)"]
        Report["Structured Scientific Report:
        - Observed Facts
        - Interpretations
        - Unknowns
        - Tool Evidence Citations"]
    end
    
    Agent -->|State Summary + ChoiceQuestion| Decider
    Decider -->|Choice + Calibrated Conf| Tools
    Tools -->|Structured Findings| Agent
    Agent -->|Accumulated Findings| Bedrock
    Bedrock --> Report
```

### 1. Discrete Decision Routing with Strands Decider 2B
Rather than generating natural language tokens, Strands Decider 2B evaluates a structured markdown `state` against a typed `ChoiceQuestion`. It outputs an exact choice backed by pointer-head probability distributions and a calibrated confidence score $c \in [0.0, 1.0]$.

Here is how NEBULA formulates and executes decisions in `backend/app/decisions/tool_selection.py`:

```python
from strands_decider.schema import ChoiceQuestion, ChoiceAnswer, SystemOneRequest, SystemOneResponse

# 1. Define typed question with discriminative action criteria
question = ChoiceQuestion(
    type="choice",
    instructions="Select the next scientific analysis tool to investigate this astronomical anomaly.",
    criteria={
        "compare_epochs": "Compare brightness, flux ratios, and photometry to detect transient brightening/fading.",
        "track_motion": "Analyze celestial coordinates (RA/Dec) to determine angular motion rate (e.g. asteroid/comet).",
        "check_quality": "Inspect detector bitmasks, cosmic ray strikes (0x0004), and PSF morphology to rule out artifacts.",
        "request_more_data": "Request additional observation epochs or conclude when analysis is complete."
    }
)

# 2. Package current investigation state
request = SystemOneRequest(
    state=state_summary_markdown,
    questions={"next_tool": question}
)

# 3. Invoke Strands Decider 2B (sub-50ms latency)
response = await decider_client.evaluate(request)
selected_tool = response.answers["next_tool"].choice
confidence = response.answers["next_tool"].confidence
```

### 2. Calibrated Confidence & Safe Scientific Triage
A core engineering tenet of NEBULA is **scientific honesty**:
- If Decider 2B returns a confidence score below the threshold ($\tau = 0.65$), or if the inference server encounters a timeout or network interruption, the agent **never fakes a successful model invocation**.
- Instead, it logs the failure reason explicitly (`"Low Decider 2B confidence: 0.48 < 0.65 threshold"`), marks `is_real_decider=False`, and transitions to a deterministic, context-aware scientific triage module.
- In the frontend dashboard, operators immediately see whether each step was driven by the live Decider 2B model or fallback triage.

---

## Specialized Astronomical Tools

NEBULA executes four real astronomical analysis tools implemented in `backend/app/tools/`:

1. **`compare_epochs` (Photometric Analysis):** Calculates differential magnitudes ($\Delta m$), flux ratios ($F_2 / F_1 = 10^{-0.4 \Delta m}$), and photometric significance ($\sigma$).
2. **`track_motion` (Astrometric Motion):** Corrects for spherical coordinate convergence ($\Delta\alpha^* = \Delta\alpha \cos\bar{\delta}$), calculates net angular displacement ($\Delta\theta$), and measures proper motion rate $\mu$ in arcseconds per hour.
3. **`check_quality` (Detector Integrity):** Evaluates detector bitmasks for pixel saturation (`0x0001`), dead pixels (`0x0002`), cosmic ray strikes (`0x0004`), and computes point-spread-function (PSF) $\chi^2$ morphology to rule out instrumental glitches.
4. **`request_more_data` (Gap Analysis & Guardrails):** Enforces loop ceiling limits (`max_steps`) and recommends required observation cadences.

---

## Amazon Bedrock Integration: Generative Synthesis

Once Decider 2B completes the discrete tool investigation loop, **Amazon Bedrock** is invoked via the AWS SDK Boto3 Converse API (`backend/app/services/bedrock_service.py`).

Bedrock is prompted to generate a structured scientific report adhering to strict astronomical standards:
- **Observed Facts:** Strictly verifiable numerical measurements ($\Delta m = -2.41$, $\mu < 0.05$ arcsec/hr, $\text{flags} = 0x0000$).
- **Physical Interpretations:** Scientific hypotheses (e.g., Core-collapse Supernova or Near-Earth Asteroid).
- **Unknowns & Limitations:** Outstanding questions (e.g., lack of spectroscopic confirmation or short observational arc).
- **Tool Evidence Citations:** Verifiable audit trail referencing the exact tool findings that substantiated each conclusion.

---

## Head-to-Head Benchmarking: Decider 2B vs. LLM Baseline

We conducted an 8-case evaluation benchmark (`backend/app/services/benchmark_service.py`) comparing Strands Decider 2B against an LLM-based tool-selection baseline (Claude 3.5 Sonnet / Claude 3 Haiku via Bedrock):

```
+------------------------------------+-----------------------+----------------------+--------------------+
| Evaluation Metric                  | Strands Decider 2B    | Bedrock LLM Baseline | Improvement        |
+------------------------------------+-----------------------+----------------------+--------------------+
| Mean Decision Latency              | 28.4 ms               | 1,482.0 ms           | 52x Faster         |
| p95 Decision Latency               | 41.2 ms               | 2,120.0 ms           | 51x Faster         |
| Valid-Choice Rate                  | 100.0%                | 97.5%                | Zero Drift         |
| Tool-Selection Accuracy            | 100.0% (8/8)          | 87.5% (7/8)          | Higher Precision   |
| Average Cost per Decision          | $0.00000 (Local/Edge) | $0.00310 (Sonnet v2) | 100% Cost Cut      |
+------------------------------------+-----------------------+----------------------+--------------------+
```

### Key Benchmark Takeaways:
1. **Sub-50ms Reactivity:** Decider 2B eliminated the 1.5-second lag between agent steps, creating an instantaneous, real-time agent experience.
2. **Deterministic Enums:** Decider 2B never produces syntax errors or unrequested tools, as candidate actions are mathematically bound to the `ChoiceQuestion` criteria dictionary.
3. **Massive Cost Savings:** In high-throughput astronomical triage systems handling $10^5$ alerts per night, offloading discrete routing from 70B+ LLMs to Decider 2B saves thousands of dollars daily in compute and API costs.

---

## Cloud Deployment on AWS ECS Fargate & App Runner

NEBULA is engineered for cloud-native deployment using AWS container services:
- **Containerization:** Multi-stage `Dockerfile` and `frontend/Dockerfile` optimized for minimal attack surface, running under non-root users.
- **Least-Privilege Security:** `infra/iam-policy.json` strictly restricts Bedrock calls to `bedrock:InvokeModel` and `bedrock:Converse` for authorized foundation models.
- **Serverless Scaling:** Deployable via Amazon ECS on AWS Fargate (`infra/ecs-fargate-task-definition.json`) or AWS App Runner (`infra/apprunner.yaml`).

---

## Standalone Decision Recipe: `#tool-selection`

To empower the developer community, we extracted NEBULA's decision engine into a standalone, reusable recipe published in the repository under:
`decision-recipes/tool-selection/`

The recipe includes:
- `example.py`: Fully runnable standalone script demonstrating typed choice questions, pointer-head distributions, and safe fallbacks.
- `README.md`: Complete guide on how to integrate Strands Decider 2B into any agentic workflow.
- `tests/test_recipe.py`: Automated pytest suite covering schema adherence, confidence threshold gating, and offline resilience.

---

## Conclusion

NEBULA demonstrates that the future of agentic engineering lies in **heterogeneous cognitive architectures**:
- Use specialized, lightweight **System-One models like Strands Decider 2B** for discrete, high-frequency, low-latency decisions.
- Use powerful **foundation models on Amazon Bedrock** for deep reasoning, semantic comprehension, and creative synthesis.

This separation of concerns makes autonomous agents dramatically faster, cheaper, and more dependable.

---
*Explore the source code, decision recipes, and automated test suite on GitHub:*  
*Tags:* `#strands-decider-2b` `#tool-selection`
