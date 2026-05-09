// src/services/teams.service.ts

import { supabase } from '@/integrations/supabase/client';
import { throwIfSupabaseError } from '@/lib/debug';
import type {
  Team,
  TeamWithRelations,
  CreateTeamInput,
  UpdateTeamInput,
  TeamMemberWithProfile,
} from '@/types/database';

export const teamsService = {
  async getTeams(): Promise<TeamWithRelations[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(
        `
        *,
        manager:profiles!teams_manager_id_fkey(*),
        department:departments(*),
        members:team_members(*, user:profiles(*))
      `
      )
      .eq('is_active', true)
      .order('name');

    throwIfSupabaseError('teams.service', 'getTeams', error);

    return data?.map((team) => ({
      ...team,
      members: team.members?.map((m: any) => ({
        ...m,
        user: m.user,
      })) as TeamMemberWithProfile[],
    })) as TeamWithRelations[];
  },

  async getTeamById(teamId: string): Promise<TeamWithRelations | null> {
    const { data, error } = await supabase
      .from('teams')
      .select(
        `
        *,
        manager:profiles!teams_manager_id_fkey(*),
        department:departments(*),
        members:team_members(*, user:profiles(*))
      `
      )
      .eq('id', teamId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throwIfSupabaseError('teams.service', 'getTeamById', error, { teamId });
    }

    return {
      ...data,
      members: data.members?.map((m: any) => ({
        ...m,
        user: m.user,
      })) as TeamMemberWithProfile[],
    } as TeamWithRelations;
  },

  async createTeam(input: CreateTeamInput): Promise<Team> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('teams')
      .insert({
        ...input,
        created_by: user?.id,
      })
      .select()
      .single();

    throwIfSupabaseError('teams.service', 'createTeam', error);
    return data;
  },

  async updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update(input)
      .eq('id', teamId)
      .select()
      .single();

    throwIfSupabaseError('teams.service', 'updateTeam', error, { teamId });
    return data;
  },

  async deleteTeam(teamId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', teamId);

    throwIfSupabaseError('teams.service', 'deleteTeam', error, { teamId });
  },

  async addTeamMember(teamId: string, userId: string, role: string = 'member') {
    const { data, error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, user_id: userId, role })
      .select('*, user:profiles(*)')
      .single();

    throwIfSupabaseError('teams.service', 'addTeamMember', error, {
      teamId,
      userId,
      role,
    });
    return data;
  },

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    throwIfSupabaseError('teams.service', 'removeTeamMember', error, {
      teamId,
      userId,
    });
  },

  async updateMemberRole(
    teamId: string,
    userId: string,
    role: string
  ): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    throwIfSupabaseError('teams.service', 'updateMemberRole', error, {
      teamId,
      userId,
      role,
    });
  },

  async getUserTeams(userId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('team:teams(*)')
      .eq('user_id', userId);

    throwIfSupabaseError('teams.service', 'getUserTeams', error, { userId });
    return data?.map((tm: any) => tm.team).filter(Boolean) || [];
  },
};
