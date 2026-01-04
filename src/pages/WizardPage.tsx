/**
 * WizardPage - Page wrapper for Project Wizard
 * Handles project listing, creation, and wizard display
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  Wand2,
  FolderPlus,
  RefreshCw,
  X,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { WizardProject, WizardStage, CreateWizardProjectRequest } from '../types/wizard';
import { WIZARD_STAGES } from '../types/wizard';
import { getWizardProjects, createWizardProject, getStageIndex } from '../services/wizardApi';
import { ProjectWizard } from '../components/wizard/ProjectWizard';

// Stage progress indicator
function StageProgress({ currentStage }: { currentStage: WizardStage }) {
  const currentIndex = getStageIndex(currentStage);
  const totalStages = WIZARD_STAGES.length;
  const percentage = Math.round(((currentIndex + 1) / totalStages) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-8">{percentage}%</span>
    </div>
  );
}

// Project card for listing
function WizardProjectCard({
  project,
  onClick,
}: {
  project: WizardProject;
  onClick: () => void;
}) {
  const currentStageInfo = WIZARD_STAGES.find(s => s.id === project.current_stage);
  const isComplete = project.current_stage === 'execute';

  return (
    <div
      onClick={onClick}
      className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-cyan-500/50 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${isComplete ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/20 text-cyan-400'}
            `}
          >
            {isComplete ? <CheckCircle2 size={20} /> : <Wand2 size={20} />}
          </div>
          <div>
            <h3 className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>
        <ChevronRight className="text-slate-600 group-hover:text-cyan-400 transition-colors" size={20} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Stage: <span className="text-slate-200">{currentStageInfo?.name}</span>
          </span>
          <span className="text-slate-500 flex items-center gap-1">
            <Clock size={12} />
            {new Date(project.updated_at).toLocaleDateString()}
          </span>
        </div>
        <StageProgress currentStage={project.current_stage} />
      </div>
    </div>
  );
}

// Create project modal
function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWizardProjectRequest) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <FolderPlus className="text-cyan-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-200">New Project Wizard</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Start a new project with the 7-stage wizard. You'll define vision, roadmap, design, and more.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              placeholder="My SaaS Product"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
              placeholder="A tool to help teams manage their tasks more effectively"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Creating...
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Start Wizard
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main WizardPage component
export function WizardPage() {
  const [projects, setProjects] = useState<WizardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWizardProjects();
      setProjects(response.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      // Demo data fallback
      setProjects([
        {
          id: 'demo-1',
          name: 'Demo SaaS Project',
          description: 'A demonstration project showing the wizard workflow',
          current_stage: 'roadmap',
          stage_outputs: {},
          capability_mapping: {},
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

  // Create project handler
  const handleCreateProject = async (data: CreateWizardProjectRequest) => {
    try {
      setIsCreating(true);
      const newProject = await createWizardProject(data);
      setProjects([newProject, ...projects]);
      setShowCreateModal(false);
      setActiveProjectId(newProject.id);
    } catch (err) {
      // Demo fallback
      const demoProject: WizardProject = {
        id: `demo-${Date.now()}`,
        name: data.name,
        description: data.description,
        current_stage: 'vision',
        stage_outputs: {},
        capability_mapping: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects([demoProject, ...projects]);
      setShowCreateModal(false);
      setActiveProjectId(demoProject.id);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter projects by search
  const filteredProjects = projects.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If a project is active, show the wizard
  if (activeProjectId) {
    return (
      <div className="h-screen overflow-hidden bg-slate-950">
        <ProjectWizard
          projectId={activeProjectId}
          onClose={() => setActiveProjectId(null)}
          onComplete={() => {
            setActiveProjectId(null);
            fetchProjects();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Wand2 className="text-cyan-400" size={28} />
            Project Wizard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create projects with the 7-stage Design OS workflow
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Wand2 className="text-cyan-400" size={16} />
          </div>
          <div>
            <h3 className="font-medium text-slate-200 mb-1">7-Stage Workflow</h3>
            <p className="text-sm text-slate-400">
              Each project goes through: <span className="text-cyan-400">Vision</span> {'->'}{' '}
              <span className="text-cyan-400">Roadmap</span> {'->'}{' '}
              <span className="text-cyan-400">Design</span> {'->'}{' '}
              <span className="text-cyan-400">Sections</span> {'->'}{' '}
              <span className="text-cyan-400">Loop 1</span> {'->'}{' '}
              <span className="text-cyan-400">Match</span> {'->'}{' '}
              <span className="text-cyan-400">Execute</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search wizard projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button
          onClick={fetchProjects}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
          <span className="text-yellow-400 text-sm">{error} (showing demo data)</span>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-slate-500" size={24} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Wand2 className="mx-auto text-slate-700 mb-4" size={48} />
          <p className="text-slate-500 mb-4">
            {searchQuery ? 'No projects match your search.' : 'No wizard projects yet.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
            >
              <Plus size={18} />
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <WizardProjectCard
              key={project.id}
              project={project}
              onClick={() => setActiveProjectId(project.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        isSubmitting={isCreating}
      />
    </div>
  );
}

export default WizardPage;
