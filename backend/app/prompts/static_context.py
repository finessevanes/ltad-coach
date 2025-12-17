"""Static context templates for AI agents.

This content provides LTAD benchmarks, coaching cues, and output formats
for assessment and progress agents.
"""

# LTAD Framework Context
LTAD_CONTEXT = """# Long-Term Athlete Development (LTAD) Framework

## One-Leg Balance Test Protocol

The One-Leg Balance Test is a fundamental assessment of neuromuscular control and stability in youth athletes (ages 5-13). Athletes perform the test by:

1. Standing on one leg with hands on hips
2. Maintaining balance for up to 30 seconds
3. Keeping the non-standing foot off the ground
4. Minimizing upper body sway and corrections

## LTAD Duration Scoring (Athletics Canada Validated)

Duration scores are based on hold time and age-appropriate expectations:

- **Score 5 (Elite)**: 25-30 seconds - Exceptional stability for age
- **Score 4 (Advanced)**: 18-24 seconds - Above age expectations
- **Score 3 (Developing)**: 11-17 seconds - Meeting age expectations
- **Score 2 (Emerging)**: 6-10 seconds - Below age expectations
- **Score 1 (Fundamental)**: 0-5 seconds - Needs foundational work

## Age-Based Expectations

### Ages 5-7 (Active Start / FUNdamentals)
- **Typical**: 5-10 seconds
- **Focus**: Fun movement, basic balance games
- **Development**: Building body awareness, enjoying physical activity

### Ages 8-9 (FUNdamentals)
- **Typical**: 10-15 seconds
- **Focus**: ABC's (Agility, Balance, Coordination)
- **Development**: Motor skill literacy, confidence building

### Ages 10-11 (Learning to Train)
- **Typical**: 15-20 seconds
- **Focus**: Overall sport skill development
- **Development**: Introducing proper technique, consistent practice

### Ages 12-13 (Training to Train)
- **Typical**: 20-25+ seconds
- **Focus**: Sport-specific skill refinement
- **Development**: Enhanced neuromuscular control, advanced stability

## Key Metrics Explained

### Sway Metrics (measured in cm)
- **Sway Path Length**: Total distance center of mass travels
- **Sway Velocity**: Speed of center of mass movement
- **Sway STD (X/Y)**: Variability in horizontal and vertical movement
- **Corrections Count**: Number of balance adjustments detected

**Interpretation**: Lower sway = better stability. Elite athletes show minimal sway (<2cm STD).

### Arm Metrics (measured in degrees)
- **Arm Angles**: Left and right arm positions (ideal: ~90° from torso)
- **Arm Asymmetry**: Difference between left and right arms

**Interpretation**: Symmetrical arms at ~90° indicate proper form. Asymmetry >15° suggests compensatory patterns.

### Temporal Analysis
- **First Third**: Initial stability (often best performance)
- **Middle Third**: Sustained stability (tests endurance)
- **Last Third**: Fatigue response (often shows decline)

**Interpretation**: Consistent performance across thirds indicates good neuromuscular endurance.

## Common Movement Patterns

### Stabilization Events
- Normal: 0-2 per test
- Indicates balance corrections or recovery from perturbations

### Flapping (Arm Movement)
- Normal: Minimal arm movement
- Excessive flapping indicates poor core stability

### Hip Strategy vs. Ankle Strategy
- **Ankle**: Small corrections at ankle (preferred, more efficient)
- **Hip**: Large corrections at hip (compensatory, less efficient)
"""

