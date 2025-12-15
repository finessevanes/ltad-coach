"""Bilateral assessment AI agent.

Generates coaching feedback comparing left vs right leg performance
in dual-leg balance assessments.
"""

import logging
from typing import Dict, Any
from app.agents.client import get_anthropic_client
from app.prompts.static_context import FULL_STATIC_CONTEXT
from app.config import get_settings

logger = logging.getLogger(__name__)


async def generate_bilateral_assessment_feedback(
    athlete_name: str,
    athlete_age: int,
    athlete_gender: str,
    left_leg_metrics: Dict[str, Any],
    right_leg_metrics: Dict[str, Any],
    bilateral_comparison: Dict[str, Any],
) -> str:
    """
    Generate bilateral coaching feedback comparing left vs right leg performance.

    Analyzes symmetry, identifies dominant leg, flags imbalances, and recommends
    corrective exercises based on LTAD framework and bilateral balance norms.

    Args:
        athlete_name: Name of the athlete
        athlete_age: Age in years (for LTAD context)
        athlete_gender: Gender (male/female) for pronoun usage
        left_leg_metrics: Dictionary with left leg metrics (includes temporal data)
        right_leg_metrics: Dictionary with right leg metrics (includes temporal data)
        bilateral_comparison: Dictionary with symmetry analysis from bilateral_comparison service

    Returns:
        Markdown-formatted coaching feedback (250-300 words)

    Raises:
        Exception: If Claude API call fails

    Example:
        >>> feedback = await generate_bilateral_assessment_feedback(
        ...     athlete_name="Sarah",
        ...     athlete_age=10,
        ...     athlete_gender="female",
        ...     left_leg_metrics={"hold_time": 25.3, "duration_score": 4, ...},
        ...     right_leg_metrics={"hold_time": 23.8, "duration_score": 4, ...},
        ...     bilateral_comparison={"overall_symmetry_score": 82.0, ...}
        ... )
        >>> assert "left leg" in feedback.lower()
        >>> assert "symmetry" in feedback.lower()
    """
    try:
        settings = get_settings()
        client = get_anthropic_client()

        # Map gender to pronouns
        pronoun_map = {
            "male": {"subject": "he", "object": "him", "possessive": "his"},
            "female": {"subject": "she", "object": "her", "possessive": "her"},
        }
        pronouns = pronoun_map.get(athlete_gender.lower(), {"subject": "they", "object": "them", "possessive": "their"})

        # Format bilateral summary for prompt
        bilateral_summary = _format_bilateral_summary(
            left_leg_metrics,
            right_leg_metrics,
            bilateral_comparison
        )

        # Build user prompt
        user_prompt = f"""Generate bilateral coaching feedback for {athlete_name} (age {athlete_age}).

{bilateral_summary}

Provide feedback in this structure:
1. **Performance Summary**: Briefly compare left vs right performance (2-3 sentences)
2. **Symmetry Analysis**: Discuss dominant leg and symmetry score (2-3 sentences)
3. **Key Observations**: Highlight temporal patterns or events (2-3 sentences)
4. **Recommendations**: Specific exercises to address any imbalances (2-3 sentences)

Requirements:
- Total 250-300 words
- Reference LTAD expectations for age {athlete_age}
- Flag significant imbalances (>20% difference) explicitly
- Use coach-friendly language (no jargon)
- Format as markdown with section headers
- Use pronouns ({pronouns['subject']}/{pronouns['object']}/{pronouns['possessive']}) naturally instead of repeating "{athlete_name}" throughout the feedback
"""

        messages = [
            {"role": "user", "content": user_prompt}
        ]

        # Call Claude Sonnet with static context
        response = await client.chat(
            model=settings.sonnet_model,
            messages=messages,
            system=FULL_STATIC_CONTEXT,  # Includes LTAD + bilateral benchmarks
            temperature=0.7,
            max_tokens=600,
        )

        feedback = response.strip()
        logger.info(f"Generated bilateral feedback for {athlete_name} (age {athlete_age})")
        return feedback

    except Exception as e:
        logger.error(f"Failed to generate bilateral feedback: {e}", exc_info=True)
        # Return fallback feedback
        return _generate_fallback_bilateral_feedback(
            athlete_name=athlete_name,
            athlete_age=athlete_age,
            athlete_gender=athlete_gender,
            left_leg_metrics=left_leg_metrics,
            right_leg_metrics=right_leg_metrics,
            bilateral_comparison=bilateral_comparison,
        )


