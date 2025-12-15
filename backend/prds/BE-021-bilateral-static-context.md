---
id: BE-021
status: ✅ COMPLETE
depends_on: []
blocks: [BE-020]
---

# BE-021: Static Context - Bilateral Balance Benchmarks

## Title
Add bilateral balance and symmetry context to AI agent static prompts

## Scope

### In Scope
- Add `BILATERAL_BALANCE_CONTEXT` section to static_context.py
- Age-based asymmetry expectations (5-7, 8-9, 10-11, 12-13)
- Asymmetry threshold classifications (minimal, moderate, significant)
- Bilateral training recommendations
- Integration with existing LTAD_CONTEXT

### Out of Scope
- Bilateral AI agent implementation (BE-020)
- Agent orchestrator routing (BE-020)
- Frontend display of bilateral guidelines

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Context Format | Plain text markdown | Matches existing LTAD_CONTEXT format; LLM-friendly |
| Age Groupings | 5-7, 8-9, 10-11, 12-13 | Aligns with LTAD framework stages |
| Threshold Values | <20%, 20-40%, >40% | Based on LTAD research and TWO_LEG_IMPLEMENTATION_PLAN.md |
| Training Splits | 50/50, 60/40, 70/30 | Progressive focus on weaker leg |

## Acceptance Criteria

- [ ] `BILATERAL_BALANCE_CONTEXT` constant added to static_context.py
- [ ] Contains age-based asymmetry expectations for all 4 age groups
- [ ] Defines 3 asymmetry thresholds (minimal, moderate, significant)
- [ ] Includes bilateral training recommendations for each threshold
- [ ] Integrated into `FULL_STATIC_CONTEXT` string
- [ ] No breaking changes to existing context variables
- [ ] Documentation updated with bilateral context structure

## Files to Create/Modify

```
backend/app/prompts/
└── static_context.py          # Add BILATERAL_BALANCE_CONTEXT section
```

## Implementation Details

### Add `BILATERAL_BALANCE_CONTEXT`

**Location**: After `LTAD_CONTEXT` in `backend/app/prompts/static_context.py`

```python
# Bilateral Balance and Symmetry Context
BILATERAL_BALANCE_CONTEXT = """# Bilateral Balance and Symmetry

## Normal Asymmetry by Age

Youth athletes naturally exhibit varying levels of bilateral asymmetry based on developmental stage:

### Ages 5-7 (Active Start / FUNdamentals)
- **Expected Variability**: HIGH (up to 50% difference is normal)
- **Rationale**: Developing neuromuscular control; laterality still emerging
- **Coaching Focus**: Fun bilateral activities; don't overemphasize symmetry

### Ages 8-9 (FUNdamentals)
- **Expected Variability**: MODERATE (20-40% difference is normal)
- **Rationale**: Motor skills developing; some asymmetry common
- **Coaching Focus**: ABC development; introduce awareness of both sides

### Ages 10-11 (Learning to Train)
- **Expected Variability**: LOW-MODERATE (10-30% difference)
- **Rationale**: Skill refinement stage; asymmetry should decrease
- **Coaching Focus**: Technical proficiency; balanced development

### Ages 12-13 (Training to Train)
- **Expected Variability**: MINIMAL (<20% difference goal)
- **Rationale**: Neuromuscular maturity; sport-specific demands
- **Coaching Focus**: Performance optimization; address asymmetries proactively

## Asymmetry Thresholds (% Difference in Hold Time)

### Minimal Asymmetry (<20%)
- **Interpretation**: Normal bilateral variation; both legs well-developed
- **Action**: Continue balanced training
- **Split**: 50/50 training volume for both legs

### Moderate Asymmetry (20-40%)
- **Interpretation**: Noticeable imbalance; weaker leg needs attention
- **Action**: Add 1-2 extra sets for weaker leg; single-leg exercises
- **Split**: 60/40 training split favoring weaker leg
- **Reassess**: After 4-6 weeks of focused training

### Significant Asymmetry (>40%)
- **Interpretation**: Substantial imbalance; warrants investigation
- **Action**: 
  - Refer to physiotherapist if persists >8 weeks
  - Check for injury history on weaker side
  - Focus heavily on weaker leg development
- **Split**: 70/30 training split favoring weaker leg
- **Caution**: May indicate underlying issue; professional assessment recommended

## Bilateral Training Guidelines

### For Minimal Asymmetry
- Maintain balanced bilateral exercises
- Occasional single-leg challenges to monitor symmetry
- Focus on sport-specific skills

### For Moderate Asymmetry
- **Exercises for Weaker Leg**:
  - Single-leg balance holds (3x30s)
  - Single-leg Romanian deadlifts (3x8)
  - Step-ups on weaker side (3x10)
- **Frequency**: 2-3x per week
- **Duration**: 4-6 week blocks

### For Significant Asymmetry
- **Priority**: Address asymmetry before progressing sport skills
- **Exercises** (same as moderate, higher volume):
  - Single-leg balance holds (4x45s)
  - Progressive single-leg strength work
  - Proprioceptive training (wobble board, BOSU)
- **Frequency**: 3-4x per week
- **Professional Support**: Physiotherapy consultation recommended
- **Red Flags**: Pain, swelling, or regression warrants immediate medical evaluation

## Temporal Asymmetry Analysis

When comparing temporal patterns between legs:

### Fatigue Patterns
- **Symmetric Fatigue**: Both legs degrade similarly over time (good sign)
- **Asymmetric Fatigue**: One leg fatigues faster (needs endurance work)
- **Example Feedback**: "Left leg held strong for 20s, right leg showed fatigue at 12s"

### Event Comparison
- **Flapping Events**: Compare timing and frequency of arm corrections
- **Correction Bursts**: Identify if one leg has more instability episodes
- **Stabilization**: Note if one leg achieves stability sooner

### Coaching Recommendations
- If **left leg fatigues faster**: Add left leg isometric holds
- If **right leg has more corrections**: Focus on right leg proprioception
- If **asymmetric stabilization**: Work on weaker leg single-leg balance drills
"""


# Combine all static context
FULL_STATIC_CONTEXT = f"""{LTAD_CONTEXT}

{BILATERAL_BALANCE_CONTEXT}

{BALANCE_EVENTS_GUIDANCE}

... (rest of context)
"""
```

