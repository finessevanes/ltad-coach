import { api } from './api';

export interface ReportPreview {
  athleteId: string;
  athleteName: string;
  content: string;
  assessmentCount: number;
  latestScore?: number;
}

export interface ReportSendResponse {
  id: string;
  pin: string;
  message: string;
}

export interface ReportResendResponse {
  pin: string;
  message: string;
}

export interface ReportInfo {
  reportId: string;
  athleteName: string;
  createdAt: string;
  requiresPin: boolean;
}

export interface ReportView {
  athleteName: string;
  reportContent: string;
  createdAt: string;
}

export interface ReportListItem {
  id: string;
  athleteId: string;
  createdAt: string;
  sentAt?: string;
}

// Note: The api client (defined in FE-001) uses camelcase-keys interceptor
// to automatically transform snake_case responses to camelCase.
// No manual mapping is needed - response.data is already in camelCase.

export const reportsApi = {
  generatePreview: async (athleteId: string): Promise<ReportPreview> => {
    const response = await api.post(`/reports/generate/${athleteId}`);
    return response.data;  // Already transformed by interceptor
  },

  send: async (athleteId: string): Promise<ReportSendResponse> => {
    const response = await api.post(`/reports/${athleteId}/send`);
    return response.data;  // Already transformed by interceptor
  },

  /**
   * Resend an existing report with a new PIN.
   * Use when parent lost the original PIN or link expired.
   */
  resend: async (reportId: string): Promise<ReportResendResponse> => {
    const response = await api.post(`/reports/${reportId}/resend`);
    return response.data;  // Already transformed by interceptor
  },

  getInfo: async (reportId: string): Promise<ReportInfo> => {
    const response = await api.get(`/reports/view/${reportId}`);
    return response.data;  // Already transformed by interceptor
  },

  verifyPin: async (reportId: string, pin: string): Promise<ReportView> => {
    const response = await api.post(`/reports/view/${reportId}/verify`, { pin });
    return response.data;  // Already transformed by interceptor
  },

  /**
   * Get all reports for an athlete.
   * Used in report history on athlete profile page.
   */
  getByAthlete: async (athleteId: string): Promise<ReportListItem[]> => {
    const response = await api.get(`/reports/athlete/${athleteId}`);
    return response.data;  // Already transformed by interceptor
  },
};
