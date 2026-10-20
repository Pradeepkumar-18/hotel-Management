import { CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { HotelReadiness, SetupStepKey } from './hotels.api';

export type WorkspaceTab = SetupStepKey;

const STEPS: Array<{ key: WorkspaceTab; label: string }> = [
  { key: 'hotel', label: 'Hotel & photos' },
  { key: 'rooms', label: 'Room types' },
  { key: 'rates', label: 'Rates' },
  { key: 'availability', label: 'Availability' },
  { key: 'cancellation', label: 'Cancellation' },
];

interface HotelSetupChecklistProps {
  readiness: HotelReadiness | null;
  activeTab: WorkspaceTab;
  onSelect: (tab: WorkspaceTab) => void;
  counts?: Partial<Record<WorkspaceTab, number>>;
}

/** Numbered setup steps that double as the workspace tabs. Ticks come from the server's publish rules. */
export function HotelSetupChecklist({ readiness, activeTab, onSelect, counts = {} }: HotelSetupChecklistProps) {
  return (
    <nav
      aria-label="Hotel setup steps"
      className="p-2 sm:p-2.5 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-2xs"
    >
      <div className="flex items-center gap-2 px-1 sm:pl-2 shrink-0">
        <span className="w-6 h-6 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
          <Sparkles size={13} />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {readiness ? (readiness.ready ? 'Ready to publish' : `Setup ${readiness.done} of ${readiness.total}`) : 'Setup'}
        </span>
      </div>

      <div role="tablist" className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-1.5 w-full lg:w-auto">
        {STEPS.map((step, i) => {
          const info = readiness?.steps.find((s) => s.key === step.key);
          const done = Boolean(info?.done);
          const active = activeTab === step.key;
          const hint = info && !done && info.problems.length ? info.problems.map((p) => p.message).join(' · ') : undefined;
          return (
            <button
              key={step.key}
              type="button"
              role="tab"
              id={`tab-${step.key}`}
              aria-selected={active}
              aria-controls={`panel-${step.key}`}
              title={hint}
              onClick={() => onSelect(step.key)}
              className={cn(
                'flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                active ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 ring-2 ring-brand-primary/10' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              )}
            >
              {done ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" aria-label="done" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" aria-label="to do" />
              )}
              <span className="truncate">{i + 1}. {step.label}</span>
              {counts[step.key] !== undefined && counts[step.key]! > 0 && (
                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md font-semibold">{counts[step.key]}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
