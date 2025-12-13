/**
 * Client-side metrics calculation for balance test.
 *
 * COORDINATE SYSTEM NOTES (see CV_METRICS_GUIDE.md for details):
 * - Sway metrics: Uses NORMALIZED landmarks (tracks screen position) + smoothing + calibrated scale
 * - Arm angles: Uses WORLD landmarks (accurate for joint angles)
 *
 * Output units:
 * - Sway metrics: centimeters (cm)
 * - Arm angles: degrees
 * - Velocity: cm/s
 *
 * The client is the source of truth for all balance metrics.
 */

import {
  TimestampedLandmarks,
  SegmentMetrics,
  TemporalMetrics,
} from '../types/balanceTest';
import { PoseLandmark } from '../types/mediapipe';

// ============================================================================
// Constants
// ============================================================================

/** Reference values for stability score calculation (real-world units) */
export const REFERENCE_VALUES = {
  /** Max expected sway std in cm */
  swayStdMax: 8.0,
  /** Max expected sway velocity in cm/s */
  swayVelocityMax: 5.0,
  /** Max expected arm angle drop in degrees */
  armAngleMax: 45.0,
  /** Max expected corrections */
  correctionsMax: 15,
} as const;

/** Stability score component weights */
export const STABILITY_WEIGHTS = {
  swayStd: 0.25,
  swayVelocity: 0.30,
  armExcursion: 0.25,
  corrections: 0.20,
} as const;

/** Threshold for detecting balance corrections in cm */
export const CORRECTION_THRESHOLD_CM = 2.0;

/** Average shoulder width in cm (used for scale calibration) */
const AVERAGE_SHOULDER_WIDTH_CM = 40.0;

/** Fallback scale if shoulder width can't be measured */
const FALLBACK_SCALE_CM = 150.0;

// ============================================================================
// One-Euro Filter (for smoothing landmark jitter)
// ============================================================================

/**
 * One-Euro Filter - adaptive low-pass filter for noisy signals.
 *
 * This filter is commonly used in motion tracking and was used internally
 * by MediaPipe's legacy pose solution. It adapts its cutoff frequency based
 * on the speed of movement: more smoothing when still, more responsive when moving.
 *
 * Reference: http://cristal.univ-lille.fr/~casiez/1euro/
 */
class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  constructor(private alpha: number) {}

  setAlpha(alpha: number): void {
    this.alpha = alpha;
  }

  filter(value: number): number {
    if (this.y === null) {
      this.y = value;
      this.s = value;
    } else {
      this.y = this.alpha * value + (1 - this.alpha) * (this.s as number);
      this.s = this.y;
    }
    return this.y;
  }

  lastValue(): number | null {
    return this.y;
  }
}

class OneEuroFilter {
  private freq: number;
  private minCutoff: number;
  private beta: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  /**
   * Create a One-Euro filter.
   * @param freq - Data frequency in Hz (e.g., 30 for 30fps)
   * @param minCutoff - Minimum cutoff frequency (lower = more smoothing when still)
   * @param beta - Speed coefficient (higher = more responsive to fast movements)
   * @param dCutoff - Derivative cutoff frequency
   */
  constructor(freq: number = 30, minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.xFilter = new LowPassFilter(this.alpha(minCutoff));
    this.dxFilter = new LowPassFilter(this.alpha(dCutoff));
  }

