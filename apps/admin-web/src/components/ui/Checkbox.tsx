import React, { useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Shows a dash instead of a tick (e.g. "some rows selected"). */
  indeterminate?: boolean;
  label?: React.ReactNode;
}

/** Styled checkbox; keeps a real (visually hidden) input for forms, keyboard and screen readers. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate = false, label, className, disabled, checked, ...props },
  forwardedRef
) {
  const innerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const setRefs = (node: HTMLInputElement | null) => {
    (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const on = Boolean(checked) || indeterminate;

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 text-xs text-slate-700 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
    >
      <input ref={setRefs} type="checkbox" className="peer sr-only" disabled={disabled} checked={checked} {...props} />
      <span
        aria-hidden="true"
        className={cn(
          'w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary/30',
          on ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-slate-300'
        )}
      >
        {indeterminate ? <Minus size={11} strokeWidth={3} /> : checked ? <Check size={11} strokeWidth={3} /> : null}
      </span>
      {label && <span>{label}</span>}
    </label>
  );
});
