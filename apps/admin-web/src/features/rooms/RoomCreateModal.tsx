import React from 'react';
import { request } from '../../api';
import { AsyncButton, useBusyGuard, useToast } from '../../ui-feedback';
import { Field, Modal } from '../../components/ui';

export function RoomCreateModal({ hotelId, onClose, onCreated }: { hotelId: string; onClose: () => void; onCreated: () => void }) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void run(async () => {
      try {
        await request(`/admin/hotels/${hotelId}/room-types`, {
          method: 'POST',
          body: JSON.stringify({
            name: String(f.get('name')),
            code: String(f.get('code')),
            maxAdults: Number(f.get('adults')),
            maxChildren: Number(f.get('children')),
            totalRooms: Number(f.get('total')),
          }),
        });
        toast.success('Room type added.');
        onCreated();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not create room type');
      }
    });
  };

  return (
    <Modal title="Add a room type" subtitle="Set the sellable room count and guest capacity." onClose={onClose}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
        <Field label="Room name">
          <input
            name="name"
            required
            placeholder="Courtyard king"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Room code">
          <input
            name="code"
            required
            placeholder="COURT-K"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Adults">
          <input
            name="adults"
            type="number"
            min="1"
            max="30"
            required
            defaultValue="2"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Children">
          <input
            name="children"
            type="number"
            min="0"
            max="30"
            required
            defaultValue="0"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Sellable rooms" fullWidth>
          <input
            name="total"
            type="number"
            min="0"
            max="10000"
            required
            defaultValue="8"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <div className="col-span-full pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
          <button type="button" className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" onClick={onClose}>
            Cancel
          </button>
          <AsyncButton type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs" busy={busy} loadingLabel="Adding room type…">
            Add room type
          </AsyncButton>
        </div>
      </form>
    </Modal>
  );
}
