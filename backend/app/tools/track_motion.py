"""NEBULA - Tool B: Track Motion.

Analyzes astronomical object coordinates across epochs to compute angular displacement
and apparent motion rates, distinguishing stationary celestial sources from moving solar
system bodies (asteroids, NEOs, comets).
"""

import math
from typing import List
from backend.app.models.schemas import (
    AnomalyClassification,
    ObservationEpoch,
    ToolExecutionFinding,
)


def run_track_motion(
    epochs: List[ObservationEpoch],
    step_number: int,
) -> ToolExecutionFinding:
    """Analyze celestial coordinate shifts across observation epochs.

    Calculates:
    - Right Ascension shift: delta_ra_star = (ra2 - ra1) * cos(mean_dec) in arcsec
    - Declination shift: delta_dec = (dec2 - dec1) in arcsec
    - Total angular displacement: sqrt(delta_ra_star^2 + delta_dec^2) in arcsec
    - Time elapsed: dt in hours
    - Apparent motion rate: mu = displacement / dt (arcsec/hour)
    - Astrometric uncertainty: sqrt(pos_err1^2 + pos_err2^2)
    - Motion significance: displacement / sigma_pos
    """
    if len(epochs) < 2:
        return ToolExecutionFinding(
            tool_name="track_motion",
            step_number=step_number,
            summary="Cannot track motion with fewer than 2 epochs. Insufficient coordinate baseline.",
            metrics={"epochs_available": len(epochs)},
            limitations=["At least two observations separated in time are required to compute proper motion."],
            indicates_classification=AnomalyClassification.INCONCLUSIVE,
        )

    sorted_epochs = sorted(epochs, key=lambda e: e.timestamp)
    ep1 = sorted_epochs[0]
    ep2 = sorted_epochs[-1]

    # Time interval
    dt_sec = (ep2.timestamp - ep1.timestamp).total_seconds()
    dt_hours = dt_sec / 3600.0

    if dt_sec <= 0:
        return ToolExecutionFinding(
            tool_name="track_motion",
            step_number=step_number,
            summary="Zero or negative elapsed time between epochs. Cannot derive motion vector.",
            metrics={"elapsed_seconds": dt_sec},
            limitations=["Identical timestamps prevent velocity calculation."],
            indicates_classification=AnomalyClassification.INCONCLUSIVE,
        )

    # Celestial coordinate calculations
    mean_dec_rad = math.radians((ep1.dec_deg + ep2.dec_deg) / 2.0)
    delta_ra_deg = ep2.ra_deg - ep1.ra_deg
    # Handle wrap-around at 360 degrees if necessary
    if delta_ra_deg > 180.0:
        delta_ra_deg -= 360.0
    elif delta_ra_deg < -180.0:
        delta_ra_deg += 360.0

    delta_ra_arcsec = delta_ra_deg * math.cos(mean_dec_rad) * 3600.0
    delta_dec_arcsec = (ep2.dec_deg - ep1.dec_deg) * 3600.0
    total_displacement_arcsec = math.hypot(delta_ra_arcsec, delta_dec_arcsec)

    # Astrometric uncertainty propagation
    combined_pos_err = math.sqrt(ep1.position_err_arcsec**2 + ep2.position_err_arcsec**2)
    motion_sigmas = total_displacement_arcsec / combined_pos_err if combined_pos_err > 0 else 0.0

    # Motion rate in arcseconds per hour
    motion_rate_arcsec_per_hr = total_displacement_arcsec / dt_hours if dt_hours > 0 else 0.0

    # Scientific interpretation
    # Typical main-belt asteroid: ~10 - 40 arcsec/hr
    # Near-Earth Object (NEO): > 30 arcsec/hr
    # Stationary / stellar parallax / proper motion: < 0.1 arcsec over hours
    if motion_sigmas >= 5.0 and total_displacement_arcsec > 0.5:
        classification = AnomalyClassification.MOVING_OBJECT
        motion_status = (
            f"Significant motion detected ({total_displacement_arcsec:.2f} arcsec displacement at "
            f"{motion_sigmas:.1f}-sigma). Apparent speed {motion_rate_arcsec_per_hr:.2f} arcsec/hr is "
            "consistent with a moving solar system object."
        )
    elif motion_sigmas >= 3.0 and total_displacement_arcsec > 0.3:
        classification = AnomalyClassification.MOVING_OBJECT
        motion_status = (
            f"Marginal motion detected ({total_displacement_arcsec:.2f} arcsec displacement at "
            f"{motion_sigmas:.1f}-sigma). Possible slow-moving body or asteroid."
        )
    else:
        classification = AnomalyClassification.TRANSIENT_EVENT
        motion_status = (
            f"No statistically significant motion detected (displacement {total_displacement_arcsec:.3f} arcsec "
            f"within astrometric error {combined_pos_err:.3f} arcsec, {motion_sigmas:.1f}-sigma). "
            "Object is stationary, consistent with a galactic or extragalactic fixed source."
        )

    metrics = {
        "epoch_1_ra_deg": round(ep1.ra_deg, 6),
        "epoch_1_dec_deg": round(ep1.dec_deg, 6),
        "epoch_2_ra_deg": round(ep2.ra_deg, 6),
        "epoch_2_dec_deg": round(ep2.dec_deg, 6),
        "delta_ra_cosdec_arcsec": round(delta_ra_arcsec, 4),
        "delta_dec_arcsec": round(delta_dec_arcsec, 4),
        "total_displacement_arcsec": round(total_displacement_arcsec, 4),
        "elapsed_hours": round(dt_hours, 3),
        "motion_rate_arcsec_per_hr": round(motion_rate_arcsec_per_hr, 3),
        "astrometric_uncertainty_arcsec": round(combined_pos_err, 4),
        "motion_significance_sigma": round(motion_sigmas, 2),
    }

    limitations = []
    if dt_hours < 0.2:
        limitations.append("Short baseline (<12 minutes); slow proper motion may remain below astrometric noise floor.")
    if combined_pos_err > 0.1:
        limitations.append("Moderate astrometric error may obscure tiny sub-arcsecond shifts.")

    return ToolExecutionFinding(
        tool_name="track_motion",
        step_number=step_number,
        summary=motion_status,
        metrics=metrics,
        limitations=limitations,
        indicates_classification=classification,
    )
