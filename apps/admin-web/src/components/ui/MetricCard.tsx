import type { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value?: number | string;
  detail: string;
  icon: ReactNode;
  tone?: 'green' | 'teal' | 'sand' | 'slate' | 'amber' | 'red' | 'blue' | string;
  loading?: boolean;
  className?: string;
}

const toneMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  green: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-brand-hover', iconBg: 'bg-emerald-100 text-brand-primary' },
  teal: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-900', iconBg: 'bg-teal-100 text-teal-700' },
  sand: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900', iconBg: 'bg-amber-100 text-amber-800' },
  slate: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-800', iconBg: 'bg-slate-100 text-slate-600' },
  amber: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900', iconBg: 'bg-amber-100 text-amber-800' },
  red: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-900', iconBg: 'bg-rose-100 text-rose-700' },
  blue: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-900', iconBg: 'bg-sky-100 text-sky-700' },
};

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = 'green',
  loading = false,
  className = '',
}: MetricCardProps) {
  const styles = toneMap[tone] || toneMap.green;

  return (
    <article
      className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:shadow-xs ${styles.bg} ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 shadow-2xs ${styles.iconBg}`}>
          {icon}
        </span>
        <span className="text-sm font-bold text-ink-deep truncate tracking-tight">{label}</span>
      </div>
      <div>
        <strong className={`text-3xl font-extrabold tracking-tight block ${styles.text}`} aria-live="polite">
          {loading ? '—' : value ?? 0}
        </strong>
        <p className="text-xs font-medium leading-normal text-ink-muted mt-1 block overflow-hidden text-ellipsis whitespace-nowrap">{detail}</p>
      </div>
    </article>
  );
}
