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
  metrics?: {
    durationSeconds: number;
    stabilityScore: number;
    swayVelocity: number;
    swayStdX: number;
    swayStdY: number;
    swayPathLength: number;
    armExcursionLeft: number;
    armExcursionRight: number;
    correctionsCount: number;
  };
  aiFeedback?: string;
  failureReason?: string;
}

export interface AssessmentCreate {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;
  videoUrl: string;
  videoPath: string;
  duration: number; // Video duration in seconds (measured during recording)
}
