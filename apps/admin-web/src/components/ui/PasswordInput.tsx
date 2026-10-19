import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'type' | 'rightIcon'>;

/** Password field with a show / hide toggle. */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <Input ref={ref} type={visible ? 'text' : 'password'} className={`pr-10 ${className ?? ''}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
});
