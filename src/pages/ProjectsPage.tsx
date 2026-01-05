import { useState, useEffect } from 'react';
import { FolderKanban, Plus, ChevronDown, ChevronRight, CheckCircle, Circle, Clock, Search, RefreshCw, X, Trash2, Pencil } from 'lucide-react';
import type { Project, Task, CreateProjectRequest } from '../types';
import { getProjects, createProject, deleteProject } from '../services/api';
import { AppStateBanner } from '../components/ui/AppStateBanner';

// Progress Bar Component
function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage === 100 ? 'bg-success' : percentage > 50 ? 'bg-accent-500' : 'bg-warning'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-text-secondary w-12 text-right">{percentage}%</span>
    </div>
  );
}

// Task Item in Project
function TaskItem({ task }: { task: Task }) {
  const isCompleted = task.status === 'completed';

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-elevated ${isCompleted ? 'opacity-60' : ''}`}
      role="listitem"
    >
      {isCompleted ? (
        <CheckCircle size={16} className="text-success" aria-label="Completed" />
      ) : task.status === 'running' ? (
        <Clock size={16} className="text-info animate-pulse" aria-label="Running" />
      ) : (
        <Circle size={16} className="text-text-muted" aria-label="Pending" />
      )}
      <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-text-muted' : 'text-text-secondary'}`}>
        {task.name}
      </span>
      <span className="text-xs text-text-muted font-mono">{task.skill_name}</span>
    </div>
  );
}

// Project Card Component
function ProjectCard({
  project,
  onDelete
}: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = project.task_count > 0
    ? Math.round((project.completed_count / project.task_count) * 100)
    : 0;

  return (
    <div className="bg-surface-primary border border-border-subtle rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-inset"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${project.name} project, ${percentage}% complete`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button className="text-text-secondary" aria-hidden="true">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            <FolderKanban size={20} className="text-accent-500" />
            <div>
              <h3 className="font-medium text-text-primary">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-text-muted mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="p-2 rounded-lg hover:bg-surface-overlay text-text-secondary hover:text-accent-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
              aria-label="Edit project"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              className="p-2 rounded-lg hover:bg-surface-overlay text-text-secondary hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
              aria-label="Delete project"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 ml-11">
          <div className="flex justify-between text-sm text-text-secondary mb-2">
            <span>{project.completed_count} of {project.task_count} tasks completed</span>
            <span className={`font-medium ${percentage === 100 ? 'text-success' : ''}`}>
              {percentage}%
            </span>
          </div>
          <ProgressBar completed={project.completed_count} total={project.task_count} />
        </div>
      </div>

      {/* Tasks List (Expanded) */}
      {isExpanded && project.tasks && project.tasks.length > 0 && (
        <div className="border-t border-border-subtle p-4 bg-surface-base" role="list" aria-label="Project tasks">
          <div className="space-y-1">
            {project.tasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {isExpanded && (!project.tasks || project.tasks.length === 0) && (
        <div className="border-t border-border-subtle p-4 bg-surface-base text-center text-text-muted text-sm">
          No tasks in this project yet
        </div>
      )}
    </div>
  );
}

// Create Project Modal
function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description: description || undefined });
    setName('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">Create New Project</h2>
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
            <label className="block text-sm font-medium text-text-secondary mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 transition-colors"
              placeholder="Life OS Dashboard"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 resize-none transition-colors"
              placeholder="Build and deploy personal AI infrastructure"
              rows={3}
            />
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
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main ProjectsPage Component
export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProjects();
      setProjects(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      setProjects([
        { id: 's1', name: 'S1: Content Pipeline', description: '11-phase YouTube-to-blog with multi-model consensus', task_count: 11, completed_count: 9, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 's2', name: 'S2: Thought Leadership', description: 'Visual art composition & 13-dimension image gen', task_count: 6, completed_count: 5, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 's3', name: 'S3: Life OS Dashboard', description: 'FastAPI + React + Railway infrastructure', task_count: 12, completed_count: 10, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 's4', name: 'S4: Trader AI', description: 'Gary x Taleb dual momentum with gates', task_count: 10, completed_count: 4, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 's5', name: 'S5: Hackathon Automation', description: 'EV optimizer & Agent Maker 8-phase', task_count: 8, completed_count: 7, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 's6', name: 'S6: Fog Compute', description: 'Distributed compute - Rust + Node', task_count: 10, completed_count: 3, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 's7', name: 'S7: Meta-Calculus Toolkit', description: 'VERILINGUA cognitive architecture', task_count: 8, completed_count: 5, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 's8', name: 'S8: NSBU RPG App', description: 'Next.js game with injury tracker', task_count: 10, completed_count: 7, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'i1', name: 'Memory MCP Triple System', description: '24h/7d/30d layers - ChromaDB + NetworkX', task_count: 6, completed_count: 5, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'i2', name: 'Connascence Analyzer', description: '9 coupling types - 98.5% accuracy', task_count: 5, completed_count: 4, tasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (data: CreateProjectRequest) => {
    try {
      const newProject = await createProject(data);
      setProjects([newProject, ...projects]);
    } catch {
      // Add mock project for demo
      const mockProject: Project = {
        id: String(Date.now()),
        name: data.name,
        description: data.description || '',
        task_count: 0,
        completed_count: 0,
        tasks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects([mockProject, ...projects]);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate overall stats
  const totalTasks = projects.reduce((sum, p) => sum + p.task_count, 0);
  const completedTasks = projects.reduce((sum, p) => sum + p.completed_count, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-text-secondary text-sm">8 Streams + Infrastructure - D:/Projects/</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-surface-base"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Total Projects</div>
          <div className="text-2xl font-bold">{projects.length}</div>
        </div>
        <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Total Tasks</div>
          <div className="text-2xl font-bold">{totalTasks}</div>
        </div>
        <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Completed</div>
          <div className="text-2xl font-bold text-success">{completedTasks}</div>
        </div>
        <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Overall Progress</div>
          <div className="text-2xl font-bold">{overallProgress}%</div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent-500 transition-colors"
          />
        </div>
        <button
          onClick={fetchProjects}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
          aria-label="Refresh projects"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <AppStateBanner
            variant="demo"
            title="Running in Demo Mode"
            message="Could not connect to backend. Displaying sample projects."
            action={{
              label: "Retry Connection",
              onClick: fetchProjects
            }}
          />
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-accent-500" size={24} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          No projects found. Create your first project to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
