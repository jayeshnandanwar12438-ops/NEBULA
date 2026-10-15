"""NEBULA - Tool A: Compare Epochs.

Compares observational measurements (brightness, flux, magnitude, and uncertainties)
across observation times to quantify photometric variability or sudden transient brightening.
"""

import math
from typing import List
from backend.app.models.schemas import (
    AnomalyClassification,
    ObservationEpoch,
    ToolExecutionFinding,
)


def run_compare_epochs(
    epochs: List[ObservationEpoch],
    step_number: int,
) -> ToolExecutionFinding:
    """Compare photometric properties across observation epochs.

    Calculates:
    - Delta magnitude: m2 - m1
    - Flux ratio: F2 / F1
    - Percentage flux change: ((F2 - F1) / F1) * 100
    - Combined photometric uncertainty: sqrt(err1^2 + err2^2)
    - Statistical significance in sigmas: |delta_m| / sigma_combined
    """
    if len(epochs) < 2:
        return ToolExecutionFinding(
            tool_name="compare_epochs",
            step_number=step_number,
            summary="Insufficient epochs for photometric comparison (minimum 2 required; found 1).",
            metrics={"epochs_available": len(epochs)},
            limitations=["Only a single observation epoch is available; baseline flux cannot be determined."],
            indicates_classification=AnomalyClassification.INCONCLUSIVE,
        )

    # Sort epochs by timestamp
    sorted_epochs = sorted(epochs, key=lambda e: e.timestamp)
    ep1 = sorted_epochs[0]
    ep2 = sorted_epochs[-1]

    # Magnitude differences (in astronomy, smaller mag = brighter)
    delta_mag = ep2.magnitude - ep1.magnitude  # Negative if brighter in ep2
    combined_mag_err = math.sqrt(ep1.magnitude_err**2 + ep2.magnitude_err**2)
    sigmas = abs(delta_mag) / combined_mag_err if combined_mag_err > 0 else 0.0

    # Flux differences
    delta_flux_ujy = ep2.flux_ujy - ep1.flux_ujy
    flux_ratio = ep2.flux_ujy / ep1.flux_ujy if ep1.flux_ujy > 0 else 1.0
    pct_flux_change = ((ep2.flux_ujy - ep1.flux_ujy) / ep1.flux_ujy * 100.0) if ep1.flux_ujy > 0 else 0.0

    # Time elapsed
    dt_hours = (ep2.timestamp - ep1.timestamp).total_seconds() / 3600.0

    # Photometric classification
    if delta_mag < -1.5 and sigmas >= 5.0:
        event_type = "Significant rapid brightening (>5-sigma detection)"
        classification = AnomalyClassification.TRANSIENT_EVENT
    elif delta_mag < -0.4 and sigmas >= 3.0:
        event_type = "Moderate brightening (3-5 sigma detection)"
        classification = AnomalyClassification.TRANSIENT_EVENT
    elif delta_mag > 1.0 and sigmas >= 3.0:
        event_type = "Significant fading event"
        classification = AnomalyClassification.VARIABLE_SOURCE
    elif sigmas < 2.0:
        event_type = "Photometrically quiescent / consistent with baseline within noise"
        classification = AnomalyClassification.INCONCLUSIVE
    else:
        event_type = "Low-amplitude flux variation"
        classification = AnomalyClassification.VARIABLE_SOURCE

    metrics = {
        "epoch_1_id": ep1.epoch_id,
        "epoch_2_id": ep2.epoch_id,
        "elapsed_hours": round(dt_hours, 2),
        "initial_magnitude": round(ep1.magnitude, 3),
        "final_magnitude": round(ep2.magnitude, 3),
        "delta_magnitude": round(delta_mag, 3),
        "combined_magnitude_err": round(combined_mag_err, 4),
        "significance_sigma": round(sigmas, 2),
        "initial_flux_ujy": round(ep1.flux_ujy, 2),
        "final_flux_ujy": round(ep2.flux_ujy, 2),
        "delta_flux_ujy": round(delta_flux_ujy, 2),
        "flux_ratio": round(flux_ratio, 2),
        "flux_pct_change": round(pct_flux_change, 1),
        "filter_bands": f"{ep1.filter_band} -> {ep2.filter_band}",
    }

    summary = (
        f"Epoch comparison ({ep1.epoch_id} to {ep2.epoch_id}, delta_t = {dt_hours:.1f}h): "
        f"Observed delta_mag = {delta_mag:+.2f} mag ({sigmas:.1f}-sigma significance). "
        f"Flux changed by {pct_flux_change:+.1f}% (ratio {flux_ratio:.2f}x). "
        f"Result: {event_type}."
    )

    limitations = []
    if ep1.filter_band != ep2.filter_band:
        limitations.append(
            f"Cross-band comparison ({ep1.filter_band} vs {ep2.filter_band}): "
            "color terms may account for a fraction of observed magnitude difference."
        )
    if dt_hours < 0.1:
        limitations.append("Time interval between epochs is very short; limits cadence sensitivity.")
    if combined_mag_err > 0.15:
        limitations.append("High photometric uncertainty increases margin of error on flux ratio.")

    return ToolExecutionFinding(
        tool_name="compare_epochs",
        step_number=step_number,
        summary=summary,
        metrics=metrics,
        limitations=limitations,
        indicates_classification=classification,
    )
