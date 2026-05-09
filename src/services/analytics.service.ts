// src/services/analytics.service.ts

import { supabase } from '@/integrations/supabase/client';
import { throwIfSupabaseError } from '@/lib/debug';
import type {
  DashboardStats,
  TeamProductivity,
  UserWorkload,
  TaskStatus,
  TaskPriority,
} from '@/types/database';

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    // Get task counts by status
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, priority, due_date, sla_breached')
      .eq('is_archived', false);

    throwIfSupabaseError('analytics.service', 'getDashboardStats:tasks', error);

    const now = new Date();
    const totalTasks = tasks?.length || 0;
    const completedTasks =
      tasks?.filter((t) => ['completed', 'closed'].includes(t.status)).length || 0;
    const overdueTasks =
      tasks?.filter(
        (t) =>
          t.due_date &&
          new Date(t.due_date) < now &&
          !['completed', 'closed', 'archived'].includes(t.status)
      ).length || 0;

    type Row = {
      status: string;
      priority: string;
      due_date: string | null;
      sla_breached: boolean | null;
    };

    const tasksByStatus: Record<TaskStatus, number> = {
      draft: 0,
      pending: 0,
      assigned: 0,
      in_progress: 0,
      blocked: 0,
      waiting_review: 0,
      completed: 0,
      rejected: 0,
      closed: 0,
      archived: 0,
    };

    const tasksByPriority: Record<TaskPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      emergency: 0,
    };

    for (const task of tasks ?? []) {
      const row = task as Row;
      const s = row.status as TaskStatus;
      const p = row.priority as TaskPriority;
      if (Object.prototype.hasOwnProperty.call(tasksByStatus, s)) {
        tasksByStatus[s] += 1;
      }
      if (Object.prototype.hasOwnProperty.call(tasksByPriority, p)) {
        tasksByPriority[p] += 1;
      }
    }

    // Get pending approvals
    const { count: pendingApprovals, error: pendErr } = await supabase
      .from('approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    throwIfSupabaseError(
      'analytics.service',
      'getDashboardStats:approvals_count',
      pendErr
    );

    // Calculate SLA compliance
    const slaBreached = tasks?.filter((t) => t.sla_breached).length || 0;
    const tasksWithSla = tasks?.filter((t) => t.sla_breached !== null).length || 1;

    return {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      overdue_tasks: overdueTasks,
      pending_approvals: pendingApprovals || 0,
      tasks_by_status: tasksByStatus,
      tasks_by_priority: tasksByPriority,
      completion_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      sla_compliance:
        tasksWithSla > 0
          ? ((tasksWithSla - slaBreached) / tasksWithSla) * 100
          : 100,
    };
  },

  async getTeamProductivity(): Promise<TeamProductivity[]> {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name')
      .eq('is_active', true);

    throwIfSupabaseError('analytics.service', 'getTeamProductivity:teams', error);

    const productivity: TeamProductivity[] = [];

    for (const team of teams || []) {
      const { data: tasks, error: taskErr } = await supabase
        .from('tasks')
        .select('status, created_at, completed_at')
        .eq('team_id', team.id)
        .eq('is_archived', false);
      throwIfSupabaseError('analytics.service', 'getTeamProductivity:tasks', taskErr, {
        teamId: team.id,
      });

      const totalTasks = tasks?.length || 0;
      const completedTasks =
        tasks?.filter((t) => ['completed', 'closed'].includes(t.status)).length || 0;

      // Calculate average completion time
      const completedWithTime =
        tasks?.filter((t) => t.completed_at && t.created_at) || [];
      const avgCompletionTime =
        completedWithTime.length > 0
          ? completedWithTime.reduce((sum, t) => {
              const created = new Date(t.created_at).getTime();
              const completed = new Date(t.completed_at!).getTime();
              return sum + (completed - created);
            }, 0) / completedWithTime.length
          : 0;

      productivity.push({
        team_id: team.id,
        team_name: team.name,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        avg_completion_time: avgCompletionTime / (1000 * 60 * 60), // Convert to hours
        completion_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      });
    }

    return productivity;
  },

  async getUserWorkload(): Promise<UserWorkload[]> {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .in('role', ['employee', 'team_manager']);

    throwIfSupabaseError('analytics.service', 'getUserWorkload:profiles', error);

    const workload: UserWorkload[] = [];
    const now = new Date();

    for (const user of users || []) {
      const { data: tasks, error: taskErr } = await supabase
        .from('tasks')
        .select('status, due_date')
        .eq('assignee_id', user.id)
        .eq('is_archived', false);
      throwIfSupabaseError('analytics.service', 'getUserWorkload:tasks', taskErr, {
        userId: user.id,
      });

      const assignedTasks = tasks?.length || 0;
      const completedTasks =
        tasks?.filter((t) => ['completed', 'closed'].includes(t.status)).length || 0;
      const overdueTasks =
        tasks?.filter(
          (t) =>
            t.due_date &&
            new Date(t.due_date) < now &&
            !['completed', 'closed', 'archived'].includes(t.status)
        ).length || 0;
      const inProgressTasks =
        tasks?.filter((t) => t.status === 'in_progress').length || 0;

      workload.push({
        user_id: user.id,
        user_name: user.full_name,
        assigned_tasks: assignedTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        in_progress_tasks: inProgressTasks,
      });
    }

    return workload;
  },
};
