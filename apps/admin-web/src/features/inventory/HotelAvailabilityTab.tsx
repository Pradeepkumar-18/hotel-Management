import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CalendarCheck, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react';
import { Hotel, RoomType } from '../../api';
import { Button, EmptyState, Select } from '../../components/ui';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { handleFormError } from '../../hooks/handleFormError';
import { useServerErrors } from '../../hooks/useServerErrors';
import { isoToday, plusDays, readId } from '../../utils/helpers';
import { Can } from '../auth/Can';
import { getInventoryRange, initializeInventory } from './inventory.api';

const WINDOW_OPTIONS = [30, 90, 180, 365];

type RoomSummary = { openNights: number; availableTonight: number | null; loaded: boolean };

interface HotelAvailabilityTabProps {
  hotel: Hotel;
  rooms: RoomType[];
  readOnly?: boolean;
  /** Called after dates are opened so the checklist can refresh. */
  onChanged?: () => void;
}

/**
 * Workspace step for sellable dates: publishing needs every room type to have at
 * least one future night with rooms available. Detailed blocking stays on the
 * Availability calendar page.
 */
export function HotelAvailabilityTab({ hotel, rooms, readOnly = false, onChanged }: HotelAvailabilityTabProps) {
  const toast = useToast();
  const formErrors = useServerErrors();
  const { busy, run } = useBusyGuard();
  const [days, setDays] = useState(90);
  const [summaries, setSummaries] = useState<Record<string, RoomSummary>>({});
  const today = isoToday(hotel.timezone);
  const hotelId = readId(hotel);

  const load = useCallback(async () => {
    const entries = await Promise.all(
      rooms.map(async (room) => {
        try {
          const { nights } = await getInventoryRange(readId(room), today, plusDays(today, days));
          const tonight = nights.find((n) => n.stayDate === today);
          return [readId(room), {
            openNights: nights.filter((n) => n.available > 0).length,
            availableTonight: tonight ? tonight.available : null,
            loaded: true,
          }] as const;
        } catch {
          return [readId(room), { openNights: 0, availableTonight: null, loaded: false }] as const;
        }
      })
    );
    setSummaries(Object.fromEntries(entries));
  }, [rooms, today, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDates = (targets: RoomType[]) =>
    run(async () => {
      try {
        let created = 0;
        for (const room of targets) {
          created += (await initializeInventory(readId(room), today, plusDays(today, days))).createdNights;
        }
        toast.success(created > 0 ? `Opened ${created} new nights for sale.` : 'Those dates were already open.');
        await load();
        onChanged?.();
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });

  if (rooms.length === 0) {
    return (
      <EmptyState
        compact
        icon={<BedDouble size={20} />}
        title="Add a room type first"
        copy="Availability is set per room type. Add rooms in step 2, then open dates for sale here."
      />
    );
  }

  const missing = rooms.filter((r) => (summaries[readId(r)]?.openNights ?? 0) === 0);

  return (
    <div className="space-y-5">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <p className="text-xs text-slate-600 max-w-xl">
          Guests can only book dates that are <b>open for sale</b>. Opening dates makes each room type's sellable rooms
          bookable for that period. You can block rooms for maintenance later in the calendar.
        </p>
        {!readOnly && (
          <Can permission="inventory.adjust">
            <div className="flex items-end gap-2 shrink-0">
              <div className="w-36">
                <Select size="sm" aria-label="How far ahead" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {WINDOW_OPTIONS.map((d) => (
                    <option key={d} value={d}>Next {d} days</option>
                  ))}
                </Select>
              </div>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<CalendarCheck size={14} />}
                isLoading={busy}
                loadingLabel="Opening…"
                onClick={() => openDates(rooms)}
              >
                Open for all rooms
              </Button>
            </div>
          </Can>
        )}
      </div>

      {missing.length > 0 && (
        <p className="text-xs text-amber-700 flex items-center gap-1.5">
          <AlertCircle size={14} />
          {missing.length === 1 ? '1 room type has' : `${missing.length} room types have`} no open dates in the next {days} days. The hotel can't be published until each room type has some.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rooms.map((room) => {
          const id = readId(room);
          const s = summaries[id];
          const ok = (s?.openNights ?? 0) > 0;
          return (
            <div key={id} className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-sm font-semibold text-slate-900 block truncate">{room.name}</b>
                  <span className="text-xs text-slate-500">{room.totalRooms} sellable rooms</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {ok ? 'Bookable' : 'No open dates'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {s?.loaded === false
                  ? 'Could not load dates.'
                  : !s
                    ? 'Loading…'
                    : `${s.openNights} of the next ${days} nights open · ${s.availableTonight ?? 0} rooms available tonight`}
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                {!readOnly && (
                  <Can permission="inventory.adjust">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => openDates([room])}>
                      Open next {days} days
                    </Button>
                  </Can>
                )}
                <Link
                  to={`/admin/inventory?hotel=${hotelId}&room=${id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline ml-auto"
                >
                  <CalendarDays size={13} />
                  Calendar & blocks
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
