import type { ReactNode } from 'react';
import type { QAStatus, QAStatusResponse } from '../../types/qa';
import { Badge, StatusDot } from '../ui/Badge';
import { ProgressBar, CircularProgress } from '../ui/ProgressBar';
import { Card } from '../ui/Card';

interface QAStatusCardProps {
  status: QAStatusResponse;
  onRunQA?: () => void;
  onViewHistory?: () => void;
  isLoading?: boolean;
  className?: string;
}

const statusConfig: Record<QAStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default'; dot: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  not_started: { label: 'Not Started', variant: 'default', dot: 'neutral' },
  approved: { label: 'Approved', variant: 'success', dot: 'success' },
  rejected: { label: 'Rejected', variant: 'error', dot: 'error' },
  error: { label: 'Error', variant: 'error', dot: 'error' },
  running: { label: 'Running', variant: 'info', dot: 'info' },
};

/**
 * QAStatusCard - Display QA pipeline status with metrics
 */
export function QAStatusCard({
  status,
  onRunQA,
  onViewHistory,
  isLoading = false,
  className = '',
}: QAStatusCardProps) {
  const config = statusConfig[status.current_status];
  const progressPercentage = status.max_iterations > 0
    ? (status.iteration_count / status.max_iterations) * 100
    : 0;

  return (
    <Card variant="elevated" className={`${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">QA Pipeline</h3>
          <p className="text-sm text-text-muted">{status.spec_id}</p>
        </div>
        <Badge variant={config.variant} icon={<StatusDot status={config.dot} pulse={status.current_status === 'running'} />}>
          {config.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Iterations</p>
          <p className="text-xl font-bold text-text-primary">
            {status.iteration_count}
            <span className="text-sm text-text-muted font-normal">/{status.max_iterations}</span>
          </p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Issues Found</p>
          <p className="text-xl font-bold text-text-primary">
            {status.unique_issues}
            <span className="text-sm text-text-muted font-normal"> unique</span>
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-text-secondary">Fix Success Rate</span>
          <span className="text-sm font-medium text-text-primary">
            {Math.round(status.fix_success_rate * 100)}%
          </span>
        </div>
        <ProgressBar
          value={status.fix_success_rate * 100}
          variant={status.fix_success_rate >= 0.8 ? 'success' : status.fix_success_rate >= 0.5 ? 'warning' : 'error'}
          size="sm"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {status.has_fix_request && (
          <Badge variant="warning" size="sm">Fix Requested</Badge>
        )}
        {status.has_qa_report && (
          <Badge variant="info" size="sm">Report Available</Badge>
        )}
        {status.has_escalation && (
          <Badge variant="error" size="sm">Escalated</Badge>
        )}
        {status.build_complete && (
          <Badge variant="success" size="sm">Build Complete</Badge>
        )}
      </div>

      <div className="flex gap-2">
        {onRunQA && (
          <button
            onClick={onRunQA}
            disabled={isLoading || status.current_status === 'running'}
            className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-surface-elevated disabled:text-text-muted text-white rounded-lg font-medium transition-colors"
          >
            {status.current_status === 'running' ? 'Running...' : 'Run QA'}
          </button>
        )}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="px-4 py-2 bg-surface-elevated hover:bg-surface-secondary text-text-secondary rounded-lg font-medium transition-colors"
          >
            History
          </button>
        )}
      </div>
    </Card>
  );
}

interface QAStatusMiniProps {
  status: QAStatus;
  iterationCount?: number;
  maxIterations?: number;
  className?: string;
}

/**
 * QAStatusMini - Compact QA status indicator
 */
export function QAStatusMini({
  status,
  iterationCount,
  maxIterations,
  className = '',
}: QAStatusMiniProps) {
  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <StatusDot status={config.dot} pulse={status === 'running'} />
      <span className="text-sm text-text-secondary">{config.label}</span>
      {iterationCount !== undefined && maxIterations !== undefined && (
        <span className="text-xs text-text-muted">
          ({iterationCount}/{maxIterations})
        </span>
      )}
    </div>
  );
}

interface QAMetricsSummaryProps {
  totalIssues: number;
  uniqueIssues: number;
  fixSuccessRate: number;
  iterationCount: number;
  className?: string;
}

/**
 * QAMetricsSummary - Grid of QA metrics
 */
export function QAMetricsSummary({
  totalIssues,
  uniqueIssues,
  fixSuccessRate,
  iterationCount,
  className = '',
}: QAMetricsSummaryProps) {
  return (
    <div className={`grid grid-cols-4 gap-3 ${className}`}>
      <div className="text-center">
        <p className="text-2xl font-bold text-text-primary">{totalIssues}</p>
        <p className="text-xs text-text-muted">Total Issues</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-text-primary">{uniqueIssues}</p>
        <p className="text-xs text-text-muted">Unique Issues</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-success">{Math.round(fixSuccessRate * 100)}%</p>
        <p className="text-xs text-text-muted">Fix Rate</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-text-primary">{iterationCount}</p>
        <p className="text-xs text-text-muted">Iterations</p>
      </div>
    </div>
  );
}
