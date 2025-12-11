COMPLETED

---
id: BE-027
depends_on: [BE-024, BE-025]
blocks: [BE-029]
---

# BE-027: Assessment Agent (Claude Sonnet)

## Scope

**In Scope:**
- Generate coach-friendly feedback from single assessment
- Use Claude Sonnet for quality
- Include coaching cues and insights
- Return structured feedback

**Out of Scope:**
- Historical analysis (BE-028)
- Compression (BE-026)

## Technical Decisions

- **Model**: Claude Sonnet (high quality)
- **Input**: Current metrics only
- **Output**: Coach feedback with cues
- **Caching**: Static context cached
- **Location**: `app/services/agents/assessment_agent.py`

## Acceptance Criteria

- [ ] Generates feedback from current metrics
- [ ] Includes specific coaching cues
- [ ] References age expectations
- [ ] Uses Claude Sonnet
- [ ] Prompt caching implemented

## Files to Create/Modify

- `app/services/agents/assessment_agent.py` (create)

## Implementation Notes

**app/services/agents/assessment_agent.py**:
```python
import anthropic
from app.core.config import settings
from app.prompts.static_context import get_static_context, OUTPUT_TEMPLATE_COACH
from typing import Dict, Any

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

class AssessmentAgent:
    """
    Generates coach feedback from assessment metrics using Claude Sonnet
    """

    def generate_feedback(
        self,
        metrics: Dict[str, Any],
        athlete_age: int,
        team_rank: Dict[str, Any]
    ) -> str:
        """
        Generate coach-friendly assessment feedback

        Args:
            metrics: All calculated metrics
            athlete_age: For age-based expectations
            team_rank: Team ranking data

        Returns:
            Formatted feedback string
        """
        # Build dynamic context
        prompt = f"""
Generate coach feedback for this One-Leg Balance Test assessment:

**Athlete Age**: {athlete_age}

**Performance Metrics**:
- Duration: {metrics.get('durationSeconds', 0)} seconds
- Duration Score: {metrics.get('durationScore', {}).get('score', 'N/A')} ({metrics.get('durationScore', {}).get('label', 'N/A')})
- Age Expectation: {metrics.get('durationScore', {}).get('expectationStatus', 'N/A')} (expected score: {metrics.get('durationScore', {}).get('expectedScore', 'N/A')})

**Quality Metrics**:
- Stability Score: {metrics.get('stabilityScore', 0)}/100
- Sway Velocity: {metrics.get('swayVelocity', 0):.2f} cm/s
- Sway Std (X): {metrics.get('swayStdX', 0):.3f}, (Y): {metrics.get('swayStdY', 0):.3f}
- Arm Excursion (L/R): {metrics.get('armExcursionLeft', 0):.2f} / {metrics.get('armExcursionRight', 0):.2f}
- Corrections: {metrics.get('correctionsCount', 0)}
- Failure Reason: {metrics.get('failureReason', 'N/A')}

**Team Context**:
- Team Rank: {team_rank.get('rank', 'N/A')} of {team_rank.get('totalAthletes', 'N/A')}
- Team Percentile: {team_rank.get('percentile', 'N/A')}th

Using the template provided in your system context, generate specific, actionable feedback for the coach.
Focus on what the metrics reveal about form and balance, and provide 2-3 coaching cues.
"""

        # Call Claude Sonnet
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=800,
            system=[
                {
                    "type": "text",
                    "text": get_static_context("assessment"),
                    "cache_control": {"type": "ephemeral"}
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        feedback = response.content[0].text

        return feedback

# Global instance
assessment_agent = AssessmentAgent()
```

## Testing

```python
# Test with sample metrics
metrics = {
    "durationSeconds": 18.5,
    "stabilityScore": 75,
    "swayVelocity": 8.2,
    "swayStdX": 0.045,
    "swayStdY": 0.032,
    "armExcursionLeft": 0.12,
    "armExcursionRight": 0.15,
    "correctionsCount": 3,
    "failureReason": "foot_touchdown",
    "durationScore": {"score": 3, "label": "Competent", "expectationStatus": "below"}
}

feedback = assessment_agent.generate_feedback(
    metrics=metrics,
    athlete_age=11,
    team_rank={"rank": 4, "totalAthletes": 12, "percentile": 67}
)

print(feedback)
assert "coaching" in feedback.lower() or "cue" in feedback.lower()
```

## Estimated Complexity

**Size**: M (Medium - ~2-3 hours)
