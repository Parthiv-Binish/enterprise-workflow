import { supabase } from '@/integrations/supabase/client';
import { throwIfSupabaseError } from '@/lib/debug';
import type { Department } from '@/types/database';

export interface CreateDepartmentInput {
  name: string;
  description?: string | null;
  parent_id?: string | null;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string | null;
  head_id?: string | null;
  parent_id?: string | null;
  is_active?: boolean;
}

export const departmentsService = {
  async list(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    throwIfSupabaseError('departments.service', 'list', error);
    return (data ?? []) as Department[];
  },

  async create(input: CreateDepartmentInput): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert(input)
      .select()
      .single();

    throwIfSupabaseError('departments.service', 'create', error);
    return data as Department;
  },

  async update(id: string, input: UpdateDepartmentInput): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    throwIfSupabaseError('departments.service', 'update', error, { id });
    return data as Department;
  },
};
