import type { FormEvent } from 'react';
import { Hotel, request } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Modal } from '../../components/ui';

export function HotelCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (hotel: Hotel) => void }) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();

  const submit = (e: FormEvent<HTMLFormElement>) => {
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
    <Modal
      title="Add a property"
      subtitle="Start with the essential details. You can configure room types and policies next."
      onClose={onClose}
    >
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
        <Field label="Property name" required>
          <Input name="name" required minLength={2} placeholder="The Linden House" />
        </Field>
        <Field label="Property slug" required>
          <Input name="slug" required placeholder="the-linden-house" className="font-mono" />
        </Field>
        <Field label="Street address" fullWidth required>
          <Input name="line1" required placeholder="18 Residency Road" />
        </Field>
        <Field label="City" required>
          <Input name="city" required placeholder="Bengaluru" />
        </Field>
        <Field label="Postal code" required>
          <Input name="postalCode" required placeholder="560025" />
        </Field>
        <Field label="Country code" required>
          <Input name="countryCode" required minLength={2} maxLength={2} defaultValue="IN" className="uppercase font-mono" />
        </Field>
        <Field label="Time zone" required>
          <Input name="timezone" required defaultValue="Asia/Kolkata" className="font-mono" />
        </Field>
        <Field label="Contact email" fullWidth required>
          <Input name="email" required type="email" placeholder="frontdesk@example.com" />
        </Field>
        <div className="col-span-full pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={busy} loadingLabel="Creating property…">
            Create draft property
          </Button>
        </div>
      </form>
    </Modal>
  );
}
