---
id: BE-009
depends_on: [BE-008]
blocks: [BE-010, BE-011]
---

# BE-009: Agent Orchestrator & Compression Agent

## Title
Implement AI agent orchestration and context compression

## Scope

### In Scope
- Agent orchestrator (pure Python routing logic)
- Compression Agent using Claude Haiku
- OpenRouter API client setup
- Prompt caching for static context
- Historical assessment compression

### Out of Scope
- Assessment Agent (BE-010)
- Progress Agent (BE-011)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM API | OpenRouter | PRD specifies, multi-model support |
| Compression Model | Claude Haiku | Fast, cheap, good for summarization |
| Caching | Anthropic native | 90% cost savings on static prompts |
| Orchestrator | Pure Python | No LLM needed for routing |

## Acceptance Criteria

- [ ] OpenRouter API client configured and working
- [ ] Orchestrator routes requests to correct agents
- [ ] Compression Agent summarizes 12 assessments into ~150 tokens
- [ ] Prompt cache configured for static LTAD content
- [ ] Cache hit rate tracked in logs
- [ ] Graceful fallback on API failures
- [ ] Request/response logging for debugging

## Files to Create/Modify

```
backend/app/
├── agents/
│   ├── __init__.py
│   ├── orchestrator.py          # Request routing
│   ├── compression.py           # Compression agent
│   └── client.py                # OpenRouter client
├── prompts/
│   ├── __init__.py
│   └── static_context.py        # Cacheable static content
└── config.py                    # Add OpenRouter config (modify)
```

## Implementation Details

### config.py (additions)
```python
class Settings(BaseSettings):
    # ... existing ...

    # OpenRouter
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Model IDs
    haiku_model: str = "anthropic/claude-3-haiku-20240307"
    sonnet_model: str = "anthropic/claude-3-5-sonnet-20241022"
```

### agents/client.py
```python
import httpx
from typing import Optional, List
from app.config import settings

class OpenRouterClient:
    """Client for OpenRouter API with Claude models"""

    def __init__(self):
        self.base_url = settings.openrouter_base_url
        self.api_key = settings.openrouter_api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.frontend_url,
            "X-Title": "AI Coach",
        }

    async def chat(
        self,
        model: str,
        messages: List[dict],
        system: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        cache_control: bool = False
    ) -> str:
        """
        Send chat completion request.

        Args:
            model: Model ID (e.g., 'anthropic/claude-3-haiku')
            messages: List of message dicts with 'role' and 'content'
            system: System prompt
            max_tokens: Max response tokens
            temperature: Sampling temperature
            cache_control: Whether to use prompt caching

        Returns:
            Response content string
        """
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        if system:
            if cache_control:
                # Use cache_control for static system prompts
                payload["messages"] = [
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "text",
                                "text": system,
                                "cache_control": {"type": "ephemeral"}
                            }
                        ]
                    },
                    *messages
                ]
            else:
                payload["messages"] = [
                    {"role": "system", "content": system},
                    *messages
                ]

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

                # Log cache usage if available
                usage = data.get("usage", {})
                if usage.get("cache_read_input_tokens"):
                    print(f"Cache hit: {usage['cache_read_input_tokens']} tokens")

                return data["choices"][0]["message"]["content"]

            except httpx.HTTPError as e:
                # IMPORTANT: Clear console warning for quick debugging
                print(f"[OPENROUTER_ERROR] API call failed: {e}")
                print(f"[OPENROUTER_ERROR] Model: {model}")
                print(f"[OPENROUTER_ERROR] Status: {e.response.status_code if hasattr(e, 'response') else 'N/A'}")
                print(f"[OPENROUTER_ERROR] Check API key and rate limits at https://openrouter.ai/activity")
                raise

# Singleton instance
openrouter = OpenRouterClient()
```

