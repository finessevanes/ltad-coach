/**
 * Client-side metrics calculation for balance test.
 *
 * This module ports the backend metrics calculation logic to the client,
 * making the client the source of truth for all balance metrics.
 */

import { TimestampedLandmarks } from '../types/balanceTest';

// ============================================================================
// Constants (ported from backend/app/constants/scoring.py)
// ============================================================================

/** Reference values for normalization - used to scale metrics to 0-1 range */
export const REFERENCE_VALUES = {
  /** Max expected sway std (normalized coordinates) */
  swayStdMax: 0.08,
  /** Max expected sway velocity */
  swayVelocityMax: 0.015,
  /** Max expected arm excursion (normalized coords, not degrees) */
  armExcursionMax: 0.3,
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

/** Threshold for detecting balance corrections (normalized X displacement) */
export const CORRECTION_THRESHOLD = 0.02;

// ============================================================================
// Types
// ============================================================================

export interface Point2D {
  x: number;
  y: number;
}

export interface SwayMetrics {
  swayStdX: number;
  swayStdY: number;
  swayPathLength: number;
  swayVelocity: number;
  correctionsCount: number;
}

export interface CalculatedMetrics {
  holdTime: number;
  success: boolean;
  failureReason?: string;
  armDeviationLeft: number;
  armDeviationRight: number;
  armAsymmetryRatio: number;
  swayStdX: number;
  swayStdY: number;
  swayPathLength: number;
  swayVelocity: number;
  correctionsCount: number;
  stabilityScore: number;
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
// Math utilities (ported from backend/app/utils/math_utils.py)
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
      // Moved outside threshold
      outside = true;
    } else if (outside && distanceFromCenter < threshold) {
      // Returned inside threshold - count as correction
      corrections++;
      outside = false;
    }
  }

  return corrections;
}

// ============================================================================
// Hip trajectory extraction
// ============================================================================

/**
 * Extract hip center trajectory from filtered landmark history.
 * Hip center is used as a proxy for center of mass.
 */
export function extractHipTrajectory(
  landmarkHistory: TimestampedLandmarks[]
): Point2D[] {
  const trajectory: Point2D[] = [];

  for (const frame of landmarkHistory) {
    const landmarks = frame.landmarks;

    // Access filtered landmarks by index (not original MediaPipe index)
    const leftHip = landmarks[FILTERED_INDEX.LEFT_HIP];
    const rightHip = landmarks[FILTERED_INDEX.RIGHT_HIP];

    if (!leftHip || !rightHip) continue;

    // Hip center = midpoint
    const centerX = (leftHip.x + rightHip.x) / 2;
    const centerY = (leftHip.y + rightHip.y) / 2;

    trajectory.push({ x: centerX, y: centerY });
  }

  return trajectory;
}

// ============================================================================
// Sway metrics calculation
// ============================================================================

/**
 * Calculate sway standard deviation from hip trajectory.
 */
