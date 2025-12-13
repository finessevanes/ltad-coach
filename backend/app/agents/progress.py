"""Progress Agent - Generates parent-friendly progress reports.

This agent uses Claude Sonnet to analyze compressed historical data and generate
parent-friendly progress reports (250-350 words).
"""

import logging
from typing import Dict, Any, Optional, Tuple
from app.agents.client import get_openrouter_client
from app.prompts.static_context import FULL_STATIC_CONTEXT
from app.config import get_settings

logger = logging.getLogger(__name__)


async def generate_progress_report(
    athlete_name: str,
    athlete_age: int,
    compressed_history: str,
    current_metrics: Dict[str, Any],
    assessment_count: int,
) -> str:
    """Generate parent-friendly progress report.

    Args:
        athlete_name: Athlete's name
        athlete_age: Athlete's age for LTAD context
        compressed_history: Compressed summary of past assessments (from Compression Agent)
        current_metrics: Current/most recent assessment metrics
        assessment_count: Total number of assessments completed

    Returns:
        250-350 word parent report

    Raises:
        Exception: If report generation fails (caller should handle with fallback)
    """
    try:
        settings = get_settings()
        client = get_openrouter_client()

        # Analyze trends
        trend_analysis = _analyze_trends(current_metrics, compressed_history)

        # Build current performance summary
        current_summary = _format_current_metrics(current_metrics, athlete_age)

        # Build user prompt
        user_prompt = f"""Generate a parent-friendly progress report for {athlete_name} (age {athlete_age}) who has completed {assessment_count} One-Leg Balance Test assessments.

Historical Summary:
{compressed_history}

Current Performance:
{current_summary}

Trend Analysis:
{trend_analysis}

Provide a parent report following the Parent Report Format from the context. Remember:
- 250-350 words total
- Parent-friendly language (no technical jargon)
- Explain what balance means for overall athletic development
- Provide specific, fun home activities
- Encouraging and partnership-focused tone
- Include LTAD developmental context for age {athlete_age}"""

        messages = [
            {"role": "user", "content": user_prompt}
        ]

        # Use Sonnet with cached static context
        response = await client.chat(
            model=settings.sonnet_model,
            messages=messages,
            system=FULL_STATIC_CONTEXT,
            cache_control=True,  # Cache the LTAD context
            temperature=0.7,
            max_tokens=600,  # ~350 words
        )

        logger.info(f"Generated progress report for {athlete_name}")
        return response.strip()

    except Exception as e:
        logger.error(f"Failed to generate progress report: {e}")
        # Return fallback report
        return _generate_fallback_report(
            athlete_name=athlete_name,
            athlete_age=athlete_age,
            current_metrics=current_metrics,
            assessment_count=assessment_count,
            trend_analysis=trend_analysis,
        )


def _analyze_trends(
    current_metrics: Dict[str, Any],
    compressed_history: str,
) -> str:
    """Analyze performance trends from history and current metrics.

    Args:
        current_metrics: Current assessment metrics
        compressed_history: Compressed history summary

    Returns:
        Trend analysis string
    """
    # Simple keyword-based trend detection from compressed history
    history_lower = compressed_history.lower()

    if "improving" in history_lower or "progress" in history_lower:
        trend = "improving"
    elif "declining" in history_lower or "decreased" in history_lower:
        trend = "needs focus"
    elif "stable" in history_lower or "consistent" in history_lower:
        trend = "stable"
    else:
        trend = "developing"

    # Get current performance level
    duration_score = current_metrics.get("duration_score", 0)
    hold_time = current_metrics.get("hold_time", 0)

    if duration_score >= 4:
        level = "advanced"
    elif duration_score == 3:
        level = "on track"
    else:
        level = "building foundations"

    return f"Trend: {trend.capitalize()}, Current level: {level} ({hold_time:.1f}s, Score {duration_score}/5)"


