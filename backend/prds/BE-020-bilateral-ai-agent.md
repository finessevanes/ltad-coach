---
id: BE-020
status: 🔵 READY FOR DEVELOPMENT
depends_on: [BE-016, BE-017]
blocks: []
---

# BE-020: Bilateral Assessment AI Agent

## Title
Create AI agent to generate bilateral coaching feedback comparing left vs right leg performance

## Scope

### In Scope
- Create `bilateral_assessment.py` agent module
- Implement `generate_bilateral_assessment_feedback()` function
- Format bilateral summary for LLM prompt (includes temporal data)
- Call Claude Sonnet via OpenRouter for bilateral feedback
- Compare left vs right performance with symmetry analysis
- Flag significant imbalances (>20% difference)
- Recommend exercises to address asymmetry
- Reference LTAD age expectations
- Update orchestrator to route "bilateral_assessment" requests
- 250-300 word structured feedback

### Out of Scope
- Static context for bilateral benchmarks (BE-021 - can use placeholder)
- Data model definitions (BE-016)
- Bilateral comparison calculation (BE-017)
- API endpoint integration (BE-019 - already handles orchestrator call)
- Frontend feedback display (FE-019)
- Parent report generation (uses different agent)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM Model | Claude Sonnet 3.5 | Balanced quality/cost for coaching feedback; same as single-leg agent |
| Feedback Length | 250-300 words | Optimal for coach readability without overwhelming detail |
| Prompt Structure | Bilateral summary + structured request | Consistent with existing assessment agent pattern |
| Temporal Data Inclusion | Include 5-second segments if present | Enables fatigue pattern analysis ("left fatigued after 15s") |
| System Context | LTAD + Bilateral benchmarks | Provides age norms and asymmetry thresholds |
| Error Handling | Log and propagate exception | Allow API layer to decide whether to block response |
| Temperature | 0.7 | Balance between consistency and natural language variation |

## Acceptance Criteria

- [ ] `generate_bilateral_assessment_feedback()` accepts athlete info and bilateral metrics
- [ ] Formats bilateral summary with left/right comparison
- [ ] Includes temporal data (thirds, 5-second segments, events) in prompt
- [ ] Calls Claude Sonnet via OpenRouter
- [ ] Returns 250-300 word structured feedback
- [ ] Identifies dominant leg explicitly
- [ ] Flags imbalances >20% duration difference
- [ ] Recommends corrective exercises for asymmetry
- [ ] References LTAD expectations for athlete age
- [ ] Orchestrator routes "bilateral_assessment" request type
- [ ] Type hints and docstring on function
- [ ] Handles API errors gracefully (logs and raises)

## Files to Create/Modify

```
backend/app/agents/
├── bilateral_assessment.py    # NEW: Bilateral feedback agent
└── orchestrator.py            # MODIFY: Add bilateral routing
```

## Implementation Details

### 1. Create `bilateral_assessment.py` Agent

**File**: `backend/app/agents/bilateral_assessment.py`

