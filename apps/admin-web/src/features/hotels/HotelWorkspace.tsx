import React, { useCallback, useEffect, useState } from 'react';
import { BedDouble, Check, Plus } from 'lucide-react';
import { Hotel, request, RoomType, StaffMe } from '../../api';
import { AsyncButton, useBusyGuard, useToast } from '../../ui-feedback';
import { Field, Modal, Status } from '../../components/ui';
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

  const savePolicy = (e: React.FormEvent<HTMLFormElement>) => {
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
          <Status status={hotel.status} />
          <span className="workspace-slug text-xs font-mono text-slate-400">/{hotel.slug}</span>
        </div>
        {staff.permissions.includes('hotels.publish') && hotel.status !== 'PUBLISHED' && (
          <AsyncButton
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            busy={busy}
            loadingLabel="Publishing property…"
            onClick={publish}
          >
            <Check size={15} /> Publish property
          </AsyncButton>
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
            <button
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
              onClick={() => setShowRoom(true)}
            >
              <Plus size={14} /> Add room
            </button>
          )}
        </div>

        {rooms.length ? (
          <div className="room-list border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
            {rooms.map(r => (
              <div className="room-line p-3 flex items-center gap-3" key={readId(r)}>
                <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <BedDouble size={16} />
                </span>
                <span className="room-copy flex-1 min-w-0">
                  <b className="block text-xs font-semibold text-slate-900">{r.name}</b>
                  <small className="text-[11px] text-slate-500 block truncate">
                    {r.code} · up to {r.maxAdults} adults · {r.totalRooms} rooms
                  </small>
                </span>
                <Status status={r.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-center text-xs text-slate-500">
            No room types yet. Add your first room category.
          </div>
        )}
      </div>

      <div className="workspace-section policy-section pt-4 border-t border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cancellation terms</h3>
            <p className="text-xs text-slate-500">Enter the terms this property will honor. No default policy is assumed.</p>
          </div>
          {hotel.cancellationPolicy && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Check size={14} /> Policy saved
            </span>
          )}
        </div>

        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={savePolicy}>
          <Field label="Effective from">
            <input
              type="date"
              name="effectiveFrom"
              required
              defaultValue={hotel.cancellationPolicy?.effectiveFrom || isoToday(hotel.timezone)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </Field>

          <Field label="Free cancellation cutoff">
            <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
              <input
                type="number"
                name="cutoff"
                required
                min="0"
                max="8760"
                defaultValue={hotel.cancellationPolicy?.freeCancellationHoursBeforeCheckIn ?? 24}
                className="w-full px-3 py-2 bg-transparent text-xs text-slate-800 focus:outline-none"
              />
              <span className="px-2.5 text-[11px] text-slate-500 shrink-0 font-medium">hours before check-in</span>
            </div>
          </Field>

          <FeeField label="After cutoff" prefix="after" initial={hotel.cancellationPolicy?.afterCutoff} />
          <FeeField label="No-show" prefix="noShow" initial={hotel.cancellationPolicy?.noShow} />

          <div className="col-span-full space-y-2 pt-2">
            <small className="text-[11px] text-slate-400 block">Any fixed fee must use the same currency as the property's room rates.</small>
            {staff.permissions.includes('hotels.edit') && (
              <AsyncButton
                type="submit"
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 rounded-lg text-xs transition-colors shadow-2xs"
                busy={busy}
                loadingLabel="Saving terms…"
              >
                Save cancellation terms
              </AsyncButton>
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
      <select
        name={`${prefix}Basis`}
        value={basis}
        onChange={e => setBasis(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="NO_FEE">No fee</option>
        <option value="FULL_STAY">Full stay amount</option>
        <option value="FIXED_MINOR_UNITS">Fixed amount</option>
        <option value="PERCENTAGE_BPS">Percentage</option>
      </select>

      {basis === 'FIXED_MINOR_UNITS' && (
        <div className="grid grid-cols-2 gap-2 mt-1">
          <input
            aria-label={`${label} amount in minor units`}
            type="number"
            min="0"
            step="1"
            name={`${prefix}Amount`}
            required
            defaultValue={initial?.amountMinorUnits}
            placeholder="Amount (minor units)"
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
          />
          <input
            aria-label={`${label} currency code`}
            name={`${prefix}Currency`}
            required
            minLength={3}
            maxLength={3}
            defaultValue={initial?.currency}
            placeholder="ISO currency"
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 uppercase font-mono focus:outline-none"
          />
        </div>
      )}

      {basis === 'PERCENTAGE_BPS' && (
        <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 mt-1">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            name={`${prefix}Percent`}
            required
            defaultValue={initial?.percentageBps !== undefined ? initial.percentageBps / 100 : ''}
            className="w-full px-3 py-1.5 bg-transparent text-xs text-slate-800 focus:outline-none"
          />
          <span className="px-2.5 text-[11px] text-slate-500 shrink-0 font-medium">% of stay</span>
        </div>
      )}
    </div>
  );
}
