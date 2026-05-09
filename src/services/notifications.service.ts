// src/services/notifications.service.ts

import { supabase } from '@/integrations/supabase/client';
import { debugError, throwIfSupabaseError } from '@/lib/debug';
import type { Notification, NotificationWithRelations } from '@/types/database';

export const notificationsService = {
  async getNotifications(
    limit: number = 50
  ): Promise<NotificationWithRelations[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('notifications')
      .select(
        `
        *,
        task:tasks(*),
        actor:profiles!notifications_actor_id_fkey(*)
      `
      )
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    throwIfSupabaseError('notifications.service', 'getNotifications', error, {
      limit,
      userId: user?.id,
    });
    return data as NotificationWithRelations[];
  },

  async getUnreadCount(): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);

    throwIfSupabaseError('notifications.service', 'getUnreadCount', error, {
      userId: user?.id,
    });
    return count || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user?.id)
      .eq('is_read', false);

    throwIfSupabaseError('notifications.service', 'markAllAsRead', error, {
      userId: user?.id,
    });
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    throwIfSupabaseError('notifications.service', 'deleteNotification', error, {
      notificationId,
    });
  },

  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED' || status === 'CLOSED') return;
        debugError(
          'notifications.service',
          `Realtime subscribe status=${status}`,
          err
        );
      });
  },
};
