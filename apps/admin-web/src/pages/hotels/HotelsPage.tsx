import { useCallback, useEffect, useState, useMemo } from 'react';
import { Building2, ExternalLink, Image, MapPin, Plus, Upload } from 'lucide-react';
import { Hotel, request, StaffMe, bulkUpdateHotelStatus } from '../../api';
import { useToast } from '../../ui-feedback';
import { PageHeading, Button, DataTable, Column, Status } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { HotelCreateModal } from '../../features/hotels/HotelCreateModal';
import { HotelWorkspace } from '../../features/hotels/HotelWorkspace';
import { HotelMediaModal } from '../../features/hotels/HotelMediaModal';
import { HotelSummaryCards } from './components/HotelSummaryCards';
import { HotelBulkActionsBar } from './components/HotelBulkActionsBar';
import { HotelFiltersBar } from './components/HotelFiltersBar';

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
        ...statuses.map((status) => request<HotelList>(`/admin/hotels?status=${status}&limit=1&offset=0`)),
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
    return data.items.filter((h) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = h.name.toLowerCase().includes(q);
        const slugMatch = h.slug.toLowerCase().includes(q);
        const cityMatch = h.address?.city?.toLowerCase().includes(q);
        const idMatch = readId(h).toLowerCase().includes(q);
        if (!nameMatch && !slugMatch && !cityMatch && !idMatch) return false;
      }
      if (statusFilter !== 'ALL' && h.status !== statusFilter) return false;
      if (locationFilter !== 'ALL' && h.address?.city !== locationFilter) return false;
      return true;
    });
  }, [data?.items, searchQuery, statusFilter, locationFilter]);

  const uniqueLocations = useMemo(() => {
    if (!data?.items) return [];
    const set = new Set<string>();
    data.items.forEach((h) => {
      if (h.address?.city) set.add(h.address.city);
    });
    return Array.from(set);
  }, [data?.items]);

  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHotels.slice(start, start + pageSize);
  }, [filteredHotels, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredHotels.length / pageSize) || 1;

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedHotels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedHotels.map((h) => readId(h))));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSetupProgress = (h: Hotel) => {
    let completed = 1;
    if (h.address?.line1 && h.address?.city) completed++;
    if (h.contact?.email) completed++;
    if (h.primaryImage || h.heroImage || (h.media && h.media.length > 0)) completed++;
    if (h.status === 'PUBLISHED') completed++;
    return { completed, total: 5, percent: Math.round((completed / 5) * 100) };
  };

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
        <div onClick={(e) => e.stopPropagation()}>
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
            onClick={(e) => {
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
      cell: (h) => <Status status={h.status} variant="pill" />,
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
                  progress.percent === 100 ? 'bg-[#1e6354]' : progress.percent >= 60 ? 'bg-[#1e6354]' : 'bg-[#d97706]'
                }`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (h) => (
        <div className="flex items-center justify-end gap-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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

      <HotelSummaryCards total={data?.total ?? 0} statusCounts={statusCounts} />

      <HotelBulkActionsBar
        selectedCount={selectedIds.size}
        onBulkStatus={handleBulkStatus}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <DataTable<Hotel>
        data={paginatedHotels}
        columns={columns}
        rowKey={(h) => readId(h)}
        loading={loading}
        error={error}
        onRowClick={(h) => setSelected(h)}
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
          <HotelFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            locationFilter={locationFilter}
            onLocationChange={setLocationFilter}
            setupFilter={setupFilter}
            onSetupChange={setSetupFilter}
            timeFilter={timeFilter}
            onTimeChange={setTimeFilter}
            uniqueLocations={uniqueLocations}
            onColumnsClick={() => toast.info('Custom column ordering will be available in the upcoming phase.')}
          />
        }
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredHotels.length,
          pageSize,
          onPageChange: setCurrentPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setCurrentPage(1);
          },
          itemLabel: 'hotels',
        }}
      />

      {open && (
        <HotelCreateModal
          onClose={() => setOpen(false)}
          onCreated={(h) => {
            setOpen(false);
            setSelected(h);
            void load();
          }}
        />
      )}

      {selected && (
        <HotelWorkspace
          hotel={selected}
          onClose={() => setSelected(null)}
          onSaved={(h) => {
            setSelected(h);
            void load();
          }}
          staff={staff}
        />
      )}

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
