import { describe, it, expect } from 'vitest';
import api from '../api';

describe('Assessments API', () => {
  describe('GET /api/assessments/:id', () => {
    it('retrieves assessment by ID', async () => {
      const response = await api.get('/api/assessments/assessment-123');

      expect(response.data.id).toBe('assessment-123');
      expect(response.data).toHaveProperty('metrics');
      expect(response.data).toHaveProperty('aiFeedback');
      expect(response.data.metrics).toHaveProperty('durationSeconds');
      expect(response.data.metrics).toHaveProperty('stabilityScore');
    });
  });

  describe('GET /api/assessments/athlete/:id', () => {
    it('retrieves all assessments for an athlete', async () => {
      const response = await api.get('/api/assessments/athlete/athlete-1');

      expect(response.data).toHaveProperty('assessments');
      expect(Array.isArray(response.data.assessments)).toBe(true);
      expect(response.data.assessments.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/assessments/:id/notes', () => {
    it('updates coach notes', async () => {
      const notes = 'Great improvement in stability!';

      const response = await api.patch('/api/assessments/assessment-123/notes', {
        coachNotes: notes,
      });

      expect(response.data.message).toContain('success');
    });
  });

  describe('GET /api/assessments/:id/team-rank', () => {
    it('retrieves team ranking', async () => {
      const response = await api.get('/api/assessments/assessment-123/team-rank');

      expect(response.data).toHaveProperty('rank');
      expect(response.data).toHaveProperty('totalAthletes');
      expect(response.data).toHaveProperty('percentile');
    });
  });
});
