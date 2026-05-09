// src/pages/tasks/index.tsx

import { useState, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Table2, Kanban, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks, useDeleteTask } from '@/hooks/use-tasks';
import { useUIStore } from '@/store/ui.store';
import { TaskTable } from '@/components/tasks/task-table';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskFiltersPanel } from '@/components/tasks/task-filters-panel';
import type { TaskFilters, TaskStatus, TaskPriority } from '@/types/database';
import { useDebounce } from '@/hooks/use-debounce';

export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { taskView, setTaskView } = useUIStore();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);

  const [filters, setFilters] = useState<TaskFilters>({
    status: searchParams.getAll('status') as TaskStatus[],
    priority: searchParams.getAll('priority') as TaskPriority[],
    is_archived: false,
  });

  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useTasks(
    { ...filters, search: debouncedSearch },
    { page, limit: 50 }
  );

  const deleteTask = useDeleteTask();

  const handleFilterChange = (newFilters: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(taskId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all your tasks
          </p>
        </div>
        <Button onClick={() => navigate('/tasks/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <TaskFiltersPanel filters={filters} onChange={handleFilterChange} />
        <div className="flex gap-2 ml-auto">
          <Tabs
            value={taskView}
            onValueChange={(v) =>
              setTaskView(v as 'table' | 'kanban' | 'calendar')
            }
          >
            <TabsList>
              <TabsTrigger value="table">
                <Table2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="kanban">
                <Kanban className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load tasks</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          {taskView === 'table' && (
            <TaskTable tasks={data?.data || []} onDelete={handleDelete} />
          )}
          {taskView === 'kanban' && <KanbanBoard tasks={data?.data || []} />}
          {taskView === 'calendar' && (
            <div className="text-center py-12 text-muted-foreground">
              Calendar view coming soon
            </div>
          )}

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {data.data.length} of {data.total} tasks
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
