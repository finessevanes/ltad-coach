/**
 * Metrics Comparison Utility
 *
 * Compares balance metrics calculated from normalized landmarks vs world landmarks.
 * Run this to see the difference in values between the two approaches.
 */

import { TimestampedLandmarks } from '../types/balanceTest';
import { PoseLandmark } from '../types/mediapipe';

// ============================================================================
// Types
// ============================================================================

interface Point2D {
  x: number;
  y: number;
}

interface SwayMetricsResult {
  swayStdX: number;
  swayStdY: number;
  swayPathLength: number;
  swayVelocity: number;
  correctionsCount: number;
}

interface ComparisonResult {
  normalized: SwayMetricsResult & { unit: string };
  world: SwayMetricsResult & { unit: string };
  analysis: {
    stdXRatio: number;
    stdYRatio: number;
    pathLengthRatio: number;
    velocityRatio: number;
    recommendation: string;
  };
}

// ============================================================================
// Index mapping for filtered landmarks
// ============================================================================

const FILTERED_INDEX = {
  LEFT_SHOULDER: 0,
  RIGHT_SHOULDER: 1,
  LEFT_WRIST: 2,
  RIGHT_WRIST: 3,
  LEFT_HIP: 4,
  RIGHT_HIP: 5,
  LEFT_ANKLE: 6,
  RIGHT_ANKLE: 7,
} as const;

// ============================================================================
// Math utilities
// ============================================================================

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => (val - mean) ** 2);
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

