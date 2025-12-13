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

export interface ClientMetrics {
  success: boolean;
  holdTime: number;
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
