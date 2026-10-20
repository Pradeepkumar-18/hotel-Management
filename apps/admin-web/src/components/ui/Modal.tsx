import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  size?: 'small' | 'medium' | 'wide' | 'full';
  variant?: 'drawer' | 'dialog';
  className?: string;
  closeOnBackdrop?: boolean;
}

/** Open modals, oldest first. */
const openModals: symbol[] = [];

const sizeClasses = {
  small: 'max-w-md',
  medium: 'max-w-lg',
  wide: 'max-w-3xl',
  full: 'max-w-full',
};

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
  size,
  variant = 'drawer',
  className = '',
  closeOnBackdrop = true,
}: ModalProps) {
  // Escape closes only the top-most modal when one opens on top of another.
  const idRef = useRef(Symbol('modal'));
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const id = idRef.current;
    openModals.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === id) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openModals.splice(openModals.indexOf(id), 1);
    };
  }, []);

  const widthClass = size ? sizeClasses[size] : wide ? 'max-w-3xl' : 'max-w-lg';

  const isDialog = variant === 'dialog';

  return (
    <div
      className={cn(
        'modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity flex',
        isDialog ? 'items-center justify-center p-4' : 'justify-end'
      )}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={cn(
          'modal bg-white w-full overflow-hidden shadow-2xl z-50 flex flex-col',
          widthClass,
          isDialog ? 'rounded-2xl max-h-[90vh] border border-slate-200' : 'h-full',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header p-6 border-b border-slate-200 flex justify-between items-start sticky top-0 bg-white z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <div className="modal-body p-6 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <footer className="modal-footer p-4 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10 flex justify-end shrink-0">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
