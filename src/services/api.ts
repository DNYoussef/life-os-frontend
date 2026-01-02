import type { Task, Agent, Project, CreateTaskRequest, CreateProjectRequest, PaginatedResponse, AgentActivity } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';

// Generic fetch wrapper
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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

export async function getAgents(page = 1, pageSize = 20, type?: string, status?: string): Promise<PaginatedResponse<Agent>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  return fetchApi(`/api/v1/agents?${params}`);
}

export async function getAgent(id: string): Promise<Agent> {
  return fetchApi(`/api/v1/agents/${id}`);
}

export async function getAgentActivity(limit = 20): Promise<AgentActivity[]> {
  return fetchApi(`/api/v1/agents/activity?limit=${limit}`);
}

// ============ PROJECTS API ============

export async function getProjects(page = 1, pageSize = 20): Promise<PaginatedResponse<Project>> {
  return fetchApi(`/api/v1/projects?page=${page}&page_size=${pageSize}`);
}

export async function getProject(id: string): Promise<Project> {
  return fetchApi(`/api/v1/projects/${id}`);
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  return fetchApi('/api/v1/projects', {
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
