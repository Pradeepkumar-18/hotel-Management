import React from 'react';

export interface FieldProps {
  label?: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  fullWidth?: boolean;
}

export function Field({
  label,
  children,
  required,
  error,
  hint,
  className = '',
  fullWidth = false,
}: FieldProps) {
  return (
    <div className={`field flex flex-col gap-1.5 min-w-0 ${fullWidth ? 'col-span-full' : ''} ${className}`.trim()}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <small className="text-[11px] text-slate-500">{hint}</small>}
      {error && <small className="text-[11px] text-rose-600 font-medium" role="alert">{error}</small>}
    </div>
  );
}
