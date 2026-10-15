import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  rightContent?: ReactNode;
  className?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { items, activeId, onChange, variant = 'underline', rightContent, className },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between border-b border-slate-200 gap-4',
        variant === 'pills' && 'border-b-0 p-1 bg-slate-100/80 rounded-xl',
        className
      )}
    >
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn('flex items-center gap-1 sm:gap-2 flex-wrap', variant === 'underline' && '-mb-px')}
      >
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => {
                if (!tab.disabled && tab.id !== activeId) {
                  onChange(tab.id);
                }
              }}
              className={cn(
                'group relative inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none',
                variant === 'underline' && [
                  'rounded-b-none border-b-2 font-medium',
                  isActive
                    ? 'border-brand-primary text-brand-primary font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300',
                ],
                variant === 'pills' && [
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
                ],
                tab.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {tab.icon && (
                <span
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-brand-primary' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                >
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none transition-colors',
                    isActive
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  )}
                >
                  {tab.badge}
                </span>
              )}
              {tab.closable && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Close ${tab.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    tab.onClose?.();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      tab.onClose?.();
                    }
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {rightContent && <div className="shrink-0 flex items-center">{rightContent}</div>}
    </div>
  );
});
