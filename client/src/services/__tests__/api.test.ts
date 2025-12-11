import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn(() => Promise.resolve('mock-firebase-token')),
    },
  },
}));

describe('API Client', () => {
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

    await expect(api.get('/api/athletes/invalid')).rejects.toThrow();
  });
});
