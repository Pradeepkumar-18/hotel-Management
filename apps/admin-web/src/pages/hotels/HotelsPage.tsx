import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ExternalLink, MapPin, Plus, Upload } from 'lucide-react';
import { Hotel, StaffMe, bulkUpdateHotelStatus, fetchHotelMetrics, HotelMetrics, isApiError } from '../../api';
import { useToast } from '../../ui-feedback';
import { Button, Checkbox, DataTable, Column, Status } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { HotelSummaryCards } from './components/HotelSummaryCards';
import { HotelBulkActionsBar } from './components/HotelBulkActionsBar';
import { HotelFiltersBar } from './components/HotelFiltersBar';
import { BulkStatusConfirmModal } from './components/BulkStatusConfirmModal';
import { useApiQuery, invalidate } from '../../hooks/useApiQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { HotelStatus, STATUS_LABEL } from '../../features/hotels/hotel-status';
import { listHotels, listHotelCities, HotelList } from '../../features/hotels/hotels.api';

const PAGE_SIZES = [10, 25, 50];
/** Unknown values in the URL fall back to the defaults instead of reaching the API. */
const readStatus = (v: string | null) => (v && v in STATUS_LABEL ? v : 'ALL');
const readPageSize = (v: string | null) => {
  const n = parseInt(v || '', 10);
  return PAGE_SIZES.includes(n) ? n : 10;
};

/** "Updated" filter → start of today / this week (Monday) / this month, as an ISO timestamp. */
function updatedSinceFor(filter: string): string | undefined {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (filter === 'THIS_WEEK') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  else if (filter === 'THIS_MONTH') d.setDate(1);
  else if (filter !== 'TODAY') return undefined;
  return d.toISOString();
}
import { Can } from '../../features/auth/Can';
import { AccessPage } from '../error/AccessPage';

