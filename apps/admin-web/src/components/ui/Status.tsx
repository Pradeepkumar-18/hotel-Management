import { humanStatus } from '../../utils/helpers';

export interface StatusProps {
  status: string;
  label?: string;
  tone?: 'published' | 'active' | 'draft' | 'suspended' | 'disabled' | 'custom';
  className?: string;
  showDot?: boolean;
}

const toneStyles: Record<string, { bg: string; text: string; dot: string }> = {
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  draft: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  suspended: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  disabled: { bg: 'bg-slate-100', text: 'text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  custom: { bg: 'bg-slate-50', text: 'text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

export function Status({
  status,
  label,
  tone,
  className = '',
  showDot = true,
}: StatusProps) {
  const normalized = status.toLowerCase();
  const activeTone = tone || (normalized.includes('publish') || normalized.includes('active') ? 'published' : normalized.includes('draft') ? 'draft' : 'disabled');
  const style = toneStyles[activeTone] || toneStyles.custom;
  const displayText = label || humanStatus(status);

  return (
    <span
      className={`status inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style.bg} ${style.text} ${className}`.trim()}
    >
      {showDot && <i className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />}
      {displayText}
    </span>
  );
}
