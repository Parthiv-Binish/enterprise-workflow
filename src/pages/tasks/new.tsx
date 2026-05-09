import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTask } from '@/hooks/use-tasks';
import { useTeam, useTeams } from '@/hooks/use-teams';
import { useProfilesList } from '@/hooks/use-profiles';
import type { TaskPriority, TaskStatus } from '@/types/database';

const PRIORITIES = [
  'low',
  'medium',
  'high',
  'critical',
  'emergency',
] as const satisfies readonly TaskPriority[];

const TASK_STATUSES = [
  'draft',
  'pending',
  'assigned',
  'in_progress',
  'blocked',
  'waiting_review',
  'completed',
  'rejected',
  'closed',
  'archived',
] as const satisfies readonly TaskStatus[];

/** Common defaults when creating — full list still allowed via schema */
const CREATE_STATUS_OPTIONS: TaskStatus[] = [
  'draft',
  'pending',
  'assigned',
  'in_progress',
];

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES),
  status: z.enum(TASK_STATUSES),
  due_date: z.string().optional(),
  team_id: z.string().optional(),
  assignee_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewTaskPage() {
  const navigate = useNavigate();
  const createTask = useCreateTask();
  const { data: teams } = useTeams();
  const profiles = useProfilesList();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      status: 'draft',
      team_id: '',
      assignee_id: '',
    },
  });

  const priority = watch('priority');
  const status = watch('status');
  const teamIdVal = watch('team_id');
  const assigneeIdVal = watch('assignee_id');

  const team = useTeam(teamIdVal || '');

  const teamMemberOptions = useMemo(() => {
    const members = team.data?.members ?? [];
    const users = members
      .map((m: any) => m.user)
      .filter(Boolean);
    // de-dupe by id
    const uniq = new Map<string, any>();
    for (const u of users) uniq.set(u.id, u);
    return [...uniq.values()];
  }, [team.data?.members]);

  // Enforce team-based assignment: if team changes and current assignee is not in team, clear it.
  useEffect(() => {
    if (!teamIdVal) {
      // no team => cannot assign
      if (assigneeIdVal?.trim()) setValue('assignee_id', '');
      return;
    }
    if (!assigneeIdVal?.trim()) return;
    const ok = teamMemberOptions.some((u: any) => u.id === assigneeIdVal);
    if (!ok) setValue('assignee_id', '');
  }, [teamIdVal, assigneeIdVal, teamMemberOptions, setValue]);

  const onSubmit = (data: FormData) => {
    // Basic assignment logic: "assigned" without assignee is confusing.
    const normalizedStatus =
      data.status === 'assigned' && !data.assignee_id?.trim()
        ? ('pending' as TaskStatus)
        : data.status;
    createTask.mutate(
      {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        priority: data.priority,
        status: normalizedStatus,
        due_date: data.due_date?.trim() || undefined,
        team_id: data.team_id?.trim() || undefined,
        assignee_id: data.assignee_id?.trim() || undefined,
      },
      {
        onSuccess: (task) => navigate(`/tasks/${task.id}`),
      }
    );
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>New task</CardTitle>
        <CardDescription>
          Creates a row in <code className="text-xs">tasks</code> with your current user as
          reporter.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Ship rollout checklist" {...register('title')} />
            {errors.title ? (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Context, acceptance criteria, links…"
              {...register('description')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue('priority', v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial status</Label>
              <Select value={status} onValueChange={(v) => setValue('status', v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREATE_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" type="date" {...register('due_date')} />
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select
                value={teamIdVal || '__none__'}
                onValueChange={(v) =>
                  setValue('team_id', v === '__none__' ? '' : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No team</SelectItem>
                  {(teams ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select
              value={assigneeIdVal || '__none__'}
              onValueChange={(v) =>
                setValue('assignee_id', v === '__none__' ? '' : v)
              }
              disabled={!teamIdVal}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !teamIdVal
                      ? 'Select a team to assign'
                      : team.isLoading
                        ? 'Loading team members…'
                        : 'Optional'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {(teamMemberOptions ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name} — {p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teamIdVal && team.error ? (
              <p className="text-xs text-muted-foreground">
                {(team.error as Error).message}
              </p>
            ) : profiles.error ? (
              <p className="text-xs text-muted-foreground">
                {(profiles.error as Error).message}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <Button variant="outline" type="button" asChild>
            <Link to="/tasks">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create task
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