```python
"""Bilateral assessment AI agent."""

import logging
from typing import Dict, Any
from app.services.openrouter import get_openrouter_client
from app.prompts.static_context import FULL_STATIC_CONTEXT, BILATERAL_BALANCE_CONTEXT
from app.config import settings

logger = logging.getLogger(__name__)


async def generate_bilateral_assessment_feedback(
    athlete_name: str,
    athlete_age: int,
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
        left_leg_metrics: Dictionary with left leg metrics (includes temporal data)
        right_leg_metrics: Dictionary with right leg metrics (includes temporal data)
        bilateral_comparison: Dictionary with symmetry analysis from bilateral_comparison service

    Returns:
        Markdown-formatted coaching feedback (250-300 words)

    Raises:
        Exception: If OpenRouter API call fails

    Example:
        >>> feedback = await generate_bilateral_assessment_feedback(
        ...     athlete_name="Sarah",
        ...     athlete_age=10,
        ...     left_leg_metrics={"hold_time": 25.3, "duration_score": 4, ...},
        ...     right_leg_metrics={"hold_time": 23.8, "duration_score": 4, ...},
        ...     bilateral_comparison={"overall_symmetry_score": 82.0, ...}
        ... )
        >>> assert "left leg" in feedback.lower()
        >>> assert "symmetry" in feedback.lower()
    """
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
"""

    # Call Claude Sonnet
    try:
        client = get_openrouter_client()
        response = await client.chat(
            model=settings.SONNET_MODEL,  # e.g., "anthropic/claude-3.5-sonnet"
            messages=[{"role": "user", "content": user_prompt}],
            system=FULL_STATIC_CONTEXT,  # Includes LTAD + bilateral benchmarks
            temperature=0.7,
            max_tokens=600,
        )

        feedback = response.strip()
        logger.info(f"Generated bilateral feedback for {athlete_name} (age {athlete_age})")
        return feedback

    except Exception as e:
        logger.error(f"Failed to generate bilateral feedback: {e}", exc_info=True)
        raise  # Propagate to API layer


def _format_bilateral_summary(
    left_leg_metrics: Dict[str, Any],
    right_leg_metrics: Dict[str, Any],
    bilateral_comparison: Dict[str, Any],
) -> str:
    """
    Format bilateral metrics into readable summary for LLM prompt.

    Includes basic metrics, LTAD scores, temporal data, and symmetry analysis.
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
    duration_diff = bilateral_comparison.get("duration_difference", 0)
    duration_diff_pct = bilateral_comparison.get("duration_difference_pct", 0)
    symmetry_score = bilateral_comparison.get("overall_symmetry_score", 0)
    symmetry_assessment = bilateral_comparison.get("symmetry_assessment", "unknown")

    # Build summary
    summary = f"""=== LEFT LEG ===
Hold Time: {left_hold:.1f}s (LTAD Score: {left_score}/5)
Sway Velocity: {left_sway:.2f} cm/s
Corrections: {left_corrections}
"""

    # Add temporal data if present
    if "temporal" in left_leg_metrics:
        temporal = left_leg_metrics["temporal"]
        summary += f"""Temporal Analysis:
  - First third: {temporal.get('first_third', {}).get('sway_velocity', 'N/A')} cm/s sway, {temporal.get('first_third', {}).get('corrections_count', 'N/A')} corrections
  - Middle third: {temporal.get('middle_third', {}).get('sway_velocity', 'N/A')} cm/s sway, {temporal.get('middle_third', {}).get('corrections_count', 'N/A')} corrections
  - Last third: {temporal.get('last_third', {}).get('sway_velocity', 'N/A')} cm/s sway, {temporal.get('last_third', {}).get('corrections_count', 'N/A')} corrections
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

    # Add temporal data for right leg
    if "temporal" in right_leg_metrics:
        temporal = right_leg_metrics["temporal"]
        summary += f"""Temporal Analysis:
  - First third: {temporal.get('first_third', {}).get('sway_velocity', 'N/A')} cm/s sway, {temporal.get('first_third', {}).get('corrections_count', 'N/A')} corrections
  - Middle third: {temporal.get('middle_third', {}).get('sway_velocity', 'N/A')} cm/s sway, {temporal.get('middle_third', {}).get('corrections_count', 'N/A')} corrections
  - Last third: {temporal.get('last_third', {}).get('sway_velocity', 'N/A')} cm/s sway, {temporal.get('last_third', {}).get('corrections_count', 'N/A')} corrections
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

    # Add 5-second segment summary if present
    left_segments = left_leg_metrics.get("five_second_segments", [])
    right_segments = right_leg_metrics.get("five_second_segments", [])
    if left_segments and right_segments:
        summary += f"\n=== TEMPORAL DETAIL ===\n"
        summary += f"5-Second Segments Available: {len(left_segments)} for left, {len(right_segments)} for right\n"
        summary += "(Use these to identify fatigue patterns and temporal asymmetry)\n"

    return summary
```

### 2. Update Orchestrator

**File**: `backend/app/agents/orchestrator.py`

**Add to `RequestType` enum** (if using Literal):

```python
from typing import Literal

RequestType = Literal[
    "assessment_feedback",
    "bilateral_assessment",  # NEW
    "parent_report",
    "progress_trends"
]
```

**Add routing in `generate_feedback()` method**:

