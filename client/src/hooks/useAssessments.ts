import { useQuery } from '@tanstack/react-query';
import assessmentsService from '../services/assessments';

// Query keys for cache management
export const assessmentKeys = {
  all: ['assessments'] as const,
  list: (limit?: number) => ['assessments', 'list', limit] as const,
  detail: (id: string) => ['assessments', id] as const,
  byAthlete: (athleteId: string) => ['assessments', 'athlete', athleteId] as const,
};

/**
 * Fetch all assessments with optional limit
 * Cached for 1 minute, deduplicates concurrent requests
 */
export const useAssessments = (limit?: number) => {
  return useQuery({
    queryKey: assessmentKeys.list(limit),
    queryFn: () => assessmentsService.getAll(limit),
  });
};

/**
 * Fetch single assessment by ID
 * Cached individually for fast navigation
 */
export const useAssessment = (assessmentId: string | undefined) => {
  return useQuery({
    queryKey: assessmentKeys.detail(assessmentId!),
    queryFn: () => assessmentsService.getById(assessmentId!),
    enabled: !!assessmentId, // Only fetch if assessmentId exists
  });
};

/**
 * Fetch assessments for specific athlete
 * Cached per athlete for profile pages
 */
export const useAthleteAssessments = (athleteId: string | undefined) => {
  return useQuery({
    queryKey: assessmentKeys.byAthlete(athleteId!),
    queryFn: () => assessmentsService.getByAthlete(athleteId!),
    enabled: !!athleteId, // Only fetch if athleteId exists
  });
};

// Note: Create and delete mutations are intentionally omitted
// as they are not currently supported by the assessmentsService
// The service only provides: getById, analyzeVideo, getByAthlete, getAll
