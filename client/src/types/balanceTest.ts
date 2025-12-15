import { PoseLandmark } from './mediapipe';

export type TestState = 'idle' | 'ready' | 'holding' | 'completed' | 'failed';

export interface PositionCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface PositionStatus {
  isInPosition: boolean;
  checks: PositionCheck[];
  failedChecks: string[];
}

export interface TimestampedLandmarks {
  timestamp: number;
  landmarks: PoseLandmark[];
  worldLandmarks: PoseLandmark[];
}

/**
 * Metrics for a time segment with configurable duration (typically 1 second).
 * Provides granular timeline data for temporal analysis and visualization.
 */
export interface TimeSegment {
  startTime: number;      // seconds
  endTime: number;        // seconds
  avgVelocity: number;    // cm/s
  corrections: number;    // count
  armAngleLeft: number;   // degrees (average)
  armAngleRight: number;  // degrees (average)
  swayStdX: number;       // cm
  swayStdY: number;       // cm
}

/**
 * Temporal breakdown with configurable segment duration.
 * For 30s test with 1s segments, contains 30 TimeSegment objects.
 */
export interface SegmentedMetrics {
  /** Duration of each segment in seconds (typically 1.0) */
  segmentDuration: number;
  /** Array of time segments covering full test duration */
  segments: TimeSegment[];
}

/**
 * Significant events detected during balance test.
 * Highlights key moments for LLM coaching feedback.
 */
export interface BalanceEvent {
  time: number;           // seconds into test
  type: 'flapping' | 'correction_burst' | 'stabilized' | 'arm_drop';
  severity?: 'low' | 'medium' | 'high';
  detail: string;
}

/**
 * Test result with metrics in real-world units (cm, degrees).
 * Calculated from MediaPipe's worldLandmarks.
 */
export interface TestResult {
  success: boolean;
  holdTime: number;
  failureReason?: string;
  landmarkHistory: TimestampedLandmarks[];

  // ========== METRICS (real-world units: cm, degrees) ==========
  /** Sway standard deviation in X (cm) */
  swayStdX: number;
  /** Sway standard deviation in Y (cm) */
  swayStdY: number;
  /** Total sway path length (cm) */
  swayPathLength: number;
  /** Average sway velocity (cm/s) */
  swayVelocity: number;
  /** Number of balance corrections detected */
  correctionsCount: number;
  /** Arm angle from horizontal in degrees. 0° = T-position, positive = dropped */
  armAngleLeft: number;
  /** Arm angle from horizontal in degrees. 0° = T-position, positive = dropped */
  armAngleRight: number;
  /** Left/Right arm angle ratio */
  armAsymmetryRatio: number;
  /** Temporal breakdown with configurable segment duration (typically 1-second segments) */
  segmentedMetrics?: SegmentedMetrics;
  /** Significant balance events detected during test */
  events?: BalanceEvent[];
}

// Constants for position detection
export const POSITION_HOLD_BUFFER_MS = 1000;
export const FOOT_TOUCHDOWN_THRESHOLD = 0.03; // 3% - raised foot Y must match standing foot Y (both on ground)
export const SUPPORT_FOOT_HOP_THRESHOLD = 0.05; // 5% - support foot lifted off ground (hop detection)
export const TRACKING_LOST_TIMEOUT_MS = 500;
export const DEFAULT_TARGET_DURATION = 30;
export const MIN_FOOT_RAISE_THRESHOLD = 0.08; // 8% - minimum height to consider foot "raised"

// Confidence/visibility thresholds
export const MIN_ANKLE_VISIBILITY = 0.7; // Minimum confidence to trust ankle position (0-1)

// Raised foot descent threshold - requires foot to have actually descended, not just be at same level
export const RAISED_FOOT_DESCENT_THRESHOLD = 0.06; // 6% - raised foot must descend this much from initial position

// Support foot movement threshold - total displacement (X + Y combined) to detect hop/repositioning
export const SUPPORT_FOOT_MOVEMENT_THRESHOLD = 0.04; // 4% - total Euclidean distance from initial position

// Consecutive frames required before triggering failure (prevents false positives from occlusion)
export const CONSECUTIVE_FAIL_FRAMES_REQUIRED = 6; // ~120ms at 50fps

// MediaPipe landmark indices
export const LANDMARK_INDEX = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

// Required landmark indices for metrics calculation (8 total)
// These are the only landmarks we need to store for sway/stability analysis
export const REQUIRED_LANDMARK_INDICES = [
  LANDMARK_INDEX.LEFT_SHOULDER,  // 11 - Arm deviation baseline
  LANDMARK_INDEX.RIGHT_SHOULDER, // 12 - Arm deviation baseline
  LANDMARK_INDEX.LEFT_WRIST,     // 15 - Arm deviation
  LANDMARK_INDEX.RIGHT_WRIST,    // 16 - Arm deviation
  LANDMARK_INDEX.LEFT_HIP,       // 23 - Sway (CoM proxy)
  LANDMARK_INDEX.RIGHT_HIP,      // 24 - Sway (CoM proxy)
  LANDMARK_INDEX.LEFT_ANKLE,     // 27 - Failure detection
  LANDMARK_INDEX.RIGHT_ANKLE,    // 28 - Failure detection
] as const;