  private alpha(cutoff: number): number {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(value: number, timestamp?: number): number {
    // Update frequency estimate if timestamp provided
    if (timestamp !== undefined && this.lastTime !== null) {
      const dt = timestamp - this.lastTime;
      if (dt > 0) {
        this.freq = 1.0 / dt;
      }
    }
    this.lastTime = timestamp ?? null;

    // Estimate derivative
    const prevX = this.xFilter.lastValue();
    const dx = prevX !== null ? (value - prevX) * this.freq : 0;
    const edx = this.dxFilter.filter(dx);

    // Adaptive cutoff based on derivative magnitude
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    this.xFilter.setAlpha(this.alpha(cutoff));

    return this.xFilter.filter(value);
  }
}

/**
 * Apply One-Euro filter to smooth a trajectory.
 * Creates separate filters for X and Y to preserve independent smoothing.
 */
function smoothTrajectory(
  rawPoints: Point2D[],
  timestamps?: number[]
): Point2D[] {
  if (rawPoints.length === 0) return [];

  // Parameters tuned for 30fps pose data
  // minCutoff=1.0: moderate smoothing when still
  // beta=0.007: responsive to intentional movement
  const filterX = new OneEuroFilter(30, 1.0, 0.007, 1.0);
  const filterY = new OneEuroFilter(30, 1.0, 0.007, 1.0);

  return rawPoints.map((point, i) => {
    const t = timestamps?.[i];
    return {
      x: filterX.filter(point.x, t),
      y: filterY.filter(point.y, t),
    };
  });
}

// ============================================================================
// Scale Calibration (shoulder-width based)
// ============================================================================

/**
 * Calculate scale factor from shoulder width in normalized coordinates.
 * Uses average human shoulder width (~40cm) to convert normalized coords to cm.
 *
 * This adapts to:
 * - Different camera distances
 * - Different body sizes
 * - Different frame sizes
 */
function calculateScaleFactor(landmarkHistory: TimestampedLandmarks[]): number {
  // Try to get shoulder width from first few frames with valid data
  for (const frame of landmarkHistory.slice(0, 10)) {
    const landmarks = frame.landmarks;
    if (!landmarks || landmarks.length === 0) continue;

    const leftShoulder = landmarks[FILTERED_INDEX.LEFT_SHOULDER];
    const rightShoulder = landmarks[FILTERED_INDEX.RIGHT_SHOULDER];

    if (!leftShoulder || !rightShoulder) continue;

    // Calculate shoulder width in normalized coordinates
    const shoulderWidthNorm = Math.abs(rightShoulder.x - leftShoulder.x);

    // Avoid division by zero or unrealistic values
    if (shoulderWidthNorm > 0.05 && shoulderWidthNorm < 0.8) {
      // Scale factor: cm per normalized unit
      return AVERAGE_SHOULDER_WIDTH_CM / shoulderWidthNorm;
    }
  }

  // Fallback if shoulders not detected
  return FALLBACK_SCALE_CM;
}

// ============================================================================
// Types
// ============================================================================

export interface Point2D {
  x: number;
  y: number;
}

// ============================================================================
// Index mapping for filtered landmarks
// ============================================================================

/**
 * Maps LANDMARK_INDEX values to indices in filtered landmark array.
 * The filtered array contains landmarks in REQUIRED_LANDMARK_INDICES order.
 */
const FILTERED_INDEX = {
  LEFT_SHOULDER: 0,  // REQUIRED_LANDMARK_INDICES[0] = 11
  RIGHT_SHOULDER: 1, // REQUIRED_LANDMARK_INDICES[1] = 12
  LEFT_WRIST: 2,     // REQUIRED_LANDMARK_INDICES[2] = 15
  RIGHT_WRIST: 3,    // REQUIRED_LANDMARK_INDICES[3] = 16
  LEFT_HIP: 4,       // REQUIRED_LANDMARK_INDICES[4] = 23
  RIGHT_HIP: 5,      // REQUIRED_LANDMARK_INDICES[5] = 24
  LEFT_ANKLE: 6,     // REQUIRED_LANDMARK_INDICES[6] = 27
  RIGHT_ANKLE: 7,    // REQUIRED_LANDMARK_INDICES[7] = 28
} as const;

// ============================================================================
// Math utilities
// ============================================================================

/**
 * Calculate Euclidean distance between two 2D points.
 */
function calculateEuclideanDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Calculate total path length from sequence of 2D points.
 */
function calculatePathLength(points: Point2D[]): number {
  if (points.length < 2) return 0;

  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += calculateEuclideanDistance(points[i - 1], points[i]);
  }
  return length;
}

/**
 * Calculate standard deviation of an array of numbers.
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => (val - mean) ** 2);
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Count number of times signal crosses threshold distance from center.
 * This detects balance corrections - moments when the athlete moves
 * significantly from center and then returns.
 */
function countThresholdCrossings(
  values: number[],
  threshold: number,
  center: number
): number {
  let corrections = 0;
  let outside = false;

  for (const value of values) {
    const distanceFromCenter = Math.abs(value - center);

    if (!outside && distanceFromCenter > threshold) {
      outside = true;
    } else if (outside && distanceFromCenter < threshold) {
      corrections++;
      outside = false;
    }
  }

  return corrections;
}

// ============================================================================
// Hip trajectory extraction (smoothed normalized landmarks + calibrated scale)
// ============================================================================

/**
 * Extract hip trajectory from NORMALIZED landmarks with smoothing.
 * Returns displacement from initial position in CENTIMETERS.
 *
 * Process:
 * 1. Extract raw hip center positions (normalized coords)
 * 2. Apply One-Euro filter to remove jitter
 * 3. Calculate displacement from initial position
 * 4. Scale to cm using shoulder-width calibration
 */
