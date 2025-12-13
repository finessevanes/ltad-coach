# Balance Test Metrics - Quick Reference

> **One-page lookup table for all computer vision metrics**

---

## Measured Metrics

### Sway Metrics (Hip Movement)

| Metric | Unit | What It Measures | Source Landmarks | Typical Range |
|--------|------|------------------|------------------|---------------|
| `sway_std_x` | cm | Side-to-side variability (standard deviation) | Hips (23, 24) | 0.5-3.0 cm |
| `sway_std_y` | cm | Forward-back variability (standard deviation) | Hips (23, 24) | 0.5-3.0 cm |
| `sway_path_length` | cm | Total distance hips travel during test | Hips (23, 24) | 10-100 cm |
| `sway_velocity` | cm/s | Average speed of hip movement | Hips (23, 24) | 1-8 cm/s |
| `corrections_count` | count | Number of balance corrections (>2cm threshold) | Hips (23, 24) | 0-15 |

**Interpretation**:
- Lower sway metrics = Better balance control
- Higher velocity = More reactive balancing (constantly adjusting)
- Fewer corrections = More stable positioning

---

### Arm Metrics (Compensation)

| Metric | Unit | What It Measures | Source Landmarks | Typical Range |
|--------|------|------------------|------------------|---------------|
| `arm_angle_left` | degrees | Left arm angle from horizontal (avg) | Shoulder (11), Wrist (15) | -10° to +30° |
| `arm_angle_right` | degrees | Right arm angle from horizontal (avg) | Shoulder (12), Wrist (16) | -10° to +30° |
| `arm_asymmetry_ratio` | ratio | Left/Right arm balance | Derived | 0.7-1.3 |
| `arm_angle_range_left` | degrees | How much left arm moves (max - min) | Shoulder (11), Wrist (15) | 5-40° |
| `arm_angle_range_right` | degrees | How much right arm moves (max - min) | Shoulder (12), Wrist (16) | 5-40° |
| `arm_angle_std_dev_left` | degrees | Left arm stability (standard deviation) | Shoulder (11), Wrist (15) | 1-10° |
| `arm_angle_std_dev_right` | degrees | Right arm stability (standard deviation) | Shoulder (12), Wrist (16) | 1-10° |
| `time_arms_above_horizontal` | % | Time with arms raised above horizontal | Derived | 0-80% |

**Angle Reference**:
- `0°` = Perfect T-position (arms horizontal)
- `+20°` = Arms dropped 20° below horizontal
- `-10°` = Arms raised 10° above horizontal

**Interpretation**:
- Positive angles (dropped arms) indicate fatigue or difficulty
- High range/std dev = Excessive arm movement for balance
- Asymmetry outside 0.7-1.3 = Potential strength imbalance

---

### Temporal Metrics (Fatigue Analysis)

#### Test Thirds

| Segment | Metrics Included | Purpose |
|---------|------------------|---------|
| `temporal.first_third` | arm_angle_left, arm_angle_right, sway_velocity, corrections_count | Baseline performance |
| `temporal.middle_third` | arm_angle_left, arm_angle_right, sway_velocity, corrections_count | Mid-test stability |
| `temporal.last_third` | arm_angle_left, arm_angle_right, sway_velocity, corrections_count | Fatigue detection |

**Interpretation**:
- Worsening metrics in last third → Fatigue or concentration lapse
- Improving metrics → Athlete adapted/learned during test
- Consistent metrics → Good endurance

#### Five-Second Segments

| Field | Unit | What It Shows |
|-------|------|---------------|
| `start_time` | seconds | Segment start time |
| `end_time` | seconds | Segment end time |
| `avg_velocity` | cm/s | Average sway velocity in this window |
| `corrections` | count | Corrections during this window |
| `arm_angle_left` | degrees | Average left arm angle |
| `arm_angle_right` | degrees | Average right arm angle |
| `sway_std_x` | cm | Side-to-side sway variability |
| `sway_std_y` | cm | Forward-back sway variability |

**Purpose**: Provides granular timeline for LLM to understand *when* things happened

---

### Events (Critical Moments)

| Event Type | Severity | Detection Criteria | Interpretation |
|------------|----------|-------------------|----------------|
| `flapping` | low/medium/high | Arm velocity >2σ above mean | Reactive balance recovery attempt |
| `correction_burst` | medium/high | >3 corrections in 2 seconds | Loss of control / unstable phase |
| `stabilized` | - | Velocity <2 cm/s sustained for 2+ seconds | Athlete found stable position |
| `arm_drop` | - | Significant arm lowering detected | Fatigue or compensation strategy |

**Event Structure**:
```json
{
  "time": 8.3,
  "type": "flapping",
  "severity": "medium",
  "detail": "Arm velocity spike: 15.2 (threshold: 8.4)"
}
```

---

## Backend-Added Metrics

| Metric | Unit | What It Measures | Calculation | Range |
|--------|------|------------------|-------------|-------|
| `success` | boolean | Whether test was passed | Client determination | true/false |
| `failure_reason` | string | Why test failed (if applicable) | Client detection | "foot_down"/"time_limit"/etc |
| `duration_score` | 1-5 | LTAD duration score | Based on hold_time | 1-5 |
| `age_expectation` | label | Performance vs age norm | Compares score to age | "below"/"meets"/"above" |

**Note**: All metrics (including `success` and `failure_reason`) are now stored in the consolidated `metrics` object. The backend adds `duration_score` to the client-calculated metrics.

