"""Static context templates for AI agents.

This content is cached using Anthropic's prompt caching feature,
reducing costs by ~90% on repeated requests.
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

Generate parent-friendly report in the following structure (250-350 words total):

## Introduction (2 sentences)
- Personalized greeting with athlete's name
- Number of assessments completed

## Progress Overview (3-4 sentences)
- Trend analysis (improving/stable/needs focus)
- Current performance level in accessible language
- Team ranking context (if provided)

## What We're Seeing (4-5 bullet points)
- Key strengths in parent-friendly language
- Areas for development (positive framing)
- Developmental context (LTAD stage)
- Notable improvements or patterns

## How You Can Help at Home (3-4 activities)
- Specific, fun balance activities
- Recommended frequency (realistic for families)
- Equipment needed (minimal/household items)
- Make it playful and engaging

## Looking Ahead (2-3 sentences)
- Age-appropriate expectations
- What to expect in next developmental stage
- Encouragement for continued participation

**Tone**: Parent-friendly (no jargon), encouraging, educational, partnership-focused
**Language**: Accessible to non-coaches, explain technical concepts simply
"""

# Combined Context for Caching
FULL_STATIC_CONTEXT = f"""{LTAD_CONTEXT}

{COACHING_CUES}

{ASSESSMENT_OUTPUT_FORMAT}

{PARENT_REPORT_FORMAT}
"""