export function HotelsPage({ staff }: { staff: StaffMe }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & Search State initialized from URL params
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState(() => readStatus(searchParams.get('status')));
  const [locationFilter, setLocationFilter] = useState(() => searchParams.get('city') || 'ALL');
  const [setupFilter, setSetupFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State initialized from URL params
  const [pageSize, setPageSize] = useState(() => readPageSize(searchParams.get('pageSize')));
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));

  // Bulk status modal state
  const [bulkStatusTarget, setBulkStatusTarget] = useState<HotelStatus | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, locationFilter, setupFilter, timeFilter]);

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
    const st = readStatus(searchParams.get('status'));
    if (st !== statusFilter) setStatusFilter(st);
    const c = searchParams.get('city') || 'ALL';
    if (c !== locationFilter) setLocationFilter(c);
    const p = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    if (p !== currentPage) setCurrentPage(p);
    const ps = readPageSize(searchParams.get('pageSize'));
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
          updatedSince: updatedSinceFor(timeFilter),
        },
        signal,
      );
    },
    [pageSize, currentPage, statusFilter, locationFilter, debouncedSearch, setupFilter, timeFilter],
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

  const paginatedHotels = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  const statusCounts = useMemo(() => {
    const defaultCounts = {
      DRAFT: 0,
      PUBLISHED: 0,
      SUSPENDED: 0,
      ARCHIVED: 0,
    };

    if (metricsQuery.data) {
      return {
        DRAFT: metricsQuery.data.draft ?? 0,
        PUBLISHED: metricsQuery.data.published ?? 0,
        SUSPENDED: metricsQuery.data.suspended ?? 0,
        ARCHIVED: metricsQuery.data.archived ?? 0,
      };
    }

    paginatedHotels.forEach((h) => {
      if (h.status in defaultCounts) {
        defaultCounts[h.status as keyof typeof defaultCounts]++;
      }
    });

    return defaultCounts;
  }, [paginatedHotels, metricsQuery.data]);

  // All cities in scope (not just the current page), so the list doesn't shrink after picking one.
  const citiesQuery = useApiQuery<string[]>((signal) => listHotelCities(signal), [], { tags: ['hotels'] });
  const uniqueLocations = citiesQuery.data ?? [];

  const canCreate = staff.permissions.includes('hotels.create');

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedHotels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedHotels.map((h) => readId(h))));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const hasDraftSelected = useMemo(() => {
    return paginatedHotels.some((h) => selectedIds.has(readId(h)) && h.status === 'DRAFT');
  }, [paginatedHotels, selectedIds]);

  const handleBulkStatusClick = (status: HotelStatus) => {
    setBulkStatusTarget(status);
    setBulkConfirmOpen(true);
  };

  const handleConfirmBulkStatus = async (reason: string) => {
    if (!bulkStatusTarget || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await bulkUpdateHotelStatus(Array.from(selectedIds), bulkStatusTarget, reason);
      toast.success(
        `Successfully updated ${res.modifiedCount} hotel${res.modifiedCount === 1 ? '' : 's'} to ${bulkStatusTarget}.`,
      );
      if (res.skipped && res.skipped.length > 0) {
        toast.info(
          `${res.skipped.length} property update(s) were skipped due to pre-publish validation.`,
        );
      }
      setSelectedIds(new Set());
      setBulkConfirmOpen(false);
      invalidate('hotels');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk status update failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleOpenEdit = (hotel: Hotel) => {
    navigate(`/admin/hotels/${readId(hotel)}/edit`);
  };

  const columns: Column<Hotel>[] = [
    {
      key: 'checkbox',
      header: (
        <Checkbox
          checked={selectedIds.size === paginatedHotels.length && paginatedHotels.length > 0}
          indeterminate={selectedIds.size > 0 && selectedIds.size < paginatedHotels.length}
          onChange={toggleSelectAll}
          aria-label="Select all hotels"
        />
      ),
      cell: (h) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(readId(h))}
            onChange={() => toggleSelectRow(readId(h))}
            aria-label={`Select ${h.name}`}
          />
        </div>
      ),
      align: 'center',
      headerClassName: 'w-10',
    },
    {
      key: 'hotel',
      header: 'HOTEL',
      cell: (h) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div
            className="w-10 h-10 rounded-xl bg-[#dcfce7] text-[#166534] flex items-center justify-center shrink-0 border border-emerald-200/60 overflow-hidden relative shadow-2xs cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/hotels/${readId(h)}/edit?tab=photos`);
            }}
            title="Click to view & manage photo gallery"
          >
            {h.primaryImage || h.heroImage ? (
              <img
                src={h.primaryImage || h.heroImage}
                alt={h.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <Building2 size={20} className="text-[#166534]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <b className="font-bold text-slate-900 text-sm truncate">{h.name}</b>
            <span className="text-xs text-slate-400 font-mono leading-normal">/{h.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'LOCATION',
      cell: (h) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <MapPin size={15} className="text-slate-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800 leading-snug">
              {h.address?.city || 'Not set'}, {h.address?.countryCode || 'IN'}
            </span>
            <span className="text-[11px] text-slate-400 leading-normal font-mono">
              {h.address?.postalCode || '626123'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      cell: (h) => <Status status={h.status} variant="pill" />,
    },
    {
      key: 'setup',
      header: 'SETUP PROGRESS',
      cell: (h) => {
        const isComplete = h.status === 'PUBLISHED';
        const stepsDone = isComplete ? 4 : 3;
        const totalSteps = 5;
        const pct = isComplete ? 80 : 60;

        return (
          <div className="flex flex-col gap-1 min-w-[140px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {stepsDone} of {totalSteps} completed
              </span>
              <span className="text-slate-500 font-bold text-xs">{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isComplete ? 'bg-[#059669]' : 'bg-[#d97706]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'updated',
      header: 'UPDATED',
      cell: (h) => {
        const dateStr = h.updatedAt || h.createdAt || '2026-10-15T14:30:00Z';
        const d = new Date(dateStr);
        const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeFormatted = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        return (
          <div className="flex flex-col text-xs leading-tight">
            <span className="font-semibold text-slate-800">{dateFormatted}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{timeFormatted}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      cell: (h) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ExternalLink size={13} />}
            onClick={() => handleOpenEdit(h)}
            className="h-8 text-xs font-semibold px-3 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-800 rounded-lg shadow-2xs"
          >
            Manage
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Top Page Heading matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            PROPERTY DIRECTORY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hotels
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage hotels, rooms, rates, availability and property settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            variant="outline"
            leftIcon={<Upload size={16} />}
            onClick={() => toast.info('Bulk hotel import feature will be available in the upcoming phase.')}
            className="h-[42px] px-4.5 text-sm font-semibold bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 shadow-2xs rounded-xl"
          >
            Import
          </Button>
          <Can permission="hotels.create">
            <button
              type="button"
              onClick={() => navigate('/admin/hotels/new')}
              className="inline-flex items-center justify-center gap-2 h-[40px] px-4.5 bg-[#164e3f] hover:bg-[#123e32] text-white text-sm font-bold rounded-xl shadow-2xs transition-colors cursor-pointer select-none"
            >
              <Plus size={17} className="stroke-[2.5]" />
              <span>Add a hotel</span>
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Cards Strip matching screenshot */}
      <HotelSummaryCards
        total={statusCounts.PUBLISHED + statusCounts.DRAFT + statusCounts.SUSPENDED}
        statusCounts={statusCounts}
      />

      {/* Bulk actions banner if selected */}
      <HotelBulkActionsBar
        selectedCount={selectedIds.size}
        hasDraftSelected={hasDraftSelected}
        onBulkStatus={handleBulkStatusClick}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Single Clean White Container Card for Filters + Table */}
      <DataTable<Hotel>
        data={paginatedHotels}
        columns={columns}
        rowKey={(h) => readId(h)}
        loading={loading}
        error={error}
        onRowClick={(h) => handleOpenEdit(h)}
        selectedRowKeys={selectedIds}
        emptyTitle="No matching properties found"
        emptyCopy="Try adjusting your search keywords or filter dropdowns to view matching hotels."
        emptyIcon={<Building2 size={32} />}
        emptyAction={
          canCreate ? (
            <button
              type="button"
              onClick={() => navigate('/admin/hotels/new')}
              className="inline-flex items-center justify-center gap-2 h-[42px] px-4.5 bg-[#164e3f] hover:bg-[#123e32] text-white text-sm font-bold rounded-xl shadow-2xs transition-colors cursor-pointer select-none"
            >
              <Plus size={17} className="stroke-[2.5]" />
              <span>Add a hotel</span>
            </button>
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

      {/* Confirm Bulk Status Action Modal */}
      <BulkStatusConfirmModal
        isOpen={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        status={bulkStatusTarget}
        count={selectedIds.size}
        onConfirm={handleConfirmBulkStatus}
        loading={bulkLoading}
      />
    </div>
  );
}
