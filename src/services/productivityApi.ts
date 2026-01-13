// Personal Productivity API Services
// Notes, Ideas, Calendar CRUD operations

import type {
  Note,
  NoteListResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  Idea,
  IdeaListResponse,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  IdeaStatus,
  IdeaPriority,
  CalendarEvent,
  CalendarEventListResponse,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '../types/productivity';

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';

// Generic fetch wrapper with auth
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

// ============ NOTES API ============

export async function getNotes(params?: {
  search?: string;
  tag?: string;
  project_id?: number;
  is_pinned?: boolean;
  is_archived?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NoteListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.tag) searchParams.append('tag', params.tag);
  if (params?.project_id) searchParams.append('project_id', String(params.project_id));
  if (params?.is_pinned !== undefined) searchParams.append('is_pinned', String(params.is_pinned));
  if (params?.is_archived !== undefined) searchParams.append('is_archived', String(params.is_archived));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  if (params?.offset) searchParams.append('offset', String(params.offset));

  const query = searchParams.toString();
  return fetchApi(`/api/v1/notes${query ? `?${query}` : ''}`);
}

export async function getNote(id: number): Promise<Note> {
  return fetchApi(`/api/v1/notes/${id}`);
}

export async function createNote(data: CreateNoteRequest): Promise<Note> {
  return fetchApi('/api/v1/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNote(id: number, data: UpdateNoteRequest): Promise<Note> {
  return fetchApi(`/api/v1/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(id: number): Promise<{ message: string; note_id: number }> {
  return fetchApi(`/api/v1/notes/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleNotePin(id: number): Promise<Note> {
  return fetchApi(`/api/v1/notes/${id}/pin`, {
    method: 'POST',
  });
}

export async function toggleNoteArchive(id: number): Promise<Note> {
  return fetchApi(`/api/v1/notes/${id}/archive`, {
    method: 'POST',
  });
}

// ============ IDEAS API ============

export async function getIdeas(params?: {
  search?: string;
  status?: IdeaStatus;
  priority?: IdeaPriority;
  tag?: string;
  exclude_archived?: boolean;
  limit?: number;
  offset?: number;
}): Promise<IdeaListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.priority) searchParams.append('priority', params.priority);
  if (params?.tag) searchParams.append('tag', params.tag);
  if (params?.exclude_archived !== undefined) searchParams.append('exclude_archived', String(params.exclude_archived));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  if (params?.offset) searchParams.append('offset', String(params.offset));

  const query = searchParams.toString();
  return fetchApi(`/api/v1/ideas${query ? `?${query}` : ''}`);
}

export async function getIdea(id: number): Promise<Idea> {
  return fetchApi(`/api/v1/ideas/${id}`);
}

export async function createIdea(data: CreateIdeaRequest): Promise<Idea> {
  return fetchApi('/api/v1/ideas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIdea(id: number, data: UpdateIdeaRequest): Promise<Idea> {
  return fetchApi(`/api/v1/ideas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateIdeaStatus(id: number, status: IdeaStatus): Promise<Idea> {
  return fetchApi(`/api/v1/ideas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteIdea(id: number): Promise<{ message: string; idea_id: number }> {
  return fetchApi(`/api/v1/ideas/${id}`, {
    method: 'DELETE',
  });
}

// ============ CALENDAR API ============

export async function getCalendarEvents(params?: {
  start_date?: string;
  end_date?: string;
  project_id?: number;
}): Promise<CalendarEventListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.append('start_date', params.start_date);
  if (params?.end_date) searchParams.append('end_date', params.end_date);
  if (params?.project_id) searchParams.append('project_id', String(params.project_id));

  const query = searchParams.toString();
  return fetchApi(`/api/v1/calendar${query ? `?${query}` : ''}`);
}

export async function getTodayEvents(): Promise<CalendarEventListResponse> {
  return fetchApi('/api/v1/calendar/today');
}

export async function getWeekEvents(): Promise<CalendarEventListResponse> {
  return fetchApi('/api/v1/calendar/week');
}

export async function getCalendarEvent(id: number): Promise<CalendarEvent> {
  return fetchApi(`/api/v1/calendar/${id}`);
}

export async function createCalendarEvent(data: CreateCalendarEventRequest): Promise<CalendarEvent> {
  return fetchApi('/api/v1/calendar', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCalendarEvent(id: number, data: UpdateCalendarEventRequest): Promise<CalendarEvent> {
  return fetchApi(`/api/v1/calendar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCalendarEvent(id: number): Promise<{ message: string; event_id: number }> {
  return fetchApi(`/api/v1/calendar/${id}`, {
    method: 'DELETE',
  });
}

export async function syncGoogleCalendar(params?: {
  calendar_id?: string;
  days_ahead?: number;
}): Promise<{
  status: string;
  synced_count: number;
  created_count: number;
  updated_count: number;
  message: string;
}> {
  return fetchApi('/api/v1/calendar/sync/google', {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}
