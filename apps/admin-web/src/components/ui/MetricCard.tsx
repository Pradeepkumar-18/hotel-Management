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
  green: { bg: 'bg-[#edf6f2] border-[#c9dfd4]', text: 'text-[#164d42]', iconBg: 'bg-[#d0e5dc] text-[#1e6354]' },
  teal: { bg: 'bg-[#edf7f5] border-[#c6e5e0]', text: 'text-[#164d47]', iconBg: 'bg-[#ccebe6] text-[#1e635c]' },
  sand: { bg: 'bg-[#fcf7ee] border-[#eee1c9]', text: 'text-[#5c441b]', iconBg: 'bg-[#f5e7ce] text-[#856123]' },
  slate: { bg: 'bg-[#f4f6f4] border-[#e1e6e2]', text: 'text-[#2b3c34]', iconBg: 'bg-[#e2e8e4] text-[#55695f]' },
  amber: { bg: 'bg-[#fcf7ee] border-[#eee1c9]', text: 'text-[#5c441b]', iconBg: 'bg-[#f5e7ce] text-[#856123]' },
  red: { bg: 'bg-[#fbefed] border-[#f2cfcb]', text: 'text-[#823933]', iconBg: 'bg-[#f5d9d5] text-[#a54d47]' },
  blue: { bg: 'bg-[#f0f6fa] border-[#cae0ee]', text: 'text-[#1f4a66]', iconBg: 'bg-[#d6e7f2] text-[#2c6c94]' },
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
        <span className="text-sm font-bold text-[#45584e] truncate tracking-tight">{label}</span>
      </div>
      <div>
        <strong className={`text-3xl font-extrabold tracking-tight block ${styles.text}`} aria-live="polite">
          {loading ? '—' : value ?? 0}
        </strong>
        <p className="text-xs font-medium leading-normal text-[#6b7c73] mt-1 block overflow-hidden text-ellipsis whitespace-nowrap">{detail}</p>
      </div>
    </article>
  );
}
