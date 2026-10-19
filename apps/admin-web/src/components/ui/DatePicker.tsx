import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DatePickerProps {
  /** Form field name; the value is submitted as YYYY-MM-DD. */
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Inclusive bounds, YYYY-MM-DD. */
  min?: string;
  max?: string;
  /** "Today" for the Today shortcut (e.g. the property's local date). Defaults to the browser date. */
  today?: string;
  required?: boolean;
  disabled?: boolean;
  isError?: boolean;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (iso?: string) => {
  const match = iso && /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) } : null;
};
const browserToday = () => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};
const formatLabel = (iso: string) => {
  const p = parse(iso);
  return p
    ? new Date(Date.UTC(p.y, p.m, p.d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '';
};

/** Calendar date picker (no native date input), submits YYYY-MM-DD. */
export function DatePicker({
  name,
  value,
  defaultValue = '',
  onChange,
  min,
  max,
  today,
  required,
  disabled,
  isError,
  placeholder = 'Select a date',
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [inner, setInner] = useState(defaultValue);
  const selected = value ?? inner;
  const todayIso = today ?? browserToday();
  const start = parse(selected) ?? parse(todayIso)!;
  const [view, setView] = useState({ y: start.y, m: start.m });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (iso: string) => {
    if (value === undefined) setInner(iso);
    onChange?.(iso);
    setOpen(false);
  };
  const outOfRange = (iso: string) => Boolean((min && iso < min) || (max && iso > max));
  const shiftMonth = (delta: number) =>
    setView(({ y, m }) => ({ y: m + delta < 0 ? y - 1 : m + delta > 11 ? y + 1 : y, m: (m + delta + 12) % 12 }));

  const firstWeekday = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div ref={rootRef} className={cn('relative w-full', className)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => {
          const p = parse(selected) ?? parse(todayIso)!;
          setView({ y: p.y, m: p.m });
          setOpen((o) => !o);
        }}
        className={cn(
          'w-full h-9 px-3.5 text-xs rounded-lg border bg-slate-50 flex items-center justify-between gap-2 text-left transition-colors focus:outline-none focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed',
          isError
            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-slate-300 hover:border-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
        )}
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>{selected ? formatLabel(selected) : placeholder}</span>
        <CalendarDays size={14} className="text-slate-400 shrink-0" />
      </button>
      {/* Real input so the form submits the value and native "required" validation still works. */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        name={name}
        value={selected}
        required={required}
        disabled={disabled}
        onChange={() => undefined}
      />

      {open && (
        <div id={dialogId} role="dialog" aria-label="Choose date" className="absolute z-30 mt-1 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="p-1 rounded hover:bg-slate-100 text-slate-500">
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-semibold text-slate-800">
              {new Date(Date.UTC(view.y, view.m, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="p-1 rounded hover:bg-slate-100 text-slate-500">
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-slate-400 py-1">{d}</span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} />;
              const iso = toIso(view.y, view.m, day);
              const isSelected = iso === selected;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={outOfRange(iso)}
                  onClick={() => pick(iso)}
                  aria-pressed={isSelected}
                  aria-label={formatLabel(iso)}
                  className={cn(
                    'h-8 text-xs rounded-md transition-colors disabled:text-slate-300 disabled:cursor-not-allowed',
                    isSelected ? 'bg-brand-primary text-white font-semibold' : 'text-slate-700 hover:bg-slate-100',
                    iso === todayIso && !isSelected && 'ring-1 ring-brand-primary/40'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {!outOfRange(todayIso) && (
            <button type="button" onClick={() => pick(todayIso)} className="mt-2 w-full text-xs font-semibold text-brand-primary hover:underline">
              Today
            </button>
          )}
        </div>
      )}
    </div>
  );
}
