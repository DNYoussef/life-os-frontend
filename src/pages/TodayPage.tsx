/**
 * TodayPage - Daily task checklist with checkbox completion
 *
 * Features:
 * - Pulls unblocked tasks from Beads via API
 * - Checkbox system for task completion
 * - Completion sync to local Memory MCP
 * - End-of-day summary generation
 * - Mobile-optimized touch targets
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  RefreshCw,
  ChevronLeft,
  Calendar,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  Sun,
  Moon,
  CheckSquare,
  Square,
  Tag,
  Filter,
  X,
} from 'lucide-react';
import { AppStateBanner } from '../components/ui/AppStateBanner';

// ============ TYPES ============

interface BeadTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  issue_type: string;
  assignee?: string;
  created_at?: string;
  updated_at?: string;
  labels: string[];
  estimated_minutes?: number;
}

interface CompletedTask {
  taskId: string;
  completedAt: string;
  notes?: string;
}

interface DailySummary {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completedIds: string[];
  incompleteIds: string[];
  syncedToLocal: boolean;
}

// ============ CONSTANTS ============

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';
const STORAGE_KEY = 'life-os-today-completed';
const SUMMARY_KEY = 'life-os-daily-summaries';

// ============ HELPER FUNCTIONS ============

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getStoredCompletions(): Record<string, CompletedTask> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setStoredCompletions(completions: Record<string, CompletedTask>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completions));
}

function getStoredSummaries(): DailySummary[] {
  try {
    const stored = localStorage.getItem(SUMMARY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredSummaries(summaries: DailySummary[]): void {
  localStorage.setItem(SUMMARY_KEY, JSON.stringify(summaries));
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ============ PRIORITY BADGE ============

function PriorityBadge({ priority }: { priority: number }) {
  if (priority >= 3) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
        P1
      </span>
    );
  } else if (priority === 2) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
        P2
      </span>
    );
  } else {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        P3
      </span>
    );
  }
}

// ============ TASK ITEM ============

interface TaskItemProps {
  task: BeadTask;
  isCompleted: boolean;
  onToggle: (taskId: string) => void;
  onViewDetails: (taskId: string) => void;
}

function TaskItem({ task, isCompleted, onToggle, onViewDetails }: TaskItemProps) {
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-surface-elevated border-border-default hover:border-border-subtle'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 mt-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all ${
          isCompleted
            ? 'text-green-500 hover:bg-green-500/10'
            : 'text-text-muted hover:text-accent-500 hover:bg-surface-primary'
        }`}
        aria-label={isCompleted ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
      >
        {isCompleted ? (
          <CheckCircle2 size={28} className="fill-green-500/20" />
        ) : (
          <Circle size={28} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3
            className={`font-medium ${
              isCompleted ? 'text-text-muted line-through' : 'text-text-primary'
            }`}
          >
            {task.title}
          </h3>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && (
          <p
            className={`text-sm mb-2 line-clamp-2 ${
              isCompleted ? 'text-text-muted' : 'text-text-secondary'
            }`}
          >
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            {task.issue_type}
          </span>
          {task.labels.slice(0, 2).map((label, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400"
            >
              {label}
            </span>
          ))}
          {task.estimated_minutes && task.estimated_minutes > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock size={12} />
              {Math.round(task.estimated_minutes / 60)}h
            </span>
          )}
        </div>
      </div>

      {/* View Details Button */}
      <button
        onClick={() => onViewDetails(task.id)}
        className="flex-shrink-0 p-2 text-text-muted hover:text-accent-500 hover:bg-surface-primary rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={`View details for ${task.title}`}
      >
        <ChevronLeft size={20} className="rotate-180" />
      </button>
    </div>
  );
}

// ============ PROGRESS BAR ============

interface ProgressBarProps {
  completed: number;
  total: number;
}

function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          {completed} of {total} tasks completed
        </span>
        <span className="font-medium text-accent-500">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-600 to-accent-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============ END OF DAY MODAL ============

interface EndOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DailySummary | null;
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

