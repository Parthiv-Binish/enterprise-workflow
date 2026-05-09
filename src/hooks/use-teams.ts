// src/hooks/use-teams.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsService } from '@/services/teams.service';
import type { CreateTeamInput, UpdateTeamInput } from '@/types/database';
import { toast } from 'sonner';

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  userTeams: (userId: string) => [...teamKeys.all, 'user', userId] as const,
};

export function useTeams() {
  return useQuery({
    queryKey: teamKeys.lists(),
    queryFn: () => teamsService.getTeams(),
  });
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => teamsService.getTeamById(teamId),
    enabled: !!teamId,
  });
}

export function useUserTeams(userId: string) {
  return useQuery({
    queryKey: teamKeys.userTeams(userId),
    queryFn: () => teamsService.getUserTeams(userId),
    enabled: !!userId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTeamInput) => teamsService.createTeam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      toast.success('Team created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create team: ${error.message}`);
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, input }: { teamId: string; input: UpdateTeamInput }) =>
      teamsService.updateTeam(teamId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(data.id) });
      toast.success('Team updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update team: ${error.message}`);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamsService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      toast.success('Team deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete team: ${error.message}`);
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      role,
    }: {
      teamId: string;
      userId: string;
      role?: string;
    }) => teamsService.addTeamMember(teamId, userId, role),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      toast.success('Team member added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add team member: ${error.message}`);
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamsService.removeTeamMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      toast.success('Team member removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove team member: ${error.message}`);
    },
  });
}
