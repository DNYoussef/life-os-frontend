import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, KanbanStatus } from '../../types';
import { KanbanCard } from './KanbanCard';
import './Kanban.scss';

interface KanbanColumnProps {
  id: KanbanStatus;
  title: string;
  color: string;
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (columnId: KanbanStatus) => void;
}

export function KanbanColumn({ 
  id, 
  title, 
  color, 
  tasks, 
  onEditTask, 
  onDeleteTask,
  onAddTask 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      columnId: id,
    },
  });

  const taskIds = tasks.map(task => task.id);
  const columnClass = 'kanban-column' + (isOver ? ' drag-over' : '');

  return (
    <div 
      ref={setNodeRef}
      className={columnClass}
    >
      <div className="column-header" style={{ borderTopColor: color }}>
        <div className="header-content">
          <span className="column-dot" style={{ backgroundColor: color }} />
          <h3 className="column-title">{title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
        {onAddTask && (
          <button 
            className="add-task-btn"
            onClick={() => onAddTask(id)}
            title={'Add task to ' + title}
          >
            +
          </button>
        )}
      </div>
      
      <div className="column-content">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              columnId={id}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="empty-column">
            <p>No tasks</p>
            {onAddTask && (
              <button 
                className="add-first-task"
                onClick={() => onAddTask(id)}
              >
                Add a task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