function EndOfDayModal({ isOpen, onClose, summary, onSync, isSyncing }: EndOfDayModalProps) {
  if (!isOpen || !summary) return null;

  const percentage = summary.totalTasks > 0
    ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-primary border border-border-default rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <Moon size={24} className="text-accent-500" />
              End of Day Summary
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-elevated rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{summary.completedTasks}</div>
                <div className="text-sm text-text-secondary">Completed</div>
              </div>
              <div className="bg-surface-elevated rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-500">
                  {summary.totalTasks - summary.completedTasks}
                </div>
                <div className="text-sm text-text-secondary">Remaining</div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-surface-elevated rounded-xl p-4">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-accent-500">{percentage}%</div>
                <div className="text-text-secondary">Daily Completion</div>
              </div>
              <div className="w-full h-4 bg-surface-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Sync Status */}
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              summary.syncedToLocal
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              {summary.syncedToLocal ? (
                <>
                  <CheckCircle2 className="text-green-500" size={24} />
                  <span className="text-green-400">Synced to local system</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="text-amber-500" size={24} />
                  <span className="text-amber-400">Not yet synced to local system</span>
                </>
              )}
            </div>

            {/* Sync Button */}
            {!summary.syncedToLocal && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="w-full bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all min-h-[56px]"
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    <span>Sync to Local System</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN TODAY PAGE ============

export function TodayPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<BeadTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [completions, setCompletions] = useState<Record<string, CompletedTask>>({});
  const [showEndOfDay, setShowEndOfDay] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterPriority, setFilterPriority] = useState<number | null>(null);

  const todayKey = getTodayKey();

  // Load completions from localStorage
  useEffect(() => {
    setCompletions(getStoredCompletions());
  }, []);

  // Fetch tasks from Beads API
  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/v1/beads/ready?limit=50`);

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      // Sort by priority (higher = more urgent)
      const sortedTasks = data.sort((a: BeadTask, b: BeadTask) => b.priority - a.priority);
      setTasks(sortedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      // Use demo data if API fails
      setTasks([
        {
          id: 'demo-1',
          title: 'Review pull requests',
          description: 'Check pending PRs in life-os-frontend',
          status: 'open',
          priority: 3,
          issue_type: 'task',
          labels: ['review', 'frontend'],
          estimated_minutes: 60,
        },
        {
          id: 'demo-2',
          title: 'Update documentation',
          description: 'Add API docs for new endpoints',
          status: 'open',
          priority: 2,
          issue_type: 'task',
          labels: ['docs'],
          estimated_minutes: 45,
        },
        {
          id: 'demo-3',
          title: 'Fix calendar sync bug',
          description: 'Events not showing after midnight',
          status: 'open',
          priority: 3,
          issue_type: 'bug',
          labels: ['calendar', 'bug'],
          estimated_minutes: 90,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  // Toggle task completion
  const handleToggleTask = useCallback((taskId: string) => {
    setCompletions((prev) => {
      const newCompletions = { ...prev };

      if (newCompletions[taskId]) {
        // Uncomplete
        delete newCompletions[taskId];
      } else {
        // Complete
        newCompletions[taskId] = {
          taskId,
          completedAt: new Date().toISOString(),
        };
      }

      setStoredCompletions(newCompletions);
      return newCompletions;
    });
  }, []);

  // View task details
  const handleViewDetails = useCallback((taskId: string) => {
    // Could navigate to task detail page or open modal
    console.log('View details for:', taskId);
    alert(`Task ID: ${taskId}\n\nDetail view coming soon!`);
  }, []);

  // Generate end of day summary
  const generateSummary = useCallback((): DailySummary => {
    const completedIds = Object.keys(completions);
    const allTaskIds = tasks.map((t) => t.id);

    return {
      date: todayKey,
      totalTasks: tasks.length,
      completedTasks: completedIds.length,
      completedIds,
      incompleteIds: allTaskIds.filter((id) => !completedIds.includes(id)),
      syncedToLocal: false,
    };
  }, [completions, tasks, todayKey]);

  // Sync to local Memory MCP
  const handleSyncToLocal = async () => {
    setIsSyncing(true);
    try {
      const summary = generateSummary();

      // Send to backend which will forward to local Memory MCP
      const response = await fetch(`${API_BASE}/api/v1/daily-summary/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(summary),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      // Update stored summaries
      const summaries = getStoredSummaries();
      const updatedSummary = { ...summary, syncedToLocal: true };
      const existingIndex = summaries.findIndex((s) => s.date === todayKey);

      if (existingIndex >= 0) {
        summaries[existingIndex] = updatedSummary;
      } else {
        summaries.push(updatedSummary);
      }

      setStoredSummaries(summaries);
      setShowEndOfDay(false);
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Failed to sync to local system. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter tasks
  const filteredTasks = filterPriority
    ? tasks.filter((t) => t.priority >= filterPriority)
    : tasks;

  // Calculate stats
  const completedCount = Object.keys(completions).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm border-b border-border-default">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-surface-elevated active:bg-surface-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowEndOfDay(true)}
                className="p-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="End of Day Summary"
              >
                <Moon size={20} />
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sun size={28} className="text-amber-400" />
              {getGreeting()}
            </h1>
            <p className="text-text-secondary flex items-center gap-2 mt-1">
              <Calendar size={16} />
              {formatDate(new Date())}
            </p>
          </div>

          {/* Progress Bar */}
          <ProgressBar completed={completedCount} total={totalCount} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-4">
            <AppStateBanner
              variant="demo"
              title="Running in Demo Mode"
              message={error}
              action={{
                label: 'Retry',
                onClick: handleRefresh,
              }}
            />
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterPriority(null)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[40px] ${
              filterPriority === null
                ? 'bg-accent-500 text-white'
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            <Filter size={16} />
            All
          </button>
          <button
            onClick={() => setFilterPriority(3)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[40px] ${
              filterPriority === 3
                ? 'bg-red-500 text-white'
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            P1 Only
          </button>
          <button
            onClick={() => setFilterPriority(2)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[40px] ${
              filterPriority === 2
                ? 'bg-amber-500 text-white'
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            P1-P2
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-elevated rounded-xl p-4 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-surface-primary rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-surface-primary rounded w-3/4 mb-2" />
                    <div className="h-4 bg-surface-primary rounded w-full mb-2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-surface-primary rounded w-16" />
                      <div className="h-5 bg-surface-primary rounded w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare size={48} className="mx-auto text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                {filterPriority ? 'No tasks at this priority' : 'All caught up!'}
              </h3>
              <p className="text-text-secondary">
                {filterPriority
                  ? 'Try a different filter to see more tasks'
                  : 'No tasks are ready for work right now'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCompleted={!!completions[task.id]}
                onToggle={handleToggleTask}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </div>

        {/* Quick Stats */}
        {!loading && tasks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border-default">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-text-primary">{totalCount}</div>
                <div className="text-xs text-text-muted">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{completedCount}</div>
                <div className="text-xs text-text-muted">Done</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">
                  {totalCount - completedCount}
                </div>
                <div className="text-xs text-text-muted">Remaining</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* End of Day Modal */}
      <EndOfDayModal
        isOpen={showEndOfDay}
        onClose={() => setShowEndOfDay(false)}
        summary={generateSummary()}
        onSync={handleSyncToLocal}
        isSyncing={isSyncing}
      />
    </div>
  );
}

export default TodayPage;
