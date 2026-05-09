import { supabase } from '@/integrations/supabase/client';
import { throwIfSupabaseError } from '@/lib/debug';
import type { Profile } from '@/types/database';

export const profilesService = {
  async listProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    throwIfSupabaseError('profiles.service', 'listProfiles', error);
    return (data ?? []) as Profile[];
  },
};
