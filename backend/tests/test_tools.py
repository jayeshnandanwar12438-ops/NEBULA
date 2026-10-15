"""Unit tests for the four astronomical investigation tools."""

from datetime import datetime, timedelta, timezone
import pytest

from backend.app.models.schemas import (
    AnomalyClassification,
    ObservationEpoch,
)
from backend.app.tools.check_quality import run_check_quality
from backend.app.tools.compare_epochs import run_compare_epochs
from backend.app.tools.request_more_data import run_request_more_data
from backend.app.tools.track_motion import run_track_motion


@pytest.fixture
def base_time():
    return datetime(2026, 5, 1, 0, 0, 0, tzinfo=timezone.utc)


def test_compare_epochs_brightening(base_time):
    """Verify photometric comparison on significant brightening event."""
    ep1 = ObservationEpoch(
        epoch_id="EP-01",
        timestamp=base_time,
        telescope_id="TEST-T1",
        filter_band="r",
        exposure_time_sec=60.0,
        magnitude=19.50,
        magnitude_err=0.03,
        flux_ujy=50.0,
        flux_err_ujy=1.5,
        ra_deg=100.0,
        dec_deg=20.0,
        position_err_arcsec=0.02,
        snr=25.0,
        psf_fwhm_arcsec=1.1,
        psf_chi2=1.01,
        quality_flags=0,
    )
    ep2 = ObservationEpoch(
        epoch_id="EP-02",
        timestamp=base_time + timedelta(hours=10),
        telescope_id="TEST-T1",
        filter_band="r",
        exposure_time_sec=60.0,
        magnitude=16.70,  # delta_mag = -2.80
        magnitude_err=0.02,
        flux_ujy=660.0,
        flux_err_ujy=10.0,
        ra_deg=100.0,
        dec_deg=20.0,
        position_err_arcsec=0.02,
        snr=60.0,
        psf_fwhm_arcsec=1.1,
        psf_chi2=0.99,
        quality_flags=0,
    )

    finding = run_compare_epochs([ep1, ep2], step_number=1)
    assert finding.tool_name == "compare_epochs"
    assert finding.metrics["delta_magnitude"] == -2.8
    assert finding.metrics["significance_sigma"] > 20.0
    assert finding.indicates_classification == AnomalyClassification.TRANSIENT_EVENT


def test_compare_epochs_single_epoch(base_time):
    """Compare epochs handles single-epoch gracefully without crashing."""
    ep = ObservationEpoch(
        epoch_id="EP-01",
        timestamp=base_time,
        telescope_id="TEST-T1",
        filter_band="r",
        exposure_time_sec=60.0,
        magnitude=18.0,
        magnitude_err=0.05,
        flux_ujy=100.0,
        flux_err_ujy=5.0,
        ra_deg=10.0,
        dec_deg=10.0,
        position_err_arcsec=0.03,
        snr=20.0,
        psf_fwhm_arcsec=1.2,
        psf_chi2=1.0,
        quality_flags=0,
    )
    finding = run_compare_epochs([ep], step_number=1)
    assert finding.indicates_classification == AnomalyClassification.INCONCLUSIVE
    assert len(finding.limitations) > 0


def test_track_motion_detects_moving_asteroid(base_time):
    """Verify track motion detects large angular displacement (>5 sigma)."""
    ep1 = ObservationEpoch(
        epoch_id="EP-01",
        timestamp=base_time,
        telescope_id="TEST-T1",
        filter_band="g",
        exposure_time_sec=60.0,
        magnitude=18.0,
        magnitude_err=0.03,
        flux_ujy=100.0,
        flux_err_ujy=3.0,
        ra_deg=45.00000,
        dec_deg=10.00000,
        position_err_arcsec=0.03,
        snr=30.0,
        psf_fwhm_arcsec=1.1,
        psf_chi2=1.05,
        quality_flags=0,
    )
    # Shifted by 0.005 degrees (~18 arcseconds) over 2 hours
    ep2 = ObservationEpoch(
        epoch_id="EP-02",
        timestamp=base_time + timedelta(hours=2),
        telescope_id="TEST-T1",
        filter_band="g",
        exposure_time_sec=60.0,
        magnitude=17.9,
        magnitude_err=0.03,
        flux_ujy=110.0,
        flux_err_ujy=3.0,
        ra_deg=45.00500,
        dec_deg=10.00000,
        position_err_arcsec=0.03,
        snr=31.0,
        psf_fwhm_arcsec=1.1,
        psf_chi2=1.04,
        quality_flags=0,
    )

    finding = run_track_motion([ep1, ep2], step_number=2)
    assert finding.tool_name == "track_motion"
    assert finding.metrics["total_displacement_arcsec"] > 15.0
    assert finding.metrics["motion_rate_arcsec_per_hr"] > 8.0
    assert finding.indicates_classification == AnomalyClassification.MOVING_OBJECT


