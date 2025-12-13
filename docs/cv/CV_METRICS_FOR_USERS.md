# What the AI Analyzes: Balance Test Measurements

## Overview

The AI Coach uses **MediaPipe Pose Detection** (Google's BlazePose model) to analyze athlete performance during the One-Leg Balance Test. This computer vision technology tracks 33 body landmarks in real-time, but we focus on **8 key points** to measure balance quality.

Think of it as giving the AI "eyes" to watch an athlete during the test, similar to how a human coach observes movement patterns. The AI analyzes:
- How much the athlete sways (balance quality)
- How they use their arms for compensation
- When and how balance deteriorates over time

This document explains exactly **what the AI can "see"** and what physical aspects are measured.

---

## What IS Measured

### 1. Balance & Sway (Hip Movement)

The AI tracks the **hip center position** throughout the test to measure balance quality.

**Tracked Landmarks**: Left & Right Hips (MediaPipe points #23, #24)

**Metrics Calculated**:
- **Side-to-side sway** (sway_std_x): How much the hips move left/right in centimeters
- **Forward-back sway** (sway_std_y): How much the hips move forward/backward in centimeters
- **Total distance traveled** (sway_path_length): Complete path the hips trace during the test
- **Movement speed** (sway_velocity): How fast the hips are moving (cm/s)
- **Balance corrections**: Number of times the athlete sways beyond 2cm and recovers

**What This Tells Coaches**:
- Athletes with low sway have better static balance control
- High velocity indicates reactive balancing (constantly adjusting)
- Many corrections suggest difficulty maintaining a stable position

### 2. Arm Compensation

The AI measures **arm position and movement** to understand how athletes use their arms to maintain balance.

**Tracked Landmarks**:
- Shoulders (MediaPipe points #11, #12)
- Wrists (MediaPipe points #15, #16)

**Metrics Calculated**:
- **Arm angles** (arm_angle_left, arm_angle_right): Angle from horizontal in degrees
  - 0° = Perfect T-position (arms straight out)
  - Positive angle = Arms dropped below horizontal
  - Negative angle = Arms raised above horizontal
- **Arm asymmetry** (arm_asymmetry_ratio): Left vs right arm balance (ratio)
  - 1.0 = Perfect symmetry
  - <0.7 or >1.3 = Significant imbalance
- **Arm range**: How much arms move during test (max - min angle)
- **Arm stability**: Standard deviation of arm angles (lower = more stable)
- **Time above horizontal**: Percentage of test with arms raised (indicates fatigue/difficulty)

**Special Event Detection**:
- **Arm flapping**: Sudden arm velocity spikes (recovery attempts)
  - Severity: low/medium/high based on intensity
  - Timestamp: When during test it occurred

**What This Tells Coaches**:
- Excessive arm movement indicates reliance on upper body for balance
- Arm asymmetry may reveal strength imbalances or coordination issues
- Flapping events show moments of instability
- Gradual arm dropping over time indicates fatigue

### 3. Temporal Patterns (Fatigue Analysis)

The AI analyzes **how balance changes over time** during the test.

**Two Analysis Methods**:

**A. Test Thirds** (Coarse Fatigue Detection)
- First third (0-33% of test duration)
- Middle third (33-66%)
- Last third (66-100%)

For each third, tracks:
- Average arm angles
- Average sway velocity
- Number of corrections

**B. 5-Second Segments** (Fine-Grained Timeline)
- Test broken into 5-second windows
- Each segment includes:
  - Average velocity
  - Corrections count
  - Arm angles (left & right)
  - Sway standard deviation (X & Y)

**What This Tells Coaches**:
- If metrics worsen in last third → fatigue or concentration lapse
- If metrics improve → athlete adapted and learned during test
- Specific timestamps help coaches review video at key moments

### 4. Balance Events (Critical Moments)

The AI automatically detects **significant balance events** with timestamps.

**Event Types Detected**:

**Flapping** (Arm velocity spikes)
- Indicates reactive balance correction attempt
- Severity: low/medium/high
- Example: "Arm velocity spike: 15.2 (threshold: 8.4)" at 8.3 seconds

**Correction Burst** (Instability clusters)
- More than 3 corrections within 2 seconds
- Indicates loss of control or unstable phase
- Example: "5 corrections in 2s" at 12.7 seconds

**Stabilization** (Achievement moment)
- Velocity drops below 2 cm/s and stays low for 2+ seconds
- Indicates athlete found stable position
- Example: "Velocity dropped below 2 cm/s and maintained for 2+ seconds" at 5.2 seconds

**What This Tells Coaches**:
- Events provide a narrative of the test ("athlete struggled at 8s, then stabilized at 12s")
- Helps identify specific coaching opportunities
- Shows learning/adaptation during the test

---

## What is NOT Measured

It's important to understand the **limitations** of the current system:

### Body Parts Not Tracked

**Torso/Core**:
- ❌ Torso tilt or lean angle
- ❌ Core stability metrics
- ❌ Back arch or posture
- **Why**: Only hips are used for sway analysis, not shoulder position relative to hips

**Foot Position**:
- ❌ Raised foot height or position
- ❌ Ankle angle or foot orientation
- ❌ Toe pointing
- **Why**: Ankles only used for failure detection (foot touchdown), not detailed positioning

**Head & Vision**:
- ❌ Where athlete is looking (gaze direction)
- ❌ Head movement, nodding, or tilting
- ❌ Neck stability
- **Why**: No head or eye tracking landmarks used

**Other**:
- ❌ Breathing patterns
- ❌ Facial expressions (concentration, effort)
- ❌ Height-normalized metrics
- **Why**: Metrics stored in raw centimeters, not adjusted for athlete height (useful for tracking same athlete over time)

### What This Means

The AI cannot directly assess:
- "Is the athlete leaning forward?" → Can infer from hip displacement, but no direct torso angle
- "Is their raised foot at the correct height?" → Not tracked in detail
- "Are they focusing on a visual target?" → No gaze tracking
- "Is their core engaged?" → Inferred from sway stability, not measured directly

---

## Units & Calibration

### How Measurements Work

**Sway Metrics** (Centimeters):
- MediaPipe provides coordinates in a 0-1 range (normalized to frame size)
- System measures **shoulder width** in each video
- Assumes average human shoulder width ≈ 40cm
- Converts normalized coordinates → centimeters using this calibration
- Example: If shoulders span 0.3 of frame width → scale factor = 40cm / 0.3 = 133cm per unit

**Arm Metrics** (Degrees):
- MediaPipe provides 3D "world landmarks" (real-world meters)
- System calculates actual joint angles using trigonometry (atan2)
- 0° = Horizontal (perfect T-position)
- No scaling needed (geometric calculation)

**Velocity** (cm/s):
- Distance traveled (cm) ÷ time elapsed (seconds)

**Corrections** (Count):
- Number of times hip position exceeds 2cm from center and returns

### Accuracy Notes

- **Smoothing**: One-Euro filter removes camera jitter while preserving real movement
- **Frame Rate**: Analysis runs at video frame rate (typically 30 FPS)
- **Visibility**: Frames where body parts are <70% visible are skipped
- **Calibration**: Shoulder-width method works for most athletes, but can be affected by very baggy clothing

---

## Data Flow: From Camera to AI Feedback

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CAMERA CAPTURE (Client Browser)                         │
│    - Athlete performs balance test on camera                │
│    - Video recorded in real-time                            │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MEDIAPIPE POSE DETECTION (Client Browser)               │
│    - BlazePose model detects 33 body landmarks per frame    │
│    - Provides normalized (0-1) and world (meters) coords    │
│    - Runs at ~30 FPS with <70% visibility filtering         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. METRICS CALCULATION (Client Browser)                    │
│    - Extract 8 key landmarks (shoulders, wrists, hips,      │
│      ankles)                                                 │
│    - Apply One-Euro smoothing filter                        │
│    - Calculate shoulder-width scale factor                  │
│    - Compute all 11 metrics (sway, arms, corrections)       │
│    - Detect events (flapping, bursts, stabilization)        │
│    - Generate temporal breakdown (thirds + 5-sec segments)  │
│                                                              │
│    SOURCE OF TRUTH: All CV metrics calculated here          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UPLOAD TO BACKEND (API)                                  │
│    - Video uploaded to Firebase Storage                     │
│    - Complete metrics payload sent to backend API           │
│    - Backend validates athlete ownership & consent          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. BACKEND PROCESSING (FastAPI)                            │
│    - Receives client metrics (no recalculation)              │
│    - Adds LTAD duration score (1-5 scale)                   │
│    - Stores assessment in Firestore                         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. AI AGENT ANALYSIS (Claude via OpenRouter)               │
│    - Assessment Agent receives:                             │
│      • Athlete info (name, age, test type)                  │
│      • All metrics (sway, arms, corrections, temporal)      │
│      • 5-second timeline segments                           │
│      • Detected events with timestamps                      │
│      • LTAD duration score + age expectations               │
│    - Generates coach-friendly feedback (150-200 words)      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. COACH DASHBOARD (React UI)                              │
│    - Displays assessment results                            │
│    - Shows metrics, AI feedback, video playback             │
│    - Enables progress tracking over time                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Point**: The browser (client) calculates ALL computer vision metrics. The backend only adds the LTAD score based on hold duration. This ensures fast processing and reduces server costs.

---

## Frequently Asked Questions

### Q: Does the AI know if my athlete is leaning forward or backward?

**A**: Partially. The AI tracks hip displacement (forward-back sway), but does NOT measure torso tilt directly. If the athlete leans while keeping hips centered, this won't be detected. However, most leaning causes hip displacement, which is measured.

### Q: Can the AI detect if the athlete is looking at a focal point?

**A**: No. There is no gaze or eye tracking. The AI cannot tell where the athlete is looking or if they're maintaining visual focus on a target.

### Q: Are metrics adjusted for the athlete's height?

**A**: No. Metrics are stored in raw centimeters. This is intentional - it allows tracking the same athlete's progress over time without height confounding. In the future, height normalization could be added for cross-athlete comparisons.

### Q: How accurate are the centimeter measurements?

**A**: Accuracy depends on camera angle, distance, and shoulder-width calibration. For a typical setup (athlete 6-8 feet from camera), measurements are accurate within ±1-2cm. Relative comparisons (same athlete over time) are more reliable than absolute values.

### Q: What if the athlete wears very baggy clothing?

**A**: Baggy clothing can affect shoulder-width measurement (used for calibration), making sway metrics slightly less accurate. Arm angle measurements are less affected since they use joint positions. For best results, athletes should wear fitted athletic clothing.

### Q: Can the AI tell if an athlete has good core strength?

**A**: Not directly. The AI can infer core stability from low sway velocity and few corrections, but it doesn't measure core engagement or strength directly. It measures the outcome (stable balance), not the mechanism (core activation).

### Q: Why doesn't the AI track all 33 MediaPipe landmarks?

**A**: For efficiency and relevance. Only 8 landmarks are needed for balance analysis:
- Shoulders (2): Scale calibration + arm angles
- Wrists (2): Arm angles
- Hips (2): Sway analysis
- Ankles (2): Failure detection

Storing all 33 landmarks would increase data size without adding useful information for balance assessment.

### Q: What's the difference between "corrections" and "flapping"?

**A**:
- **Corrections** (count): Number of times hips move beyond 2cm from center and return. Measures overall instability.
- **Flapping** (events): Specific moments when arm velocity spikes suddenly. Indicates reactive recovery attempts.

Flapping events are a subset of balance corrections that involve rapid arm movement.

### Q: Can two athletes with the same hold time get different AI feedback?

**A**: Yes! The AI analyzes quality metrics, not just duration:
- Athlete A: 20 seconds with low sway, stable arms → "Excellent controlled balance"
- Athlete B: 20 seconds with high sway, excessive arm movement → "Good duration, but work on reducing compensatory movements"

The LTAD score (1-5) is based solely on duration, but AI feedback considers all metrics.

---

## Next Steps

- **For Coaches**: Use this guide to understand what the AI feedback is based on
- **For Athletes/Parents**: Know what physical skills are being assessed
- **For Developers**: See [CV_METRICS_TECHNICAL.md](CV_METRICS_TECHNICAL.md) for implementation details

**Questions or feedback?** This system is continuously improving. If you'd like to see additional measurements (e.g., torso tilt, gaze tracking), please share your feedback with the development team.
