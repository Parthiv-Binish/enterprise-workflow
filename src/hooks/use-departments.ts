import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  departmentsService,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
} from '@/services/departments.service';
import { toast } from 'sonner';

export const departmentKeys = {
  all: ['departments'] as const,
  list: () => [...departmentKeys.all, 'list'] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.list(),
    queryFn: () => departmentsService.list(),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDepartmentInput) =>
      departmentsService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success('Department created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: string } & UpdateDepartmentInput) =>
      departmentsService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success('Department updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
