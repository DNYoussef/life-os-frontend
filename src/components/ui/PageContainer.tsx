import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageContainer - Consistent page wrapper with proper spacing and background
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`min-h-screen bg-surface-base text-text-primary p-6 ${className}`}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * PageHeader - Consistent page header with title, subtitle, and action buttons
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-text-secondary text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Section - Content section with optional title
 */
export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <section className={`mb-6 ${className}`}>
      {title && (
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
