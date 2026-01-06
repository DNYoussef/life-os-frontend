import type {
  QAStatusResponse,
  QAHistoryResponse,
  QARunRequest,
  QARunResponse,
  QAConfig,
  ComplexityAnalysis,
  ValidationResponse,
  SpecListResponse,
  RecoveryStatusResponse,
  SubtaskHistory,
  ClassifyErrorResponse,
  RollbackResponse,
  RecoveryHints,
} from '../types/qa';

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';

// Generic fetch wrapper
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
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

// ============ QA PIPELINE API ============

export async function getQAStatus(specDir: string, projectDir?: string): Promise<QAStatusResponse> {
  const params = new URLSearchParams({ spec_dir: specDir });
  if (projectDir) params.append('project_dir', projectDir);
  return fetchApi(`/api/v1/qa/status?${params}`);
}

export async function getQAHistory(specDir: string, projectDir?: string): Promise<QAHistoryResponse> {
  const params = new URLSearchParams({ spec_dir: specDir });
  if (projectDir) params.append('project_dir', projectDir);
  return fetchApi(`/api/v1/qa/history?${params}`);
}

export async function runQAPipeline(request: QARunRequest): Promise<QARunResponse> {
  return fetchApi('/api/v1/qa/run', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getQARunStatus(runId: string): Promise<QARunResponse> {
  return fetchApi(`/api/v1/qa/run/${runId}`);
}

export async function getQAConfig(): Promise<QAConfig> {
  return fetchApi('/api/v1/qa/config');
}

export async function updateQAConfig(config: Partial<QAConfig>): Promise<QAConfig> {
  return fetchApi('/api/v1/qa/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export async function getActiveQARuns(): Promise<Record<string, QARunResponse>> {
  return fetchApi('/api/v1/qa/active-runs');
}

// ============ SPEC PIPELINE API ============

export async function analyzeComplexity(
  specDir: string,
  projectDir?: string
): Promise<ComplexityAnalysis> {
  const params = new URLSearchParams({ spec_dir: specDir });
  if (projectDir) params.append('project_dir', projectDir);
  return fetchApi(`/api/v1/spec/analyze?${params}`);
}

export async function validateSpec(
  specDir: string,
  projectDir?: string,
  autoFix = false
): Promise<ValidationResponse> {
  const params = new URLSearchParams({ spec_dir: specDir, auto_fix: String(autoFix) });
  if (projectDir) params.append('project_dir', projectDir);
  return fetchApi(`/api/v1/spec/validate?${params}`);
}

export interface SpecOrchestrateRequest {
  project_dir: string;
  spec_dir: string;
  model?: string;
  skip_phases?: string[];
  force_complexity?: 'simple' | 'standard' | 'complex';
  background?: boolean;
}

export interface SpecOrchestrateResponse {
  run_id: string;
  status: 'started' | 'completed' | 'error';
  message: string;
  spec_dir: string;
  complexity?: string;
  phases?: string[];
  background: boolean;
  started_at: string;
}

export async function orchestrateSpec(
  request: SpecOrchestrateRequest
): Promise<SpecOrchestrateResponse> {
  return fetchApi('/api/v1/spec/orchestrate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getOrchestrateStatus(runId: string): Promise<SpecOrchestrateResponse> {
  return fetchApi(`/api/v1/spec/orchestrate/${runId}`);
}

export async function listSpecs(projectDir: string): Promise<SpecListResponse> {
  return fetchApi(`/api/v1/spec/list?project_dir=${encodeURIComponent(projectDir)}`);
}

export async function getActiveSpecRuns(): Promise<Record<string, SpecOrchestrateResponse>> {
  return fetchApi('/api/v1/spec/active-runs');
}

export interface SpecAssessment {
  spec_dir: string;
  complexity: ComplexityAnalysis | null;
  validation: ValidationResponse | null;
  qa_status: QAStatusResponse | null;
  recovery_status: RecoveryStatusResponse | null;
  overall_health: 'healthy' | 'warning' | 'critical' | 'unknown';
  recommendations: string[];
  timestamp: string;
}

export async function getSpecAssessment(
  specDir: string,
  projectDir?: string
): Promise<SpecAssessment> {
  const params = new URLSearchParams({ spec_dir: specDir });
  if (projectDir) params.append('project_dir', projectDir);
  return fetchApi(`/api/v1/spec/assessment?${params}`);
}

// ============ RECOVERY API ============

export async function getRecoveryStatus(
  specDir: string,
  projectDir?: string
): Promise<RecoveryStatusResponse> {
  const params = new URLSearchParams({ spec_dir: specDir });
  if (projectDir) params.append('project_dir', projectDir);
  return fetchApi(`/api/v1/recovery/status?${params}`);
}

export async function triggerRollback(
  specDir: string,
  projectDir?: string
): Promise<RollbackResponse> {
  return fetchApi('/api/v1/recovery/rollback', {
    method: 'POST',
    body: JSON.stringify({ spec_dir: specDir, project_dir: projectDir }),
  });
}

export async function clearStuckSubtasks(
  specDir: string,
  projectDir?: string
): Promise<{ success: boolean; cleared_count: number; message: string }> {
  return fetchApi('/api/v1/recovery/clear-stuck', {
    method: 'POST',
    body: JSON.stringify({ spec_dir: specDir, project_dir: projectDir }),
  });
}

export async function resetRecovery(
  specDir: string,
  projectDir?: string
): Promise<{ success: boolean; stuck_cleared: number; subtasks_reset: number; message: string }> {
  return fetchApi('/api/v1/recovery/reset', {
    method: 'POST',
    body: JSON.stringify({ spec_dir: specDir, project_dir: projectDir }),
  });
}

export async function getSubtaskHistory(
  subtaskId: string,
  specDir: string,
  projectDir?: string
): Promise<SubtaskHistory> {
  const params = new URLSearchParams({ spec_dir: specDir });
  if (projectDir) params.append('project_dir', projectDir);
  return fetchApi(`/api/v1/recovery/history/${subtaskId}?${params}`);
}

export async function classifyError(
  errorMessage: string,
  specDir: string,
  subtaskId?: string,
  projectDir?: string
): Promise<ClassifyErrorResponse> {
  return fetchApi('/api/v1/recovery/classify', {
    method: 'POST',
    body: JSON.stringify({
      error_message: errorMessage,
      spec_dir: specDir,
      subtask_id: subtaskId,
      project_dir: projectDir,
    }),
  });
}

export interface RecordAttemptRequest {
  spec_dir: string;
  subtask_id: string;
  session: number;
  success: boolean;
  approach: string;
  error?: string;
  duration_seconds?: number;
  project_dir?: string;
}

export async function recordAttempt(
  request: RecordAttemptRequest
): Promise<{ success: boolean; message: string }> {
  return fetchApi('/api/v1/recovery/record-attempt', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function recordGoodCommit(
  specDir: string,
  commit: string,
  projectDir?: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi('/api/v1/recovery/record-good-commit', {
    method: 'POST',
    body: JSON.stringify({ spec_dir: specDir, commit, project_dir: projectDir }),
  });
}

export async function getRecoveryHints(
  subtaskId: string,
  specDir: string,
  projectDir?: string
): Promise<RecoveryHints> {
  const params = new URLSearchParams({ spec_dir: specDir });
  if (projectDir) params.append('project_dir', projectDir);
  return fetchApi(`/api/v1/recovery/hints/${subtaskId}?${params}`);
}
