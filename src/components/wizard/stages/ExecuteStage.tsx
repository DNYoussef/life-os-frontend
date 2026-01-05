/**
 * ExecuteStage - Stage 7 of the Project Wizard
 * Kanban board for task execution and progress tracking
 */

import { useState, useEffect } from 'react';
import {
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Circle,
  MoreVertical,
  ChevronRight,
  Zap,
  Bot,
  Terminal,
  GripVertical,
  RefreshCw,
  Trophy,
  Target,
} from 'lucide-react';
import type { WizardTask, WizardTaskStatus, StageOutput } from '../../../types/wizard';
import { getWizardTasks, updateWizardTask } from '../../../services/wizardApi';

interface ExecuteStageProps {
  projectId: string;
  lastOutput?: StageOutput;
  isProcessing: boolean;
  onSubmit: (data: Record<string, unknown>) => Promise<StageOutput | undefined>;
  onComplete?: () => void;
}

interface KanbanColumn {
  id: WizardTaskStatus;
  title: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', color: 'text-muted-foreground', bgColor: 'bg-muted-foreground/20', icon: Circle },
  { id: 'in_progress', title: 'In Progress', color: 'text-info', bgColor: 'bg-info/20', icon: Clock },
  { id: 'in_review', title: 'In Review', color: 'text-warning', bgColor: 'bg-yellow-500/20', icon: Target },
  { id: 'done', title: 'Done', color: 'text-success', bgColor: 'bg-success/20', icon: CheckCircle2 },
];

const CAPABILITY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  skill: Zap,
  agent: Bot,
  command: Terminal,
};

