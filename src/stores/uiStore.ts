import { create } from 'zustand';
import type { Task, KanbanStatus } from '../types';
import { STATUS_TO_KANBAN } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';

interface KanbanState {
  // Task data organized by column
  columns: Record<KanbanStatus, Task[]>;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Active drag state
  activeTask: Task | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  moveTask: (taskId: string, fromColumn: KanbanStatus, toColumn: KanbanStatus, newIndex?: number) => void;
  updateTaskStatus: (taskId: string, newStatus: KanbanStatus) => Promise<void>;
  setActiveTask: (task: Task | null) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

// Helper to organize tasks into columns
const organizeTasksByColumn = (tasks: Task[]): Record<KanbanStatus, Task[]> => {
  const columns: Record<KanbanStatus, Task[]> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
    cancelled: [],
  };
  
  tasks.forEach(task => {
    // Use kanban_status if available, otherwise map from legacy status
    const columnId = task.kanban_status || STATUS_TO_KANBAN[task.status] || 'todo';
    columns[columnId].push(task);
  });
  
  return columns;
};

export const useKanbanStore = create<KanbanState>((set, get) => ({
  columns: {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
    cancelled: [],
  },
  isLoading: false,
  error: null,
  activeTask: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/tasks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      const tasks: Task[] = data.items || data;
      const columns = organizeTasksByColumn(tasks);
      set({ columns, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false 
      });
    }
  },

  moveTask: (taskId: string, fromColumn: KanbanStatus, toColumn: KanbanStatus, newIndex?: number) => {
    const { columns } = get();
    
    // Find and remove task from source column
    const sourceColumn = [...columns[fromColumn]];
    const taskIndex = sourceColumn.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const [task] = sourceColumn.splice(taskIndex, 1);
    
    // Update task status
    const updatedTask = { ...task, kanban_status: toColumn };
    
    // Add to destination column
    const destColumn = [...columns[toColumn]];
    if (newIndex !== undefined) {
      destColumn.splice(newIndex, 0, updatedTask);
    } else {
      destColumn.push(updatedTask);
    }
    
    set({
      columns: {
        ...columns,
        [fromColumn]: sourceColumn,
        [toColumn]: destColumn,
      },
    });
  },

  updateTaskStatus: async (taskId: string, newStatus: KanbanStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanban_status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
    } catch (error) {
      // Revert on error - refetch tasks
      get().fetchTasks();
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
    }
  },

  setActiveTask: (task: Task | null) => {
    set({ activeTask: task });
  },

  addTask: (task: Task) => {
    const { columns } = get();
    const columnId = task.kanban_status || STATUS_TO_KANBAN[task.status] || 'todo';
    set({
      columns: {
        ...columns,
        [columnId]: [...columns[columnId], task],
      },
    });
  },

  removeTask: (taskId: string) => {
    const { columns } = get();
    const newColumns = { ...columns };
    
    for (const columnId of Object.keys(newColumns) as KanbanStatus[]) {
      newColumns[columnId] = newColumns[columnId].filter(t => t.id !== taskId);
    }
    
    set({ columns: newColumns });
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    const { columns } = get();
    const newColumns = { ...columns };
    
    for (const columnId of Object.keys(newColumns) as KanbanStatus[]) {
      const taskIndex = newColumns[columnId].findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        newColumns[columnId] = [...newColumns[columnId]];
        newColumns[columnId][taskIndex] = { ...newColumns[columnId][taskIndex], ...updates };
        break;
      }
    }
    
    set({ columns: newColumns });
  },
}));

// UI State store for general UI state
interface UIState {
  sidebarOpen: boolean;
  activeView: 'kanban' | 'list' | 'calendar';
  selectedProjectId: string | null;
  
  toggleSidebar: () => void;
  setActiveView: (view: 'kanban' | 'list' | 'calendar') => void;
  setSelectedProject: (projectId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeView: 'kanban',
  selectedProjectId: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveView: (view) => set({ activeView: view }),
  setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),
}));
