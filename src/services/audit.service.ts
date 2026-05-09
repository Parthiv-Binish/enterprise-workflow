import { supabase } from '@/integrations/supabase/client';
import { throwIfSupabaseError } from '@/lib/debug';
import type { AuditLog } from '@/types/database';

export const auditService = {
  async listRecent(limit = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    throwIfSupabaseError('audit.service', 'listRecent', error, { limit });
    return (data ?? []) as AuditLog[];
  },
};
