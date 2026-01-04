// Project Wizard Types
// 7-stage workflow with Ralph Wiggum quality gates

export type WizardStage =
  | 'vision'
  | 'roadmap'
  | 'design'
  | 'sections'
  | 'loop1'
  | 'match'
  | 'execute';

export type WizardTaskStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'cancelled';

// Stage metadata for UI
export interface StageInfo {
  id: WizardStage;
  name: string;
  description: string;
  icon: string;
  hasRalphGate: boolean;
}

export const WIZARD_STAGES: StageInfo[] = [
  {
    id: 'vision',
    name: 'Vision',
    description: 'Define product vision and value proposition',
    icon: 'Lightbulb',
    hasRalphGate: true,
  },
  {
    id: 'roadmap',
    name: 'Roadmap',
    description: 'Plan sections and data model',
    icon: 'Map',
    hasRalphGate: true,
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Design system and visual identity',
    icon: 'Palette',
    hasRalphGate: true,
  },
  {
    id: 'sections',
    name: 'Sections',
    description: 'Define user flows and UI requirements',
    icon: 'Layout',
    hasRalphGate: true,
  },
  {
    id: 'loop1',
    name: 'Loop 1',
    description: 'Risk analysis and feasibility check',
    icon: 'RefreshCw',
    hasRalphGate: true,
  },
  {
    id: 'match',
    name: 'Match',
    description: 'Match tasks to capabilities',
    icon: 'Puzzle',
    hasRalphGate: false,
  },
  {
    id: 'execute',
    name: 'Execute',
    description: 'Kanban board and task execution',
    icon: 'Play',
    hasRalphGate: false,
  },
];

// Wizard Project
export interface WizardProject {
  id: string;
  name: string;
  description?: string;
  current_stage: WizardStage;
  stage_outputs: Record<string, unknown>;
  capability_mapping: Record<string, unknown>;
  gap_analysis?: Record<string, unknown>;
  execution_sequence?: Array<Record<string, unknown>>;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Wizard Task
export interface WizardTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: WizardTaskStatus;
  assigned_capability?: string;
  capability_confidence?: number;
  dependencies: string[];
  memory_mcp_id?: string;
  progress: number;
  work_log?: Array<Record<string, unknown>>;
  artifacts: string[];
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  quality_score?: number;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

// Ralph Gate Iteration
export interface RalphIteration {
  id: string;
  stage: WizardStage;
  iteration_number: number;
  quality_score?: number;
  criteria_results?: Record<string, boolean>;
  passed: boolean;
  feedback?: string;
  created_at: string;
}

// Stage Input/Output
export interface StageInput {
  content: Record<string, unknown>;
  iteration?: number;
}

export interface StageOutput {
  stage: WizardStage;
  iteration: number;
  quality_score: number;
  passed: boolean;
  output: Record<string, unknown>;
  feedback?: string;
  criteria_results?: Record<string, boolean>;
}

// Capability Match
export interface CapabilityMatch {
  capability_type: string;
  capability_name: string;
  confidence: number;
  description?: string;
  historical_success_rate?: number;
}

export interface TaskCapabilityMapping {
  task_title: string;
  task_description?: string;
  matches: CapabilityMatch[];
  best_match?: CapabilityMatch;
  has_gap: boolean;
}

export interface CapabilityMappingResponse {
  project_id: string;
  total_tasks: number;
  matched_tasks: number;
  tasks_with_gaps: number;
  mappings: TaskCapabilityMapping[];
  gap_analysis?: Record<string, unknown>;
}

// Memory Graph
export interface MemoryGraphNode {
  id: string;
  type: string;
  label: string;
  status?: string;
  metadata: Record<string, unknown>;
}

export interface MemoryGraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface MemoryGraphResponse {
  project_id: string;
  project_name: string;
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
  stats: Record<string, number>;
}

// API Request Types
export interface CreateWizardProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateWizardTaskRequest {
  title?: string;
  description?: string;
  status?: WizardTaskStatus;
  progress?: number;
  quality_score?: number;
  review_notes?: string;
}

// Stage-specific input types
export interface VisionStageInput {
  product_name: string;
  problems_solved: string[];
  key_features: string[];
  target_users: string;
  unique_value_proposition: string;
}

export interface RoadmapStageInput {
  sections: Array<{
    name: string;
    description: string;
    dependencies?: string[];
  }>;
  entities: Array<{
    name: string;
    fields?: Array<{ name: string; type: string }>;
    relationships?: string[];
  }>;
}

export interface DesignStageInput {
  color_palette: Record<string, string>;
  typography: Record<string, string>;
  shell_pattern: string;
  responsive_breakpoints: number[];
}

export interface SectionStageInput {
  section_id: string;
  user_flows: Array<Record<string, unknown>>;
  ui_requirements: string[];
  sample_data: Record<string, unknown>;
}

export interface Loop1StageInput {
  risk_assessment: Record<string, unknown>;
  dependency_graph: Record<string, unknown>;
  feasibility_notes: string;
}