```python
async def generate_feedback(
    self,
    request_type: RequestType,
    **kwargs
) -> str:
    """
    Route feedback generation to appropriate agent.

    Args:
        request_type: Type of feedback to generate
        **kwargs: Agent-specific parameters

    Returns:
        Generated feedback text

    Raises:
        ValueError: If request_type is unknown
        Exception: If agent call fails
    """
    if request_type == "assessment_feedback":
        from app.agents.assessment import generate_assessment_feedback
        return await generate_assessment_feedback(
            athlete_name=kwargs["athlete_name"],
            athlete_age=kwargs["athlete_age"],
            metrics=kwargs["metrics"],
        )

    elif request_type == "bilateral_assessment":
        # NEW: Route to bilateral agent
        from app.agents.bilateral_assessment import generate_bilateral_assessment_feedback
        return await generate_bilateral_assessment_feedback(
            athlete_name=kwargs["athlete_name"],
            athlete_age=kwargs["athlete_age"],
            left_leg_metrics=kwargs["left_leg_metrics"],
            right_leg_metrics=kwargs["right_leg_metrics"],
            bilateral_comparison=kwargs["bilateral_comparison"],
        )

    elif request_type == "parent_report":
        from app.agents.parent_report import generate_parent_report
        return await generate_parent_report(...)

    elif request_type == "progress_trends":
        from app.agents.progress import generate_progress_trends
        return await generate_progress_trends(...)

    else:
        raise ValueError(f"Unknown request_type: {request_type}")
```

## API Specification

Not applicable - this is an internal agent called by the orchestrator.

## Environment Variables

Uses existing OpenRouter configuration:
- `OPENROUTER_API_KEY` (required)
- `SONNET_MODEL` (e.g., "anthropic/claude-3.5-sonnet")

## Estimated Complexity

**M** (Medium) - 4 hours

**Breakdown**:
- Create agent module and function: 1 hour
- Implement bilateral summary formatting: 1 hour
- Add orchestrator routing: 0.5 hours
- Testing and prompt tuning: 1.5 hours

## Testing Instructions

### 1. Unit Tests

Create test file: `backend/tests/test_bilateral_assessment_agent.py`

**Test feedback generation:**

```python
import pytest
from backend.app.agents.bilateral_assessment import generate_bilateral_assessment_feedback


@pytest.mark.asyncio
async def test_generate_bilateral_feedback(mock_openrouter):
    """Test bilateral feedback generation with mock LLM."""
    left_metrics = {
        "hold_time": 25.3,
        "duration_score": 4,
        "sway_velocity": 1.8,
        "corrections_count": 8,
        "arm_angle_left": 8.5,
        "arm_angle_right": 12.3,
        "temporal": {
            "first_third": {"sway_velocity": 1.5, "corrections_count": 2},
            "middle_third": {"sway_velocity": 1.8, "corrections_count": 3},
            "last_third": {"sway_velocity": 2.1, "corrections_count": 3},
        },
        "events": [
            {"time": 3.2, "type": "flapping", "severity": "medium", "detail": "Rapid arm movements"}
        ]
    }

    right_metrics = {
        "hold_time": 23.8,
        "duration_score": 4,
        "sway_velocity": 2.0,
        "corrections_count": 10,
        "arm_angle_left": 9.0,
        "arm_angle_right": 11.5,
        "temporal": {
            "first_third": {"sway_velocity": 1.7, "corrections_count": 3},
            "middle_third": {"sway_velocity": 2.0, "corrections_count": 4},
            "last_third": {"sway_velocity": 2.3, "corrections_count": 3},
        },
    }

    bilateral_comparison = {
        "duration_difference": 1.5,
        "duration_difference_pct": 5.9,
        "dominant_leg": "left",
        "overall_symmetry_score": 82.0,
        "symmetry_assessment": "good",
    }

    # Mock OpenRouter response
    mock_openrouter.return_value = """## Performance Summary
Left leg outperformed right leg slightly (25.3s vs 23.8s).

## Symmetry Analysis
Good overall symmetry (82/100) with left leg dominant.

## Key Observations
Both legs showed increasing sway over time, indicating fatigue.

## Recommendations
Practice single-leg balance holds to improve weaker (right) leg."""

    feedback = await generate_bilateral_assessment_feedback(
        athlete_name="Sarah",
        athlete_age=10,
        left_leg_metrics=left_metrics,
        right_leg_metrics=right_metrics,
        bilateral_comparison=bilateral_comparison,
    )

    assert "left leg" in feedback.lower()
    assert "right leg" in feedback.lower()
    assert "symmetry" in feedback.lower()
    assert len(feedback.split()) > 50  # At least 50 words
```

