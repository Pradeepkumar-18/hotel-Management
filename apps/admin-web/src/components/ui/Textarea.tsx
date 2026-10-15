import React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ isError = false, className = '', disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
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
  }
);

Textarea.displayName = 'Textarea';
