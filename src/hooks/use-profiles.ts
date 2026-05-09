import { useQuery } from '@tanstack/react-query';
import { profilesService } from '@/services/profiles.service';

export const profileListKeys = {
  all: ['profiles', 'admin-list'] as const,
};

export function useProfilesList() {
  return useQuery({
    queryKey: profileListKeys.all,
    queryFn: () => profilesService.listProfiles(),
  });
}
