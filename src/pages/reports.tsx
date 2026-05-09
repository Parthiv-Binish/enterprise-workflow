import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDashboardStats,
  useTeamProductivity,
  useUserWorkload,
} from '@/hooks/use-analytics';

export default function ReportsPage() {
  const dashboard = useDashboardStats();
  const teams = useTeamProductivity();
  const workload = useUserWorkload();

  const statusData =
    dashboard.data?.tasks_by_status &&
    Object.entries(dashboard.data.tasks_by_status).map(([name, value]) => ({
      name: name.replace('_', ' '),
      tasks: value,
    }));

  const priorityData =
    dashboard.data?.tasks_by_priority &&
    Object.entries(dashboard.data.tasks_by_priority).map(([name, value]) => ({
      name,
      tasks: value,
    }));

  const teamBars =
    teams.data?.map((t) => ({
      name: t.team_name.slice(0, 14),
      completion: Math.round(t.completion_rate),
      total: t.total_tasks,
    })) ?? [];

  const workloadBars =
    workload.data?.slice(0, 8).map((w) => ({
      name: w.user_name.slice(0, 12),
      assigned: w.assigned_tasks,
      overdue: w.overdue_tasks,
    })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Aggregates from open tasks and profiles — powered by `analyticsService`.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Tasks by status"
          description="Non-archived tasks across statuses."
          loading={dashboard.isLoading}
          error={dashboard.error}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Tasks by priority"
          description="Distribution of priority levels."
          loading={dashboard.isLoading}
          error={dashboard.error}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="tasks" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Team completion rate"
          description="Active teams — % of tasks completed or closed."
          loading={teams.isLoading}
          error={teams.error}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={teamBars}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completion" name="% complete" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="User workload snapshot"
          description="Top employees / managers by assigned tasks."
          loading={workload.isLoading}
          error={workload.error}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={workloadBars}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="assigned" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="overdue" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  loading,
  error,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  error: Error | null;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
