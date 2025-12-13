# Phase 7: AI Agents - Implementation Plan

**Created**: December 13, 2025
**Target**: Investor Demo December 18, 2025
**Phase Status**: Ready to begin
**Dependencies**: Phase 6 (CV Analysis) ✅ Complete

---

## Executive Summary

Phase 7 implements the AI-powered coaching feedback system using Claude models via OpenRouter. This phase transforms raw metrics from Phase 6 into actionable coaching insights and parent-friendly progress reports.

### Three PRs in This Phase

| PR | Title | Complexity | Estimated Hours | Dependencies |
|----|-------|------------|-----------------|--------------|
| BE-009 | Agent Orchestrator & Compression Agent | M (Medium) | 4-5 hours | BE-008 ✅ |
| BE-010 | Assessment Agent | S (Small) | 3 hours | BE-009 |
| BE-011 | Progress Agent | S (Small) | 3 hours | BE-009, BE-010 |

**Total Estimated Time**: 10-11 hours

---

## Current State Assessment

### ✅ What's Ready (Phase 6 Complete)

1. **Backend Infrastructure**:
   - FastAPI backend deployed on Render
   - Firebase Firestore operational with assessment storage
   - Assessment model with `ai_feedback` field ready
   - Repository methods for assessment CRUD

2. **Client-Side Metrics**:
   - MediaPipe.js calculates comprehensive CV metrics client-side (17+ metrics: sway, arm angles, temporal analysis, events)
   - Metrics sent to backend as SOURCE OF TRUTH
   - Backend adds LTAD duration scoring (1-5)
   - Assessment completes synchronously

3. **Data Available for AI**:
   - Current assessment metrics (duration, sway, arm angles, corrections, etc.)
   - Temporal breakdown (first/middle/last third analysis)
   - Five-second segments
   - Detected events (stabilization, flapping, corrections)
   - Athlete metadata (name, age, consent status)
   - Historical assessments (via AssessmentRepository.get_by_athlete())

4. **Configuration**:
   - OpenRouter API key configured in `.env`
   - OpenRouter base URL configured in `config.py`
   - Firebase credentials operational

5. **Integration Points**:
   - Clear endpoint in `/assessments/analyze` awaiting AI integration
   - `update_with_results()` method ready to store `ai_feedback`
   - Email service ready for parent report delivery

### ⚠️ What's Missing (Needs Implementation)

1. **Agents Directory** (`backend/app/agents/`):
   - Directory exists but is empty
   - Needs: `client.py`, `orchestrator.py`, `compression.py`, `assessment.py`, `progress.py`

2. **Prompts Directory** (`backend/app/prompts/`):
   - Directory exists but is empty
   - Needs: `static_context.py` with LTAD framework, coaching cues, output formats

3. **Dependencies**:
   - `httpx>=0.26.0` recommended but not in requirements.txt
   - Can use existing `aiohttp` as alternative

4. **Integration**:
   - AI feedback generation not yet called from assessment endpoint
   - No parent report endpoints yet (BE-013, out of Phase 7 scope)

---

## Technical Architecture

### Agent Flow Diagram

```
Client → POST /assessments/analyze (with metrics)
           ↓
    [Validate + Create Assessment]
           ↓
    [Assessment Agent] ← Orchestrator → [Static LTAD Context]
           ↓                                  (Cached 90%)
    Generate Feedback
           ↓
    [Store ai_feedback in Firestore]
           ↓
    Return Assessment ID to client


Parent Report Request (Phase 9)
           ↓
    [Get Last 12 Assessments]
           ↓
    [Compression Agent] (Haiku)
    6000 tokens → 150 tokens
           ↓
    [Progress Agent] (Sonnet)
           ↓
    Generate Parent Report
```

### Agent Responsibilities

| Agent | Model | Input | Output | Use Case |
|-------|-------|-------|--------|----------|
| **Compression** | Haiku | Last 12 assessments | ~150 token summary | Reduce history for context |
| **Assessment** | Sonnet | Single assessment metrics | Coach feedback (150-200 words) | Immediate post-test feedback |
| **Progress** | Sonnet | Compressed history + current metrics | Parent report (250-350 words) | Trend analysis, parent communication |