# Balance Events Interpretation
BALANCE_EVENTS_GUIDANCE = """# Balance Events Interpretation

## Event Types and Coaching Responses

### Flapping (Arm Movement Events)
**What it means**: Arms moving away from hips to regain balance
**Root causes**:
- Poor core stability
- Inadequate proprioception
- Panic response to instability
- Insufficient confidence

**Coaching approach**:
- Early test (0-10s): Technique issue - teach proper setup
- Mid test (10-20s): Control issue - practice core engagement
- Late test (20-30s): Fatigue - build muscular endurance
- Clustered events: Panic response - practice breathing, focus techniques

**Specific drills**:
- Hands-on-hips balance with eyes closed (proprioception)
- Plank holds and dead bugs (core stability)
- Balance with distraction tasks (confidence building)

### Correction Burst
**What it means**: Multiple rapid balance adjustments in quick succession
**Root causes**:
- Loss of focus on fixed point
- Reactive corrections (not predictive)
- Hip strategy overuse vs ankle strategy
- Cascading instability

**Coaching approach**:
- Single burst: Normal, shows good recovery ability
- Multiple bursts: Over-correcting - teach subtle ankle adjustments
- Increasing severity: Fatigue or technique breakdown

**Specific drills**:
- Eyes-open then eyes-closed balance (reduce visual dependence)
- Slow-motion balance shifts (learn controlled corrections)
- Balance on wobble board (practice recovery)

### Stabilized Events
**What it means**: Successfully regaining solid balance after perturbation
**Root causes**: POSITIVE - shows resilience and motor learning

**Coaching approach**:
- Celebrate recovery ability
- Progress to more challenging balance tasks
- Introduce dynamic balance (reaching, catching)

### Arm Drop Events
**What it means**: Arms lowering from hip position
**Root causes**:
- Fatigue (late test)
- Reduced vigilance (mid test)
- False confidence (early test)

**Coaching approach**:
- Consistent with other fatigue signs: Build endurance
- Isolated event: Remind about form throughout practice

## Event Timing Patterns

### Early Test Events (0-10 seconds)
**Interpretation**: Technique or setup issues
**Focus**: Proper positioning, gaze focus, initial stability

### Mid Test Events (10-20 seconds)
**Interpretation**: Control or strategy issues
**Focus**: Sustained engagement, efficient corrections

### Late Test Events (20-30 seconds)
**Interpretation**: Endurance or fatigue
**Focus**: Muscular endurance, mental toughness

### Event Clusters
**Multiple events within 5 seconds**:
- Panic response or cascading failure
- Teach recovery strategies, breathing techniques
- Practice "save" drills

### Event Escalation
**Severity increasing over time**:
- Progressive fatigue
- Poor pacing (too much effort early)
- Need endurance-focused training
"""

# Failure Modes Guidance
FAILURE_MODES_GUIDANCE = """# Test Failure Modes and Interpretation

## Failure Reasons

### Foot Touchdown (Non-Support Foot)
**What happened**: Free foot touched the ground

**Early failure (0-10s)**:
- **Likely cause**: Poor initial balance, technique issue
- **Coaching focus**: Setup positioning, gaze stability
- **Drills**: Assisted balance, visual focus training
- **Prognosis**: Quick improvement with technique work

**Mid failure (10-20s)**:
- **Likely cause**: Loss of concentration or control
- **Coaching focus**: Mental engagement, focus cues
- **Drills**: Balance with distractions, mindfulness practice
- **Prognosis**: Moderate improvement, needs consistency

**Late failure (20-30s)**:
- **Likely cause**: Fatigue, almost successful
- **Coaching focus**: Celebrate near-success, build endurance
- **Drills**: Extended hold practice, interval training
- **Prognosis**: Very close to success, highly encouraging

### Support Foot Moved
**What happened**: Standing foot shifted position

**Early failure (0-10s)**:
- **Likely cause**: Improper weight distribution, poor setup
- **Coaching focus**: Foot placement, pressure awareness
- **Drills**: Barefoot balance, foot strengthening
- **Prognosis**: Foundational work needed

**Mid failure (10-20s)**:
- **Likely cause**: Base of support instability
- **Coaching focus**: Ankle strength, proprioception
- **Drills**: Single-leg strength work, balance progression
- **Prognosis**: Moderate improvement path

**Late failure (20-30s)**:
- **Likely cause**: Muscular fatigue (very impressive!)
- **Coaching focus**: Endurance, celebrate strong performance
- **Drills**: Longer duration holds, fatigue resistance
- **Prognosis**: Elite-level performance, minimal improvement needed

### Time Complete (30 seconds)
**What happened**: Successfully completed full test

**Coaching approach**:
- Celebrate achievement
- Shift focus to quality metrics (sway, symmetry)
- Progress to more challenging variations:
  - Eyes closed
  - Unstable surface
  - Dynamic tasks (catching, reaching)
  - Dual-task challenges

## Proximity to Success Analysis

### Very Close (25-30s)
- Frame as "almost there" - highly encouraging
- Small improvements will achieve success
- Focus on mental endurance and confidence

### Moderate (15-25s)
- Solid foundation, clear improvement path
- Focus on identified weak areas
- Realistic timeline: 2-4 weeks of practice

### Early Failure (<15s)
- Needs foundational work
- Celebrate small incremental gains
- Realistic timeline: 4-8 weeks of consistent practice
"""

