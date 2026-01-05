import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-text-secondary border-border-default',
  success: 'bg-success/20 text-success border-success/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  error: 'bg-error/20 text-error border-error/30',
  info: 'bg-info/20 text-info border-info/30',
  accent: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

/**
 * Badge - Status indicator badge with multiple variants
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon}
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const dotColors: Record<StatusDotProps['status'], string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  neutral: 'bg-text-muted',
};

const dotSizes: Record<NonNullable<StatusDotProps['size']>, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
};

/**
 * StatusDot - Simple colored dot indicator
 */
export function StatusDot({
  status,
  size = 'md',
  pulse = false,
  className = '',
}: StatusDotProps) {
  return (
    <span
      className={`
        inline-block rounded-full
        ${dotColors[status]}
        ${dotSizes[size]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
      aria-label={`Status: ${status}`}
    />
  );
}
