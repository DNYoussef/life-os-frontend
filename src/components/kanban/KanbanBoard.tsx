import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  
  
  
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useKanbanStore } from '../../stores';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import type { Task, KanbanStatus } from '../../types';
import { KANBAN_COLUMNS } from '../../types';
import './Kanban.scss';

interface KanbanBoardProps {
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (columnId: KanbanStatus) => void;
}

export function KanbanBoard({ onEditTask, onDeleteTask, onAddTask }: KanbanBoardProps) {
  const { columns, isLoading, error, fetchTasks, moveTask, updateTaskStatus, setActiveTask } = useKanbanStore();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    if (task) {
      setDraggedTask(task);
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination columns
    const activeColumn = findColumnByTaskId(activeId);
    const overColumn = over.data.current?.type === 'column' 
      ? overId as KanbanStatus
      : findColumnByTaskId(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Move task to new column
    moveTask(activeId, activeColumn, overColumn);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnByTaskId(activeId);
    const overColumn = over.data.current?.type === 'column'
      ? overId as KanbanStatus
      : findColumnByTaskId(overId);

    if (activeColumn && overColumn && activeColumn !== overColumn) {
      // Persist the status change to backend
      updateTaskStatus(activeId, overColumn);
    }
  };

  const findTaskById = (taskId: string): Task | undefined => {
    for (const columnId of Object.keys(columns) as KanbanStatus[]) {
      const task = columns[columnId].find(t => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  };

  const findColumnByTaskId = (taskId: string): KanbanStatus | undefined => {
    for (const columnId of Object.keys(columns) as KanbanStatus[]) {
      if (columns[columnId].some(t => t.id === taskId)) {
        return columnId;
      }
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="kanban-loading">
        <div className="loading-spinner" />
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kanban-error">
        <p>Error: {error}</p>
        <button onClick={() => fetchTasks()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {KANBAN_COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={columns[column.id] || []}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onAddTask={onAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {draggedTask ? (
            <KanbanCard
              task={draggedTask}
              columnId={findColumnByTaskId(draggedTask.id) || 'todo'}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