function extractHipTrajectory(landmarkHistory: TimestampedLandmarks[]): Point2D[] {
  if (landmarkHistory.length === 0) return [];

  // Step 1: Calculate scale factor from shoulder width
  const scaleFactor = calculateScaleFactor(landmarkHistory);
  console.log('[HipTrajectory] Scale factor (cm per normalized unit):', scaleFactor.toFixed(2));

  // Step 2: Extract raw hip positions and timestamps
  const rawPositions: Point2D[] = [];
  const timestamps: number[] = [];

  for (const frame of landmarkHistory) {
    const normalizedLandmarks = frame.landmarks;
    if (!normalizedLandmarks || normalizedLandmarks.length === 0) continue;

    const leftHip = normalizedLandmarks[FILTERED_INDEX.LEFT_HIP];
    const rightHip = normalizedLandmarks[FILTERED_INDEX.RIGHT_HIP];

    if (!leftHip || !rightHip) continue;

    // Hip center in normalized coordinates
    rawPositions.push({
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    });
    timestamps.push(frame.timestamp / 1000); // Convert ms to seconds for filter
  }

  if (rawPositions.length === 0) return [];

  // Step 3: Apply One-Euro filter to smooth jitter
  const smoothedPositions = smoothTrajectory(rawPositions, timestamps);

  // DEBUG: Compare raw vs smoothed
  const rawXRange = Math.max(...rawPositions.map(p => p.x)) - Math.min(...rawPositions.map(p => p.x));
  const smoothedXRange = Math.max(...smoothedPositions.map(p => p.x)) - Math.min(...smoothedPositions.map(p => p.x));
  console.log('[HipTrajectory] Raw X range (normalized):', rawXRange.toFixed(4));
  console.log('[HipTrajectory] Smoothed X range (normalized):', smoothedXRange.toFixed(4));
  console.log('[HipTrajectory] Smoothing reduced noise by:', ((1 - smoothedXRange/rawXRange) * 100).toFixed(1) + '%');

  // Step 4: Calculate displacement from initial position, convert to cm
  const initialX = smoothedPositions[0].x;
  const initialY = smoothedPositions[0].y;

  const trajectory = smoothedPositions.map((pos) => ({
    x: (pos.x - initialX) * scaleFactor,
    y: (pos.y - initialY) * scaleFactor,
  }));

  // DEBUG: Log trajectory stats
  const maxX = Math.max(...trajectory.map(p => Math.abs(p.x)));
  const maxY = Math.max(...trajectory.map(p => Math.abs(p.y)));
  console.log('[HipTrajectory] Max X displacement (cm):', maxX.toFixed(2));
  console.log('[HipTrajectory] Max Y displacement (cm):', maxY.toFixed(2));

  return trajectory;
}

// ============================================================================
// Sway metrics calculation
// ============================================================================

/**
 * Calculate sway standard deviation from hip trajectory.
 */
function calculateSwayStd(trajectory: Point2D[]): { stdX: number; stdY: number } {
  if (trajectory.length === 0) {
    return { stdX: 0, stdY: 0 };
  }

  const xValues = trajectory.map((p) => p.x);
  const yValues = trajectory.map((p) => p.y);

  return {
    stdX: calculateStdDev(xValues),
    stdY: calculateStdDev(yValues),
  };
}

/**
 * Count balance corrections using 2D Euclidean distance from starting position.
 * A correction = moving beyond threshold, then returning within threshold.
 *
 * @param trajectory - Hip trajectory (displacement from initial position in CM)
 * @param thresholdCm - Distance threshold in cm (default 2cm)
 */
function countCorrections(trajectory: Point2D[], thresholdCm: number = CORRECTION_THRESHOLD_CM): number {
  if (trajectory.length === 0) return 0;

  // Use 2D Euclidean distance from origin (initial position)
  // Trajectory is already displacement-based, so center is (0, 0)
  const distances = trajectory.map((p) => Math.sqrt(p.x * p.x + p.y * p.y));

  // Count threshold crossings using distance from origin (center = 0)
  return countThresholdCrossings(distances, thresholdCm, 0);
}

// ============================================================================
// Arm angle calculation
// ============================================================================

/**
 * Calculate arm angle from horizontal using world landmarks.
 * Uses atan2 to get actual angle in degrees.
 *
 * @param shoulder - Shoulder landmark (world coordinates in meters)
 * @param wrist - Wrist landmark (world coordinates in meters)
 * @returns Angle in degrees. 0° = horizontal (T-position), positive = below horizontal
 */
