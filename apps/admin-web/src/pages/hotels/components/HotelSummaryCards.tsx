import { Archive, Building2, Clock, Globe, PauseCircle } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

interface HotelSummaryCardsProps {
  total: number;
  statusCounts: Record<string, number> | null;
}

export function HotelSummaryCards({ total, statusCounts }: HotelSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <MetricCard
        label="Total Hotels"
        value={total}
        detail="↑ All properties"
        icon={<Building2 size={20} />}
        tone="green"
      />
      <MetricCard
        label="Published"
        value={statusCounts?.PUBLISHED ?? 0}
        detail="Live on public catalog"
        icon={<Globe size={20} />}
        tone="blue"
      />
      <MetricCard
        label="Needs Setup"
        value={statusCounts?.DRAFT ?? 0}
        detail="Action required"
        icon={<Clock size={20} />}
        tone="amber"
      />
      <MetricCard
        label="Paused"
        value={statusCounts?.SUSPENDED ?? 0}
        detail="Temporarily off"
        icon={<PauseCircle size={20} />}
        tone="red"
      />
      <MetricCard
        label="Archived"
        value={statusCounts?.ARCHIVED ?? 0}
        detail="No longer active"
        icon={<Archive size={20} />}
        tone="slate"
      />
    </div>
  );
}

