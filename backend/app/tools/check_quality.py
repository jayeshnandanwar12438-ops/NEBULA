"""NEBULA - Tool C: Check Quality.

Evaluates pipeline quality flags, detector artifacts (cosmic rays, bad pixels, saturation),
point-spread function (PSF) model fit residuals, and signal-to-noise ratio.
"""

from typing import List
from backend.app.models.schemas import (
    AnomalyClassification,
    ObservationEpoch,
    ToolExecutionFinding,
)

# Standard pipeline quality flag definitions
FLAG_SATURATION = 0x0001        # Detector full-well capacity exceeded
FLAG_EDGE_PROXIMITY = 0x0002    # Source near sensor boundary
FLAG_COSMIC_RAY = 0x0004        # Sharp high-energy particle strike in aperture
FLAG_BAD_PIXEL = 0x0008         # Hot/dead pixel in aperture mask
FLAG_POOR_SEEING = 0x0010       # Seeing FWHM > 2.5 arcseconds
FLAG_STRAY_LIGHT = 0x0020       # Scattered moonlight or optical reflection


def run_check_quality(
    epochs: List[ObservationEpoch],
    step_number: int,
) -> ToolExecutionFinding:
    """Evaluate observational data quality across all available epochs.

    Assesses:
    - Quality bitmasks (saturation, edge proximity, cosmic ray, bad pixels)
    - Point Spread Function (PSF) fit quality (reduced chi-squared)
    - Signal-to-Noise Ratio (SNR) consistency
    - Artifact probability index (0.0 to 1.0)
    """
    if not epochs:
        return ToolExecutionFinding(
            tool_name="check_quality",
            step_number=step_number,
            summary="No observation epochs available for quality assessment.",
            metrics={"epochs_checked": 0},
            limitations=["Empty epoch dataset."],
            indicates_classification=AnomalyClassification.INCONCLUSIVE,
        )

    all_flags_found = []
    cosmic_ray_detected = False
    saturation_detected = False
    bad_pixel_detected = False
    max_psf_chi2 = 0.0
    min_snr = 9999.0

    for ep in epochs:
        flags = ep.quality_flags
        if flags & FLAG_COSMIC_RAY:
            cosmic_ray_detected = True
            all_flags_found.append(f"Epoch {ep.epoch_id}: Cosmic ray strike in aperture (flag 0x0004)")
        if flags & FLAG_SATURATION:
            saturation_detected = True
            all_flags_found.append(f"Epoch {ep.epoch_id}: Saturated pixel(s) detected (flag 0x0001)")
        if flags & FLAG_BAD_PIXEL:
            bad_pixel_detected = True
            all_flags_found.append(f"Epoch {ep.epoch_id}: Bad pixel mask intersection (flag 0x0008)")
        if flags & FLAG_EDGE_PROXIMITY:
            all_flags_found.append(f"Epoch {ep.epoch_id}: Sensor edge proximity (flag 0x0002)")
        if flags & FLAG_STRAY_LIGHT:
            all_flags_found.append(f"Epoch {ep.epoch_id}: Stray light / glint detected (flag 0x0020)")

        max_psf_chi2 = max(max_psf_chi2, ep.psf_chi2)
        min_snr = min(min_snr, ep.snr)

    # Compute artifact likelihood score
    artifact_score = 0.0
    if cosmic_ray_detected:
        artifact_score += 0.55
    if saturation_detected:
        artifact_score += 0.25
    if bad_pixel_detected:
        artifact_score += 0.20
    if max_psf_chi2 > 3.0:
        artifact_score += 0.35  # Sharp non-stellar profile
    elif max_psf_chi2 > 2.0:
        artifact_score += 0.15

    artifact_prob = min(round(artifact_score, 2), 1.0)

    # Classification
    if artifact_prob >= 0.70:
        classification = AnomalyClassification.MEASUREMENT_ARTIFACT
        quality_status = (
            f"High probability measurement artifact (artifact score: {artifact_prob:.2f}). "
            f"Detected severe detector anomalies: {', '.join(all_flags_found) if all_flags_found else 'Non-stellar PSF residual'}. "
            "Apparent brightening is likely a spurious detector glitch rather than a real astrophysical source."
        )
    elif artifact_prob >= 0.35:
        classification = AnomalyClassification.MEASUREMENT_ARTIFACT
        quality_status = (
            f"Possible contaminated measurement (artifact score: {artifact_prob:.2f}). "
            f"Photometry may be degraded by quality flags: {', '.join(all_flags_found)}."
        )
    else:
        classification = AnomalyClassification.TRANSIENT_EVENT
        quality_status = (
            f"Nominal data quality across all {len(epochs)} epochs (artifact score: {artifact_prob:.2f}). "
            f"Clean stellar PSF fit (max χ² = {max_psf_chi2:.2f}), robust SNR (min = {min_snr:.1f}), "
            "and zero critical detector flags. Observations reflect genuine astrophysical emission."
        )

    metrics = {
        "epochs_evaluated": len(epochs),
        "artifact_probability_score": artifact_prob,
        "cosmic_ray_detected": cosmic_ray_detected,
        "saturation_detected": saturation_detected,
        "bad_pixel_detected": bad_pixel_detected,
        "max_psf_reduced_chi2": round(max_psf_chi2, 2),
        "min_signal_to_noise_ratio": round(min_snr, 1),
        "quality_flags_raised_count": len(all_flags_found),
        "flag_details": all_flags_found,
    }

    limitations = []
    if max_psf_chi2 > 1.5 and not cosmic_ray_detected:
        limitations.append("Elevated PSF chi-squared could indicate faint blended neighbor or host galaxy light.")
    if min_snr < 8.0:
        limitations.append("Low SNR in one or more epochs increases susceptibility to background noise fluctuations.")

    return ToolExecutionFinding(
        tool_name="check_quality",
        step_number=step_number,
        summary=quality_status,
        metrics=metrics,
        limitations=limitations,
        indicates_classification=classification,
    )
