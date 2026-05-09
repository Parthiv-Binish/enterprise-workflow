// src/services/tasks.service.ts

import { supabase } from '@/integrations/supabase/client';
import { throwIfSupabaseError } from '@/lib/debug';
import { orIlikeTwoColumns } from '@/lib/postgrest-filters';
import type {
  Task,
  TaskWithRelations,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  PaginationParams,
  PaginatedResponse,
  TaskStatus,
} from '@/types/database';

export const tasksService = {
  async getTasks(
    filters: TaskFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<TaskWithRelations>> {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = pagination;

    let query = supabase
      .from('tasks')
      .select(
        `
        *,
        assignee:profiles!tasks_assignee_id_fkey(*),
        team:teams(*),
        reporter:profiles!tasks_reporter_id_fkey(*),
        creator:profiles!tasks_created_by_fkey(*),
        labels:task_label_mapping(label:task_labels(*))
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.assignee_id) {
      query = query.eq('assignee_id', filters.assignee_id);
    }
    if (filters.team_id) {
      query = query.eq('team_id', filters.team_id);
    }
    if (filters.reporter_id) {
      query = query.eq('reporter_id', filters.reporter_id);
    }
    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }
    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }
    if (filters.search) {
      const orFragment = orIlikeTwoColumns(
        'title',
        'description',
        filters.search
      );
      if (orFragment) {
        query = query.or(orFragment);
      }
    }
    if (filters.is_archived !== undefined) {
      query = query.eq('is_archived', filters.is_archived);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(from, to);

    const { data, error, count } = await query;

    throwIfSupabaseError('tasks.service', 'getTasks', error, {
      filters,
      pagination,
      sort_by,
      sort_order,
    });

    // Transform labels
    const transformedData = data?.map((task) => ({
      ...task,
      labels: task.labels?.map((lm: any) => lm.label) || [],
    })) as TaskWithRelations[];

    return {
      data: transformedData || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };
  },

  async getTaskById(taskId: string): Promise<TaskWithRelations | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        assignee:profiles!tasks_assignee_id_fkey(*),
        team:teams(*),
        reporter:profiles!tasks_reporter_id_fkey(*),
        creator:profiles!tasks_created_by_fkey(*),
        labels:task_label_mapping(label:task_labels(*)),
        comments:task_comments(*, user:profiles(*)),
        attachments:task_attachments(*),
        checklists:task_checklists(*),
        watchers:task_watchers(user:profiles(*)),
        approval:approvals(*)
      `
      )
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throwIfSupabaseError('tasks.service', 'getTaskById', error, { taskId });
    }

    return {
      ...data,
      labels: data.labels?.map((lm: any) => lm.label) || [],
      watchers: data.watchers?.map((w: any) => w.user) || [],
      comments: data.comments || [],
      attachments: data.attachments || [],
      checklists: data.checklists || [],
      approval: data.approval?.[0] || null,
    } as TaskWithRelations;
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const { labels, ...taskData } = input;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        created_by: user?.id,
        reporter_id: user?.id,
      })
      .select()
      .single();

    throwIfSupabaseError('tasks.service', 'createTask', error);

    // Add labels if provided
    if (labels?.length) {
      const { error: mapErr } = await supabase.from('task_label_mapping').insert(
        labels.map((labelId) => ({
          task_id: data.id,
          label_id: labelId,
        }))
      );
      throwIfSupabaseError('tasks.service', 'createTask:task_label_mapping', mapErr, {
        taskId: data.id,
      });
    }

    return data;
  },

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const { labels, ...taskData } = input;

    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', taskId)
      .select()
      .single();

    throwIfSupabaseError('tasks.service', 'updateTask', error, { taskId });

    // Update labels if provided
    if (labels !== undefined) {
      const { error: delErr } = await supabase
        .from('task_label_mapping')
        .delete()
        .eq('task_id', taskId);
      throwIfSupabaseError('tasks.service', 'updateTask:labels_delete', delErr, {
        taskId,
      });

      if (labels.length) {
        const { error: insErr } = await supabase.from('task_label_mapping').insert(
          labels.map((labelId) => ({
            task_id: taskId,
            label_id: labelId,
          }))
        );
        throwIfSupabaseError('tasks.service', 'updateTask:labels_insert', insErr, {
          taskId,
        });
      }
    }

    return data;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    throwIfSupabaseError('tasks.service', 'deleteTask', error, { taskId });
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const updates: UpdateTaskInput = { status };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    return this.updateTask(taskId, updates);
  },

  async submitForApproval(taskId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: taskErr } = await supabase
      .from('tasks')
      .update({ status: 'waiting_review' })
      .eq('id', taskId);
    throwIfSupabaseError('tasks.service', 'submitForApproval:tasks', taskErr, {
      taskId,
    });

    const { error: appErr } = await supabase.from('approvals').insert({
      task_id: taskId,
      requested_by: user?.id,
      status: 'pending',
    });
    throwIfSupabaseError('tasks.service', 'submitForApproval:approvals', appErr, {
      taskId,
    });
  },

  async approveTask(taskId: string, comments?: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: apprErr } = await supabase
      .from('approvals')
      .update({
        status: 'approved',
        approver_id: user?.id,
        comments,
        responded_at: new Date().toISOString(),
      })
      .eq('task_id', taskId)
      .eq('status', 'pending');
    throwIfSupabaseError('tasks.service', 'approveTask:approvals', apprErr, {
      taskId,
    });

    const { error: taskErr } = await supabase
      .from('tasks')
      .update({
        status: 'closed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);
    throwIfSupabaseError('tasks.service', 'approveTask:tasks', taskErr, { taskId });
  },

  async rejectTask(taskId: string, comments: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: apprErr } = await supabase
      .from('approvals')
      .update({
        status: 'rejected',
        approver_id: user?.id,
        comments,
        responded_at: new Date().toISOString(),
      })
      .eq('task_id', taskId)
      .eq('status', 'pending');
    throwIfSupabaseError('tasks.service', 'rejectTask:approvals', apprErr, {
      taskId,
    });

    const { error: taskErr } = await supabase
      .from('tasks')
      .update({ status: 'rejected' })
      .eq('id', taskId);
    throwIfSupabaseError('tasks.service', 'rejectTask:tasks', taskErr, { taskId });
  },

  async addComment(taskId: string, content: string, parentId?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: user?.id,
        content,
        parent_id: parentId,
      })
      .select('*, user:profiles(*)')
      .single();

    throwIfSupabaseError('tasks.service', 'addComment', error, { taskId });
    return data;
  },

  async updateComment(commentId: string, content: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single();

    throwIfSupabaseError('tasks.service', 'updateComment', error, { commentId });
    return data;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    throwIfSupabaseError('tasks.service', 'deleteComment', error, { commentId });
  },

  async addChecklist(taskId: string, title: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('task_checklists')
      .insert({
        task_id: taskId,
        title,
        created_by: user?.id,
      })
      .select()
      .single();

    throwIfSupabaseError('tasks.service', 'addChecklist', error, { taskId });
    return data;
  },

  async toggleChecklist(checklistId: string, isCompleted: boolean) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('task_checklists')
      .update({
        is_completed: isCompleted,
        completed_by: isCompleted ? user?.id : null,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', checklistId)
      .select()
      .single();

    throwIfSupabaseError('tasks.service', 'toggleChecklist', error, {
      checklistId,
    });
    return data;
  },

  async watchTask(taskId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('task_watchers').insert({
      task_id: taskId,
      user_id: user?.id,
    });

    if (error && error.code !== '23505') {
      throwIfSupabaseError('tasks.service', 'watchTask', error, { taskId });
    }
  },

  async unwatchTask(taskId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('task_watchers')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', user?.id);

    throwIfSupabaseError('tasks.service', 'unwatchTask', error, { taskId });
  },

  async getTaskActivity(taskId: string) {
    const { data, error } = await supabase
      .from('task_activity_logs')
      .select('*, user:profiles(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    throwIfSupabaseError('tasks.service', 'getTaskActivity', error, { taskId });
    return data;
  },
};
