---
id: BE-010
depends_on: [BE-009]
blocks: [BE-012]
status: ✅ COMPLETE
---

# BE-010: Assessment Agent

## Title
Implement Assessment Agent for single test feedback generation

## Scope

### In Scope
- Assessment Agent using Claude Sonnet
- Generate coach-friendly feedback from metrics
- Include specific coaching cues
- Reference age-appropriate expectations
- Use prompt caching for static context

### Out of Scope
- Historical trend analysis (BE-011)
- Parent report generation (BE-011)
- Team ranking (not implemented - removed from scope)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Model | Claude Sonnet | Better reasoning for coaching feedback |
| Caching | Static LTAD context | 90% cost reduction |
| Output Length | 150-200 words | Concise, actionable feedback |

## Acceptance Criteria

- [x] Generates feedback from single assessment metrics
- [x] Includes duration score with age comparison
- [x] Highlights strengths and areas for improvement
- [x] Provides specific, actionable coaching cues
- [x] Uses cached static context (LTAD, coaching cues)
- [x] Feedback is encouraging but honest
- [x] Handles edge cases (very low scores, perfect scores)

## Files to Create/Modify

```
backend/app/
├── agents/
│   └── assessment.py            # Assessment agent
└── services/
    └── analysis.py              # Integrate assessment agent (modify)
```

## Implementation Details

