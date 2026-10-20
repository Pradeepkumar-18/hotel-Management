import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { PublishProblem } from '../../api';

/**
 * Small info icon next to Publish. Hover or click shows what is still needed
 * before the hotel can be published (from the server readiness check).
 */
export function PublishBlockersInfo({ problems }: { problems: PublishProblem[] }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupId = useId();
  const open = hovered || pinned;

  // A click keeps it open; clicking elsewhere or pressing Escape closes it.
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [pinned]);

  if (problems.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-expanded={open}
        aria-controls={popupId}
        aria-label={`${problems.length} ${problems.length === 1 ? 'item' : 'items'} still needed before you can publish`}
        className="inline-flex items-center gap-1 h-8 px-2 rounded-lg text-amber-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
      >
        <Info size={16} />
        <span className="text-xs font-semibold">{problems.length}</span>
      </button>

      {open && (
        <div
          id={popupId}
          role="tooltip"
          className="absolute right-0 top-full pt-2 z-30 w-72"
        >
          {/* pt-2 keeps the gap hoverable so the pop-up stays open when the mouse moves onto it */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-lg text-xs">
          <b className="block mb-1.5 text-slate-900">Still needed before you can publish</b>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            {problems.map((p) => (
              <li key={p.code}>{p.message}</li>
            ))}
          </ul>
          </div>
        </div>
      )}
    </div>
  );
}
