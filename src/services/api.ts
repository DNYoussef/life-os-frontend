import type { Task, Agent, Project, CreateTaskRequest, CreateProjectRequest, PaginatedResponse, AgentActivity } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Generic fetch wrapper with redirect handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    redirect: 'follow',
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============ TASKS API ============

export async function getTasks(page = 1, pageSize = 20): Promise<PaginatedResponse<Task>> {
  return fetchApi(`/api/v1/tasks?page=${page}&page_size=${pageSize}`);
}

export async function getTask(id: string): Promise<Task> {
  return fetchApi(`/api/v1/tasks/${id}`);
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  return fetchApi('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: string, data: Partial<CreateTaskRequest>): Promise<Task> {
  return fetchApi(`/api/v1/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return fetchApi(`/api/v1/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function runTask(id: string): Promise<Task> {
  return fetchApi(`/api/v1/tasks/${id}/run`, {
    method: 'POST',
  });
}

// ============ AGENTS API ============

// Backend Agent response type (from /api/v1/agents/)
interface BackendAgent {
  agent_id: string;
  name: string;
  role: string;
  capabilities: string[];
  rbac: {
    allowed_tools: string[];
    denied_tools: string[];
    path_scopes: string[];
    api_access: string[];
    requires_approval: boolean;
    approval_threshold: number;
  };
  budget: {
    max_tokens_per_session: number;
    max_cost_per_day: number;
    currency: string;
    tokens_used_today: number;
    cost_used_today: number;
    last_reset: string | null;
  };
  metadata: {
    category: string;
    specialist: boolean;
    version: string;
    tags: string[];
  };
  performance: {
    success_rate: number;
    avg_execution_time_ms: number;
    quality_score: number;
    total_tasks_completed: number;
  };
  timestamps: {
    created_at: string | null;
    updated_at: string | null;
    last_active_at: string | null;
  };
}

// Transform backend agent to frontend Agent type
function transformAgent(backendAgent: BackendAgent): Agent {
  return {
    id: backendAgent.agent_id,
    name: backendAgent.name,
    type: backendAgent.metadata.category,
    status: backendAgent.performance.total_tasks_completed > 0 ? 'active' : 'inactive',
    total_runs: backendAgent.performance.total_tasks_completed,
    success_rate: Math.round(backendAgent.performance.success_rate * 100),
    avg_duration_ms: Math.round(backendAgent.performance.avg_execution_time_ms),
    last_active_at: backendAgent.timestamps.last_active_at,
    created_at: backendAgent.timestamps.created_at || new Date().toISOString(),
  };
}

export async function getAgents(page = 1, pageSize = 50, category?: string, status?: string): Promise<PaginatedResponse<Agent>> {
  // Backend uses skip/limit, not page/page_size
  const skip = (page - 1) * pageSize;
  const params = new URLSearchParams({ skip: String(skip), limit: String(pageSize) });
  if (category) params.append('category', category);
  if (status) params.append('status', status);

  // Note: trailing slash is required by FastAPI
  const backendAgents: BackendAgent[] = await fetchApi(`/api/v1/agents/?${params}`);

  // Transform to frontend format
  const agents = backendAgents.map(transformAgent);

  return {
    items: agents,
    total: agents.length,
    page,
    page_size: pageSize,
    total_pages: 1, // Backend doesn't provide pagination metadata yet
  };
}

export async function getAgent(id: string): Promise<Agent> {
  const backendAgent: BackendAgent = await fetchApi(`/api/v1/agents/${id}`);
  return transformAgent(backendAgent);
}

export async function getAgentActivity(limit = 20): Promise<AgentActivity[]> {
  try {
    return await fetchApi(`/api/v1/agent-activity/?limit=${limit}`);
  } catch {
    // Endpoint may not exist, return empty array
    return [];
  }
}

export async function runAgent(agentId: string, prompt: string): Promise<{ success: boolean; execution_id?: string }> {
  try {
    await fetchApi(`/api/v1/agents/${agentId}/activate`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    return { success: true, execution_id: `exec-${Date.now()}` };
  } catch {
    // Return success for demo mode
    return { success: true, execution_id: `demo-${Date.now()}` };
  }
}

// Get agent stats summary
export async function getAgentStats(): Promise<{
  total_agents: number;
  role_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  specialists: number;
  generalists: number;
}> {
  return fetchApi('/api/v1/agents/stats/summary');
}

// ============ PROJECTS API ============

export async function getProjects(page = 1, pageSize = 20): Promise<PaginatedResponse<Project>> {
  return fetchApi(`/api/v1/projects/?page=${page}&page_size=${pageSize}`);
}

export async function getProject(id: string): Promise<Project> {
  return fetchApi(`/api/v1/projects/${id}`);
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  return fetchApi('/api/v1/projects/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: Partial<CreateProjectRequest>): Promise<Project> {
  return fetchApi(`/api/v1/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return fetchApi(`/api/v1/projects/${id}`, {
    method: 'DELETE',
  });
}
