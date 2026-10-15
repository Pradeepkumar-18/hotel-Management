import { Link } from 'react-router-dom';
import { Compass, ShieldAlert } from 'lucide-react';

export function AccessPage({ kind, home = '/admin/dashboard' }: { kind: 'unauthorized' | 'not-found'; home?: string }) {
  const unauthorized = kind === 'unauthorized';
  return (
    <div className="access-page min-h-[calc(100vh-160px)] flex items-center justify-center p-6">
      <div className="access-card w-full max-w-md p-8 md:p-10 text-center bg-white border border-line rounded-2xl shadow-xl space-y-4">
        <span
          className={`access-icon w-14 h-14 mx-auto flex items-center justify-center rounded-2xl ${
            unauthorized ? 'bg-amber-100/70 text-amber-800' : 'bg-emerald-100/70 text-emerald-800'
          }`}
        >
          {unauthorized ? <ShieldAlert size={28} /> : <Compass size={28} />}
        </span>
        <span className="eyebrow text-xs font-bold tracking-widest text-slate-400 uppercase block">
          {unauthorized ? '403 · NO ACCESS' : '404 · NOT FOUND'}
        </span>
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          {unauthorized ? 'No access to this section' : 'Page not found'}
        </h1>
        <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
          {unauthorized
            ? 'Your staff account lacks permission or scope to access this property or action. If you believe this is an error, request access from your Staywise administrator.'
            : 'The address may be incorrect, or this page has been moved.'}
        </p>
        <div className="pt-2">
          <Link
            className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
            to={home}
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
