import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface LoaderProps {
  label?: string;
  size?: number;
  className?: string;
}

export function Loader({ label = 'Loading…', size = 20, className }: LoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 gap-3 text-slate-500', className)}>
      <LoaderCircle size={size} className="animate-spin text-brand-primary" />
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
    </div>
  );
}