def test_track_motion_detects_stationary_source(base_time):
    """Stationary coordinate shift within error indicates fixed celestial source."""
    ep1 = ObservationEpoch(
        epoch_id="EP-01",
        timestamp=base_time,
        telescope_id="TEST-T1",
        filter_band="r",
        exposure_time_sec=60.0,
        magnitude=18.0,
        magnitude_err=0.03,
        flux_ujy=100.0,
        flux_err_ujy=3.0,
        ra_deg=120.500000,
        dec_deg=-15.200000,
        position_err_arcsec=0.03,
        snr=30.0,
        psf_fwhm_arcsec=1.1,
        psf_chi2=1.0,
        quality_flags=0,
    )
    # Tiny shift < 0.01 arcseconds (within 0.03 error)
    ep2 = ObservationEpoch(
        epoch_id="EP-02",
        timestamp=base_time + timedelta(hours=5),
        telescope_id="TEST-T1",
        filter_band="r",
        exposure_time_sec=60.0,
        magnitude=18.0,
        magnitude_err=0.03,
        flux_ujy=100.0,
        flux_err_ujy=3.0,
        ra_deg=120.500001,
        dec_deg=-15.200001,
        position_err_arcsec=0.03,
        snr=30.0,
        psf_fwhm_arcsec=1.1,
        psf_chi2=1.0,
        quality_flags=0,
    )

    finding = run_track_motion([ep1, ep2], step_number=2)
    assert finding.metrics["total_displacement_arcsec"] < 0.05
    assert finding.indicates_classification == AnomalyClassification.TRANSIENT_EVENT


def test_check_quality_detects_cosmic_ray(base_time):
    """Cosmic ray flag 0x0004 and elevated PSF chi2 correctly identified as artifact."""
    ep = ObservationEpoch(
        epoch_id="EP-01",
        timestamp=base_time,
        telescope_id="TEST-T1",
        filter_band="i",
        exposure_time_sec=60.0,
        magnitude=16.5,
        magnitude_err=0.02,
        flux_ujy=500.0,
        flux_err_ujy=10.0,
        ra_deg=50.0,
        dec_deg=50.0,
        position_err_arcsec=0.03,
        snr=50.0,
        psf_fwhm_arcsec=0.4,
        psf_chi2=4.5,
        quality_flags=0x0004,  # Cosmic ray hit
    )

    finding = run_check_quality([ep], step_number=1)
    assert finding.metrics["cosmic_ray_detected"] is True
    assert finding.metrics["artifact_probability_score"] >= 0.70
    assert finding.indicates_classification == AnomalyClassification.MEASUREMENT_ARTIFACT


def test_request_more_data_loop_prevention(base_time):
    """Enforces loop prevention ceiling when step reaches max_steps."""
    ep = ObservationEpoch(
        epoch_id="EP-01",
        timestamp=base_time,
        telescope_id="TEST-T1",
        filter_band="r",
        exposure_time_sec=60.0,
        magnitude=18.0,
        magnitude_err=0.03,
        flux_ujy=100.0,
        flux_err_ujy=3.0,
        ra_deg=10.0,
        dec_deg=10.0,
        position_err_arcsec=0.03,
        snr=20.0,
        psf_fwhm_arcsec=1.1,
        psf_chi2=1.0,
        quality_flags=0,
    )

    # Calling at step 4 of max_steps=4
    finding = run_request_more_data([ep], step_number=4, max_steps=4)
    assert finding.metrics["loop_safeguard_triggered"] is True
    assert finding.metrics["investigation_should_terminate"] is True
    assert "Maximum investigation depth reached" in finding.summary
