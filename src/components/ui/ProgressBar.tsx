interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantStyles = {
  default: 'bg-accent-500',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  gradient: 'bg-gradient-to-r from-accent-500 to-accent-400',
};

/**
 * ProgressBar - Visual progress indicator
 */
export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Auto-select variant based on percentage if using default
  const autoVariant = variant === 'default'
    ? percentage >= 80 ? 'success' : percentage >= 50 ? 'default' : percentage >= 25 ? 'warning' : 'error'
    : variant;

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-text-secondary">{label}</span>}
          {showLabel && <span className="text-sm text-text-muted">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-surface-elevated rounded-full overflow-hidden ${sizeStyles[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${variantStyles[autoVariant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

const circleVariantStyles = {
  default: 'stroke-accent-500',
  success: 'stroke-success',
  warning: 'stroke-warning',
  error: 'stroke-error',
};

/**
 * CircularProgress - Circular progress indicator
 */
export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showLabel = true,
  className = '',
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-surface-elevated"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`transition-all duration-300 ${circleVariantStyles[variant]}`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-medium text-text-primary">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
