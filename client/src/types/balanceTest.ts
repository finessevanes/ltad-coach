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

export interface TestResult {
  success: boolean;
  holdTime: number;
  failureReason?: string;
  landmarkHistory: TimestampedLandmarks[];
  /** Average arm deviation from T-position (wrist Y - shoulder Y). Positive = dropped below shoulder. */
  armDeviationLeft: number;
  /** Average arm deviation from T-position (wrist Y - shoulder Y). Positive = dropped below shoulder. */
  armDeviationRight: number;
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
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;
