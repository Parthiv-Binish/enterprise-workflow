import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';
import type { TaskWithRelations } from '@/types/database';

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const { data, isLoading, error } = useTasks(
    { is_archived: false },
    { limit: 500 }
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    for (const t of data?.data ?? []) {
      if (!t.due_date) continue;
      const key = format(new Date(t.due_date), 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [data?.data]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Tasks with a due date ({format(monthStart, 'MMMM yyyy')}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor((d) => subMonths(d, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor((d) => addMonths(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{format(monthStart, 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[420px] w-full" />
          ) : error ? (
            <p className="text-destructive text-sm">
              {(error as Error).message}
            </p>
          ) : (
            <>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayTasks = tasksByDay.get(key) ?? [];
                  const inMonth = isSameMonth(day, cursor);
                  const today = isSameDay(day, new Date());
                  return (
                    <div
                      key={key}
                      className={cn(
                        'min-h-[100px] rounded-md border p-1 text-left text-xs',
                        inMonth ? 'bg-card' : 'bg-muted/40 opacity-70',
                        today && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      )}
                    >
                      <div className="mb-1 flex justify-between px-1">
                        <span
                          className={cn(
                            'font-medium',
                            today && 'text-primary'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {dayTasks.slice(0, 3).map((t) => (
                          <Link
                            key={t.id}
                            to={`/tasks/${t.id}`}
                            className="truncate rounded bg-muted px-1 py-0.5 hover:bg-muted/80"
                          >
                            <span className="font-medium">#{t.task_number}</span>{' '}
                            {t.title}
                          </Link>
                        ))}
                        {dayTasks.length > 3 ? (
                          <Badge variant="secondary" className="text-[10px]">
                            +{dayTasks.length - 3} more
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