### agents/assessment.py
```python
from app.agents.client import openrouter
from app.config import settings
from app.prompts.static_context import FULL_STATIC_CONTEXT
from app.constants.scoring import (
    get_duration_score,
    get_age_expectation,
    DURATION_SCORE_LABELS,
)

async def generate_assessment_feedback(
    athlete_name: str,
    athlete_age: int,
    leg_tested: str,
    metrics: dict,
) -> str:
    """
    Generate coach-friendly feedback for a single assessment.

    Args:
        athlete_name: Athlete's name
        athlete_age: Athlete's age
        leg_tested: 'left' or 'right'
        metrics: Dict of calculated metrics

    Returns:
        Feedback string (150-200 words)
    """
    # Calculate derived values
    duration = metrics.get("duration_seconds", 0)
    score, label = get_duration_score(duration)
    age_comparison = get_age_expectation(athlete_age, score)

    # Build dynamic context with current assessment data
    dynamic_context = f"""
# Current Assessment Data

**Athlete**: {athlete_name}
**Age**: {athlete_age} years old
**Test**: One-Leg Balance ({leg_tested.capitalize()} leg)

## Results

**Duration Score**: {score}/5 ({label})
- Duration: {duration:.1f} seconds
- Age Expectation: {age_comparison.capitalize()} expected for age {athlete_age}

**Quality Metrics**:
- Sway Velocity: {metrics.get('sway_velocity', 0):.2f} cm/s
- Sway Std (X/Y): {metrics.get('sway_std_x', 0):.2f} cm / {metrics.get('sway_std_y', 0):.2f} cm
- Sway Path Length: {metrics.get('sway_path_length', 0):.2f} cm
- Arm Angle (L/R): {metrics.get('arm_angle_left', 0):.1f}° / {metrics.get('arm_angle_right', 0):.1f}°
- Arm Asymmetry: {metrics.get('arm_asymmetry_ratio', 1):.2f}
- Corrections: {metrics.get('corrections_count', 0)}
- Result: {metrics.get('failure_reason', 'Unknown').replace('_', ' ').title()}

"""

    # Add temporal breakdown if available
    if metrics.get('temporal'):
        temporal = metrics['temporal']
        dynamic_context += f"""
**Temporal Breakdown**:
First Third (0-{duration/3:.1f}s):
  - Arm Angle (L/R): {temporal['first_third']['arm_angle_left']:.1f}° / {temporal['first_third']['arm_angle_right']:.1f}°
  - Sway Velocity: {temporal['first_third']['sway_velocity']:.2f} cm/s
  - Corrections: {temporal['first_third']['corrections_count']}

Middle Third ({duration/3:.1f}-{2*duration/3:.1f}s):
  - Arm Angle (L/R): {temporal['middle_third']['arm_angle_left']:.1f}° / {temporal['middle_third']['arm_angle_right']:.1f}°
  - Sway Velocity: {temporal['middle_third']['sway_velocity']:.2f} cm/s
  - Corrections: {temporal['middle_third']['corrections_count']}

Last Third ({2*duration/3:.1f}-{duration:.1f}s):
  - Arm Angle (L/R): {temporal['last_third']['arm_angle_left']:.1f}° / {temporal['last_third']['arm_angle_right']:.1f}°
  - Sway Velocity: {temporal['last_third']['sway_velocity']:.2f} cm/s
  - Corrections: {temporal['last_third']['corrections_count']}

"""

    # Add 5-second timeline if available
    if metrics.get('five_second_segments'):
        segments = metrics['five_second_segments']
        segment_lines = []
        for seg in segments:
            segment_lines.append(
                f"{seg['start_time']:.0f}-{seg['end_time']:.0f}s: "
                f"velocity {seg['avg_velocity']:.1f} cm/s, "
                f"corrections {seg['corrections']}, "
                f"arms {seg['arm_angle_left']:.1f}°/{seg['arm_angle_right']:.1f}°"
            )
        dynamic_context += f"""
**Five-Second Timeline**:
{chr(10).join(segment_lines)}

"""

    # Add detected events if available
    if metrics.get('events'):
        events = metrics['events']
        event_lines = []
        for event in events:
            severity_str = f" ({event['severity']} severity)" if event.get('severity') else ""
            event_lines.append(
                f"- {event['time']:.1f}s: {event['type'].replace('_', ' ').title()}{severity_str} - {event['detail']}"
            )
        dynamic_context += f"""
**Events Detected**:
{chr(10).join(event_lines)}

"""

    # Determine focus areas based on metrics
    focus_areas = _identify_focus_areas(metrics)
    dynamic_context += f"""
**Detected Focus Areas**: {', '.join(focus_areas) if focus_areas else 'None significant'}
"""

    user_message = f"""
Based on the assessment data above, generate feedback for the coach about {athlete_name}'s one-leg balance test.

Follow the Assessment Feedback Format from the static context.

Key considerations:
1. The athlete is {athlete_age} years old - use age-appropriate language and expectations
2. Score of {score} is "{age_comparison}" expected for this age group
3. Focus on the specific metrics that stand out
4. Provide 2-3 specific coaching cues from the coaching cues reference
5. Keep the tone encouraging but honest

Generate the feedback now:
"""

    try:
        feedback = await openrouter.chat(
            model=settings.sonnet_model,
            messages=[{"role": "user", "content": user_message}],
            system=FULL_STATIC_CONTEXT,
            max_tokens=350,
            temperature=0.7,
            cache_control=True,  # Cache the static context
        )
        return feedback.strip()

    except Exception as e:
        print(f"Assessment agent error: {e}")
        # Fallback to template-based feedback
        return _generate_fallback_feedback(
            athlete_name, duration, score, label, age_comparison, metrics
        )


def _identify_focus_areas(metrics: dict) -> list:
    """Identify areas needing improvement based on metrics.

    Thresholds are based on research reference values and typical performance
    ranges for ages 5-13. All metrics are in real-world units (cm, degrees).
    """
    focus = []

    # Sway velocity in cm/s (high indicates reactive balancing)
    sway_velocity = metrics.get("sway_velocity", 0)
    if sway_velocity > 4.0:  # >4 cm/s suggests excessive movement
        focus.append("sway control")

    # Sway standard deviation in cm (high indicates poor positioning)
    sway_std_x = metrics.get("sway_std_x", 0)
    sway_std_y = metrics.get("sway_std_y", 0)
    avg_sway_std = (sway_std_x + sway_std_y) / 2
    if avg_sway_std > 2.5:  # >2.5 cm average std dev
        focus.append("overall stability")

    # Arm angles in degrees (high indicates compensation)
    arm_angle_left = abs(metrics.get("arm_angle_left", 0))
    arm_angle_right = abs(metrics.get("arm_angle_right", 0))
    avg_arm_angle = (arm_angle_left + arm_angle_right) / 2
    if avg_arm_angle > 20:  # Arms dropped >20° from horizontal
        focus.append("arm compensation")

    # Corrections count (frequent indicates instability)
    corrections = metrics.get("corrections_count", 0)
    if corrections > 5:
        focus.append("consistency")

    # Arm asymmetry ratio (imbalance detection)
    asymmetry = metrics.get("arm_asymmetry_ratio", 1)
    if asymmetry < 0.7 or asymmetry > 1.3:
        focus.append("bilateral symmetry")

    # Temporal degradation (fatigue detection)
    if metrics.get("temporal"):
        temporal = metrics["temporal"]
        first_velocity = temporal["first_third"]["sway_velocity"]
        last_velocity = temporal["last_third"]["sway_velocity"]
        # If velocity increases by >50% in last third
        if last_velocity > first_velocity * 1.5:
            focus.append("endurance/fatigue")

    return focus


def _generate_fallback_feedback(
    name: str,
    duration: float,
    score: int,
    label: str,
    age_comparison: str,
    metrics: dict
) -> str:
    """Generate simple feedback when AI fails"""
    sway_velocity = metrics.get("sway_velocity", 0)
    corrections = metrics.get("corrections_count", 0)
    avg_arm_angle = (abs(metrics.get("arm_angle_left", 0)) + abs(metrics.get("arm_angle_right", 0))) / 2

    feedback = f"""
**Score Summary**
{name} achieved a score of {score}/5 ({label}) with a duration of {duration:.1f} seconds. This is {age_comparison} the expected level for their age group.

**Performance Highlights**
"""

    if sway_velocity < 3.0:
        feedback += "- Good sway control (low movement speed)\n"
    if corrections <= 3:
        feedback += "- Minimal balance corrections needed\n"
    if avg_arm_angle < 10:
        feedback += "- Maintained good arm position throughout test\n"
    if duration >= 15:
        feedback += "- Solid balance duration achieved\n"

    feedback += """
**Areas for Improvement**
"""

    if sway_velocity > 4.0:
        feedback += "- Work on reducing reactive balancing (high sway velocity)\n"
    if corrections > 5:
        feedback += "- Practice maintaining consistent positioning\n"
    if avg_arm_angle > 20:
        feedback += "- Focus on keeping arms in T-position (currently dropped)\n"

    feedback += """
**Coaching Recommendations**
- Continue regular balance practice
- Focus on maintaining eye contact with a fixed point
- Practice on varied surfaces to build adaptability
"""

    return feedback.strip()
```