### Orchestrator Routing Logic

```python
if request_type == "assessment_feedback":
    # Single test → Assessment Agent directly
    route = "assessment_agent"
    compressed_history = None

elif request_type in ("parent_report", "progress_trends"):
    # Historical → Compression Agent → Progress Agent
    assessments = get_last_12_assessments()
    compressed_history = compression_agent(assessments)
    route = "progress_agent"
```

---

## Implementation Plan

### Phase 7.1: BE-009 - Foundation (4-5 hours)

**Goal**: Set up OpenRouter client, compression agent, orchestrator routing, and static prompt context.

#### Files to Create:

1. **`backend/app/agents/__init__.py`**
   - Empty init file to make agents a module

2. **`backend/app/agents/client.py`** (OpenRouter wrapper)
   - `OpenRouterClient` class with async HTTP client
   - `chat()` method with cache control support
   - Error handling and logging
   - Cache hit rate tracking
   - Singleton instance `openrouter`

3. **`backend/app/prompts/__init__.py`**
   - Empty init file

4. **`backend/app/prompts/static_context.py`** (Cacheable templates)
   - `LTAD_CONTEXT`: Age-based expectations, LTAD stages, test protocol
   - `COACHING_CUES`: Specific coaching advice by issue type
   - `ASSESSMENT_OUTPUT_FORMAT`: Structure for coach feedback
   - `PARENT_REPORT_FORMAT`: Structure for parent reports
   - `FULL_STATIC_CONTEXT`: Combined context for caching

5. **`backend/app/agents/compression.py`** (Compression agent)
   - `compress_history()` function using Haiku
   - Input: List of assessment dicts
   - Output: ~150 word summary
   - Fallback: Simple metric summary

6. **`backend/app/agents/orchestrator.py`** (Routing logic)
   - `AgentOrchestrator` class
   - `route()` method: Determines which agent to use
   - Pure Python logic (no LLM for routing)
   - Singleton instance `orchestrator`

7. **`backend/app/config.py`** (Add model IDs)
   ```python
   # Add to Settings class:
   haiku_model: str = "anthropic/claude-3-haiku-20240307"
   sonnet_model: str = "anthropic/claude-3-5-sonnet-20241022"
   ```

#### Testing Strategy:
- Test OpenRouter client with simple "hello" message
- Test compression with mock assessment data
- Test orchestrator routing for different request types
- Verify cache control headers are being sent
- Check logs for cache hit reporting

#### Acceptance Criteria:
- [ ] OpenRouter client connects and returns responses
- [ ] Compression agent summarizes 12 assessments to ~150 words
- [ ] Orchestrator correctly routes to assessment vs progress agent
- [ ] Prompt caching configured (verify in API logs)
- [ ] Graceful fallbacks on API errors
- [ ] Clear error logging for debugging

---

### Phase 7.2: BE-010 - Assessment Agent (3 hours)

**Goal**: Generate coach-friendly feedback for single assessments.

#### Files to Create:

1. **`backend/app/agents/assessment.py`**
   - `generate_assessment_feedback()` function using Sonnet
   - Input: Athlete name, age, leg tested, metrics
   - Output: 150-200 word coaching feedback
   - `_identify_focus_areas()`: Algorithm to detect problem areas
   - `_generate_fallback_feedback()`: Template-based backup
   - Uses cached `FULL_STATIC_CONTEXT`

#### Files to Modify:

2. **`backend/app/routers/assessments.py`**
   - Import `generate_assessment_feedback`
   - Call after assessment creation (line ~120)
   - Update assessment with `ai_feedback`
   - Handle errors gracefully

#### Integration Point:
```python
# In POST /assessments/analyze, after creating assessment:
from app.agents.assessment import generate_assessment_feedback

ai_feedback = await generate_assessment_feedback(
    athlete_name=athlete.name,
    athlete_age=athlete.age,
    leg_tested=data.leg_tested,
    metrics=metrics_dict,
)

await assessment_repo.update_with_results(
    assessment_id=assessment.id,
    metrics=metrics,
    ai_feedback=ai_feedback,  # ← NEW
)
```

