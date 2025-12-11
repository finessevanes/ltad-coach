import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/api/auth/token`, () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-1',
        email: 'test@coach.com',
        name: 'Test Coach',
        athleteCount: 5,
      },
      token: 'mock-token',
    });
  }),

  http.get(`${API_BASE}/api/auth/me`, () => {
    return HttpResponse.json({
      id: 'test-user-1',
      email: 'test@coach.com',
      name: 'Test Coach',
      athleteCount: 5,
    });
  }),

  // Athlete endpoints
  http.get(`${API_BASE}/api/athletes`, () => {
    return HttpResponse.json({
      athletes: [
        {
          id: 'athlete-1',
          name: 'Test Athlete 1',
          age: 12,
          gender: 'male',
          parentEmail: 'parent1@test.com',
          consentStatus: 'active',
          coachId: 'test-user-1',
        },
        {
          id: 'athlete-2',
          name: 'Test Athlete 2',
          age: 11,
          gender: 'female',
          parentEmail: 'parent2@test.com',
          consentStatus: 'pending',
          coachId: 'test-user-1',
        },
      ],
    });
  }),

  http.post(`${API_BASE}/api/athletes`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: 'new-athlete-id',
      ...body,
      consentStatus: 'pending',
      coachId: 'test-user-1',
    }, { status: 201 });
  }),

  http.get(`${API_BASE}/api/athletes/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Athlete',
      age: 12,
      gender: 'male',
      parentEmail: 'parent@test.com',
      consentStatus: 'active',
      coachId: 'test-user-1',
    });
  }),

  http.put(`${API_BASE}/api/athletes/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: params.id,
      ...body,
    });
  }),

  http.delete(`${API_BASE}/api/athletes/:id`, () => {
    return HttpResponse.json({ message: 'Athlete deleted' });
  }),

  // Assessment endpoints
  http.post(`${API_BASE}/api/assessments/upload-video`, () => {
    return HttpResponse.json({
      uploadId: 'upload-123',
      storagePath: 'videos/athlete-1/assessment-1/video.mp4',
      size: 1024000,
      format: 'mp4',
    });
  }),

  http.post(`${API_BASE}/api/assessments/analyze`, () => {
    return HttpResponse.json({
      assessment: {
        id: 'assessment-123',
        athleteId: 'athlete-1',
        testType: 'one_leg_balance',
        metrics: {
          durationSeconds: 18.5,
          stabilityScore: 75,
          durationScore: {
            score: 3,
            label: 'Competent',
          },
        },
        aiFeedback: 'Test feedback',
      },
      teamRank: {
        rank: 3,
        totalAthletes: 12,
      },
    });
  }),

  http.get(`${API_BASE}/api/assessments/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      athleteId: 'athlete-1',
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
      coachNotes: '',
    });
  }),

  http.patch(`${API_BASE}/api/assessments/:id/notes`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Notes updated successfully',
    });
  }),

  http.get(`${API_BASE}/api/assessments/:id/team-rank`, () => {
    return HttpResponse.json({
      rank: 4,
      totalAthletes: 12,
      percentile: 67,
    });
  }),

  http.get(`${API_BASE}/api/assessments/athlete/:id`, () => {
    return HttpResponse.json({
      assessments: [
        {
          id: 'assessment-1',
          athleteId: 'athlete-1',
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
          athleteId: 'athlete-1',
          testType: 'one_leg_balance',
          legTested: 'right',
          createdAt: '2025-12-05T10:00:00Z',
          metrics: {
            durationSeconds: 18.5,
            stabilityScore: 75,
            durationScore: { score: 4, label: 'Proficient' },
          },
        },
      ],
    });
  }),

  // Report endpoints
  http.post(`${API_BASE}/api/reports/generate/:athleteId`, () => {
    return HttpResponse.json({
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
    });
  }),

  http.post(`${API_BASE}/api/reports/send`, () => {
    return HttpResponse.json({
      message: 'Report sent successfully',
      pin: '1234',
      reportId: 'report-123',
      sentTo: 'parent@test.com',
    });
  }),

  http.post(`${API_BASE}/api/reports/view/:id/verify`, async ({ request }) => {
    const body = await request.json() as any;
    const pin = body.pin;

    if (pin === '1234') {
      return HttpResponse.json({
        verified: true,
      });
    } else {
      return HttpResponse.json(
        { detail: 'Invalid PIN' },
        { status: 401 }
      );
    }
  }),

  http.get(`${API_BASE}/api/reports/view/:id`, ({ request }) => {
    const url = new URL(request.url);
    const pin = url.searchParams.get('pin');

    if (pin === '1234') {
      return HttpResponse.json({
        athleteName: 'Test Athlete',
        summary: 'Great progress this month!',
        assessments: [
          {
            date: '2025-12-01T10:00:00Z',
            duration: 15.2,
            score: 3,
            leg: 'left',
          },
        ],
        recommendations: [
          'Keep up the good work',
          'Practice regularly',
        ],
      });
    } else {
      return HttpResponse.json(
        { detail: 'Invalid PIN' },
        { status: 401 }
      );
    }
  }),
];
