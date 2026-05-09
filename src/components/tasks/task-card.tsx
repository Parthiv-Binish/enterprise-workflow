// src/components/tasks/task-card.tsx

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Calendar,
  MessageSquare,
  Paperclip,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TaskWithRelations } from '@/types/database';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithRelations;
  isDragging?: boolean;
}

const priorityColors = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  emergency: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

const statusColors = {
  draft: 'bg-gray-500',
  pending: 'bg-yellow-500',
  assigned: 'bg-blue-500',
  in_progress: 'bg-indigo-500',
  blocked: 'bg-red-500',
  waiting_review: 'bg-orange-500',
  completed: 'bg-green-500',
  rejected: 'bg-red-600',
  closed: 'bg-gray-600',
  archived: 'bg-gray-400',
};

export const TaskCard = memo(function TaskCard({
  task,
  isDragging = false,
}: TaskCardProps) {
  const navigate = useNavigate();

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    !['completed', 'closed', 'archived'].includes(task.status);

  const completedChecklists =
    task.checklists?.filter((c) => c.is_completed).length || 0;
  const totalChecklists = task.checklists?.length || 0;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-shadow hover:shadow-md',
          isDragging && 'shadow-lg ring-2 ring-primary'
        )}
        onClick={() => navigate(`/tasks/${task.id}`)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn('h-2 w-2 rounded-full', statusColors[task.status])}
              />
              <span className="text-xs text-muted-foreground">
                #{task.task_number}
              </span>
            </div>
            <Badge
              variant="secondary"
              className={cn('text-xs', priorityColors[task.priority])}
            >
              {task.priority}
            </Badge>
          </div>
          <h3 className="font-semibold leading-tight line-clamp-2">
            {task.title}
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.slice(0, 3).map((label) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: label.color,
                    color: label.color,
                  }}
                >
                  {label.name}
                </Badge>
              ))}
              {task.labels.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{task.labels.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Progress */}
          {task.progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-1.5" />
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {task.due_date && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        isOverdue && 'text-red-500'
                      )}
                    >
                      {isOverdue ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      <span>
                        {formatDistanceToNow(new Date(task.due_date), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </TooltipContent>
                </Tooltip>
              )}

              {task.comments && task.comments.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.comments.length}</span>
                </div>
              )}

              {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span>{task.attachments.length}</span>
                </div>
              )}

              {totalChecklists > 0 && (
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  <span>
                    {completedChecklists}/{totalChecklists}
                  </span>
                </div>
              )}
            </div>

            {task.assignee && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={task.assignee.avatar_url || undefined}
                      alt={task.assignee.full_name}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(task.assignee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{task.assignee.full_name}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
