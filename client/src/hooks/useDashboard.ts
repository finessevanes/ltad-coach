import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';

// Query keys for cache management
export const dashboardKeys = {
  data: ['dashboard'] as const,
};

/**
 * Fetch dashboard data (stats, recent assessments, pending athletes, all athletes)
 * Cached for 1 minute, provides all data needed for dashboard in single request
 *
 * Benefits:
 * - Eliminates duplicate athlete fetching
 * - Reduces API calls from 2 to 1
 * - Automatic deduplication and caching
 */
export const useDashboard = () => {
  return useQuery({
    queryKey: dashboardKeys.data,
    queryFn: () => dashboardApi.getData(),
    staleTime: 30000, // 30 seconds - dashboard data changes frequently
  });
};
