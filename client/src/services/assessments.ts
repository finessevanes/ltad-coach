import { api } from './api';
import { Assessment, AssessmentCreate } from '../types/assessment';

interface AssessmentListItem {
  id: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  legTested: string;
  createdAt: string;
  status: string;
  durationSeconds?: number;
  stabilityScore?: number;
}

interface AssessmentListResponse {
  assessments: AssessmentListItem[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Get assessment by ID
 */
export const getById = async (id: string): Promise<Assessment> => {
  const response = await api.get<Assessment>(`/assessments/${id}`);
  return response.data;
};

/**
 * Trigger video analysis
 */
export const analyzeVideo = async (data: AssessmentCreate): Promise<Assessment> => {
  const response = await api.post<Assessment>('/assessments/analyze', data);
  return response.data;
};

/**
 * List assessments for an athlete
 */
export const getByAthlete = async (athleteId: string): Promise<AssessmentListResponse> => {
  const response = await api.get<AssessmentListResponse>(`/assessments/athlete/${athleteId}`);
  return response.data;
};

/**
 * List all assessments for authenticated coach
 */
export const getAll = async (limit: number = 20): Promise<AssessmentListItem[]> => {
  const response = await api.get<AssessmentListResponse>(`/assessments?limit=${limit}`);
  return response.data.assessments;
};

const assessmentsService = {
  getById,
  analyzeVideo,
  getByAthlete,
  getAll,
};

export default assessmentsService;
