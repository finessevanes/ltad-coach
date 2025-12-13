---
id: BE-011
depends_on: [BE-009, BE-010]
blocks: [BE-013]
---

# BE-011: Progress Agent

## Title
Implement Progress Agent for historical trend analysis and parent reports

## Scope

### In Scope
- Progress Agent using Claude Sonnet
- Analyze compressed historical data
- Generate parent-friendly reports
- Include trend visualization descriptions

### Out of Scope
- Report storage and delivery (BE-013)
- Frontend report display (FE-013, FE-014)
- Team ranking (not implemented - removed from scope)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Model | Claude Sonnet | Better for narrative generation |
| Input | Compressed history | Token efficiency |
| Output | Parent-friendly language | Non-technical audience |

## Acceptance Criteria

- [ ] Generates parent-friendly progress report
- [ ] Uses compressed history from Compression Agent
- [ ] Includes trend analysis (improving/stable/declining)
- [ ] References team ranking appropriately
- [ ] Explains metrics in accessible language
- [ ] Provides developmental context (LTAD)
- [ ] Includes encouragement and next steps

## Files to Create/Modify

```
backend/app/
├── agents/
│   └── progress.py              # Progress agent
└── prompts/
    └── static_context.py        # Add parent report format (modify)
```

## Implementation Details

### prompts/static_context.py (additions)
```python
PARENT_REPORT_FORMAT = """
# Parent Report Format

Your response should be written for parents who may not understand athletic terminology.
Use warm, encouraging language while being honest about progress.

## Report Structure

### 1. Greeting & Summary (2-3 sentences)
- Personalized greeting
- Quick summary of overall progress
- Positive framing

### 2. What We Tested (1-2 sentences)
- Brief explanation of the balance test
- Why it matters for athletic development

### 3. How [Athlete Name] Did (3-4 sentences)
- Current score in accessible terms
- Comparison to age expectations
- Highlight 2-3 specific achievements

### 4. Progress Over Time (3-4 sentences)
- Trend description (improving/steady/varied)
- Specific improvements noted
- Areas of consistent strength

### 5. Among Peers (2 sentences)
- Team ranking context (without being comparative)
- Focus on individual journey

### 6. What's Next (2-3 sentences)
- Encouragement
- Simple activities parents can do at home
- What coaches will focus on

## Tone Guidelines
- Warm and supportive
- Avoid technical jargon
- Focus on effort and improvement, not just scores
- Celebrate small wins
- Frame challenges as opportunities
- End on a positive note

## Length
- 250-350 words total
- Should feel personal, not generic
"""

# Add to FULL_STATIC_CONTEXT
FULL_STATIC_CONTEXT = f"""
{LTAD_CONTEXT}

{COACHING_CUES}

{ASSESSMENT_OUTPUT_FORMAT}

{PARENT_REPORT_FORMAT}
"""
```

### agents/progress.py
```python
from typing import Optional
from app.agents.client import openrouter
from app.config import settings
from app.prompts.static_context import FULL_STATIC_CONTEXT
from app.constants.scoring import get_duration_score, DURATION_SCORE_LABELS

async def generate_progress_report(
    athlete_name: str,
    athlete_age: int,
    compressed_history: str,
    current_metrics: Optional[dict],
    assessment_count: int,
    progress_comparison: Optional[dict] = None,  # NEW: intra-individual progress
) -> str:
    """
    Generate parent-friendly progress report.

    Args:
        athlete_name: Athlete's name
        athlete_age: Athlete's age
        compressed_history: Compressed history from Compression Agent
        current_metrics: Most recent assessment metrics (or None)
        assessment_count: Total number of assessments
        progress_comparison: Percent change from rolling 3-test average (optional)

    Returns:
        Parent report string (250-350 words)
    """
    # Calculate current score if metrics available
    current_score_text = ""
    if current_metrics:
        duration = current_metrics.get("duration_seconds", 0)
        score, label = get_duration_score(duration)
        current_score_text = f"""
**Most Recent Assessment**:
- Duration: {duration:.1f} seconds
- Score: {score}/5 ({label})
- Stability: {current_metrics.get('stability_score', 0):.0f}/100
"""

    # Build progress comparison context (intra-individual)
    progress_text = ""
    if progress_comparison:
        progress_text = f"""
**Progress vs. Rolling Average (Last 3 Tests)**:
- Stability Score: {progress_comparison.get('stability_score_change', 'N/A')}% change
- Sway Velocity: {progress_comparison.get('sway_velocity_change', 'N/A')}% change
"""

    # Build context
    dynamic_context = f"""
# Progress Report Data

**Athlete**: {athlete_name}
**Age**: {athlete_age} years old
**Total Assessments**: {assessment_count}

## Compressed History Summary
{compressed_history}

{current_score_text}
{progress_text}

## LTAD Context for Age {athlete_age}
- Stage: {"FUNdamentals" if athlete_age <= 11 else "Learn to Train"}
- Expected Balance Level: {"Proficient (20+ seconds)" if athlete_age <= 11 else "Advanced (25+ seconds)"}
- Development Focus: {"Fundamental movement skills and enjoyment" if athlete_age <= 11 else "Skill development and technique"}
"""

    user_message = f"""
Generate a parent-friendly progress report for {athlete_name} based on the data above.

Key requirements:
1. Follow the Parent Report Format from the static context
2. Write as if speaking directly to {athlete_name}'s parent(s)
3. Explain the balance test simply - why it matters for athletic development
4. Focus on improvement and effort over absolute scores
5. Team ranking should emphasize individual progress, not competition
6. Include 1-2 simple activities parents can do at home with their child
7. Keep language warm, encouraging, and accessible

Generate the report now:
"""

    try:
        report = await openrouter.chat(
            model=settings.sonnet_model,
            messages=[{"role": "user", "content": user_message}],
            system=FULL_STATIC_CONTEXT,
            max_tokens=500,
            temperature=0.7,
            cache_control=True,
        )
        return report.strip()

    except Exception as e:
        print(f"Progress agent error: {e}")
        return _generate_fallback_report(
            athlete_name, athlete_age, assessment_count,
            current_metrics
        )


def _generate_fallback_report(
    name: str,
    age: int,
    count: int,
    metrics: Optional[dict],
) -> str:
    """Generate simple report when AI fails"""
    if metrics:
        duration = metrics.get("duration_seconds", 0)
        score, label = get_duration_score(duration)
        score_text = f"{score}/5 ({label})"
    else:
        score_text = "in progress"

    return f"""
Dear Parent/Guardian,

We're pleased to share an update on {name}'s athletic development progress!

**What We're Working On**
{name} has been practicing balance tests as part of our athletic development program. Balance is a fundamental skill that supports success in almost every sport and physical activity.

**How {name} Is Doing**
Over {count} assessment{"s" if count != 1 else ""}, {name} has been working hard to improve their balance skills. Their most recent score was {score_text}.

**What's Next**
We'll continue working on balance and coordination skills. At home, you can support {name}'s development with simple activities like:
- Standing on one foot while brushing teeth
- Walking along a line or curb (safely!)
- Playing catch while balancing

Thank you for supporting {name}'s athletic journey!

Best regards,
AI Coach Team
"""


async def analyze_trends(
    athlete_name: str,
    compressed_history: str,
) -> dict:
    """
    Analyze trends in athlete's history.

    Returns:
        Dict with trend analysis
    """
    prompt = f"""
    Analyze the following compressed assessment history for {athlete_name} and provide:
    1. Overall trend (one of: "improving", "stable", "declining", "varied")
    2. Main strength (one metric/area)
    3. Main growth area (one metric/area)
    4. Confidence level (1-5)

    History:
    {compressed_history}

    Respond in JSON format:
    {{"trend": "...", "strength": "...", "growth_area": "...", "confidence": N}}
    """

    try:
        response = await openrouter.chat(
            model=settings.haiku_model,  # Haiku for simple analysis
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            temperature=0.3,
        )

        import json
        return json.loads(response)

    except Exception:
        return {
            "trend": "varied",
            "strength": "perseverance",
            "growth_area": "consistency",
            "confidence": 2
        }
```