function calculateArmAngle(shoulder: PoseLandmark, wrist: PoseLandmark): number {
  // World landmarks: x = left/right, y = up/down (negative = up), z = forward/back
  const dx = wrist.x - shoulder.x; // Horizontal distance (left/right)
  const dy = wrist.y - shoulder.y; // Vertical distance (negative = wrist above shoulder)

  // atan2 gives angle in radians
  // We use abs(dx) so the angle is always measured from horizontal
  // dy positive = wrist below shoulder = positive angle (dropped)
  // dy negative = wrist above shoulder = negative angle (raised)
  const angleRad = Math.atan2(dy, Math.abs(dx));
  const angleDeg = angleRad * (180 / Math.PI);

  return Math.round(angleDeg * 10) / 10; // Round to 1 decimal
}

// ============================================================================
// Stability score calculation
// ============================================================================

/**
 * Calculate composite stability score (0-100, higher is better).
 *
 * Uses real-world reference values to normalize metrics before weighting.
 */
function calculateStabilityScore(
  swayStdCm: number,
  swayVelocityCmS: number,
  armAngleDeg: number,
  corrections: number
): number {
  // Normalize each metric to [0, 1] using reference values
  const normSway = Math.min(swayStdCm / REFERENCE_VALUES.swayStdMax, 1.0);
  const normVelocity = Math.min(swayVelocityCmS / REFERENCE_VALUES.swayVelocityMax, 1.0);
  const normArm = Math.min(Math.abs(armAngleDeg) / REFERENCE_VALUES.armAngleMax, 1.0);
  const normCorrections = Math.min(corrections / REFERENCE_VALUES.correctionsMax, 1.0);

  // Weighted average (lower is better for all metrics)
  const weightedAvg =
    STABILITY_WEIGHTS.swayStd * normSway +
    STABILITY_WEIGHTS.swayVelocity * normVelocity +
    STABILITY_WEIGHTS.armExcursion * normArm +
    STABILITY_WEIGHTS.corrections * normCorrections;

  // Convert to 0-100 scale (higher is better)
  const stabilityScore = (1 - weightedAvg) * 100;

  return Math.max(0, Math.min(100, Math.round(stabilityScore * 100) / 100));
}

// ============================================================================
// Temporal metrics (fatigue analysis)
// ============================================================================

/**
 * Calculate metrics for a temporal segment of the test.
 */
function calculateSegmentMetrics(
  landmarkHistory: TimestampedLandmarks[],
  startIdx: number,
  endIdx: number,
  segmentDuration: number
): SegmentMetrics {
  const segment = landmarkHistory.slice(startIdx, endIdx);

  if (segment.length === 0) {
    return {
      armAngleLeft: 0,
      armAngleRight: 0,
      swayVelocity: 0,
      correctionsCount: 0,
    };
  }

  // Calculate arm angles for this segment
  let totalArmAngleLeft = 0;
  let totalArmAngleRight = 0;
  let armCount = 0;

  for (const frame of segment) {
    const worldLandmarks = frame.worldLandmarks;
    if (!worldLandmarks || worldLandmarks.length === 0) continue;

    const leftShoulder = worldLandmarks[FILTERED_INDEX.LEFT_SHOULDER];
    const leftWrist = worldLandmarks[FILTERED_INDEX.LEFT_WRIST];
    const rightShoulder = worldLandmarks[FILTERED_INDEX.RIGHT_SHOULDER];
    const rightWrist = worldLandmarks[FILTERED_INDEX.RIGHT_WRIST];

    if (leftShoulder && leftWrist && rightShoulder && rightWrist) {
      totalArmAngleLeft += calculateArmAngle(leftShoulder, leftWrist);
      totalArmAngleRight += calculateArmAngle(rightShoulder, rightWrist);
      armCount++;
    }
  }

  const avgArmAngleLeft = armCount > 0 ? totalArmAngleLeft / armCount : 0;
  const avgArmAngleRight = armCount > 0 ? totalArmAngleRight / armCount : 0;

  // Calculate sway for this segment using smoothed normalized landmarks
  // extractHipTrajectory now returns trajectory in CM (already scaled)
  const trajectory = extractHipTrajectory(segment);
  const pathLengthCm = calculatePathLength(trajectory);
  const swayVelocityCmS = segmentDuration > 0 ? pathLengthCm / segmentDuration : 0;

  // Count corrections in this segment (threshold in cm)
  const correctionsCount = countCorrections(trajectory, CORRECTION_THRESHOLD_CM);

  return {
    armAngleLeft: Math.round(avgArmAngleLeft * 10) / 10,
    armAngleRight: Math.round(avgArmAngleRight * 10) / 10,
    swayVelocity: Math.round(swayVelocityCmS * 100) / 100,
    correctionsCount,
  };
}