#### Testing Strategy:
- Test with high-performing athlete metrics
- Test with low-performing athlete metrics
- Test with edge cases (0 seconds, 30 seconds)
- Test with missing temporal/events data
- Verify focus area detection logic
- Test fallback when OpenRouter fails
- Verify output is 150-200 words

#### Acceptance Criteria:
- [ ] Generates feedback from single assessment
- [ ] Includes duration score with age comparison
- [ ] Highlights strengths and areas for improvement
- [ ] Provides specific coaching cues from static context
- [ ] Uses cached static context (check logs)
- [ ] Feedback is encouraging but honest
- [ ] Fallback feedback works when API fails

---

### Phase 7.3: BE-011 - Progress Agent (3 hours)

**Goal**: Generate parent-friendly progress reports from historical data.

#### Files to Create:

1. **`backend/app/agents/progress.py`**
   - `generate_progress_report()` function using Sonnet
   - Input: Athlete info, compressed history, current metrics, assessment count
   - Output: 250-350 word parent report
   - `analyze_trends()`: Helper for trend detection
   - `_generate_fallback_report()`: Template-based backup
   - Uses cached `FULL_STATIC_CONTEXT`

#### Files to Modify:

2. **`backend/app/prompts/static_context.py`**
   - Add `PARENT_REPORT_FORMAT` template
   - Update `FULL_STATIC_CONTEXT` to include parent format

#### Testing Strategy:
- Test with improving athlete history
- Test with declining athlete history
- Test with stable/varied history
- Test with single assessment (minimal history)
- Verify parent-friendly language (no jargon)
- Test fallback report generation
- Verify output is 250-350 words

#### Acceptance Criteria:
- [ ] Generates parent-friendly report
- [ ] Uses compressed history from Compression Agent
- [ ] Includes trend analysis (improving/stable/declining)
- [ ] Explains metrics in accessible language
- [ ] Provides developmental context (LTAD)
- [ ] Includes encouragement and home activities

---

## Detailed File Structure

```
backend/
├── app/
│   ├── agents/                      # NEW - Phase 7
│   │   ├── __init__.py              # Empty module init
│   │   ├── client.py                # OpenRouter HTTP client
│   │   ├── orchestrator.py          # Routing logic
│   │   ├── compression.py           # Compression Agent (Haiku)
│   │   ├── assessment.py            # Assessment Agent (Sonnet)
│   │   └── progress.py              # Progress Agent (Sonnet)
│   │
│   ├── prompts/                     # NEW - Phase 7
│   │   ├── __init__.py              # Empty module init
│   │   └── static_context.py        # Cacheable LTAD/coaching/format templates
│   │
│   ├── routers/
│   │   └── assessments.py           # MODIFY - Add AI feedback call
│   │
│   ├── config.py                    # MODIFY - Add model IDs
│   │
│   └── requirements.txt             # OPTIONAL - Add httpx
│
├── prds/                            # Reference specs
│   ├── BE-009-agent-orchestrator-compression.md
│   ├── BE-010-assessment-agent.md
│   └── BE-011-progress-agent.md
```

---

## Dependencies & Environment

### Current Dependencies (Already Installed)
```
fastapi>=0.109.0
pydantic[email]>=2.5.0
firebase-admin>=6.4.0
resend>=0.7.0
aiohttp>=3.9.0          # Can use for OpenRouter calls
numpy>=1.26.0
```

### Optional Addition (Recommended by PRD)
```
httpx>=0.26.0           # Async HTTP client with better typing
```

**Decision**: Can proceed with `aiohttp` (already installed) or add `httpx` for PRD compliance. Both work.

### Environment Variables (Already Configured)
```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-***
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
FRONTEND_URL=http://localhost:5173
GOOGLE_APPLICATION_CREDENTIALS=./ltad-coach-firebase-adminsdk-*.json
```

---

## Cost Management Strategy

### Prompt Caching (90% Savings)

