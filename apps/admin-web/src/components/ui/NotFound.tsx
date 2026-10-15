import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export interface NotFoundProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionTo?: string;
  action?: React.ReactNode;
}

export function NotFound({
  title = 'Item Not Found',
  description = 'The property, room type, or resource you selected does not exist or was removed.',
  actionText = 'Return to Properties',
  actionTo = '/admin/hotels',
  action,
}: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-line rounded-2xl shadow-2xs space-y-3">
      <span className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
        <Compass size={24} />
      </span>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="text-xs text-ink-muted max-w-sm">{description}</p>
      <div className="pt-2">
        {action || (
          <Link
            to={actionTo}
            className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
          >
            {actionText}
          </Link>
        )}
      </div>
    </div>
  );
}
