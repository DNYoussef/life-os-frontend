// Kanban Task Status (5-state workflow)
export type KanbanStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';

// Legacy Task Status (for API compatibility)
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

// Status mapping for Kanban columns
export const STATUS_TO_KANBAN: Record<TaskStatus, KanbanStatus> = {
  pending: 'todo',
  running: 'in_progress',
  completed: 'done',
  failed: 'cancelled',
};

export const KANBAN_COLUMNS: { id: KanbanStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: '#6b7280' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'in_review', title: 'In Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
  { id: 'cancelled', title: 'Cancelled', color: '#ef4444' },
];

export interface Task {
  id: string;
  name: string;
  skill_name: string;
  cron_expression: string;
  status: TaskStatus;
  kanban_status?: KanbanStatus;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  project_id?: string;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
}

export interface CreateTaskRequest {
  name: string;
  skill_name: string;
  cron_expression: string;
  project_id?: string;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
}

// Drag and Drop types
export interface DragItem {
  id: string;
  columnId: KanbanStatus;
  index: number;
}

export interface KanbanColumn {
  id: KanbanStatus;
  title: string;
  color: string;
  tasks: Task[];
}

// Agent Types
export type AgentStatus = 'active' | 'inactive' | 'error';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  total_runs: number;
  success_rate: number;
  avg_duration_ms: number;
  last_active_at: string | null;
  created_at: string;
}

export interface AgentActivity {
  id: string;
  agent_id: string;
  agent_name: string;
  action: string;
  status: 'success' | 'error';
  duration_ms: number;
  timestamp: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  task_count: number;
  completed_count: number;
  tasks?: Task[];
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages?: number;
}