The static LTAD context (~2000 tokens) is sent with EVERY request:
- **Without caching**: 2000 tokens × $3/MTok = $0.006 per request
- **With caching**: 2000 tokens × $0.30/MTok = $0.0006 per request (first hit)
- **Cache hits**: Free (stored for 5 minutes)

**Implementation**:
```python
# In agents/client.py
payload["messages"] = [
    {
        "role": "system",
        "content": [
            {
                "type": "text",
                "text": FULL_STATIC_CONTEXT,
                "cache_control": {"type": "ephemeral"}  # ← Cache this
            }
        ]
    },
    *messages
]
```

### Model Selection Strategy

| Use Case | Model | Reason | Cost |
|----------|-------|--------|------|
| Compression | Haiku | Fast, cheap, good summarization | $0.25/$1.25 per MTok |
| Assessment Feedback | Sonnet | Better reasoning for coaching | $3/$15 per MTok |
| Progress Reports | Sonnet | Narrative generation quality | $3/$15 per MTok |

### Expected Costs (100 assessments/day)

**Scenario 1: Single Assessments Only**
- 100 assessments × 1 Sonnet call each
- Input: ~2500 tokens (cached + metrics)
- Output: ~250 tokens (feedback)
- Daily cost: ~$0.50

**Scenario 2: With Parent Reports (10/day)**
- 100 single assessments: ~$0.50
- 10 parent reports: 10 Haiku + 10 Sonnet calls
- Haiku (compression): ~$0.02
- Sonnet (report): ~$0.15
- Daily cost: ~$0.67

**Monthly (30 days)**: ~$20 with caching, ~$200 without

---

## Testing Plan

### Unit Tests (Each Agent)

1. **OpenRouter Client**:
   - Test successful chat completion
   - Test error handling (timeout, 401, 500)
   - Test cache control headers
   - Verify response parsing

2. **Compression Agent**:
   - Test with 12 assessments
   - Test with 1 assessment
   - Test with empty list
   - Verify output length (~150 words)
   - Test fallback on API error

3. **Assessment Agent**:
   - High performer (25s, low sway)
   - Low performer (8s, high sway)
   - Perfect score (30s)
   - Immediate failure (0s)
   - Missing temporal data
   - Verify focus area detection
   - Test fallback

4. **Progress Agent**:
   - Improving trend
   - Declining trend
   - Stable trend
   - Single assessment
   - Verify parent-friendly language
   - Test fallback

### Integration Tests

1. **End-to-End Assessment Flow**:
   ```bash
   POST /assessments/analyze
   # With client-calculated metrics
   # Verify ai_feedback is stored
   # Verify response includes feedback
   ```

2. **Orchestrator Routing**:
   ```python
   # Test "assessment_feedback" route
   # Test "parent_report" route
   # Verify compression is called for parent reports
   ```

3. **Error Handling**:
   - Test with invalid OpenRouter API key
   - Test with rate limiting (429)
   - Test with network timeout
   - Verify fallbacks are returned

---

## Risk Mitigation

### High-Risk Areas

1. **OpenRouter API Reliability**:
   - **Risk**: API downtime or rate limits
   - **Mitigation**: Fallback templates, error logging, retry logic
   - **Monitoring**: Track API success rate

2. **Prompt Caching Not Working**:
   - **Risk**: Cache misses = 10x cost increase
   - **Mitigation**: Log cache hits, verify cache_control format
   - **Monitoring**: Track cache hit rate in logs

3. **Feedback Quality Issues**:
   - **Risk**: AI generates inappropriate or incorrect feedback
   - **Mitigation**: Detailed static context, temperature tuning, human review sample
   - **Monitoring**: Review feedback samples in development

4. **Token Limit Exceeded**:
   - **Risk**: Long history + metrics exceeds context window
   - **Mitigation**: Compression agent, limit to 12 assessments
   - **Monitoring**: Track input token counts

### Fallback Strategy (NFR-7)

Every agent must have a template-based fallback:

```python
try:
    response = await openrouter.chat(...)
except Exception as e:
    logger.error(f"AI API failure: {e}")
    return generate_fallback_feedback(...)  # Template-based
```

