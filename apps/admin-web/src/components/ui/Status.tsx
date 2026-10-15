import React from 'react';
import { AlertCircle, Archive, CheckCircle2, Clock, PauseCircle } from 'lucide-react';
import { humanStatus } from '../../utils/helpers';
import { cn } from '../../utils/cn';

export interface StatusProps {
  status: string;
  label?: string;
  tone?: 'published' | 'active' | 'draft' | 'suspended' | 'disabled' | 'archived' | 'custom';
  variant?: 'dot' | 'pill';
  className?: string;
  showDot?: boolean;
}

const pillConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  PUBLISHED: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    icon: <CheckCircle2 size={13} />,
  },
  SUSPENDED: {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-300',
    icon: <PauseCircle size={13} />,
  },
  ARCHIVED: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    icon: <Archive size={13} />,
  },
  NEEDS_SETUP: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    icon: <AlertCircle size={13} />,
  },
  DRAFT: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    icon: <Clock size={13} />,
  },
};

const dotToneStyles: Record<string, { bg: string; text: string; dot: string }> = {
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  draft: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  suspended: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  disabled: { bg: 'bg-slate-100', text: 'text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  custom: { bg: 'bg-slate-50', text: 'text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

export function Status({
  status,
  label,
  tone,
  variant = 'pill',
  className = '',
  showDot = true,
}: StatusProps) {
  const norm = status?.toUpperCase() || 'DRAFT';
  const displayText = label || humanStatus(status);

  if (variant === 'pill') {
    const config = pillConfig[norm] || pillConfig.DRAFT;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
          config.bg,
          config.text,
          config.border,
          className
        )}
      >
        {config.icon} {displayText}
      </span>
    );
  }

  const normalized = status.toLowerCase();
  const activeTone =
    tone ||
    (normalized.includes('publish') || normalized.includes('active')
      ? 'published'
      : normalized.includes('draft')
      ? 'draft'
      : normalized.includes('archive')
      ? 'archived'
      : 'disabled');
  const style = dotToneStyles[activeTone] || dotToneStyles.custom;

  return (
    <span
      className={cn(
        'status inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        style.bg,
        style.text,
        className
      )}
    >
      {showDot && <i className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} aria-hidden="true" />}
      {displayText}
    </span>
  );
}

export const StatusPill = (props: { status: string; className?: string }) => <Status {...props} variant="pill" />;
