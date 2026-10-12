import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BedDouble, Check, Plus } from 'lucide-react';
import { Hotel, request, RoomType, StaffMe } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Modal, Select, Status } from '../../components/ui';
import { isoToday, readId } from '../../utils/helpers';
import { RoomCreateModal } from '../rooms/RoomCreateModal';

export function HotelWorkspace({
  hotel: initial,
  onClose,
  onSaved,
  staff,
}: {
  hotel: Hotel;
  onClose: () => void;
  onSaved: (hotel: Hotel) => void;
  staff: StaffMe;
}) {
  const [hotel, setHotel] = useState(initial);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const [showRoom, setShowRoom] = useState(false);

  const loadRooms = useCallback(async () => {
    try {
      setRooms(await request<RoomType[]>(`/admin/hotels/${readId(hotel)}/room-types`));
    } catch {
      setRooms([]);
    }
  }, [hotel]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const publish = () =>
    run(async () => {
      try {
        const h = await request<Hotel>(`/admin/hotels/${readId(hotel)}/publish`, {
          method: 'POST',
          body: JSON.stringify({ version: hotel.version }),
        });
        setHotel(h);
        onSaved(h);
        toast.success('Property published and visible in the catalog.');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Publication could not be completed');
      }
    });

  const savePolicy = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fee = (prefix: string) => {
      const basis = String(f.get(`${prefix}Basis`));
      return basis === 'FIXED_MINOR_UNITS'
        ? { basis, amountMinorUnits: Number(f.get(`${prefix}Amount`)), currency: String(f.get(`${prefix}Currency`)).toUpperCase() }
        : basis === 'PERCENTAGE_BPS'
        ? { basis, percentageBps: Math.round(Number(f.get(`${prefix}Percent`)) * 100) }
        : { basis };
    };
    void run(async () => {
      try {
        const h = await request<Hotel>(`/admin/hotels/${readId(hotel)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            version: hotel.version,
            cancellationPolicy: {
              effectiveFrom: String(f.get('effectiveFrom')),
              freeCancellationHoursBeforeCheckIn: Number(f.get('cutoff')),
              afterCutoff: fee('after'),
              noShow: fee('noShow'),
            },
          }),
        });
        setHotel(h);
        onSaved(h);
        toast.success('Cancellation and no-show terms saved.');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not save policy');
      }
    });
  };

  return (
    <Modal title={hotel.name} subtitle={`${hotel.address?.city} · ${hotel.timezone} · Property workspace`} onClose={onClose} wide>
      <div className="workspace-top flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Status status={hotel.status} variant="pill" />
          <span className="workspace-slug text-xs font-mono text-slate-400">/{hotel.slug}</span>
        </div>
        {staff.permissions.includes('hotels.publish') && hotel.status !== 'PUBLISHED' && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Check size={15} />}
            isLoading={busy}
            loadingLabel="Publishing property…"
            onClick={publish}
          >
            Publish property
          </Button>
        )}
      </div>

      <div className="setup-progress flex items-center p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs">
        <div className={`flex items-center gap-2 font-medium ${rooms.length ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${rooms.length ? 'bg-emerald-100 text-emerald-800' : 'border border-slate-300'}`}>
            {rooms.length ? <Check size={12} /> : '1'}
          </span>
          <b>Room types</b>
        </div>
        <div className="flex-1 h-px bg-slate-200 mx-3" />
        <div className="flex items-center gap-2 text-emerald-800 font-bold">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">2</span>
          <b>Rates & availability</b>
        </div>
        <div className="flex-1 h-px bg-slate-200 mx-3" />
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">3</span>
          <b>Publish</b>
        </div>
      </div>

      <div className="workspace-section space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Room types</h3>
            <p className="text-xs text-slate-500">{rooms.length ? `${rooms.length} room type${rooms.length === 1 ? '' : 's'} configured` : 'Create a room type to start selling stays.'}</p>
          </div>
          {staff.permissions.includes('room_types.create') && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowRoom(true)}
            >
              Add room
            </Button>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="p-4 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 text-center">
            No rooms yet. Add at least one room category to configure inventory and pricing.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rooms.map((room) => (
              <div key={readId(room)} className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <BedDouble size={14} />
                  </span>
                  <div>
                    <b className="font-semibold text-slate-800 block">{room.name}</b>
                    <span className="text-[11px] text-slate-400 font-mono">{room.code} · {room.totalRooms} rooms</span>
                  </div>
                </div>
                <Status status={room.status} variant="dot" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="workspace-section space-y-3 pt-4 border-t border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Cancellation & check-in policy</h3>
          <p className="text-xs text-slate-500">Explicit guest terms stored with every booking snapshot.</p>
        </div>

        <form onSubmit={savePolicy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Effective date" required>
            <Input
              type="date"
              name="effectiveFrom"
              required
              defaultValue={hotel.cancellationPolicy?.effectiveFrom || isoToday(hotel.timezone)}
            />
          </Field>

          <Field label="Free cancellation cutoff" required>
            <Input
              type="number"
              name="cutoff"
              required
              min="0"
              max="8760"
              defaultValue={hotel.cancellationPolicy?.freeCancellationHoursBeforeCheckIn ?? 24}
              rightIcon={<span className="text-[11px] font-medium text-slate-500">hours before check-in</span>}
            />
          </Field>

          <FeeField label="After cutoff" prefix="after" initial={hotel.cancellationPolicy?.afterCutoff} />
          <FeeField label="No-show" prefix="noShow" initial={hotel.cancellationPolicy?.noShow} />

          <div className="col-span-full space-y-2 pt-2">
            <small className="text-[11px] text-slate-400 block">Any fixed fee must use the same currency as the property's room rates.</small>
            {staff.permissions.includes('hotels.edit') && (
              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={busy}
                loadingLabel="Saving terms…"
              >
                Save cancellation terms
              </Button>
            )}
          </div>
        </form>
      </div>

      {showRoom && (
        <RoomCreateModal
          hotelId={String(readId(hotel))}
          onClose={() => setShowRoom(false)}
          onCreated={() => {
            setShowRoom(false);
            void loadRooms();
          }}
        />
      )}
    </Modal>
  );
}

function FeeField({ label, prefix, initial }: { label: string; prefix: string; initial?: any }) {
  const [basis, setBasis] = useState(initial?.basis || 'NO_FEE');

  return (
    <div className="field flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <Select
        name={`${prefix}Basis`}
        value={basis}
        onChange={(e) => setBasis(e.target.value)}
      >
        <option value="NO_FEE">No fee</option>
        <option value="FULL_STAY">Full stay amount</option>
        <option value="FIXED_MINOR_UNITS">Fixed amount</option>
        <option value="PERCENTAGE_BPS">Percentage</option>
      </Select>

      {basis === 'FIXED_MINOR_UNITS' && (
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            aria-label={`${label} amount in minor units`}
            type="number"
            min="0"
            step="1"
            name={`${prefix}Amount`}
            required
            defaultValue={initial?.amountMinorUnits}
            placeholder="Amount (minor units)"
          />
          <Input
            aria-label={`${label} currency code`}
            name={`${prefix}Currency`}
            required
            minLength={3}
            maxLength={3}
            defaultValue={initial?.currency}
            placeholder="ISO currency"
            className="uppercase font-mono"
          />
        </div>
      )}

      {basis === 'PERCENTAGE_BPS' && (
        <div className="mt-1">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            name={`${prefix}Percent`}
            required
            defaultValue={initial?.percentageBps !== undefined ? initial.percentageBps / 100 : ''}
            rightIcon={<span className="text-[11px] font-medium text-slate-500">% of stay</span>}
          />
        </div>
      )}
    </div>
  );
}
