"""Report generation service for parent reports."""

import random
import string
import logging
from typing import Tuple, Dict, Any, List, Optional

from app.agents.orchestrator import AgentOrchestrator
from app.agents.progress import generate_progress_report
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository
from app.repositories.user import UserRepository
from app.services.metrics import get_duration_score
from app.models.report import ReportGraphDataPoint, ProgressSnapshot, MilestoneInfo
from app.models.assessment import Assessment

logger = logging.getLogger(__name__)

# Singleton orchestrator instance
orchestrator = AgentOrchestrator()


def _get_assessment_hold_time(assessment: Assessment) -> float:
    """Extract hold time from assessment.

    For balance tests (always dual-leg), uses left leg as primary for consistency
    across progress tracking and graph visualization.
    """
    # Balance assessments are always dual-leg
    if assessment.leg_tested.value == "both" and assessment.left_leg_metrics:
        return assessment.left_leg_metrics.hold_time

    # Legacy fallback for single-leg (may not be used for balance tests)
    if assessment.metrics:
        return assessment.metrics.hold_time

    return 0.0


def _get_assessment_score(assessment: Assessment) -> int:
    """Extract duration score from assessment.

    For balance tests (always dual-leg), uses left leg as primary for consistency
    across progress tracking and graph visualization.
    """
    # Balance assessments are always dual-leg
    if assessment.leg_tested.value == "both" and assessment.left_leg_metrics:
        return assessment.left_leg_metrics.duration_score

    # Legacy fallback for single-leg (may not be used for balance tests)
    if assessment.metrics:
        return assessment.metrics.duration_score

    return 1


def _compute_graph_data(assessments: List[Assessment]) -> List[ReportGraphDataPoint]:
    """Transform assessments into chart-ready data points with bilateral support.

    Args:
        assessments: List of assessments (most recent first from repository)

    Returns:
        List of graph data points sorted chronologically (oldest first)
        with separate left_leg and right_leg fields for bilateral visualization
    """
    # Sort chronologically (oldest first) for graph display
    sorted_assessments = sorted(assessments, key=lambda a: a.created_at)

    data_points = []
    for a in sorted_assessments:
        # Extract bilateral data
        left_leg_time = None
        right_leg_time = None

        if a.leg_tested.value == "both":
            # Dual-leg assessment
            if a.left_leg_metrics:
                left_leg_time = a.left_leg_metrics.hold_time
            if a.right_leg_metrics:
                right_leg_time = a.right_leg_metrics.hold_time
        elif a.leg_tested.value == "left":
            # Single left leg
            if a.metrics:
                left_leg_time = a.metrics.hold_time
        elif a.leg_tested.value == "right":
            # Single right leg
            if a.metrics:
                right_leg_time = a.metrics.hold_time

        # Legacy duration field (left leg for consistency)
        duration = left_leg_time or right_leg_time or 0.0

        data_points.append(ReportGraphDataPoint(
            date=a.created_at.strftime("%b %d"),
            duration=duration,
            left_leg=left_leg_time,
            right_leg=right_leg_time
        ))

    return data_points


def _compute_progress_snapshot(assessments: List[Assessment]) -> Optional[ProgressSnapshot]:
    """Compare first vs latest assessment in report.

    Args:
        assessments: List of assessments (most recent first from repository)

    Returns:
        ProgressSnapshot comparing first and latest, or None if <1 assessment
    """
    if not assessments:
        return None

    # Sort chronologically to get first and last
    sorted_assessments = sorted(assessments, key=lambda a: a.created_at)
    first = sorted_assessments[0]
    latest = sorted_assessments[-1]

    return ProgressSnapshot(
        started_date=first.created_at.strftime("%b %d"),
        started_duration=_get_assessment_hold_time(first),
        started_score=_get_assessment_score(first),
        current_date=latest.created_at.strftime("%b %d"),
        current_duration=_get_assessment_hold_time(latest),
        current_score=_get_assessment_score(latest),
    )


def _compute_milestones(assessments: List[Assessment], athlete_name: str) -> List[MilestoneInfo]:
    """Check for milestone achievements within the report's assessments.

    Milestones:
    1. First time holding 20+ seconds (the target line on the graph)
    2. First assessment showing improvement over the previous

    Args:
        assessments: List of assessments (most recent first from repository)
        athlete_name: Athlete's name for milestone messages

    Returns:
        List of milestone achievements (may be empty)
    """
    milestones = []

    if not assessments:
        return milestones

    # Sort chronologically for sequential analysis
    sorted_assessments = sorted(assessments, key=lambda a: a.created_at)

    # Milestone 1: First time holding 20+ seconds
    for i, assessment in enumerate(sorted_assessments):
        hold_time = _get_assessment_hold_time(assessment)
        if hold_time >= 20:
            # Check if this is first time hitting 20+ (no prior assessment hit 20+)
            prior_max = max(
                (_get_assessment_hold_time(prev) for prev in sorted_assessments[:i]),
                default=0
            )
            if prior_max < 20:
                milestones.append(MilestoneInfo(
                    type="twenty_seconds",
                    message=f"{athlete_name} held their balance for 20+ seconds for the first time!"
                ))
            break  # Only check until first 20+ hold

    # Milestone 2: Sustained improvement (requires consistent trend, not single blips)
    # Only trigger if last 3 assessments average significantly better than first 3
    if len(sorted_assessments) >= 6:
        # Compare first 3 (oldest) vs last 3 (most recent) assessments
        first_three_avg = sum(_get_assessment_hold_time(a) for a in sorted_assessments[:3]) / 3
        last_three_avg = sum(_get_assessment_hold_time(a) for a in sorted_assessments[-3:]) / 3

        # Only show improvement if last 3 are significantly better (15%+ improvement)
        if last_three_avg > first_three_avg * 1.15:
            improvement_pct = ((last_three_avg / first_three_avg - 1) * 100)
            milestones.append(MilestoneInfo(
                type="improvement",
                message=f"{athlete_name} has shown consistent improvement ({improvement_pct:.0f}% increase in balance duration)!"
            ))

    return milestones


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

    # Debug: Log compressed history to diagnose trend detection issues
    logger.info(f"[DEBUG] Report generation for {athlete.name}:")
    logger.info(f"  Assessment count: {routing['assessment_count']}")
    if routing['compressed_history']:
        logger.info(f"  Compressed history (first 300 chars): {routing['compressed_history'][:300]}...")
    else:
        logger.warning(f"  No compressed history generated!")

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

    # Compute enhanced report data for graphs and milestones
    graph_data = _compute_graph_data(assessments)
    progress_snapshot = _compute_progress_snapshot(assessments)
    milestones = _compute_milestones(assessments, athlete.name)

    metadata = {
        "assessment_count": routing["assessment_count"],
        "latest_score": latest_score,
        "assessment_ids": [a.id for a in assessments],
        # New fields for enhanced parent reports
        "graph_data": [gd.model_dump() for gd in graph_data],
        "progress_snapshot": progress_snapshot.model_dump() if progress_snapshot else None,
        "milestones": [m.model_dump() for m in milestones],
    }

    logger.info(
        f"Generated report for {athlete.name}: {len(content)} chars, "
        f"{metadata['assessment_count']} assessments, "
        f"{len(milestones)} milestones"
    )

    return content, metadata
