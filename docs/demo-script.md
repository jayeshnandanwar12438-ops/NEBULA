# NEBULA Video Demonstration Script
## Duration: Exactly 2 Minutes, 45 Seconds (165 Seconds)

This script is engineered for recording the official hackathon demonstration video for **NEBULA — Autonomous Space Anomaly Investigator**.

---

### [0:00 – 0:20] Segment 1: The Problem & Architectural Challenge (20s)

**Visual:**
Open on the NEBULA Observatory Dashboard (`http://localhost:3000`). Deep navy theme, pulsing status indicators showing `Strands Decider 2B: ONLINE` and `Amazon Bedrock: READY`. Camera zooms slightly into the header.

**Spoken Voiceover:**
> *"Astronomical sky surveys like Vera Rubin detect millions of transient alerts every night. Traditional AI agents attempting to investigate these anomalies face a fatal bottleneck: relying on large, monolithic LLMs for every intermediate tool decision introduces multi-second latency, nondeterministic tool calls, and runaway token costs.*
>
> *Meet **NEBULA** — an autonomous space anomaly investigator powered by a decoupled cognitive architecture: pairing **Strands Decider 2B** for sub-50 ms discrete tool decisions with **Amazon Bedrock** for deep generative synthesis."*

---

### [0:20 – 0:50] Segment 2: Submitting an Investigation (30s)

**Visual:**
Click **"New Investigation"**. The interface displays the deterministic synthetic catalog. Select **`AST-2026-NEO`** (or click the example prompt: *"High proper motion object detected near ecliptic plane. Track trajectory and check whether stationary or moving asteroid."*). Show the interactive **Light Curve & Astrometry Plot** rendering multi-epoch coordinates and flux measurements. Click **"Launch Investigation"**.

**Spoken Voiceover:**
> *"Let's launch an investigation on target `AST-2026-NEO`. Our science query asks the agent to determine if this brightening object is a stationary transient, a detector artifact, or a near-Earth asteroid.*
>
> *Notice our catalog explicitly labels these as deterministic synthetic calibration targets. As we click 'Launch Investigation', NEBULA constructs a structured markdown summary of the astronomical telemetry and dispatches a typed `ChoiceQuestion` directly to Strands Decider 2B."*

---

### [0:50 – 1:30] Segment 3: The Strands Decider 2B Decision Loop (40s)

**Visual:**
The **Agent Execution Timeline** streams decisions in real time.
- **Decision 1 Card:** Expand to reveal:
  - Typed Question: *"What scientific analysis tool should be executed next...?"*
  - Candidate Actions: `compare_epochs`, `track_motion`, `check_quality`, `request_more_data`.
  - Selected Action: `track_motion`
  - Real Model Confidence: `94.2%`
  - Measured Latency: `28 ms`
  - Probability Bar Graph: Shows pointer-head distribution across the four choices.
- **Tool Result:** Astrometric motion calculated: `proper_motion = 18.9 arcsec/hr`, angular shift `14.2 arcsec`, significance `18.5 sigma`.
- **Decision 2 Card:** Decider 2B selects `check_quality` with `91.0%` confidence in `24 ms`. Tool verifies detector flags are clear (0 artifacts, PSF $\chi^2 = 1.02$).
- **Decision 3 Card:** Decider 2B selects `request_more_data` with `can_continue=False` (analysis complete).

**Spoken Voiceover:**
> *"Watch the decision timeline. For Decision 1, Decider 2B evaluates the state and selects `track_motion` in just 28 milliseconds with 94.2% confidence! The actual pointer-head probability distribution is displayed directly on the card.*
>
> *Our astrometry tool executes immediately, calculating an angular displacement of 14.2 arcseconds at 18.9 arcseconds per hour—an 18.5-sigma moving object!*
>
> *Next, Decider 2B autonomously selects `check_quality` in 24 milliseconds, ruling out cosmic ray strikes and sensor glitches. Once conclusive evidence is gathered, it chooses `request_more_data` to gracefully terminate the loop."*

---

### [1:30 – 2:00] Segment 4: Amazon Bedrock Final Scientific Report (30s)

**Visual:**
Scroll down smoothly to the **Scientific Report Card**. Highlight the badges: `HIGH CONFIDENCE`, `Classification: MOVING_ASTEROID`.
Highlight the four distinct tabs/sections:
1. **Observed Facts:** Quantitative $\Delta\theta$, $\mu$, flux stability.
2. **Physical Interpretations:** Fast-moving minor planet / Near-Earth Object.
3. **Unknowns & Limitations:** Orbital arc requires longer baseline.
4. **Tool Evidence Citations:** Direct JSON links to Tool 1 and Tool 2 findings.

**Spoken Voiceover:**
> *"Now Amazon Bedrock takes over the generative role. Using Claude 3.5 Sonnet through the AWS Converse API, it synthesizes a rigorous scientific report.*
>
> *Crucially, notice how the report strictly separates observed numerical facts from physical interpretations and remaining unknowns—avoiding scientific hallucination. Every hypothesis is directly backed by structured evidence citations from our Decider 2B tool executions."*

---

### [2:00 – 2:30] Segment 5: Standalone Decision Recipe & Benchmark Suite (30s)

**Visual:**
1. Navigate to **"Decision Lab"** (`/decision-lab`). Show the interactive test bench where users can modify state summaries, adjust confidence thresholds, and test Decider 2B choices.
2. Navigate to **"Benchmark"** (`/benchmark`). Show the head-to-head comparison table:
   - Decider 2B: `28.4 ms` mean latency, `100%` valid-choice rate, `100%` accuracy, `~$0.00` per decision.
   - Bedrock LLM Baseline: `1,482 ms` latency, `87.5%` accuracy, `~$0.0031` per decision.
   - Point to the published recipe in `decision-recipes/tool-selection/`.

**Spoken Voiceover:**
> *"To ensure reproducibility, we packaged this decision module into a standalone recipe under `decision-recipes/tool-selection/`, complete with schemas and automated tests.*
>
> *On our Benchmark page, we evaluated 8 labeled astronomical test cases comparing Decider 2B to an LLM baseline. Decider 2B is over 50 times faster—28 milliseconds versus 1.48 seconds—with 100% valid choice adherence and zero per-token cost."*

---

### [2:30 – 2:45] Segment 6: Conclusion & AWS Cloud Architecture (15s)

**Visual:**
Show the architecture diagram and the containerized deployment running with Docker and AWS Fargate task definitions. Show GitHub repository with 26 passing automated tests. Fade out with NEBULA title card.

**Spoken Voiceover:**
> *"Containerized with Docker, deployed on AWS Fargate with least-privilege IAM roles, and validated by 26 automated tests, NEBULA proves that combining specialized System-One decision models with Amazon Bedrock is the future of resilient, high-speed autonomous agents.*
>
> *Thank you!"*
