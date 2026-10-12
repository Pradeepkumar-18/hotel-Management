import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  isError?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-8 px-2.5 text-xs rounded-md',
  md: 'h-9 px-3.5 text-xs rounded-lg',
  lg: 'h-11 px-4 text-sm rounded-xl',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size = 'md', isError = false, leftIcon, rightIcon, className = '', disabled, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 flex items-center pointer-events-none select-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full bg-slate-50 border transition-colors duration-150 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed',
            isError
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-300 hover:border-slate-400 focus:border-[#1e6354] focus:ring-2 focus:ring-[#1e6354]/20',
            sizeClasses[size],
            leftIcon ? 'pl-9' : '',
            rightIcon ? 'pr-9' : '',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-slate-400 flex items-center pointer-events-none select-none">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
