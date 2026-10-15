# Discrete Decision Pattern: Strands Decider 2B Tool Selection
## Specialized System-One Routing for Scientific Agents

This document details the discrete decision pattern implemented in **NEBULA** using **Strands Decider 2B** (`backend/app/decisions/tool_selection.py`). It explains the architectural rationale, schema contracts, confidence calibration, and deterministic fallback mechanics.

---

## 1. Why System-One Routing for Tool Selection?

In agentic systems, tool selection is fundamentally a **categorical classification problem under state context**, not a creative text generation problem. 

Standard generative LLMs (e.g., GPT-4, Claude 3.5 Sonnet, Llama-3-70B) are optimized for auto-regressive next-token generation across hundreds of tokens. Using a large generative model for discrete tool dispatch incurs severe penalties:

1. **High Inefficiency:** An agent must wait 1,500 ms to 3,000 ms per step simply to emit `{"name": "track_motion"}`.
2. **Grammar & Schema Drift:** Generative models occasionally generate invalid JSON, hallucinate parameter names, or select tools not present in the catalog.
3. **Quadratic History Bloat:** As multi-step tool findings accumulate in the prompt, token costs and prompt processing latencies skyrocket.

### Strands Decider 2B: The Pointer-Head Architecture
Strands Decider 2B is a 2-billion parameter model pre-trained and fine-tuned specifically for discrete decision-making:
- Instead of generating open-ended tokens, Decider 2B evaluates a structured markdown `state` against a typed `ChoiceQuestion`.
- It scores each candidate action using a **pointer head** over candidate representations, outputting an exact probability distribution over the discrete choices:
  $$P(\text{choice}_i \mid \text{state}, \text{criteria})$$
- The top-probability choice is selected directly with sub-50 ms latency.
- It returns a calibrated confidence score $c \in [0.0, 1.0]$ representing model certainty in the selected action.

---

## 2. Official Schema Contracts (`strands_decider.schema`)

NEBULA implements the official Strands Decider 2B schema contracts:

```python
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class ChoiceQuestion(BaseModel):
    type: str = "choice"
    instructions: str
    criteria: Dict[str, str]

class ChoiceAnswer(BaseModel):
    type: str = "choice"
    choice: str
    probabilities: Optional[Dict[str, float]] = None
    confidence: Optional[float] = None

class SystemOneRequest(BaseModel):
    state: str
    questions: Dict[str, ChoiceQuestion]

class SystemOneResponse(BaseModel):
    model: str
    answers: Dict[str, ChoiceAnswer]
    usage: Optional[Dict[str, Any]] = None
```

### Allowed Decision Enum & Discriminative Criteria
The decision module defines four strictly validated actions:

```python
class AllowedToolAction(str, Enum):
    COMPARE_EPOCHS = "compare_epochs"
    TRACK_MOTION = "track_motion"
    CHECK_QUALITY = "check_quality"
    REQUEST_MORE_DATA = "request_more_data"

TOOL_ACTION_CRITERIA: Dict[str, str] = {
    AllowedToolAction.COMPARE_EPOCHS.value: (
        "Compare brightness, flux ratios, and photometric measurements across observation epochs "
        "to determine if the object is transiently brightening, fading, or stable."
    ),
    AllowedToolAction.TRACK_MOTION.value: (
        "Analyze celestial coordinates (RA/Dec) across epochs to determine whether the object "
        "displays measurable angular motion (e.g. asteroid, comet, or fast-moving solar system body)."
    ),
    AllowedToolAction.CHECK_QUALITY.value: (
        "Inspect detector quality bitmasks, cosmic ray hits, pixel saturation, and PSF morphology "
        "to rule out false-positive instrumental artifacts or atmospheric glitches."
    ),
    AllowedToolAction.REQUEST_MORE_DATA.value: (
        "Request additional observation epochs or conclude that current data is insufficient, "
        "or terminate when all necessary analyses are complete."
    ),
}
```

---

## 3. Input State Formulation

To guarantee consistent decisions, the agent summarizes current observation metadata and previously executed tools into a compact markdown state block:

```markdown
# Current Investigation State
- Target ID: AST-2026-NEO
- Classification Hypothesis: Moving near-earth asteroid or fast-moving transient
- Available Epochs: 3 (Cadence: 45.0 min)
- Executed Tools: ['check_quality']
- Latest Tool Findings: Detector quality clear. 0 artifact flags. PSF chi-square=1.02.
- User Inquiry: "High proper motion object detected near ecliptic plane. Track trajectory."
```

This compact format consumes less than 200 tokens, enabling Decider 2B to evaluate the decision in a single forward pass without token generation overhead.

---

## 4. Confidence Thresholding & Safe Scientific Triage

A critical requirement of the hackathon is:
> *Never silently replace a failed model invocation with a hardcoded successful decision.*
> *Record decision latency and relevant metadata. Handle unavailable models, invalid results, timeouts, and low-confidence outputs.*

### Calibrated Threshold ($\tau = 0.65$)
If Decider 2B returns a decision with confidence below $\tau = 0.65$, or if the server encounters a timeout ($> 1.5$ s), connection error, or invalid choice output:
1. `is_real_decider` is strictly set to `False`.
2. `fallback_reason` is explicitly logged (e.g., `"Low Decider 2B confidence: 0.48 < 0.65 threshold"` or `"Decider 2B endpoint offline"`).
3. The system executes a **Context-Aware Safe Scientific Triage** fallback:
   - Evaluates the user query keywords (`motion`, `asteroid`, `quality`, `glitch`, `supernova`, `variability`).
   - Checks which tools have **already been executed** (`executed_tools`) to avoid repeated cycles.
   - If missing critical telemetry (e.g. only 1 epoch available), selects `request_more_data`.
   - If all relevant tools have run, selects `request_more_data` with termination signal.

This ensures that the agent never pretends a real model ran when it did not, while preserving mission continuity in edge or offline environments.

---

## 5. Decision Lab: Real-Time Interactive Testing

NEBULA provides an interactive **Decision Lab** (`/decision-lab` in the frontend):
- Operators can input custom astronomical state summaries.
- Add or modify candidate tool criteria.
- Adjust the confidence threshold slider in real time.
- Inspect the exact pointer-head probability distribution returned by Decider 2B.
- View exact latency measurements in milliseconds.

This facilitates rapid iteration and verification of decision policies without running full multi-step agent investigations.