def _format_bilateral_summary(
    left_leg_metrics: Dict[str, Any],
    right_leg_metrics: Dict[str, Any],
    bilateral_comparison: Dict[str, Any],
) -> str:
    """
    Format bilateral metrics into readable summary for LLM prompt.

    Includes basic metrics, LTAD scores, temporal data, and symmetry analysis.

    Args:
        left_leg_metrics: Left leg assessment metrics
        right_leg_metrics: Right leg assessment metrics
        bilateral_comparison: Bilateral comparison results

    Returns:
        Formatted summary string for LLM prompt
    """
    # Extract key metrics
    left_hold = left_leg_metrics.get("hold_time", 0)
    left_score = left_leg_metrics.get("duration_score", 0)
    left_sway = left_leg_metrics.get("sway_velocity", 0)
    left_corrections = left_leg_metrics.get("corrections_count", 0)

    right_hold = right_leg_metrics.get("hold_time", 0)
    right_score = right_leg_metrics.get("duration_score", 0)
    right_sway = right_leg_metrics.get("sway_velocity", 0)
    right_corrections = right_leg_metrics.get("corrections_count", 0)

    # Bilateral comparison
    dominant_leg = bilateral_comparison.get("dominant_leg", "unknown")
    duration_diff = bilateral_comparison.get("hold_time_difference", 0)
    duration_diff_pct = bilateral_comparison.get("hold_time_difference_pct", 0)
    symmetry_score = bilateral_comparison.get("overall_symmetry_score", 0)
    symmetry_assessment = bilateral_comparison.get("symmetry_assessment", "unknown")

    # Build summary
    summary = f"""=== LEFT LEG ===
Hold Time: {left_hold:.1f}s (LTAD Score: {left_score}/5)
Sway Velocity: {left_sway:.2f} cm/s
Corrections: {left_corrections}
"""

    # Add segmented metrics if present
    if "segmented_metrics" in left_leg_metrics:
        segmented = left_leg_metrics["segmented_metrics"]
        segments = segmented.get("segments", [])
        if segments:
            num_segs = len(segments)
            first_third = segments[:num_segs//3]
            last_third = segments[-num_segs//3:]
            first_avg = sum(s["avg_velocity"] for s in first_third) / len(first_third) if first_third else 0
            last_avg = sum(s["avg_velocity"] for s in last_third) / len(last_third) if last_third else 0
            summary += f"""Temporal Pattern:
  - First third: {first_avg:.2f} cm/s avg, {sum(s['corrections'] for s in first_third)} corrections
  - Last third: {last_avg:.2f} cm/s avg, {sum(s['corrections'] for s in last_third)} corrections
"""

    # Add events if present
    if "events" in left_leg_metrics and left_leg_metrics["events"]:
        summary += f"Events: {len(left_leg_metrics['events'])} detected ("
        summary += ", ".join([f"{e.get('type', 'unknown')} at {e.get('time', 0):.1f}s" for e in left_leg_metrics["events"][:3]])
        summary += ")\n"

    summary += f"""
=== RIGHT LEG ===
Hold Time: {right_hold:.1f}s (LTAD Score: {right_score}/5)
Sway Velocity: {right_sway:.2f} cm/s
Corrections: {right_corrections}
"""

    # Add segmented metrics for right leg
    if "segmented_metrics" in right_leg_metrics:
        segmented = right_leg_metrics["segmented_metrics"]
        segments = segmented.get("segments", [])
        if segments:
            num_segs = len(segments)
            first_third = segments[:num_segs//3]
            last_third = segments[-num_segs//3:]
            first_avg = sum(s["avg_velocity"] for s in first_third) / len(first_third) if first_third else 0
            last_avg = sum(s["avg_velocity"] for s in last_third) / len(last_third) if last_third else 0
            summary += f"""Temporal Pattern:
  - First third: {first_avg:.2f} cm/s avg, {sum(s['corrections'] for s in first_third)} corrections
  - Last third: {last_avg:.2f} cm/s avg, {sum(s['corrections'] for s in last_third)} corrections
"""

    # Add events if present
    if "events" in right_leg_metrics and right_leg_metrics["events"]:
        summary += f"Events: {len(right_leg_metrics['events'])} detected ("
        summary += ", ".join([f"{e.get('type', 'unknown')} at {e.get('time', 0):.1f}s" for e in right_leg_metrics["events"][:3]])
        summary += ")\n"

    summary += f"""
=== BILATERAL COMPARISON ===
Dominant Leg: {dominant_leg.upper()}
Duration Difference: {duration_diff:.1f}s ({duration_diff_pct:.1f}%)
Overall Symmetry Score: {symmetry_score:.1f}/100 ({symmetry_assessment})
"""

    # Add segment summary if present
    left_segmented = left_leg_metrics.get("segmented_metrics")
    right_segmented = right_leg_metrics.get("segmented_metrics")
    if left_segmented and right_segmented:
        left_segs = left_segmented.get("segments", [])
        right_segs = right_segmented.get("segments", [])
        if left_segs and right_segs:
            summary += f"\n=== TEMPORAL DETAIL ===\n"
            summary += f"Time Segments Available: {len(left_segs)} for left ({left_segmented.get('segment_duration', 1.0)}s each), "
            summary += f"{len(right_segs)} for right ({right_segmented.get('segment_duration', 1.0)}s each)\n"
            summary += "(Use these to identify fatigue patterns and temporal asymmetry)\n"

    return summary


def _generate_fallback_bilateral_feedback(
    athlete_name: str,
    athlete_age: int,
    athlete_gender: str,
    left_leg_metrics: Dict[str, Any],
    right_leg_metrics: Dict[str, Any],
    bilateral_comparison: Dict[str, Any],
) -> str:
    """Generate template-based fallback feedback if AI fails.

    Args:
        athlete_name: Athlete's name
        athlete_age: Athlete's age
        athlete_gender: Athlete's gender (for pronoun usage)
        left_leg_metrics: Left leg metrics
        right_leg_metrics: Right leg metrics
        bilateral_comparison: Bilateral comparison results

    Returns:
        Template-based bilateral feedback
    """
    left_hold = left_leg_metrics.get("hold_time", 0)
    left_score = left_leg_metrics.get("duration_score", 0)
    right_hold = right_leg_metrics.get("hold_time", 0)
    right_score = right_leg_metrics.get("duration_score", 0)

    dominant_leg = bilateral_comparison.get("dominant_leg", "balanced")
    duration_diff_pct = bilateral_comparison.get("hold_time_difference_pct", 0)
    symmetry_score = bilateral_comparison.get("overall_symmetry_score", 0)
    symmetry_assessment = bilateral_comparison.get("symmetry_assessment", "unknown")

    # Determine if imbalance is significant
    imbalance_flag = ""
    if duration_diff_pct > 20:
        imbalance_flag = f"\n\nIMPORTANT: Significant imbalance detected ({duration_diff_pct:.1f}% difference). Consider additional single-leg work on the weaker leg."

    feedback = f"""## Performance Summary

{athlete_name} (age {athlete_age}) completed the dual-leg balance assessment with {dominant_leg} leg dominance. Left leg: {left_hold:.1f}s (Score: {left_score}/5). Right leg: {right_hold:.1f}s (Score: {right_score}/5).

## Symmetry Analysis

Overall symmetry score: {symmetry_score:.1f}/100 ({symmetry_assessment}). The {dominant_leg} leg showed slightly better performance, which is common in youth athletes at this developmental stage.{imbalance_flag}

## Key Observations

Both legs demonstrated age-appropriate balance control. Temporal patterns indicate typical fatigue response. Continue monitoring bilateral development to ensure balanced neuromuscular growth.

## Recommendations

- Practice single-leg balance on both legs equally (3x30s per leg)
- Add core strengthening exercises (planks, dead bugs)
- If {dominant_leg} dominance persists, add 1-2 extra sets on weaker leg
- Retest in 4-6 weeks to track symmetry improvements

(AI-generated feedback temporarily unavailable - template-based analysis provided)
"""

    return feedback