function calculatePathLength(points: Point2D[]): number {
  if (points.length < 2) return 0;
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

function countCorrections(trajectory: Point2D[], threshold: number): number {
  if (trajectory.length === 0) return 0;
  const xValues = trajectory.map((p) => p.x);
  const centerX = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;

  let corrections = 0;
  let outside = false;

  for (const value of xValues) {
    const distanceFromCenter = Math.abs(value - centerX);
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
// Trajectory extraction
// ============================================================================

function extractHipTrajectoryNormalized(landmarkHistory: TimestampedLandmarks[]): Point2D[] {
  const trajectory: Point2D[] = [];

  for (const frame of landmarkHistory) {
    const landmarks = frame.landmarks;
    const leftHip = landmarks[FILTERED_INDEX.LEFT_HIP];
    const rightHip = landmarks[FILTERED_INDEX.RIGHT_HIP];

    if (!leftHip || !rightHip) continue;

    trajectory.push({
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    });
  }

  return trajectory;
}

function extractHipTrajectoryWorld(landmarkHistory: TimestampedLandmarks[]): Point2D[] {
  const trajectory: Point2D[] = [];

  // World landmarks are hip-centered (origin at pelvis), so hip midpoint is always ~(0,0).
  // Instead, we track the LEFT HIP position relative to its starting point.
  // This captures the actual body sway in real-world meters.

  let initialX: number | null = null;
  let initialY: number | null = null;

  for (const frame of landmarkHistory) {
    const worldLandmarks = frame.worldLandmarks;
    if (!worldLandmarks || worldLandmarks.length === 0) continue;

    const leftHip = worldLandmarks[FILTERED_INDEX.LEFT_HIP];
    if (!leftHip) continue;

    // Set initial position on first valid frame
    if (initialX === null) {
      initialX = leftHip.x;
      initialY = leftHip.y;
    }

    // Track displacement from initial position
    trajectory.push({
      x: leftHip.x - initialX,
      y: leftHip.y - initialY!,
    });
  }

  return trajectory;
}

// ============================================================================
// Metrics calculation
// ============================================================================

function calculateSwayMetrics(
  trajectory: Point2D[],
  duration: number,
  correctionThreshold: number
): SwayMetricsResult {
  if (trajectory.length === 0) {
    return {
      swayStdX: 0,
      swayStdY: 0,
      swayPathLength: 0,
      swayVelocity: 0,
      correctionsCount: 0,
    };
  }

  const xValues = trajectory.map((p) => p.x);
  const yValues = trajectory.map((p) => p.y);

  const swayStdX = calculateStdDev(xValues);
  const swayStdY = calculateStdDev(yValues);
  const swayPathLength = calculatePathLength(trajectory);
  const swayVelocity = duration > 0 ? swayPathLength / duration : 0;
  const correctionsCount = countCorrections(trajectory, correctionThreshold);

  return {
    swayStdX,
    swayStdY,
    swayPathLength,
    swayVelocity,
    correctionsCount,
  };
}

// ============================================================================
// Main comparison function
// ============================================================================

/**
 * Compare metrics calculated from normalized vs world landmarks.
 *
 * @param landmarkHistory - Array of timestamped landmarks from a balance test
 * @param holdTime - Duration of the test in seconds
 * @returns Comparison of metrics from both approaches
 */
export function compareMetrics(
  landmarkHistory: TimestampedLandmarks[],
  holdTime: number
): ComparisonResult {
  // Debug: Check what's in the first frame's worldLandmarks
  if (landmarkHistory.length > 0) {
    const firstFrame = landmarkHistory[0];
    const lastFrame = landmarkHistory[landmarkHistory.length - 1];
    const midFrame = landmarkHistory[Math.floor(landmarkHistory.length / 2)];

    console.log('🔍 DEBUG - World landmarks across frames:');
    console.log('  First frame leftHip:', firstFrame.worldLandmarks?.[FILTERED_INDEX.LEFT_HIP]);
    console.log('  Mid frame leftHip:', midFrame.worldLandmarks?.[FILTERED_INDEX.LEFT_HIP]);
    console.log('  Last frame leftHip:', lastFrame.worldLandmarks?.[FILTERED_INDEX.LEFT_HIP]);

    console.log('🔍 DEBUG - Normalized landmarks across frames:');
    console.log('  First frame leftHip:', firstFrame.landmarks?.[FILTERED_INDEX.LEFT_HIP]);
    console.log('  Mid frame leftHip:', midFrame.landmarks?.[FILTERED_INDEX.LEFT_HIP]);
    console.log('  Last frame leftHip:', lastFrame.landmarks?.[FILTERED_INDEX.LEFT_HIP]);
  }

  // Extract trajectories using both methods
  const normalizedTrajectory = extractHipTrajectoryNormalized(landmarkHistory);
  const worldTrajectory = extractHipTrajectoryWorld(landmarkHistory);

  // Calculate metrics for normalized (threshold in normalized coords ~2% of frame)
  const normalizedMetrics = calculateSwayMetrics(normalizedTrajectory, holdTime, 0.02);

  // Calculate metrics for world landmarks (threshold in meters ~2cm)
  const worldMetrics = calculateSwayMetrics(worldTrajectory, holdTime, 0.02);

  // Calculate ratios to see scaling difference
  const stdXRatio = normalizedMetrics.swayStdX > 0
    ? worldMetrics.swayStdX / normalizedMetrics.swayStdX
    : 0;
  const stdYRatio = normalizedMetrics.swayStdY > 0
    ? worldMetrics.swayStdY / normalizedMetrics.swayStdY
    : 0;
  const pathLengthRatio = normalizedMetrics.swayPathLength > 0
    ? worldMetrics.swayPathLength / normalizedMetrics.swayPathLength
    : 0;
  const velocityRatio = normalizedMetrics.swayVelocity > 0
    ? worldMetrics.swayVelocity / normalizedMetrics.swayVelocity
    : 0;

  return {
    normalized: {
      ...normalizedMetrics,
      unit: 'normalized (0-1 relative to image)',
    },
    world: {
      ...worldMetrics,
      unit: 'meters (real-world coordinates)',
    },
    analysis: {
      stdXRatio,
      stdYRatio,
      pathLengthRatio,
      velocityRatio,
      recommendation: worldTrajectory.length > 0
        ? 'World landmarks available - recommended for consistent measurements'
        : 'World landmarks NOT available - falling back to normalized',
    },
  };
}

/**
 * Print a formatted comparison to the console.
 */
export function printMetricsComparison(
  landmarkHistory: TimestampedLandmarks[],
  holdTime: number
): void {
  const result = compareMetrics(landmarkHistory, holdTime);

  console.log('\n========================================');
  console.log('METRICS COMPARISON: Normalized vs World');
  console.log('========================================\n');

  console.log(`Hold Time: ${holdTime.toFixed(2)}s`);
  console.log(`Frames analyzed: ${landmarkHistory.length}`);
  console.log('');

  console.log('--- NORMALIZED LANDMARKS (current) ---');
  console.log(`Unit: ${result.normalized.unit}`);
  console.log(`Sway Std X:     ${result.normalized.swayStdX.toFixed(6)}`);
  console.log(`Sway Std Y:     ${result.normalized.swayStdY.toFixed(6)}`);
  console.log(`Path Length:    ${result.normalized.swayPathLength.toFixed(6)}`);
  console.log(`Velocity:       ${result.normalized.swayVelocity.toFixed(6)}`);
  console.log(`Corrections:    ${result.normalized.correctionsCount}`);
  console.log('');

  console.log('--- WORLD LANDMARKS (recommended) ---');
  console.log(`Unit: ${result.world.unit}`);
  console.log(`Sway Std X:     ${result.world.swayStdX.toFixed(6)} m (${(result.world.swayStdX * 100).toFixed(2)} cm)`);
  console.log(`Sway Std Y:     ${result.world.swayStdY.toFixed(6)} m (${(result.world.swayStdY * 100).toFixed(2)} cm)`);
  console.log(`Path Length:    ${result.world.swayPathLength.toFixed(6)} m (${(result.world.swayPathLength * 100).toFixed(2)} cm)`);
  console.log(`Velocity:       ${result.world.swayVelocity.toFixed(6)} m/s (${(result.world.swayVelocity * 100).toFixed(2)} cm/s)`);
  console.log(`Corrections:    ${result.world.correctionsCount}`);
  console.log('');

  console.log('--- SCALING ANALYSIS ---');
  console.log(`Std X ratio (world/normalized):     ${result.analysis.stdXRatio.toFixed(4)}`);
  console.log(`Std Y ratio (world/normalized):     ${result.analysis.stdYRatio.toFixed(4)}`);
  console.log(`Path ratio (world/normalized):      ${result.analysis.pathLengthRatio.toFixed(4)}`);
  console.log(`Velocity ratio (world/normalized):  ${result.analysis.velocityRatio.toFixed(4)}`);
  console.log('');

  console.log(`Recommendation: ${result.analysis.recommendation}`);
  console.log('========================================\n');
}

/**
 * Generate mock landmark data for testing the comparison.
 * Simulates a person swaying slightly during a balance test.
 */
export function generateMockLandmarkHistory(
  durationSeconds: number = 10,
  fps: number = 30,
  swayAmplitude: number = 0.02 // normalized sway amplitude
): TimestampedLandmarks[] {
  const history: TimestampedLandmarks[] = [];
  const frameCount = durationSeconds * fps;
  const startTime = Date.now();

  for (let i = 0; i < frameCount; i++) {
    const t = i / fps;
    const timestamp = startTime + (i * 1000 / fps);

    // Simulate natural sway with multiple frequencies
    const swayX = swayAmplitude * (
      Math.sin(t * 0.5) * 0.5 +  // slow sway
      Math.sin(t * 1.2) * 0.3 +  // medium sway
      Math.sin(t * 2.5) * 0.2    // fast corrections
    );
    const swayY = swayAmplitude * 0.5 * (
      Math.sin(t * 0.7) * 0.6 +
      Math.sin(t * 1.8) * 0.4
    );

    // Base positions (normalized coordinates - person centered in frame)
    const baseHipY = 0.55;
    const baseHipX = 0.5;

    // Create normalized landmarks
    const landmarks: PoseLandmark[] = [
      { x: baseHipX - 0.05 + swayX, y: 0.35 + swayY * 0.5, z: 0, visibility: 0.99 }, // LEFT_SHOULDER
      { x: baseHipX + 0.05 + swayX, y: 0.35 + swayY * 0.5, z: 0, visibility: 0.99 }, // RIGHT_SHOULDER
      { x: baseHipX - 0.15 + swayX, y: 0.35 + swayY * 0.3, z: 0, visibility: 0.95 }, // LEFT_WRIST
      { x: baseHipX + 0.15 + swayX, y: 0.36 + swayY * 0.3, z: 0, visibility: 0.95 }, // RIGHT_WRIST
      { x: baseHipX - 0.03 + swayX, y: baseHipY + swayY, z: 0, visibility: 0.99 },   // LEFT_HIP
      { x: baseHipX + 0.03 + swayX, y: baseHipY + swayY, z: 0, visibility: 0.99 },   // RIGHT_HIP
      { x: baseHipX - 0.03 + swayX * 0.2, y: 0.9, z: 0, visibility: 0.9 },           // LEFT_ANKLE (raised)
      { x: baseHipX + 0.03 + swayX * 0.1, y: 0.95, z: 0, visibility: 0.95 },         // RIGHT_ANKLE (standing)
    ];

    // Create world landmarks (in meters, hip-centered)
    // Assume ~1.5m tall person, hip at origin
    const worldScale = 0.8; // rough conversion: normalized * worldScale ≈ meters for typical framing
    const worldLandmarks: PoseLandmark[] = [
      { x: -0.15 + swayX * worldScale, y: 0.45, z: 0.05, visibility: 0.99 },  // LEFT_SHOULDER
      { x: 0.15 + swayX * worldScale, y: 0.45, z: 0.05, visibility: 0.99 },   // RIGHT_SHOULDER
      { x: -0.45 + swayX * worldScale, y: 0.45, z: 0.1, visibility: 0.95 },   // LEFT_WRIST
      { x: 0.45 + swayX * worldScale, y: 0.44, z: 0.1, visibility: 0.95 },    // RIGHT_WRIST
      { x: -0.1 + swayX * worldScale, y: 0 + swayY * worldScale, z: 0, visibility: 0.99 },    // LEFT_HIP
      { x: 0.1 + swayX * worldScale, y: 0 + swayY * worldScale, z: 0, visibility: 0.99 },     // RIGHT_HIP
      { x: -0.1 + swayX * worldScale * 0.2, y: -0.75, z: 0.15, visibility: 0.9 },  // LEFT_ANKLE
      { x: 0.1 + swayX * worldScale * 0.1, y: -0.85, z: 0, visibility: 0.95 },     // RIGHT_ANKLE
    ];

    history.push({
      timestamp,
      landmarks,
      worldLandmarks,
    });
  }

  return history;
}

/**
 * Run a demo comparison with mock data.
 * Call this from browser console: import('./utils/metricsComparison').then(m => m.runDemoComparison())
 */
export function runDemoComparison(): void {
  console.log('Generating mock balance test data (10 seconds, 30 fps)...\n');

  const mockHistory = generateMockLandmarkHistory(10, 30, 0.02);
  printMetricsComparison(mockHistory, 10);

  console.log('\nTo compare with your real test data:');
  console.log('1. After completing a test, access testResult.landmarkHistory');
  console.log('2. Call: printMetricsComparison(testResult.landmarkHistory, testResult.holdTime)');
}
