// src/hooks/use-tasks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import type {
  TaskFilters,
  PaginationParams,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
} from '@/types/database';
import { toast } from 'sonner';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters, pagination: PaginationParams) =>
    [...taskKeys.lists(), filters, pagination] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  activity: (id: string) => [...taskKeys.detail(id), 'activity'] as const,
};

export function useTasks(
  filters: TaskFilters = {},
  pagination: PaginationParams = {}
) {
  return useQuery({
    queryKey: taskKeys.list(filters, pagination),
    queryFn: () => tasksService.getTasks(filters, pagination),
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => tasksService.getTaskById(taskId),
    enabled: !!taskId,
  });
}

export function useTaskActivity(taskId: string) {
  return useQuery({
    queryKey: taskKeys.activity(taskId),
    queryFn: () => tasksService.getTaskActivity(taskId),
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksService.createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      tasksService.updateTask(taskId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksService.updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));
      
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => ({
        ...old,
        status,
      }));
      
      return { previousTask };
    },
    onError: (err, { taskId }, context) => {
      queryClient.setQueryData(taskKeys.detail(taskId), context?.previousTask);
      toast.error('Failed to update status');
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksService.submitForApproval(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task submitted for approval');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit for approval: ${error.message}`);
    },
  });
}

export function useApproveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, comments }: { taskId: string; comments?: string }) =>
      tasksService.approveTask(taskId, comments),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve task: ${error.message}`);
    },
  });
}

export function useRejectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, comments }: { taskId: string; comments: string }) =>
      tasksService.rejectTask(taskId, comments),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject task: ${error.message}`);
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      content,
      parentId,
    }: {
      taskId: string;
      content: string;
      parentId?: string;
    }) => tasksService.addComment(taskId, content, parentId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      toast.success('Comment added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

export function useAddChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      tasksService.addChecklist(taskId, title),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add checklist item: ${error.message}`);
    },
  });
}

export function useToggleChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checklistId,
      isCompleted,
      taskId,
    }: {
      checklistId: string;
      isCompleted: boolean;
      taskId: string;
    }) => tasksService.toggleChecklist(checklistId, isCompleted),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useWatchTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksService.watchTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      toast.success('Now watching this task');
    },
  });
}

export function useUnwatchTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksService.unwatchTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      toast.success('Stopped watching this task');
    },
  });
}
