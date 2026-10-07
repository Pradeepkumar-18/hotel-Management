import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  copy: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  copy,
  action,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state flex flex-col items-center justify-center text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50 ${
        compact ? 'p-6 min-h-[180px]' : 'p-10 min-h-[260px]'
      } ${className}`.trim()}
    >
      <span className="w-12 h-12 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-3 shrink-0">
        {icon}
      </span>
      <h2 className="text-base font-bold text-slate-800 tracking-tight mb-1">{title}</h2>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">{copy}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
