"""NEBULA - Observation Service & Astronomical Data Adapter.

Manages cataloged astronomical targets and observation epochs for investigation.
All sample datasets in this module are deterministically generated synthetic benchmarks
explicitly labeled as synthetic to avoid confusing simulated data with real NASA/ESA observations.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from backend.app.models.schemas import (
    AnomalyClassification,
    AstronomicalTarget,
    ObservationEpoch,
)


class ObservationService:
    """Service providing access to synthetic astronomical observations and catalog targets."""

    def __init__(self):
        self._targets: Dict[str, AstronomicalTarget] = {}
        self._initialize_synthetic_catalog()

    def _initialize_synthetic_catalog(self):
        """Build deterministic synthetic anomaly scenarios covering each key astronomical phenomenon."""
        base_time = datetime(2026, 4, 12, 22, 0, 0, tzinfo=timezone.utc)

        # -------------------------------------------------------------------------
        # 1. SN-2026-X1: Optical Supernova Transient (Stationary, Rapid Brightening, Clean PSF)
        # -------------------------------------------------------------------------
        sn_epochs = [
            ObservationEpoch(
                epoch_id="EP-01",
                timestamp=base_time,
                telescope_id="HAWAII-O-0.8m",
                filter_band="r",
                exposure_time_sec=120.0,
                magnitude=19.78,
                magnitude_err=0.045,
                flux_ujy=44.8,
                flux_err_ujy=1.85,
                ra_deg=184.234120,
                dec_deg=12.876540,
                position_err_arcsec=0.028,
                snr=24.2,
                psf_fwhm_arcsec=1.12,
                psf_chi2=1.04,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
            ObservationEpoch(
                epoch_id="EP-02",
                timestamp=base_time + timedelta(hours=21, minutes=45),
                telescope_id="HAWAII-O-0.8m",
                filter_band="r",
                exposure_time_sec=120.0,
                magnitude=16.92,  # Brightened by 2.86 magnitudes (~14x flux)
                magnitude_err=0.021,
                flux_ujy=623.5,
                flux_err_ujy=12.1,
                ra_deg=184.234124,  # Delta < 0.015 arcsec (stationary)
                dec_deg=12.876537,
                position_err_arcsec=0.022,
                snr=51.5,
                psf_fwhm_arcsec=1.08,
                psf_chi2=0.98,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
        ]
        self._targets["SN-2026-X1"] = AstronomicalTarget(
            target_id="SN-2026-X1",
            name="Synthetic Anomaly SN-2026-X1 (Supernova Candidate)",
            description=(
                "Object underwent dramatic +2.86 mag photometric brightening in 21.8 hours. "
                "Stationary astrometry consistent with galactic host center offset."
            ),
            expected_classification=AnomalyClassification.TRANSIENT_EVENT,
            dataset_type="synthetic",
            epochs=sn_epochs,
            discovery_notes="Alert triggered by automated transient alert broker. Clean stellar PSF profile.",
        )

        # -------------------------------------------------------------------------
        # 2. AST-2026-NEO: Near-Earth Asteroid / Fast Mover
        # -------------------------------------------------------------------------
        neo_epochs = [
            ObservationEpoch(
                epoch_id="EP-01",
                timestamp=base_time + timedelta(days=1),
                telescope_id="CHILE-V-1.2m",
                filter_band="g",
                exposure_time_sec=60.0,
                magnitude=18.35,
                magnitude_err=0.038,
                flux_ujy=166.0,
                flux_err_ujy=5.8,
                ra_deg=45.123450,
                dec_deg=-8.456780,
                position_err_arcsec=0.035,
                snr=28.6,
                psf_fwhm_arcsec=1.18,
                psf_chi2=1.09,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
            ObservationEpoch(
                epoch_id="EP-02",
                timestamp=base_time + timedelta(days=1, hours=3, minutes=30),
                telescope_id="CHILE-V-1.2m",
                filter_band="g",
                exposure_time_sec=60.0,
                magnitude=17.72,  # Brightened slightly due to phase angle
                magnitude_err=0.031,
                flux_ujy=296.5,
                flux_err_ujy=8.5,
                # Shifted by ~33.8 arcseconds over 3.5 hours (~9.65 arcsec/hr)
                ra_deg=45.132450,
                dec_deg=-8.449120,
                position_err_arcsec=0.032,
                snr=34.9,
                psf_fwhm_arcsec=1.22,
                psf_chi2=1.14,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
        ]
        self._targets["AST-2026-NEO"] = AstronomicalTarget(
            target_id="AST-2026-NEO",
            name="Synthetic Anomaly AST-2026-NEO (Moving Object Candidate)",
            description=(
                "Source detected with apparent flux increase accompanied by large angular coordinate shift "
                "(33.8 arcseconds in 3.5 hours, rate 9.65\"/hr)."
            ),
            expected_classification=AnomalyClassification.MOVING_OBJECT,
            dataset_type="synthetic",
            epochs=neo_epochs,
            discovery_notes="Astrometric motion is >30-sigma above positional error floor. Matches Apollo-family NEO orbital plane.",
        )

        # -------------------------------------------------------------------------
        # 3. ART-2026-GLITCH: Cosmic Ray Hit / Detector Glitch
        # -------------------------------------------------------------------------
        glitch_epochs = [
            ObservationEpoch(
                epoch_id="EP-01",
                timestamp=base_time + timedelta(days=2),
                telescope_id="CANARY-O-2.0m",
                filter_band="i",
                exposure_time_sec=90.0,
                magnitude=20.45,
                magnitude_err=0.082,
                flux_ujy=24.0,
                flux_err_ujy=1.8,
                ra_deg=210.554320,
                dec_deg=35.129870,
                position_err_arcsec=0.045,
                snr=13.3,
                psf_fwhm_arcsec=0.95,
                psf_chi2=1.02,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
            ObservationEpoch(
                epoch_id="EP-02",
                timestamp=base_time + timedelta(days=2, hours=1, minutes=15),
                telescope_id="CANARY-O-2.0m",
                filter_band="i",
                exposure_time_sec=90.0,
                magnitude=16.80,  # Spurious sudden brightening
                magnitude_err=0.019,
                flux_ujy=692.0,
                flux_err_ujy=12.0,
                ra_deg=210.554322,
                dec_deg=35.129869,
                position_err_arcsec=0.025,
                snr=57.6,
                psf_fwhm_arcsec=0.42,  # Sharp sub-seeing profile (cosmic ray pixel cluster)
                psf_chi2=4.85,         # Severe PSF residual
                quality_flags=0x0004,  # FLAG_COSMIC_RAY
                flag_descriptions=["COSMIC_RAY_STRIKE_APERTURE", "NON_STELLAR_PSF_PROFILE"],
            ),
        ]
        self._targets["ART-2026-GLITCH"] = AstronomicalTarget(
            target_id="ART-2026-GLITCH",
            name="Synthetic Anomaly ART-2026-GLITCH (Detector Artifact)",
            description=(
                "Sudden sharp brightening (+3.65 mag) in Epoch 2. Quality pipeline flagged "
                "cosmic ray strike (0x0004) with highly anomalous PSF chi-squared (4.85)."
            ),
            expected_classification=AnomalyClassification.MEASUREMENT_ARTIFACT,
            dataset_type="synthetic",
            epochs=glitch_epochs,
            discovery_notes="Detector artifact: single-frame energetic particle hit mimicking an ultra-fast transient.",
        )

        # -------------------------------------------------------------------------
        # 4. VAR-2026-BLAZAR: Flaring Active Galactic Nucleus / Blazar
        # -------------------------------------------------------------------------
        blazar_epochs = [
            ObservationEpoch(
                epoch_id="EP-01",
                timestamp=base_time + timedelta(days=3),
                telescope_id="ARIZONA-S-1.5m",
                filter_band="r",
                exposure_time_sec=150.0,
                magnitude=16.42,
                magnitude_err=0.015,
                flux_ujy=980.0,
                flux_err_ujy=13.5,
                ra_deg=122.845010,
                dec_deg=40.231980,
                position_err_arcsec=0.018,
                snr=72.0,
                psf_fwhm_arcsec=1.10,
                psf_chi2=1.05,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
            ObservationEpoch(
                epoch_id="EP-02",
                timestamp=base_time + timedelta(days=3, hours=18),
                telescope_id="ARIZONA-S-1.5m",
                filter_band="r",
                exposure_time_sec=150.0,
                magnitude=17.08,
                magnitude_err=0.019,
                flux_ujy=534.0,
                flux_err_ujy=9.3,
                ra_deg=122.845008,
                dec_deg=40.231982,
                position_err_arcsec=0.020,
                snr=57.4,
                psf_fwhm_arcsec=1.14,
                psf_chi2=1.08,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
            ObservationEpoch(
                epoch_id="EP-03",
                timestamp=base_time + timedelta(days=4, hours=12),
                telescope_id="ARIZONA-S-1.5m",
                filter_band="r",
                exposure_time_sec=150.0,
                magnitude=16.15,
                magnitude_err=0.014,
                flux_ujy=1260.0,
                flux_err_ujy=16.2,
                ra_deg=122.845012,
                dec_deg=40.231979,
                position_err_arcsec=0.017,
                snr=77.8,
                psf_fwhm_arcsec=1.06,
                psf_chi2=1.02,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
        ]
        self._targets["VAR-2026-BLAZAR"] = AstronomicalTarget(
            target_id="VAR-2026-BLAZAR",
            name="Synthetic Anomaly VAR-2026-BLAZAR (Variable AGN Candidate)",
            description=(
                "Persistent multi-epoch optical flux oscillations (+0.66 mag to -0.93 mag) "
                "with strictly zero proper motion (<0.012 arcsec)."
            ),
            expected_classification=AnomalyClassification.VARIABLE_SOURCE,
            dataset_type="synthetic",
            epochs=blazar_epochs,
            discovery_notes="Multi-epoch stochastic variability consistent with relativistically beamed AGN jet.",
        )

        # -------------------------------------------------------------------------
        # 5. INCOMPLETE-2026-UNK: Single-Epoch Sparse Detection
        # -------------------------------------------------------------------------
        sparse_epochs = [
            ObservationEpoch(
                epoch_id="EP-01",
                timestamp=base_time + timedelta(days=5),
                telescope_id="SURVEY-O-1.0m",
                filter_band="g",
                exposure_time_sec=45.0,
                magnitude=18.90,
                magnitude_err=0.065,
                flux_ujy=100.0,
                flux_err_ujy=6.0,
                ra_deg=312.456100,
                dec_deg=-15.890120,
                position_err_arcsec=0.060,
                snr=16.6,
                psf_fwhm_arcsec=1.35,
                psf_chi2=1.20,
                quality_flags=0,
                flag_descriptions=["NOMINAL_PIPELINE_QUALITY"],
            ),
        ]
        self._targets["INCOMPLETE-2026-UNK"] = AstronomicalTarget(
            target_id="INCOMPLETE-2026-UNK",
            name="Synthetic Anomaly INCOMPLETE-2026-UNK (Sparse Single-Epoch)",
            description="Single observation epoch detection. Lacks comparative temporal baseline.",
            expected_classification=AnomalyClassification.INCONCLUSIVE,
            dataset_type="synthetic",
            epochs=sparse_epochs,
            discovery_notes="Triggers request_more_data tool to mandate follow-up scheduling.",
        )

    def list_targets(self) -> List[AstronomicalTarget]:
        """Return all cataloged targets."""
        return list(self._targets.values())

    def get_target(self, target_id: str) -> Optional[AstronomicalTarget]:
        """Fetch target by unique identifier."""
        return self._targets.get(target_id)