### prompts/static_context.py
```python
"""Static prompt content for caching"""

LTAD_CONTEXT = """
# LTAD Framework Context (Jeremy Frisch Athletic Development Benchmarks)

## Age-Based Expected Scores
Based on Jeremy Frisch's radar chart for athletic development.

| Age Group | Grade Level | Expected Score |
|-----------|-------------|----------------|
| Ages 5-6 | K-1st | 1 (Beginning) |
| Age 7 | 2nd | 2 (Developing) |
| Ages 8-9 | 3rd-4th | 3 (Competent) |
| Ages 10-11 | 5th-6th | 4 (Proficient) |
| Ages 12-13 | 7th-8th | 5 (Advanced) |

## Developmental Stage Guidelines

### Active Start / FUNdamentals (Ages 5-9)
- Focus on fundamental movement skills through play
- Balance development is foundational at this stage
- Emphasis on enjoyment and movement variety
- Ages 5-6: Expected score 1 (1-9 seconds)
- Age 7: Expected score 2 (10-14 seconds)
- Ages 8-9: Expected score 3 (15-19 seconds)

### Learn to Train (Ages 10-13)
- Optimal window for skill development ("golden age of learning")
- Ages 10-11: Expected score 4 (20-24 seconds)
- Ages 12-13: Expected score 5 (25+ seconds)
- Introduction to sport-specific training
- Focus on proper technique establishment

## One-Leg Balance Test Protocol

### Test Setup
- Athlete stands on flat, stable surface (barefoot preferred)
- Hands placed on hips (iliac crest)
- Eyes open, focused on fixed point ahead
- Test duration: 30 seconds maximum

### Failure Conditions
1. Foot touchdown: Raised foot touches ground
2. Hands leave hips: Either hand moves from hip position
3. Support foot moves: Standing foot shifts significantly from start position

### Duration Scoring (1-5 Scale)
| Score | Duration | Label | Expected For |
|-------|----------|-------|--------------|
| 1 | 1-9 sec | Beginning | Ages 5-6 |
| 2 | 10-14 sec | Developing | Age 7 |
| 3 | 15-19 sec | Competent | Ages 8-9 |
| 4 | 20-24 sec | Proficient | Ages 10-11 |
| 5 | 25+ sec | Advanced | Ages 12-13 |

## Interpreting Results by Age

When reporting results, compare to age-appropriate expectations:
- "Meets expected" = Score matches or exceeds age expectation
- "Below expected" = Score is lower than age expectation
- "Above expected" = Score exceeds age expectation

Example: A 7-year-old scoring 3 (Competent) is ABOVE expected level.
Example: A 12-year-old scoring 3 (Competent) is BELOW expected level.

## Quality Metrics Interpretation

### Stability Score (0-100)
- 90-100: Exceptional stability, minimal compensation
- 70-89: Good stability, minor movements
- 50-69: Moderate stability, noticeable sway
- Below 50: Needs significant improvement

### Sway Velocity
- Lower is better (indicates better control)
- High values suggest reactive balance strategy

### Arm Excursion
- Lower is better (indicates good core control)
- High values suggest using arms for compensation

### Corrections Count
- Fewer is better (indicates consistent balance)
- Many corrections suggest struggling to maintain position
"""

COACHING_CUES = """
# Coaching Cues by Issue Type

## High Sway
- "Focus on a fixed point directly ahead"
- "Engage your core - imagine bracing for a light push"
- "Press down through your standing foot"
- "Think of your standing leg as a strong pillar"

## High Arm Excursion
- "Keep your elbows gently pressed into your sides"
- "Imagine your hands are glued to your hips"
- "Relax your shoulders while keeping hands steady"

## Frequent Corrections
- "Take your time setting up before lifting your foot"
- "Start with a smaller lift of the raised leg"
- "Focus on slow, controlled breathing"

## Quick Failure (Foot Touchdown)
- "Start by hovering the foot just off the ground"
- "Practice on a slightly softer surface first"
- "Try the easier leg first to build confidence"

## Support Foot Movement
- "Spread your toes in your shoe for better grip"
- "Focus weight through the center of your foot"
- "Keep your knee slightly soft, not locked"
"""

ASSESSMENT_OUTPUT_FORMAT = """
# Assessment Feedback Format

Your response should include:

1. **Score Summary** (1 sentence)
   - Duration score (1-5) with label
   - How it compares to age expectation

2. **Performance Highlights** (2-3 bullets)
   - What the athlete did well
   - Specific metrics that stand out positively

3. **Areas for Improvement** (2-3 bullets)
   - Specific areas to work on
   - Reference relevant metrics

4. **Coaching Recommendations** (2-3 bullets)
   - Specific, actionable coaching cues
   - Exercises or drills to suggest

Keep feedback encouraging but honest. Use athlete's name when available.
Total response should be 150-200 words.
"""

# Combined static context for caching
FULL_STATIC_CONTEXT = f"""
{LTAD_CONTEXT}

{COACHING_CUES}

{ASSESSMENT_OUTPUT_FORMAT}
"""
```

