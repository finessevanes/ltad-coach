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
                raise ValueError("metrics required for bilateral_assessment")

            # Extract left and right leg metrics from metrics dict
            left_leg_metrics = metrics.get("left_leg_metrics", {})
            right_leg_metrics = metrics.get("right_leg_metrics", {})
            bilateral_comparison = metrics.get("bilateral_comparison", {})

            if not left_leg_metrics or not right_leg_metrics or not bilateral_comparison:
                raise ValueError("bilateral_assessment requires left_leg_metrics, right_leg_metrics, and bilateral_comparison")

            from app.agents.bilateral_assessment import generate_bilateral_assessment_feedback
            return await generate_bilateral_assessment_feedback(
                athlete_name=athlete_name,
                athlete_age=athlete_age,
                left_leg_metrics=left_leg_metrics,
                right_leg_metrics=right_leg_metrics,
                bilateral_comparison=bilateral_comparison,
            )

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

            # Convert to dicts for compression
            assessment_dicts = [
                {
                    "id": a.id,
                    "created_at": a.created_at,
                    "metrics": a.metrics.model_dump() if hasattr(a.metrics, 'model_dump') else a.metrics,
                    "status": a.status,
                }
                for a in assessments
            ]

            # Compress history if we have assessments
            compressed_history = None
            if assessment_dicts:
                try:
                    compressed_history = await compress_history(
                        assessments=assessment_dicts,
                        athlete_name=athlete_name,
                        athlete_age=athlete_age,
                    )
                except Exception as e:
                    logger.error(f"History compression failed: {e}")
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