## Environment Variables

None required.

## Estimated Complexity

**S** (Small) - 2 hours

**Breakdown**:
- Write bilateral context content: 1 hour
- Integrate with existing context: 0.5 hours
- Testing and validation: 0.5 hours

## Testing Instructions

### 1. Verify Context Structure

```bash
cd backend
source venv/bin/activate
python
```

```python
from app.prompts.static_context import BILATERAL_BALANCE_CONTEXT, FULL_STATIC_CONTEXT

# Check bilateral context exists
assert "Bilateral Balance and Symmetry" in BILATERAL_BALANCE_CONTEXT
assert "Ages 5-7" in BILATERAL_BALANCE_CONTEXT
assert "Minimal Asymmetry (<20%)" in BILATERAL_BALANCE_CONTEXT

# Check it's integrated into full context
assert BILATERAL_BALANCE_CONTEXT in FULL_STATIC_CONTEXT

# Print length to ensure it's substantial
print(f"Bilateral context length: {len(BILATERAL_BALANCE_CONTEXT)} chars")
# Should be ~3000-4000 characters
```

### 2. Manual Review

Read the context as if you're an LLM:
1. Does it clearly define age expectations?
2. Are thresholds (20%, 40%) mentioned explicitly?
3. Are coaching recommendations actionable?
4. Does it integrate smoothly with existing LTAD context?

### 3. Integration with BE-020

When bilateral agent (BE-020) is implemented, test that it references this context:

```python
# In bilateral_assessment.py
from app.prompts.static_context import FULL_STATIC_CONTEXT

# Agent should include context in system prompt
assert "Bilateral Balance" in FULL_STATIC_CONTEXT
```

## Notes

### Design Rationale

**Why separate `BILATERAL_BALANCE_CONTEXT` from `LTAD_CONTEXT`?**
- Modularity: Can be used independently for bilateral-only feedback
- Clarity: Clear separation of single-leg vs. bilateral guidelines
- Maintenance: Easier to update bilateral guidelines without affecting single-leg context

**Why include temporal asymmetry guidance?**
- Leverages rich 5-second segment data from MediaPipe
- Provides more nuanced coaching (not just final scores)
- Aligns with TWO_LEG_IMPLEMENTATION_PLAN.md emphasis on temporal data

### Content Sources

- **Age expectations**: TWO_LEG_IMPLEMENTATION_PLAN.md lines 809-820
- **Threshold values**: Based on LTAD research and implementation plan
- **Training splits**: Industry best practices for addressing imbalances

### Future Enhancements

- Add sport-specific bilateral expectations (soccer, basketball, etc.)
- Include injury prevention guidelines (ACL risk, ankle stability)
- Reference scientific studies on bilateral asymmetry
