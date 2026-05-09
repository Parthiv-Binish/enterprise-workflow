import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/use-notifications';

export default function NotificationsPage() {
  const { data, isLoading, error } = useNotifications(80);
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            In-app alerts tied to tasks and mentions.
          </p>
        </div>
        {unread > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            Mark all read ({unread})
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Newest first. Connect realtime in `useRealtime` for live inserts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{(error as Error).message}</p>
          ) : !data?.length ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Bell className="h-10 w-10 opacity-50" />
              <p>You&apos;re all caught up.</p>
            </div>
          ) : (
            <ul className="divide-y rounded-md border">
              {data.map((n) => (
                <li
                  key={n.id}
                  className={`flex flex-wrap items-start gap-4 px-4 py-4 ${
                    !n.is_read ? 'bg-muted/40' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!n.is_read ? (
                        <Badge variant="default" className="text-[10px]">
                          New
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {n.type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="font-medium">{n.title}</p>
                    {n.message ? (
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    ) : null}
                    {n.task_id ? (
                      <Button variant="link" className="h-auto px-0 pt-1" asChild>
                        <Link to={`/tasks/${n.task_id}`}>Open related task</Link>
                      </Button>
                    ) : null}
                  </div>
                  {!n.is_read ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markOne.mutate(n.id)}
                      disabled={markOne.isPending}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
