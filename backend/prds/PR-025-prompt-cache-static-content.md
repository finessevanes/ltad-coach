---
id: BE-025
depends_on: [BE-020]
blocks: [BE-026, BE-027, BE-028]
---

# BE-025: Prompt Cache Static Content

## Scope

**In Scope:**
- Define static context for prompt caching
- LTAD framework definitions
- Benchmark tables
- Coaching cues library
- Output format templates

**Out of Scope:**
- Dynamic per-request data
- Agent implementations

## Technical Decisions

- **Caching Strategy**: Claude's native prompt caching
- **Content**: Static context that doesn't change per request
- **Format**: Python module with string constants
- **Location**: `app/prompts/static_context.py`

## Acceptance Criteria

- [ ] LTAD stage definitions documented
- [ ] Scoring interpretation rules defined
- [ ] Coaching cues organized by issue type
- [ ] Output format templates created
- [ ] All content from PRD Section 4.4 included

## Files to Create/Modify

- `app/prompts/__init__.py` (create)
- `app/prompts/static_context.py` (create)

## Implementation Notes

**app/prompts/static_context.py**:
```python
"""
Static context for AI agent prompt caching

This content is included in all agent prompts and cached by Claude
to reduce token costs by ~90%.
"""

LTAD_FRAMEWORK = """
# Long Term Athlete Development (LTAD) Framework

## Relevant Stages for Ages 10-14

### FUNdamentals (Ages 6-9, extending to 10-11)
- Overall development of fundamental movement skills
- Focus on balance, coordination, agility
- Fun and engagement emphasized
- Expected balance duration: 15-24 seconds (Competent to Proficient)

### Learn to Train (Ages 9-12, extending to 13-14)
- Building overall sports skills
- Structured training begins
- Testing and assessment appropriate
- Expected balance duration: 20+ seconds (Proficient to Advanced)
"""

ONE_LEG_BALANCE_PROTOCOL = """
# One-Leg Balance Test Protocol

## Test Setup
- Hands on hips (iliac crest)
- Eyes open, focused on fixed point ahead
- Barefoot on flat, stable surface
- Coach selects which leg to test

## Test Duration
- Maximum: 20 seconds
- Actual: Time until failure or 20s complete

## Failure Events
1. Foot Touchdown: Raised foot touches ground
2. Hands Leave Hips: Wrists move >10% away from hips
3. Support Foot Moves: Standing ankle displaces >15cm
4. Time Complete: 20 seconds reached (success)
"""

SCORING_MODEL = """
# Hybrid Scoring Model

## Tier 1: Duration Score (1-5)

| Score | Duration | Label      | Ages 10-11 | Ages 12-13 | Age 14 |
|-------|----------|------------|------------|------------|--------|
| 1     | 1-9s     | Beginning  | Below      | Below      | Below  |
| 2     | 10-14s   | Developing | Below      | Below      | Below  |
| 3     | 15-19s   | Competent  | Below      | Below      | Below  |
| 4     | 20-24s   | Proficient | Expected   | Below      | Below  |
| 5     | 25s+     | Advanced   | Above      | Expected   | Expected |

## Tier 2: Quality Metrics (Team-Relative)

- **Stability Score**: Composite (0-100), higher = better
- **Sway Velocity**: Hip movement speed (cm/s), lower = better
- **Arm Excursion**: Total arm movement, lower = better
- **Corrections Count**: Recovery attempts, fewer = better
"""

COACHING_CUES = """
# Coaching Cues by Issue Type

## High Sway (Unstable hip movement)
- "Focus on a single point at eye level"
- "Engage your core muscles throughout"
- "Try to stay as still as a statue"
- "Practice ankle strengthening exercises"

## Excessive Arm Movement
- "Keep hands firmly on hips"
- "Let balance come from your ankle, not your arms"
- "Practice with arms at sides first, then progress to hips"

## Frequent Corrections
- "Start with shorter durations (10s) and build up"
- "Practice proprioception drills (eyes closed, different surfaces)"
- "Strengthen supporting ankle with single-leg exercises"

## Short Duration (Early Failure)
- "This is a skill - improvement comes with practice"
- "Try 3-5 attempts per session, 3x per week"
- "Focus on form first, duration will follow"
"""

OUTPUT_TEMPLATE_COACH = """
# Coach Feedback Template

## Performance Summary
Duration: [X] seconds - Score [1-5]: [Label]
Age Comparison: [Meets/Above/Below] expected for age [X]
Team Ranking: [Rank] most stable of [Total] athletes

## Quality Analysis
- Stability Score: [0-100] ([Percentile]th percentile on team)
- Sway Velocity: [X] cm/s ([Low/Moderate/High])
- Arm Compensation: [Minimal/Moderate/Significant]
- Corrections: [X] recovery attempts

## Key Observations
[2-3 specific observations about form and control]

## Coaching Recommendations
[2-3 specific, actionable coaching cues]
"""

OUTPUT_TEMPLATE_PARENT = """
# Parent Report Template

## Progress Overview
Recent Assessment: [Date]
Balance Duration: [X] seconds
Development Level: [Label] (Score [1-5])

## How Is My Child Doing?
Your child [meets/exceeds/is developing toward] the expected level for age [X].

National Comparison: [Percentile]th percentile
Team Standing: [Rank] of [Total] athletes

## Progress Over Time
[Trend analysis - improving, maintaining, or needs attention]

## What This Means
[Parent-friendly interpretation of results and development trajectory]

## Next Steps
[1-2 simple suggestions for supporting development at home]
"""

def get_static_context(agent_type: str) -> str:
    """
    Get cached static context for agent type

    Args:
        agent_type: "assessment", "progress", or "compression"

    Returns:
        Complete static context string
    """
    base_context = f"""
{LTAD_FRAMEWORK}

{ONE_LEG_BALANCE_PROTOCOL}

{SCORING_MODEL}

{COACHING_CUES}
"""

    if agent_type == "assessment":
        return base_context + f"\n\n{OUTPUT_TEMPLATE_COACH}"
    elif agent_type == "progress":
        return base_context + f"\n\n{OUTPUT_TEMPLATE_PARENT}"
    elif agent_type == "compression":
        return base_context  # No template needed for compression
    else:
        return base_context
```

## Testing

```python
from app.prompts.static_context import get_static_context

context = get_static_context("assessment")
assert "LTAD" in context
assert "Coaching Cues" in context
assert len(context) > 1000  # Verify substantial content
```

## Estimated Complexity

**Size**: M (Medium - ~2 hours to document all content)
