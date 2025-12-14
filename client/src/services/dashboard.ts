import { api } from './api';
import camelcaseKeys from 'camelcase-keys';

interface DashboardStats {
  totalAthletes: number;
  activeAthletes: number;
  pendingConsent: number;
  totalAssessments: number;
}

interface RecentAssessmentItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  status: string;
  createdAt: string;
  holdTime?: number;
  durationScore?: number;
  swayVelocity?: number;
}

interface PendingAthleteItem {
  id: string;
  name: string;
  age: number;
  gender: string;
  parentEmail: string;
  createdAt: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentAssessments: RecentAssessmentItem[];
  pendingAthletes: PendingAthleteItem[];
}

/**
 * Get all dashboard data in a single optimized API call
 */
export const getDashboard = async (): Promise<DashboardResponse> => {
  const response = await api.get('/dashboard');
  return camelcaseKeys(response.data, { deep: true }) as DashboardResponse;
};

const dashboardService = {
  getDashboard,
};

export default dashboardService;