**LTAD Score Thresholds**:
- Score 1 (Beginning): 1-9 seconds
- Score 2 (Developing): 10-14 seconds
- Score 3 (Competent): 15-19 seconds
- Score 4 (Proficient): 20-24 seconds
- Score 5 (Advanced): 25-30 seconds

---

## Not Measured

| Category | What's Missing | Why |
|----------|---------------|-----|
| **Torso/Core** | Torso tilt, back arch, core engagement | Only hips tracked, not shoulder position relative to hips |
| **Foot** | Raised foot height, ankle angle, foot orientation | Ankles only used for failure detection (touchdown) |
| **Head/Vision** | Gaze direction, head movement, focal point | No head or eye tracking landmarks used |
| **Other** | Breathing, facial expressions, height-adjusted metrics | Not captured by MediaPipe pose detection |

---

## Coordinate Systems

### Normalized Landmarks (Sway Metrics)

- **Range**: 0.0 to 1.0 (relative to frame)
- **Processing**: One-Euro filter → Displacement from initial → Scale to cm
- **Calibration**: Shoulder width ≈ 40cm
- **Used for**: All sway metrics

### World Landmarks (Arm Metrics)

- **Range**: Meters (real-world 3D coordinates)
- **Processing**: atan2(dy, dx) for joint angles
- **Used for**: All arm angle calculations

---

## Data Flow Summary

```
MediaPipe (33 landmarks)
    ↓
Extract 8 key landmarks
    ↓
Apply One-Euro filter (smoothing)
    ↓
Calculate metrics (client-side)
    ↓
Send to backend API
    ↓
Backend adds duration_score
    ↓
Store in Firestore
    ↓
LLM receives complete data
```

**Key Point**: Client calculates ALL CV metrics (source of truth). Backend only adds LTAD score.

---

## MediaPipe Landmarks Used

| Landmark | Index | Used For |
|----------|-------|----------|
| Left Shoulder | 11 | Scale calibration, arm angles |
| Right Shoulder | 12 | Scale calibration, arm angles |
| Left Wrist | 15 | Arm angles |
| Right Wrist | 16 | Arm angles |
| Left Hip | 23 | **Primary sway analysis** |
| Right Hip | 24 | **Primary sway analysis** |
| Left Ankle | 27 | Failure detection (foot touchdown) |
| Right Ankle | 28 | Failure detection (support foot movement) |

**Note**: Only 8 of 33 BlazePose landmarks are stored/used

---

## Thresholds & Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `CORRECTION_THRESHOLD_CM` | 2.0 cm | Balance correction detection |
| `AVERAGE_SHOULDER_WIDTH_CM` | 40.0 cm | Scale calibration |
| `FALLBACK_SCALE_CM` | 150.0 cm | If shoulders not detected |
| `FLAPPING_THRESHOLD` | mean + 2σ | Arm velocity spike detection |
| `CORRECTION_BURST_WINDOW` | 2.0 seconds | Burst detection window |
| `CORRECTION_BURST_COUNT` | >3 | Burst threshold |
| `STABILIZATION_VELOCITY` | 2.0 cm/s | Stability threshold |
| `STABILIZATION_DURATION` | 2.0 seconds | Required stable time |
| `VISIBILITY_THRESHOLD` | 0.7 | Minimum landmark confidence |

---

## File Locations

### Client (TypeScript)
- Calculation: [`client/src/utils/metricsCalculation.ts`](../client/src/utils/metricsCalculation.ts)
- Detection: [`client/src/utils/positionDetection.ts`](../client/src/utils/positionDetection.ts)
- Types: [`client/src/types/balanceTest.ts`](../client/src/types/balanceTest.ts)

### Backend (Python)
- Models: [`backend/app/models/assessment.py`](../backend/app/models/assessment.py)
- API: [`backend/app/routers/assessments.py`](../backend/app/routers/assessments.py)
- Scoring: [`backend/app/constants/scoring.py`](../backend/app/constants/scoring.py)

### Documentation
- User guide: [`docs/CV_METRICS_FOR_USERS.md`](CV_METRICS_FOR_USERS.md)
- Technical reference: [`docs/CV_METRICS_TECHNICAL.md`](CV_METRICS_TECHNICAL.md)

---

## Metric Categories at a Glance

| Category | Metric Count | Primary Use |
|----------|-------------|-------------|
| Sway | 5 | Balance quality assessment |
| Arm | 8 | Compensation strategy analysis |
| Temporal | 2 types | Fatigue detection |
| Events | 3-4 types | Critical moment identification |
| Backend | 2 | LTAD scoring |
| **TOTAL** | **18+ metrics** | Comprehensive balance analysis |

---

## Quick Interpretation Guide

### Good Balance Profile
- `sway_velocity` < 2 cm/s
- `corrections_count` < 3
- `arm_angle_left/right` near 0°
- `arm_asymmetry_ratio` 0.9-1.1
- No flapping or correction_burst events
- Consistent metrics across thirds

### Poor Balance Profile
- `sway_velocity` > 5 cm/s
- `corrections_count` > 10
- `arm_angle_left/right` > 20° (dropped)
- `arm_asymmetry_ratio` < 0.7 or > 1.3
- Multiple high-severity flapping events
- Metrics worsen in last third

---

## For More Information

- **Users**: See [CV_METRICS_FOR_USERS.md](CV_METRICS_FOR_USERS.md)
- **Developers**: See [CV_METRICS_TECHNICAL.md](CV_METRICS_TECHNICAL.md)
- **Project Overview**: See [CLAUDE.md](../CLAUDE.md)
