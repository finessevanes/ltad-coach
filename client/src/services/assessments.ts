import { api } from './api';
import { Assessment, AssessmentCreate } from '../types/assessment';

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
export const getByAthlete = async (athleteId: string): Promise<Assessment[]> => {
  const response = await api.get<Assessment[]>(`/assessments/athlete/${athleteId}`);
  return response.data;
};

const assessmentsService = {
  getById,
  analyzeVideo,
  getByAthlete,
};

export default assessmentsService;