// Task Card Component
function TaskCard({
  task,
  onStatusChange,
  onSelect,
  disabled,
}: {
  task: WizardTask;
  onStatusChange: (status: WizardTaskStatus) => void;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const CapIcon = task.assigned_capability
    ? CAPABILITY_ICONS[task.assigned_capability.split(':')[0]] || Zap
    : null;

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div
      className="bg-muted border border-border rounded-lg p-3 cursor-pointer hover:border-muted-foreground transition-colors group"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripVertical size={14} className="opacity-0 group-hover:opacity-100 cursor-grab" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            disabled={disabled}
            className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-50"
          >
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 z-10 bg-muted border border-border rounded-lg shadow-lg py-1 min-w-32">
              {KANBAN_COLUMNS.map((col) => (
                <button
                  key={col.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(col.id);
                    setShowMenu(false);
                  }}
                  disabled={task.status === col.id}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50 ${col.color}`}
                >
                  Move to {col.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {task.progress > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-muted-foreground">{task.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        {task.assigned_capability && CapIcon && (
          <div className="flex items-center gap-1.5">
            <CapIcon size={12} className="text-primary" />
            <span className="text-xs text-muted-foreground truncate max-w-24">
              {task.assigned_capability.split(':')[1] || task.assigned_capability}
            </span>
            {task.capability_confidence && (
              <span className={`text-xs ${getConfidenceColor(task.capability_confidence)}`}>
                {Math.round(task.capability_confidence * 100)}%
              </span>
            )}
          </div>
        )}
        {task.quality_score !== undefined && task.quality_score > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Trophy size={12} className="text-warning" />
            <span className="text-muted-foreground">{Math.round(task.quality_score * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Kanban Column Component
function Column({
  column,
  tasks,
  onStatusChange,
  onSelectTask,
  disabled,
}: {
  column: KanbanColumn;
  tasks: WizardTask[];
  onStatusChange: (taskId: string, status: WizardTaskStatus) => void;
  onSelectTask: (task: WizardTask) => void;
  disabled?: boolean;
}) {
  const Icon = column.icon;

  return (
    <div className="flex-1 min-w-64 max-w-80">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg ${column.bgColor}`}>
        <Icon size={16} className={column.color} />
        <span className={`font-medium text-sm ${column.color}`}>{column.title}</span>
        <span className="text-xs text-muted-foreground ml-auto">{tasks.length}</span>
      </div>
      <div className="bg-card/50 border border-border border-t-0 rounded-b-lg p-2 min-h-64 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={(status) => onStatusChange(task.id, status)}
              onSelect={() => onSelectTask(task)}
              disabled={disabled}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Task Detail Modal
function TaskDetailModal({
  task,
  onClose,
  onUpdate,
  disabled,
}: {
  task: WizardTask;
  onClose: () => void;
  onUpdate: (updates: Partial<WizardTask>) => void;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState(task.progress);
  const [reviewNotes, setReviewNotes] = useState(task.review_notes || '');

  const handleSave = () => {
    onUpdate({ progress, review_notes: reviewNotes });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-foreground">{task.title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <ChevronRight size={20} />
          </button>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
        )}

        <div className="space-y-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Status
            </label>
            <div className="flex gap-2">
              {KANBAN_COLUMNS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => onUpdate({ status: col.id })}
                  disabled={disabled || task.status === col.id}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    task.status === col.id
                      ? `${col.bgColor} ${col.color} border-current`
                      : 'bg-muted border-border text-muted-foreground hover:border-muted-foreground'
                  } disabled:opacity-50`}
                >
                  {col.title}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* Assigned Capability */}
          {task.assigned_capability && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Assigned Capability
              </label>
              <div className="flex items-center gap-2 bg-muted rounded px-3 py-2">
                <Zap size={14} className="text-primary" />
                <span className="text-sm text-foreground">{task.assigned_capability}</span>
                {task.capability_confidence && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {Math.round(task.capability_confidence * 100)}% confidence
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Review Notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Review Notes
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about this task..."
              disabled={disabled}
              rows={3}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring resize-none disabled:opacity-50"
            />
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="block text-muted-foreground">Created</span>
              {new Date(task.created_at).toLocaleDateString()}
            </div>
            {task.started_at && (
              <div>
                <span className="block text-muted-foreground">Started</span>
                {new Date(task.started_at).toLocaleDateString()}
              </div>
            )}
            {task.completed_at && (
              <div>
                <span className="block text-muted-foreground">Completed</span>
                {new Date(task.completed_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={disabled}
            className="px-4 py-2 rounded bg-primary hover:bg-primary text-white disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Progress Summary
function ProgressSummary({ tasks }: { tasks: WizardTask[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const inReview = tasks.filter((t) => t.status === 'in_review').length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  const avgQuality = tasks
    .filter((t) => t.quality_score !== undefined && t.quality_score > 0)
    .reduce((sum, t) => sum + (t.quality_score || 0), 0) / (tasks.filter((t) => t.quality_score).length || 1);

  return (
    <div className="bg-card/50 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">Project Progress</span>
        <span className="text-2xl font-bold text-primary">{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <p className="text-muted-foreground">Todo</p>
          <p className="text-foreground font-medium">{total - done - inProgress - inReview}</p>
        </div>
        <div>
          <p className="text-info">In Progress</p>
          <p className="text-foreground font-medium">{inProgress}</p>
        </div>
        <div>
          <p className="text-warning">Review</p>
          <p className="text-foreground font-medium">{inReview}</p>
        </div>
        <div>
          <p className="text-success">Done</p>
          <p className="text-foreground font-medium">{done}</p>
        </div>
      </div>
      {avgQuality > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Avg Quality Score</span>
          <span className="text-sm text-warning">{Math.round(avgQuality * 100)}%</span>
        </div>
      )}
    </div>
  );
}

export function ExecuteStage({
  projectId,
  lastOutput,
  isProcessing,
  onSubmit,
  onComplete,
}: ExecuteStageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<WizardTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<WizardTask | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWizardTasks(projectId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      // Demo data
      setTasks([
        {
          id: '1',
          project_id: projectId,
          title: 'Set up authentication',
          description: 'Implement user login and registration',
          status: 'done',
          assigned_capability: 'agent:auth-specialist',
          capability_confidence: 0.92,
          dependencies: [],
          progress: 100,
          artifacts: [],
          quality_score: 0.88,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          project_id: projectId,
          title: 'Build dashboard UI',
          description: 'Create main dashboard with widgets',
          status: 'in_progress',
          assigned_capability: 'skill:delivery-sparc-frontend-specialist',
          capability_confidence: 0.88,
          dependencies: ['1'],
          progress: 60,
          artifacts: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          project_id: projectId,
          title: 'API integration',
          description: 'Connect frontend to backend APIs',
          status: 'todo',
          assigned_capability: 'agent:coder',
          capability_confidence: 0.85,
          dependencies: ['2'],
          progress: 0,
          artifacts: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '4',
          project_id: projectId,
          title: 'Write tests',
          description: 'Create unit and integration tests',
          status: 'todo',
          assigned_capability: 'skill:e2e-test',
          capability_confidence: 0.9,
          dependencies: ['3'],
          progress: 0,
          artifacts: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const handleStatusChange = async (taskId: string, status: WizardTaskStatus) => {
    try {
      await updateWizardTask(projectId, taskId, { status });
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
    } catch (err) {
      // Optimistic update for demo
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<WizardTask>) => {
    try {
      await updateWizardTask(projectId, taskId, updates);
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    } catch (err) {
      // Optimistic update for demo
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    }
  };

  const getTasksByStatus = (status: WizardTaskStatus) =>
    tasks.filter((t) => t.status === status);

  const allDone = tasks.length > 0 && tasks.every((t) => t.status === 'done');

  const handleComplete = async () => {
    await onSubmit({
      completed: true,
      tasks_completed: tasks.filter((t) => t.status === 'done').length,
      total_tasks: tasks.length,
    });
    onComplete?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stage Description */}
      <div className="bg-card/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
            <Play className="text-success" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground mb-1">
              Execute Your Project
            </h3>
            <p className="text-sm text-muted-foreground">
              Track and manage task execution. Move tasks through the workflow,
              update progress, and monitor quality scores. Complete all tasks to
              finish the wizard.
            </p>
          </div>
          <button
            onClick={loadTasks}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-muted hover:bg-muted-foreground text-foreground disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-warning flex-shrink-0" size={18} />
          <span className="text-warning text-sm">{error} (showing demo data)</span>
        </div>
      )}

      {/* Progress Summary */}
      <ProgressSummary tasks={tasks} />

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            onStatusChange={handleStatusChange}
            onSelectTask={setSelectedTask}
            disabled={isProcessing}
          />
        ))}
      </div>

      {/* Previous Output Feedback */}
      {lastOutput && !lastOutput.passed && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <h4 className="text-warning font-medium text-sm mb-2">
            Feedback from Iteration {lastOutput.iteration}
          </h4>
          <p className="text-muted-foreground text-sm">{lastOutput.feedback}</p>
        </div>
      )}

      {/* Complete Button */}
      {allDone && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-success" size={24} />
              <div>
                <p className="text-success font-medium">All tasks complete!</p>
                <p className="text-sm text-muted-foreground">
                  Your project is ready. Click complete to finish the wizard.
                </p>
              </div>
            </div>
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Complete Wizard
            </button>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => {
            handleTaskUpdate(selectedTask.id, updates);
            setSelectedTask({ ...selectedTask, ...updates });
          }}
          disabled={isProcessing}
        />
      )}
    </div>
  );
}

export default ExecuteStage;
