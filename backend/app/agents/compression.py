"""Compression Agent - Summarizes assessment history using Haiku.

This agent uses Claude Haiku to compress up to 12 assessments into a ~150 word
summary for use by the Progress Agent. This reduces context size and costs.
"""

import logging
from typing import List, Dict, Any
from app.agents.client import get_anthropic_client
from app.config import get_settings

logger = logging.getLogger(__name__)


async def compress_history(
    assessments: List[Dict[str, Any]],
    athlete_name: str,
    athlete_age: int,
) -> str:
    """Compress assessment history into a concise summary.

    Args:
        assessments: List of assessment dicts (up to 12, most recent first)
        athlete_name: Athlete's name for context
        athlete_age: Athlete's age for developmental context

    Returns:
        ~150 word summary of assessment history

    Raises:
        Exception: If compression fails (caller should handle with fallback)
    """
    if not assessments:
        return f"{athlete_name} has no prior assessment history."

    if len(assessments) == 1:
        return f"{athlete_name} has completed 1 prior assessment."

    try:
        settings = get_settings()
        client = get_anthropic_client()

        # Build assessment summary for compression
        assessment_data = _format_assessments_for_compression(assessments)

        # Compression prompt
        user_prompt = f"""Summarize the following {len(assessments)} One-Leg Balance Test assessments for {athlete_name} (age {athlete_age}).

Assessment History (most recent first):
{assessment_data}

Provide a 150-word summary covering:
1. **RECENT TREND (REQUIRED)**: Compare the average of the 3 MOST RECENT assessments (#1-3) to the average of the OLDER assessments (#4+). You MUST use ONE of these exact keywords in your first sentence:
   - "improving" if recent avg > older avg by 10%+
   - "declining" if recent avg < older avg by 10%+
   - "stable" if within ±10%
   - "variable" ONLY if inconsistent with no clear direction
2. Best and worst performances (duration, scores)
3. Consistent strengths or challenges across assessments
4. Any notable patterns in sway, arm position, or temporal performance

CRITICAL: The trend keyword must reflect RECENT performance (#1-3) vs OLDER performance (#4+). If recent performance is worse, use "declining" even if there was earlier improvement."""

        messages = [
            {"role": "user", "content": user_prompt}
        ]

        # Use Haiku for fast, cheap compression
        response = await client.chat(
            model=settings.haiku_model,
            messages=messages,
            temperature=0.3,  # Lower temperature for factual summary
            max_tokens=300,   # ~150 words
        )

        logger.info(f"Compressed {len(assessments)} assessments into summary for {athlete_name}")
        return response.strip()

    except Exception as e:
        logger.error(f"Failed to compress assessment history: {e}")
        # Return fallback summary
        return _generate_fallback_summary(assessments, athlete_name)


def _format_assessments_for_compression(assessments: List[Dict[str, Any]]) -> str:
    """Format assessments into readable text for compression.

    Args:
        assessments: List of assessment dicts

    Returns:
        Formatted string of assessment summaries
    """
    lines = []
    for i, assessment in enumerate(assessments, 1):
        metrics = assessment.get("metrics", {})

        # Skip assessments with missing metrics (prevents treating as zeros)
        if not metrics:
            logger.warning(f"Assessment {i} has no metrics - skipping from compression")
            continue

        # Extract key metrics
        hold_time = metrics.get("hold_time", 0)
        duration_score = metrics.get("duration_score", 0)
        sway_velocity = metrics.get("sway_velocity", 0)
        arm_asymmetry = metrics.get("arm_asymmetry_ratio", 0)
        success = metrics.get("success", False)

        # Format date if available
        created_at = assessment.get("created_at")
        date_str = created_at.strftime("%Y-%m-%d") if created_at else "Unknown date"

        # Build line
        line = (
            f"{i}. {date_str}: "
            f"{'Completed' if success else 'Failed'} - "
            f"{hold_time:.1f}s (Score: {duration_score}/5), "
            f"Sway: {sway_velocity:.2f}cm/s, "
            f"Arm asymmetry: {arm_asymmetry:.1f}°"
        )
        lines.append(line)

    return "\n".join(lines)


def _generate_fallback_summary(
    assessments: List[Dict[str, Any]],
    athlete_name: str,
) -> str:
    """Generate simple fallback summary without AI.

    Args:
        assessments: List of assessment dicts
        athlete_name: Athlete's name

    Returns:
        Basic statistical summary
    """
    # Calculate basic stats
    hold_times = [
        a.get("metrics", {}).get("hold_time", 0)
        for a in assessments
    ]
    scores = [
        a.get("metrics", {}).get("duration_score", 0)
        for a in assessments
    ]

    avg_hold = sum(hold_times) / len(hold_times) if hold_times else 0
    avg_score = sum(scores) / len(scores) if scores else 0
    best_time = max(hold_times) if hold_times else 0

    # Determine trend
    if len(hold_times) >= 3:
        recent_avg = sum(hold_times[:3]) / 3
        older_avg = sum(hold_times[3:]) / len(hold_times[3:]) if len(hold_times) > 3 else recent_avg
        if recent_avg > older_avg * 1.1:
            trend = "improving"
        elif recent_avg < older_avg * 0.9:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "developing"

    return (
        f"{athlete_name} has completed {len(assessments)} assessments with a {trend} trend. "
        f"Average hold time: {avg_hold:.1f}s (Score: {avg_score:.1f}/5). "
        f"Best performance: {best_time:.1f}s. "
        "Ready for detailed progress analysis."
    )
