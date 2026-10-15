"""NEBULA - Autonomous Space Anomaly Investigator Agent.

Orchestrates the scientific investigation loop:
1. Formulates initial hypotheses and observational requirements.
2. Formats the current empirical state for the Strands Decider 2B model.
3. Invokes Strands Decider 2B to select the next analysis tool.
4. Executes the selected tool (compare_epochs, track_motion, check_quality, or request_more_data).
5. Updates investigation state with structured quantitative findings.
6. Repeats the decision loop until sufficient evidence is gathered or max_steps reached.
7. Uses Amazon Bedrock to synthesize the final evidence-based scientific report.
"""

from datetime import datetime, timezone
import logging
from typing import Callable, List, Optional
import uuid

from backend.app.decisions.schemas import (
    AllowedToolAction,
    ToolDecisionRequest,
    ToolDecisionResult,
)
from backend.app.decisions.tool_selection import StrandsDeciderClient, select_next_tool
from backend.app.models.schemas import (
    AstronomicalTarget,
    InvestigationSession,
    ScientificReport,
    ToolExecutionFinding,
)
from backend.app.services.bedrock_service import BedrockService
from backend.app.tools.check_quality import run_check_quality
from backend.app.tools.compare_epochs import run_compare_epochs
from backend.app.tools.request_more_data import run_request_more_data
from backend.app.tools.track_motion import run_track_motion

logger = logging.getLogger("nebula.agent")