---

## Success Metrics

### Phase 7.1 (BE-009) Success Criteria:
- [ ] OpenRouter client returns valid responses
- [ ] Compression reduces 12 assessments to ~150 words
- [ ] Orchestrator routes correctly
- [ ] Cache hit rate >50% in testing
- [ ] All agents have error fallbacks

### Phase 7.2 (BE-010) Success Criteria:
- [ ] Assessment endpoint generates AI feedback
- [ ] Feedback stored in Firestore `ai_feedback` field
- [ ] Feedback is 150-200 words
- [ ] Focus area detection identifies issues correctly
- [ ] Fallback works when API unavailable

### Phase 7.3 (BE-011) Success Criteria:
- [ ] Progress reports generated successfully
- [ ] Reports are parent-friendly (no jargon)
- [ ] Reports are 250-350 words
- [ ] Trend analysis works (improving/stable/declining)
- [ ] Fallback provides basic report

---

## Timeline Estimate

| Phase | Tasks | Time | Cumulative |
|-------|-------|------|------------|
| **7.1** | BE-009 setup | 4-5 hours | 4-5 hours |
| **7.2** | BE-010 assessment agent | 3 hours | 7-8 hours |
| **7.3** | BE-011 progress agent | 3 hours | 10-11 hours |
| **Testing** | Integration tests | 1-2 hours | 11-13 hours |
| **Buffer** | Bug fixes, refinement | 2 hours | 13-15 hours |

**Total: 13-15 hours** (comfortable 2-day sprint)

---

## Dependencies on Other Phases

### Phase 7 Depends On:
- ✅ **Phase 6** (BE-006, BE-007, BE-008): Metrics calculation
  - Status: Complete (client-side implementation)
- ✅ **Phase 3** (BE-004): Athlete repository with age data
  - Status: Complete
- ✅ **Phase 2** (BE-003): Auth for coach_id context
  - Status: Complete

### Phase 7 Blocks:
- **Phase 8** (BE-012): Assessment CRUD needs `ai_feedback` field populated
- **Phase 9** (BE-013): Report generation needs Progress Agent
- **Phase 10** (FE-015): Dashboard needs assessment results display

---

## Out of Scope for Phase 7

The following are **NOT** part of Phase 7:

1. ❌ Report storage and PIN generation (BE-013)
2. ❌ Report email delivery (BE-014)
3. ❌ Frontend assessment results display (FE-011)
4. ❌ Frontend report preview (FE-013)
5. ❌ Public report view (FE-014)
6. ❌ Team ranking calculation (can be added in Phase 8)
7. ❌ Dashboard analytics (Phase 10)

Phase 7 focuses **ONLY** on AI agent implementation:
- ✅ OpenRouter client
- ✅ Compression agent
- ✅ Assessment agent (single test feedback)
- ✅ Progress agent (parent reports)
- ✅ Integration into assessment endpoint

---

## Post-Phase 7 Verification

After completing Phase 7, verify:

1. **Assessment Flow**:
   ```bash
   # Test creating an assessment
   POST /assessments/analyze
   {
     "athlete_id": "test123",
     "test_type": "one_leg_balance",
     "leg_tested": "left",
     "metrics": { ... },
     "video_url": "https://..."
   }

   # Verify response includes ai_feedback
   # Verify Firestore document has ai_feedback field populated
   ```

2. **Database State**:
   - Check Firestore `assessments` collection
   - Verify `ai_feedback` is stored
   - Verify metrics are preserved

3. **Logs**:
   - Check for cache hit messages
   - Verify no errors in OpenRouter calls
   - Check fallback was not triggered (unless testing)

4. **Cost Monitoring**:
   - Check OpenRouter dashboard for usage
   - Verify cache hit rate
   - Calculate cost per assessment

---

## Next Steps After Phase 7

1. **Phase 8** (BE-012, FE-011, FE-012):
   - Assessment CRUD endpoints
   - Frontend results display
   - Athlete profile with history

2. **Phase 9** (BE-013, BE-014, FE-013, FE-014):
   - Report generation with PIN
   - Email delivery
   - Public report view

