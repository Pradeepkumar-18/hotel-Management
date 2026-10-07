export interface KpiItem {
  label: string;
  value?: number | string;
  detail: string;
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
      {items.map(item => (
        <article className="p-4.5 bg-white border border-[#e4e9e3] rounded-xl flex flex-col gap-1.5 shadow-2xs hover:border-[#c9dfd4] transition-colors" key={item.label}>
          <span className="text-sm font-bold text-[#40534a] truncate tracking-tight">{item.label}</span>
          <strong className="text-2xl font-extrabold text-[#20322d] tracking-tight" aria-live="polite">
            {loading || item.value === undefined ? '—' : item.value}
          </strong>
          <p className="text-xs font-medium leading-normal text-[#75837b] overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
