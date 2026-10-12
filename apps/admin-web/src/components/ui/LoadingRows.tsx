export interface LoadingRowsProps {
  count?: number;
  rows?: number;
  className?: string;
  ariaLabel?: string;
}

export function LoadingRows({
  count = 3,
  rows,
  className = '',
  ariaLabel = 'Loading data',
}: LoadingRowsProps) {
  const finalCount = rows !== undefined ? rows : count;
  return (
    <div
      className={`loading-rows border border-slate-200 bg-white rounded-xl p-4 space-y-3 ${className}`.trim()}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
    >
      {Array.from({ length: finalCount }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