def _format_current_metrics(
    metrics: Dict[str, Any],
    athlete_age: int,
) -> str:
    """Format current metrics into readable text.

    Args:
        metrics: Current assessment metrics
        athlete_age: Athlete's age

    Returns:
        Formatted metrics string
    """
    hold_time = metrics.get("hold_time", 0)
    duration_score = metrics.get("duration_score", 0)
    sway_velocity = metrics.get("sway_velocity", 0)
    success = metrics.get("success", False)

    # Age expectations
    if athlete_age <= 7:
        expected = "5-10 seconds"
    elif athlete_age <= 9:
        expected = "10-15 seconds"
    elif athlete_age <= 11:
        expected = "15-20 seconds"
    else:
        expected = "20-25+ seconds"

    lines = [
        f"- Test Result: {'Completed successfully' if success else 'In progress'}",
        f"- Balance Duration: {hold_time:.1f} seconds (Score: {duration_score}/5)",
        f"- Age Expectation: {expected}",
        f"- Stability Quality: {sway_velocity:.2f} cm/s sway velocity",
    ]

    return "\n".join(lines)


def _generate_fallback_report(
    athlete_name: str,
    athlete_age: int,
    current_metrics: Dict[str, Any],
    assessment_count: int,
    trend_analysis: str,
) -> str:
    """Generate template-based fallback report.

    Args:
        athlete_name: Athlete's name
        athlete_age: Athlete's age
        current_metrics: Current metrics
        assessment_count: Number of assessments
        trend_analysis: Trend analysis string

    Returns:
        Template-based parent report
    """
    hold_time = current_metrics.get("hold_time", 0)
    duration_score = current_metrics.get("duration_score", 0)

    # Determine age expectation
    if athlete_age <= 7:
        expected = "5-10 seconds"
        stage = "Active Start/FUNdamentals"
    elif athlete_age <= 9:
        expected = "10-15 seconds"
        stage = "FUNdamentals"
    elif athlete_age <= 11:
        expected = "15-20 seconds"
        stage = "Learning to Train"
    else:
        expected = "20-25+ seconds"
        stage = "Training to Train"

    # Performance description
    if duration_score >= 4:
        performance = "excelling"
        message = f"{athlete_name} is performing above age expectations - fantastic progress!"
    elif duration_score == 3:
        performance = "on track"
        message = f"{athlete_name} is meeting age-appropriate expectations - great work!"
    else:
        performance = "building skills"
        message = f"{athlete_name} is developing foundational balance skills - every practice counts!"

    report = f"""Progress Report for {athlete_name}

Hello {athlete_name}'s Family!

We're excited to share {athlete_name}'s balance development progress. {athlete_name} (age {athlete_age}) has completed {assessment_count} balance assessments, and we're seeing {performance}.

Progress Overview:
{trend_analysis}

{message} At this age ({stage} stage), we expect balance duration of {expected}. {athlete_name}'s most recent test showed {hold_time:.1f} seconds.

What We're Seeing:
• Balance is a fundamental skill for all sports and physical activities
• Good balance helps with coordination, injury prevention, and confidence
• {athlete_name}'s effort and engagement have been excellent
• Continued practice will lead to steady improvement

Fun Balance Activities for Home:
• Freeze Dance - freeze on one foot when music stops (2-3 minutes daily)
• Balancing Act - stand on one foot while tossing a ball or balloon (1-2 minutes per leg)
• Line Walk - walk heel-to-toe on a line or curb with supervision
• Tree Pose Challenge - hold tree pose during TV commercials or while brushing teeth

These activities are fun, require no equipment, and can be done anywhere! Aim for 5-10 minutes of balance play most days.

Looking Ahead:
Balance skills develop rapidly at this age with consistent practice. We'll continue tracking progress and celebrating improvements. Thank you for supporting {athlete_name}'s athletic development!

Keep up the great work!

(AI-generated report temporarily unavailable - template-based analysis provided)"""

    return report
