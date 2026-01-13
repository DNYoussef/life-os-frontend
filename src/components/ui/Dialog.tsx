import { useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Dialog - Native HTML dialog with backdrop and animations
 * Uses HTML <dialog> element for accessibility and focus trapping
 */
export function Dialog({
  open,
  onClose,
  children,
  size = 'md',
  closeOnOutsideClick = true,
  closeOnEscape = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape' && !closeOnEscape) {
      e.preventDefault();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`
        ${sizeStyles[size]} w-full p-0 rounded-xl
        bg-surface-primary border border-border-default shadow-xl
        backdrop:bg-black/50 backdrop:backdrop-blur-sm
        open:animate-in open:fade-in-0 open:zoom-in-95
      `}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </dialog>
  );
}

interface DialogHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * DialogHeader - Header section with title and close button
 */
export function DialogHeader({ children, onClose, className = '' }: DialogHeaderProps) {
  return (
    <div className={`flex items-start justify-between px-6 pt-6 pb-4 ${className}`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          aria-label="Close dialog"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * DialogTitle - Accessible title for the dialog
 */
export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-text-primary ${className}`}>
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 * DialogDescription - Description text below title
 */
export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return (
    <p className={`text-sm text-text-secondary mt-1 ${className}`}>
      {children}
    </p>
  );
}

interface DialogBodyProps {
  children: ReactNode;
  className?: string;
}

/**
 * DialogBody - Main content area
 */
export function DialogBody({ children, className = '' }: DialogBodyProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * DialogFooter - Footer with action buttons
 */
export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div className={`flex justify-end gap-3 px-6 py-4 border-t border-border-subtle ${className}`}>
      {children}
    </div>
  );
}
