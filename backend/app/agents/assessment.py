"""Assessment Agent - Generates coach-friendly feedback for single assessments.

This agent uses Claude Sonnet to analyze a single One-Leg Balance Test assessment
and provide actionable coaching feedback (150-200 words).
"""

import logging
from typing import Dict, Any, Optional, Tuple
from app.agents.client import get_openrouter_client
from app.prompts.static_context import FULL_STATIC_CONTEXT
from app.config import get_settings

logger = logging.getLogger(__name__)


async def generate_assessment_feedback(
    athlete_name: str,
    athlete_age: int,
    leg_tested: str,
    metrics: Dict[str, Any],
) -> str:
    """Generate coaching feedback for a single assessment.

    Args:
        athlete_name: Athlete's name
        athlete_age: Athlete's age for LTAD context
        leg_tested: Which leg was tested ("left" or "right")
        metrics: Assessment metrics dictionary

    Returns:
        150-200 word coaching feedback

    Raises:
        Exception: If feedback generation fails (caller should handle with fallback)
    """
    try:
        settings = get_settings()
        client = get_openrouter_client()

        # Identify focus areas
        focus_areas = _identify_focus_areas(metrics, athlete_age)

        # Build metrics summary
        metrics_summary = _format_metrics_for_prompt(metrics, athlete_age, leg_tested)

        # Build user prompt
        user_prompt = f"""Generate coaching feedback for {athlete_name} (age {athlete_age}) who just completed a One-Leg Balance Test on their {leg_tested} leg.

{metrics_summary}

Focus Areas Detected:
{chr(10).join(f'- {area}' for area in focus_areas)}

Provide feedback following the Assessment Feedback Format from the context. Remember:
- 150-200 words total
- Coach-to-coach professional tone
- Specific, actionable recommendations
- Encouraging but honest
- Reference age-appropriate LTAD expectations"""

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
            max_tokens=400,  # ~200 words
        )

        logger.info(f"Generated assessment feedback for {athlete_name}")
        return response.strip()

    except Exception as e:
        logger.error(f"Failed to generate assessment feedback: {e}")
        # Return fallback feedback
        return _generate_fallback_feedback(
            athlete_name=athlete_name,
            athlete_age=athlete_age,
            metrics=metrics,
            focus_areas=focus_areas,
        )


def _identify_focus_areas(metrics: Dict[str, Any], athlete_age: int) -> list[str]:
    """Identify key focus areas based on metrics.

    Args:
        metrics: Assessment metrics
        athlete_age: Athlete's age for context

    Returns:
        List of focus area strings
    """
    focus_areas = []

    # Duration analysis
    hold_time = metrics.get("hold_time", 0)
    duration_score = metrics.get("duration_score", 0)

    if duration_score <= 2:
        focus_areas.append(f"Low duration ({hold_time:.1f}s, Score {duration_score}/5) - needs foundational balance work")
    elif duration_score >= 4:
        focus_areas.append(f"Excellent duration ({hold_time:.1f}s, Score {duration_score}/5) - above age expectations")

    # Sway analysis
    sway_velocity = metrics.get("sway_velocity", 0)
    sway_std_x = metrics.get("sway_std_x", 0)
    sway_std_y = metrics.get("sway_std_y", 0)

    if sway_velocity > 3.0 or sway_std_x > 3.0 or sway_std_y > 3.0:
        focus_areas.append(f"High sway (velocity: {sway_velocity:.2f}cm/s) - work on stability")
    elif sway_velocity < 1.0:
        focus_areas.append(f"Excellent stability (sway: {sway_velocity:.2f}cm/s)")

    # Arm asymmetry
    arm_asymmetry = metrics.get("arm_asymmetry_ratio", 0)
    if arm_asymmetry > 15:
        focus_areas.append(f"Arm asymmetry ({arm_asymmetry:.1f}°) - check for imbalances")

    # Corrections
    corrections = metrics.get("corrections_count", 0)
    if corrections > 5:
        focus_areas.append(f"Frequent corrections ({corrections} events) - improve proprioception")

    # Temporal analysis
    temporal = metrics.get("temporal")
    if temporal:
        first_third = temporal.get("first_third_avg_sway", 0)
        last_third = temporal.get("last_third_avg_sway", 0)
        if last_third > first_third * 1.5:
            focus_areas.append("Performance declines in last third - build endurance")

    # If no specific issues found
    if not focus_areas:
        focus_areas.append(f"Solid performance (Score {duration_score}/5) - continue building skills")

    return focus_areas


