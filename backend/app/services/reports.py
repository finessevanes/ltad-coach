"""Report generation service for parent reports."""

import random
import string
import logging
from typing import Tuple, Dict, Any

from app.agents.orchestrator import AgentOrchestrator
from app.agents.progress import generate_progress_report
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository
from app.repositories.user import UserRepository
from app.services.metrics import get_duration_score

logger = logging.getLogger(__name__)

# Singleton orchestrator instance
orchestrator = AgentOrchestrator()


def generate_pin() -> str:
    """Generate 6-digit PIN for report access.

    Returns:
        str: 6-digit PIN as string
    """
    return ''.join(random.choices(string.digits, k=6))


async def generate_report_content(
    coach_id: str,
    athlete_id: str,
) -> Tuple[str, Dict[str, Any]]:
    """Generate parent report content using Progress Agent.

    This function:
    1. Fetches athlete and assessment data
    2. Uses the orchestrator to compress historical assessments
    3. Generates AI-powered parent report using Progress Agent
    4. Returns report content and metadata

    Args:
        coach_id: Coach ID (for validation)
        athlete_id: Athlete ID

    Returns:
        Tuple of (content, metadata) where:
        - content: AI-generated parent report text
        - metadata: Dict with assessment_count, latest_score, assessment_ids

    Raises:
        ValueError: If athlete not found or has no assessments
    """
    athlete_repo = AthleteRepository()
    assessment_repo = AssessmentRepository()
    user_repo = UserRepository()

    # Get athlete
    athlete = await athlete_repo.get(athlete_id)
    if not athlete:
        logger.error(f"Athlete {athlete_id} not found")
        raise ValueError("Athlete not found")

    # Get coach name
    coach = await user_repo.get(coach_id)
    coach_name = coach.name if coach else "Your Coach"

    # Get assessments
    assessments = await assessment_repo.get_by_athlete(athlete_id, limit=12)
    if not assessments:
        logger.error(f"No assessments found for athlete {athlete_id}")
        raise ValueError("No assessments found")

    # Get latest metrics (handle both single-leg and dual-leg assessments)
    latest = assessments[0]

    # For dual-leg assessments, combine metrics from both legs
    if latest.leg_tested.value == "both":
        if not latest.left_leg_metrics or not latest.right_leg_metrics:
            logger.error(f"Dual-leg assessment {latest.id} missing leg metrics")
            raise ValueError("Latest assessment has no metrics")

        # Use left leg as primary, include bilateral comparison if available
        current_metrics = latest.left_leg_metrics.model_dump()
        current_metrics["right_leg"] = latest.right_leg_metrics.model_dump()
        if latest.bilateral_comparison:
            current_metrics["bilateral_comparison"] = latest.bilateral_comparison.model_dump()
    else:
        # Single-leg assessment
        current_metrics = latest.metrics.model_dump() if latest.metrics else None

        if not current_metrics:
            logger.error(f"Latest assessment {latest.id} has no metrics")
            raise ValueError("Latest assessment has no metrics")

    # Get compressed history via orchestrator
    logger.info(f"Generating report for athlete {athlete.name} (ID: {athlete_id})")
    routing = await orchestrator.route(
        request_type="parent_report",
        athlete_id=athlete_id,
        athlete_name=athlete.name,
        athlete_age=athlete.age,
    )

    # Generate report content using Progress Agent
    content = await generate_progress_report(
        athlete_name=athlete.name,
        athlete_age=athlete.age,
        compressed_history=routing["compressed_history"],
        current_metrics=current_metrics,
        assessment_count=routing["assessment_count"],
        coach_name=coach_name,
    )

    # Calculate latest score (use hold_time for both single and dual-leg)
    latest_score = None
    hold_time = current_metrics.get("hold_time")
    if hold_time:
        latest_score = get_duration_score(hold_time)

    metadata = {
        "assessment_count": routing["assessment_count"],
        "latest_score": latest_score,
        "assessment_ids": [a.id for a in assessments],
    }

    logger.info(f"Generated report for {athlete.name}: {len(content)} chars, {metadata['assessment_count']} assessments")

    return content, metadata
