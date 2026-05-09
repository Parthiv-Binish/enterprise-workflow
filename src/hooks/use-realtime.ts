// src/hooks/use-realtime.ts

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debugError } from '@/lib/debug';
import { useAuthStore } from '@/store/auth.store';
import { taskKeys } from './use-tasks';
import { teamKeys } from './use-teams';
import { notificationKeys } from './use-notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Create a single channel for all subscriptions
    const channel = supabase.channel(`realtime:${user.id}`);

    // Subscribe to task changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
      },
      (payload) => {
        // Invalidate task queries
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          queryClient.invalidateQueries({
            queryKey: taskKeys.detail(payload.new.id as string),
          });
        }
      }
    );

    // Subscribe to comments
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'task_comments',
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'task_id' in payload.new) {
          queryClient.invalidateQueries({
            queryKey: taskKeys.detail(payload.new.task_id as string),
          });
        }
      }
    );

    // Subscribe to notifications
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        if (!payload.new) return;
        // Keep UI consistent: refresh list + unread badge
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      }
    );

    // Subscribe to team changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      }
    );

    // Subscribe to team members
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_members',
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'team_id' in payload.new) {
          queryClient.invalidateQueries({
            queryKey: teamKeys.detail(payload.new.team_id as string),
          });
        }
      }
    );

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') return;
      if (status === 'CLOSED') return;
      debugError('useRealtime', `channel realtime status=${status}`, err, {
        channel: `realtime:${user.id}`,
      });
    });
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return channelRef.current;
}
