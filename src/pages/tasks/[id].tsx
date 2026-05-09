import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Download,
  Paperclip,
  Trash2,
  Loader2,
  SendHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useTask,
  useAddComment,
  useWatchTask,
  useUnwatchTask,
  useUpdateTaskStatus,
  useToggleChecklist,
  useUpdateTask,
} from '@/hooks/use-tasks';
import { useAuthStore } from '@/store/auth.store';
import { useProfilesList } from '@/hooks/use-profiles';
import { storageService } from '@/services/storage.service';
import type { TaskStatus } from '@/types/database';
import { useDeleteTaskAttachment, useUploadTaskAttachment } from '@/hooks/use-tasks';
import { useTeam } from '@/hooks/use-teams';

const ALL_STATUSES: TaskStatus[] = [
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
];

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const taskId = id ?? '';
  const profile = useAuthStore((s) => s.profile);
  const { data: task, isLoading, error } = useTask(taskId);

  const updateStatus = useUpdateTaskStatus();
  const updateTask = useUpdateTask();
  const addComment = useAddComment();
  const watchTask = useWatchTask();
  const unwatchTask = useUnwatchTask();
  const toggleChecklistMut = useToggleChecklist();
  const profiles = useProfilesList();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadAttachment = useUploadTaskAttachment(taskId);
  const deleteAttachment = useDeleteTaskAttachment(taskId);

  const team = useTeam(task?.team_id ?? '');
  const teamMemberOptions = useMemo(() => {
    const members = team.data?.members ?? [];
    const users = members.map((m: any) => m.user).filter(Boolean);
    const uniq = new Map<string, any>();
    for (const u of users) uniq.set(u.id, u);
    return [...uniq.values()];
  }, [team.data?.members]);

  const [comment, setComment] = useState('');

  const isWatching = useMemo(
    () => !!task?.watchers?.some((w) => w.id === profile?.id),
    [task?.watchers, profile?.id]
  );

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text || !taskId) return;
    addComment.mutate(
      { taskId, content: text },
      { onSuccess: () => setComment('') }
    );
  };

  if (!taskId) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground">Missing task id.</p>
          <Button variant="link" asChild className="px-0">
            <Link to="/tasks">Back to tasks</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Task unavailable</CardTitle>
          <CardDescription>
            {(error as Error)?.message ??
              'It may have been deleted or you lack access (RLS).'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tasks
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
            <Link to="/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tasks
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">
              #{task.task_number}
            </span>
            <Badge variant="secondary" className="capitalize">
              {task.priority}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select
              value={task.status}
              onValueChange={(v) =>
                updateStatus.mutate({ taskId, status: v as TaskStatus })
              }
              disabled={updateStatus.isPending}
            >
              <SelectTrigger className="w-[200px] capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          {isWatching ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unwatchTask.mutate(taskId)}
              disabled={unwatchTask.isPending}
            >
              <BellOff className="mr-2 h-4 w-4" />
              Unwatch
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => watchTask.mutate(taskId)}
              disabled={watchTask.isPending}
            >
              <Bell className="mr-2 h-4 w-4" />
              Watch
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {task.description?.trim() ? (
                  task.description
                ) : (
                  <span className="text-muted-foreground">
                    No description provided.
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Discuss progress with your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {(task.comments ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No comments yet — start the thread below.
                  </p>
                ) : (
                  [...(task.comments ?? [])]
                    .sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                    )
                    .map((c) => (
                      <div key={c.id} className="flex gap-3 rounded-lg border p-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={c.user?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(c.user?.full_name ?? '?').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-medium">
                              {c.user?.full_name ?? 'User'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(c.created_at), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
              <Separator />
              <form onSubmit={handleComment} className="flex gap-2">
                <Textarea
                  placeholder="Write a comment…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <Button type="submit" disabled={addComment.isPending}>
                  {addComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Assignee</p>
                <Select
                  value={task.assignee_id ?? '__none__'}
                  onValueChange={(v) => {
                    // Team based assignment only
                    if (!task.team_id) return;
                    const nextAssignee = v === '__none__' ? null : v;
                    const nextStatus =
                      nextAssignee && ['draft', 'pending'].includes(task.status)
                        ? ('assigned' as TaskStatus)
                        : !nextAssignee && task.status === 'assigned'
                          ? ('pending' as TaskStatus)
                          : undefined;
                    updateTask.mutate({
                      taskId,
                      input: {
                        assignee_id: nextAssignee,
                        ...(nextStatus ? { status: nextStatus } : {}),
                      },
                    });
                  }}
                  disabled={updateTask.isPending}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={
                        !task.team_id
                          ? 'Set team to assign'
                          : team.isLoading
                            ? 'Loading team members…'
                            : 'Unassigned'
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
              </div>
              <div>
                <p className="text-muted-foreground">Reporter</p>
                <p className="font-medium">
                  {task.reporter?.full_name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Team</p>
                <p className="font-medium">{task.team?.name ?? '—'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attachments</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAttachment.isPending}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  uploadAttachment.mutate(file);
                }}
              />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!(task.attachments ?? []).length ? (
                <p className="text-muted-foreground">No files uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {(task.attachments ?? []).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((a.file_size ?? 0) / 1024)} KB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label="Download"
                          onClick={() => storageService.downloadAttachment(a)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          aria-label="Delete"
                          onClick={() => deleteAttachment.mutate(a)}
                          disabled={deleteAttachment.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Due" value={task.due_date} />
              <Row label="Start" value={task.start_date} />
              <Row label="Completed" value={task.completed_at} />
              <Row label="Updated" value={task.updated_at} />
            </CardContent>
          </Card>

          {(task.checklists?.length ?? 0) > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(task.checklists ?? []).map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <Checkbox
                      id={item.id}
                      checked={item.is_completed}
                      onCheckedChange={(checked) =>
                        toggleChecklistMut.mutate({
                          checklistId: item.id,
                          isCompleted: checked === true,
                          taskId,
                        })
                      }
                    />
                    <label htmlFor={item.id} className="text-sm leading-tight">
                      {item.title}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">
        {value ? format(new Date(value), 'MMM d, yyyy') : '—'}
      </span>
    </div>
  );
}
