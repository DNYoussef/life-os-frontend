import { useState, useEffect } from 'react';
import { FolderKanban, Plus, ChevronDown, ChevronRight, CheckCircle, Circle, Clock, Search, RefreshCw, X, Trash2, Pencil } from 'lucide-react';
import type { Project, Task, CreateProjectRequest } from '../types';
import { getProjects, createProject, deleteProject } from '../services/api';

// Progress Bar Component
function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage === 100 ? 'bg-green-500' : percentage > 50 ? 'bg-cyan-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-400 w-12 text-right">{percentage}%</span>
    </div>
  );
}

// Task Item in Project
function TaskItem({ task }: { task: Task }) {
  const isCompleted = task.status === 'completed';

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-800/50 ${isCompleted ? 'opacity-60' : ''}`}>
      {isCompleted ? (
        <CheckCircle size={16} className="text-green-400" />
      ) : task.status === 'running' ? (
        <Clock size={16} className="text-blue-400 animate-pulse" />
      ) : (
        <Circle size={16} className="text-slate-500" />
      )}
      <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}`}>
        {task.name}
      </span>
      <span className="text-xs text-slate-500 font-mono">{task.skill_name}</span>
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
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button className="text-slate-400">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            <FolderKanban size={20} className="text-cyan-500" />
            <div>
              <h3 className="font-medium text-slate-200">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 ml-11">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>{project.completed_count} of {project.task_count} tasks completed</span>
            <span className={`font-medium ${percentage === 100 ? 'text-green-400' : ''}`}>
              {percentage}%
            </span>
          </div>
          <ProgressBar completed={project.completed_count} total={project.task_count} />
        </div>
      </div>

      {/* Tasks List (Expanded) */}
      {isExpanded && project.tasks && project.tasks.length > 0 && (
        <div className="border-t border-slate-800 p-4 bg-slate-900/30">
          <div className="space-y-1">
            {project.tasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {isExpanded && (!project.tasks || project.tasks.length === 0) && (
        <div className="border-t border-slate-800 p-4 bg-slate-900/30 text-center text-slate-500 text-sm">
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
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-200">Create New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              placeholder="Life OS Dashboard"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
              placeholder="Build and deploy personal AI infrastructure"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
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
      // Use mock data for demo
      setProjects([
        {
          id: '1',
          name: 'Life OS Dashboard',
          description: 'Build and deploy personal AI infrastructure',
          task_count: 12,
          completed_count: 9,
          tasks: [
            { id: 't1', name: 'Backend API Setup', skill_name: 'fastapi-init', cron_expression: '', status: 'completed', next_run_at: null, last_run_at: null, created_at: '', updated_at: '' },
            { id: 't2', name: 'Frontend React App', skill_name: 'react-setup', cron_expression: '', status: 'completed', next_run_at: null, last_run_at: null, created_at: '', updated_at: '' },
            { id: 't3', name: 'Railway Deployment', skill_name: 'deploy-railway', cron_expression: '', status: 'completed', next_run_at: null, last_run_at: null, created_at: '', updated_at: '' },
            { id: 't4', name: 'UI Components', skill_name: 'ui-design', cron_expression: '', status: 'running', next_run_at: null, last_run_at: null, created_at: '', updated_at: '' },
            { id: 't5', name: 'Mobile PWA', skill_name: 'pwa-setup', cron_expression: '', status: 'pending', next_run_at: null, last_run_at: null, created_at: '', updated_at: '' },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Content Pipeline',
          description: 'Weekly zeitgeist analysis and blog generation',
          task_count: 8,
          completed_count: 5,
          tasks: [
            { id: 't6', name: 'YouTube Transcription', skill_name: 'whisper-transcribe', cron_expression: '0 6 * * 0', status: 'completed', next_run_at: null, last_run_at: null, created_at: '', updated_at: '' },
            { id: 't7', name: 'Multi-Model Analysis', skill_name: 'consensus-engine', cron_expression: '0 7 * * 0', status: 'completed', next_run_at: null, last_run_at: null, created_at: '', updated_at: '' },
            { id: 't8', name: 'Blog Draft Generation', skill_name: 'blog-writer', cron_expression: '0 8 * * 0', status: 'pending', next_run_at: null, last_run_at: null, created_at: '', updated_at: '' },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Trader AI',
          description: 'Automated trading system with sentiment analysis',
          task_count: 6,
          completed_count: 2,
          tasks: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-slate-400 text-sm">Organize tasks into projects and track progress</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Total Projects</div>
          <div className="text-2xl font-bold">{projects.length}</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Total Tasks</div>
          <div className="text-2xl font-bold">{totalTasks}</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-400">{completedTasks}</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Overall Progress</div>
          <div className="text-2xl font-bold">{overallProgress}%</div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button
          onClick={fetchProjects}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
          {error} (showing demo data)
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-slate-500" size={24} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
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