**Test bilateral summary formatting:**

```python
from backend.app.agents.bilateral_assessment import _format_bilateral_summary


def test_format_bilateral_summary():
    """Test formatting of bilateral metrics summary."""
    left_metrics = {
        "hold_time": 25.3,
        "duration_score": 4,
        "sway_velocity": 1.8,
        "corrections_count": 8,
        "temporal": {
            "first_third": {"sway_velocity": 1.5, "corrections_count": 2},
            "middle_third": {"sway_velocity": 1.8, "corrections_count": 3},
            "last_third": {"sway_velocity": 2.1, "corrections_count": 3},
        },
    }

    right_metrics = {
        "hold_time": 23.8,
        "duration_score": 4,
        "sway_velocity": 2.0,
        "corrections_count": 10,
        "temporal": {
            "first_third": {"sway_velocity": 1.7, "corrections_count": 3},
            "middle_third": {"sway_velocity": 2.0, "corrections_count": 4},
            "last_third": {"sway_velocity": 2.3, "corrections_count": 3},
        },
    }

    bilateral_comparison = {
        "duration_difference": 1.5,
        "duration_difference_pct": 5.9,
        "dominant_leg": "left",
        "overall_symmetry_score": 82.0,
        "symmetry_assessment": "good",
    }

    summary = _format_bilateral_summary(left_metrics, right_metrics, bilateral_comparison)

    assert "LEFT LEG" in summary
    assert "RIGHT LEG" in summary
    assert "BILATERAL COMPARISON" in summary
    assert "25.3s" in summary
    assert "23.8s" in summary
    assert "82.0/100" in summary
    assert "good" in summary
    assert "Temporal Analysis" in summary
```

**Test orchestrator routing:**

```python
@pytest.mark.asyncio
async def test_orchestrator_bilateral_routing(mock_openrouter):
    """Test that orchestrator routes bilateral_assessment correctly."""
    from backend.app.agents.orchestrator import get_orchestrator

    orchestrator = get_orchestrator()

    mock_openrouter.return_value = "Bilateral feedback"

    feedback = await orchestrator.generate_feedback(
        request_type="bilateral_assessment",
        athlete_name="Sarah",
        athlete_age=10,
        left_leg_metrics={"hold_time": 25.3, "duration_score": 4},
        right_leg_metrics={"hold_time": 23.8, "duration_score": 4},
        bilateral_comparison={"overall_symmetry_score": 82.0},
    )

    assert feedback == "Bilateral feedback"
```

### 2. Integration Tests

**Test with real OpenRouter API:**

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_bilateral_feedback_real_api():
    """Test bilateral feedback with real OpenRouter API (requires API key)."""
    left_metrics = {
        "hold_time": 25.3,
        "duration_score": 4,
        "sway_velocity": 1.8,
        "corrections_count": 8,
        "temporal": {
            "first_third": {"sway_velocity": 1.5, "corrections_count": 2},
            "middle_third": {"sway_velocity": 1.8, "corrections_count": 3},
            "last_third": {"sway_velocity": 2.1, "corrections_count": 3},
        },
    }

    right_metrics = {
        "hold_time": 23.8,
        "duration_score": 4,
        "sway_velocity": 2.0,
        "corrections_count": 10,
        "temporal": {
            "first_third": {"sway_velocity": 1.7, "corrections_count": 3},
            "middle_third": {"sway_velocity": 2.0, "corrections_count": 4},
            "last_third": {"sway_velocity": 2.3, "corrections_count": 3},
        },
    }

    bilateral_comparison = {
        "duration_difference": 1.5,
        "duration_difference_pct": 5.9,
        "dominant_leg": "left",
        "overall_symmetry_score": 82.0,
        "symmetry_assessment": "good",
    }

    feedback = await generate_bilateral_assessment_feedback(
        athlete_name="Sarah",
        athlete_age=10,
        left_leg_metrics=left_metrics,
        right_leg_metrics=right_metrics,
        bilateral_comparison=bilateral_comparison,
    )

    # Verify structure
    assert "##" in feedback  # Has markdown headers
    assert len(feedback.split()) >= 200  # At least 200 words
    assert len(feedback.split()) <= 350  # Not too long

    # Verify content
    assert "sarah" in feedback.lower()
    assert any(word in feedback.lower() for word in ["left", "right"])
    assert any(word in feedback.lower() for word in ["symmetry", "balance", "dominant"])
