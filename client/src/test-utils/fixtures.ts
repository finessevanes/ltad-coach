/**
 * Mock data for component tests
 */

export const mockAthleteData = {
  id: 'test-athlete-1',
  name: 'Test Athlete',
  age: 12,
  gender: 'male',
  parentEmail: 'parent@test.com',
  consentStatus: 'active',
  coachId: 'test-coach-1',
};

export const mockAssessmentData = {
  id: 'test-assessment-1',
  athleteId: 'test-athlete-1',
  testType: 'one_leg_balance',
  legTested: 'left',
  createdAt: '2025-12-10T10:00:00Z',
  metrics: {
    durationSeconds: 18.5,
    stabilityScore: 75,
    swayVelocity: 8.2,
    swayStdX: 0.045,
    swayStdY: 0.032,
    swayPathLength: 152,
    armExcursionLeft: 0.12,
    armExcursionRight: 0.15,
    armAsymmetryRatio: 0.8,
    correctionsCount: 3,
    failureReason: 'foot_touchdown',
    durationScore: {
      score: 3,
      label: 'Competent',
      expectationStatus: 'below',
      expectedScore: 4,
    },
    percentile: 62,
  },
  aiFeedback: 'Good balance control for age 12. Work on reducing arm compensation.',
  percentile: 62,
};

export const mockTeamRank = {
  rank: 4,
  totalAthletes: 12,
  percentile: 67,
};

export const mockAssessmentHistory = [
  {
    id: 'assessment-1',
    athleteId: 'test-athlete-1',
    testType: 'one_leg_balance',
    legTested: 'left',
    createdAt: '2025-12-01T10:00:00Z',
    metrics: {
      durationSeconds: 15.2,
      stabilityScore: 68,
      durationScore: { score: 3, label: 'Competent' },
    },
  },
  {
    id: 'assessment-2',
    athleteId: 'test-athlete-1',
    testType: 'one_leg_balance',
    legTested: 'right',
    createdAt: '2025-12-05T10:00:00Z',
    metrics: {
      durationSeconds: 18.5,
      stabilityScore: 75,
      durationScore: { score: 4, label: 'Proficient' },
    },
  },
  {
    id: 'assessment-3',
    athleteId: 'test-athlete-1',
    testType: 'one_leg_balance',
    legTested: 'left',
    createdAt: '2025-12-08T10:00:00Z',
    metrics: {
      durationSeconds: 20.1,
      stabilityScore: 82,
      durationScore: { score: 4, label: 'Proficient' },
    },
  },
];

export const mockReportData = {
  athleteName: 'Test Athlete',
  parentEmail: 'parent@test.com',
  summary: 'Your athlete has shown consistent improvement in balance skills over the past month.',
  assessments: [
    {
      date: '2025-12-01T10:00:00Z',
      duration: 15.2,
      score: 3,
      leg: 'left',
      notes: 'Good stability',
    },
    {
      date: '2025-12-05T10:00:00Z',
      duration: 18.5,
      score: 4,
      leg: 'right',
      notes: 'Excellent progress',
    },
  ],
  recommendations: [
    'Continue practicing single-leg balance exercises',
    'Focus on maintaining proper posture',
    'Gradually increase difficulty by closing eyes',
  ],
};

/**
 * Create mock MediaStream for video testing
 */
export function createMockVideoStream(): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  // Draw test pattern
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = 'white';
  ctx.fillText('Test Video', 300, 240);

  return canvas.captureStream(30);
}

/**
 * Mock MediaPipe pose results
 */
export const mockPoseLandmarks = {
  poseLandmarks: Array.from({ length: 33 }, (_, i) => ({
    x: 0.5 + Math.random() * 0.1,
    y: 0.5 + Math.random() * 0.1,
    z: 0,
    visibility: 0.9,
  })),
};
