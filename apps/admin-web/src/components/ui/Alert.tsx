import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export interface AlertProps {
  tone?: 'error' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const toneStyles = {
  error: 'bg-rose-50 border-rose-200 text-rose-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-sky-50 border-sky-200 text-sky-800',
};

const defaultIcons = {
  error: <XCircle className="w-4 h-4 text-rose-600 shrink-0" />,
  success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />,
  info: <Info className="w-4 h-4 text-sky-600 shrink-0" />,
};

export function Alert({
  tone = 'error',
  children,
  icon,
  onClose,
  className = '',
}: AlertProps) {
  const activeIcon = icon || defaultIcons[tone];

  return (
    <div
      className={`alert my-3 p-3 rounded-lg border text-xs leading-relaxed flex items-center gap-2.5 ${toneStyles[tone]} ${className}`.trim()}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="flex items-center shrink-0">{activeIcon}</span>
      <div className="flex-1 min-w-0">{children}</div>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
