import React from 'react';
import { Hotel, request } from '../../api';
import { AsyncButton, useBusyGuard, useToast } from '../../ui-feedback';
import { Field, Modal } from '../../components/ui';

export function HotelCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (hotel: Hotel) => void }) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void run(async () => {
      const name = String(f.get('name'));
      try {
        const h = await request<Hotel>('/admin/hotels', {
          method: 'POST',
          body: JSON.stringify({
            name,
            slug: String(f.get('slug')),
            timezone: String(f.get('timezone')),
            address: {
              line1: String(f.get('line1')),
              city: String(f.get('city')),
              postalCode: String(f.get('postalCode')),
              countryCode: String(f.get('countryCode')),
            },
            contact: { email: String(f.get('email')) },
          }),
        });
        toast.success('Property created as a draft.');
        onCreated(h);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not create hotel');
      }
    });
  };

  return (
    <Modal title="Add a property" subtitle="Start with the essential details. You can configure room types and policies next." onClose={onClose}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
        <Field label="Property name">
          <input
            name="name"
            required
            minLength={2}
            placeholder="The Linden House"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Property slug">
          <input
            name="slug"
            required
            placeholder="the-linden-house"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Street address" fullWidth>
          <input
            name="line1"
            required
            placeholder="18 Residency Road"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="City">
          <input
            name="city"
            required
            placeholder="Bengaluru"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Postal code">
          <input
            name="postalCode"
            required
            placeholder="560025"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Country code">
          <input
            name="countryCode"
            required
            minLength={2}
            maxLength={2}
            defaultValue="IN"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Time zone">
          <input
            name="timezone"
            required
            defaultValue="Asia/Kolkata"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <Field label="Contact email" fullWidth>
          <input
            name="email"
            required
            type="email"
            placeholder="frontdesk@example.com"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
        <div className="col-span-full pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
          <button type="button" className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" onClick={onClose}>
            Cancel
          </button>
          <AsyncButton type="submit" busy={busy} loadingLabel="Creating property…" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs">
            Create draft property
          </AsyncButton>
        </div>
      </form>
    </Modal>
  );
}