### agents/compression.py
```python
from typing import List
from app.agents.client import openrouter
from app.config import settings

COMPRESSION_PROMPT = """
You are a data compression agent. Your job is to summarize historical athletic assessment data
into a concise summary that captures the key trends and patterns.

Given the assessment history below, create a brief summary (max 150 words) that captures:
1. Overall trajectory (improving, stable, declining)
2. Strongest area and weakest area
3. Key patterns across assessments
4. Most recent performance level

Focus on actionable insights, not raw numbers.
"""

async def compress_history(
    assessments: List[dict],
    athlete_name: str
) -> str:
    """
    Compress historical assessment data into a summary.

    Args:
        assessments: List of assessment dicts with metrics
        athlete_name: Athlete's name for context

    Returns:
        Compressed summary string (~150 tokens)
    """
    if not assessments:
        return f"No previous assessments for {athlete_name}."

    # Format assessment history for compression
    history_text = f"Assessment History for {athlete_name}:\n\n"

    for i, assessment in enumerate(assessments, 1):
        metrics = assessment.get("metrics", {})
        history_text += f"""
Assessment {i} ({assessment.get('created_at', 'Unknown date')}):
- Duration: {metrics.get('duration_seconds', 0)}s
- Stability Score: {metrics.get('stability_score', 0)}
- Sway Velocity: {metrics.get('sway_velocity', 0)} cm/s
- Arm Excursion: {(metrics.get('arm_excursion_left', 0) + metrics.get('arm_excursion_right', 0)) / 2} degrees
- Corrections: {metrics.get('corrections_count', 0)}
- Result: {metrics.get('failure_reason', 'Unknown')}
"""

    try:
        summary = await openrouter.chat(
            model=settings.haiku_model,
            messages=[{"role": "user", "content": history_text}],
            system=COMPRESSION_PROMPT,
            max_tokens=200,
            temperature=0.3,  # Lower temperature for factual summary
        )
        return summary.strip()

    except Exception as e:
        print(f"Compression failed: {e}")
        # Fallback to simple summary
        latest = assessments[0] if assessments else {}
        metrics = latest.get("metrics", {})
        return f"{athlete_name} has {len(assessments)} assessments. Latest: {metrics.get('duration_seconds', 0)}s duration, {metrics.get('stability_score', 0)} stability."
```

### agents/orchestrator.py
```python
from typing import Literal, Optional
from app.agents.compression import compress_history
from app.repositories.assessment import AssessmentRepository

RequestType = Literal["assessment_feedback", "parent_report", "progress_trends"]

class AgentOrchestrator:
    """
    Routes requests to appropriate agents.
    Pure Python logic - no LLM needed for routing.
    """

    def __init__(self):
        self.assessment_repo = AssessmentRepository()

    async def route(
        self,
        request_type: RequestType,
        athlete_id: str,
        athlete_name: str,
        athlete_age: int,
        current_metrics: Optional[dict] = None,
        coach_id: Optional[str] = None
    ) -> dict:
        """
        Route request to appropriate agent(s).

        Returns:
            Dict with agent outputs and metadata
        """
        if request_type == "assessment_feedback":
            # Single assessment - go directly to Assessment Agent
            return {
                "route": "assessment_agent",
                "compressed_history": None,
                "current_metrics": current_metrics,
            }

        elif request_type in ("parent_report", "progress_trends"):
            # Need historical context - use Compression Agent first
            assessments = await self.assessment_repo.get_by_athlete(
                athlete_id,
                limit=12  # Last 12 assessments
            )

            # Convert to dicts for compression
            assessment_dicts = [
                {
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                    "metrics": a.metrics.model_dump() if a.metrics else {},
                }
                for a in assessments
            ]

            # Compress history
            compressed = await compress_history(assessment_dicts, athlete_name)

            return {
                "route": "progress_agent",
                "compressed_history": compressed,
                "current_metrics": current_metrics,
                "assessment_count": len(assessments),
            }

        else:
            raise ValueError(f"Unknown request type: {request_type}")

    def should_include_team_context(self, request_type: RequestType) -> bool:
        """Determine if team ranking context should be included"""
        return request_type in ("parent_report", "progress_trends")

# Singleton
orchestrator = AgentOrchestrator()
```

