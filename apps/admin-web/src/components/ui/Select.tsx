import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  isError?: boolean;
}

const sizeClasses = {
  sm: 'h-8 pl-2.5 pr-8 text-xs rounded-md',
  md: 'h-9 pl-3.5 pr-9 text-xs rounded-lg',
  lg: 'h-11 pl-4 pr-10 text-sm rounded-xl',
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ size = 'md', isError = false, className = '', disabled, children, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full bg-slate-50 border appearance-none transition-colors duration-150 text-slate-800 focus:outline-none focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
            isError
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-300 hover:border-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="absolute right-2.5 text-slate-400 pointer-events-none flex items-center">
          <ChevronDown size={15} />
        </span>
      </div>
    );
  }
);

Select.displayName = 'Select';
