import type { QAIssue, QAIterationRecord } from '../../types/qa';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface QAIssueListProps {
  issues: QAIssue[];
  title?: string;
  emptyMessage?: string;
  maxHeight?: string;
  className?: string;
}

const severityConfig = {
  low: { variant: 'default' as const, label: 'Low' },
  medium: { variant: 'warning' as const, label: 'Medium' },
  high: { variant: 'error' as const, label: 'High' },
  critical: { variant: 'error' as const, label: 'Critical' },
};

/**
 * QAIssueList - Display a list of QA issues with severity badges
 */
export function QAIssueList({
  issues,
  title = 'Issues',
  emptyMessage = 'No issues found',
  maxHeight = '400px',
  className = '',
}: QAIssueListProps) {
  return (
    <Card className={className}>
      <h4 className="text-sm font-semibold text-text-primary mb-3">{title}</h4>
      {issues.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">{emptyMessage}</p>
      ) : (
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
          {issues.map((issue, index) => (
            <QAIssueItem key={`${issue.title}-${index}`} issue={issue} />
          ))}
        </div>
      )}
    </Card>
  );
}

interface QAIssueItemProps {
  issue: QAIssue;
  className?: string;
}

/**
 * QAIssueItem - Single issue display
 */
export function QAIssueItem({ issue, className = '' }: QAIssueItemProps) {
  const severityInfo = issue.severity ? severityConfig[issue.severity] : null;

  return (
    <div
      className={`
        bg-surface-secondary rounded-lg p-3 border border-border-subtle
        hover:border-border-default transition-colors
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h5 className="text-sm font-medium text-text-primary flex-1">{issue.title}</h5>
        {severityInfo && (
          <Badge variant={severityInfo.variant} size="sm">
            {severityInfo.label}
          </Badge>
        )}
      </div>
      <p className="text-xs text-text-secondary mb-2">{issue.description}</p>
      {(issue.file || issue.line) && (
        <p className="text-xs text-text-muted font-mono">
          {issue.file}
          {issue.line && `:${issue.line}`}
        </p>
      )}
    </div>
  );
}

interface QAIterationListProps {
  iterations: QAIterationRecord[];
  title?: string;
  maxHeight?: string;
  className?: string;
}

/**
 * QAIterationList - List of QA iteration records
 */
export function QAIterationList({
  iterations,
  title = 'Iteration History',
  maxHeight = '400px',
  className = '',
}: QAIterationListProps) {
  return (
    <Card className={className}>
      <h4 className="text-sm font-semibold text-text-primary mb-3">{title}</h4>
      {iterations.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No iterations yet</p>
      ) : (
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight }}>
          {iterations.map((iteration) => (
            <QAIterationItem key={iteration.iteration} iteration={iteration} />
          ))}
        </div>
      )}
    </Card>
  );
}

interface QAIterationItemProps {
  iteration: QAIterationRecord;
  className?: string;
}

/**
 * QAIterationItem - Single iteration display
 */
export function QAIterationItem({ iteration, className = '' }: QAIterationItemProps) {
  const statusVariant = iteration.status === 'approved' ? 'success'
    : iteration.status === 'rejected' ? 'error'
    : iteration.status === 'running' ? 'info'
    : 'default';

  return (
    <div
      className={`
        bg-surface-secondary rounded-lg p-3 border border-border-subtle
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            Iteration {iteration.iteration}
          </span>
          <Badge variant={statusVariant} size="sm">{iteration.status}</Badge>
        </div>
        <span className="text-xs text-text-muted">
          {iteration.duration_seconds.toFixed(1)}s
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span>{iteration.issues.length} issues</span>
        <span>{new Date(iteration.timestamp).toLocaleString()}</span>
      </div>
      {iteration.issues.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border-subtle">
          <p className="text-xs text-text-muted mb-1">Top issues:</p>
          <ul className="text-xs text-text-secondary space-y-1">
            {iteration.issues.slice(0, 3).map((issue, idx) => (
              <li key={idx} className="truncate">- {issue.title}</li>
            ))}
            {iteration.issues.length > 3 && (
              <li className="text-text-muted">...and {iteration.issues.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface MostCommonIssuesProps {
  issues: Array<{ title: string; occurrences: number }>;
  title?: string;
  className?: string;
}

/**
 * MostCommonIssues - Display most frequently occurring issues
 */
export function MostCommonIssues({
  issues,
  title = 'Most Common Issues',
  className = '',
}: MostCommonIssuesProps) {
  if (!issues || issues.length === 0) {
    return null;
  }

  const maxOccurrences = Math.max(...issues.map(i => i.occurrences));

  return (
    <Card className={className}>
      <h4 className="text-sm font-semibold text-text-primary mb-3">{title}</h4>
      <div className="space-y-2">
        {issues.map((issue, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary truncate">{issue.title}</p>
              <div className="h-1.5 bg-surface-elevated rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full transition-all"
                  style={{ width: `${(issue.occurrences / maxOccurrences) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-text-primary min-w-[2rem] text-right">
              {issue.occurrences}x
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