# Temporal Trends Guidance
TEMPORAL_TRENDS_GUIDANCE = """# Five-Second Segment Trend Analysis

## Pattern Recognition

### Stable Performance
**Pattern**: Low variance across all segments (±10%)
**Interpretation**: Excellent neuromuscular control and endurance
**Coaching**: Progress to more challenging balance tasks

### Linear Decline
**Pattern**: Steady increase in sway each segment
**Interpretation**: Progressive fatigue, expected pattern
**Coaching**: Normal for age/duration, build endurance gradually

### Early Peak (High → Low → Stable)
**Pattern**: High sway in segments 1-2, then improvement
**Interpretation**:
- Warm-up effect
- Initial anxiety settling
- Learning/adaptation during test

**Coaching**:
- Pre-test warm-up routine
- Mental preparation techniques
- Earlier tests may underestimate ability

### Mid-Test Dip (Stable → High → Recovery)
**Pattern**: Stability drops mid-test then recovers
**Interpretation**:
- Temporary loss of focus
- Brief fatigue followed by mental push
- Shows resilience and recovery ability

**Coaching**:
- Positive sign - demonstrates grit
- Practice sustained focus techniques
- Build mental endurance

### Late Collapse (Stable → Stable → High)
**Pattern**: Sudden instability in final segments
**Interpretation**:
- Muscular fatigue
- Mental fatigue
- "Finish line" anticipation affecting form

**Coaching**:
- Very common pattern
- Build specific late-test endurance
- Practice through fatigue

### Increasing Instability (Accelerating Decline)
**Pattern**: Sway velocity increasing at increasing rate
**Interpretation**:
- Cascading fatigue
- Compensation strategies failing
- May indicate pushing beyond current capacity

**Coaching**:
- Build foundational endurance first
- Practice at shorter durations initially
- Progress gradually

### Roller Coaster (High variability between segments)
**Pattern**: Inconsistent performance across segments
**Interpretation**:
- Inconsistent focus or effort
- Reactive rather than controlled balance
- May be testing limits/experimenting

**Coaching**:
- Teach consistent strategy
- Practice maintaining steady effort
- Develop rhythm and pacing

## Segment-Specific Metrics

### Sway Velocity Progression
- Calculate rate of change between segments
- Identify inflection points
- Compare to age norms

### Arm Angle Evolution
- Track symmetry changes over time
- Identify compensation onset
- Note recovery patterns

### Corrections Frequency by Segment
- Early corrections: Technique
- Mid corrections: Endurance
- Late corrections: Fatigue
- Clustering: Control issues

## Coaching Applications

### For Improving Trends (Velocity decreasing)
- Celebrate self-correction ability
- This is a strength - athlete can feel and respond
- Build on this kinesthetic awareness

### For Declining Trends (Velocity increasing)
- Normal for duration
- Focus on identified weakness (endurance/control)
- Set realistic improvement targets

### For Stable Trends
- Elite pattern
- Challenge with harder variations
- Use as benchmark for other assessments
"""

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

# Coaching Cues Library
COACHING_CUES = """# Coaching Cues by Issue Type

## For High Sway (>3cm STD)
- "Focus on a fixed point at eye level"
- "Engage your core muscles - imagine pulling belly button to spine"
- "Practice balance exercises daily: tree pose, tandem stance, balance board"
- "Try standing on unstable surfaces (foam pad, wobble cushion)"

## For Early Failure (<10 seconds, age 8+)
- "Start with assisted balance (finger on wall) and gradually remove support"
- "Practice balance games: freeze dance, balance beam, hopscotch"
- "Build ankle strength: toe raises, heel walks, ankle circles"
- "Ensure proper footwear with good support"

## For Arm Asymmetry (>15° difference)
- "Check for muscle imbalances - may need physiotherapy assessment"
- "Practice symmetrical arm positions in front of mirror"
- "Strengthen weaker side with resistance band exercises"
- "Consider assessment for underlying movement pattern issues"

## For Declining Performance (Last Third)
- "Build muscular endurance with longer balance holds (2-3 minutes total practice)"
- "Add distractions during practice: catch a ball, answer questions"
- "Practice single-leg exercises: squats, deadlifts, step-ups"
- "Include balance training at end of practice when fatigued"

## For Excessive Corrections (>5 events)
- "Slow down - quality over speed"
- "Practice mindfulness: feel the foot pressure points"
- "Strengthen hip stabilizers: clamshells, side planks, lateral walks"
- "Barefoot balance practice to enhance proprioception"

## General Encouragement
- "Every second counts - progress is progress!"
- "Balance improves quickly with consistent practice"
- "This is a skill you'll use in every sport"
- "Great effort! Let's build on this foundation"
"""

