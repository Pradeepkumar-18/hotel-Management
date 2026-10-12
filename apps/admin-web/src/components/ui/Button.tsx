import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  busy?: boolean;
  loadingLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-[#1e6354] hover:bg-[#164d42] active:bg-[#0f3d34] text-white border-transparent shadow-xs focus-visible:ring-[#1e6354]',
  secondary: 'bg-[#e9f3ee] hover:bg-[#d5e8de] text-[#164d42] border-[#c2dcd0] focus-visible:ring-[#1e6354]',
  outline: 'bg-white hover:bg-[#f6f8f5] text-[#42564c] border-[#d8e0da] shadow-2xs focus-visible:ring-[#1e6354]',
  ghost: 'bg-transparent hover:bg-[#edf2ee] text-[#63736a] border-transparent focus-visible:ring-[#1e6354]',
  danger: 'bg-[#a54d47] hover:bg-[#91433d] text-white border-transparent shadow-xs focus-visible:ring-[#a54d47]',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3.5 py-1.5 text-xs font-semibold rounded-md gap-2 min-h-[36px]',
  md: 'px-4.5 py-2.5 text-sm font-semibold rounded-lg gap-2.5 min-h-[42px]',
  lg: 'px-6 py-3 text-base font-semibold rounded-xl gap-3 min-h-[48px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      busy = false,
      loadingLabel,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const clickLock = useRef(false);
    const [clickBusy, setClickBusy] = useState(false);
    const isBusy = isLoading || busy || clickBusy;

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      if (isBusy || disabled) {
        event.preventDefault();
        return;
      }
      if (!onClick) return;
      if (clickLock.current) {
        event.preventDefault();
        return;
      }

      clickLock.current = true;
      try {
        const result = onClick(event);
        if (result && typeof (result as Promise<void>).then === 'function') {
          setClickBusy(true);
          void Promise.resolve(result).finally(() => {
            clickLock.current = false;
            setClickBusy(false);
          });
        } else {
          clickLock.current = false;
        }
      } catch (err) {
        clickLock.current = false;
        setClickBusy(false);
        throw err;
      }
    };

    const baseClasses =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isBusy}
        aria-busy={isBusy || undefined}
        onClick={handleClick}
        className={cn(baseClasses, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        <span className="truncate">{isBusy && loadingLabel ? loadingLabel : children}</span>
        {!isBusy && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
