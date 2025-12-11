---
id: BE-010
depends_on: [BE-009]
blocks: [BE-012]
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

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Model | Claude Sonnet | Better reasoning for coaching feedback |
| Caching | Static LTAD context | 90% cost reduction |
| Output Length | 150-200 words | Concise, actionable feedback |

## Acceptance Criteria

- [ ] Generates feedback from single assessment metrics
- [ ] Includes duration score with age comparison
- [ ] Highlights strengths and areas for improvement
- [ ] Provides specific, actionable coaching cues
- [ ] Uses cached static context (LTAD, coaching cues)
- [ ] Feedback is encouraging but honest
- [ ] Handles edge cases (very low scores, perfect scores)

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
    team_rank: tuple = None,  # (rank, total)
) -> str:
    """
    Generate coach-friendly feedback for a single assessment.

    Args:
        athlete_name: Athlete's name
        athlete_age: Athlete's age
        leg_tested: 'left' or 'right'
        metrics: Dict of calculated metrics
        team_rank: Optional (rank, total) for team context

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
- Stability Score: {metrics.get('stability_score', 0):.1f}/100
- Sway Velocity: {metrics.get('sway_velocity', 0):.2f} cm/s
- Arm Excursion (L/R): {metrics.get('arm_excursion_left', 0):.1f}° / {metrics.get('arm_excursion_right', 0):.1f}°
- Arm Asymmetry: {metrics.get('arm_asymmetry_ratio', 1):.2f}
- Corrections: {metrics.get('corrections_count', 0)}
- Result: {metrics.get('failure_reason', 'Unknown').replace('_', ' ').title()}

"""

    if team_rank:
        rank, total = team_rank
        dynamic_context += f"""
**Team Ranking**: #{rank} of {total} athletes (by stability score)
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

    Thresholds are based on research reference values, not athlete-specific
    normalization. These fixed thresholds work because metrics are stored
    in normalized pose coordinates (consistent frame-of-reference).
    """
    focus = []

    # Stability score is already scaled 0-100 using reference values
    stability = metrics.get("stability_score", 100)
    if stability < 60:
        focus.append("overall stability")

    # Sway velocity threshold based on research data (normalized pose coords/sec)
    sway_velocity = metrics.get("sway_velocity", 0)
    if sway_velocity > 0.02:  # Threshold in normalized pose coordinates
        focus.append("sway control")

    # Arm excursion in degrees (not normalized, directly measured)
    arm_excursion = (
        metrics.get("arm_excursion_left", 0) +
        metrics.get("arm_excursion_right", 0)
    ) / 2
    if arm_excursion > 30:  # High arm movement in degrees
        focus.append("arm compensation")

    corrections = metrics.get("corrections_count", 0)
    if corrections > 5:
        focus.append("consistency")

    asymmetry = metrics.get("arm_asymmetry_ratio", 1)
    if asymmetry < 0.7 or asymmetry > 1.3:
        focus.append("bilateral symmetry")

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
    stability = metrics.get("stability_score", 0)

    feedback = f"""
**Score Summary**
{name} achieved a score of {score}/5 ({label}) with a duration of {duration:.1f} seconds. This is {age_comparison} the expected level for their age group.

**Performance Highlights**
"""

    if stability >= 70:
        feedback += "- Good overall stability score\n"
    if metrics.get("corrections_count", 0) <= 2:
        feedback += "- Minimal corrections needed during the test\n"
    if duration >= 15:
        feedback += "- Solid balance duration achieved\n"

    feedback += """
**Areas for Improvement**
"""

    if stability < 70:
        feedback += "- Work on overall stability through core exercises\n"
    if metrics.get("sway_velocity", 0) > 2:
        feedback += "- Practice maintaining stillness with focused breathing\n"

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
from app.services.metrics import calculate_team_ranking

# Generate AI feedback
team_rank = await calculate_team_ranking(coach_id, athlete_id, metrics["stability_score"])

ai_feedback = await generate_assessment_feedback(
    athlete_name=athlete.name,
    athlete_age=athlete.age,
    leg_tested=leg_tested,
    metrics=metrics,
    team_rank=team_rank,
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
        "stability_score": 85,
        "sway_velocity": 1.5,
        "arm_excursion_left": 15,
        "arm_excursion_right": 12,
        "corrections_count": 2,
        "failure_reason": "time_complete",
    },
    team_rank=(1, 8),
)
print(feedback)
```

2. Test low performer scenario
3. Test edge cases (0 duration, perfect score)
4. Verify prompt caching is working (check logs)

## Notes
- Sonnet model provides better coaching insight than Haiku
- Cached context significantly reduces costs
- Fallback feedback ensures reliability
- Monitor output quality and adjust prompts as needed