export function calculateSwayStd(trajectory: Point2D[]): { stdX: number; stdY: number } {
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
 * Calculate sway path length (total distance traveled by hip center).
 */
export function calculateSwayPathLength(trajectory: Point2D[]): number {
  return calculatePathLength(trajectory);
}

/**
 * Calculate sway velocity (path length / duration).
 */
export function calculateSwayVelocity(pathLength: number, duration: number): number {
  if (duration <= 0) return 0;
  return pathLength / duration;
}

/**
 * Count balance corrections (threshold crossings in hip X position).
 */
export function countCorrections(trajectory: Point2D[], threshold: number = CORRECTION_THRESHOLD): number {
  if (trajectory.length === 0) return 0;

  const xValues = trajectory.map((p) => p.x);
  const centerX = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;

  return countThresholdCrossings(xValues, threshold, centerX);
}

// ============================================================================
// Stability score calculation
// ============================================================================

/**
 * Calculate composite stability score (0-100, higher is better).
 *
 * Formula from backend:
 * norm_sway = min(sway_std / 0.08, 1.0)
 * norm_velocity = min(sway_velocity / 0.015, 1.0)
 * norm_arm = min(arm_deviation / 0.3, 1.0)
 * norm_corrections = min(corrections / 15, 1.0)
 *
 * weighted_avg = 0.25 * norm_sway + 0.30 * norm_velocity + 0.25 * norm_arm + 0.20 * norm_corrections
 * stability_score = (1 - weighted_avg) * 100
 */
export function calculateStabilityScore(
  swayStd: number,
  swayVelocity: number,
  armDeviation: number,
  corrections: number
): number {
  // Normalize each metric to [0, 1] using reference values
  const normSway = Math.min(swayStd / REFERENCE_VALUES.swayStdMax, 1.0);
  const normVelocity = Math.min(swayVelocity / REFERENCE_VALUES.swayVelocityMax, 1.0);
  const normArm = Math.min(armDeviation / REFERENCE_VALUES.armExcursionMax, 1.0);
  const normCorrections = Math.min(corrections / REFERENCE_VALUES.correctionsMax, 1.0);

  // Weighted average (lower is better for all metrics)
  const weightedAvg =
    STABILITY_WEIGHTS.swayStd * normSway +
    STABILITY_WEIGHTS.swayVelocity * normVelocity +
    STABILITY_WEIGHTS.armExcursion * normArm +
    STABILITY_WEIGHTS.corrections * normCorrections;

  // Convert to 0-100 scale (higher is better)
  const stabilityScore = (1 - weightedAvg) * 100;

  return Math.max(0, Math.min(100, stabilityScore));
}

// ============================================================================
// Main calculation function
// ============================================================================

/**
 * Calculate all metrics from test result data.
 *
 * @param landmarkHistory - Array of timestamped filtered landmarks
 * @param holdTime - Duration in seconds
 * @param success - Whether test was successful
 * @param failureReason - Optional failure reason
 * @param armDeviationLeft - Pre-calculated left arm deviation
 * @param armDeviationRight - Pre-calculated right arm deviation
 */
export function calculateAllMetrics(
  landmarkHistory: TimestampedLandmarks[],
  holdTime: number,
  success: boolean,
  failureReason?: string,
  armDeviationLeft: number = 0,
  armDeviationRight: number = 0
): CalculatedMetrics {
  // Extract hip trajectory
  const hipTrajectory = extractHipTrajectory(landmarkHistory);

  // Calculate sway metrics
  const { stdX, stdY } = calculateSwayStd(hipTrajectory);
  const swayPathLength = calculateSwayPathLength(hipTrajectory);
  const swayVelocity = calculateSwayVelocity(swayPathLength, holdTime);
  const correctionsCount = countCorrections(hipTrajectory);

  // Calculate arm asymmetry ratio
  const armAsymmetryRatio =
    Math.abs(armDeviationRight) > 0
      ? Math.abs(armDeviationLeft) / Math.abs(armDeviationRight)
      : 1.0;

  // Calculate stability score
  // Use combined sway std and average absolute arm deviation
  const combinedSwayStd = stdX + stdY;
  const avgArmDeviation = (Math.abs(armDeviationLeft) + Math.abs(armDeviationRight)) / 2;
  const stabilityScore = calculateStabilityScore(
    combinedSwayStd,
    swayVelocity,
    avgArmDeviation,
    correctionsCount
  );

  return {
    holdTime: Math.round(holdTime * 100) / 100,
    success,
    failureReason,
    armDeviationLeft: Math.round(armDeviationLeft * 1000000) / 1000000,
    armDeviationRight: Math.round(armDeviationRight * 1000000) / 1000000,
    armAsymmetryRatio: Math.round(armAsymmetryRatio * 100) / 100,
    swayStdX: Math.round(stdX * 1000000) / 1000000,
    swayStdY: Math.round(stdY * 1000000) / 1000000,
    swayPathLength: Math.round(swayPathLength * 1000000) / 1000000,
    swayVelocity: Math.round(swayVelocity * 1000000) / 1000000,
    correctionsCount,
    stabilityScore: Math.round(stabilityScore * 100) / 100,
  };
}
