import { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, RefreshCw, X, Clock, MapPin, Calendar as CalIcon } from 'lucide-react';
import type { CalendarEvent, CreateCalendarEventRequest, UpdateCalendarEventRequest, CalendarView } from '../types/productivity';
import { getCalendarEvents, getTodayEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/productivityApi';
import { AppStateBanner } from '../components/ui/AppStateBanner';

// Helper functions
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// Event Card Component
function EventCard({
  event,
  compact = false,
  onClick,
}: {
  event: CalendarEvent;
  compact?: boolean;
  onClick: () => void;
}) {
  const startTime = new Date(event.start_time);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left px-1 py-0.5 rounded text-xs truncate hover:opacity-80"
        style={{ backgroundColor: event.color, color: '#fff' }}
      >
        {event.all_day ? event.title : `${formatTime(startTime)} ${event.title}`}
      </button>
    );
  }

  const endTime = new Date(event.end_time);
  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg border border-border-default hover:border-accent-500 cursor-pointer transition-colors bg-surface-primary"
      style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
    >
      <h4 className="font-medium text-text-primary mb-1">{event.title}</h4>
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Clock size={12} />
        <span>
          {event.all_day ? 'All day' : `${formatTime(startTime)} - ${formatTime(endTime)}`}
        </span>
      </div>
      {event.location && (
        <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
          <MapPin size={12} />
          <span className="truncate">{event.location}</span>
        </div>
      )}
    </div>
  );
}

