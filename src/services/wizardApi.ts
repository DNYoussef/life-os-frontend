/**
 * Wizard API Service
 * Handles all API calls to the Project Wizard endpoints
 */

import type {
  WizardProject,
  WizardTask,
  WizardStage,
  StageInput,
  StageOutput,
  CapabilityMappingResponse,
  MemoryGraphResponse,
  CreateWizardProjectRequest,
  UpdateWizardTaskRequest,
} from '../types/wizard';

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';
const WIZARD_BASE = `${API_BASE}/api/v1/wizard`;

// Generic fetch wrapper
async function fetchWizardApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${WIZARD_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============ PROJECT ENDPOINTS ============

/**
 * Create a new wizard project
 */
export async function createWizardProject(data: CreateWizardProjectRequest): Promise<WizardProject> {
  return fetchWizardApi('/projects/new', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get all wizard projects
 */
export async function getWizardProjects(
  limit = 20,
  offset = 0
): Promise<{ total: number; projects: WizardProject[] }> {
  return fetchWizardApi(`/projects?limit=${limit}&offset=${offset}`);
}

/**
 * Get a single wizard project with details
 */
export async function getWizardProject(projectId: string): Promise<WizardProject & {
  tasks: WizardTask[];
  ralph_iterations: Array<{
    id: string;
    stage: WizardStage;
    iteration_number: number;
    quality_score?: number;
    passed: boolean;
    feedback?: string;
    created_at: string;
  }>;
  tasks_count: number;
}> {
  return fetchWizardApi(`/projects/${projectId}`);
}

// ============ STAGE ENDPOINTS ============

/**
 * Process a wizard stage with Ralph Wiggum gate
 */
export async function processStage(
  projectId: string,
  stage: WizardStage,
  input: StageInput
): Promise<StageOutput> {
  return fetchWizardApi(`/projects/${projectId}/stage/${stage}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ============ CAPABILITY MATCHING ============

/**
 * Get capability matching results
 */
export async function getCapabilityMatch(projectId: string): Promise<CapabilityMappingResponse> {
  return fetchWizardApi(`/projects/${projectId}/capability-match`);
}

/**
 * Run capability matching for project tasks
 */
export async function runCapabilityMatch(projectId: string): Promise<CapabilityMappingResponse> {
  return fetchWizardApi(`/projects/${projectId}/capability-match/run`, {
    method: 'POST',
  });
}

// ============ TASK ENDPOINTS ============

/**
 * Get tasks for a wizard project
 */
export async function getWizardTasks(
  projectId: string,
  status?: string
): Promise<WizardTask[]> {
  const params = status ? `?status=${status}` : '';
  return fetchWizardApi(`/projects/${projectId}/tasks${params}`);
}

/**
 * Update a wizard task
 */
export async function updateWizardTask(
  projectId: string,
  taskId: string,
  data: UpdateWizardTaskRequest
): Promise<WizardTask> {
  return fetchWizardApi(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============ MEMORY GRAPH ============

/**
 * Get memory graph data for visualization
 */
export async function getMemoryGraph(projectId: string): Promise<MemoryGraphResponse> {
  return fetchWizardApi(`/projects/${projectId}/memory-graph`);
}

// ============ HELPER FUNCTIONS ============

/**
 * Check if a stage can be accessed based on current progress
 * In demo mode (no API), allow navigating to any stage for testing
 */
export function canAccessStage(currentStage: WizardStage, targetStage: WizardStage): boolean {
  const stageOrder: WizardStage[] = [
    'vision',
    'roadmap',
    'design',
    'sections',
    'loop1',
    'match',
    'execute',
  ];

  const currentIndex = stageOrder.indexOf(currentStage);
  const targetIndex = stageOrder.indexOf(targetStage);

  // Can access current stage and all previous stages
  // For demo/testing, allow navigating to ANY stage to test components
  // In production, change this to: return targetIndex <= currentIndex;
  return true; // Allow all stages for demo/testing
}

/**
 * Get the next stage in the workflow
 */
export function getNextStage(currentStage: WizardStage): WizardStage | null {
  const stageOrder: WizardStage[] = [
    'vision',
    'roadmap',
    'design',
    'sections',
    'loop1',
    'match',
    'execute',
  ];

  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex < stageOrder.length - 1) {
    return stageOrder[currentIndex + 1];
  }
  return null;
}

/**
 * Get the previous stage in the workflow
 */
export function getPreviousStage(currentStage: WizardStage): WizardStage | null {
  const stageOrder: WizardStage[] = [
    'vision',
    'roadmap',
    'design',
    'sections',
    'loop1',
    'match',
    'execute',
  ];

  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex > 0) {
    return stageOrder[currentIndex - 1];
  }
  return null;
}

/**
 * Get stage index (0-based)
 */
export function getStageIndex(stage: WizardStage): number {
  const stageOrder: WizardStage[] = [
    'vision',
    'roadmap',
    'design',
    'sections',
    'loop1',
    'match',
    'execute',
  ];
  return stageOrder.indexOf(stage);
}
