import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { toast } from 'sonner';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (limit?: number) => [...notificationKeys.all, 'list', limit] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: notificationKeys.list(limit),
    queryFn: () => notificationsService.getNotifications(limit),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationsService.getUnreadCount(),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('Marked read');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('All notifications marked read');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
