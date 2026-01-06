// QA Pipeline Types

export type QAStatus = 'not_started' | 'approved' | 'rejected' | 'error' | 'running';

export interface QAStatusResponse {
  spec_id: string;
  current_status: QAStatus;
  iteration_count: number;
  max_iterations: number;
  total_issues: number;
  unique_issues: number;
  fix_success_rate: number;
  has_fix_request: boolean;
  has_qa_report: boolean;
  has_escalation: boolean;
  build_complete: boolean;
  timestamp: string;
}

export interface QAIterationRecord {
  iteration: number;
  status: string;
  issues: QAIssue[];
  duration_seconds: number;
  timestamp: string;
}

export interface QAIssue {
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  file?: string;
  line?: number;
}

export interface QAHistoryResponse {
  spec_id: string;
  iterations: QAIterationRecord[];
  summary: QAHistorySummary;
  timestamp: string;
}

export interface QAHistorySummary {
  total_issues: number;
  unique_issues: number;
  fix_success_rate: number;
  most_common?: { title: string; occurrences: number }[];
}

export interface QARunRequest {
  project_dir: string;
  spec_dir: string;
  model?: string;
  max_iterations?: number;
  verbose?: boolean;
  background?: boolean;
}

export interface QARunResponse {
  run_id: string;
  status: 'started' | 'completed' | 'error';
  message: string;
  project_dir: string;
  spec_dir: string;
  background: boolean;
  started_at: string;
}

export interface QAConfig {
  max_qa_iterations: number;
  max_consecutive_errors: number;
  recurring_issue_threshold: number;
  issue_similarity_threshold: number;
  timestamp: string;
}

// Spec Pipeline Types

export type ComplexityLevel = 'simple' | 'standard' | 'complex';

export interface ComplexityAnalysis {
  complexity: ComplexityLevel;
  confidence: number;
  reasoning: string;
  estimated_files: number;
  estimated_services: number;
  external_integrations: string[];
  infrastructure_changes: boolean;
  phases_to_run: string[];
  signals: Record<string, number | string | boolean>;
  timestamp: string;
}

export interface ValidationCheckpoint {
  valid: boolean;
  checkpoint: string;
  errors: string[];
  warnings: string[];
  fixes: string[];
}

export interface ValidationResponse {
  spec_dir: string;
  all_valid: boolean;
  checkpoints: ValidationCheckpoint[];
  total_errors: number;
  total_warnings: number;
  timestamp: string;
}

export interface SpecListItem {
  name: string;
  path: string;
  complexity: ComplexityLevel | null;
  has_requirements: boolean;
  has_context: boolean;
  has_spec: boolean;
  has_plan: boolean;
  created_at: string | null;
}

export interface SpecListResponse {
  project_dir: string;
  specs_dir: string;
  specs: SpecListItem[];
  total_count: number;
  timestamp: string;
}

// Recovery Types

export type FailureType =
  | 'broken_build'
  | 'verification_failed'
  | 'circular_fix'
  | 'context_exhausted'
  | 'timeout'
  | 'dependency_error'
  | 'permission_error'
  | 'unknown';

export type RecoveryActionType = 'rollback' | 'retry' | 'skip' | 'escalate' | 'continue';

export interface StuckSubtask {
  subtask_id: string;
  reason: string;
  escalated_at: string;
  attempt_count: number;
}

export interface RecoveryStatusResponse {
  spec_dir: string;
  stuck_subtasks: StuckSubtask[];
  stuck_count: number;
  last_good_commit: string | null;
  can_rollback: boolean;
  total_attempts: number;
  failed_attempts: number;
  success_rate: number;
  needs_human_intervention: boolean;
  timestamp: string;
}

export interface AttemptRecord {
  session: number;
  timestamp: string;
  approach: string;
  success: boolean;
  error: string | null;
  duration_seconds: number | null;
}

export interface SubtaskHistory {
  subtask_id: string;
  spec_dir: string;
  attempts: AttemptRecord[];
  status: string;
  attempt_count: number;
  timestamp: string;
}

export interface ClassifyErrorResponse {
  failure_type: FailureType;
  recovery_action: RecoveryActionType;
  target: string;
  reason: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface RollbackResponse {
  success: boolean;
  commit: string | null;
  message: string;
  timestamp: string;
}

export interface RecoveryHints {
  subtask_id: string;
  hints: string[];
  attempt_count: number;
  has_stuck_subtasks: boolean;
  last_good_commit: string | null;
  timestamp: string;
}
