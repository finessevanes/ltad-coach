COMPLETED

---
id: BE-026
depends_on: [BE-024, BE-025]
blocks: [BE-028]
---

# BE-026: Compression Agent (Claude Haiku)

## Scope

**In Scope:**
- Summarize historical assessments
- Reduce ~6000 tokens to ~150 tokens
- Use Claude Haiku for cost efficiency
- Return compressed summary

**Out of Scope:**
- Generating feedback (BE-027, BE-028)
- Storage of compressed data

## Technical Decisions

- **Model**: Claude Haiku (fast, cheap)
- **Input**: List of past assessments
- **Output**: ~150 token summary
- **Pattern**: Context compression
- **Location**: `app/services/agents/compression_agent.py`

## Acceptance Criteria

- [ ] Accepts list of assessments
- [ ] Returns compressed summary
- [ ] Uses Claude Haiku
- [ ] Includes prompt caching
- [ ] Token usage logged

## Files to Create/Modify

- `app/services/agents/__init__.py` (create)
- `app/services/agents/compression_agent.py` (create)
- `requirements.txt` (modify - add anthropic)

## Implementation Notes

**requirements.txt** (add):
```
anthropic==0.8.1
```

**app/services/agents/compression_agent.py**:
```python
import anthropic
from app.core.config import settings
from app.prompts.static_context import get_static_context
from typing import List, Dict, Any

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

class CompressionAgent:
    """
    Compresses historical assessment data using Claude Haiku

    Reduces token count for Progress Agent input
    """

    def compress_history(self, assessments: List[Dict[str, Any]]) -> str:
        """
        Compress assessment history to ~150 tokens

        Args:
            assessments: List of assessment dicts with metrics and dates

        Returns:
            Compressed summary string
        """
        if not assessments:
            return "No previous assessments available."

        # Format assessments for compression
        history_text = self._format_assessments(assessments)

        # Build prompt
        prompt = f"""
Summarize the following assessment history into 2-3 concise sentences capturing:
1. Overall trend (improving, stable, declining)
2. Key patterns in duration and quality metrics
3. Most recent performance level

Assessment History:
{history_text}

Provide ONLY the summary, nothing else.
"""

        # Call Claude Haiku with caching
        response = client.messages.create(
            model="claude-haiku-4-20250228",
            max_tokens=200,
            system=[
                {
                    "type": "text",
                    "text": get_static_context("compression"),
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

        summary = response.content[0].text

        return summary

    def _format_assessments(self, assessments: List[Dict[str, Any]]) -> str:
        """Format assessments for compression prompt"""
        lines = []

        for i, assessment in enumerate(assessments, 1):
            metrics = assessment.get("metrics", {})
            created = assessment.get("createdAt", "Unknown date")

            lines.append(
                f"{i}. {created}: "
                f"Duration {metrics.get('durationSeconds', 0)}s, "
                f"Stability {metrics.get('stabilityScore', 0)}/100, "
                f"Score {metrics.get('durationScore', {}).get('score', 'N/A')}"
            )

        return "\n".join(lines)

# Global instance
compression_agent = CompressionAgent()
```

## Testing

```python
# Test with sample assessments
assessments = [
    {
        "createdAt": "2025-01-01",
        "metrics": {
            "durationSeconds": 15,
            "stabilityScore": 65,
            "durationScore": {"score": 3}
        }
    },
    # ... more assessments
]

summary = compression_agent.compress_history(assessments)
print(summary)

# Verify summary is concise (<200 tokens)
assert len(summary.split()) < 150
```

## Estimated Complexity

**Size**: M (Medium - ~2 hours)
