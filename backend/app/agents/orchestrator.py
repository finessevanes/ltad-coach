"""Agent Orchestrator - Routes requests to appropriate AI agents.

This orchestrator uses pure Python logic (no LLM) to determine which agent
should handle each request type.
"""

import logging
from typing import Dict, Any, Optional, List, Literal
from app.agents.compression import compress_history
from app.repositories.assessment import AssessmentRepository

logger = logging.getLogger(__name__)

RequestType = Literal["assessment_feedback", "parent_report", "progress_trends"]


class AgentOrchestrator:
    """Routes AI agent requests based on request type."""

    async def route(
        self,
        request_type: RequestType,
        athlete_id: str,
        athlete_name: str,
        athlete_age: int,
        current_assessment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Route request to appropriate agent workflow.

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
