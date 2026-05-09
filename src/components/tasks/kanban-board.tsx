// src/components/tasks/kanban-board.tsx

import { useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import type { TaskWithRelations, TaskStatus } from '@/types/database';
import { useUpdateTaskStatus } from '@/hooks/use-tasks';

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'pending', title: 'Pending' },
  { id: 'assigned', title: 'Assigned' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'blocked', title: 'Blocked' },
  { id: 'waiting_review', title: 'Waiting Review' },
  { id: 'completed', title: 'Completed' },
];

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const updateStatus = useUpdateTaskStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithRelations[]> = {} as any;
    
    columns.forEach((col) => {
      grouped[col.id] = [];
    });
    
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = tasks.find((t) => t.id === active.id);
      setActiveTask(task || null);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const taskId = active.id as string;
      const newStatus = over.id as TaskStatus;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;

      updateStatus.mutate({ taskId, status: newStatus });
    },
    [tasks, updateStatus]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4 min-w-max p-1">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasksByStatus[column.id] || []}
            />
          ))}
        </div>
      </ScrollArea>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
