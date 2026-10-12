import { Archive, Building2, Clock, Globe, PauseCircle } from 'lucide-react';

interface HotelSummaryCardsProps {
  total: number;
  statusCounts: Record<string, number> | null;
}

export function HotelSummaryCards({ total, statusCounts }: HotelSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {/* Total Hotels */}
      <div className="p-3.5 bg-white border border-[#e4e9e3] rounded-xl flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-xs font-semibold text-[#73827b]">Total Hotels</span>
          <strong className="text-2xl font-extrabold text-[#20322d] block mt-0.5">{total}</strong>
          <span className="text-xs text-[#1e6354] font-medium block mt-0.5">↑ All properties</span>
        </div>
        <span className="w-10 h-10 rounded-xl bg-[#e9f3ee] text-[#1e6354] flex items-center justify-center shrink-0 border border-[#c2dcd0]">
          <Building2 size={20} />
        </span>
      </div>

      {/* Published */}
      <div className="p-3.5 bg-[#f0f9ff] border border-[#bae6fd] rounded-xl flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-xs font-semibold text-[#0369a1]">Published</span>
          <strong className="text-2xl font-extrabold text-[#0c4a6e] block mt-0.5">{statusCounts?.PUBLISHED ?? 0}</strong>
          <span className="text-xs text-[#0284c7] font-medium block mt-0.5">Live on public catalog</span>
        </div>
        <span className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0 border border-[#7dd3fc]">
          <Globe size={20} />
        </span>
      </div>

      {/* Needs Setup */}
      <div className="p-3.5 bg-[#fff7ed] border border-[#fed7aa] rounded-xl flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-xs font-semibold text-[#c2410c]">Needs Setup</span>
          <strong className="text-2xl font-extrabold text-[#7c2d12] block mt-0.5">{statusCounts?.DRAFT ?? 0}</strong>
          <span className="text-xs text-[#ea580c] font-medium block mt-0.5">Action required</span>
        </div>
        <span className="w-10 h-10 rounded-xl bg-[#ffedd5] text-[#ea580c] flex items-center justify-center shrink-0 border border-[#fdba74]">
          <Clock size={20} />
        </span>
      </div>

      {/* Paused */}
      <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-xl flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-xs font-semibold text-[#b91c1c]">Paused</span>
          <strong className="text-2xl font-extrabold text-[#7f1d1d] block mt-0.5">{statusCounts?.SUSPENDED ?? 0}</strong>
          <span className="text-xs text-[#dc2626] font-medium block mt-0.5">Temporarily off</span>
        </div>
        <span className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0 border border-[#fca5a5]">
          <PauseCircle size={20} />
        </span>
      </div>

      {/* Archived */}
      <div className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-xs font-semibold text-[#475569]">Archived</span>
          <strong className="text-2xl font-extrabold text-[#0f172a] block mt-0.5">{statusCounts?.ARCHIVED ?? 0}</strong>
          <span className="text-xs text-[#64748b] font-medium block mt-0.5">No longer active</span>
        </div>
        <span className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#64748b] flex items-center justify-center shrink-0 border border-[#cbd5e1]">
          <Archive size={20} />
        </span>
      </div>
    </div>
  );
}
