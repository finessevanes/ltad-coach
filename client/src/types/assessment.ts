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

/**
 * Metrics for a temporal segment (first/middle/last third of test)
 */
export interface ClientSegmentMetrics {
  armAngleLeft: number;      // degrees
  armAngleRight: number;     // degrees
  swayVelocity: number;      // cm/s
  correctionsCount: number;
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
 * World landmark metrics - real-world units (cm, degrees)
 */
export interface ClientWorldMetrics {
  swayStdX: number;           // cm
  swayStdY: number;           // cm
  swayPathLength: number;     // cm
  swayVelocity: number;       // cm/s
  correctionsCount: number;
  armAngleLeft: number;       // degrees
  armAngleRight: number;      // degrees
  armAsymmetryRatio: number;
  stabilityScore: number;     // 0-100
  temporal: ClientTemporalMetrics;
}

/**
 * Client-calculated metrics (normalized coordinates)
 */
export interface ClientMetrics {
  success: boolean;
  holdTime: number;
  failureReason?: string;
  // Normalized metrics (0-1 scale)
  armDeviationLeft: number;
  armDeviationRight: number;
  armAsymmetryRatio: number;
  swayStdX: number;
  swayStdY: number;
  swayPathLength: number;
  swayVelocity: number;
  correctionsCount: number;
  stabilityScore: number;
  // World metrics (real units: cm, degrees)
  worldMetrics?: ClientWorldMetrics;
}

export interface AssessmentMetrics {
  holdTime: number;
  stabilityScore: number;
  swayVelocity: number;
  swayStdX: number;
  swayStdY: number;
  swayPathLength: number;
  armDeviationLeft: number;
  armDeviationRight: number;
  armAsymmetryRatio: number;
  correctionsCount: number;
  durationScore: number;
  durationScoreLabel: string;
  ageExpectation?: string;
  // World metrics (real units)
  worldMetrics?: ClientWorldMetrics;
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
