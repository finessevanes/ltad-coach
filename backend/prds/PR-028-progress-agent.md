COMPLETED

---
id: BE-028
depends_on: [BE-024, BE-025, BE-026]
blocks: [BE-032]
---

# BE-028: Progress Agent (Claude Sonnet)

## Scope

**In Scope:**
- Generate parent-friendly progress reports
- Analyze historical trends (via compression)
- Use Claude Sonnet for quality
- Return formatted report

**Out of Scope:**
- Report delivery/email (BE-034)
- Report storage (BE-033)

## Technical Decisions

- **Model**: Claude Sonnet
- **Input**: Compressed history + current metrics
- **Output**: Parent-friendly report
- **Pattern**: Uses Compression Agent first
- **Location**: `app/services/agents/progress_agent.py`

## Acceptance Criteria

- [ ] Uses compressed history from BE-026
- [ ] Generates parent-friendly language
- [ ] Includes trend analysis
- [ ] References team and national context
- [ ] Prompt caching implemented

## Files to Create/Modify

- `app/services/agents/progress_agent.py` (create)

## Implementation Notes

**app/services/agents/progress_agent.py**:
```python
import anthropic
from app.core.config import settings
from app.prompts.static_context import get_static_context
from app.services.agents.compression_agent import compression_agent
from typing import Dict, Any, List

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

class ProgressAgent:
    """
    Generates parent-friendly progress reports using Claude Sonnet
    """

    def generate_report(
        self,
        current_metrics: Dict[str, Any],
        historical_assessments: List[Dict[str, Any]],
        athlete_name: str,
        athlete_age: int,
        team_rank: Dict[str, Any],
        national_percentile: int
    ) -> str:
        """
        Generate parent progress report

        Args:
            current_metrics: Most recent assessment metrics
            historical_assessments: Past assessments for trend analysis
            athlete_name: For personalization
            athlete_age: For context
            team_rank: Team ranking data
            national_percentile: National percentile (mock for MVP)

        Returns:
            Formatted parent report
        """
        # Compress history first
        if historical_assessments:
            history_summary = compression_agent.compress_history(historical_assessments)
        else:
            history_summary = "This is the first assessment."

        # Build prompt
        prompt = f"""
Generate a parent progress report for {athlete_name} (age {athlete_age}).

**Recent Assessment**:
- Duration: {current_metrics.get('durationSeconds', 0)} seconds
- Development Level: {current_metrics.get('durationScore', {}).get('label', 'N/A')} (Score {current_metrics.get('durationScore', {}).get('score', 'N/A')})
- Age Expectation: {current_metrics.get('durationScore', {}).get('expectationStatus', 'N/A')}

**Performance Context**:
- National Percentile: {national_percentile}th
- Team Standing: {team_rank.get('rank', 'N/A')} of {team_rank.get('totalAthletes', 'N/A')} athletes
- Stability Quality: {current_metrics.get('stabilityScore', 0)}/100

**Progress Summary**:
{history_summary}

Using the parent report template, create a warm, encouraging report that:
1. Explains current performance in parent-friendly terms
2. Contextualizes with national and team comparisons
3. Highlights progress trends (if available)
4. Provides 1-2 simple suggestions for at-home support

Keep language positive, clear, and free of technical jargon.
"""

        # Call Claude Sonnet
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1000,
            system=[
                {
                    "type": "text",
                    "text": get_static_context("progress"),
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

        report = response.content[0].text

        return report

# Global instance
progress_agent = ProgressAgent()
```

## Testing

```python
# Test with sample data
report = progress_agent.generate_report(
    current_metrics=test_metrics,
    historical_assessments=test_history,
    athlete_name="Test Athlete",
    athlete_age=12,
    team_rank={"rank": 3, "totalAthletes": 15},
    national_percentile=75
)

print(report)
assert "parent" in report.lower() or "your child" in report.lower()
```

## Estimated Complexity

**Size**: M (Medium - ~2 hours)