```

### 3. Manual Testing

**Test in Python REPL:**

```bash
cd backend
source venv/bin/activate
python
```

```python
import asyncio
from app.agents.bilateral_assessment import generate_bilateral_assessment_feedback

left_metrics = {
    "hold_time": 25.3,
    "duration_score": 4,
    "sway_velocity": 1.8,
    "corrections_count": 8,
    "temporal": {
        "first_third": {"sway_velocity": 1.5, "corrections_count": 2},
        "middle_third": {"sway_velocity": 1.8, "corrections_count": 3},
        "last_third": {"sway_velocity": 2.1, "corrections_count": 3},
    },
    "events": [
        {"time": 3.2, "type": "flapping", "severity": "medium", "detail": "Rapid arm movements"}
    ]
}

right_metrics = {
    "hold_time": 23.8,
    "duration_score": 4,
    "sway_velocity": 2.0,
    "corrections_count": 10,
    "temporal": {
        "first_third": {"sway_velocity": 1.7, "corrections_count": 3},
        "middle_third": {"sway_velocity": 2.0, "corrections_count": 4},
        "last_third": {"sway_velocity": 2.3, "corrections_count": 3},
    },
}

bilateral_comparison = {
    "duration_difference": 1.5,
    "duration_difference_pct": 5.9,
    "dominant_leg": "left",
    "overall_symmetry_score": 82.0,
    "symmetry_assessment": "good",
}

feedback = asyncio.run(generate_bilateral_assessment_feedback(
    athlete_name="Sarah",
    athlete_age=10,
    left_leg_metrics=left_metrics,
    right_leg_metrics=right_metrics,
    bilateral_comparison=bilateral_comparison,
))

print(feedback)
print(f"\nWord count: {len(feedback.split())}")
```

**Expected output**:
- Structured markdown with section headers
- 250-300 words
- Mentions left/right comparison
- Identifies dominant leg
- Discusses symmetry score
- Provides corrective exercises

## Notes

### Design Rationale

**Why separate agent instead of extending assessment agent?**

Considered:
```python
# Rejected approach
async def generate_assessment_feedback(
    ...,
    bilateral: bool = False,
    right_leg_metrics: Optional[Dict] = None
):
    if bilateral:
        # bilateral logic
    else:
        # single-leg logic
