import { useState, useEffect } from 'react';
import { Plus, Play, Pencil, Trash2, Clock, RefreshCw, X, Search, LayoutGrid, List } from 'lucide-react';
import type { Task, TaskStatus, CreateTaskRequest } from '../types';
import { getTasks, createTask, deleteTask, runTask } from '../services/api';
import { KanbanBoard } from '../components/kanban';
import { AppStateBanner } from '../components/ui/AppStateBanner';

// Status Badge Component
function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    pending: 'bg-warning/20 text-warning border-warning/30',
    running: 'bg-info/20 text-info border-info/30',
    completed: 'bg-success/20 text-success border-success/30',
    failed: 'bg-error/20 text-error border-error/30',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Create Task Modal
function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskRequest) => void;
}) {
  const [name, setName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [cronExpression, setCronExpression] = useState('0 * * * *');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, skill_name: skillName, cron_expression: cronExpression });
    setName('');
    setSkillName('');
    setCronExpression('0 * * * *');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 rounded-lg p-1"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Task Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 transition-colors"
              placeholder="Morning Brief"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Skill Name</label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 transition-colors"
              placeholder="cascade-orchestrator"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Cron Expression</label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-accent-500 transition-colors"
              placeholder="0 6 * * *"
              required
            />
            <p className="text-xs text-text-muted mt-1">Format: minute hour day month weekday</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-surface-primary"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main TasksPage Component
export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTasks();
      setTasks(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      // Use mock data for demo
      setTasks([
        { id: '1', name: 'Morning Brief', skill_name: 'cascade-orchestrator', cron_expression: '0 6 * * *', status: 'pending', next_run_at: new Date().toISOString(), last_run_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', name: 'DB Backup', skill_name: 'backup-runner', cron_expression: '0 0 * * *', status: 'completed', next_run_at: new Date().toISOString(), last_run_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', name: 'Health Sync', skill_name: 'health-tracker', cron_expression: '*/30 * * * *', status: 'failed', next_run_at: new Date().toISOString(), last_run_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (data: CreateTaskRequest) => {
    try {
      const newTask = await createTask(data);
      setTasks([newTask, ...tasks]);
    } catch (err) {
      // Add mock task for demo
      const mockTask: Task = {
        id: String(Date.now()),
        name: data.name,
        skill_name: data.skill_name,
        cron_expression: data.cron_expression,
        status: 'pending',
        next_run_at: new Date().toISOString(),
        last_run_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTasks([mockTask, ...tasks]);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleRunTask = async (id: string) => {
    try {
      const updated = await runTask(id);
      setTasks(tasks.map(t => t.id === id ? updated : t));
    } catch {
      setTasks(tasks.map(t => t.id === id ? { ...t, status: 'running' as TaskStatus } : t));
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.skill_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-text-secondary text-sm">Manage scheduled tasks and automations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-primary border border-border-default rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={viewMode === 'kanban' ? 'p-2 rounded-md bg-accent-600 text-white' : 'p-2 rounded-md text-text-secondary hover:text-text-primary transition-colors'}
              title="Kanban View"
              aria-label="Switch to Kanban view"
              aria-pressed={viewMode === 'kanban'}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'p-2 rounded-md bg-accent-600 text-white' : 'p-2 rounded-md text-text-secondary hover:text-text-primary transition-colors'}
              title="List View"
              aria-label="Switch to List view"
              aria-pressed={viewMode === 'list'}
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-surface-base"
          >
            <Plus size={18} />
            Create Task
          </button>
        </div>
      </div>

      {/* Search and Filters - Only show for list view */}
      {viewMode === 'list' && (
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent-500 transition-colors"
          />
        </div>
        <button
          onClick={fetchTasks}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
          aria-label="Refresh tasks"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <AppStateBanner
            variant="demo"
            title="Running in Demo Mode"
            message="Could not connect to backend. Displaying sample tasks."
            action={{
              label: "Retry Connection",
              onClick: fetchTasks
            }}
          />
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          onEditTask={(task) => console.log('Edit task:', task)}
          onDeleteTask={handleDeleteTask}
          onAddTask={(columnId) => {
            console.log('Add task to column:', columnId);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* List View - Tasks Table */}
      {viewMode === 'list' && (
        <>
          <div className="bg-surface-primary border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-elevated">
            <tr className="text-left text-sm text-text-secondary border-b border-border-subtle">
              <th className="px-4 py-3 font-medium">Task Name</th>
              <th className="px-4 py-3 font-medium">Skill</th>
              <th className="px-4 py-3 font-medium">Schedule</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next Run</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-accent-500" size={24} />
                  Loading tasks...
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  No tasks found. Create your first task to get started.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{task.name}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-sm">{task.skill_name}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-text-secondary font-mono text-sm">
                      <Clock size={14} />
                      {task.cron_expression}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm">{formatDate(task.next_run_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleRunTask(task.id)}
                        className="p-2 rounded-lg hover:bg-surface-overlay text-text-secondary hover:text-success transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
                        title="Run Now"
                        aria-label={`Run ${task.name} now`}
                      >
                        <Play size={16} />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-surface-overlay text-text-secondary hover:text-accent-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
                        title="Edit"
                        aria-label={`Edit ${task.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 rounded-lg hover:bg-surface-overlay text-text-secondary hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
                        title="Delete"
                        aria-label={`Delete ${task.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          </div>

          {/* Stats Footer */}
          <div className="flex gap-6 mt-6 text-sm text-text-muted">
            <span>Total: {filteredTasks.length} tasks</span>
            <span>Running: {filteredTasks.filter(t => t.status === 'running').length}</span>
            <span>Pending: {filteredTasks.filter(t => t.status === 'pending').length}</span>
            <span>Failed: {filteredTasks.filter(t => t.status === 'failed').length}</span>
          </div>
        </>
      )}

      {/* Create Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
