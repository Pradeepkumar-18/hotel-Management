import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, ExternalLink, Image, MapPin, Plus, Upload } from 'lucide-react';
import { Hotel, StaffMe, bulkUpdateHotelStatus, fetchHotelMetrics, HotelMetrics, isApiError } from '../../api';
import { useToast } from '../../ui-feedback';
import { PageHeading, Button, DataTable, Column, Status } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { HotelCreateModal } from '../../features/hotels/HotelCreateModal';
import { HotelWorkspace } from '../../features/hotels/HotelWorkspace';
import { HotelMediaModal } from '../../features/hotels/HotelMediaModal';
import { HotelSummaryCards } from './components/HotelSummaryCards';
import { HotelBulkActionsBar } from './components/HotelBulkActionsBar';
import { HotelFiltersBar } from './components/HotelFiltersBar';
import { BulkStatusConfirmModal } from './components/BulkStatusConfirmModal';
import { useApiQuery, invalidate } from '../../hooks/useApiQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { HotelStatus } from '../../features/hotels/hotel-status';
import { listHotels, HotelList } from '../../features/hotels/hotels.api';
import { Can } from '../../features/auth/Can';
import { AccessPage } from '../error/AccessPage';

export function HotelsPage({ staff }: { staff: StaffMe }) {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Hotel | null>(null);
  const [mediaTargetHotel, setMediaTargetHotel] = useState<Hotel | null>(null);

  // Filters & Search State initialized from URL params
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'ALL');
  const [locationFilter, setLocationFilter] = useState(() => searchParams.get('city') || 'ALL');
  const [setupFilter, setSetupFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State initialized from URL params
  const [pageSize, setPageSize] = useState(() => Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));

  // Bulk status modal state
  const [bulkStatusTarget, setBulkStatusTarget] = useState<HotelStatus | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, locationFilter, setupFilter]);

  // Sync state to URL search parameters
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch.trim()) next.set('search', debouncedSearch.trim());
    else next.delete('search');

    if (statusFilter !== 'ALL') next.set('status', statusFilter);
    else next.delete('status');

    if (locationFilter !== 'ALL') next.set('city', locationFilter);
    else next.delete('city');

    if (currentPage > 1) next.set('page', String(currentPage));
    else next.delete('page');

    if (pageSize !== 10) next.set('pageSize', String(pageSize));
    else next.delete('pageSize');

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [debouncedSearch, statusFilter, locationFilter, currentPage, pageSize, searchParams, setSearchParams]);

  // Sync state when browser navigation occurs (back/forward)
  useEffect(() => {
    const s = searchParams.get('search') || '';
    if (s !== searchQuery) setSearchQuery(s);
    const st = searchParams.get('status') || 'ALL';
    if (st !== statusFilter) setStatusFilter(st);
    const c = searchParams.get('city') || 'ALL';
    if (c !== locationFilter) setLocationFilter(c);
    const p = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    if (p !== currentPage) setCurrentPage(p);
    const ps = Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10);
    if (ps !== pageSize) setPageSize(ps);
  }, [searchParams]);

  const hotelsQuery = useApiQuery<HotelList>(
    (signal) => {
      return listHotels(
        {
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          status: statusFilter,
          city: locationFilter,
          setupStatus: setupFilter,
          search: debouncedSearch,
        },
        signal,
      );
    },
    [pageSize, currentPage, statusFilter, locationFilter, debouncedSearch, setupFilter],
    { tags: ['hotels'] },
  );

  const metricsQuery = useApiQuery<HotelMetrics>(
    (_signal) => fetchHotelMetrics(),
    [],
    { tags: ['hotels'] },
  );

  const data = hotelsQuery.data ?? null;
  const loading = hotelsQuery.loading;
  const error = hotelsQuery.error instanceof Error ? hotelsQuery.error.message : (hotelsQuery.error ? String(hotelsQuery.error) : '');

  if (isApiError(hotelsQuery.error, 403)) {
    return <AccessPage kind="unauthorized" />;
  }

  const statusCounts = useMemo(() => {
    if (!metricsQuery.data) return null;
    return {
      PUBLISHED: metricsQuery.data.published,
      DRAFT: metricsQuery.data.draft,
      SUSPENDED: metricsQuery.data.suspended,
      ARCHIVED: metricsQuery.data.archived,
    };
  }, [metricsQuery.data]);

  const canCreate = staff.permissions.includes('hotels.create');

  const uniqueLocations = useMemo(() => {
    if (!data?.items) return [];
    const set = new Set<string>();
    data.items.forEach((h) => {
      if (h.address?.city) set.add(h.address.city);
    });
    return Array.from(set);
  }, [data?.items]);

  const paginatedHotels = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / pageSize) || 1;

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

  const hasDraftSelected = useMemo(() => {
    return paginatedHotels.some((h) => selectedIds.has(readId(h)) && h.status === 'DRAFT');
  }, [paginatedHotels, selectedIds]);

  const handleBulkStatusClick = (status: HotelStatus) => {
    if (selectedIds.size === 0) return;
    setBulkStatusTarget(status);
    setBulkConfirmOpen(true);
  };

  const handleConfirmBulkStatus = async (reason: string) => {
    if (!bulkStatusTarget || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await bulkUpdateHotelStatus(ids, bulkStatusTarget, reason);
      if (res.skipped && res.skipped.length > 0) {
        toast.info(`${res.modifiedCount} updated. ${res.skipped.length} skipped (${res.skipped[0].message}).`);
      } else {
        toast.success(`Successfully updated status for ${res.modifiedCount} hotel(s).`);
      }
      setSelectedIds(new Set());
      setBulkConfirmOpen(false);
      invalidate('hotels');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update selected hotels.');
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: Column<Hotel>[] = [
    {
      key: 'checkbox',
      header: (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
          checked={selectedIds.size === paginatedHotels.length && paginatedHotels.length > 0}
          onChange={toggleSelectAll}
        />
      ),
      cell: (h) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
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
            className="w-10 h-10 rounded-lg bg-brand-pale text-brand-primary flex items-center justify-center shrink-0 border border-brand-border overflow-hidden relative shadow-2xs cursor-pointer group"
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
              <Building2 size={20} className="text-brand-primary" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <b className="font-bold text-ink text-sm truncate">{h.name}</b>
            <span className="text-xs text-ink-muted font-mono leading-normal">/{h.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (h) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <MapPin size={15} className="text-ink-muted shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink-deep leading-snug">
              {h.address?.city || 'Not set'}, {h.address?.countryCode || 'IN'}
            </span>
            <span className="text-xs text-ink-light leading-normal font-mono">
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
              <span className="text-ink-muted font-medium">{progress.completed} of 5 completed</span>
              <span className="font-bold text-ink">{progress.percent}%</span>
            </div>
            <div className="w-full h-2 bg-line rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  progress.percent === 100 ? 'bg-brand-primary' : progress.percent >= 60 ? 'bg-brand-primary' : 'bg-amber-600'
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
            <Can permission="hotels.create">
              <Button variant="primary" size="md" leftIcon={<Plus size={18} />} onClick={() => setOpen(true)}>
                Add a hotel
              </Button>
            </Can>
          </div>
        }
      />

      <HotelSummaryCards total={data?.total ?? 0} statusCounts={statusCounts} />

      <HotelBulkActionsBar
        selectedCount={selectedIds.size}
        hasDraftSelected={hasDraftSelected}
        onBulkStatus={handleBulkStatusClick}
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
            onSearchChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            onStatusChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            locationFilter={locationFilter}
            onLocationChange={(val) => {
              setLocationFilter(val);
              setCurrentPage(1);
            }}
            setupFilter={setupFilter}
            onSetupChange={(val) => {
              setSetupFilter(val);
              setCurrentPage(1);
            }}
            timeFilter={timeFilter}
            onTimeChange={(val) => {
              setTimeFilter(val);
              setCurrentPage(1);
            }}
            uniqueLocations={uniqueLocations}
            onColumnsClick={() => toast.info('Custom column ordering will be available in the upcoming phase.')}
          />
        }
        pagination={{
          currentPage,
          totalPages,
          totalItems: data?.total ?? 0,
          pageSize,
          onPageChange: setCurrentPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setCurrentPage(1);
          },
          itemLabel: 'hotels',
        }}
      />

      <BulkStatusConfirmModal
        isOpen={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        status={bulkStatusTarget}
        count={selectedIds.size}
        onConfirm={handleConfirmBulkStatus}
        loading={bulkLoading}
      />

      {open && (
        <HotelCreateModal
          onClose={() => setOpen(false)}
          onCreated={(h) => {
            setOpen(false);
            setSelected(h);
            invalidate('hotels');
          }}
        />
      )}

      {selected && (
        <HotelWorkspace
          hotel={selected}
          onClose={() => setSelected(null)}
          onSaved={(h) => {
            setSelected(h);
            invalidate('hotels');
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
            invalidate('hotels');
          }}
        />
      )}
    </div>
  );
}
