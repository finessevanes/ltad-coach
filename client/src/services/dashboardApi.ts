import { api } from './api';

/**
 * Dashboard API service
 * Handles fetching aggregated dashboard data from backend (BE-015)
 */

export interface DashboardStats {
  totalAthletes: number;
  activeAthletes: number;
  pendingConsent: number;
  totalAssessments: number;
}

export interface RecentAssessmentItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  status: string;
  createdAt: string;
  durationSeconds?: number;
  durationScore?: number;
  swayVelocity?: number;
}

export interface PendingAthleteItem {
  id: string;
  name: string;
  age: number;
  gender: string;
  parentEmail: string;
  createdAt: string;
}

export interface AthleteListItem {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  parentEmail: string;
  consentStatus: 'pending' | 'active' | 'declined';
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentAssessments: RecentAssessmentItem[];
  pendingAthletes: PendingAthleteItem[];
  athletes: AthleteListItem[];
}

export const dashboardApi = {
  /**
   * Get aggregated dashboard data
   * @returns Dashboard data including stats, recent assessments, and pending athletes
   */
  async getData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },
};
