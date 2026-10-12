import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { ApiError, Hotel, InventoryDay, request, RoomType, StaffMe } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Alert, Button, Field, Input, KpiStrip, PageHeading, Select } from '../../components/ui';
import { plusDays, readId } from '../../utils/helpers';
import { RoomTypesView } from './views/RoomTypesView';
import { InventoryCalendarView } from './views/InventoryCalendarView';
import { BaseRatesView } from './views/BaseRatesView';

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

  const selectedHotel = hotels.find((h) => readId(h) === hotelId);
  const selectedRoom = rooms.find((r) => readId(r) === roomId);

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
      .then((rs) => {
        if (live) {
          setRooms(rs);
          setRoomId((current) => (rs.some((r) => readId(r) === current) ? current : rs[0] ? readId(rs[0]) : ''));
        }
      })
      .catch((e) => {
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
      rooms.map((room) =>
        request(`/admin/room-types/${readId(room)}/base-rate`)
          .then(() => true)
          .catch((err) => {
            if (err instanceof ApiError && err.status === 404) return false;
            throw err;
          })
      )
    )
      .then((results) => {
        if (live)
          setRateCoverage({
            configured: results.filter(Boolean).length,
            missing: results.filter((val) => !val).length,
          });
      })
      .catch((err) => {
        if (live) setError(err instanceof Error ? err.message : 'Could not load rate summary');
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

  const saveRate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void run(async () => {
      try {
        const payload: { amountMinorUnits: number; currency: string; reason: string; version?: number } = {
          amountMinorUnits: Number(f.get('amount')),
          currency: String(f.get('currency')).toUpperCase(),
          reason: String(f.get('reason')),
        };
        if (rate?.version !== undefined) payload.version = rate.version;
        const next = await request(`/admin/room-types/${roomId}/base-rate`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setRate(next);
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
          <Select value={hotelId} onChange={(e) => setHotelId(e.target.value)}>
            <option value="">Choose a property</option>
            {hotels.map((h) => (
              <option key={readId(h)} value={readId(h)}>
                {h.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Room type" className="sm:w-60">
          <Select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!rooms.length}>
            <option value="">{rooms.length ? 'Choose a room type' : 'No room types yet'}</option>
            {rooms.map((r) => (
              <option key={readId(r)} value={readId(r)}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>

        {mode === 'inventory' && (
          <Field label="First stay date" className="sm:w-44">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
        )}

        <div className="sm:ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={() => void loadRoomData()}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {mode === 'rooms' && selectedHotel && (
        <KpiStrip
          items={[
            { label: 'Room categories', value: rooms.length, subtext: selectedHotel.name },
            { label: 'Total sellable inventory', value: `${activeSellableRooms} rooms`, subtext: 'Across all room types' },
            { label: 'Property status', value: selectedHotel.status, subtext: selectedHotel.address?.city || 'Unassigned' },
          ]}
        />
      )}

      {mode === 'inventory' && selectedRoom && days.length > 0 && (
        <KpiStrip
          items={[
            { label: 'Available room nights', value: inventorySummary.available, subtext: 'Next 14 nights' },
            { label: 'Reserved / Confirmed', value: inventorySummary.confirmed, subtext: 'Booked room nights' },
            { label: 'Maintenance blocks', value: inventorySummary.blocked, subtext: 'Unavailable nights' },
          ]}
        />
      )}

      {mode === 'rates' && selectedRoom && rateCoverage && (
        <KpiStrip
          items={[
            { label: 'Room types priced', value: `${rateCoverage.configured} of ${rooms.length}`, subtext: selectedHotel?.name },
            { label: 'Unpriced room types', value: rateCoverage.missing, subtext: rateCoverage.missing ? 'Requires base rate' : 'Ready' },
            { label: 'Active currency', value: rate?.currency || 'INR', subtext: 'Minor units' },
          ]}
        />
      )}

      {mode === 'rooms' && (
        <RoomTypesView rooms={rooms} loading={loading} selectedHotelName={selectedHotel?.name} />
      )}

      {!loading && rooms.length > 0 && mode === 'rates' && (
        <BaseRatesView
          selectedRoomName={selectedRoom?.name}
          selectedHotelName={selectedHotel?.name}
          rate={rate}
          roomId={roomId}
          canEditRates={canEditRates}
          busy={busy}
          onSaveRate={saveRate}
        />
      )}

      {!loading && rooms.length > 0 && mode === 'inventory' && (
        <InventoryCalendarView
          selectedRoomName={selectedRoom?.name}
          selectedHotelTimezone={selectedHotel?.timezone}
          from={from}
          days={days}
          missing={missing}
          staff={staff}
          busy={busy}
          onInitialize={initialize}
          onBlockDate={blockDate}
        />
      )}
    </div>
  );
}
