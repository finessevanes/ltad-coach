export type TestType = 'one_leg_balance';
export type LegTested = 'left' | 'right';
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

import { FiveSecondSegment, BalanceEvent } from './balanceTest';

/**
 * Metrics for a temporal segment (first/middle/last third of test)
 */
export interface ClientSegmentMetrics {
  armAngleLeft: number;      // degrees
  armAngleRight: number;     // degrees
  swayVelocity: number;      // cm/s
  correctionsCount: number;
  swayStdX?: number;         // cm (optional for backward compat)
  swayStdY?: number;         // cm (optional for backward compat)
}

/**
 * Temporal breakdown of metrics
 */
export interface ClientTemporalMetrics {
  firstThird: ClientSegmentMetrics;
  middleThird: ClientSegmentMetrics;
  lastThird: ClientSegmentMetrics;
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
  // Temporal analysis
  temporal: ClientTemporalMetrics;
  // Enhanced temporal data for LLM (optional for backward compat)
  fiveSecondSegments?: FiveSecondSegment[];
  events?: BalanceEvent[];
}

/**
 * Assessment metrics returned from backend.
 * All metrics in real-world units (cm, degrees).
 */
export interface AssessmentMetrics {
  holdTime: number;
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
  // Temporal analysis
  temporal?: ClientTemporalMetrics;
}

export interface Assessment {
  id: string;
  athleteId: string;
  coachId: string;
  testType: TestType;
  legTested: LegTested;
  videoUrl: string;
  videoPath: string;
  status: AssessmentStatus;
  createdAt: string;
  metrics?: AssessmentMetrics;
  clientMetrics?: ClientMetrics;
  aiFeedback?: string;
  failureReason?: string;
  errorMessage?: string;
}

export interface AssessmentCreate {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;
  videoUrl: string;
  videoPath: string;
  duration: number; // Video duration in seconds (measured during recording)
  clientMetrics?: ClientMetrics;
}
