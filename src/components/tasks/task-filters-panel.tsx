import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { TaskFilters, TaskPriority, TaskStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const STATUSES: TaskStatus[] = [
  'draft',
  'pending',
  'assigned',
  'in_progress',
  'blocked',
  'waiting_review',
  'completed',
  'closed',
  'archived',
];

const PRIORITIES: TaskPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
  'emergency',
];

type Props = {
  filters: TaskFilters;
  onChange: (next: Partial<TaskFilters>) => void;
};

export function TaskFiltersPanel({ filters, onChange }: Props) {
  const statuses = filters.status ?? [];
  const priorities = filters.priority ?? [];

  const toggleStatus = (status: TaskStatus) => {
    const next = statuses.includes(status)
      ? statuses.filter((s) => s !== status)
      : [...statuses, status];
    onChange({ status: next });
  };

  const togglePriority = (priority: TaskPriority) => {
    const next = priorities.includes(priority)
      ? priorities.filter((p) => p !== priority)
      : [...priorities, priority];
    onChange({ priority: next });
  };

  const clear =
    statuses.length === 0 && priorities.length === 0
      ? undefined
      : () => onChange({ status: [], priority: [] });

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-start">
      <FilterGroup title="Status">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Chip
              key={s}
              active={statuses.includes(s)}
              label={label(s)}
              onClick={() => toggleStatus(s)}
            />
          ))}
        </div>
      </FilterGroup>
      <Separator orientation="vertical" className="hidden h-auto min-h-[4rem] sm:block" />
      <FilterGroup title="Priority">
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <Chip
              key={p}
              active={priorities.includes(p)}
              label={label(p)}
              onClick={() => togglePriority(p)}
            />
          ))}
        </div>
      </FilterGroup>
      {clear ? (
        <Button variant="outline" size="sm" type="button" onClick={clear} className="sm:ml-auto">
          <X className="mr-1 h-4 w-4" /> Clear filters
        </Button>
      ) : null}
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  label: text,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground'
      )}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

function label(id: string) {
  return id.replace(/_/g, ' ');
}
