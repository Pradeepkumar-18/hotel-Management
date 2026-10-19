import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
  /** Shows "used / maxLength" under the box. Needs `maxLength`. */
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ isError = false, className = '', disabled, showCount = false, onChange, ...props }, ref) => {
    const [length, setLength] = useState(() => String(props.value ?? props.defaultValue ?? '').length);
    const used = props.value !== undefined ? String(props.value).length : length;

    const textarea = (
      <textarea
        ref={ref}
        disabled={disabled}
        onChange={(e) => {
          setLength(e.target.value.length);
          onChange?.(e);
        }}
        className={cn(
          'w-full p-3 text-xs bg-slate-50 border rounded-lg transition-colors duration-150 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed',
          isError
            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-slate-300 hover:border-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
          className
        )}
        {...props}
      />
    );

    if (!showCount || !props.maxLength) return textarea;
    return (
      <div className="w-full">
        {textarea}
        <div className="text-right text-[10px] text-slate-400 mt-0.5" aria-live="polite">
          {used} / {props.maxLength}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
