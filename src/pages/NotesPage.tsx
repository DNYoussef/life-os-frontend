import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Pin, Archive, Search, RefreshCw, X, Tag } from 'lucide-react';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types/productivity';
import { getNotes, createNote, updateNote, deleteNote, toggleNotePin, toggleNoteArchive } from '../services/productivityApi';
import { AppStateBanner } from '../components/ui/AppStateBanner';

// Note Card Component
function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
}) {
  return (
    <div className={`bg-surface-primary border rounded-lg p-4 hover:border-accent-500 transition-colors ${note.is_pinned ? 'border-accent-400' : 'border-border-default'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-text-primary line-clamp-1">{note.title}</h3>
        <div className="flex gap-1">
          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded-md transition-colors ${note.is_pinned ? 'text-accent-400 bg-accent-500/10' : 'text-text-muted hover:text-accent-400'}`}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={14} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md text-text-muted hover:text-error transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p className="text-text-secondary text-sm line-clamp-3 mb-3">{note.content || 'No content'}</p>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-surface-elevated rounded-full text-xs text-text-muted">
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-text-muted">+{note.tags.length - 3}</span>
          )}
        </div>
      )}
      <div className="flex justify-between items-center text-xs text-text-muted">
        <span>{new Date(note.updated_at).toLocaleDateString()}</span>
        <button
          onClick={onToggleArchive}
          className="flex items-center gap-1 hover:text-text-secondary transition-colors"
        >
          <Archive size={12} />
          {note.is_archived ? 'Restore' : 'Archive'}
        </button>
      </div>
    </div>
  );
}

// Create/Edit Note Modal
function NoteModal({
  isOpen,
  note,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
  onSubmit: (data: CreateNoteRequest | UpdateNoteRequest) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags.join(', '));
      setIsPinned(note.is_pinned);
    } else {
      setTitle('');
      setContent('');
      setTags('');
      setIsPinned(false);
    }
  }, [note, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
    onSubmit({
      title,
      content,
      tags: tagList,
      is_pinned: isPinned,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">{note ? 'Edit Note' : 'Create Note'}</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg disabled:opacity-50"
          >
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
              placeholder="Note title..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 resize-none font-mono text-sm disabled:opacity-50"
              placeholder="Write your note in Markdown..."
              rows={12}
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
              placeholder="work, ideas, personal"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              disabled={isSubmitting}
              className="rounded border-border-default"
            />
            <label htmlFor="pinned" className="text-sm text-text-secondary">Pin this note</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                note ? 'Save Changes' : 'Create Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main NotesPage Component
export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNotes({ is_archived: showArchived });
      setNotes(response.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
      // Demo data
      setNotes([
        { id: 1, title: 'Project Ideas', content: '# Ideas\n\n- Build a CLI tool\n- Automate daily tasks', tags: ['work', 'ideas'], project_id: null, is_pinned: true, is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1' },
        { id: 2, title: 'Meeting Notes', content: 'Discussed Q1 goals and roadmap', tags: ['meetings'], project_id: null, is_pinned: false, is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '1' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [showArchived]);

  const handleCreateNote = async (data: CreateNoteRequest) => {
    setIsSubmitting(true);
    try {
      const newNote = await createNote(data);
      setNotes([newNote, ...notes]);
      setShowModal(false);
    } catch {
      const mockNote: Note = {
        id: Date.now(),
        title: data.title,
        content: data.content || '',
        tags: data.tags || [],
        project_id: data.project_id || null,
        is_pinned: data.is_pinned || false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '1',
      };
      setNotes([mockNote, ...notes]);
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async (data: UpdateNoteRequest) => {
    if (!editingNote) return;
    setIsSubmitting(true);
    try {
      const updated = await updateNote(editingNote.id, data);
      setNotes(notes.map(n => n.id === editingNote.id ? updated : n));
      setShowModal(false);
      setEditingNote(null);
    } catch {
      const updated: Note = { ...editingNote, ...data, updated_at: new Date().toISOString() };
      setNotes(notes.map(n => n.id === editingNote.id ? updated : n));
      setShowModal(false);
      setEditingNote(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm('Delete this note?')) return;
    try {
      await deleteNote(id);
    } catch {
      // Continue anyway for demo
    }
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleTogglePin = async (id: number) => {
    try {
      const updated = await toggleNotePin(id);
      setNotes(notes.map(n => n.id === id ? updated : n));
    } catch {
      setNotes(notes.map(n => n.id === id ? { ...n, is_pinned: !n.is_pinned } : n));
    }
  };

  const handleToggleArchive = async (id: number) => {
    try {
      const updated = await toggleNoteArchive(id);
      setNotes(notes.filter(n => n.id !== id));
    } catch {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-text-secondary text-sm">Capture and organize your thoughts</p>
        </div>
        <button
          onClick={() => { setEditingNote(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium transition-colors"
        >
          <Plus size={18} />
          New Note
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent-500"
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-4 py-2 rounded-lg border transition-colors ${showArchived ? 'border-accent-500 text-accent-400 bg-accent-500/10' : 'border-border-default text-text-secondary hover:bg-surface-elevated'}`}
        >
          <Archive size={18} className="inline mr-2" />
          {showArchived ? 'Show Active' : 'Show Archived'}
        </button>
        <button
          onClick={fetchNotes}
          className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <AppStateBanner
            variant="demo"
            title="Demo Mode"
            message="Could not connect to backend. Displaying sample notes."
            action={{ label: "Retry", onClick: fetchNotes }}
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-accent-500" size={32} />
        </div>
      )}

      {/* Notes Grid */}
      {!loading && (
        <div className="space-y-6">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
                <Pin size={14} />
                Pinned
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => { setEditingNote(note); setShowModal(true); }}
                    onDelete={() => handleDeleteNote(note.id)}
                    onTogglePin={() => handleTogglePin(note.id)}
                    onToggleArchive={() => handleToggleArchive(note.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h2 className="text-sm font-medium text-text-muted mb-3">Other Notes</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unpinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => { setEditingNote(note); setShowModal(true); }}
                    onDelete={() => handleDeleteNote(note.id)}
                    onTogglePin={() => handleTogglePin(note.id)}
                    onToggleArchive={() => handleToggleArchive(note.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredNotes.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <p className="mb-4">{showArchived ? 'No archived notes' : 'No notes yet'}</p>
              {!showArchived && (
                <button
                  onClick={() => { setEditingNote(null); setShowModal(true); }}
                  className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium"
                >
                  Create your first note
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <NoteModal
        isOpen={showModal}
        note={editingNote}
        onClose={() => { setShowModal(false); setEditingNote(null); }}
        onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
