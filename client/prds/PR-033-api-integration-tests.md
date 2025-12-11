COMPLETED
---
id: FE-033
depends_on: [FE-005, BE-029, BE-030]
blocks: []
status: COMPLETED
---

# FE-033: API Integration Tests

**COMPLETED**

## Scope

**In Scope:**
- API client integration tests
- Test API calls to backend
- Mock backend responses for frontend tests
- Request/response validation
- Error handling tests

**Out of Scope:**
- E2E tests (BE-039)
- Component tests (FE-032)
- Backend unit tests

## Technical Decisions

- **Framework**: Vitest + MSW (Mock Service Worker)
- **Pattern**: Mock backend responses for predictable testing
- **Coverage**: All API endpoints used by frontend
- **Location**: `client/src/services/__tests__/`

## Acceptance Criteria

- [ ] Vitest configured for frontend
- [ ] MSW set up for API mocking
- [ ] Tests for all major API endpoints
- [ ] Tests for auth token inclusion
- [ ] Tests for error handling
- [ ] Tests run in CI

## Files to Create

- `client/vitest.config.ts`
- `client/src/test-utils/msw-server.ts`
- `client/src/test-utils/api-handlers.ts`
- `client/src/services/__tests__/api.test.ts`
- `client/src/services/__tests__/athletes.test.ts`
- `client/src/services/__tests__/assessments.test.ts`
- `client/src/services/__tests__/reports.test.ts`

## Implementation Notes

### Install Dependencies

```bash
cd client
npm install -D vitest @vitest/ui msw
```

### client/vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.spec.tsx',
        '**/*.test.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### client/src/test-utils/setup.ts

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './msw-server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

### client/src/test-utils/msw-server.ts

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './api-handlers';

export const server = setupServer(...handlers);
```

### client/src/test-utils/api-handlers.ts

```typescript
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8000';

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
    const body = await request.json();
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
      metrics: {
        durationSeconds: 18.5,
        stabilityScore: 75,
      },
      aiFeedback: 'Good balance',
      coachNotes: '',
    });
  }),

  // Report endpoints
  http.post(`${API_BASE}/api/reports/generate/:athleteId`, () => {
    return HttpResponse.json({
      reportContent: 'Test report content',
      athleteName: 'Test Athlete',
      parentEmail: 'parent@test.com',
    });
  }),

  http.post(`${API_BASE}/api/reports/:id/send`, () => {
    return HttpResponse.json({
      message: 'Report sent successfully',
      sentTo: 'parent@test.com',
    });
  }),
];
```

### client/src/services/__tests__/api.test.ts

```typescript
import { describe, it, expect, vi } from 'vitest';
import api from '../api';
import { auth } from '../firebase';

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn(() => Promise.resolve('mock-firebase-token')),
    },
  },
}));

