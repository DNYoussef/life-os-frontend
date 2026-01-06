import type {
  RecoveryStatusResponse,
  StuckSubtask,
  AttemptRecord,
  SubtaskHistory,
  RecoveryActionType,
  FailureType,
} from '../../types/qa';
import { Badge, StatusDot } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Card } from '../ui/Card';

interface RecoveryStatusCardProps {
  status: RecoveryStatusResponse;
  onRollback?: () => void;
  onClearStuck?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * RecoveryStatusCard - Display recovery status with actions
 */
export function RecoveryStatusCard({
  status,
  onRollback,
  onClearStuck,
  onReset,
  isLoading = false,
  className = '',
}: RecoveryStatusCardProps) {
  const healthStatus = status.needs_human_intervention
    ? 'critical'
    : status.stuck_count > 0
    ? 'warning'
    : 'healthy';

  const healthConfig = {
    healthy: { label: 'Healthy', variant: 'success' as const, dot: 'success' as const },
    warning: { label: 'Needs Attention', variant: 'warning' as const, dot: 'warning' as const },
    critical: { label: 'Intervention Required', variant: 'error' as const, dot: 'error' as const },
  };

  const config = healthConfig[healthStatus];

  return (
    <Card variant="elevated" className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Recovery Status</h3>
          <p className="text-sm text-text-muted">{status.spec_dir}</p>
        </div>
        <Badge variant={config.variant} icon={<StatusDot status={config.dot} />}>
          {config.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Stuck Subtasks</p>
          <p className={`text-xl font-bold ${status.stuck_count > 0 ? 'text-error' : 'text-text-primary'}`}>
            {status.stuck_count}
          </p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Total Attempts</p>
          <p className="text-xl font-bold text-text-primary">{status.total_attempts}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-text-secondary">Success Rate</span>
          <span className="text-sm font-medium text-text-primary">
            {Math.round(status.success_rate * 100)}%
          </span>
        </div>
        <ProgressBar
          value={status.success_rate * 100}
          variant={status.success_rate >= 0.8 ? 'success' : status.success_rate >= 0.5 ? 'warning' : 'error'}
          size="sm"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {status.can_rollback && (
          <Badge variant="info" size="sm">Rollback Available</Badge>
        )}
        {status.last_good_commit && (
          <Badge variant="default" size="sm" className="font-mono">
            Last Good: {status.last_good_commit.slice(0, 7)}
          </Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {onRollback && status.can_rollback && (
          <button
            onClick={onRollback}
            disabled={isLoading}
            className="px-3 py-1.5 bg-warning/20 hover:bg-warning/30 text-warning rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Rollback
          </button>
        )}
        {onClearStuck && status.stuck_count > 0 && (
          <button
            onClick={onClearStuck}
            disabled={isLoading}
            className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-secondary text-text-secondary rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Clear Stuck ({status.stuck_count})
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            disabled={isLoading}
            className="px-3 py-1.5 bg-error/20 hover:bg-error/30 text-error rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Reset All
          </button>
        )}
      </div>
    </Card>
  );
}

interface RecoveryStatusMiniProps {
  stuckCount: number;
  canRollback: boolean;
  needsIntervention: boolean;
  className?: string;
}

/**
 * RecoveryStatusMini - Compact recovery status indicator
 */
export function RecoveryStatusMini({
  stuckCount,
  canRollback,
  needsIntervention,
  className = '',
}: RecoveryStatusMiniProps) {
  const status = needsIntervention ? 'error' : stuckCount > 0 ? 'warning' : 'success';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <StatusDot status={status} />
      <span className="text-sm text-text-secondary">
        {needsIntervention
          ? 'Needs Intervention'
          : stuckCount > 0
          ? `${stuckCount} stuck`
          : 'Healthy'}
      </span>
      {canRollback && (
        <Badge variant="info" size="sm">Can Rollback</Badge>
      )}
    </div>
  );
}

interface StuckSubtaskListProps {
  subtasks: StuckSubtask[];
  onViewHistory?: (subtaskId: string) => void;
  title?: string;
  maxHeight?: string;
  className?: string;
}

/**
 * StuckSubtaskList - List of stuck subtasks
 */
export function StuckSubtaskList({
  subtasks,
  onViewHistory,
  title = 'Stuck Subtasks',
  maxHeight = '300px',
  className = '',
}: StuckSubtaskListProps) {
  return (
    <Card className={className}>
      <h4 className="text-sm font-semibold text-text-primary mb-3">{title}</h4>
      {subtasks.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No stuck subtasks</p>
      ) : (
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
          {subtasks.map((subtask) => (
            <div
              key={subtask.subtask_id}
              className="bg-surface-secondary rounded-lg p-3 border border-error/30"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-text-primary font-mono">
                  {subtask.subtask_id}
                </span>
                <Badge variant="error" size="sm">
                  {subtask.attempt_count} attempts
                </Badge>
              </div>
              <p className="text-xs text-text-secondary mb-2">{subtask.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Escalated: {new Date(subtask.escalated_at).toLocaleString()}
                </span>
                {onViewHistory && (
                  <button
                    onClick={() => onViewHistory(subtask.subtask_id)}
                    className="text-xs text-accent-400 hover:text-accent-300"
                  >
                    View History
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

interface AttemptHistoryListProps {
  history: SubtaskHistory;
  title?: string;
  maxHeight?: string;
  className?: string;
}

/**
 * AttemptHistoryList - List of attempt records for a subtask
 */
export function AttemptHistoryList({
  history,
  title,
  maxHeight = '400px',
  className = '',
}: AttemptHistoryListProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-text-primary">
          {title || `History: ${history.subtask_id}`}
        </h4>
        <Badge variant={history.status === 'completed' ? 'success' : history.status === 'stuck' ? 'error' : 'default'} size="sm">
          {history.status}
        </Badge>
      </div>
      {history.attempts.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No attempts recorded</p>
      ) : (
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
          {history.attempts.map((attempt, idx) => (
            <AttemptRecordItem key={idx} attempt={attempt} index={idx} />
          ))}
        </div>
      )}
    </Card>
  );
}

interface AttemptRecordItemProps {
  attempt: AttemptRecord;
  index: number;
  className?: string;
}

/**
 * AttemptRecordItem - Single attempt record display
 */
export function AttemptRecordItem({ attempt, index, className = '' }: AttemptRecordItemProps) {
  return (
    <div
      className={`
        bg-surface-secondary rounded-lg p-3 border
        ${attempt.success ? 'border-success/30' : 'border-error/30'}
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            Attempt #{index + 1}
          </span>
          <Badge variant={attempt.success ? 'success' : 'error'} size="sm">
            {attempt.success ? 'Success' : 'Failed'}
          </Badge>
        </div>
        {attempt.duration_seconds && (
          <span className="text-xs text-text-muted">
            {attempt.duration_seconds.toFixed(1)}s
          </span>
        )}
      </div>
      <p className="text-xs text-text-secondary mb-1">
        Session {attempt.session} - {attempt.approach}
      </p>
      {attempt.error && (
        <p className="text-xs text-error bg-error/10 rounded px-2 py-1 mt-2 font-mono">
          {attempt.error}
        </p>
      )}
      <p className="text-xs text-text-muted mt-1">
        {new Date(attempt.timestamp).toLocaleString()}
      </p>
    </div>
  );
}

interface FailureClassificationProps {
  failureType: FailureType;
  recoveryAction: RecoveryActionType;
  reason: string;
  target?: string;
  className?: string;
}

const failureTypeConfig: Record<FailureType, { label: string; variant: 'error' | 'warning' | 'default' }> = {
  broken_build: { label: 'Broken Build', variant: 'error' },
  verification_failed: { label: 'Verification Failed', variant: 'error' },
  circular_fix: { label: 'Circular Fix', variant: 'warning' },
  context_exhausted: { label: 'Context Exhausted', variant: 'warning' },
  timeout: { label: 'Timeout', variant: 'warning' },
  dependency_error: { label: 'Dependency Error', variant: 'error' },
  permission_error: { label: 'Permission Error', variant: 'error' },
  unknown: { label: 'Unknown', variant: 'default' },
};

const recoveryActionConfig: Record<RecoveryActionType, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  rollback: { label: 'Rollback', variant: 'warning' },
  retry: { label: 'Retry', variant: 'info' },
  skip: { label: 'Skip', variant: 'default' },
  escalate: { label: 'Escalate', variant: 'error' },
  continue: { label: 'Continue', variant: 'success' },
};

/**
 * FailureClassification - Display failure type and recommended recovery action
 */
export function FailureClassification({
  failureType,
  recoveryAction,
  reason,
  target,
  className = '',
}: FailureClassificationProps) {
  const failureConfig = failureTypeConfig[failureType];
  const actionConfig = recoveryActionConfig[recoveryAction];

  return (
    <Card className={className}>
      <h4 className="text-sm font-semibold text-text-primary mb-3">Failure Analysis</h4>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-20">Type:</span>
          <Badge variant={failureConfig.variant}>{failureConfig.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-20">Action:</span>
          <Badge variant={actionConfig.variant}>{actionConfig.label}</Badge>
        </div>
        {target && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-text-muted w-20">Target:</span>
            <span className="text-sm text-text-secondary font-mono">{target}</span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <span className="text-xs text-text-muted w-20">Reason:</span>
          <span className="text-sm text-text-secondary">{reason}</span>
        </div>
      </div>
    </Card>
  );
}
