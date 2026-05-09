import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/audit.service';

export const auditKeys = {
  all: ['audit_logs'] as const,
  recent: (limit: number) => [...auditKeys.all, 'recent', limit] as const,
};

export function useAuditLogs(limit = 100) {
  return useQuery({
    queryKey: auditKeys.recent(limit),
    queryFn: () => auditService.listRecent(limit),
  });
}