## Dependencies to Add

```toml
# pyproject.toml
httpx = "^0.26.0"
```

## Estimated Complexity
**M** (Medium) - 4-5 hours

## Testing Instructions

1. Test OpenRouter client:
```python
from app.agents.client import openrouter

response = await openrouter.chat(
    model="anthropic/claude-3-haiku-20240307",
    messages=[{"role": "user", "content": "Say hello"}],
    system="You are a helpful assistant.",
    max_tokens=50
)
print(response)
```

2. Test compression:
```python
from app.agents.compression import compress_history

assessments = [
    {"created_at": "2024-01-01", "metrics": {"duration_seconds": 15, "stability_score": 70}},
    {"created_at": "2024-01-08", "metrics": {"duration_seconds": 18, "stability_score": 75}},
]
summary = await compress_history(assessments, "John Smith")
print(summary)  # Should be ~150 words
```

3. Test orchestrator routing:
```python
from app.agents.orchestrator import orchestrator

result = await orchestrator.route(
    request_type="parent_report",
    athlete_id="123",
    athlete_name="John Smith",
    athlete_age=12,
)
print(result["route"])  # Should be "progress_agent"
print(result["compressed_history"])  # Should have summary
```

## Notes
- OpenRouter handles model routing and caching
- Compression should reduce 6000 tokens to ~150 tokens
- Monitor API costs closely during testing
- Add rate limiting for production

## AI Fallback Responses (NFR-7)

Per main PRD NFR-7, AI API failures must fall back to cached/canned responses. Here are the fallback strategies:

### Compression Agent Fallback

Already implemented above - returns a simple metric summary:
```python
return f"{athlete_name} has {len(assessments)} assessments. Latest: {duration}s duration, {stability} stability."
```

### Assessment Agent Fallback (BE-010)

When Claude API fails, return a canned feedback template:

```python
# In agents/assessment.py
FALLBACK_FEEDBACK = """
**Score Summary**
{athlete_name} achieved a score of {score}/5 ({label}) on the One-Leg Balance test.

**What This Means**
Duration: {duration} seconds on {leg} leg
{age_comparison}

**Suggestions**
- Continue practicing balance exercises
- Focus on keeping arms steady at hips
- Try the test on both legs for comparison

*AI-generated feedback was unavailable. This is a standard assessment summary.*
"""

def get_fallback_feedback(
    athlete_name: str,
    score: int,
    label: str,
    duration: float,
    leg: str,
    age_comparison: str
) -> str:
    return FALLBACK_FEEDBACK.format(
        athlete_name=athlete_name,
        score=score,
        label=label,
        duration=round(duration, 1),
        leg=leg,
        age_comparison=age_comparison
    )
```

### Progress Agent Fallback (BE-011)

When generating parent reports fails, return a simple progress template:

```python
# In agents/progress.py
FALLBACK_REPORT = """
Dear Parent,

We're pleased to share {athlete_name}'s recent progress on the One-Leg Balance assessment.

**Current Score: {score}/5 ({label})**
- Test duration: {duration} seconds
- Team ranking: #{rank} of {total} athletes

{athlete_name} has completed {count} assessments to date. Regular practice will help build balance and coordination.

Best regards,
The Coaching Team

*Detailed AI analysis was unavailable. Please contact your coach for more information.*
"""

def get_fallback_report(
    athlete_name: str,
    score: int,
    label: str,
    duration: float,
    rank: int,
    total: int,
    count: int
) -> str:
    return FALLBACK_REPORT.format(
        athlete_name=athlete_name,
        score=score,
        label=label,
        duration=round(duration, 1),
        rank=rank,
        total=total,
        count=count
    )
```

### Error Logging

All AI failures should be logged for monitoring:

```python
import logging

logger = logging.getLogger(__name__)

try:
    response = await openrouter.chat(...)
except Exception as e:
    logger.error(f"AI API failure: {type(e).__name__}: {e}", extra={
        "agent": "compression",
        "athlete_id": athlete_id,
        "model": settings.haiku_model,
    })
    # Return fallback
```