// Calendar Day Cell
function DayCell({
  date,
  events,
  isCurrentMonth,
  isToday,
  onDayClick,
  onEventClick,
}: {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onDayClick: () => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  return (
    <div
      onClick={onDayClick}
      className={`min-h-[100px] p-1 border-b border-r border-border-subtle cursor-pointer hover:bg-surface-elevated transition-colors ${!isCurrentMonth ? 'bg-surface-base/50' : ''}`}
    >
      <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-accent-600 text-white' : isCurrentMonth ? 'text-text-primary' : 'text-text-muted'}`}>
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {events.slice(0, 3).map(event => (
          <EventCard
            key={event.id}
            event={event}
            compact
            onClick={() => { onEventClick(event); }}
          />
        ))}
        {events.length > 3 && (
          <p className="text-xs text-text-muted px-1">+{events.length - 3} more</p>
        )}
      </div>
    </div>
  );
}

// Create/Edit Event Modal
function EventModal({
  isOpen,
  event,
  selectedDate,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
}: {
  isOpen: boolean;
  event: CalendarEvent | null;
  selectedDate: Date | null;
  onClose: () => void;
  onSubmit: (data: CreateCalendarEventRequest | UpdateCalendarEventRequest) => void;
  onDelete: () => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    if (event) {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      setTitle(event.title);
      setDescription(event.description);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
      setAllDay(event.all_day);
      setLocation(event.location || '');
      setColor(event.color);
    } else if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setStartDate(dateStr);
      setStartTime('09:00');
      setEndDate(dateStr);
      setEndTime('10:00');
      setAllDay(false);
      setLocation('');
      setColor('#3b82f6');
    }
  }, [event, selectedDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`;
    const endDateTime = allDay ? `${endDate}T23:59:59` : `${endDate}T${endTime}:00`;

    onSubmit({
      title,
      description,
      start_time: new Date(startDateTime).toISOString(),
      end_time: new Date(endDateTime).toISOString(),
      all_day: allDay,
      location: location || undefined,
      color,
    });
  };

  if (!isOpen) return null;

  const colorOptions = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <CalIcon size={20} />
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-text-secondary hover:text-text-primary p-1 rounded-lg disabled:opacity-50">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
              placeholder="Event title"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              disabled={isSubmitting}
              className="rounded border-border-default"
            />
            <label htmlFor="allDay" className="text-sm text-text-secondary">All day event</label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
              placeholder="Add location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 resize-none disabled:opacity-50"
              placeholder="Add description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Color</label>
            <div className="flex gap-2">
              {colorOptions.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            {event && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-error hover:bg-error/10 disabled:opacity-50"
              >
                Delete Event
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? (<><RefreshCw className="animate-spin" size={16} />Saving...</>) : (event ? 'Save' : 'Create')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main CalendarPage Component
export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<CalendarView>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString();
      const response = await getCalendarEvents({ start_date: startDate, end_date: endDate });
      setEvents(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      // Demo data
      const today = new Date();
      setEvents([
        { id: 1, title: 'Team Standup', description: 'Daily standup meeting', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(), all_day: false, location: 'Zoom', google_event_id: null, google_calendar_id: null, sync_status: 'local', project_id: null, is_recurring: true, recurrence_rule: null, reminder_minutes: 15, color: '#3b82f6', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1', duration_minutes: 30 },
        { id: 2, title: 'Project Review', description: '', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 0).toISOString(), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0).toISOString(), all_day: false, location: null, google_event_id: null, google_calendar_id: null, sync_status: 'local', project_id: null, is_recurring: false, recurrence_rule: null, reminder_minutes: 15, color: '#10b981', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1', duration_minutes: 60 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [year, month]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const getEventsForDate = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.start_time), date));

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCreateEvent = async (data: CreateCalendarEventRequest) => {
    setIsSubmitting(true);
    try {
      const newEvent = await createCalendarEvent(data);
      setEvents([...events, newEvent]);
      setShowModal(false);
      setSelectedDate(null);
    } catch {
      const mockEvent: CalendarEvent = {
        id: Date.now(),
        title: data.title,
        description: data.description || '',
        start_time: data.start_time,
        end_time: data.end_time,
        all_day: data.all_day || false,
        location: data.location || null,
        google_event_id: null,
        google_calendar_id: null,
        sync_status: 'local',
        project_id: null,
        is_recurring: false,
        recurrence_rule: null,
        reminder_minutes: 15,
        color: data.color || '#3b82f6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '1',
        duration_minutes: 60,
      };
      setEvents([...events, mockEvent]);
      setShowModal(false);
      setSelectedDate(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async (data: UpdateCalendarEventRequest) => {
    if (!editingEvent) return;
    setIsSubmitting(true);
    try {
      const updated = await updateCalendarEvent(editingEvent.id, data);
      setEvents(events.map(e => e.id === editingEvent.id ? updated : e));
      setShowModal(false);
      setEditingEvent(null);
    } catch {
      const updated: CalendarEvent = { ...editingEvent, ...data, updated_at: new Date().toISOString() };
      setEvents(events.map(e => e.id === editingEvent.id ? updated : e));
      setShowModal(false);
      setEditingEvent(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent || !confirm('Delete this event?')) return;
    try {
      await deleteCalendarEvent(editingEvent.id);
    } catch {}
    setEvents(events.filter(e => e.id !== editingEvent.id));
    setShowModal(false);
    setEditingEvent(null);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{monthNames[month]} {year}</h1>
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-surface-elevated text-text-secondary">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleToday} className="px-3 py-1 rounded-lg hover:bg-surface-elevated text-text-secondary text-sm">
              Today
            </button>
            <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-surface-elevated text-text-secondary">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchEvents} className="p-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => { setEditingEvent(null); setSelectedDate(new Date()); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium"
          >
            <Plus size={18} />
            New Event
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <AppStateBanner variant="demo" title="Demo Mode" message="Could not connect to backend. Displaying sample events." action={{ label: "Retry", onClick: fetchEvents }} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-accent-500" size={32} />
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <div className="bg-surface-primary border border-border-default rounded-lg overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border-default">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-text-secondary bg-surface-elevated">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, isCurrentMonth }, i) => (
              <DayCell
                key={i}
                date={date}
                events={getEventsForDate(date)}
                isCurrentMonth={isCurrentMonth}
                isToday={isSameDay(date, today)}
                onDayClick={() => { setSelectedDate(date); setEditingEvent(null); setShowModal(true); }}
                onEventClick={(event) => { setEditingEvent(event); setSelectedDate(null); setShowModal(true); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <EventModal
        isOpen={showModal}
        event={editingEvent}
        selectedDate={selectedDate}
        onClose={() => { setShowModal(false); setEditingEvent(null); setSelectedDate(null); }}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        onDelete={handleDeleteEvent}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
