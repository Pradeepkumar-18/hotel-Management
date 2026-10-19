import { Archive, Building2, Clock, Globe, PauseCircle } from 'lucide-react';
import { MetricCard } from '../../../components/ui/MetricCard';

interface HotelSummaryCardsProps {
  total: number;
  statusCounts: Record<string, number> | null;
}

export function HotelSummaryCards({ total, statusCounts }: HotelSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
      <MetricCard
        label="Active Hotels"
        value={total}
        detail="↑ 2 this month"
        icon={<Building2 size={16} />}
        tone="green"
      />
      <MetricCard
        label="Published"
        value={statusCounts?.PUBLISHED ?? 0}
        detail="Live on public catalog"
        icon={<Globe size={16} />}
        tone="blue"
      />
      <MetricCard
        label="Needs Setup"
        value={statusCounts?.DRAFT ?? 0}
        detail="Action required"
        icon={<Clock size={16} />}
        tone="amber"
      />
      <MetricCard
        label="Paused"
        value={statusCounts?.SUSPENDED ?? 0}
        detail="Temporarily off"
        icon={<PauseCircle size={16} />}
        tone="red"
      />
      <MetricCard
        label="Archived"
        value={statusCounts?.ARCHIVED ?? 0}
        detail="Hidden from list · use Archived filter"
        icon={<Archive size={16} />}
        tone="slate"
      />
    </div>
  );
}
