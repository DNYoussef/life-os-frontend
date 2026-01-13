import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, RefreshCw, X, Lightbulb, ArrowRight, Tag } from 'lucide-react';
import type { Idea, CreateIdeaRequest, UpdateIdeaRequest, IdeaStatus, IdeaPriority } from '../types/productivity';
import { IDEA_STATUS_COLUMNS, IDEA_PRIORITY_OPTIONS } from '../types/productivity';
import { getIdeas, createIdea, updateIdea, updateIdeaStatus, deleteIdea } from '../services/productivityApi';
import { AppStateBanner } from '../components/ui/AppStateBanner';

// Priority Badge Component
function PriorityBadge({ priority }: { priority: IdeaPriority }) {
  const option = IDEA_PRIORITY_OPTIONS.find(p => p.id === priority);
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${option?.color}20`, color: option?.color }}
    >
      {option?.label}
    </span>
  );
}

// Idea Card Component
function IdeaCard({
  idea,
  onEdit,
  onDelete,
  onMoveToStatus,
}: {
  idea: Idea;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToStatus: (status: IdeaStatus) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div className="bg-surface-primary border border-border-default rounded-lg p-3 hover:border-accent-500 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-text-primary text-sm line-clamp-2">{idea.title}</h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 rounded text-text-muted hover:text-text-primary"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-text-muted hover:text-error"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {idea.description && (
        <p className="text-text-secondary text-xs line-clamp-2 mb-2">{idea.description}</p>
      )}
      <div className="flex items-center justify-between">
        <PriorityBadge priority={idea.priority} />
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="text-xs text-text-muted hover:text-accent-400 flex items-center gap-1"
          >
            Move <ArrowRight size={12} />
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 bottom-full mb-1 bg-surface-elevated border border-border-default rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              {IDEA_STATUS_COLUMNS.filter(c => c.id !== idea.status).map(col => (
                <button
                  key={col.id}
                  onClick={() => { onMoveToStatus(col.id); setShowStatusMenu(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
                >
                  {col.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {idea.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-surface-elevated rounded text-[10px] text-text-muted">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  column,
  ideas,
  count,
  onAddIdea,
  onEditIdea,
  onDeleteIdea,
  onMoveIdea,
}: {
  column: typeof IDEA_STATUS_COLUMNS[0];
  ideas: Idea[];
  count: number;
  onAddIdea: () => void;
  onEditIdea: (idea: Idea) => void;
  onDeleteIdea: (id: number) => void;
  onMoveIdea: (id: number, status: IdeaStatus) => void;
}) {
  return (
    <div className="flex-shrink-0 w-72 bg-surface-elevated rounded-lg">
      <div className="p-3 border-b border-border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
            <h3 className="font-medium text-text-primary text-sm">{column.title}</h3>
            <span className="text-xs text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          </div>
          {column.id === 'draft' && (
            <button
              onClick={onAddIdea}
              className="p-1 rounded text-text-muted hover:text-accent-400 hover:bg-surface-overlay"
              title="Add idea"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {ideas.map(idea => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onEdit={() => onEditIdea(idea)}
            onDelete={() => onDeleteIdea(idea.id)}
            onMoveToStatus={(status) => onMoveIdea(idea.id, status)}
          />
        ))}
        {ideas.length === 0 && (
          <p className="text-center text-text-muted text-xs py-4">No ideas</p>
        )}
      </div>
    </div>
  );
}

// Create/Edit Idea Modal
function IdeaModal({
  isOpen,
  idea,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  idea: Idea | null;
  onClose: () => void;
  onSubmit: (data: CreateIdeaRequest | UpdateIdeaRequest) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IdeaPriority>('medium');
  const [tags, setTags] = useState('');
  const [potentialValue, setPotentialValue] = useState('');
  const [effortEstimate, setEffortEstimate] = useState('');

  useEffect(() => {
    if (idea) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(idea.title);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(idea.description);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPriority(idea.priority);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTags(idea.tags.join(', '));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPotentialValue(idea.potential_value || '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEffortEstimate(idea.effort_estimate || '');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPriority('medium');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTags('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPotentialValue('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEffortEstimate('');
    }
  }, [idea, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
    onSubmit({
      title,
      description,
      priority,
      tags: tagList,
      potential_value: potentialValue || undefined,
      effort_estimate: effortEstimate || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Lightbulb size={20} />
            {idea ? 'Edit Idea' : 'New Idea'}
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
              placeholder="What's the idea?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 resize-none disabled:opacity-50"
              placeholder="Describe the idea..."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IdeaPriority)}
                disabled={isSubmitting}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
              >
                {IDEA_PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Effort</label>
              <input
                type="text"
                value={effortEstimate}
                onChange={(e) => setEffortEstimate(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
                placeholder="e.g., 2 days, 1 week"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Potential Value</label>
            <input
              type="text"
              value={potentialValue}
              onChange={(e) => setPotentialValue(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
              placeholder="What value could this bring?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <Tag size={14} className="inline mr-1" />
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
              placeholder="product, tech, marketing"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium disabled:opacity-50 flex items-center gap-2">
              {isSubmitting ? (<><RefreshCw className="animate-spin" size={16} />Saving...</>) : (idea ? 'Save Changes' : 'Create Idea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main IdeasPage Component
export function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<IdeaStatus, number>>({} as Record<IdeaStatus, number>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getIdeas({ exclude_archived: true });
      setIdeas(response.ideas);
      setStatusCounts(response.status_counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ideas');
      // Demo data
      const demoIdeas: Idea[] = [
        { id: 1, title: 'Build CLI Dashboard', description: 'Create a terminal-based dashboard', status: 'exploring', priority: 'high', tags: ['tech'], linked_projects: [], potential_value: 'High productivity gains', effort_estimate: '1 week', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1' },
        { id: 2, title: 'Automate Reporting', description: 'Weekly reports generated automatically', status: 'draft', priority: 'medium', tags: ['automation'], linked_projects: [], potential_value: 'Save 2hrs/week', effort_estimate: '3 days', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1' },
        { id: 3, title: 'Mobile App', description: 'iOS companion app', status: 'parked', priority: 'low', tags: ['mobile'], linked_projects: [], potential_value: null, effort_estimate: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1' },
      ];
      setIdeas(demoIdeas);
      setStatusCounts({ draft: 1, exploring: 1, validated: 0, parked: 1, archived: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleCreateIdea = async (data: CreateIdeaRequest) => {
    setIsSubmitting(true);
    try {
      const newIdea = await createIdea(data);
      setIdeas([newIdea, ...ideas]);
      setShowModal(false);
    } catch {
      const mockIdea: Idea = {
        id: Date.now(),
        title: data.title,
        description: data.description || '',
        status: 'draft',
        priority: data.priority || 'medium',
        tags: data.tags || [],
        linked_projects: [],
        potential_value: data.potential_value || null,
        effort_estimate: data.effort_estimate || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '1',
      };
      setIdeas([mockIdea, ...ideas]);
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIdea = async (data: UpdateIdeaRequest) => {
    if (!editingIdea) return;
    setIsSubmitting(true);
    try {
      const updated = await updateIdea(editingIdea.id, data);
      setIdeas(ideas.map(i => i.id === editingIdea.id ? updated : i));
      setShowModal(false);
      setEditingIdea(null);
    } catch {
      const updated: Idea = { ...editingIdea, ...data, updated_at: new Date().toISOString() };
      setIdeas(ideas.map(i => i.id === editingIdea.id ? updated : i));
      setShowModal(false);
      setEditingIdea(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveIdea = async (id: number, status: IdeaStatus) => {
    try {
      const updated = await updateIdeaStatus(id, status);
      setIdeas(ideas.map(i => i.id === id ? updated : i));
    } catch {
      setIdeas(ideas.map(i => i.id === id ? { ...i, status } : i));
    }
  };

  const handleDeleteIdea = async (id: number) => {
    if (!confirm('Delete this idea?')) return;
    try {
      await deleteIdea(id);
    } catch {
      // Ignore delete errors in demo mode.
    }
    setIdeas(ideas.filter(i => i.id !== id));
  };

  const handleSubmitIdea = (data: CreateIdeaRequest | UpdateIdeaRequest) => {
    if (editingIdea) {
      return handleUpdateIdea(data as UpdateIdeaRequest);
    }
    return handleCreateIdea(data as CreateIdeaRequest);
  };

  const filteredIdeas = ideas.filter(idea =>
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="text-accent-400" />
            Ideas
          </h1>
          <p className="text-text-secondary text-sm">Track and validate your ideas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2 text-text-primary text-sm w-64 focus:outline-none focus:border-accent-500"
            />
          </div>
          <button onClick={fetchIdeas} className="p-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => { setEditingIdea(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium"
          >
            <Plus size={18} />
            New Idea
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <AppStateBanner variant="demo" title="Demo Mode" message="Could not connect to backend. Displaying sample ideas." action={{ label: "Retry", onClick: fetchIdeas }} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-accent-500" size={32} />
        </div>
      )}

      {/* Kanban Board */}
      {!loading && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {IDEA_STATUS_COLUMNS.filter(c => c.id !== 'archived').map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              ideas={filteredIdeas.filter(i => i.status === column.id)}
              count={statusCounts[column.id] || 0}
              onAddIdea={() => { setEditingIdea(null); setShowModal(true); }}
              onEditIdea={(idea) => { setEditingIdea(idea); setShowModal(true); }}
              onDeleteIdea={handleDeleteIdea}
              onMoveIdea={handleMoveIdea}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <IdeaModal
        isOpen={showModal}
        idea={editingIdea}
        onClose={() => { setShowModal(false); setEditingIdea(null); }}
        onSubmit={handleSubmitIdea}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
