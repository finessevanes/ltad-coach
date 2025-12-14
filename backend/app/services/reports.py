"""Report generation service for parent reports."""

import random
import string
import logging
from typing import Tuple, Dict, Any

from app.agents.orchestrator import AgentOrchestrator
from app.agents.progress import generate_progress_report
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository
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

    # Get athlete
    athlete = await athlete_repo.get(athlete_id)
    if not athlete:
        logger.error(f"Athlete {athlete_id} not found")
        raise ValueError("Athlete not found")

    # Get assessments
    assessments = await assessment_repo.get_by_athlete(athlete_id, limit=12)
    if not assessments:
        logger.error(f"No assessments found for athlete {athlete_id}")
        raise ValueError("No assessments found")

    # Get latest metrics
    latest = assessments[0]
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
    )

    # Calculate latest score
    latest_score = None
    if current_metrics.get("duration_seconds"):
        latest_score = get_duration_score(current_metrics["duration_seconds"])

    metadata = {
        "assessment_count": routing["assessment_count"],
        "latest_score": latest_score,
        "assessment_ids": [a.id for a in assessments],
    }

    logger.info(f"Generated report for {athlete.name}: {len(content)} chars, {metadata['assessment_count']} assessments")

    return content, metadata
