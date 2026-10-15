export interface KpiItem {
  label: string;
  value?: number | string;
  detail?: string;
  subtext?: string;
}

export interface KpiStripProps {
  items: KpiItem[];
  loading?: boolean;
  className?: string;
}

export function KpiStrip({ items, loading = false, className = '' }: KpiStripProps) {
  return (
    <section
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-7 ${className}`.trim()}
      aria-label="Key performance indicators"
    >
      {items.map((item) => (
        <article
          className="p-4.5 bg-paper border border-line rounded-xl flex flex-col gap-1.5 shadow-2xs hover:border-brand-border transition-colors"
          key={item.label}
        >
          <span className="text-sm font-bold text-ink-deep truncate tracking-tight">{item.label}</span>
          <strong className="text-2xl font-extrabold text-ink tracking-tight" aria-live="polite">
            {loading || item.value === undefined ? '—' : item.value}
          </strong>
          <p className="text-xs font-medium leading-normal text-ink-muted overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
            {item.detail || item.subtext}
          </p>
        </article>
      ))}
    </section>
  );
}