describe('API Client', () => {
  it('includes auth token in requests', async () => {
    const response = await api.get('/api/auth/me');

    expect(auth.currentUser?.getIdToken).toHaveBeenCalled();
    expect(response.data).toHaveProperty('id');
  });

  it('handles successful GET requests', async () => {
    const response = await api.get('/api/athletes');

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('athletes');
    expect(Array.isArray(response.data.athletes)).toBe(true);
  });

  it('handles successful POST requests', async () => {
    const athleteData = {
      name: 'New Athlete',
      age: 12,
      gender: 'male',
      parentEmail: 'parent@test.com',
    };

    const response = await api.post('/api/athletes', athleteData);

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.name).toBe('New Athlete');
  });

  it('handles error responses', async () => {
    // Override handler to return error
    const { server } = await import('../../test-utils/msw-server');
    const { http, HttpResponse } = await import('msw');

    server.use(
      http.get('http://localhost:8000/api/athletes/invalid', () => {
        return HttpResponse.json(
          { detail: 'Athlete not found' },
          { status: 404 }
        );
      })
    );

    await expect(api.get('/api/athletes/invalid')).rejects.toThrow('Athlete not found');
  });

  it('handles network errors', async () => {
    const { server } = await import('../../test-utils/msw-server');
    const { http, HttpResponse } = await import('msw');

    server.use(
      http.get('http://localhost:8000/api/network-error', () => {
        return HttpResponse.error();
      })
    );

    await expect(api.get('/api/network-error')).rejects.toThrow(/network/i);
  });
});
```

### client/src/services/__tests__/athletes.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import api from '../api';

describe('Athletes API', () => {
  describe('GET /api/athletes', () => {
    it('returns list of athletes', async () => {
      const response = await api.get('/api/athletes');

      expect(response.data.athletes).toHaveLength(2);
      expect(response.data.athletes[0]).toHaveProperty('id');
      expect(response.data.athletes[0]).toHaveProperty('name');
      expect(response.data.athletes[0]).toHaveProperty('consentStatus');
    });
  });

  describe('POST /api/athletes', () => {
    it('creates new athlete', async () => {
      const newAthlete = {
        name: 'Test Athlete',
        age: 12,
        gender: 'male',
        parentEmail: 'parent@test.com',
      };

      const response = await api.post('/api/athletes', newAthlete);

      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe('Test Athlete');
      expect(response.data.consentStatus).toBe('pending');
    });
  });

  describe('PUT /api/athletes/:id', () => {
    it('updates athlete', async () => {
      const updates = {
        name: 'Updated Name',
        age: 13,
      };

      const response = await api.put('/api/athletes/athlete-1', updates);

      expect(response.data.name).toBe('Updated Name');
      expect(response.data.age).toBe(13);
    });
  });

  describe('DELETE /api/athletes/:id', () => {
    it('deletes athlete', async () => {
      const response = await api.delete('/api/athletes/athlete-1');

      expect(response.data.message).toBe('Athlete deleted');
    });
  });
});
```

### client/src/services/__tests__/assessments.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import api from '../api';

describe('Assessments API', () => {
  describe('POST /api/assessments/upload-video', () => {
    it('uploads video successfully', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['fake video']), 'test.mp4');
      formData.append('athlete_id', 'athlete-1');

      const response = await api.post('/api/assessments/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      expect(response.data).toHaveProperty('uploadId');
      expect(response.data).toHaveProperty('storagePath');
      expect(response.data.format).toBe('mp4');
    });
  });

  describe('POST /api/assessments/analyze', () => {
    it('analyzes video and returns results', async () => {
      const analyzeRequest = {
        athleteId: 'athlete-1',
        videoPath: 'videos/athlete-1/assessment-1/video.mp4',
        legTested: 'left',
      };

      const response = await api.post('/api/assessments/analyze', analyzeRequest);

      expect(response.data.assessment).toHaveProperty('id');
      expect(response.data.assessment.metrics).toHaveProperty('durationSeconds');
      expect(response.data.assessment.metrics).toHaveProperty('stabilityScore');
      expect(response.data).toHaveProperty('teamRank');
    });
  });

  describe('GET /api/assessments/:id', () => {
    it('retrieves assessment by ID', async () => {
      const response = await api.get('/api/assessments/assessment-123');

      expect(response.data.id).toBe('assessment-123');
      expect(response.data).toHaveProperty('metrics');
      expect(response.data).toHaveProperty('aiFeedback');
    });
  });
});
```

### client/src/services/__tests__/reports.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import api from '../api';

describe('Reports API', () => {
  describe('POST /api/reports/generate/:athleteId', () => {
    it('generates parent report', async () => {
      const response = await api.post('/api/reports/generate/athlete-1');

      expect(response.data).toHaveProperty('reportContent');
      expect(response.data).toHaveProperty('athleteName');
      expect(response.data).toHaveProperty('parentEmail');
    });
  });

  describe('POST /api/reports/:id/send', () => {
    it('sends report to parent', async () => {
      const response = await api.post('/api/reports/report-123/send');

      expect(response.data.message).toContain('sent successfully');
      expect(response.data).toHaveProperty('sentTo');
    });
  });
});
```

### package.json (add scripts)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Testing

```bash
# Run tests
cd client
npm test

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Estimated Complexity

**Size**: M (Medium - ~3 hours)

## Notes

- MSW intercepts network requests - no real backend needed
- Tests run fast and are reliable
- Can test error scenarios easily
- Coverage report helps identify untested code
- Consider adding tests for retry logic, timeouts
