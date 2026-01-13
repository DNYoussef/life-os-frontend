// Personal Productivity Types for Life OS Dashboard
// Notes, Ideas, Calendar

// ============ NOTES ============

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  project_id: number | null;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateNoteRequest {
  title: string;
  content?: string;
  tags?: string[];
  project_id?: number;
  is_pinned?: boolean;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
  project_id?: number;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface NoteListResponse {
  notes: Note[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============ IDEAS ============

export type IdeaStatus = 'draft' | 'exploring' | 'validated' | 'parked' | 'archived';
export type IdeaPriority = 'low' | 'medium' | 'high' | 'critical';

export const IDEA_STATUS_COLUMNS: { id: IdeaStatus; title: string; color: string }[] = [
  { id: 'draft', title: 'Draft', color: '#6b7280' },
  { id: 'exploring', title: 'Exploring', color: '#3b82f6' },
  { id: 'validated', title: 'Validated', color: '#10b981' },
  { id: 'parked', title: 'Parked', color: '#f59e0b' },
  { id: 'archived', title: 'Archived', color: '#9ca3af' },
];

export const IDEA_PRIORITY_OPTIONS: { id: IdeaPriority; label: string; color: string }[] = [
  { id: 'critical', label: 'Critical', color: '#ef4444' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'medium', label: 'Medium', color: '#eab308' },
  { id: 'low', label: 'Low', color: '#22c55e' },
];

export interface Idea {
  id: number;
  title: string;
  description: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  tags: string[];
  linked_projects: number[];
  potential_value: string | null;
  effort_estimate: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateIdeaRequest {
  title: string;
  description?: string;
  status?: IdeaStatus;
  priority?: IdeaPriority;
  tags?: string[];
  linked_projects?: number[];
  potential_value?: string;
  effort_estimate?: string;
}

export interface UpdateIdeaRequest {
  title?: string;
  description?: string;
  status?: IdeaStatus;
  priority?: IdeaPriority;
  tags?: string[];
  linked_projects?: number[];
  potential_value?: string;
  effort_estimate?: string;
}

export interface IdeaListResponse {
  ideas: Idea[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  status_counts: Record<IdeaStatus, number>;
}

// ============ CALENDAR ============

export type CalendarSyncStatus = 'local' | 'synced' | 'pending_sync';

export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  google_event_id: string | null;
  google_calendar_id: string | null;
  sync_status: CalendarSyncStatus;
  project_id: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  reminder_minutes: number | null;
  color: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  duration_minutes: number;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  project_id?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  color?: string;
}

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  location?: string;
  project_id?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  color?: string;
}

export interface CalendarEventListResponse {
  events: CalendarEvent[];
  total: number;
  start_date: string;
  end_date: string;
}

// Calendar View Types
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarDateRange {
  start: Date;
  end: Date;
}