### Integration in services/analysis.py

```python
# Add to analyze_video function after metrics calculation:

from app.agents.assessment import generate_assessment_feedback

# Generate AI feedback
ai_feedback = await generate_assessment_feedback(
    athlete_name=athlete.name,
    athlete_age=athlete.age,
    leg_tested=leg_tested,
    metrics=metrics,
)

# Update assessment with results
await assessment_repo.update_with_results(
    assessment_id,
    metrics=metrics,
    raw_keypoints_url=keypoints_url,
    ai_feedback=ai_feedback,
)
```

## Example Output

```markdown
**Score Summary**
John achieved a score of 4/5 (Proficient) with a duration of 21.3 seconds, which meets the expected level for ages 10-11.

**Performance Highlights**
- Excellent balance duration, holding well past the 20-second mark
- Good stability score of 78/100 showing controlled positioning
- Minimal arm compensation throughout the test

**Areas for Improvement**
- Sway velocity of 2.4 cm/s indicates some reactive balancing - work on proactive stability
- 4 corrections during the test suggest room for more consistent control

**Coaching Recommendations**
- Have John practice with a focal point directly ahead to reduce reactive adjustments
- Try the "statue game" - hold positions for increasing durations
- Core strengthening exercises like planks will help reduce sway
```

## Estimated Complexity
**S** (Small) - 3 hours

