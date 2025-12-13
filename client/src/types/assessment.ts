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
  // Scores
  stabilityScore: number;     // 0-100
  // Temporal analysis
  temporal: ClientTemporalMetrics;
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
  // Scores
  stabilityScore: number;     // 0-100
  durationScore: number;      // 1-5 LTAD scale
  durationScoreLabel: string; // "Beginning", "Developing", etc.
  ageExpectation?: string;    // "above", "meets", "below"
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
