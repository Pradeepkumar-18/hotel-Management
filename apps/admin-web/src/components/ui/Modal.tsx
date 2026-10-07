import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  size?: 'small' | 'medium' | 'wide' | 'full';
  className?: string;
  closeOnBackdrop?: boolean;
}

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
  wide = false,
  size,
  className = '',
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const widthClass = size ? sizeClasses[size] : wide ? 'max-w-3xl' : 'max-w-lg';

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 flex justify-end transition-opacity"
      onMouseDown={e => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`modal bg-white w-full ${widthClass} h-full overflow-y-auto shadow-2xl z-50 flex flex-col ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header p-6 border-b border-slate-200 flex justify-between items-start sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>
        <div className="modal-body p-6 flex-1 overflow-y-auto">{children}</div>
      </section>
    </div>
  );
}
