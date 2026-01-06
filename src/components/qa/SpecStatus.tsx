import type {
  ComplexityLevel,
  ComplexityAnalysis,
  ValidationResponse,
  ValidationCheckpoint,
  SpecListItem,
  SpecListResponse,
} from '../../types/qa';
import { Badge, StatusDot } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Card } from '../ui/Card';

interface SpecComplexityCardProps {
  analysis: ComplexityAnalysis;
  onReanalyze?: () => void;
  isLoading?: boolean;
  className?: string;
}

const complexityConfig: Record<ComplexityLevel, { label: string; variant: 'success' | 'warning' | 'error'; color: string }> = {
  simple: { label: 'Simple', variant: 'success', color: 'text-success' },
  standard: { label: 'Standard', variant: 'warning', color: 'text-warning' },
  complex: { label: 'Complex', variant: 'error', color: 'text-error' },
};

/**
 * SpecComplexityCard - Display spec complexity analysis
 */
export function SpecComplexityCard({
  analysis,
  onReanalyze,
  isLoading = false,
  className = '',
}: SpecComplexityCardProps) {
  const config = complexityConfig[analysis.complexity];

  return (
    <Card variant="elevated" className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Complexity Analysis</h3>
          <p className="text-sm text-text-muted">Confidence: {Math.round(analysis.confidence * 100)}%</p>
        </div>
        <Badge variant={config.variant} size="lg">{config.label}</Badge>
      </div>

      <p className="text-sm text-text-secondary mb-4">{analysis.reasoning}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Estimated Files</p>
          <p className="text-xl font-bold text-text-primary">{analysis.estimated_files}</p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Estimated Services</p>
          <p className="text-xl font-bold text-text-primary">{analysis.estimated_services}</p>
        </div>
      </div>

      {analysis.external_integrations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-text-muted mb-2">External Integrations:</p>
          <div className="flex flex-wrap gap-1">
            {analysis.external_integrations.map((integration, idx) => (
              <Badge key={idx} variant="info" size="sm">{integration}</Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.infrastructure_changes && (
        <Badge variant="warning" size="sm" className="mb-4">Infrastructure Changes Required</Badge>
      )}

      {analysis.phases_to_run.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-text-muted mb-2">Phases to Run:</p>
          <div className="flex flex-wrap gap-1">
            {analysis.phases_to_run.map((phase, idx) => (
              <Badge key={idx} variant="default" size="sm">{phase}</Badge>
            ))}
          </div>
        </div>
      )}

      {onReanalyze && (
        <button
          onClick={onReanalyze}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-surface-elevated hover:bg-surface-secondary text-text-secondary rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Re-analyze'}
        </button>
      )}
    </Card>
  );
}

interface SpecValidationCardProps {
  validation: ValidationResponse;
  onValidate?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * SpecValidationCard - Display spec validation results
 */
export function SpecValidationCard({
  validation,
  onValidate,
  isLoading = false,
  className = '',
}: SpecValidationCardProps) {
  return (
    <Card variant="elevated" className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Validation Results</h3>
          <p className="text-sm text-text-muted">{validation.spec_dir}</p>
        </div>
        <Badge
          variant={validation.all_valid ? 'success' : 'error'}
          icon={<StatusDot status={validation.all_valid ? 'success' : 'error'} />}
        >
          {validation.all_valid ? 'Valid' : 'Invalid'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Errors</p>
          <p className={`text-xl font-bold ${validation.total_errors > 0 ? 'text-error' : 'text-success'}`}>
            {validation.total_errors}
          </p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Warnings</p>
          <p className={`text-xl font-bold ${validation.total_warnings > 0 ? 'text-warning' : 'text-text-primary'}`}>
            {validation.total_warnings}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {validation.checkpoints.map((checkpoint, idx) => (
          <ValidationCheckpointItem key={idx} checkpoint={checkpoint} />
        ))}
      </div>

      {onValidate && (
        <button
          onClick={onValidate}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-surface-elevated disabled:text-text-muted text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Validating...' : 'Re-validate'}
        </button>
      )}
    </Card>
  );
}

interface ValidationCheckpointItemProps {
  checkpoint: ValidationCheckpoint;
  className?: string;
}

/**
 * ValidationCheckpointItem - Single validation checkpoint
 */
export function ValidationCheckpointItem({ checkpoint, className = '' }: ValidationCheckpointItemProps) {
  return (
    <div
      className={`
        bg-surface-secondary rounded-lg p-3 border
        ${checkpoint.valid ? 'border-success/30' : 'border-error/30'}
        ${className}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <StatusDot status={checkpoint.valid ? 'success' : 'error'} />
        <span className="text-sm font-medium text-text-primary">{checkpoint.checkpoint}</span>
      </div>
      {checkpoint.errors.length > 0 && (
        <ul className="text-xs text-error space-y-0.5 ml-4 mt-1">
          {checkpoint.errors.map((error, idx) => (
            <li key={idx}>- {error}</li>
          ))}
        </ul>
      )}
      {checkpoint.warnings.length > 0 && (
        <ul className="text-xs text-warning space-y-0.5 ml-4 mt-1">
          {checkpoint.warnings.map((warning, idx) => (
            <li key={idx}>- {warning}</li>
          ))}
        </ul>
      )}
      {checkpoint.fixes.length > 0 && (
        <ul className="text-xs text-info space-y-0.5 ml-4 mt-1">
          {checkpoint.fixes.map((fix, idx) => (
            <li key={idx}>+ {fix}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SpecListCardProps {
  specs: SpecListResponse;
  onSelectSpec?: (spec: SpecListItem) => void;
  selectedSpec?: string;
  title?: string;
  maxHeight?: string;
  className?: string;
}

/**
 * SpecListCard - List of specs with status indicators
 */
export function SpecListCard({
  specs,
  onSelectSpec,
  selectedSpec,
  title = 'Specifications',
  maxHeight = '400px',
  className = '',
}: SpecListCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
        <span className="text-xs text-text-muted">{specs.total_count} specs</span>
      </div>
      {specs.specs.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No specifications found</p>
      ) : (
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
          {specs.specs.map((spec) => (
            <SpecListItemComponent
              key={spec.path}
              spec={spec}
              isSelected={selectedSpec === spec.path}
              onClick={onSelectSpec ? () => onSelectSpec(spec) : undefined}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

interface SpecListItemComponentProps {
  spec: SpecListItem;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * SpecListItemComponent - Single spec item in list
 */
export function SpecListItemComponent({
  spec,
  isSelected = false,
  onClick,
  className = '',
}: SpecListItemComponentProps) {
  return (
    <div
      className={`
        bg-surface-secondary rounded-lg p-3 border transition-colors
        ${isSelected ? 'border-accent-500' : 'border-border-subtle'}
        ${onClick ? 'cursor-pointer hover:border-border-default' : ''}
        ${className}
      `}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-text-primary">{spec.name}</span>
        {spec.complexity && (
          <Badge variant={complexityConfig[spec.complexity].variant} size="sm">
            {complexityConfig[spec.complexity].label}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {spec.has_requirements && (
          <Badge variant="success" size="sm">Requirements</Badge>
        )}
        {spec.has_context && (
          <Badge variant="success" size="sm">Context</Badge>
        )}
        {spec.has_spec && (
          <Badge variant="success" size="sm">Spec</Badge>
        )}
        {spec.has_plan && (
          <Badge variant="success" size="sm">Plan</Badge>
        )}
      </div>
      {spec.created_at && (
        <p className="text-xs text-text-muted mt-2">
          Created: {new Date(spec.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

interface SpecHealthIndicatorProps {
  hasRequirements: boolean;
  hasContext: boolean;
  hasSpec: boolean;
  hasPlan: boolean;
  complexity?: ComplexityLevel | null;
  className?: string;
}

/**
 * SpecHealthIndicator - Visual indicator of spec completeness
 */
export function SpecHealthIndicator({
  hasRequirements,
  hasContext,
  hasSpec,
  hasPlan,
  complexity,
  className = '',
}: SpecHealthIndicatorProps) {
  const completeness = [hasRequirements, hasContext, hasSpec, hasPlan].filter(Boolean).length;
  const percentage = (completeness / 4) * 100;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ProgressBar
        value={percentage}
        size="sm"
        variant={percentage === 100 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
        className="flex-1"
      />
      <span className="text-xs text-text-muted">{completeness}/4</span>
      {complexity && (
        <Badge variant={complexityConfig[complexity].variant} size="sm">
          {complexity}
        </Badge>
      )}
    </div>
  );
}
