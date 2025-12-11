import { describe, it, expect } from 'vitest';
import api from '../api';

describe('Reports API', () => {
  describe('POST /api/reports/generate/:athleteId', () => {
    it('generates parent report', async () => {
      const response = await api.post('/api/reports/generate/athlete-1');

      expect(response.data).toHaveProperty('athleteName');
      expect(response.data).toHaveProperty('summary');
      expect(response.data).toHaveProperty('assessments');
      expect(response.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.data.assessments)).toBe(true);
      expect(Array.isArray(response.data.recommendations)).toBe(true);
    });
  });

  describe('POST /api/reports/send', () => {
    it('sends report to parent', async () => {
      const response = await api.post('/api/reports/send', {
        athleteId: 'athlete-1',
        parentEmail: 'parent@test.com',
      });

      expect(response.data.message).toContain('success');
      expect(response.data).toHaveProperty('pin');
      expect(response.data).toHaveProperty('reportId');
      expect(response.data.pin).toHaveLength(4);
    });
  });

  describe('POST /api/reports/view/:id/verify', () => {
    it('verifies correct PIN', async () => {
      const response = await api.post('/api/reports/view/report-123/verify', {
        pin: '1234',
      });

      expect(response.data.verified).toBe(true);
    });

    it('rejects incorrect PIN', async () => {
      await expect(
        api.post('/api/reports/view/report-123/verify', {
          pin: '0000',
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/reports/view/:id', () => {
    it('retrieves report with valid PIN', async () => {
      const response = await api.get('/api/reports/view/report-123', {
        params: { pin: '1234' },
      });

      expect(response.data).toHaveProperty('athleteName');
      expect(response.data).toHaveProperty('summary');
      expect(response.data).toHaveProperty('assessments');
    });

    it('rejects request with invalid PIN', async () => {
      await expect(
        api.get('/api/reports/view/report-123', {
          params: { pin: '0000' },
        })
      ).rejects.toThrow();
    });
  });
});
