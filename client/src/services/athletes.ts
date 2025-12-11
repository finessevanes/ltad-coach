import { api } from './api';
import { Athlete, AthleteCreate, AthleteUpdate } from '../types/athlete';

/**
 * Athletes API service
 * Handles all athlete-related API calls
 * Uses api instance which automatically handles token + case conversion
 */

/**
 * Get all athletes for the current coach
 * @param status - Optional filter by consent status
 * @returns List of athletes
 */
export const getAll = async (status?: string): Promise<Athlete[]> => {
  const params = status ? { status } : {};
  const response = await api.get<{ athletes: Athlete[]; count: number }>('/athletes', { params });
  return response.data.athletes;
};

/**
 * Get a single athlete by ID
 * @param id - Athlete ID
 * @returns Athlete object
 */
export const getById = async (id: string): Promise<Athlete> => {
  const response = await api.get<Athlete>(`/athletes/${id}`);
  return response.data;
};

/**
 * Create a new athlete
 * @param data - Athlete creation data
 * @returns Created athlete object
 */
export const create = async (data: AthleteCreate): Promise<Athlete> => {
  const response = await api.post<Athlete>('/athletes', data);
  return response.data;
};

/**
 * Update an existing athlete
 * @param id - Athlete ID
 * @param data - Athlete update data
 * @returns Updated athlete object
 */
export const update = async (id: string, data: AthleteUpdate): Promise<Athlete> => {
  const response = await api.put<Athlete>(`/athletes/${id}`, data);
  return response.data;
};

/**
 * Delete an athlete
 * @param id - Athlete ID
 */
export const deleteAthlete = async (id: string): Promise<void> => {
  await api.delete(`/athletes/${id}`);
};

/**
 * Resend consent email to athlete's parent
 * @param id - Athlete ID
 */
export const resendConsent = async (id: string): Promise<void> => {
  await api.post(`/athletes/${id}/resend-consent`);
};

/**
 * Acquire edit lock for an athlete
 * @param id - Athlete ID
 */
export const acquireLock = async (id: string): Promise<void> => {
  await api.post(`/athletes/${id}/lock`);
};

/**
 * Release edit lock for an athlete
 * @param id - Athlete ID
 */
export const releaseLock = async (id: string): Promise<void> => {
  await api.delete(`/athletes/${id}/lock`);
};

// Export as a service object
const athletesService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteAthlete,
  resendConsent,
  acquireLock,
  releaseLock,
};

export default athletesService;
