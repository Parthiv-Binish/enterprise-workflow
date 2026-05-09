import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotificationsStore } from '@/store/notifications.store';

type Props = { children: ReactNode };

export function NotificationsPopover({ children }: Props) {
  const { notifications, markAsRead, markAllAsRead, unreadCount } =
    useNotificationsStore();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="flex gap-3 px-4 py-3 text-sm hover:bg-muted/60"
              >
                <button
                  type="button"
                  className={
                    !n.is_read ? 'font-medium text-foreground w-full text-left' : 'text-muted-foreground w-full text-left'
                  }
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  {n.title}
                  {n.message ? (
                    <span className="mt-1 block text-xs opacity-90">
                      {n.message}
                    </span>
                  ) : null}
                </button>
                {!n.is_read ? (
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                    <Check className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
