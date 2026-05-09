import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Link } from 'react-router-dom';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/use-notifications';

type Props = { children: ReactNode };

export function NotificationsPopover({ children }: Props) {
  const list = useNotifications(12);
  const unread = useUnreadNotificationCount();
  const unreadCount = unread.data ?? 0;
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {list.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : list.error ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {(list.error as Error).message}
            </p>
          ) : (list.data ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            (list.data ?? []).map((n) => (
              <div
                key={n.id}
                className="flex gap-3 px-4 py-3 text-sm hover:bg-muted/60"
              >
                <button
                  type="button"
                  className={
                    !n.is_read ? 'font-medium text-foreground w-full text-left' : 'text-muted-foreground w-full text-left'
                  }
                  onClick={() => !n.is_read && markOne.mutate(n.id)}
                >
                  {n.title}
                  {n.message ? (
                    <span className="mt-1 block text-xs opacity-90">
                      {n.message}
                    </span>
                  ) : null}
                  {n.task_id ? (
                    <span className="mt-1 block text-xs underline underline-offset-2">
                      Open task
                    </span>
                  ) : null}
                </button>
                {!n.is_read ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => markOne.mutate(n.id)}
                    disabled={markOne.isPending}
                    aria-label="Mark read"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Button variant="link" className="h-auto px-0" asChild>
            <Link to="/notifications">View all</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
