# CV Metrics Technical Reference

> **Audience**: Developers implementing or maintaining the balance assessment system

This document provides technical details on how computer vision metrics are calculated, what data structures are used, and how information flows from MediaPipe to the LLM.

---

## Table of Contents

1. [Coordinate Systems](#coordinate-systems)
2. [Metric Calculation Details](#metric-calculation-details)
3. [Data Models](#data-models)
4. [LLM Input Format](#llm-input-format)
5. [Implementation References](#implementation-references)

---

## Coordinate Systems

MediaPipe Pose provides **two coordinate systems** for each detected landmark. We use different systems for different metrics.

### Normalized Landmarks (0-1 Range)

**Source**: `PoseLandmarker.poseLandmarks` from MediaPipe

**Format**:
```typescript
interface NormalizedLandmark {
  x: number;  // 0.0 (left edge) to 1.0 (right edge)
  y: number;  // 0.0 (top edge) to 1.0 (bottom edge)
  z: number;  // Depth relative to hips (not used)
  visibility: number;  // 0.0-1.0 confidence
}
```

**Used For**: Sway metrics (hip trajectory analysis)

**Processing Pipeline**:
1. Extract raw normalized landmarks from MediaPipe
2. Filter out frames with visibility < 0.7
3. Calculate hip center: `(left_hip + right_hip) / 2`
4. Apply **One-Euro filter** to smooth jitter (see below)
5. Calculate displacement from initial position
6. **Scale to centimeters** using shoulder-width calibration

**Scale Calibration**:
```typescript
// Measure shoulder width in normalized coordinates
const shoulderWidthNorm = Math.abs(rightShoulder.x - leftShoulder.x);

// Assume average human shoulder width = 40cm
const AVERAGE_SHOULDER_WIDTH_CM = 40.0;

// Calculate scale factor (cm per normalized unit)
const scaleFactor = AVERAGE_SHOULDER_WIDTH_CM / shoulderWidthNorm;

// Convert displacement to cm
const displacementCm = displacementNorm * scaleFactor;
```

**Why This Approach**:
- Adapts to different camera distances (closer camera = larger normalized coords)
- Adapts to different athlete sizes (larger athlete = wider shoulders = larger scale)
- Provides consistent real-world units (cm) across different setups

**Limitations**:
- Assumes shoulder width ≈ 40cm (accurate for ages 10-13, less so for younger/smaller)
- Affected by very baggy clothing
- Fallback scale (150cm) used if shoulders not detected

### World Landmarks (Meters)

**Source**: `PoseLandmarker.worldLandmarks` from MediaPipe

**Format**:
```typescript
interface WorldLandmark {
  x: number;  // Meters (left/right from camera center)
  y: number;  // Meters (up/down, negative = up)
  z: number;  // Meters (depth from camera)
  visibility: number;  // 0.0-1.0 confidence
}
```

**Used For**: Arm angle calculations

**Processing**:
```typescript
// Calculate arm angle from horizontal using atan2
function calculateArmAngle(shoulder: WorldLandmark, wrist: WorldLandmark): number {
  const dx = wrist.x - shoulder.x;  // Horizontal distance
  const dy = wrist.y - shoulder.y;  // Vertical distance (negative = wrist above shoulder)

  // atan2 gives angle in radians
  // abs(dx) ensures angle always measured from horizontal
  const angleRad = Math.atan2(dy, Math.abs(dx));
  const angleDeg = angleRad * (180 / Math.PI);

  return angleDeg;  // 0° = horizontal, positive = dropped, negative = raised
}
```

**Why This Approach**:
- World landmarks provide accurate 3D positions for joint angles
- atan2 calculation works regardless of camera angle (within reason)
- No scaling needed (geometric calculation)

**Interpretation**:
- `0°`: Arm perfectly horizontal (T-position)
- `+20°`: Arm dropped 20° below horizontal
- `-10°`: Arm raised 10° above horizontal

---

## Metric Calculation Details

### One-Euro Filter (Jitter Smoothing)

**Purpose**: Remove MediaPipe landmark jitter while preserving intentional movement

**Reference**: [http://cristal.univ-lille.fr/~casiez/1euro/](http://cristal.univ-lille.fr/~casiez/1euro/)

**Implementation**: [metricsCalculation.ts:77](../client/src/utils/metricsCalculation.ts#L77)

**Algorithm**:
- Adaptive low-pass filter that adjusts cutoff frequency based on signal velocity
- Fast movements → higher cutoff → more responsive (less smoothing)
- Slow movements → lower cutoff → more smoothing (removes jitter)

**Parameters** (tuned for 30 FPS pose data):
```typescript
new OneEuroFilter(
  freq: 30,         // Data frequency (FPS)
  minCutoff: 1.0,   // Minimum cutoff (moderate smoothing when still)
  beta: 0.007,      // Speed coefficient (responsive to intentional movement)
  dCutoff: 1.0      // Derivative cutoff
)
```

**Why This Matters**:
- MediaPipe landmarks can jitter ±2-3 pixels per frame even when athlete is still
- Without filtering, sway metrics would be artificially inflated
- One-Euro preserves real movement (corrections, arm flapping) while removing sensor noise

### Sway Metrics

**Location**: [metricsCalculation.ts:287-380](../client/src/utils/metricsCalculation.ts#L287-L380)

**Process**:

1. **Extract Hip Trajectory**:
   ```typescript
   // For each frame
   const hipCenter = {
     x: (leftHip.x + rightHip.x) / 2,
     y: (leftHip.y + rightHip.y) / 2
   };
   ```

2. **Apply One-Euro Filter**:
   ```typescript
   const smoothedHips = smoothTrajectory(rawHipPositions, timestamps);
   ```

3. **Calculate Displacement**:
   ```typescript
   const trajectory = smoothedHips.map(pos => ({
     x: (pos.x - initialX) * scaleFactor,  // Convert to cm
     y: (pos.y - initialY) * scaleFactor
   }));
   ```

4. **Compute Metrics**:
   ```typescript
   // Standard deviation (variability)
   sway_std_x = calculateStdDev(trajectory.map(p => p.x));
   sway_std_y = calculateStdDev(trajectory.map(p => p.y));

   // Path length (total distance traveled)
   sway_path_length = sum(euclideanDistance(trajectory[i], trajectory[i+1]));

   // Velocity (distance per time)
   sway_velocity = sway_path_length / holdTime;
   ```

5. **Count Corrections**:
   ```typescript
   // Correction = move beyond 2cm threshold and return
   const distances = trajectory.map(p => sqrt(p.x² + p.y²));
   corrections_count = countThresholdCrossings(distances, 2.0, 0.0);
   ```

**Units**:
- `sway_std_x`, `sway_std_y`: **cm**
- `sway_path_length`: **cm**
- `sway_velocity`: **cm/s**
- `corrections_count`: **count**

### Arm Metrics

**Location**: [metricsCalculation.ts:382-406](../client/src/utils/metricsCalculation.ts#L382-L406)

**Process**:

1. **Calculate Angle Per Frame**:
   ```typescript
   for (const frame of landmarkHistory) {
     const leftAngle = calculateArmAngle(leftShoulder, leftWrist);
     const rightAngle = calculateArmAngle(rightShoulder, rightWrist);

     armAnglesLeft.push(leftAngle);
     armAnglesRight.push(rightAngle);

     // Track min/max for range
     minLeft = Math.min(minLeft, leftAngle);
     maxLeft = Math.max(maxLeft, leftAngle);
   }
   ```

2. **Compute Aggregate Metrics**:
   ```typescript
   // Averages
   arm_angle_left = mean(armAnglesLeft);
   arm_angle_right = mean(armAnglesRight);

   // Range (variability)
   arm_angle_range_left = maxLeft - minLeft;
   arm_angle_range_right = maxRight - minRight;

   // Standard deviation (stability)
   arm_angle_std_dev_left = calculateStdDev(armAnglesLeft);
   arm_angle_std_dev_right = calculateStdDev(armAnglesRight);

   // Asymmetry
   arm_asymmetry_ratio = abs(arm_angle_left) / abs(arm_angle_right);

   // Time above horizontal
   framesAboveHorizontal = count(armAngles.filter(a => a < 0));
   time_arms_above_horizontal = (framesAboveHorizontal / totalFrames) * 100;
   ```

**Units**:
- All arm angles: **degrees**
- `arm_asymmetry_ratio`: **ratio** (1.0 = perfect symmetry)
- `time_arms_above_horizontal`: **percentage** (0-100)

### Temporal Metrics

**Location**: [metricsCalculation.ts:410-510](../client/src/utils/metricsCalculation.ts#L410-L510)

**Two Granularities**:

#### 1. Test Thirds (Coarse Fatigue Analysis)

```typescript
const totalFrames = landmarkHistory.length;
const thirdSize = Math.floor(totalFrames / 3);

const firstThird = calculateSegmentMetrics(landmarkHistory, 0, thirdSize);
const middleThird = calculateSegmentMetrics(landmarkHistory, thirdSize, thirdSize * 2);
const lastThird = calculateSegmentMetrics(landmarkHistory, thirdSize * 2, totalFrames);
```

Each segment includes:
- `arm_angle_left`, `arm_angle_right` (degrees)
- `sway_velocity` (cm/s)
- `corrections_count` (count)

#### 2. Five-Second Segments (Fine-Grained Timeline)

**Location**: [metricsCalculation.ts:513-593](../client/src/utils/metricsCalculation.ts#L513-L593)

```typescript
const segmentDuration = 5;  // 5 seconds
const numSegments = Math.ceil(holdTime / 5);

for (let i = 0; i < numSegments; i++) {
  const startTime = i * 5;
  const endTime = Math.min((i + 1) * 5, holdTime);

  // Calculate metrics for this 5-second window
  const segment = extractSegmentMetrics(landmarkHistory, startTime, endTime);
  fiveSecondSegments.push(segment);
}
```

Each 5-second segment includes:
```typescript
interface FiveSecondSegment {
  start_time: number;      // Seconds
  end_time: number;        // Seconds
  avg_velocity: number;    // cm/s
  corrections: number;     // count
  arm_angle_left: number;  // degrees
  arm_angle_right: number; // degrees
  sway_std_x: number;      // cm
  sway_std_y: number;      // cm
}
```

**Purpose**: Provides LLM with granular timeline to understand *when* balance degraded/improved

### Event Detection

**Location**: [metricsCalculation.ts:595-828](../client/src/utils/metricsCalculation.ts#L595-L828)

#### Flapping Events (Arm Velocity Spikes)

**Algorithm**:
```typescript
// 1. Calculate frame-to-frame wrist velocity
for (let i = 1; i < landmarkHistory.length; i++) {
  const leftDist = euclideanDistance(prevLeftWrist, currLeftWrist);
  const rightDist = euclideanDistance(prevRightWrist, currRightWrist);
  const avgVelocity = ((leftDist + rightDist) / 2) * fps;
  armVelocities.push({ time, velocity: avgVelocity });
}

// 2. Calculate mean and std dev
const mean = average(armVelocities);
const stdDev = calculateStdDev(armVelocities);

// 3. Detect spikes > 2 std devs above mean
const threshold = mean + 2 * stdDev;
for (const { time, velocity } of armVelocities) {
  if (velocity > threshold) {
    // Flapping event detected!
    events.push({
      time,
      type: 'flapping',
      severity: calculateSeverity(velocity / threshold),
      detail: `Arm velocity spike: ${velocity.toFixed(1)} (threshold: ${threshold.toFixed(1)})`
    });
  }
}
```

**Cooldown**: 1 second between events to avoid duplicates

**Severity Levels**:
- `low`: velocity 1.0-1.5x threshold
- `medium`: velocity 1.5-2.0x threshold
- `high`: velocity >2.0x threshold

#### Correction Bursts (Instability Clusters)

**Algorithm**:
```typescript
// 1. Track when corrections happen
const correctionTimes = [];
for (let i = 0; i < trajectory.length; i++) {
  const distance = sqrt(trajectory[i].x² + trajectory[i].y²);
  if (crossedThreshold(distance, 2.0)) {
    correctionTimes.push(timestamps[i]);
  }
}

// 2. Find bursts: >3 corrections in 2-second window
const windowSize = 2.0;
for (let i = 0; i < correctionTimes.length; i++) {
  const windowStart = correctionTimes[i];
  const windowEnd = windowStart + 2.0;
  const correctionsInWindow = correctionTimes.filter(
    t => t >= windowStart && t <= windowEnd
  ).length;

  if (correctionsInWindow > 3) {
    events.push({
      time: windowStart,
      type: 'correction_burst',
      severity: correctionsInWindow > 5 ? 'high' : 'medium',
      detail: `${correctionsInWindow} corrections in 2s`
    });
  }
}
```

#### Stabilization Events (Achievement)

**Algorithm**:
```typescript
// 1. Calculate rolling velocity (0.5-second windows)
const windowFrames = Math.floor(fps * 0.5);
for (let i = windowFrames; i < trajectory.length; i++) {
  const windowTrajectory = trajectory.slice(i - windowFrames, i);
  const pathLength = calculatePathLength(windowTrajectory);
  const velocity = pathLength / (windowFrames / fps);
  velocities.push({ time: timestamps[i], velocity });
}

// 2. Find first sustained low velocity
const velocityThreshold = 2.0;  // cm/s
const requiredDuration = 2.0;   // seconds
const requiredFrames = Math.floor(requiredDuration * fps);

let stableCount = 0;
for (const { time, velocity } of velocities) {
  if (velocity < velocityThreshold) {
    stableCount++;
    if (stableCount >= requiredFrames) {
      events.push({
        time: stableStartTime,
        type: 'stabilized',
        detail: `Velocity dropped below 2 cm/s and maintained for 2+ seconds`
      });
      break;  // Only report first stabilization
    }
  } else {
    stableCount = 0;  // Reset
  }
}
```

---

## Data Models

### Client-Side Models (TypeScript)

**File**: [client/src/types/balanceTest.ts](../client/src/types/balanceTest.ts)

```typescript
interface CalculatedMetrics {
  // Sway metrics (cm)
  swayStdX: number;
  swayStdY: number;
  swayPathLength: number;
  swayVelocity: number;
  correctionsCount: number;

  // Arm metrics (degrees)
  armAngleLeft: number;
  armAngleRight: number;
  armAsymmetryRatio: number;
  armAngleRangeLeft: number;
  armAngleRangeRight: number;
  armAngleStdDevLeft: number;
  armAngleStdDevRight: number;
  timeArmsAboveHorizontal: number;

  // Temporal analysis
  temporal: TemporalMetrics;
  fiveSecondSegments: FiveSecondSegment[];
  events: BalanceEvent[];
}

interface TemporalMetrics {
  firstThird: SegmentMetrics;
  middleThird: SegmentMetrics;
  lastThird: SegmentMetrics;
}

interface SegmentMetrics {
  armAngleLeft: number;
  armAngleRight: number;
  swayVelocity: number;
  correctionsCount: number;
}

interface FiveSecondSegment {
  startTime: number;
  endTime: number;
  avgVelocity: number;
  corrections: number;
  armAngleLeft: number;
  armAngleRight: number;
  swayStdX: number;
  swayStdY: number;
}

interface BalanceEvent {
  time: number;
  type: 'flapping' | 'correction_burst' | 'stabilized' | 'arm_drop';
  severity?: 'low' | 'medium' | 'high';
  detail: string;
}
```

### Backend Models (Python/Pydantic)

**File**: [backend/app/models/assessment.py](../backend/app/models/assessment.py)

```python
class ClientMetricsData(BaseModel):
    """Client-side metrics (source of truth)"""
    success: bool
    hold_time: float
    failure_reason: Optional[str]

    # Sway metrics (cm)
    sway_std_x: float
    sway_std_y: float
    sway_path_length: float
    sway_velocity: float
    corrections_count: int

    # Arm metrics (degrees)
    arm_angle_left: float
    arm_angle_right: float
    arm_asymmetry_ratio: float

    # Temporal analysis
    temporal: TemporalMetrics
    five_second_segments: Optional[list[FiveSecondSegment]]
    events: Optional[list[BalanceEvent]]

class MetricsData(BaseModel):
    """Stored metrics (includes backend additions)"""
    # All client metrics (inherited)
    hold_time: float
    sway_std_x: float
    sway_std_y: float
    sway_path_length: float
    sway_velocity: float
    corrections_count: int
    arm_angle_left: float
    arm_angle_right: float
    arm_asymmetry_ratio: float
    temporal: Optional[TemporalMetrics]

    # Backend-calculated
    duration_score: int  # 1-5 (LTAD)
```

**Case Conversion**:
- Frontend uses `camelCase`
- Backend uses `snake_case`
- Automatic conversion via `camelcase-keys` and `snakecase-keys` packages

---

## LLM Input Format

**Current Implementation Status**: ⚠️ **Agent system NOT YET IMPLEMENTED**

The planned LLM input structure is defined in [BE-010-assessment-agent.md](../backend/prds/BE-010-assessment-agent.md) but needs updating.

### Planned Dynamic Context (Sent to LLM)

```markdown
# Current Assessment Data

**Athlete**: John Smith
**Age**: 12 years old
**Test**: One-Leg Balance (Left leg)

## Results

**Duration Score**: 4/5 (Proficient)
- Duration: 21.3 seconds
- Age Expectation: Meets expected for age 12

**Quality Metrics**:
- Sway Velocity: 3.2 cm/s
- Sway Std (X/Y): 1.8 cm / 2.4 cm
- Arm Angle (L/R): 8.5° / 12.3°
- Arm Asymmetry: 0.69
- Corrections: 7
- Result: Time Complete

**Temporal Breakdown**:
First Third (0-7.1s):
  - Arm Angle (L/R): 5.2° / 9.1°
  - Sway Velocity: 4.1 cm/s
  - Corrections: 3

Middle Third (7.1-14.2s):
  - Arm Angle (L/R): 8.7° / 13.2°
  - Sway Velocity: 3.5 cm/s
  - Corrections: 2

Last Third (14.2-21.3s):
  - Arm Angle (L/R): 11.6° / 14.5°
  - Sway Velocity: 2.1 cm/s
  - Corrections: 2

**Five-Second Timeline**:
0-5s: velocity 4.8 cm/s, corrections 2, arms 4.1°/8.2°
5-10s: velocity 3.9 cm/s, corrections 2, arms 7.3°/11.5°
10-15s: velocity 2.8 cm/s, corrections 1, arms 9.8°/13.8°
15-20s: velocity 2.2 cm/s, corrections 2, arms 12.1°/15.2°
20-21.3s: velocity 1.9 cm/s, corrections 0, arms 10.5°/13.1°

**Events Detected**:
- 2.3s: Flapping (medium severity) - Arm velocity spike: 15.2 (threshold: 8.4)
- 6.7s: Correction burst (medium) - 4 corrections in 2s
- 12.1s: Stabilized - Velocity dropped below 2 cm/s and maintained for 2+ seconds
```

### Static Context (Cached)

**File**: `backend/app/prompts/static_context.py` (to be created)

Contains:
- LTAD framework benchmarks
- Coaching cues library
- Age-appropriate expectations
- Assessment feedback format

**Prompt Caching**: Claude supports caching static context (~90% cost savings)

---

## Implementation References

### Key Files

**Client-Side**:
- [metricsCalculation.ts](../client/src/utils/metricsCalculation.ts) - All metric calculations
- [positionDetection.ts](../client/src/utils/positionDetection.ts) - Failure detection
- [balanceTest.ts](../client/src/types/balanceTest.ts) - TypeScript types

**Backend**:
- [assessment.py](../backend/app/models/assessment.py) - Pydantic models
- [assessments.py](../backend/app/routers/assessments.py) - API endpoint
- [scoring.py](../backend/app/constants/scoring.py) - LTAD thresholds

**Documentation**:
- [CV_METRICS_GUIDE.md](../client/src/utils/CV_METRICS_GUIDE.md) - Original technical notes (client-side)
- [CLAUDE.md](../CLAUDE.md) - Project overview and architecture

### Calculation Summary Table

| Metric | Location | Input | Processing | Output |
|--------|----------|-------|------------|--------|
| `sway_std_x` | [metricsCalculation.ts:348](../client/src/utils/metricsCalculation.ts#L348) | Normalized hips | Filter → Scale → StdDev(X) | cm |
| `sway_std_y` | [metricsCalculation.ts:348](../client/src/utils/metricsCalculation.ts#L348) | Normalized hips | Filter → Scale → StdDev(Y) | cm |
| `sway_path_length` | [metricsCalculation.ts:899](../client/src/utils/metricsCalculation.ts#L899) | Normalized hips | Filter → Scale → PathLength | cm |
| `sway_velocity` | [metricsCalculation.ts:900](../client/src/utils/metricsCalculation.ts#L900) | Path length | PathLength / Time | cm/s |
| `corrections_count` | [metricsCalculation.ts:906](../client/src/utils/metricsCalculation.ts#L906) | Hip trajectory | ThresholdCrossings(2cm) | count |
| `arm_angle_left` | [metricsCalculation.ts:952](../client/src/utils/metricsCalculation.ts#L952) | World landmarks | atan2(shoulder, wrist) → Mean | degrees |
| `arm_angle_right` | [metricsCalculation.ts:956](../client/src/utils/metricsCalculation.ts#L956) | World landmarks | atan2(shoulder, wrist) → Mean | degrees |
| `arm_asymmetry_ratio` | [metricsCalculation.ts:978](../client/src/utils/metricsCalculation.ts#L978) | Arm angles | abs(left) / abs(right) | ratio |
| `temporal` | [metricsCalculation.ts:903](../client/src/utils/metricsCalculation.ts#L903) | All landmarks | Segment by thirds | object |
| `five_second_segments` | [metricsCalculation.ts:984](../client/src/utils/metricsCalculation.ts#L984) | All landmarks | Segment by 5s windows | array |
| `events` | [metricsCalculation.ts:985](../client/src/utils/metricsCalculation.ts#L985) | Velocities, trajectory | Event detection algorithms | array |

### Coordinate System Decision Matrix

| Metric Category | Coordinate System | Rationale |
|----------------|------------------|-----------|
| Sway (position) | Normalized + scaled | Tracks screen position (what camera sees), scaled to cm |
| Arms (angles) | World | Accurate joint angles regardless of camera position |
| Failure detection | Normalized | Relative positions (foot vs ground) |
| Velocity | Normalized + scaled | Derived from sway trajectory |
| Events | Derived | Calculated from other metrics |

---

## Performance Considerations

### Client-Side Processing

**Why client-side?**:
- Real-time skeleton overlay (≥15 FPS requirement)
- Reduces server load and costs
- Faster feedback (no upload/download of raw landmarks)
- Works offline (after initial page load)

**Trade-offs**:
- Requires modern browser (WebGL for MediaPipe)
- CPU-intensive on older devices
- Metrics quality depends on client device performance

### Optimization Techniques

**Landmark Filtering**:
- Only store 8 landmarks (not all 33)
- Skip frames with visibility < 0.7
- Reduces storage by ~75%

**One-Euro Smoothing**:
- Adaptive filter (responsive when needed, smooth when still)
- Alternative considered: Simple moving average (too laggy for real-time overlay)

**Event Detection**:
- Statistical thresholds (2σ above mean for flapping)
- Cooldown periods to avoid duplicate events
- Early exit for stabilization (only report first instance)

---

## Testing & Validation

### Unit Tests (To Be Implemented)

**Metrics Calculation**:
```typescript
// Test sway calculation with known trajectory
test('sway_std_x calculates correctly', () => {
  const trajectory = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 0 }
  ];
  const { stdX } = calculateSwayStd(trajectory);
  expect(stdX).toBeCloseTo(0.894, 2);  // Known std dev
});
```

**Event Detection**:
```typescript
test('detects flapping events correctly', () => {
  // Mock velocity spike at 5 seconds
  const events = detectFlappingEvents(mockLandmarks, 10);
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('flapping');
  expect(events[0].time).toBeCloseTo(5.0, 1);
});
```

### Integration Tests

**End-to-End**:
1. Provide sample video with known characteristics
2. Run through complete pipeline
3. Verify metrics match expected values

**Known Test Cases**:
- Perfect balance (no sway): sway_velocity < 1 cm/s
- Excessive sway: sway_velocity > 5 cm/s
- Perfect T-position: arm angles ≈ 0°
- Dropped arms: arm angles > 20°

---

## Future Enhancements

**Planned**:
- [ ] Height normalization (scale metrics by athlete height)
- [ ] Torso tilt measurement (shoulder Y-position relative to hips)
- [ ] Confidence scores per metric (based on landmark visibility)
- [ ] Comparative analytics (athlete vs team avg)

**Under Consideration**:
- [ ] Gaze tracking (head orientation as proxy)
- [ ] Foot height measurement (raised foot Y-position)
- [ ] Multi-camera support (3D reconstruction)
- [ ] Real-time coaching feedback during test

---

## Troubleshooting

### Common Issues

**Q: Sway metrics seem too high**
- Check shoulder visibility in first few frames (needed for calibration)
- Verify One-Euro filter parameters (may need tuning for different FPS)
- Ensure camera is stable (camera movement adds to sway)

**Q: Arm angles are negative when they should be positive**
- Check world landmark coordinate system (Y-axis direction)
- Verify atan2 calculation (dy should be wrist.y - shoulder.y)

**Q: Events not detected**
- Check threshold calculations (require sufficient data for mean/stddev)
- Verify cooldown periods aren't too long
- Ensure landmark visibility is adequate

**Q: Metrics differ between identical tests**
- One-Euro filter has state (non-deterministic if different starting conditions)
- Shoulder width measurement can vary by a few pixels (affects scale)
- MediaPipe itself has slight non-determinism

---

## Additional Resources

- [MediaPipe Pose Documentation](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [One-Euro Filter Paper](http://cristal.univ-lille.fr/~casiez/1euro/)
- [LTAD Framework (Athletics Canada)](https://athletics.ca/long-term-athlete-development/)
- [CV_METRICS_FOR_USERS.md](CV_METRICS_FOR_USERS.md) - User-facing explanation
- [METRICS_QUICK_REFERENCE.md](METRICS_QUICK_REFERENCE.md) - Quick lookup table
