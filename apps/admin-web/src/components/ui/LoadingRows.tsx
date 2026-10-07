export interface LoadingRowsProps {
  count?: number;
  className?: string;
  ariaLabel?: string;
}

export function LoadingRows({
  count = 3,
  className = '',
  ariaLabel = 'Loading data',
}: LoadingRowsProps) {
  return (
    <div
      className={`loading-rows border border-slate-200 bg-white rounded-xl p-4 space-y-3 ${className}`.trim()}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
