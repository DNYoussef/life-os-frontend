import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Clock, MapPin,
  Activity, Bot, Brain, Workflow, ExternalLink,
  Calendar as CalIcon, CheckSquare, RefreshCw
} from 'lucide-react';
import { KanbanBoard } from '../kanban';
import type { CalendarEvent } from '../../types/productivity';
import type { Task } from '../../types';
import { getCalendarEvents } from '../../services/productivityApi';
import { getTasks } from '../../services/api';

// Helper functions for calendar
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// Compact Event Card
function CompactEventCard({ event }: { event: CalendarEvent }) {
  const startTime = new Date(event.start_time);
  return (
    <div
      className="px-2 py-1.5 rounded text-xs truncate mb-1 cursor-pointer hover:opacity-90 transition-opacity"
      style={{ backgroundColor: event.color, color: '#fff' }}
    >
      {event.all_day ? event.title : `${formatTime(startTime)} ${event.title}`}
    </div>
  );
}

// Mini Calendar Day Cell
function MiniDayCell({
  date,
  events,
  isCurrentMonth,
  isToday,
}: {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
}) {
  return (
    <div className={`min-h-[80px] p-1 border-b border-r border-border-subtle ${!isCurrentMonth ? 'bg-surface-base/50' : 'bg-surface-primary'}`}>
      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-accent-600 text-white' : isCurrentMonth ? 'text-text-primary' : 'text-text-muted'}`}>
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {events.slice(0, 2).map(event => (
          <CompactEventCard key={event.id} event={event} />
        ))}
        {events.length > 2 && (
          <p className="text-[10px] text-text-muted px-1">+{events.length - 2} more</p>
        )}
      </div>
    </div>
  );
}

// Quick Stats Component
function QuickStats({
  taskCount,
  eventCount,
  agentCount,
  loading
}: {
  taskCount: number;
  eventCount: number;
  agentCount: number;
  loading: boolean;
}) {
  const stats = [
    { icon: CheckSquare, label: 'Tasks', value: taskCount, color: 'text-accent-400' },
    { icon: CalIcon, label: 'Events', value: eventCount, color: 'text-success' },
    { icon: Bot, label: 'Agents', value: agentCount, color: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className="bg-surface-primary border border-border-default rounded-lg p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-surface-elevated ${stat.color}`}>
            <stat.icon size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">
              {loading ? '-' : stat.value}
            </p>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Navigation Quick Links
function QuickLinks() {
  const links = [
    { to: '/memory', icon: Brain, label: 'Memory', color: 'bg-purple-600' },
    { to: '/pipelines', icon: Workflow, label: 'Pipelines', color: 'bg-cyan-600' },
    { to: '/wizard', icon: Activity, label: 'Wizard', color: 'bg-amber-600' },
  ];

  return (
    <div className="flex gap-2">
      {links.map(link => (
        <Link
          key={link.to}
          to={link.to}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${link.color} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
        >
          <link.icon size={16} />
          {link.label}
        </Link>
      ))}
    </div>
  );
}

// Main Unified Dashboard Component
export function UnifiedDashboard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsRes, tasksRes] = await Promise.allSettled([
          getCalendarEvents({
            start_date: new Date(year, month, 1).toISOString(),
            end_date: new Date(year, month + 1, 0).toISOString()
          }),
          getTasks()
        ]);

        if (eventsRes.status === 'fulfilled') {
          setEvents(eventsRes.value.events);
        } else {
          // Demo events
          const today = new Date();
          setEvents([
            { id: 1, title: 'Team Standup', description: '', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(), all_day: false, location: 'Zoom', google_event_id: null, google_calendar_id: null, sync_status: 'local', project_id: null, is_recurring: true, recurrence_rule: null, reminder_minutes: 15, color: '#3b82f6', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1', duration_minutes: 30 },
            { id: 2, title: 'Project Review', description: '', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 0).toISOString(), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0).toISOString(), all_day: false, location: null, google_event_id: null, google_calendar_id: null, sync_status: 'local', project_id: null, is_recurring: false, recurrence_rule: null, reminder_minutes: 15, color: '#10b981', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1', duration_minutes: 60 },
          ]);
        }

        if (tasksRes.status === 'fulfilled') {
          setTasks(tasksRes.value.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month]);

  // Calendar days calculation
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

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

  const today = new Date();

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-text-secondary text-sm">Your unified command center</p>
        </div>
        <QuickLinks />
      </div>

      {/* Quick Stats */}
      <div className="mb-6">
        <QuickStats
          taskCount={tasks.length}
          eventCount={events.length}
          agentCount={86}
          loading={loading}
        />
      </div>

      {/* Main Content: Kanban + Calendar Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Kanban Board */}
        <div className="bg-surface-primary border border-border-default rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-border-default">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckSquare size={20} className="text-accent-400" />
              Task Board
            </h2>
            <Link to="/tasks" className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
              Full View <ExternalLink size={12} />
            </Link>
          </div>
          <div className="p-4 overflow-x-auto" style={{ maxHeight: '500px' }}>
            <KanbanBoard />
          </div>
        </div>

        {/* Right: Mini Calendar */}
        <div className="bg-surface-primary border border-border-default rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-border-default">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalIcon size={20} className="text-success" />
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-1">
                <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-surface-elevated text-text-secondary">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={handleToday} className="px-2 py-0.5 rounded hover:bg-surface-elevated text-text-secondary text-xs">
                  Today
                </button>
                <button onClick={handleNextMonth} className="p-1 rounded hover:bg-surface-elevated text-text-secondary">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <Link to="/calendar" className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
              Full View <ExternalLink size={12} />
            </Link>
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-accent-500" size={24} />
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-border-default">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-text-secondary bg-surface-elevated">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {calendarDays.map(({ date, isCurrentMonth }, i) => (
                  <MiniDayCell
                    key={i}
                    date={date}
                    events={getEventsForDate(date)}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isSameDay(date, today)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Events Summary */}
      <div className="mt-6 bg-surface-primary border border-border-default rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock size={16} className="text-text-muted" />
          Today's Schedule
        </h3>
        <div className="flex flex-wrap gap-3">
          {events.filter(e => isSameDay(new Date(e.start_time), today)).length === 0 ? (
            <p className="text-text-muted text-sm">No events scheduled for today</p>
          ) : (
            events.filter(e => isSameDay(new Date(e.start_time), today)).map(event => (
              <div
                key={event.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-surface-elevated"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                <span className="text-sm font-medium">{event.title}</span>
                <span className="text-xs text-text-muted">
                  {event.all_day ? 'All day' : formatTime(new Date(event.start_time))}
                </span>
                {event.location && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <MapPin size={10} /> {event.location}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