class NebulaSpaceAgent:
    """Autonomous agent investigating astronomical anomalies using Strands Decider 2B and Amazon Bedrock."""

    def __init__(
        self,
        decider_client: Optional[StrandsDeciderClient] = None,
        bedrock_service: Optional[BedrockService] = None,
        max_steps: int = 4,
        confidence_threshold: float = 0.40,
    ):
        self.decider_client = decider_client or StrandsDeciderClient()
        self.bedrock_service = bedrock_service or BedrockService()
        self.max_steps = max_steps
        self.confidence_threshold = confidence_threshold

    def investigate(
        self,
        target: AstronomicalTarget,
        user_query: str,
        on_step_callback: Optional[Callable[[dict], None]] = None,
    ) -> InvestigationSession:
        """Run a complete end-to-end investigation workflow."""
        investigation_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
        start_time = datetime.now(timezone.utc)

        session = InvestigationSession(
            investigation_id=investigation_id,
            target=target,
            user_query=user_query,
            current_step=1,
            max_steps=self.max_steps,
            status="in_progress",
            decisions=[],
            tool_results=[],
            state_history=[],
        )

        logger.info(
            f"Starting NEBULA investigation {investigation_id} for target {target.target_id} "
            f"('{target.name}')"
        )

        # 1. High-level query interpretation via Bedrock
        interpretation = self.bedrock_service.interpret_request(user_query, target)
        initial_state = (
            f"TARGET: {target.name} ({target.target_id}). "
            f"TRIGGER: {target.description}. "
            f"INITIAL ASSESSMENT: {interpretation.get('initial_assessment', '')} "
            f"EPOCHS AVAILABLE: {len(target.epochs)}."
        )
        session.state_history.append(initial_state)

        if on_step_callback:
            on_step_callback({
                "type": "state_initialized",
                "investigation_id": investigation_id,
                "target": target.target_id,
                "initial_assessment": interpretation.get("initial_assessment"),
                "hypotheses": interpretation.get("competing_hypotheses", []),
            })

        executed_tool_names = set()
        step = 1

        # 2. Main agent decision loop
        while step <= self.max_steps:
            session.current_step = step

            # Determine dynamically allowed actions (avoid immediately re-running same tool)
            allowed_actions = [
                action for action in AllowedToolAction
                if action.value not in executed_tool_names
            ]
            # Always ensure request_more_data is an option
            if AllowedToolAction.REQUEST_MORE_DATA not in allowed_actions:
                allowed_actions.append(AllowedToolAction.REQUEST_MORE_DATA)

            # Build state summary reflecting all gathered evidence so far
            state_summary = self._build_state_summary(
                target=target,
                user_query=user_query,
                findings=session.tool_results,
                executed_tools=executed_tool_names,
                step=step,
            )

            decision_req = ToolDecisionRequest(
                investigation_id=investigation_id,
                state_summary=state_summary,
                step_number=step,
                allowed_actions=allowed_actions,
                confidence_threshold=self.confidence_threshold,
                context_metadata={
                    "target_id": target.target_id,
                    "user_query": user_query,
                    "executed_tools": list(executed_tool_names),
                },
            )

            # 3. Strands Decider 2B Tool Selection Decision
            decision_result = select_next_tool(
                request=decision_req,
                client=self.decider_client,
            )
            session.decisions.append(decision_result)

            logger.info(
                f"[Step {step}] Decider 2B selected action: '{decision_result.selected_action.value}' "
                f"(source: {decision_result.decision_source}, conf: {decision_result.confidence}, "
                f"latency: {decision_result.latency_ms:.1f}ms)"
            )

            if on_step_callback:
                on_step_callback({
                    "type": "decision_made",
                    "step": step,
                    "decision": decision_result.model_dump(),
                })

            # 4. Execute Selected Tool
            finding = self._execute_tool(
                action=decision_result.selected_action,
                target=target,
                step=step,
                current_findings=session.tool_results,
            )
            session.tool_results.append(finding)
            executed_tool_names.add(decision_result.selected_action.value)

            if on_step_callback:
                on_step_callback({
                    "type": "tool_executed",
                    "step": step,
                    "action": decision_result.selected_action.value,
                    "finding": finding.model_dump(),
                })

            # 5. Check Termination Conditions
            should_terminate = self._check_termination(
                action=decision_result.selected_action,
                finding=finding,
                step=step,
                executed_tools=executed_tool_names,
                epochs_count=len(target.epochs),
            )

            if should_terminate:
                logger.info(f"Termination condition satisfied at step {step}.")
                break

            step += 1

        # 6. Generate final scientific report using Amazon Bedrock
        logger.info(f"Generating final scientific report via Bedrock for {investigation_id}...")
        report = self.bedrock_service.generate_investigation_report(
            target=target,
            user_query=user_query,
            tool_findings=session.tool_results,
            decision_history=session.decisions,
        )
        session.final_report = report
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)

        # Telemetry indicator
        has_real_decider = any(d.is_real_decider for d in session.decisions)
        is_live_bedrock = not report.is_development_mode

        if has_real_decider and is_live_bedrock:
            session.execution_mode = "LIVE_DECIDER_LIVE_BEDROCK"
        elif has_real_decider and not is_live_bedrock:
            session.execution_mode = "LIVE_DECIDER_DEV_BEDROCK"
        elif not has_real_decider and is_live_bedrock:
            session.execution_mode = "DEV_DECIDER_LIVE_BEDROCK"
        else:
            session.execution_mode = "DEV_MODE"

        if on_step_callback:
            on_step_callback({
                "type": "investigation_completed",
                "investigation_id": investigation_id,
                "execution_mode": session.execution_mode,
                "report": report.model_dump(),
            })

        return session

    def _execute_tool(
        self,
        action: AllowedToolAction,
        target: AstronomicalTarget,
        step: int,
        current_findings: List[ToolExecutionFinding],
    ) -> ToolExecutionFinding:
        """Dispatch execution to the selected analysis tool."""
        if action == AllowedToolAction.COMPARE_EPOCHS:
            return run_compare_epochs(target.epochs, step)
        elif action == AllowedToolAction.TRACK_MOTION:
            return run_track_motion(target.epochs, step)
        elif action == AllowedToolAction.CHECK_QUALITY:
            return run_check_quality(target.epochs, step)
        elif action == AllowedToolAction.REQUEST_MORE_DATA:
            return run_request_more_data(
                epochs=target.epochs,
                step_number=step,
                max_steps=self.max_steps,
                current_findings=current_findings,
            )
        else:
            raise ValueError(f"Unknown action: {action}")

    def _build_state_summary(
        self,
        target: AstronomicalTarget,
        user_query: str,
        findings: List[ToolExecutionFinding],
        executed_tools: set,
        step: int,
    ) -> str:
        """Compose a concise, information-dense state string for Strands Decider 2B."""
        lines = [
            f"INVESTIGATION STEP {step}/{self.max_steps}.",
            f"TARGET: {target.name} ({target.target_id}).",
            f"OBSERVED EPOCHS: {len(target.epochs)}.",
            f"USER QUERY: '{user_query}'.",
        ]

        if not findings:
            lines.append("CURRENT STATUS: Investigation commenced. No tools have run yet.")
            lines.append("UNRESOLVED: Photometric delta, astrometric motion, and detector quality are all unverified.")
        else:
            lines.append(f"EXECUTED TOOLS: [{', '.join(executed_tools)}].")
            for f in findings:
                lines.append(f"FINDING ({f.tool_name}): {f.summary}")

            unresolved = []
            if "check_quality" not in executed_tools:
                unresolved.append("detector quality and artifact risk unverified")
            if "compare_epochs" not in executed_tools:
                unresolved.append("photometric magnitude change unmeasured")
            if "track_motion" not in executed_tools:
                unresolved.append("astrometric motion and proper displacement unmeasured")

            if unresolved:
                lines.append(f"REMAINING QUESTIONS: {'; '.join(unresolved)}.")
            else:
                lines.append("ALL STANDARD ANALYSES COMPLETE: Ready to synthesize or request external data.")

        return " ".join(lines)

    def _check_termination(
        self,
        action: AllowedToolAction,
        finding: ToolExecutionFinding,
        step: int,
        executed_tools: set,
        epochs_count: int,
    ) -> bool:
        """Evaluate whether to stop tool loop and proceed to report generation."""
        # 1. Reached max steps
        if step >= self.max_steps:
            return True

        # 2. Selected request_more_data tool
        if action == AllowedToolAction.REQUEST_MORE_DATA:
            return True

        # 3. Single-epoch target cannot run further comparative tools
        if epochs_count < 2 and "request_more_data" in executed_tools:
            return True

        # 4. Severe artifact confirmed with high confidence after quality check
        if (
            action == AllowedToolAction.CHECK_QUALITY
            and finding.metrics.get("artifact_probability_score", 0.0) >= 0.70
            and "compare_epochs" in executed_tools
        ):
            # If both brightness and artifact are evaluated, we know it's a spurious artifact
            return True

        # 5. All three analytical tools have completed
        if {"compare_epochs", "track_motion", "check_quality"}.issubset(executed_tools):
            return True

        return False
