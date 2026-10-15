"""NEBULA - Tool D: Request More Data.

Identifies missing observational fields, recommends follow-up telescope observations,
and enforces strict loop prevention with a configurable maximum investigation step ceiling.
"""

from typing import List, Optional
from backend.app.models.schemas import (
    AnomalyClassification,
    ObservationEpoch,
    ToolExecutionFinding,
)


def run_request_more_data(
    epochs: List[ObservationEpoch],
    step_number: int,
    max_steps: int = 4,
    current_findings: Optional[List[ToolExecutionFinding]] = None,
) -> ToolExecutionFinding:
    """Evaluate observational sufficiency and enforce loop termination.

    Checks:
    - Current step count vs max_steps ceiling (prevents infinite tool loops).
    - Presence of multi-epoch photometry and astrometry.
    - Identification of missing observational capabilities (e.g., spectroscopy, multi-band).
    """
    current_findings = current_findings or []
    executed_tools = {f.tool_name for f in current_findings}

    missing_needs = []
    follow_up_recommendations = []

    # Check temporal baseline
    if len(epochs) < 2:
        missing_needs.append("Second observation epoch required (time baseline delta_t >= 2 hours)")
        follow_up_recommendations.append("Trigger automated secondary survey pass or Target-of-Opportunity (ToO) alert.")

    # Check multi-band coverage
    filters_observed = {ep.filter_band for ep in epochs}
    if len(filters_observed) < 2:
        missing_needs.append(f"Multi-band color photometry needed (currently only '{', '.join(filters_observed)}')")
        follow_up_recommendations.append("Obtain complementary optical/IR bands (e.g. g-r or r-i colors) for spectral energy distribution.")

    # Check spectroscopy
    follow_up_recommendations.append("Low-resolution optical spectroscopy (3500-9000 Å) to identify emission/absorption lines and redshift.")

    # Loop prevention check
    reached_max = step_number >= max_steps
    loop_safeguard_triggered = False

    if reached_max:
        loop_safeguard_triggered = True
        summary = (
            f"Maximum investigation depth reached ({step_number}/{max_steps} steps). "
            "Preventing infinite loop. Halting automated tool execution and synthesizing "
            "all gathered observational evidence into the final scientific report."
        )
        classification = AnomalyClassification.INCONCLUSIVE
    elif len(epochs) < 2:
        summary = (
            "Current observational data is insufficient for conclusive classification. "
            f"Missing essential measurements: {'; '.join(missing_needs)}. "
            "Requesting targeted follow-up queue scheduling."
        )
        classification = AnomalyClassification.INCONCLUSIVE
    else:
        summary = (
            f"Investigation step {step_number}/{max_steps}: Evaluated observational completeness. "
            f"Previous analyses: [{', '.join(executed_tools)}]. "
            "Synthesizing gathered evidence for final scientific assessment."
        )
        classification = AnomalyClassification.INCONCLUSIVE

    metrics = {
        "step_number": step_number,
        "max_steps": max_steps,
        "loop_safeguard_triggered": loop_safeguard_triggered,
        "investigation_should_terminate": reached_max or (len(executed_tools) >= 3),
        "epochs_present": len(epochs),
        "filter_bands_present": list(filters_observed),
        "missing_requirements_count": len(missing_needs),
        "missing_requirements": missing_needs,
        "follow_up_recommendations": follow_up_recommendations,
    }

    limitations = [
        f"Automated tool execution ceiling enforced at {max_steps} maximum steps.",
    ]
    if len(epochs) < 2:
        limitations.append("Single-epoch dataset cannot rule out fast transients vs high-motion asteroids.")

    return ToolExecutionFinding(
        tool_name="request_more_data",
        step_number=step_number,
        summary=summary,
        metrics=metrics,
        limitations=limitations,
        indicates_classification=classification,
    )
