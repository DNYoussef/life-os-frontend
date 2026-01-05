import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantStyles = {
  default: 'border-border-subtle',
  accent: 'border-accent-500/30',
  success: 'border-success/30',
  warning: 'border-warning/30',
  error: 'border-error/30',
};

const valueVariantStyles = {
  default: 'text-text-primary',
  accent: 'text-accent-400',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

const trendColors = {
  up: 'text-success',
  down: 'text-error',
  neutral: 'text-text-muted',
};

/**
 * MetricCard - Display a key metric with optional trend indicator
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`
        bg-surface-primary border rounded-lg p-4
        ${variantStyles[variant]}
        ${className}
      `}
    >
      <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${valueVariantStyles[variant]}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span className={`text-sm font-medium ${trendColors[trend.direction]}`}>
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

interface MetricGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnStyles = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

/**
 * MetricGrid - Grid layout for MetricCards
 */
export function MetricGrid({ children, columns = 4, className = '' }: MetricGridProps) {
  return (
    <div className={`grid gap-4 ${columnStyles[columns]} ${className}`}>
      {children}
    </div>
  );
}