/**
 * Calculate temporal metrics - break test into thirds for fatigue analysis.
 */
function calculateTemporalMetrics(
  landmarkHistory: TimestampedLandmarks[],
  holdTime: number
): TemporalMetrics {
  const totalFrames = landmarkHistory.length;
  const thirdSize = Math.floor(totalFrames / 3);
  const segmentDuration = holdTime / 3;

  const firstThird = calculateSegmentMetrics(
    landmarkHistory,
    0,
    thirdSize,
    segmentDuration
  );

  const middleThird = calculateSegmentMetrics(
    landmarkHistory,
    thirdSize,
    thirdSize * 2,
    segmentDuration
  );

  const lastThird = calculateSegmentMetrics(
    landmarkHistory,
    thirdSize * 2,
    totalFrames,
    segmentDuration
  );

  return {
    firstThird,
    middleThird,
    lastThird,
  };
}

// ============================================================================
// Main calculation function
// ============================================================================

/**
 * Metrics result type (subset of TestResult, without success/holdTime/etc)
 */
export interface CalculatedMetrics {
  swayStdX: number;
  swayStdY: number;
  swayPathLength: number;
  swayVelocity: number;
  correctionsCount: number;
  armAngleLeft: number;
  armAngleRight: number;
  armAsymmetryRatio: number;
  stabilityScore: number;
  temporal: TemporalMetrics;
}

/**
 * Calculate all metrics from landmark history.
 * Returns metrics in real-world units (cm, degrees).
 *
 * APPROACH (see CV_METRICS_GUIDE.md):
 * - Sway metrics: Uses NORMALIZED landmarks (tracks screen position)
 *   + One-Euro smoothing (removes jitter)
 *   + Shoulder-width calibration (converts to cm)
 * - Arm angles: Uses WORLD landmarks (accurate for joint angles)
 *
 * @param landmarkHistory - Array of timestamped filtered landmarks
 * @param holdTime - Duration in seconds
 * @returns Calculated metrics or null if landmarks unavailable
 */
