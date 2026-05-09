// src/pages/dashboard.tsx

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/hooks/use-tasks';
import { useTeams } from '@/hooks/use-teams';
import { useAuthStore } from '@/store/auth.store';
import { TaskCard } from '@/components/tasks/task-card';
import type { DashboardStats } from '@/types/database';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const { data: tasksData, isLoading: tasksLoading } = useTasks(
    { is_archived: false },
    { limit: 100 }
  );

  // Teams data unused in this view but kept for future enhancements
  useTeams();

  const stats = useMemo<DashboardStats | null>(() => {
    if (!tasksData?.data) return null;

    const tasks = tasksData.data;
    const now = new Date();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) =>
      ['completed', 'closed'].includes(t.status)
    ).length;
    const overdueTasks = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < now &&
        !['completed', 'closed', 'archived'].includes(t.status)
    ).length;
    const pendingApprovals = tasks.filter(
      (t) => t.status === 'waiting_review'
    ).length;

    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const tasksByPriority = tasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      overdue_tasks: overdueTasks,
      pending_approvals: pendingApprovals,
      tasks_by_status: tasksByStatus,
      tasks_by_priority: tasksByPriority,
      completion_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      sla_compliance: 95, // Placeholder
    };
  }, [tasksData]);

  const recentTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    return tasksData.data
      .filter((t) => !['completed', 'closed', 'archived'].includes(t.status))
      .slice(0, 5);
  }, [tasksData]);

  const myTasks = useMemo(() => {
    if (!tasksData?.data || !profile?.id) return [];
    return tasksData.data
      .filter(
        (t) =>
          t.assignee_id === profile.id &&
          !['completed', 'closed', 'archived'].includes(t.status)
      )
      .slice(0, 5);
  }, [tasksData, profile]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
  }: {
    title: string;
    value: number | string;
    icon: any;
    trend?: string;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {trend}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (tasksLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={stats?.total_tasks || 0}
          icon={BarChart3}
          color="bg-blue-500"
        />
        <StatCard
          title="Completed"
          value={stats?.completed_tasks || 0}
          icon={CheckCircle2}
          trend={`${(stats?.completion_rate ?? 0).toFixed(0)}% completion rate`}
          color="bg-green-500"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue_tasks || 0}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Review"
          value={stats?.pending_approvals || 0}
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      {/* Progress Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
            <CardDescription>Overall task completion progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">
                {(stats?.completion_rate ?? 0).toFixed(0)}%
              </span>
            </div>
            <Progress value={stats?.completion_rate ?? 0} className="h-2" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-lg font-semibold">
                  {stats?.tasks_by_status?.in_progress || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Blocked</p>
                <p className="text-lg font-semibold text-red-500">
                  {stats?.tasks_by_status?.blocked || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common actions you can take</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/tasks/new')}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Create New Task
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/teams')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Teams
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* My Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks?assignee=me')}>
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTasks.length > 0 ? (
              myTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No tasks assigned to you
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Latest task updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent tasks
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
