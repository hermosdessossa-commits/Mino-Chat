import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@mino-chat/shared/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`);
  const descriptionId = useRef(`modal-description-${Math.random().toString(36).slice(2)}`);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-surface-900 shadow-xl animate-in',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId.current : undefined}
        aria-describedby={description ? descriptionId.current : undefined}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 border-b border-surface-200 dark:border-surface-700 px-6 py-4">
            <div>
              {title && (
                <h2 id={titleId.current} className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId.current} className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="btn-ghost btn-icon h-8 w-8 p-0 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </>,
    document.body
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-surface-600 dark:text-surface-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>
          {cancelText}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          disabled={loading}
        >
          {loading ? '...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
