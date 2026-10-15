# Reusable Decision Recipe: Strands Decider 2B Tool Selection

> **AWS Strands Decider 2B Agent Experience Hackathon 2026**  
> Tags: `#strands-decider-2b` `#tool-selection`

A standalone, production-ready recipe for integrating **Strands Decider 2B** into any agentic application to perform ultra-fast, calibrated, discrete tool routing without autoregressive token generation.

---

## 1. The Problem This Decision Pattern Solves

Modern agentic architectures typically use frontier Large Language Models (LLMs) like Claude 3.5 Sonnet or GPT-4o for every decision in the agent loop:
- Deciding which tool to execute next
- Deciding whether arguments are complete
- Deciding whether to terminate or continue

This introduces major bottlenecks:
1. **High Latency:** Every LLM tool call incurs 400–1,500ms of autoregressive generation time, compounding over multi-step workflows.
2. **High Cost:** Sending large system prompts and conversation history to frontier LLMs for routine tool routing quickly exhausts token budgets.
3. **Hallucination & Invalid Choices:** LLMs generate free-form text. Even with JSON schemas, they occasionally invent nonexistent tool names, misspell flags, or generate invalid arguments.
4. **Uncalibrated Confidence:** Frontier LLM APIs do not expose calibrated log-probability confidence scores for tool selection.

### The Solution: System-One Discrete Decision Routing
**Strands Decider 2B** is a specialized 2-billion parameter "system-one" model developed by Strands Labs (built on a Qwen base torso with a pointer head). Instead of generating tokens sequentially, it evaluates candidate choices in a **single forward pass** (~20–120ms):
- Guaranteed to pick only from predefined candidate choices.
- Outputs an exact calibrated probability distribution and confidence score.
- Drastically reduces agent loop latency and API costs.

---

## 2. Typed Questions & Allowed Action Set

In Strands Decider, choices are represented via `ChoiceQuestion` matching the official schema:

```python
from strands_decider.schema import ChoiceQuestion, SystemOneRequest

question = ChoiceQuestion(
    type="choice",
    instructions="Select the next analysis tool to execute based on the current state.",
    criteria={
        "compare_epochs": "Compare photometric brightness and flux delta across epochs.",
        "track_motion": "Calculate angular displacement and proper motion from coordinates.",
        "check_quality": "Evaluate sensor quality flags, PSF residuals, and detector noise.",
        "request_more_data": "Request additional observations when data is insufficient.",
    }
)
```

---

## 3. How to Provide the Current State

The agent’s current empirical observations, completed tool outputs, and unresolved questions are passed as the `state` string in `SystemOneRequest`:

```python
state_summary = (
    "INVESTIGATION STEP 2/4. Object: SN-2026-X1. "
    "COMPLETED: compare_epochs demonstrated a +2.86 mag brightening (14x flux increase). "
    "UNRESOLVED: Celestial coordinates have not been checked for proper motion. "
    "Detector quality flags have not been verified."
)

request = SystemOneRequest(
    state=state_summary,
    questions={"tool_selection": question},
    model="StrandsAgents/strands-decider-2B-hobson-v19"
)
```

---

## 4. How to Invoke Strands Decider 2B

Strands Decider exposes a high-performance HTTP endpoint `POST /v1/systemone` (via `strands-decider serve <checkpoint> --port 8000`):

```python
import httpx
from strands_decider.schema import SystemOneResponse, ChoiceAnswer

response = httpx.post("http://localhost:8000/v1/systemone", json=request.model_dump())
data = response.json()
sysone_resp = SystemOneResponse.model_validate(data)
answer: ChoiceAnswer = sysone_resp.answers["tool_selection"]

print(f"Selected: {answer.choice}")
print(f"Calibrated Confidence: {answer.confidence:.3f}")
print(f"Probabilities: {answer.probabilities}")
```

---

## 5. Validating & Executing the Selected Tool

Always validate that the selected choice is within the allowed candidate list before invoking tool dispatch:

```python
ALLOWED_ACTIONS = {"compare_epochs", "track_motion", "check_quality", "request_more_data"}

if answer.choice not in ALLOWED_ACTIONS:
    raise ValueError(f"Unrecognized tool action: {answer.choice}")

# Dispatch execution
tool_executor = TOOL_REGISTRY[answer.choice]
result = tool_executor(context)
```

---

## 6. Integrating into a Strands Agent (Intervention Pattern)

Strands Agents SDK provides an `InterventionHandler` that can intercept tool execution:

```python
from strands import Agent, InterventionHandler
from strands.interventions import Proceed, Deny, Guide

class DeciderToolGate(InterventionHandler):
    def __init__(self, decider_url="http://localhost:8000"):
        self.decider_url = decider_url

    def before_tool_call(self, tool_name: str, tool_args: dict, context: dict):
        # Query Decider 2B to verify if calling this tool is premature or ungrounded
        is_safe = query_decider_noul(self.decider_url, context, tool_name)
        if not is_safe:
            return Guide(feedback="Decider 2B determined that prerequisite quality checks must run first.")
        return Proceed()

agent = Agent(interventions=[DeciderToolGate()])
```

---

## 7. Configuring a Confidence Threshold

Set a safety threshold (e.g. `0.40`). If the model's top choice has confidence below the threshold, engage safe scientific triage rather than executing an ambiguous action:

```python
CONFIDENCE_THRESHOLD = 0.40

if answer.confidence < CONFIDENCE_THRESHOLD:
    logger.warning(f"Confidence {answer.confidence:.3f} below safety threshold {CONFIDENCE_THRESHOLD}")
    return fallback_triage(state)
```

---

## 8. Safe Fallback Handling

When the model server times out, is unreachable, or produces low confidence:
1. **Never** silently fabricate a high-confidence model score.
2. Flag `is_real_decider = False` and `status = 'fallback_...'`.
3. Use safe deterministic triage (e.g. verify quality flags first, or call `request_more_data`).

---

## 9. Minimal Standalone Example

Run `example.py`:
```bash
python example.py
```

---

## 10. Running the Recipe Automated Tests

Run pytest directly on the recipe tests:
```bash
pytest decision-recipes/tool-selection/tests/ -v
```