```

Rejected because:
- Violates Single Responsibility Principle
- Complex conditional logic in prompts
- Harder to test edge cases
- Different output structures (single vs comparison)

**Chosen approach**: Separate agents provide:
- Clear separation of concerns
- Easier prompt tuning (each agent optimized independently)
- Better testability
- Simpler orchestrator routing

**Why include temporal data in prompt?**

Temporal data enables AI to identify patterns like:
- "Both legs showed correction bursts around 10-second mark" (core fatigue)
- "Left leg fatigued 20% faster than right leg after 15 seconds" (asymmetric endurance)
- "Right leg had flapping event early, left leg remained stable" (compensatory strategy)

This makes feedback more actionable and specific.

**Why 250-300 words?**

Based on coach feedback research:
- <200 words: Too brief, lacks actionable detail
- 200-300 words: Optimal for readability and retention
- >300 words: Overwhelming, coaches skim instead of reading

Target range balances depth with digestibility.

### Prompt Engineering Strategy

**Structure enforced in user prompt**:
1. Performance Summary (comparison)
2. Symmetry Analysis (dominant leg, score)
3. Key Observations (temporal patterns)
4. Recommendations (corrective exercises)

This ensures consistent output structure for frontend parsing and display.

**System context provides**:
- LTAD duration benchmarks by age
- Bilateral asymmetry thresholds (from BE-021)
- Exercise recommendations library
- Coach-friendly language guidelines

**Temperature 0.7** balances:
- Consistency (lower temp = more deterministic)
- Natural variation (higher temp = less robotic)

### Example Feedback Output

**Input**:
- Left leg: 25.3s, 1.8 cm/s sway, 8 corrections
- Right leg: 23.8s, 2.0 cm/s sway, 10 corrections
- Symmetry: 82/100 (good), left dominant

**Expected Output**:

```markdown
## Performance Summary
Sarah demonstrated good bilateral balance with a slight left-leg dominance. Her left leg held for 25.3 seconds (LTAD Score 4/5), while her right leg achieved 23.8 seconds (also LTAD Score 4/5). This 1.5-second difference (6%) is well within normal age-appropriate variation for a 10-year-old.

## Symmetry Analysis
Overall symmetry score of 82/100 indicates good bilateral balance. The left leg is currently dominant, showing slightly better postural control and fewer corrections. This level of asymmetry is considered normal and doesn't require immediate intervention.

## Key Observations
Both legs showed increasing sway velocity in the final third of the test, suggesting fatigue affects both sides similarly. The left leg had one flapping event early in the test but stabilized, while the right leg showed more consistent correction patterns throughout.

## Recommendations
Continue balanced training with equal practice on both legs. To support the right leg, add 2-3 extra single-leg balance holds per session (10-15 seconds each). Focus on core strengthening exercises like planks to reduce fatigue-related sway in both legs.
```

**Word count**: ~195 words (within 200-300 range)

### Error Handling

**OpenRouter API failures**:
```python
try:
    response = await client.chat(...)
except Exception as e:
    logger.error(f"OpenRouter API failed: {e}")
    raise  # Propagate to API layer
```

API layer (BE-019) catches and logs but doesn't block assessment creation.

**Missing temporal data**:
- Prompt includes temporal sections only if `temporal` key exists
- Agent gracefully handles missing 5-second segments or events
- Falls back to basic comparison if temporal data unavailable

**Invalid metrics**:
- Assumes validation happened at Pydantic layer
- Uses `.get(key, default)` for safety
- LLM robust to minor inconsistencies in prompt

### Future Enhancements

**Phase 2 (post-MVP)**:

1. **Age-specific prompts**:
   ```python
   if athlete_age < 8:
       prompt += "Focus on developmental milestones, avoid technical jargon."
   elif athlete_age >= 12:
       prompt += "Include biomechanical explanations and advanced drills."
   ```

2. **Historical context**:
   ```python
   if previous_assessments:
       prompt += f"Previous symmetry: {prev_symmetry}/100. Current: {curr_symmetry}/100."
   ```

3. **Sport-specific recommendations**:
   ```python
   if athlete.sport == "soccer":
       recommendations += "Practice kicking with non-dominant leg to improve balance."
   ```

4. **Multi-language support**:
   ```python
   if language == "fr":
       system_context = LTAD_CONTEXT_FR
   ```

### Performance Considerations

**Prompt token count** (~800 tokens):
- System context: ~500 tokens (LTAD + bilateral benchmarks)
- User prompt: ~300 tokens (bilateral summary + instructions)

**Response token count** (~400 tokens):
- 250-300 words ≈ 400 tokens

**Total API cost** per assessment:
- Sonnet 3.5: $0.003/1K input, $0.015/1K output
- Cost: (800 * $0.003 + 400 * $0.015) / 1000 = $0.0084 (~0.8 cents)

**Latency**:
- OpenRouter API: 3-8 seconds (includes LLM processing)
- Acceptable since API layer returns assessment ID immediately

**Optimization opportunities**:
- Cache system context (static, doesn't change per request)
- Batch feedback generation for multiple assessments (future)
- Use Haiku for draft, Sonnet for final (cost reduction)

Not needed for MVP - current performance and cost are acceptable.