3. **Phase 10** (BE-015, FE-015, FE-016):
   - Coach dashboard
   - Landing page

---

## Questions to Resolve Before Starting

### 1. HTTP Client Library Choice
**Question**: Use `aiohttp` (already installed) or add `httpx` (PRD recommendation)?

**Options**:
- **Option A**: Use `aiohttp` (no dependency change)
  - Pro: Already installed, works fine
  - Con: Slightly different API than PRD spec

- **Option B**: Add `httpx` to requirements.txt
  - Pro: Matches PRD exactly, better typing
  - Con: Adds dependency

**Recommendation**: Use `aiohttp` for now, can refactor to `httpx` later if needed.

---

### 2. Team Ranking Implementation Timing
**Question**: Implement team ranking in Phase 7 or defer to Phase 8?

**Context**: Ranking functionality removed from scope.

**Decision**: Team ranking feature has been removed from the project. Assessments will focus on individual athlete performance and historical comparisons without relative team positioning.

---

### 3. Model Version Selection
**Question**: Use exact models from PRD or latest versions?

**PRD Specifies**:
- Haiku: `anthropic/claude-3-haiku-20240307`
- Sonnet: `anthropic/claude-3-5-sonnet-20241022`

**Latest Available** (December 2025):
- Haiku: `anthropic/claude-3-haiku-20240307` (same)
- Sonnet: `anthropic/claude-3-5-sonnet-20250222` (newer)

**Recommendation**: Start with PRD versions, can upgrade after testing.

---

### 4. Error Logging Level
**Question**: How verbose should AI error logging be?

**Options**:
- **Option A**: Minimal (only failures)
- **Option B**: Verbose (every request + response)
- **Option C**: Configurable via environment variable

**Recommendation**: Start with Option B (verbose) during development, switch to Option A for production.

---

## Ready to Begin?

**Prerequisites Checklist**:
- [x] Phase 6 complete (metrics calculation)
- [x] Backend infrastructure deployed
- [x] OpenRouter API key configured
- [x] Firebase operational
- [x] Assessment endpoint awaiting integration
- [x] PRD specifications reviewed
- [x] Planning document created

**Next Action**: Implement BE-009 (Agent Orchestrator & Compression)

---

## Appendix: Key Code Snippets

### OpenRouter Client Example
```python
# agents/client.py
async def chat(
    self,
    model: str,
    messages: List[dict],
    system: Optional[str] = None,
    cache_control: bool = False
) -> str:
    payload = {"model": model, "messages": messages}

    if system and cache_control:
        payload["messages"] = [
            {
                "role": "system",
                "content": [{
                    "type": "text",
                    "text": system,
                    "cache_control": {"type": "ephemeral"}
                }]
            },
            *messages
        ]

    response = await client.post(f"{self.base_url}/chat/completions", json=payload)
    return response.json()["choices"][0]["message"]["content"]
```

### Assessment Agent Integration
```python
# routers/assessments.py (line ~120)
from app.agents.assessment import generate_assessment_feedback

ai_feedback = await generate_assessment_feedback(
    athlete_name=athlete.name,
    athlete_age=athlete.age,
    leg_tested=data.leg_tested,
    metrics=metrics_dict,
)

await assessment_repo.update_with_results(
    assessment_id=assessment.id,
    metrics=metrics,
    ai_feedback=ai_feedback,
)
```

### Progress Agent Usage (Future - Phase 9)
```python
# BE-013 report generation endpoint
from app.agents.orchestrator import orchestrator
from app.agents.progress import generate_progress_report

routing = await orchestrator.route(
    request_type="parent_report",
    athlete_id=athlete.id,
    athlete_name=athlete.name,
    athlete_age=athlete.age,
)

report = await generate_progress_report(
    athlete_name=athlete.name,
    athlete_age=athlete.age,
    compressed_history=routing["compressed_history"],
    current_metrics=latest_metrics,
    assessment_count=routing["assessment_count"],
)
```

---

**Document Version**: 1.0
**Last Updated**: December 13, 2025
**Author**: Claude Code
**Status**: Ready for Implementation
