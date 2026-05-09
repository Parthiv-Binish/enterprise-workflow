import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  teamProductivity: () => [...analyticsKeys.all, 'team-productivity'] as const,
  userWorkload: () => [...analyticsKeys.all, 'user-workload'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => analyticsService.getDashboardStats(),
  });
}

export function useTeamProductivity() {
  return useQuery({
    queryKey: analyticsKeys.teamProductivity(),
    queryFn: () => analyticsService.getTeamProductivity(),
  });
}

export function useUserWorkload() {
  return useQuery({
    queryKey: analyticsKeys.userWorkload(),
    queryFn: () => analyticsService.getUserWorkload(),
  });
}