## Integration Example

```python
from app.agents.orchestrator import orchestrator
from app.agents.progress import generate_progress_report

# When generating a parent report:
routing = await orchestrator.route(
    request_type="parent_report",
    athlete_id=athlete.id,
    athlete_name=athlete.name,
    athlete_age=athlete.age,
    current_metrics=latest_assessment.metrics,
    coach_id=coach.id,
)

report_content = await generate_progress_report(
    athlete_name=athlete.name,
    athlete_age=athlete.age,
    compressed_history=routing["compressed_history"],
    current_metrics=latest_assessment.metrics,
    assessment_count=routing["assessment_count"],
)
```

## Example Output

```markdown
Dear Parent,

We're excited to share how well Sarah is progressing in her athletic development! Over the past month, she's shown wonderful dedication and real improvement in her balance skills.

**What We Tested**
Sarah completed our balance assessment, where she stands on one foot for up to 20 seconds. This test helps us understand her core stability and body control - skills that are essential for success in soccer, basketball, gymnastics, and many other activities.

**How Sarah Did**
Sarah held her balance for 18.5 seconds, earning a "Competent" rating (3 out of 5). For an 11-year-old, this is right on track with what we'd expect! She showed excellent focus and determination, keeping her eyes fixed forward throughout the test. Her stability score of 72 tells us she's developing great body control.

**Progress Over Time**
Looking back at Sarah's four assessments, we're seeing steady improvement. Her balance time has increased from 12 seconds in her first test to nearly 19 seconds now - that's a 50% improvement! She's particularly good at staying calm and not over-correcting.

**Among Her Peers**
Sarah ranks 4th among the 10 athletes in her group. More importantly, she's competing against her own previous scores and winning!

**What's Next**
Keep up the great work! At home, try having Sarah balance on one foot while you count to 20 together - make it a game! We'll continue working on building her core strength and consistency.

Best wishes,
Coach Davis
```

## Estimated Complexity
**S** (Small) - 3 hours

## Testing Instructions

1. Test report generation:
```python
from app.agents.progress import generate_progress_report

report = await generate_progress_report(
    athlete_name="Sarah Johnson",
    athlete_age=11,
    compressed_history="Sarah has completed 4 assessments over 6 weeks. Trend: improving. Duration improved from 12s to 18.5s. Stability consistently around 70-75. Strength: focus and determination. Area to improve: initial setup consistency.",
    current_metrics={
        "duration_seconds": 18.5,
        "stability_score": 72,
        "sway_velocity": 2.1,
    },
    assessment_count=4,
)
print(report)
```

2. Test trend analysis:
```python
from app.agents.progress import analyze_trends

trends = await analyze_trends(
    "Sarah Johnson",
    "Duration improved from 12s to 18.5s over 4 weeks..."
)
print(trends)  # {"trend": "improving", ...}
```

3. Test fallback report generation
4. Verify caching is working

## Notes
- Reports should feel personal, not templated
- Parent-friendly language is key
- Team rankings are sensitive - frame positively
- Home activities should be simple and fun
