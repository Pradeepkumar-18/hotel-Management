import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional second line, e.g. a city. */
  description?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  /**
   * For server-side search: called with the typed text, the parent updates `options`.
   * Without it, options are filtered locally.
   */
  onSearch?: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
  /** Label shown when `value` is not in `options` (e.g. a selection loaded separately). */
  selectedLabel?: string;
  emptyText?: ReactNode;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  /**
   * Free-text mode: the box holds whatever is typed (`value`), options are only suggestions.
   * Enter picks a suggestion only when one is highlighted with the arrow keys.
   */
  allowCustom?: boolean;
  /** Form field name / validation for the text box (useful with `allowCustom` inside a form). */
  name?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  isError?: boolean;
}

/** Searchable, keyboard-accessible single select (ARIA combobox pattern). */
export function Combobox({
  options,
  value,
  onChange,
  onSearch,
  loading = false,
  placeholder = 'Select…',
  selectedLabel,
  emptyText = 'No matches',
  size = 'md',
  disabled,
  className,
  'aria-label': ariaLabel,
  allowCustom = false,
  name,
  required,
  minLength,
  maxLength,
  isError = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const current = options.find((o) => o.value === value);
  const text = allowCustom ? value : query;
  const shown = onSearch || !text.trim()
    ? options
    : options.filter((o) => `${o.label} ${o.description ?? ''}`.toLowerCase().includes(text.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const openList = () => {
    setOpen(true);
    // In free-text mode nothing is highlighted until the user arrows down, so Enter keeps their text.
    setActive(allowCustom ? -1 : Math.max(0, shown.findIndex((o) => o.value === value)));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return openList();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (shown.length ? (i + step + shown.length) % shown.length : 0));
    } else if (e.key === 'Enter' && open) {
      if (shown[active]) {
        e.preventDefault();
        choose(shown[active]);
      } else if (allowCustom) {
        setOpen(false);
      } else {
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
        <input
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          disabled={disabled}
          name={name}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete="off"
          value={allowCustom ? value : open ? query : current?.label ?? selectedLabel ?? ''}
          placeholder={allowCustom ? placeholder : current?.label ?? selectedLabel ?? placeholder}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(e) => {
            if (allowCustom) onChange(e.target.value);
            else setQuery(e.target.value);
            setActive(allowCustom ? -1 : 0);
            setOpen(true);
            onSearch?.(e.target.value);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            'w-full bg-slate-50 border rounded-lg pl-8 pr-8 text-slate-800 placeholder:text-slate-500 transition-colors focus:outline-none focus:bg-white disabled:opacity-50',
            isError
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-300 hover:border-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
            size === 'sm' ? 'h-8 text-xs' : 'h-9 text-xs'
          )}
        />
        <ChevronDown size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
      </div>

      {open && (!allowCustom || loading || shown.length > 0) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1"
        >
          {loading && <li className="px-3 py-2 text-xs text-slate-400">Loading…</li>}
          {!loading && shown.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">{emptyText}</li>}
          {!loading &&
            shown.map((option, i) => (
              <li
                key={option.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(option)}
                className={cn(
                  'px-3 py-2 text-xs cursor-pointer',
                  i === active && 'bg-slate-100',
                  option.value === value ? 'font-semibold text-brand-primary' : 'text-slate-700'
                )}
              >
                <span className="block truncate">{option.label}</span>
                {option.description && <span className="block text-[11px] text-slate-400 truncate">{option.description}</span>}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
