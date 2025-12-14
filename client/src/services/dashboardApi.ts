import { api } from './api';

/**
 * Dashboard API service
 * Handles fetching aggregated dashboard data from backend (BE-015)
 */

export interface DashboardStats {
  totalAthletes: number;
  pendingConsent: number;
  assessmentsThisWeek: number;
  averageScore: number;
}

export interface DashboardData {
  athletes: any[];
  stats: DashboardStats;
  recentAssessments: any[];
  aiInsights?: string;
}

export const dashboardApi = {
  /**
   * Get aggregated dashboard data
   * @returns Dashboard data including athletes, stats, recent assessments, and AI insights
   */
  async getData() {
    const response = await api.get<{ data: DashboardData }>('/dashboard');
    return response.data;
  },
};
