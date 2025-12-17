"""Agent Orchestrator - Routes requests to appropriate AI agents.

This orchestrator uses pure Python logic (no LLM) to determine which agent
should handle each request type and execute the appropriate workflow.
"""

import logging
from typing import Dict, Any, Optional, List, Literal
from app.agents.compression import compress_history
from app.agents.assessment import generate_assessment_feedback
from app.agents.progress import generate_progress_report
from app.repositories.assessment import AssessmentRepository

logger = logging.getLogger(__name__)

RequestType = Literal["assessment_feedback", "bilateral_assessment", "parent_report", "progress_trends"]


class AgentOrchestrator:
    """Routes and executes AI agent requests based on request type."""

    async def generate_feedback(
        self,
        request_type: RequestType,
        athlete_id: str,
        athlete_name: str,
        athlete_age: int,
        athlete_gender: Optional[str] = None,
        leg_tested: Optional[str] = None,
        metrics: Optional[Dict[str, Any]] = None,
        current_assessment_id: Optional[str] = None,
    ) -> str:
        """Route request and generate AI feedback.

        Args:
            request_type: Type of request (assessment_feedback, parent_report, progress_trends)
            athlete_id: Athlete ID for history lookup
            athlete_name: Athlete name for context
            athlete_age: Athlete age for LTAD context
            athlete_gender: Athlete gender (male/female) for pronoun usage
            leg_tested: Leg tested (required for assessment_feedback)
            metrics: Assessment metrics (required for assessment_feedback and progress reports)
            current_assessment_id: Optional current assessment ID to exclude from history

        Returns:
            Generated feedback text

        Raises:
            ValueError: If request_type is invalid or required parameters missing
        """
        if request_type == "assessment_feedback":
            # Single assessment feedback
            logger.info(f"Generating assessment feedback for {athlete_name}")

            if not leg_tested or not metrics:
                raise ValueError("leg_tested and metrics required for assessment_feedback")

            return await generate_assessment_feedback(
                athlete_name=athlete_name,
                athlete_age=athlete_age,
                leg_tested=leg_tested,
                metrics=metrics,
            )

        elif request_type == "bilateral_assessment":
            # Bilateral assessment feedback
            logger.info(f"Generating bilateral assessment feedback for {athlete_name}")

            if not metrics:
                logger.error(f"No metrics provided for bilateral assessment (athlete: {athlete_name})")
                raise ValueError("metrics required for bilateral_assessment")

            logger.info(f"Bilateral assessment metrics keys: {list(metrics.keys())}")

            # Extract left and right leg metrics from metrics dict
            left_leg_metrics = metrics.get("left_leg_metrics", {})
            right_leg_metrics = metrics.get("right_leg_metrics", {})
            bilateral_comparison = metrics.get("bilateral_comparison", {})

            logger.info(f"Extracted data - Left metrics: {len(left_leg_metrics)} keys, "
                       f"Right metrics: {len(right_leg_metrics)} keys, "
                       f"Comparison: {len(bilateral_comparison)} keys")

            if not left_leg_metrics or not right_leg_metrics or not bilateral_comparison:
                logger.error(f"Missing bilateral data for {athlete_name}: "
                            f"left={bool(left_leg_metrics)}, right={bool(right_leg_metrics)}, "
                            f"comparison={bool(bilateral_comparison)}")
                logger.error(f"Metrics structure received: {metrics}")
                raise ValueError("bilateral_assessment requires left_leg_metrics, right_leg_metrics, and bilateral_comparison")

            logger.info(f"Calling bilateral assessment agent for {athlete_name}")
            logger.info(f"Left leg hold time: {left_leg_metrics.get('hold_time')}s")
            logger.info(f"Right leg hold time: {right_leg_metrics.get('hold_time')}s")
            logger.info(f"Dominant leg: {bilateral_comparison.get('dominant_leg')}")

            from app.agents.bilateral_assessment import generate_bilateral_assessment_feedback

            try:
                feedback = await generate_bilateral_assessment_feedback(
                    athlete_name=athlete_name,
                    athlete_age=athlete_age,
                    athlete_gender=athlete_gender,
                    left_leg_metrics=left_leg_metrics,
                    right_leg_metrics=right_leg_metrics,
                    bilateral_comparison=bilateral_comparison,
                )
                logger.info(f"Bilateral assessment feedback generated successfully ({len(feedback)} chars)")
                return feedback
            except Exception as e:
                logger.error(f"Bilateral assessment agent failed: {e}", exc_info=True)
                raise

        elif request_type in ("parent_report", "progress_trends"):
            # Progress report with compressed history
            logger.info(f"Generating progress report for {athlete_name}")

            if not metrics:
                raise ValueError("metrics required for progress report")

            # Get and compress history
            routing = await self.route(
                request_type=request_type,
                athlete_id=athlete_id,
                athlete_name=athlete_name,
                athlete_age=athlete_age,
                current_assessment_id=current_assessment_id,
            )

            return await generate_progress_report(
                athlete_name=athlete_name,
                athlete_age=athlete_age,
                compressed_history=routing["compressed_history"],
                current_metrics=metrics,
                assessment_count=routing["assessment_count"],
            )

        else:
            raise ValueError(f"Invalid request_type: {request_type}")

    async def route(
        self,
        request_type: RequestType,
        athlete_id: str,
        athlete_name: str,
        athlete_age: int,
        current_assessment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Route request to appropriate agent workflow (for history compression).

        This method is used internally and by endpoints that need routing info
        without generating feedback (e.g., for testing or custom workflows).

        Args:
            request_type: Type of request (assessment_feedback, parent_report, progress_trends)
            athlete_id: Athlete ID for history lookup
            athlete_name: Athlete name for context
            athlete_age: Athlete age for LTAD context
            current_assessment_id: Optional current assessment ID to exclude from history

        Returns:
            Dict with routing information:
            - route: "assessment_agent" or "progress_agent"
            - compressed_history: Summary of past assessments (if applicable)
            - assessment_count: Number of historical assessments (if applicable)

        Raises:
            ValueError: If request_type is invalid
        """
        if request_type == "assessment_feedback":
            # Single assessment - no history needed
            logger.info(f"Routing to assessment_agent for {athlete_name}")
            return {
                "route": "assessment_agent",
                "compressed_history": None,
                "assessment_count": 0,
            }

        elif request_type in ("parent_report", "progress_trends"):
            # Historical analysis - get and compress history
            logger.info(f"Routing to progress_agent for {athlete_name}")

            # Get last 12 assessments (excluding current if provided)
            assessment_repo = AssessmentRepository()
            all_assessments = await assessment_repo.get_by_athlete(
                athlete_id,
                limit=13 if current_assessment_id else 12
            )

            # Filter out current assessment if provided
            if current_assessment_id:
                assessments = [
                    a for a in all_assessments
                    if a.id != current_assessment_id
                ][:12]
            else:
                assessments = all_assessments[:12]

            # Helper function to extract metrics from assessments
            def _extract_assessment_metrics(assessment):
                """Extract metrics from assessment, handling both single-leg and dual-leg.

                For dual-leg balance assessments, uses left leg as primary for consistency
                with report graphs and progress tracking.
                """
                # Dual-leg assessment - use left leg as primary (matches report service)
                # IMPORTANT: Compare enum.value to string, not enum to string
                if assessment.leg_tested.value == "both" and assessment.left_leg_metrics:
                    metrics = assessment.left_leg_metrics
                    return metrics.model_dump() if hasattr(metrics, 'model_dump') else metrics

                # Single-leg assessment (legacy - should not exist in production)
                # IMPORTANT: All balance tests are dual-leg as of current architecture
                if assessment.leg_tested.value != "both" and assessment.metrics:
                    logger.warning(f"Assessment {assessment.id} uses deprecated single-leg format (leg_tested={assessment.leg_tested.value})")
                    return assessment.metrics.model_dump() if hasattr(assessment.metrics, 'model_dump') else assessment.metrics

                # Fallback - return empty dict instead of None to prevent errors
                logger.error(f"Assessment {assessment.id} has no extractable metrics (leg_tested={assessment.leg_tested.value}, has_left={bool(assessment.left_leg_metrics)}, has_single={bool(assessment.metrics)})")
                return {}

            # Convert to dicts for compression
            assessment_dicts = [
                {
                    "id": a.id,
                    "created_at": a.created_at,
                    "metrics": _extract_assessment_metrics(a),
                    "status": a.status,
                }
                for a in assessments
            ]

            # Analyze trend using deterministic logic (replaces AI compression)
            compressed_history = None
            if assessment_dicts:
                try:
                    from app.services.trend_analyzer import analyze_trend

                    trend_analysis = analyze_trend(
                        assessments=assessment_dicts,
                        athlete_name=athlete_name,
                        athlete_age=athlete_age,
                    )
                    # Convert to narrative for Progress Agent
                    compressed_history = trend_analysis.to_narrative_summary()
                    logger.info(f"Trend analysis for {athlete_name}: {trend_analysis.trend} ({trend_analysis.trend_strength})")
                except Exception as e:
                    logger.error(f"Trend analysis failed: {e}")
                    compressed_history = (
                        f"{athlete_name} has completed {len(assessment_dicts)} assessments. "
                        "Detailed history unavailable."
                    )

            return {
                "route": "progress_agent",
                "compressed_history": compressed_history,
                "assessment_count": len(assessment_dicts),
            }

        else:
            raise ValueError(f"Invalid request_type: {request_type}")


# Singleton instance
_orchestrator: Optional[AgentOrchestrator] = None


def get_orchestrator() -> AgentOrchestrator:
    """Get singleton orchestrator instance.

    Returns:
        Orchestrator instance
    """
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
