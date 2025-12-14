export type TestType = 'one_leg_balance';
export type LegTested = 'left' | 'right' | 'both';  // Add 'both'
export type AssessmentStatus = 'processing' | 'completed' | 'failed';

export interface AssessmentSetup {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;
}

export interface RecordingState {
  status: 'idle' | 'countdown' | 'recording' | 'preview';
  videoBlob: Blob | null;
  videoUrl: string | null;
  duration: number;
}

import { SegmentedMetrics, BalanceEvent } from './balanceTest';

/**
 * Symmetry analysis comparing left and right leg performance.
 * Calculated client-side before submission to backend.
 */
export interface SymmetryAnalysis {
  // Duration comparison
  holdTimeDifference: number;        // Absolute difference in seconds: |left - right|
  holdTimeDifferencePct: number;     // Percentage difference (0-100)
  dominantLeg: 'left' | 'right' | 'balanced';  // Leg with better hold time (<20% diff = balanced)

  // Sway comparison
  swayVelocityDifference: number;    // Absolute difference in cm/s: |left - right|
  swaySymmetryScore: number;         // 0-1 scale: 0=asymmetric, 1=perfect symmetry

  // Arm comparison
  armAngleDifference: number;        // Average arm angle difference in degrees: |left_avg - right_avg|

  // Corrections comparison
  correctionsCountDifference: number; // Difference in corrections: left - right (signed)

  // Overall assessment
  overallSymmetryScore: number;      // 0-100 scale: weighted combination of above metrics
  symmetryAssessment: 'excellent' | 'good' | 'fair' | 'poor';  // Qualitative rating
}

/**
 * Container for dual-leg assessment metrics.
 * Includes full client metrics for both legs (with temporal data).
 *
 * NOTE: symmetryAnalysis is calculated by the backend and should NOT be sent by client.
 * The backend recalculates bilateral comparison for accuracy.
 */
export interface DualLegMetrics {
  leftLeg: ClientMetrics;           // Complete left leg test results
  rightLeg: ClientMetrics;          // Complete right leg test results
  // symmetryAnalysis removed - backend calculates this
}

/**
 * Client-calculated metrics in real-world units (cm, degrees).
 * Calculated from MediaPipe's worldLandmarks.
 */
export interface ClientMetrics {
  success: boolean;
  holdTime: number;
  failureReason?: string;
  // Sway metrics (cm)
  swayStdX: number;           // cm
  swayStdY: number;           // cm
  swayPathLength: number;     // cm
  swayVelocity: number;       // cm/s
  correctionsCount: number;
  // Arm metrics (degrees)
  armAngleLeft: number;       // degrees from horizontal (0° = T-position)
  armAngleRight: number;      // degrees from horizontal (0° = T-position)
  armAsymmetryRatio: number;
  // Temporal breakdown with configurable segment duration (typically 1-second segments)
  segmentedMetrics?: SegmentedMetrics;
  events?: BalanceEvent[];
}

/**
 * Assessment metrics returned from backend.
 * Consolidated single source of truth for all metrics.
 * All metrics in real-world units (cm, degrees).
 */
export interface AssessmentMetrics {
  // Test result
  success: boolean;
  holdTime: number;
  failureReason?: string;
  // Sway metrics (cm)
  swayStdX: number;           // cm
  swayStdY: number;           // cm
  swayPathLength: number;     // cm
  swayVelocity: number;       // cm/s
  correctionsCount: number;
  // Arm metrics (degrees)
  armAngleLeft: number;       // degrees from horizontal (0° = T-position)
  armAngleRight: number;      // degrees from horizontal (0° = T-position)
  armAsymmetryRatio: number;
  // LTAD Score (validated by Athletics Canada LTAD framework)
  durationScore: number;      // 1-5 LTAD scale
  // Temporal breakdown with configurable segment duration
  segmentedMetrics?: SegmentedMetrics;
  events?: BalanceEvent[];
}

export interface Assessment {
  id: string;
  athleteId: string;
  coachId: string;
  testType: TestType;
  legTested: LegTested;  // Now supports 'both'

  // Single-leg fields (now optional for backward compatibility)
  videoUrl?: string;
  videoPath?: string;

  // Dual-leg video fields (NEW)
  leftLegVideoUrl?: string;
  leftLegVideoPath?: string;
  rightLegVideoUrl?: string;
  rightLegVideoPath?: string;

  status: AssessmentStatus;
  createdAt: string;

  // Single-leg metrics (now optional for backward compatibility)
  metrics?: AssessmentMetrics;

  // Dual-leg metrics (NEW)
  leftLegMetrics?: AssessmentMetrics;
  rightLegMetrics?: AssessmentMetrics;
  bilateralComparison?: SymmetryAnalysis;  // Backend-enhanced symmetry analysis

  // Common fields
  aiCoachAssessment?: string;
  errorMessage?: string;
}

/**
 * Request payload for creating assessment (single-leg or dual-leg).
 *
 * BREAKING CHANGE: Field names updated for consistency:
 * - `videoUrl` → `leftVideoUrl`
 * - `videoPath` → `leftVideoPath`
 * - `duration` → `leftDuration`
 *
 * This ensures consistent naming for both single-leg and dual-leg modes.
 */
export interface AssessmentCreate {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;

  // Single-leg fields (RENAMED for consistency)
  leftVideoUrl?: string;        // Left leg video URL (or single leg for legacy)
  leftVideoPath?: string;       // Left leg video storage path
  leftDuration?: number;        // Left leg video duration (seconds)
  clientMetrics?: ClientMetrics; // Single-leg metrics (legacy)

  // Dual-leg fields (NEW)
  rightVideoUrl?: string;       // Right leg video URL
  rightVideoPath?: string;      // Right leg video storage path
  rightDuration?: number;       // Right leg video duration (seconds)
  dualLegMetrics?: DualLegMetrics; // Dual-leg metrics with both legs
}
