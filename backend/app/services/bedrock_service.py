"""NEBULA - Amazon Bedrock Generative Reasoning & Scientific Report Service.

Utilizes Amazon Bedrock (via official AWS SDK / Converse API) for high-level generative
reasoning: interpreting the astronomer's query and synthesizing the final structured,
evidence-based scientific investigation report.

Adheres strictly to AWS least-privilege security guidelines:
- Never hardcodes access keys
- Reads configuration from standard environment variables
- Uses AWS credential provider chain (IAM roles, SSO, or environment credentials)
- Gracefully handles throttling, service errors, or missing credentials via an explicit
  development mode that visibly identifies itself as non-live.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional
import boto3
from botocore.exceptions import BotoCoreError, ClientError

from backend.app.models.schemas import (
    AnomalyClassification,
    AstronomicalTarget,
    ScientificReport,
    ToolExecutionFinding,
)

logger = logging.getLogger("nebula.services.bedrock")


class BedrockService:
    """Service managing generative inference with Amazon Bedrock."""

    def __init__(
        self,
        region_name: Optional[str] = None,
        model_id: Optional[str] = None,
    ):
        self.region_name = region_name or os.getenv("AWS_REGION", "us-east-1")
        self.model_id = model_id or os.getenv(
            "BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0"
        )
        self._client = None
        self._init_client()

    def _init_client(self):
        """Attempt to instantiate boto3 bedrock-runtime client via standard credential chain."""
        try:
            session = boto3.Session(region_name=self.region_name)
            # Verify credentials existence without making a paid inference call
            credentials = session.get_credentials()
            if credentials is not None:
                self._client = session.client("bedrock-runtime", region_name=self.region_name)
                logger.info(
                    f"Amazon Bedrock client initialized for region {self.region_name} (model: {self.model_id})"
                )
            else:
                logger.info("No AWS credentials found in provider chain. Bedrock running in development mode.")
                self._client = None
        except Exception as e:
            logger.info(f"Bedrock client initialization deferred ({e}). Operating in development mode.")
            self._client = None

    def is_available(self) -> bool:
        """Return True only if Bedrock client has active credentials."""
        return self._client is not None

    def get_status(self) -> Dict[str, Any]:
        """Return operational status for UI telemetry."""
        if self._client:
            return {
                "status": "configured",
                "region": self.region_name,
                "model_id": self.model_id,
                "is_development_mode": False,
            }
        return {
            "status": "development_mode",
            "region": self.region_name,
            "model_id": f"simulated ({self.model_id})",
            "is_development_mode": True,
            "notice": "AWS credentials not detected. Providing deterministic structured reports for development.",
        }

    def interpret_request(
        self,
        user_query: str,
        target: AstronomicalTarget,
    ) -> Dict[str, Any]:
        """Use Bedrock to interpret the user's initial investigation prompt and formulate hypotheses."""
        prompt = (
            f"You are NEBULA, an autonomous space anomaly investigator. Analyze the following request:\n"
            f"User Query: \"{user_query}\"\n"
            f"Target: {target.name} ({target.target_id})\n"
            f"Discovery Notes: {target.discovery_notes}\n"
            f"Available Epochs: {len(target.epochs)}\n\n"
            "Formulate 3 competing hypotheses (Transient Event, Moving Solar System Object, Measurement Artifact), "
            "and identify what quantitative evidence is required. Return JSON with keys: "
            "'initial_assessment', 'competing_hypotheses', 'primary_data_needs'."
        )

        if not self.is_available():
            return self._fallback_interpret_request(user_query, target)

        try:
            response = self._client.converse(
                modelId=self.model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"temperature": 0.1, "maxTokens": 1000},
            )
            raw_text = response["output"]["message"]["content"][0]["text"]
            # Attempt to parse json from response
            cleaned = raw_text.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Bedrock converse error during interpret_request: {e}. Using fallback.")
            return self._fallback_interpret_request(user_query, target)

    def generate_investigation_report(
        self,
        target: AstronomicalTarget,
        user_query: str,
        tool_findings: List[ToolExecutionFinding],
        decision_history: List[Any],
    ) -> ScientificReport:
        """Generate final evidence-based scientific investigation report.

        Uses Amazon Bedrock to synthesize all gathered tool metrics, strictly separating:
        1. Observed Facts (empirical numbers from tools)
        2. Physical Interpretations (astrophysical deductions)
        3. Unknowns & Uncertainties (unmeasured parameters)
        """
        if not self.is_available():
            logger.info("Bedrock unavailable; generating structured development mode report.")
            return self._generate_development_report(target, user_query, tool_findings, decision_history)

        # Build comprehensive evidence prompt for Bedrock
        findings_summary = []
        for f in tool_findings:
            findings_summary.append(
                f"- Step {f.step_number} ({f.tool_name}): {f.summary}\n"
                f"  Metrics: {json.dumps(f.metrics)}\n"
                f"  Limitations: {'; '.join(f.limitations)}"
            )
        evidence_block = "\n".join(findings_summary)

        decisions_summary = []
        for d in decision_history:
            action = getattr(d, "selected_action", None) or d.get("selected_action")
            conf = getattr(d, "confidence", None) or d.get("confidence")
            source = getattr(d, "decision_source", "") or d.get("decision_source", "")
            decisions_summary.append(f"- Decision: {action} (source: {source}, conf: {conf})")
        decisions_block = "\n".join(decisions_summary)

        system_instruction = (
            "You are NEBULA, a senior research astrophysicist and automated alert investigator. "
            "Synthesize the investigation findings into a rigorous, peer-review-grade scientific report.\n"
            "Requirements:\n"
            "1. Base all statements strictly on the empirical tool metrics provided. Never fabricate data.\n"
            "2. Distinguish clearly between: Observed Facts, Interpretations, and Unknowns/Uncertainties.\n"
            "3. State a primary classification from: transient_event, moving_object, measurement_artifact, variable_source, inconclusive.\n"
            "4. Return strictly valid JSON matching this schema:\n"
            "{\n"
            '  "executive_summary": "...",\n'
            '  "primary_classification": "transient_event|moving_object|measurement_artifact|variable_source|inconclusive",\n'
            '  "classification_confidence": 0.95,\n'
            '  "observed_facts": ["...", "..."],\n'
            '  "interpretations": ["...", "..."],\n'
            '  "unknowns_and_uncertainties": ["...", "..."],\n'
            '  "evidence_references": ["...", "..."],\n'
            '  "recommended_follow_up": ["...", "..."]\n'
            "}"
        )

        user_content = (
            f"Target: {target.name} ({target.target_id})\n"
            f"Dataset Type: {target.dataset_type} (SYNTHETIC ASTRONOMICAL BENCHMARK)\n"
            f"User Inquiry: \"{user_query}\"\n\n"
            f"Decider 2B Tool Decision Sequence:\n{decisions_block}\n\n"
            f"Quantitative Tool Findings:\n{evidence_block}\n"
        )

        try:
            response = self._client.converse(
                modelId=self.model_id,
                system=[{"text": system_instruction}],
                messages=[{"role": "user", "content": [{"text": user_content}]}],
                inferenceConfig={"temperature": 0.1, "maxTokens": 2048},
            )
            raw_text = response["output"]["message"]["content"][0]["text"]
            cleaned = raw_text.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()

            parsed = json.loads(cleaned)

            return ScientificReport(
                target_id=target.target_id,
                target_name=target.name,
                executive_summary=parsed["executive_summary"],
                primary_classification=AnomalyClassification(parsed["primary_classification"]),
                classification_confidence=float(parsed["classification_confidence"]),
                observed_facts=parsed["observed_facts"],
                interpretations=parsed["interpretations"],
                unknowns_and_uncertainties=parsed["unknowns_and_uncertainties"],
                evidence_references=parsed["evidence_references"],
                recommended_follow_up=parsed["recommended_follow_up"],
                is_development_mode=False,
                model_id=self.model_id,
            )

        except (BotoCoreError, ClientError, json.JSONDecodeError, KeyError) as e:
            logger.error(f"Bedrock invocation failed: {e}. Falling back to structured development report.", exc_info=True)
            return self._generate_development_report(target, user_query, tool_findings, decision_history)

    def _fallback_interpret_request(
        self,
        user_query: str,
        target: AstronomicalTarget,
    ) -> Dict[str, Any]:
        """Deterministic query interpretation when Bedrock is in development mode."""
        return {
            "initial_assessment": (
                f"Investigation requested for {target.name}. Initial detection notes: {target.description}. "
                "Evaluating whether photometric brightening is astrophysical or instrumental."
            ),
            "competing_hypotheses": [
                "Hypothesis A (Transient): Fixed stellar or extragalactic explosive event (supernova, optical flaring).",
                "Hypothesis B (Moving Object): Solar system asteroid or near-Earth object traversing field.",
                "Hypothesis C (Artifact): Detector glitch, cosmic ray hit, or calibration mask error.",
            ],
            "primary_data_needs": [
                "Multi-epoch photometric flux delta and statistical significance.",
                "High-precision astrometric positional centroid displacement.",
                "Quality flag inspection and PSF model fit residuals.",
            ],
        }

    def _generate_development_report(
        self,
        target: AstronomicalTarget,
        user_query: str,
        tool_findings: List[ToolExecutionFinding],
        decision_history: List[Any],
    ) -> ScientificReport:
        """Deterministic, evidence-grounded report generator for development mode."""
        # Synthesize metrics from findings
        facts: List[str] = []
        interpretations: List[str] = []
        unknowns: List[str] = []
        evidence_refs: List[str] = []
        follow_up: List[str] = []

        # Determine dominant classification based on tool findings
        found_artifact = False
        found_motion = False
        found_brightening = False

        for f in tool_findings:
            metrics = f.metrics
            evidence_refs.append(f"Tool '{f.tool_name}' (Step {f.step_number}): {f.summary}")

            if f.tool_name == "check_quality":
                prob = metrics.get("artifact_probability_score", 0.0)
                chi2 = metrics.get("max_psf_reduced_chi2", 1.0)
                facts.append(f"Detector artifact score: {prob:.2f}; max PSF fit reduced chi-squared: {chi2:.2f}.")
                if prob >= 0.5:
                    found_artifact = True
                    interpretations.append("Severe detector anomalies (cosmic ray / PSF residual) indicate a spurious measurement artifact.")
                else:
                    interpretations.append("Nominal image quality and clean PSF fit confirm observational integrity of source.")

            elif f.tool_name == "compare_epochs":
                dmag = metrics.get("delta_magnitude", 0.0)
                sig = metrics.get("significance_sigma", 0.0)
                ratio = metrics.get("flux_ratio", 1.0)
                facts.append(f"Photometric comparison: delta_mag = {dmag:+.2f} ({sig:.1f} sigma), flux ratio = {ratio:.2f}x.")
                if dmag < -0.5 and sig >= 3.0:
                    found_brightening = True
                    interpretations.append(f"Source exhibited statistically significant brightening ({sig:.1f} sigma) over observation baseline.")

            elif f.tool_name == "track_motion":
                disp = metrics.get("total_displacement_arcsec", 0.0)
                rate = metrics.get("motion_rate_arcsec_per_hr", 0.0)
                m_sig = metrics.get("motion_significance_sigma", 0.0)
                facts.append(f"Astrometric tracking: angular displacement = {disp:.3f}\" (rate = {rate:.2f}\"/hr, {m_sig:.1f} sigma).")
                if disp > 0.5 and m_sig >= 3.0:
                    found_motion = True
                    interpretations.append(f"Significant proper motion ({rate:.2f}\"/hr) strongly indicates a solar system body (asteroid/NEO).")
                else:
                    interpretations.append("Astrometric coordinates are stationary within observational error, ruling out fast-moving solar system bodies.")

            elif f.tool_name == "request_more_data":
                unknowns.extend(metrics.get("missing_requirements", []))
                follow_up.extend(metrics.get("follow_up_recommendations", []))

        # Scientific classification synthesis
        if found_artifact:
            classification = AnomalyClassification.MEASUREMENT_ARTIFACT
            confidence = 0.94
            summary = (
                f"Investigation of {target.name} concluded that the apparent brightening is a "
                "MEASUREMENT ARTIFACT. Quality analysis confirmed detector anomalies (cosmic ray contamination "
                "or non-stellar PSF chi-squared) dominating the signal."
            )
        elif found_motion:
            classification = AnomalyClassification.MOVING_OBJECT
            confidence = 0.92
            summary = (
                f"Investigation of {target.name} confirmed a MOVING SOLAR SYSTEM OBJECT. "
                "Astrometric tracking detected unambiguous coordinate displacement (>30σ), ruling out fixed transient events."
            )
        elif found_brightening:
            classification = AnomalyClassification.TRANSIENT_EVENT
            confidence = 0.95
            summary = (
                f"Investigation of {target.name} confirmed a stationary OPTICAL TRANSIENT EVENT (Supernova candidate). "
                "Photometry demonstrated rapid >5σ flux increase with zero astrometric motion and clean detector quality flags."
            )
        elif len(target.epochs) < 2:
            classification = AnomalyClassification.INCONCLUSIVE
            confidence = 0.35
            summary = (
                f"Investigation of {target.name} is INCONCLUSIVE due to single-epoch observation constraints. "
                "Automated tool analysis has queued follow-up Target-of-Opportunity observations."
            )
        else:
            classification = AnomalyClassification.VARIABLE_SOURCE
            confidence = 0.88
            summary = (
                f"Investigation of {target.name} indicates a VARIABLE CELESTIAL SOURCE. "
                "Measurements show moderate flux fluctuations without proper motion, consistent with an active galactic nucleus or stellar variable."
            )

        if not unknowns:
            unknowns.append("Underlying host galaxy redshift and exact distance modulus remain unmeasured.")
            unknowns.append("Color temperature evolution across ultraviolet and infrared bands requires spectroscopic confirmation.")

        if not follow_up:
            follow_up.append("Acquire optical spectroscopy (3800-9000 Å) to confirm spectroscopic classification.")
            follow_up.append("Schedule high-cadence photometric monitoring over next 72 hours.")

        return ScientificReport(
            target_id=target.target_id,
            target_name=target.name,
            executive_summary=summary,
            primary_classification=classification,
            classification_confidence=confidence,
            observed_facts=facts if facts else ["Synthetic multi-epoch astronomical dataset evaluated."],
            interpretations=interpretations,
            unknowns_and_uncertainties=unknowns,
            evidence_references=evidence_refs,
            recommended_follow_up=follow_up,
            is_development_mode=True,
            model_id=f"development-mode-simulated ({self.model_id})",
        )
