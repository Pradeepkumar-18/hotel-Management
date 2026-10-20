import { Hotel } from '../../../api';

/** "N of 5 steps done" / "Ready to publish" with a progress bar (from the server readiness check). */
export function HotelSetupProgress({ setup }: { setup: Hotel['setup'] }) {
  if (!setup) return <span className="text-xs text-slate-400">—</span>;
  const { done, total, ready } = setup;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{ready ? 'Ready to publish' : `${done} of ${total} steps done`}</span>
        <span className="text-slate-500 font-bold text-xs">{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${ready ? 'bg-emerald-600' : 'bg-amber-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
