import { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, Building2, DollarSign, RefreshCw } from 'lucide-react';
import { ApiError, Hotel, InventoryDay, request, RoomType, StaffMe } from '../../api';
import { AsyncButton, useBusyGuard, useToast } from '../../ui-feedback';
import { Alert, EmptyState, Field, KpiStrip, LoadingRows, PageHeading, Status } from '../../components/ui';
import { plusDays, readId } from '../../utils/helpers';

type HotelList = { items: Hotel[]; total: number };

export function CatalogPage({ mode, staff }: { mode: 'rooms' | 'inventory' | 'rates'; staff: StaffMe }) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState('');
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [roomId, setRoomId] = useState('');
  const [days, setDays] = useState<InventoryDay[]>([]);
  const [from, setFrom] = useState('');
  const [loading, setLoading] = useState(true);
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const [error, setError] = useState('');
  const [rate, setRate] = useState<any>(null);
  const [rateCoverage, setRateCoverage] = useState<{ configured: number; missing: number } | null>(null);

  const selectedHotel = hotels.find(h => readId(h) === hotelId);
  const selectedRoom = rooms.find(r => readId(r) === roomId);

  const loadHotels = useCallback(async () => {
    try {
      const result = await request<HotelList>('/admin/hotels?limit=100&offset=0');
      setHotels(result.items);
      if (!hotelId && result.items[0]) setHotelId(readId(result.items[0]));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load properties');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    void loadHotels();
  }, [loadHotels]);

  useEffect(() => {
    if (!hotelId) return;
    let live = true;
    setLoading(true);
    request<RoomType[]>(`/admin/hotels/${hotelId}/room-types`)
      .then(rs => {
        if (live) {
          setRooms(rs);
          setRoomId(current => (rs.some(r => readId(r) === current) ? current : rs[0] ? readId(rs[0]) : ''));
        }
      })
      .catch(e => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [hotelId]);

  useEffect(() => {
    if (selectedHotel && !from) {
      setFrom(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: selectedHotel.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date())
      );
    }
  }, [selectedHotel, from]);

  useEffect(() => {
    if (mode !== 'rates' || !rooms.length) {
      setRateCoverage(null);
      return;
    }
    let live = true;
    Promise.all(
      rooms.map(room =>
        request(`/admin/room-types/${readId(room)}/base-rate`)
          .then(() => true)
          .catch(error => {
            if (error instanceof ApiError && error.status === 404) return false;
            throw error;
          })
      )
    )
      .then(results => {
        if (live) setRateCoverage({ configured: results.filter(Boolean).length, missing: results.filter(value => !value).length });
      })
      .catch(error => {
        if (live) setError(error instanceof Error ? error.message : 'Could not load rate summary');
      });
    return () => {
      live = false;
    };
  }, [mode, rooms]);

  const loadRoomData = useCallback(async () => {
    if (!roomId || (mode === 'inventory' && !from) || mode === 'rooms') return;
    setError('');
    setLoading(true);
    try {
      if (mode === 'inventory') {
        const result = await request<{ nights: InventoryDay[] }>(
          `/admin/room-types/${roomId}/inventory?from=${from}&to=${plusDays(from, 14)}`
        );
        setDays(result.nights);
      } else {
        setRate(null);
        setRate(await request(`/admin/room-types/${roomId}/base-rate`));
      }
    } catch (e) {
      if (mode === 'rates' && e instanceof ApiError && e.status === 404) setRate(null);
      else setError(e instanceof Error ? e.message : `Could not load ${mode === 'rates' ? 'base rate' : 'availability'}`);
    } finally {
      setLoading(false);
    }
  }, [roomId, mode, from]);

  useEffect(() => {
    void loadRoomData();
  }, [loadRoomData]);

  const headings = {
    rooms: ['ROOM CATALOG', 'Room types', 'Manage the room categories available at each property.'],
    inventory: ['PROPERTY AVAILABILITY', 'Availability', 'Review sellable rooms by property-local stay date.'],
    rates: ['ROOM PRICING', 'Base rates', 'Set the starting nightly price for each room type.'],
  }[mode];

  const canEditRates = staff.permissions.includes('rates.edit');

  const initialize = () => {
    if (!roomId) return;
    void run(async () => {
      setError('');
      try {
        const result = await request<{ createdNights: number }>(`/admin/room-types/${roomId}/inventory/initialize`, {
          method: 'POST',
          body: JSON.stringify({ from, to: plusDays(from, 14) }),
        });
        toast.success(`${result.createdNights} nights initialized for ${selectedRoom?.name}.`);
        await loadRoomData();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not initialize dates');
      }
    });
  };

  const blockDate = (day: InventoryDay) => {
    const answer = window.prompt(
      `How many of the ${day.available} available rooms should be blocked on ${day.stayDate}? Enter a quantity and reason separated by a comma (example: 1, maintenance).`
    );
    if (!answer) return;
    const [quantity, ...words] = answer.split(',');
    const amount = Number(quantity);
    const reason = words.join(',').trim();
    if (!Number.isInteger(amount) || amount < 1 || !reason) {
      setError('Enter a whole room quantity and a reason separated by a comma.');
      return;
    }
    void run(async () => {
      setError('');
      try {
        await request(`/admin/room-types/${roomId}/inventory/${day.stayDate}/block`, {
          method: 'POST',
          body: JSON.stringify({ version: day.version, quantity: amount, reason }),
        });
        toast.success(`Blocked ${amount} room${amount === 1 ? '' : 's'} on ${day.stayDate}.`);
        await loadRoomData();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not update availability');
      }
    });
  };

  const saveRate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoom) return;
    const f = new FormData(e.currentTarget);
    void run(async () => {
      setError('');
      try {
        const saved = await request<any>(`/admin/room-types/${roomId}/base-rate`, {
          method: 'PUT',
          body: JSON.stringify({
            amountMinorUnits: Number(f.get('amount')),
            currency: String(f.get('currency')).toUpperCase(),
            version: rate?.version ?? 0,
            reason: String(f.get('reason')),
          }),
        });
        setRate(saved);
        toast.success('Base rate saved. Tax is not included.');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save base rate');
      }
    });
  };

  const missing = useMemo(() => 14 - days.length, [days]);
  const inventorySummary = useMemo(
    () =>
      days.reduce(
        (sum, day) => ({
          available: sum.available + day.available,
          held: sum.held + day.held,
          confirmed: sum.confirmed + day.confirmed,
          blocked: sum.blocked + day.blocked,
        }),
        { available: 0, held: 0, confirmed: 0, blocked: 0 }
      ),
    [days]
  );
  const activeSellableRooms = rooms.reduce((sum, room) => sum + room.totalRooms, 0);

  return (
    <div className="space-y-6">
      <PageHeading eyebrow={headings[0]} title={headings[1]} description={headings[2]} />
      {error && <Alert tone="error">{error}</Alert>}

      <div className="filters-panel p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-end gap-3">
        <Field label="Property" className="sm:w-60">
          <select
            value={hotelId}
            onChange={e => setHotelId(e.target.value)}
            className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Choose a property</option>
            {hotels.map(h => (
              <option key={readId(h)} value={readId(h)}>
                {h.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room type" className="sm:w-60">
          <select
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            disabled={!rooms.length}
            className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            <option value="">{rooms.length ? 'Choose a room type' : 'No room types yet'}</option>
            {rooms.map(r => (
              <option key={readId(r)} value={readId(r)}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        {mode === 'inventory' && (
          <Field label="First stay date" className="sm:w-44">
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </Field>
        )}
        <div className="filter-end sm:ml-auto flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono text-[11px]">
            {selectedHotel?.timezone || 'Property timezone'}
          </span>
          <AsyncButton
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Reload data"
            aria-label="Reload data"
            onClick={loadRoomData}
            busy={loading}
          >
            <RefreshCw size={15} />
          </AsyncButton>
        </div>
      </div>

      {mode === 'rooms' && (
        <KpiStrip
          items={[
            { label: 'Active room types', value: rooms.length, detail: selectedHotel?.name || 'Selected property' },
            { label: 'Sellable rooms', value: activeSellableRooms, detail: 'Configured across active types' },
            {
              label: 'Guest capacity',
              value: rooms.reduce((sum, r) => sum + r.maxAdults + r.maxChildren, 0),
              detail: 'Maximum guests across one room per type',
            },
          ]}
          loading={loading || !!error}
        />
      )}

      {mode === 'rates' && (
        <KpiStrip
          items={[
            { label: 'Room types', value: rooms.length, detail: selectedHotel?.name || 'Selected property' },
            { label: 'Rates configured', value: rateCoverage?.configured, detail: 'Active room types with a base rate' },
            { label: 'Rates missing', value: rateCoverage?.missing, detail: 'Active room types without a base rate' },
          ]}
          loading={loading || !!error || (rooms.length > 0 && !rateCoverage)}
        />
      )}

      {mode === 'inventory' && (
        <KpiStrip
          items={[
            { label: 'Dates initialized', value: days.length, detail: `of 14 nights from ${from || 'selected date'}` },
            { label: 'Available room-nights', value: inventorySummary.available, detail: 'Selected room type and date range' },
            {
              label: 'Held + confirmed',
              value: inventorySummary.held + inventorySummary.confirmed,
              detail: `${inventorySummary.held} held · ${inventorySummary.confirmed} confirmed`,
            },
            { label: 'Blocked room-nights', value: inventorySummary.blocked, detail: 'Selected room type and date range' },
          ]}
          loading={loading || !!error}
        />
      )}

      {loading && <LoadingRows count={5} />}

      {!loading && hotels.length === 0 && (
        <EmptyState icon={<Building2 />} title="No properties to show" copy="Create a property or ask an administrator to assign one to your staff account." />
      )}

      {!loading && hotels.length > 0 && rooms.length === 0 && (
        <EmptyState icon={<BedDouble />} title="No room types yet" copy={`Add a room type to ${selectedHotel?.name || 'this property'} before managing rates or availability.`} />
      )}

      {!loading && rooms.length > 0 && mode === 'rooms' && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Room type</th>
                <th className="py-3 px-4">Guests</th>
                <th className="py-3 px-4">Sellable rooms</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map(room => (
                <tr key={readId(room)} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-sky-100/70 text-sky-700 flex items-center justify-center shrink-0">
                        <BedDouble size={16} />
                      </span>
                      <span className="flex flex-col">
                        <b className="font-semibold text-slate-900">{room.name}</b>
                        <small className="text-[11px] text-slate-400 font-mono">{room.code}</small>
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {room.maxAdults} adults{room.maxChildren ? ` · ${room.maxChildren} children` : ''}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{room.totalRooms}</td>
                  <td className="py-3.5 px-4">
                    <Status status={room.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rooms.length > 0 && mode === 'rates' && (
        <div className="rate-card max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6" key={`${roomId}-${rate?._id || 'unset'}`}>
          <div className="rate-head flex items-center gap-3 pb-4 border-b border-slate-100">
            <span className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{selectedRoom?.name}</h2>
              <p className="text-xs text-slate-500">{selectedHotel?.name} · base nightly price</p>
            </div>
          </div>

          {rate && (
            <div className="current-rate p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-baseline gap-2 text-xs">
              <span className="text-amber-800 font-medium">Current rate:</span>
              <strong className="text-base font-bold text-amber-950 font-mono">
                {rate.currency} {Number(rate.amountMinorUnits).toLocaleString()}
              </strong>
              <span className="text-amber-700 text-[11px]">minor units / night (before tax)</span>
            </div>
          )}

          <form onSubmit={saveRate} className="rate-form grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nightly amount (minor units)">
              <input
                name="amount"
                type="number"
                step="1"
                min="0"
                required
                defaultValue={rate?.amountMinorUnits ?? ''}
                placeholder="e.g. 15000 for 150.00"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </Field>
            <Field label="Currency code">
              <input
                name="currency"
                required
                pattern="[A-Za-z]{3}"
                maxLength={3}
                defaultValue={rate?.currency || ''}
                placeholder="ISO 4217 (e.g. INR)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
              />
            </Field>
            <Field label="Reason for change" fullWidth>
              <input
                name="reason"
                required
                minLength={3}
                placeholder="Initial rate setup"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </Field>
            <div className="col-span-full pt-2">
              <AsyncButton
                type="submit"
                disabled={!canEditRates}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                busy={busy}
                loadingLabel="Saving rate…"
              >
                {rate ? 'Save base rate' : 'Set base rate'}
                <span aria-hidden="true">↗</span>
              </AsyncButton>
              {!canEditRates && <small className="text-xs text-slate-400 block mt-2">You have view access only for rates.</small>}
            </div>
          </form>
        </div>
      )}

      {!loading && rooms.length > 0 && mode === 'inventory' && (
        <div className="space-y-4">
          <div className="calendar-title flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{selectedRoom?.name}</h2>
              <p className="text-xs text-slate-500">
                Fourteen nights from {from}. Each date is local to {selectedHotel?.timezone}.
              </p>
            </div>
            <div className="legend flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Fully allocated
              </span>
            </div>
          </div>

          {missing > 0 && (
            <div className="initialize-banner p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-xs">
              <div>
                <b className="block font-semibold text-amber-900">{missing} dates need inventory setup</b>
                <span className="text-amber-700">Initialize new dates with the room type's current sellable room count.</span>
              </div>
              {staff.permissions.includes('inventory.adjust') && (
                <AsyncButton
                  className="px-3 py-1.5 bg-white hover:bg-amber-100/60 text-amber-900 font-semibold border border-amber-300 rounded-lg shadow-2xs shrink-0 transition-colors"
                  busy={busy}
                  loadingLabel="Initializing dates…"
                  onClick={initialize}
                >
                  Initialize date range
                </AsyncButton>
              )}
            </div>
          )}

          <div className="calendar-grid grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 14 }, (_, index) => {
              const date = plusDays(from, index);
              const day = days.find(item => item.stayDate === date);
              return (
                <div
                  key={date}
                  className={`day-cell p-3.5 rounded-xl border flex flex-col justify-between min-h-[180px] relative transition-shadow hover:shadow-2xs ${
                    day ? 'bg-white border-slate-200' : 'bg-slate-50/60 border-slate-200 border-dashed'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}
                    </span>
                    <b className="text-xl font-extrabold text-slate-800 block mt-0.5">{date.slice(8)}</b>
                    <span className="text-[10px] text-slate-400 block">{new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}</span>
                  </div>

                  {day ? (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-baseline justify-between">
                        <span className={`text-xl font-bold font-mono ${day.available ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {day.available}
                        </span>
                        <small className="text-[10px] text-slate-400">avail</small>
                      </div>
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                        <span>{day.total} tot</span>
                        <span>{day.held} held</span>
                        <span>{day.confirmed} book</span>
                        <span>{day.blocked} blk</span>
                      </div>
                      {day.available > 0 && staff.permissions.includes('inventory.block') && (
                        <AsyncButton
                          className="w-full text-left text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 pt-1 transition-colors"
                          busy={busy}
                          loadingLabel="Blocking…"
                          onClick={() => blockDate(day)}
                        >
                          Block rooms
                        </AsyncButton>
                      )}
                    </div>
                  ) : (
                    <div className="my-auto text-center">
                      <span className="text-xs text-amber-700 font-medium block">Not set</span>
                      <small className="text-[10px] text-slate-400 block">Initialize</small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="calendar-footnote text-xs text-slate-500 flex items-center gap-2 pt-2">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">i</span>
            <span>Available = total rooms − blocked − held − confirmed. Changes are recorded in the audit log.</span>
          </div>
        </div>
      )}
    </div>
  );
}
