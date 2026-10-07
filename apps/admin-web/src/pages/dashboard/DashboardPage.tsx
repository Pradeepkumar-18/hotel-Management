import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, Building2, CalendarDays, Check, Compass, DollarSign, RefreshCw, ShieldCheck, ExternalLink } from 'lucide-react';
import { Hotel, request, StaffMe } from '../../api';
import { AsyncButton } from '../../ui-feedback';
import { Alert, EmptyState, LoadingRows, MetricCard, Status, Button } from '../../components/ui';
import { readId } from '../../utils/helpers';

type HotelList = { items: Hotel[]; total: number };

export function DashboardPage({ staff }: { staff: StaffMe }) {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<{
    hotels: Hotel[];
    total: number;
    published: number;
    draft: number;
    suspended: number;
    archived: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [all, published, draft, suspended, archived] = await Promise.all([
        request<HotelList>('/admin/hotels?limit=8&offset=0'),
        request<HotelList>('/admin/hotels?status=PUBLISHED&limit=1&offset=0'),
        request<HotelList>('/admin/hotels?status=DRAFT&limit=1&offset=0'),
        request<HotelList>('/admin/hotels?status=SUSPENDED&limit=1&offset=0'),
        request<HotelList>('/admin/hotels?status=ARCHIVED&limit=1&offset=0'),
      ]);
      setOverview({
        hotels: all.items,
        total: all.total,
        published: published.total,
        draft: draft.total,
        suspended: suspended.total,
        archived: archived.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load operations overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">STAYWISE OPERATIONS</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">Dashboard</h1>
          <p className="text-xs md:text-sm text-slate-500 leading-normal">Property activity and setup status at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">{dateLabel}</span>
          <AsyncButton
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300/90 rounded-lg text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            onClick={load}
            busy={loading}
            loadingLabel="Refreshing overview…"
          >
            <RefreshCw size={14} className="text-slate-500" /> Refresh
          </AsyncButton>
        </div>
      </div>

      {error && (
        <Alert tone="error">
          {error}{' '}
          <AsyncButton
            className="ml-2 font-bold underline hover:no-underline text-xs cursor-pointer"
            onClick={load}
            busy={loading}
            loadingLabel="Retrying…"
          >
            Try again
          </AsyncButton>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Property summary">
        <MetricCard label="Total properties" value={overview?.total} icon={<Building2 size={18} />} detail="Across accessible portfolio" tone="green" loading={loading} />
        <MetricCard label="Published" value={overview?.published} icon={<Check size={18} />} detail="Live in public catalog" tone="teal" loading={loading} />
        <MetricCard label="In setup" value={overview?.draft} icon={<Compass size={18} />} detail="Draft properties pending setup" tone="sand" loading={loading} />
        <MetricCard label="Paused or archived" value={(overview?.suspended ?? 0) + (overview?.archived ?? 0)} icon={<CalendarDays size={18} />} detail={`${overview?.suspended ?? 0} paused · ${overview?.archived ?? 0} archived`} tone="slate" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">PORTFOLIO</span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Properties</h2>
              <p className="text-xs text-slate-500 leading-normal">Quick access to your properties.</p>
            </div>
            <Button variant="outline" size="sm" rightIcon={<ExternalLink size={13} />} onClick={() => navigate('/admin/hotels')}>
              All properties
            </Button>
          </div>

          {loading ? (
            <LoadingRows count={5} />
          ) : overview?.hotels.length ? (
            <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200/80">
                <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Property</th>
                    <th className="py-3 px-4 font-bold">Location</th>
                    <th className="py-3 px-4 font-bold">Time zone</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {overview.hotels.map(hotel => (
                    <tr key={readId(hotel)} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
                            <Building2 size={16} />
                          </span>
                          <span className="flex flex-col">
                            <b className="font-bold text-slate-900 text-xs">{hotel.name}</b>
                            <span className="text-[11px] text-slate-400 font-mono leading-normal">/{hotel.slug}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 leading-normal">
                        {hotel.address?.city}, {hotel.address?.countryCode}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] leading-normal">{hotel.timezone}</td>
                      <td className="py-3.5 px-4">
                        <Status status={hotel.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/60 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                          onClick={() => navigate('/admin/hotels')}
                        >
                          Open <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Building2 />}
              title="No properties yet"
              copy="Create a property to start configuring rooms, rates, and availability."
              action={
                <Button variant="primary" size="md" onClick={() => navigate('/admin/hotels')}>
                  Open properties
                </Button>
              }
            />
          )}
          {!loading && overview && overview.total > overview.hotels.length && (
            <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
              <span>Showing {overview.hotels.length} of {overview.total} properties</span>
              <button type="button" className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer" onClick={() => navigate('/admin/hotels')}>
                View all
              </button>
            </div>
          )}
        </section>

        <aside className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">WORKSPACE</span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Quick actions</h2>
            <p className="text-xs text-slate-500 leading-normal">Continue managing your properties.</p>
          </div>

          <div className="space-y-2.5">
            {staff.permissions.includes('hotels.view') && (
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
                onClick={() => navigate('/admin/hotels')}
              >
                <span className="w-9 h-9 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Building2 size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <b className="block text-xs font-bold text-slate-900 group-hover:text-emerald-950">Manage properties</b>
                  <span className="text-[11px] text-slate-500 block truncate leading-normal mt-0.5">{overview?.draft ?? 0} drafts need setup</span>
                </span>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0" />
              </button>
            )}
            {staff.permissions.includes('room_types.view') && (
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
                onClick={() => navigate('/admin/room-types')}
              >
                <span className="w-9 h-9 rounded-lg bg-sky-100/70 text-sky-800 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <BedDouble size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <b className="block text-xs font-bold text-slate-900 group-hover:text-sky-950">Room types</b>
                  <span className="text-[11px] text-slate-500 block truncate leading-normal mt-0.5">Manage capacity & sellable rooms</span>
                </span>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-sky-700 transition-colors shrink-0" />
              </button>
            )}
            {staff.permissions.includes('rates.view') && (
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-all group cursor-pointer"
                onClick={() => navigate('/admin/rates')}
              >
                <span className="w-9 h-9 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <DollarSign size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <b className="block text-xs font-bold text-slate-900 group-hover:text-amber-950">Base rates</b>
                  <span className="text-[11px] text-slate-500 block truncate leading-normal mt-0.5">Set nightly amounts by room type</span>
                </span>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-amber-700 transition-colors shrink-0" />
              </button>
            )}
            {staff.permissions.includes('inventory.view') && (
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 hover:border-teal-300 hover:bg-teal-50/40 text-left transition-all group cursor-pointer"
                onClick={() => navigate('/admin/inventory')}
              >
                <span className="w-9 h-9 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <CalendarDays size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <b className="block text-xs font-bold text-slate-900 group-hover:text-teal-950">Availability calendar</b>
                  <span className="text-[11px] text-slate-500 block truncate leading-normal mt-0.5">Set inventory and block rooms</span>
                </span>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-teal-700 transition-colors shrink-0" />
              </button>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span className="leading-normal">Availability and pricing changes are validated by server.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