export function calculateMetrics(
  landmarkHistory: TimestampedLandmarks[],
  holdTime: number
): CalculatedMetrics | null {
  // Check if we have landmarks
  const hasLandmarks = landmarkHistory.some(
    (frame) => frame.landmarks && frame.landmarks.length > 0
  );

  if (!hasLandmarks) {
    console.warn('[Metrics] No landmarks available');
    return null;
  }

  // Extract hip trajectory using smoothed NORMALIZED landmarks
  // Returns trajectory already in CM (shoulder-width calibrated)
  const hipTrajectory = extractHipTrajectory(landmarkHistory);

  if (hipTrajectory.length === 0) {
    console.warn('[Metrics] Could not extract hip trajectory');
    return null;
  }

  // Calculate sway metrics (trajectory is already in CM)
  const { stdX, stdY } = calculateSwayStd(hipTrajectory);
  const swayStdXCm = stdX;
  const swayStdYCm = stdY;

  const swayPathLengthCm = calculatePathLength(hipTrajectory);
  const swayVelocityCmS = holdTime > 0 ? swayPathLengthCm / holdTime : 0;

  // Calculate temporal metrics (fatigue analysis) - do this first so we can sum corrections
  const temporal = calculateTemporalMetrics(landmarkHistory, holdTime);

  // Sum corrections from all segments for consistency with temporal breakdown
  const correctionsCount =
    temporal.firstThird.correctionsCount +
    temporal.middleThird.correctionsCount +
    temporal.lastThird.correctionsCount;

  // Calculate arm angles
  let totalArmAngleLeft = 0;
  let totalArmAngleRight = 0;
  let armCount = 0;

  for (const frame of landmarkHistory) {
    const worldLandmarks = frame.worldLandmarks;
    if (!worldLandmarks || worldLandmarks.length === 0) continue;

    const leftShoulder = worldLandmarks[FILTERED_INDEX.LEFT_SHOULDER];
    const leftWrist = worldLandmarks[FILTERED_INDEX.LEFT_WRIST];
    const rightShoulder = worldLandmarks[FILTERED_INDEX.RIGHT_SHOULDER];
    const rightWrist = worldLandmarks[FILTERED_INDEX.RIGHT_WRIST];

    if (leftShoulder && leftWrist && rightShoulder && rightWrist) {
      totalArmAngleLeft += calculateArmAngle(leftShoulder, leftWrist);
      totalArmAngleRight += calculateArmAngle(rightShoulder, rightWrist);
      armCount++;
    }
  }

  const armAngleLeft = armCount > 0 ? totalArmAngleLeft / armCount : 0;
  const armAngleRight = armCount > 0 ? totalArmAngleRight / armCount : 0;

  // Calculate arm asymmetry ratio
  const armAsymmetryRatio =
    Math.abs(armAngleRight) > 0
      ? Math.abs(armAngleLeft) / Math.abs(armAngleRight)
      : 1.0;

  // Calculate stability score
  const combinedSwayStdCm = swayStdXCm + swayStdYCm;
  const avgArmAngle = (Math.abs(armAngleLeft) + Math.abs(armAngleRight)) / 2;
  const stabilityScore = calculateStabilityScore(
    combinedSwayStdCm,
    swayVelocityCmS,
    avgArmAngle,
    correctionsCount
  );

  // DEBUG: Log final metrics summary
  console.log('\n========== METRICS SUMMARY ==========');
  console.log('[Metrics] Hold time:', holdTime.toFixed(1), 's');
  console.log('[Metrics] Frames processed:', landmarkHistory.length);
  console.log('--- SWAY (should be LOW if standing still, HIGHER if swaying) ---');
  console.log('[Metrics] Sway Std X:', swayStdXCm.toFixed(2), 'cm');
  console.log('[Metrics] Sway Std Y:', swayStdYCm.toFixed(2), 'cm');
  console.log('[Metrics] Path Length:', swayPathLengthCm.toFixed(2), 'cm');
  console.log('[Metrics] Velocity:', swayVelocityCmS.toFixed(2), 'cm/s');
  console.log('--- CORRECTIONS (should match intentional balance adjustments) ---');
  console.log('[Metrics] Total Corrections:', correctionsCount);
  console.log('[Metrics] By segment: 1st=' + temporal.firstThird.correctionsCount +
              ', 2nd=' + temporal.middleThird.correctionsCount +
              ', 3rd=' + temporal.lastThird.correctionsCount);
  console.log('--- ARM ANGLES (should change with arm flapping) ---');
  console.log('[Metrics] Left Arm Angle:', armAngleLeft.toFixed(1), '°');
  console.log('[Metrics] Right Arm Angle:', armAngleRight.toFixed(1), '°');
  console.log('--- FINAL SCORE ---');
  console.log('[Metrics] Stability Score:', stabilityScore.toFixed(1), '/ 100');
  console.log('=====================================\n');

  // DEBUG: Download full trajectory data as JSON for analysis
  const debugData = {
    timestamp: new Date().toISOString(),
    holdTime,
    frameCount: landmarkHistory.length,
    scaleFactor: calculateScaleFactor(landmarkHistory),
    trajectory: hipTrajectory.map((p, i) => ({
      frame: i,
      x_cm: Math.round(p.x * 100) / 100,
      y_cm: Math.round(p.y * 100) / 100,
      distance_cm: Math.round(Math.sqrt(p.x * p.x + p.y * p.y) * 100) / 100,
    })),
    metrics: {
      swayStdX: swayStdXCm,
      swayStdY: swayStdYCm,
      swayPathLength: swayPathLengthCm,
      swayVelocity: swayVelocityCmS,
      correctionsCount,
      armAngleLeft,
      armAngleRight,
      stabilityScore,
    },
    temporal,
    referenceValues: REFERENCE_VALUES,
  };
  const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `balance-test-debug-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.log('[Metrics] Debug data downloaded as JSON');

  return {
    swayStdX: Math.round(swayStdXCm * 100) / 100,
    swayStdY: Math.round(swayStdYCm * 100) / 100,
    swayPathLength: Math.round(swayPathLengthCm * 100) / 100,
    swayVelocity: Math.round(swayVelocityCmS * 100) / 100,
    correctionsCount,
    armAngleLeft: Math.round(armAngleLeft * 10) / 10,
    armAngleRight: Math.round(armAngleRight * 10) / 10,
    armAsymmetryRatio: Math.round(armAsymmetryRatio * 100) / 100,
    stabilityScore,
    temporal,
  };
}
