import { Link } from 'react-router-dom';
import { Compass, ShieldCheck } from 'lucide-react';

export function AccessPage({ kind, home }: { kind: 'unauthorized' | 'not-found'; home: string }) {
  const unauthorized = kind === 'unauthorized';
  return (
    <div className="access-page min-h-[calc(100vh-160px)] flex items-center justify-center p-6">
      <div className="access-card w-full max-w-md p-8 md:p-10 text-center bg-white border border-slate-200 rounded-2xl shadow-xl space-y-4">
        <span className={`access-icon w-14 h-14 mx-auto flex items-center justify-center rounded-2xl ${unauthorized ? 'bg-amber-100/70 text-amber-800' : 'bg-emerald-100/70 text-emerald-800'}`}>
          {unauthorized ? <ShieldCheck size={28} /> : <Compass size={28} />}
        </span>
        <span className="eyebrow text-xs font-bold tracking-widest text-slate-400 uppercase block">{unauthorized ? 'ACCESS RESTRICTED' : 'PAGE NOT FOUND'}</span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{unauthorized ? 'You don’t have access to this page' : 'This page can’t be found'}</h1>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          {unauthorized
            ? 'Your staff account does not have the required permission. If you believe this is a mistake, contact your Staywise administrator.'
            : 'The address may be incorrect, or this page may have moved.'}
        </p>
        <div className="pt-2">
          <Link className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs" to={home}>
            {unauthorized ? 'Return to your workspace' : 'Go to your workspace'}
          </Link>
        </div>
      </div>
    </div>
  );
}
