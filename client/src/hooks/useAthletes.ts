import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import athletesService from '../services/athletes';
import { Athlete } from '../types/athlete';

// Query keys for cache management
export const athleteKeys = {
  all: ['athletes'] as const,
  detail: (id: string) => ['athletes', id] as const,
};

/**
 * Fetch all athletes for the authenticated coach
 * Cached for 1 minute, deduplicates concurrent requests
 */
export const useAthletes = () => {
  return useQuery({
    queryKey: athleteKeys.all,
    queryFn: () => athletesService.getAll(),
  });
};

/**
 * Fetch single athlete by ID
 * Cached individually, enables parallel fetching
 */
export const useAthlete = (athleteId: string | undefined) => {
  return useQuery({
    queryKey: athleteKeys.detail(athleteId!),
    queryFn: () => athletesService.getById(athleteId!),
    enabled: !!athleteId, // Only fetch if athleteId exists
  });
};

/**
 * Create new athlete
 * Invalidates athlete list cache on success
 */
export const useCreateAthlete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Athlete, 'id' | 'coachId' | 'createdAt'>) =>
      athletesService.create(data),
    onSuccess: () => {
      // Invalidate and refetch athlete list
      queryClient.invalidateQueries({ queryKey: athleteKeys.all });
    },
  });
};

/**
 * Update athlete
 * Invalidates both list and detail cache on success
 */
export const useUpdateAthlete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Athlete> }) =>
      athletesService.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate detail cache
      queryClient.invalidateQueries({ queryKey: athleteKeys.detail(id) });
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: athleteKeys.all });
    },
  });
};

/**
 * Delete athlete
 * Invalidates athlete list cache on success
 */
export const useDeleteAthlete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (athleteId: string) => athletesService.delete(athleteId),
    onSuccess: (_, athleteId) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: athleteKeys.detail(athleteId) });
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: athleteKeys.all });
    },
  });
};

/**
 * Resend consent email
 * No cache invalidation needed
 */
export const useResendConsent = () => {
  return useMutation({
    mutationFn: (athleteId: string) => athletesService.resendConsent(athleteId),
  });
};
