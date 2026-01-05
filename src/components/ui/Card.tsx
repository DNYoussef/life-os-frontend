import type { ReactNode, KeyboardEvent } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-surface-primary border border-border-subtle',
  elevated: 'bg-surface-elevated border border-border-default shadow-lg',
  outlined: 'bg-transparent border border-border-default',
  interactive: 'bg-surface-primary border border-border-subtle hover:border-accent-500 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Card - Base card component with multiple variants
 */
export function Card({
  children,
  className = '',
  variant = 'default',
  onClick,
  padding = 'md',
}: CardProps) {
  const isInteractive = variant === 'interactive' || !!onClick;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`rounded-lg ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * CardHeader - Header section for cards
 */
export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="font-medium text-text-primary">{title}</h3>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * CardContent - Content section for cards
 */
export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`text-sm text-text-secondary ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * CardFooter - Footer section for cards with actions
 */
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`flex gap-2 mt-4 pt-4 border-t border-border-subtle ${className}`}>
      {children}
    </div>
  );
}