## Testing Instructions

1. Test with various metric combinations:
```python
from app.agents.assessment import generate_assessment_feedback

# High performer
feedback = await generate_assessment_feedback(
    athlete_name="John Smith",
    athlete_age=12,
    leg_tested="left",
    metrics={
        "duration_seconds": 25,
        "sway_velocity": 1.8,
        "sway_std_x": 0.9,
        "sway_std_y": 1.2,
        "sway_path_length": 45.0,
        "arm_angle_left": 2.5,
        "arm_angle_right": 3.1,
        "arm_asymmetry_ratio": 0.95,
        "corrections_count": 2,
        "failure_reason": "time_complete",
        "temporal": {
            "first_third": {"arm_angle_left": 1.2, "arm_angle_right": 2.0, "sway_velocity": 2.1, "corrections_count": 1},
            "middle_third": {"arm_angle_left": 2.5, "arm_angle_right": 3.0, "sway_velocity": 1.7, "corrections_count": 0},
            "last_third": {"arm_angle_left": 3.8, "arm_angle_right": 4.2, "sway_velocity": 1.6, "corrections_count": 1},
        },
        "five_second_segments": [
            {"start_time": 0, "end_time": 5, "avg_velocity": 2.3, "corrections": 1, "arm_angle_left": 1.0, "arm_angle_right": 1.8, "sway_std_x": 1.1, "sway_std_y": 1.4},
            {"start_time": 5, "end_time": 10, "avg_velocity": 1.9, "corrections": 0, "arm_angle_left": 2.1, "arm_angle_right": 2.7, "sway_std_x": 0.9, "sway_std_y": 1.2},
            # ... more segments
        ],
        "events": [
            {"time": 3.2, "type": "stabilized", "detail": "Velocity dropped below 2 cm/s and maintained for 2+ seconds"}
        ],
    },
)
print(feedback)

# Low performer with fatigue
feedback_low = await generate_assessment_feedback(
    athlete_name="Sarah Johnson",
    athlete_age=10,
    leg_tested="right",
    metrics={
        "duration_seconds": 12.5,
        "sway_velocity": 5.8,
        "sway_std_x": 3.2,
        "sway_std_y": 2.9,
        "sway_path_length": 72.5,
        "arm_angle_left": 18.5,
        "arm_angle_right": 24.3,
        "arm_asymmetry_ratio": 0.76,
        "corrections_count": 11,
        "failure_reason": "foot_touchdown",
        "temporal": {
            "first_third": {"arm_angle_left": 8.2, "arm_angle_right": 12.1, "sway_velocity": 4.1, "corrections_count": 2},
            "middle_third": {"arm_angle_left": 15.8, "arm_angle_right": 22.5, "sway_velocity": 6.2, "corrections_count": 4},
            "last_third": {"arm_angle_left": 25.5, "arm_angle_right": 32.1, "sway_velocity": 7.1, "corrections_count": 5},
        },
        "events": [
            {"time": 2.8, "type": "flapping", "severity": "medium", "detail": "Arm velocity spike: 14.2 (threshold: 8.1)"},
            {"time": 7.3, "type": "correction_burst", "severity": "high", "detail": "6 corrections in 2s"},
        ],
    },
)
print(feedback_low)
```

2. Test edge cases:
   - 0 duration (test failed immediately)
   - Perfect score (30 seconds, minimal sway)
   - Missing temporal/events data (should handle gracefully)
3. Verify prompt caching is working (check logs for cache hits)
4. Validate temporal degradation detection in focus areas

## Notes
- Sonnet model provides better coaching insight than Haiku
- Cached context significantly reduces costs
- Fallback feedback ensures reliability
- Monitor output quality and adjust prompts as needed
