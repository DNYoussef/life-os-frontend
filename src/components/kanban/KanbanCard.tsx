import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, KanbanStatus } from '../../types';
import './Kanban.scss';

interface KanbanCardProps {
  task: Task;
  columnId: KanbanStatus;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function KanbanCard({ task, columnId, onEdit, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatNextRun = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const cardClass = 'kanban-card' + (isDragging ? ' dragging' : '');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClass}
      {...attributes}
      {...listeners}
    >
      <div className="card-header">
        <h4 className="card-title">{task.name}</h4>
        {task.priority && (
          <span 
            className="priority-badge"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          >
            {task.priority}
          </span>
        )}
      </div>
      
      <div className="card-body">
        <div className="card-skill">
          <span className="label">Skill:</span>
          <span className="value">{task.skill_name}</span>
        </div>
        
        {task.cron_expression && (
          <div className="card-schedule">
            <span className="label">Schedule:</span>
            <code className="value">{task.cron_expression}</code>
          </div>
        )}
        
        <div className="card-next-run">
          <span className="label">Next run:</span>
          <span className="value">{formatNextRun(task.next_run_at)}</span>
        </div>
      </div>
      
      <div className="card-actions">
        {onEdit && (
          <button 
            className="action-btn edit"
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            title="Edit task"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button 
            className="action-btn delete"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            title="Delete task"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
