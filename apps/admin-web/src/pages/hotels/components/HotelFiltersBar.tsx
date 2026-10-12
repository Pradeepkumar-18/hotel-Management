import { Search, SlidersHorizontal } from 'lucide-react';
import { Button, Input, Select } from '../../../components/ui';

interface HotelFiltersBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  locationFilter: string;
  onLocationChange: (val: string) => void;
  setupFilter: string;
  onSetupChange: (val: string) => void;
  timeFilter: string;
  onTimeChange: (val: string) => void;
  uniqueLocations: string[];
  onColumnsClick: () => void;
}

export function HotelFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  locationFilter,
  onLocationChange,
  setupFilter,
  onSetupChange,
  timeFilter,
  onTimeChange,
  uniqueLocations,
  onColumnsClick,
}: HotelFiltersBarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] max-w-md">
        <Input
          type="text"
          placeholder="Search by hotel name, slug, city or ID..."
          leftIcon={<Search size={15} />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
          <Select size="sm" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="SUSPENDED">Paused</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>

        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</span>
          <Select size="sm" value={locationFilter} onChange={(e) => onLocationChange(e.target.value)}>
            <option value="ALL">All locations</option>
            {uniqueLocations.map((loc) => (
              <option value={loc} key={loc}>
                {loc}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Setup</span>
          <Select size="sm" value={setupFilter} onChange={(e) => onSetupChange(e.target.value)}>
            <option value="ALL">All</option>
            <option value="COMPLETED">Completed (100%)</option>
            <option value="IN_PROGRESS">Action required (&lt;100%)</option>
          </Select>
        </div>

        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Updated</span>
          <Select size="sm" value={timeFilter} onChange={(e) => onTimeChange(e.target.value)}>
            <option value="ALL">Any time</option>
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This week</option>
            <option value="THIS_MONTH">This month</option>
          </Select>
        </div>

        <div className="self-end pt-3.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<SlidersHorizontal size={14} />}
            onClick={onColumnsClick}
            className="h-8"
          >
            Columns
          </Button>
        </div>
      </div>
    </div>
  );
}
