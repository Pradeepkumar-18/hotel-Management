import React from 'react';

export interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  align?: 'left' | 'between';
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
  className = '',
  align = 'between',
}: PageHeadingProps) {
  return (
    <div
      className={`page-heading flex flex-col md:flex-row md:items-end ${align === 'between' ? 'justify-between' : 'justify-start'} gap-4 mb-5 ${className}`.trim()}
    >
      <div>
        {eyebrow && <div className="eyebrow text-xs font-bold tracking-wider text-slate-400 uppercase mb-1">{eyebrow}</div>}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="page-heading-action shrink-0">{action}</div>}
    </div>
  );
}
