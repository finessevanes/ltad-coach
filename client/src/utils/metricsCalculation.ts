/**
 * Client-side metrics calculation for balance test.
 *
 * All metrics are calculated from MediaPipe's worldLandmarks in real-world units:
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

/** Threshold for detecting balance corrections (2cm in meters) */
export const CORRECTION_THRESHOLD = 0.02;

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
// Hip trajectory extraction (from world landmarks)
// ============================================================================

/**
 * Extract hip trajectory from world landmarks (in meters).
 * Tracks displacement from initial position to capture actual body sway.
 */
function extractHipTrajectory(landmarkHistory: TimestampedLandmarks[]): Point2D[] {
  const trajectory: Point2D[] = [];
  let initialX: number | null = null;
  let initialY: number | null = null;

  for (const frame of landmarkHistory) {
    const worldLandmarks = frame.worldLandmarks;
    if (!worldLandmarks || worldLandmarks.length === 0) continue;

    const leftHip = worldLandmarks[FILTERED_INDEX.LEFT_HIP];
    const rightHip = worldLandmarks[FILTERED_INDEX.RIGHT_HIP];

    if (!leftHip || !rightHip) continue;

    // Hip center = midpoint
    const centerX = (leftHip.x + rightHip.x) / 2;
    const centerY = (leftHip.y + rightHip.y) / 2;

    // Set initial position on first valid frame
    if (initialX === null) {
      initialX = centerX;
      initialY = centerY;
    }

    // Track displacement from initial (in meters)
    trajectory.push({
      x: centerX - initialX,
      y: centerY - initialY!,
    });
  }

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
 * Count balance corrections (threshold crossings in hip X position).
 */
function countCorrections(trajectory: Point2D[]): number {
  if (trajectory.length === 0) return 0;

  const xValues = trajectory.map((p) => p.x);
  const centerX = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;

  return countThresholdCrossings(xValues, CORRECTION_THRESHOLD, centerX);
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

  // Calculate sway for this segment
  const worldTrajectory = extractHipTrajectory(segment);
  const pathLengthMeters = calculatePathLength(worldTrajectory);
  const pathLengthCm = pathLengthMeters * 100;
  const swayVelocityCmS = segmentDuration > 0 ? pathLengthCm / segmentDuration : 0;

  // Count corrections in this segment
  const correctionsCount = countCorrections(worldTrajectory);

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
 * @param landmarkHistory - Array of timestamped filtered landmarks (must include worldLandmarks)
 * @param holdTime - Duration in seconds
 * @returns Calculated metrics or null if world landmarks unavailable
 */
export function calculateMetrics(
  landmarkHistory: TimestampedLandmarks[],
  holdTime: number
): CalculatedMetrics | null {
  // Check if world landmarks are available
  const hasWorldLandmarks = landmarkHistory.some(
    (frame) => frame.worldLandmarks && frame.worldLandmarks.length > 0
  );

  if (!hasWorldLandmarks) {
    console.warn('[Metrics] No world landmarks available');
    return null;
  }

  // Extract world hip trajectory
  const hipTrajectory = extractHipTrajectory(landmarkHistory);

  if (hipTrajectory.length === 0) {
    console.warn('[Metrics] Could not extract hip trajectory');
    return null;
  }

  // Calculate sway metrics in meters, then convert to cm
  const { stdX, stdY } = calculateSwayStd(hipTrajectory);
  const swayStdXCm = stdX * 100;
  const swayStdYCm = stdY * 100;

  const pathLengthMeters = calculatePathLength(hipTrajectory);
  const swayPathLengthCm = pathLengthMeters * 100;

  const swayVelocityMetersSec = holdTime > 0 ? pathLengthMeters / holdTime : 0;
  const swayVelocityCmS = swayVelocityMetersSec * 100;

  // Count corrections
  const correctionsCount = countCorrections(hipTrajectory);

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

  // Calculate temporal metrics (fatigue analysis)
  const temporal = calculateTemporalMetrics(landmarkHistory, holdTime);

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
