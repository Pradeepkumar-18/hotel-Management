import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  Upload,
  Globe,
  Clock,
  PauseCircle,
  Archive,
  MapPin,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Image,
  Check,
  X
} from 'lucide-react';
import { Hotel, request, StaffMe, bulkUpdateHotelStatus } from '../../api';
import { AsyncButton, useToast } from '../../ui-feedback';
import { PageHeading, Button, DataTable, Column } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { HotelCreateModal } from '../../features/hotels/HotelCreateModal';
import { HotelWorkspace } from '../../features/hotels/HotelWorkspace';
import { HotelMediaModal } from '../../features/hotels/HotelMediaModal';

type HotelList = { items: Hotel[]; total: number };

export function HotelsPage({ staff }: { staff: StaffMe }) {
  const toast = useToast();
  const [data, setData] = useState<HotelList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Hotel | null>(null);
  const [mediaTargetHotel, setMediaTargetHotel] = useState<Hotel | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number> | null>(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [setupFilter, setSetupFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


  // Pagination State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = ['PUBLISHED', 'DRAFT', 'SUSPENDED', 'ARCHIVED'];
      const [all, ...counts] = await Promise.all([
        request<HotelList>('/admin/hotels?limit=100&offset=0'),
        ...statuses.map(status => request<HotelList>(`/admin/hotels?status=${status}&limit=1&offset=0`)),
      ]);
      setData(all);
      setStatusCounts(Object.fromEntries(statuses.map((status, index) => [status, counts[index].total])));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load hotels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canCreate = staff.permissions.includes('hotels.create');

  // Filter logic
  const filteredHotels = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter(h => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = h.name.toLowerCase().includes(q);
        const slugMatch = h.slug.toLowerCase().includes(q);
        const cityMatch = h.address?.city?.toLowerCase().includes(q);
        const idMatch = readId(h).toLowerCase().includes(q);
        if (!nameMatch && !slugMatch && !cityMatch && !idMatch) return false;
      }
      // Status
      if (statusFilter !== 'ALL' && h.status !== statusFilter) {
        return false;
      }
      // Location
      if (locationFilter !== 'ALL' && h.address?.city !== locationFilter) {
        return false;
      }
      return true;
    });
  }, [data?.items, searchQuery, statusFilter, locationFilter]);

  // Unique locations list for dropdown
  const uniqueLocations = useMemo(() => {
    if (!data?.items) return [];
    const set = new Set<string>();
    data.items.forEach(h => {
      if (h.address?.city) set.add(h.address.city);
    });
    return Array.from(set);
  }, [data?.items]);

  // Pagination slicing
  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHotels.slice(start, start + pageSize);
  }, [filteredHotels, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredHotels.length / pageSize) || 1;

  // Checkbox toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedHotels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedHotels.map(h => readId(h))));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper for setup progress calculation
  const getSetupProgress = (h: Hotel) => {
    let completed = 1; // 1: property basic details created
    if (h.timezone && h.address?.city) completed++; // 2: address & timezone configured
    if (h.status === 'PUBLISHED' || h.status === 'DRAFT') completed++; // 3: status defined
    if (h.status === 'PUBLISHED') completed = 5; // 5: fully ready & published
    else if (completed < 4) completed = 3;

    const percent = Math.min(100, Math.round((completed / 5) * 100));
    return { completed, total: 5, percent };
  };

  // Bulk status update handler
  const handleBulkStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    try {
      const ids = Array.from(selectedIds);
      const res = await bulkUpdateHotelStatus(ids, status, `Bulk action by ${staff.user.email}`);
      toast.success(`Successfully updated status for ${res.modifiedCount} hotel(s).`);
      setSelectedIds(new Set());
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update selected hotels.');
    }
  };

  // Reusable Columns Definition for DataTable
  const columns: Column<Hotel>[] = [
    {
      key: 'checkbox',
      header: (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-slate-300 text-[#1e6354] focus:ring-[#1e6354] cursor-pointer"
          checked={selectedIds.size === paginatedHotels.length && paginatedHotels.length > 0}
          onChange={toggleSelectAll}
        />
      ),
      cell: (h) => (
        <div onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-[#1e6354] focus:ring-[#1e6354] cursor-pointer"
            checked={selectedIds.has(readId(h))}
            onChange={() => toggleSelectRow(readId(h))}
          />
        </div>
      ),
      align: 'center',
      headerClassName: 'w-10',
    },
    {
      key: 'hotel',
      header: 'Hotel',
      cell: (h) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div
            className="w-10 h-10 rounded-lg bg-[#e9f3ee] text-[#1e6354] flex items-center justify-center shrink-0 border border-[#c2dcd0] overflow-hidden relative shadow-2xs cursor-pointer group"
            onClick={e => {
              e.stopPropagation();
              setMediaTargetHotel(h);
            }}
            title="Click to manage photo gallery"
          >
            {h.primaryImage || h.heroImage ? (
              <img
                src={h.primaryImage || h.heroImage}
                alt={h.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <Building2 size={20} className="text-[#1e6354]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <b className="font-bold text-[#20322d] text-sm truncate">{h.name}</b>
            <span className="text-xs text-[#73827b] font-mono leading-normal">/{h.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (h) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <MapPin size={15} className="text-[#73827b] shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#33483e] leading-snug">
              {h.address?.city || 'Not set'}, {h.address?.countryCode || 'IN'}
            </span>
            <span className="text-xs text-[#89958e] leading-normal font-mono">
              {h.address?.postalCode || '626123'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (h) => <StatusPill status={h.status} />,
    },
    {
      key: 'setup',
      header: 'Setup Progress',
      cell: (h) => {
        const progress = getSetupProgress(h);
        return (
          <div className="flex flex-col gap-1 w-36 whitespace-nowrap">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#73827b] font-medium">{progress.completed} of 5 completed</span>
              <span className="font-bold text-[#20322d]">{progress.percent}%</span>
            </div>
            <div className="w-full h-2 bg-[#e4e9e3] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  progress.percent === 100
                    ? 'bg-[#1e6354]'
                    : progress.percent >= 60
                    ? 'bg-[#1e6354]'
                    : 'bg-[#d97706]'
                }`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'updated',
      header: 'Last Updated',
      cell: (h) => (
        <div className="flex flex-col text-xs text-[#637169] whitespace-nowrap">
          <span className="font-semibold text-[#33483e]">
            {h.updatedAt ? new Date(h.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 6, 2026'}
          </span>
          <span className="text-[#89958e] text-[11px] font-mono mt-0.5">
            {h.updatedAt ? new Date(h.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '11:06 AM'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (h) => (
        <div className="flex items-center justify-end gap-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Image size={14} />}
            onClick={() => setMediaTargetHotel(h)}
            title="Manage photo gallery"
          >
            Photos
          </Button>
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ExternalLink size={14} />}
            onClick={() => setSelected(h)}
          >
            Open workspace
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full max-w-full">
      {/* Page Header */}
      <PageHeading
        eyebrow="PROPERTY DIRECTORY"
        title="Hotels"
        description="Manage hotels, rooms, rates, availability and property settings."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Upload size={16} />}
              onClick={() => toast.info('Bulk hotel import feature will be available in the upcoming phase.')}
            >
              Import
            </Button>
            {canCreate && (
              <Button variant="primary" size="md" leftIcon={<Plus size={18} />} onClick={() => setOpen(true)}>
                Add a hotel
              </Button>
            )}
          </div>
        }
      />

      {/* 5 Summary Cards - Fluid Breakpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* Total Hotels */}
        <div className="p-3.5 bg-white border border-[#e4e9e3] rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-[#73827b]">Total Hotels</span>
            <strong className="text-2xl font-extrabold text-[#20322d] block mt-0.5">{data?.total ?? 0}</strong>
            <span className="text-xs text-[#1e6354] font-medium block mt-0.5">↑ +2 this month</span>
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

      {/* Multi-Select Floating Bulk Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-[#173f36] text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-[#d6ef9e] text-[#173f36] flex items-center justify-center font-bold">
              {selectedIds.size}
            </span>
            <span>{selectedIds.size} property {selectedIds.size === 1 ? 'selected' : 'selected'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-bold bg-[#1e6354] hover:bg-[#164d42] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              onClick={() => handleBulkStatus('PUBLISHED')}
            >
              <Check size={14} /> Publish Selected
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-bold bg-[#7c2d12] hover:bg-[#9a3412] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              onClick={() => handleBulkStatus('SUSPENDED')}
            >
              <PauseCircle size={14} /> Pause Selected
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              onClick={() => handleBulkStatus('ARCHIVED')}
            >
              <Archive size={14} /> Archive Selected
            </button>
            <button
              type="button"
              className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
              onClick={() => setSelectedIds(new Set())}
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Unified Reusable DataTable Component */}
      <DataTable<Hotel>
        data={paginatedHotels}
        columns={columns}
        rowKey={h => readId(h)}
        loading={loading}
        error={error}
        onRowClick={h => setSelected(h)}
        selectedRowKeys={selectedIds}
        emptyTitle="No matching properties found"
        emptyCopy="Try adjusting your search keywords or filter dropdowns to view matching hotels."
        emptyIcon={<Building2 size={32} />}
        emptyAction={
          canCreate ? (
            <Button variant="primary" size="md" leftIcon={<Plus size={18} />} onClick={() => setOpen(true)}>
              Add a hotel
            </Button>
          ) : undefined
        }
        toolbarHeader={
          <>
            {/* Top Search Line */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 bg-[#f4f6f3] border border-[#e4e9e4] rounded-lg focus-within:bg-white focus-within:border-[#1e6354] focus-within:ring-2 focus-within:ring-[#1e6354]/15 transition-all">
                <Search size={18} className="text-[#809087] shrink-0" />
                <input
                  type="text"
                  className="w-full bg-transparent border-none text-sm text-[#33483d] placeholder-[#99a39d] focus:outline-none font-medium"
                  placeholder="Search by hotel name, city, slug or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1.5 text-xs font-mono text-[#63736a] bg-[#f4f6f3] border border-[#e4e9e3] rounded-md hidden sm:inline-block">
                  Asia/Kolkata
                </span>
                <AsyncButton
                  className="p-2.5 text-[#63736a] hover:text-[#20322d] bg-white border border-[#e4e9e3] rounded-lg hover:bg-[#f4f6f3] transition-colors cursor-pointer"
                  onClick={load}
                  busy={loading}
                  title="Refresh list"
                >
                  <RefreshCw size={16} />
                </AsyncButton>
              </div>
            </div>

            {/* Dropdown Filters Line */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#edf0ec]">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                {/* Status Filter */}
                <div className="flex flex-col gap-0.5 flex-1 sm:flex-initial min-w-[130px]">
                  <span className="text-[10px] font-bold text-[#73827b] uppercase tracking-wider">Status</span>
                  <select
                    className="h-8.5 px-2.5 w-full bg-white border border-[#d8e0da] rounded-lg text-xs font-semibold text-[#33483e] focus:border-[#1e6354] focus:outline-none cursor-pointer"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SUSPENDED">Paused</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div className="flex flex-col gap-0.5 flex-1 sm:flex-initial min-w-[130px]">
                  <span className="text-[10px] font-bold text-[#73827b] uppercase tracking-wider">Location</span>
                  <select
                    className="h-8.5 px-2.5 w-full bg-white border border-[#d8e0da] rounded-lg text-xs font-semibold text-[#33483e] focus:border-[#1e6354] focus:outline-none cursor-pointer"
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                  >
                    <option value="ALL">All locations</option>
                    {uniqueLocations.map(loc => (
                      <option value={loc} key={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Setup Status Filter */}
                <div className="flex flex-col gap-0.5 flex-1 sm:flex-initial min-w-[130px]">
                  <span className="text-[10px] font-bold text-[#73827b] uppercase tracking-wider">Setup Status</span>
                  <select
                    className="h-8.5 px-2.5 w-full bg-white border border-[#d8e0da] rounded-lg text-xs font-semibold text-[#33483e] focus:border-[#1e6354] focus:outline-none cursor-pointer"
                    value={setupFilter}
                    onChange={e => setSetupFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="COMPLETED">Completed (100%)</option>
                    <option value="IN_PROGRESS">Action required (&lt;100%)</option>
                  </select>
                </div>

                {/* Time Filter */}
                <div className="flex flex-col gap-0.5 flex-1 sm:flex-initial min-w-[130px]">
                  <span className="text-[10px] font-bold text-[#73827b] uppercase tracking-wider">Updated</span>
                  <select
                    className="h-8.5 px-2.5 w-full bg-white border border-[#d8e0da] rounded-lg text-xs font-semibold text-[#33483e] focus:border-[#1e6354] focus:outline-none cursor-pointer"
                    value={timeFilter}
                    onChange={e => setTimeFilter(e.target.value)}
                  >
                    <option value="ALL">Any time</option>
                    <option value="TODAY">Today</option>
                    <option value="THIS_WEEK">This week</option>
                    <option value="THIS_MONTH">This month</option>
                  </select>
                </div>
              </div>

              <div className="self-end shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<SlidersHorizontal size={14} />}
                  onClick={() => toast.info('Custom column ordering will be available in the upcoming phase.')}
                >
                  Columns
                </Button>
              </div>
            </div>
          </>
        }
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredHotels.length,
          pageSize,
          onPageChange: setCurrentPage,
          onPageSizeChange: size => {
            setPageSize(size);
            setCurrentPage(1);
          },
          itemLabel: 'hotels',
        }}
      />

      {/* Hotel Create Modal */}
      {open && (
        <HotelCreateModal
          onClose={() => setOpen(false)}
          onCreated={h => {
            setOpen(false);
            setSelected(h);
            void load();
          }}
        />
      )}

      {/* Hotel Workspace Drawer */}
      {selected && (
        <HotelWorkspace
          hotel={selected}
          onClose={() => setSelected(null)}
          onSaved={h => {
            setSelected(h);
            void load();
          }}
          staff={staff}
        />
      )}

      {/* Hotel Media Gallery Modal */}
      {mediaTargetHotel && (
        <HotelMediaModal
          hotel={mediaTargetHotel}
          onClose={() => setMediaTargetHotel(null)}
          onSaved={() => {
            setMediaTargetHotel(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

// Custom Status Pill Badge Component matching mockup
function StatusPill({ status }: { status: string }) {
  const norm = status?.toUpperCase() || 'DRAFT';

  switch (norm) {
    case 'PUBLISHED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
          <CheckCircle2 size={13} /> Published
        </span>
      );
    case 'SUSPENDED':
    case 'PAUSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
          <PauseCircle size={13} /> Paused
        </span>
      );
    case 'ARCHIVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">
          <Archive size={13} /> Archived
        </span>
      );
    case 'NEEDS_SETUP':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
          <AlertCircle size={13} /> Needs Setup
        </span>
      );
    case 'DRAFT':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#ffedd5] text-[#c2410c] border border-[#fed7aa]">
          <Clock size={13} /> Draft
        </span>
      );
  }
}
