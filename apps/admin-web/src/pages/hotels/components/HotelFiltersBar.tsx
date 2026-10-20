import { Search, LayoutGrid, List } from 'lucide-react';
import { Combobox, Input, Select, Tabs } from '../../../components/ui';
import { HotelStatus, STATUS_LABEL } from '../../../features/hotels/hotel-status';

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
  view: 'list' | 'cards';
  onViewChange: (view: 'list' | 'cards') => void;
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
  view,
  onViewChange,
}: HotelFiltersBarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3 w-full">
      {/* items-end: the search box lines up with the dropdown boxes, not their labels */}
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] max-w-md">
        <Input
          size="sm"
          type="search"
          maxLength={100}
          aria-label="Search hotels"
          placeholder="Search by hotel name, slug, city or ID..."
          leftIcon={<Search size={15} />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-2.5 w-full lg:w-auto">
        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
          <Select size="sm" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="ALL">All (excluding archived)</option>
            {(Object.keys(STATUS_LABEL) as HotelStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-0.5 min-w-[140px] sm:min-w-[160px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</span>
          <Combobox
            size="sm"
            aria-label="Filter by city"
            value={locationFilter}
            onChange={onLocationChange}
            options={[{ value: 'ALL', label: 'All locations' }, ...uniqueLocations.map((c) => ({ value: c, label: c }))]}
            selectedLabel={locationFilter === 'ALL' ? 'All locations' : locationFilter}
          />
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

        <div className="col-span-2 sm:col-span-1 self-end">
          <Tabs
            variant="pills"
            size="sm"
            activeId={view}
            onChange={(id) => onViewChange(id as 'list' | 'cards')}
            items={[
              { id: 'list', label: 'List', icon: <List size={14} /> },
              { id: 'cards', label: 'Cards', icon: <LayoutGrid size={14} /> },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