def _format_metrics_for_prompt(
    metrics: Dict[str, Any],
    athlete_age: int,
    leg_tested: str,
) -> str:
    """Format metrics into readable prompt text.

    Args:
        metrics: Assessment metrics
        athlete_age: Athlete's age
        leg_tested: Which leg was tested

    Returns:
        Formatted metrics string
    """
    # Core metrics
    hold_time = metrics.get("hold_time", 0)
    duration_score = metrics.get("duration_score", 0)
    success = metrics.get("success", False)

    # Sway metrics
    sway_velocity = metrics.get("sway_velocity", 0)
    sway_std_x = metrics.get("sway_std_x", 0)
    sway_std_y = metrics.get("sway_std_y", 0)
    sway_path = metrics.get("sway_path_length", 0)
    corrections = metrics.get("corrections_count", 0)

    # Arm metrics
    arm_left = metrics.get("arm_angle_left", 0)
    arm_right = metrics.get("arm_angle_right", 0)
    arm_asymmetry = metrics.get("arm_asymmetry_ratio", 0)

    # Build summary
    lines = [
        "Assessment Metrics:",
        f"- Test Result: {'Success' if success else 'Failed'}",
        f"- Hold Time: {hold_time:.1f} seconds (LTAD Score: {duration_score}/5)",
        f"- Sway Velocity: {sway_velocity:.2f} cm/s",
        f"- Sway STD: X={sway_std_x:.2f}cm, Y={sway_std_y:.2f}cm",
        f"- Sway Path Length: {sway_path:.2f} cm",
        f"- Balance Corrections: {corrections} events",
        f"- Arm Angles: Left={arm_left:.1f}°, Right={arm_right:.1f}° (Asymmetry: {arm_asymmetry:.1f}°)",
    ]

    # Add temporal if available
    temporal = metrics.get("temporal")
    if temporal:
        first_third = temporal.get("first_third_avg_sway", 0)
        middle_third = temporal.get("middle_third_avg_sway", 0)
        last_third = temporal.get("last_third_avg_sway", 0)
        lines.append(f"- Temporal Sway: First={first_third:.2f}, Middle={middle_third:.2f}, Last={last_third:.2f} cm/s")

    return "\n".join(lines)


def _generate_fallback_feedback(
    athlete_name: str,
    athlete_age: int,
    metrics: Dict[str, Any],
    focus_areas: list[str],
) -> str:
    """Generate template-based fallback feedback.

    Args:
        athlete_name: Athlete's name
        athlete_age: Athlete's age
        metrics: Assessment metrics
        focus_areas: Identified focus areas

    Returns:
        Template-based feedback
    """
    hold_time = metrics.get("hold_time", 0)
    duration_score = metrics.get("duration_score", 0)
    sway_velocity = metrics.get("sway_velocity", 0)

    # Determine age expectation
    if athlete_age <= 7:
        expected = "5-10 seconds"
    elif athlete_age <= 9:
        expected = "10-15 seconds"
    elif athlete_age <= 11:
        expected = "15-20 seconds"
    else:
        expected = "20-25+ seconds"

    # Performance level
    if duration_score >= 4:
        performance = "excellent"
        tone = "Keep up the great work!"
    elif duration_score == 3:
        performance = "solid"
        tone = "You're on the right track!"
    else:
        performance = "developing"
        tone = "Let's build on this foundation!"

    feedback = f"""Assessment Feedback for {athlete_name}

{athlete_name} (age {athlete_age}) completed the One-Leg Balance Test with a {performance} performance: {hold_time:.1f} seconds (Score: {duration_score}/5). For this age group, we expect {expected}.

Key Observations:
{chr(10).join(f'• {area}' for area in focus_areas[:3])}
• Sway velocity: {sway_velocity:.2f} cm/s

Coaching Recommendations:
• Practice daily balance exercises (1-2 minutes)
• Focus on a fixed point at eye level
• Engage core muscles during balance activities
• Try standing on unstable surfaces (foam pad, balance board)

{tone} Balance improves quickly with consistent practice. Every second counts toward building better athletic skills.

(AI-generated feedback temporarily unavailable - template-based analysis provided)"""

    return feedback