# Assessment Output Format
ASSESSMENT_OUTPUT_FORMAT = """# Assessment Feedback Format

Generate feedback in the following structure (150-200 words total):

## Performance Summary (2-3 sentences)
- Duration score with age comparison
- Overall quality assessment
- Standout strengths

## Key Observations (3-4 bullet points)
- Specific metric highlights (good or areas for improvement)
- Movement pattern notes
- Temporal analysis insights

## Coaching Recommendations (2-3 specific cues)
- Primary focus area
- Specific drills or exercises
- Practice frequency guidance

## Encouragement (1 sentence)
- Age-appropriate, positive reinforcement
- Acknowledge effort and potential

**Tone**: Encouraging but honest, coach-to-coach professional language
"""

# Parent Report Format
PARENT_REPORT_FORMAT = """# Parent Report Format

Write as a real youth sports coach having a genuine conversation with parents. Generate a natural, conversational report (250-350 words total):

## Opening (2-3 sentences)
- Warm, personal greeting: "Dear [Athlete Name]'s Parents," or "Hi [Parent Name],"
- Express genuine enthusiasm about sharing the athlete's progress
- Mention number of assessments completed

## Progress Story (3-4 sentences)
- Tell a story about their journey, not just stats
- If declining: Be direct but supportive ("I've noticed [Name]'s balance has dipped from X to Y over the past few months")
- If improving: Celebrate specific wins ("I'm really excited about how [Name] has progressed from X to Y!")
- Connect to real athletic development, not abstract scores

## What I'm Seeing (conversational paragraph, not bullets)
- Write naturally: "Here's what stands out to me..." or "A few things I've noticed..."
- Strengths: Be specific with examples
- Challenges: Frame as "areas we're working on together"
- LTAD context woven in naturally, not as lecture
- Real coach observations, not generic template language

## How You Can Help (conversational, practical)
- Lead with: "Here are some fun ways to practice at home:" or "Try these at home - they actually work:"
- 3-4 specific activities that sound doable, not homework
- Realistic frequency (not every day - parents are busy!)
- Make it sound fun, not prescriptive

## Looking Forward (warm close)
- Optimistic but realistic outlook
- Partnership language: "Let's work together on..." or "I'm excited to see..."
- Genuine encouragement

## Signature
- Natural sign-off: "Best," or "See you at practice," or "Thanks for your support,"
- Coach name EXACTLY as provided (never use placeholders like "[Coach Name]")

**VOICE GUIDELINES**:
- Write like you're texting a parent after practice, not writing a formal report
- Use contractions (I'm, we're, that's)
- Be conversational: "Here's the thing...", "What I love is...", "Let me be real with you..."
- Show personality - coaches aren't robots
- Balance honesty with encouragement
- Avoid jargon, but don't talk down either
- Make it clear you genuinely care about this kid's development

**DECLINING PERFORMANCE VOICE**:
When trends show decline, be a supportive coach having a real conversation:
- Direct: "I want to be straight with you - [Name]'s balance has dropped from 17 seconds down to 8 seconds over the past few months."
- Contextual: "This can happen when kids hit growth spurts, or when balance practice falls off the radar."
- Action-oriented: "The good news? Balance bounces back fast with focused practice."
- Partnership: "Here's my plan - let's work together on..."
"""

# Combined Context for Caching
FULL_STATIC_CONTEXT = f"""{LTAD_CONTEXT}

{BILATERAL_BALANCE_CONTEXT}

{BALANCE_EVENTS_GUIDANCE}

{FAILURE_MODES_GUIDANCE}

{TEMPORAL_TRENDS_GUIDANCE}

{COACHING_CUES}

{ASSESSMENT_OUTPUT_FORMAT}

{PARENT_REPORT_FORMAT}
"""
