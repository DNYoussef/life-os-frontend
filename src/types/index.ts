// Task Types
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Task {
  id: string;
  name: string;
  skill_name: string;
  cron_expression: string;
  status: TaskStatus;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  name: string;
  skill_name: string;
  cron_expression: string;
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
}
