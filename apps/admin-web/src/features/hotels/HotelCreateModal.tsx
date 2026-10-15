import type { FormEvent } from 'react';
import { Hotel } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Modal, Alert } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { createHotel } from './hotels.api';

export function HotelCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (hotel: Hotel) => void }) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const f = new FormData(e.currentTarget);
    void run(async () => {
      const name = String(f.get('name') ?? '');
      try {
        const h = await createHotel({
          name,
          slug: String(f.get('slug') ?? ''),
          timezone: String(f.get('timezone') ?? ''),
          address: {
            line1: String(f.get('address.line1') ?? f.get('line1') ?? ''),
            city: String(f.get('address.city') ?? f.get('city') ?? ''),
            postalCode: String(f.get('address.postalCode') ?? f.get('postalCode') ?? ''),
            countryCode: String(f.get('address.countryCode') ?? f.get('countryCode') ?? ''),
          },
          contact: {
            email: String(f.get('contact.email') ?? f.get('email') ?? ''),
            phone: f.get('contact.phone') ? String(f.get('contact.phone')) : undefined,
          },
        });
        toast.success('Property created as a draft.');
        onCreated(h);
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <Modal
      title="Add a property"
      subtitle="Start with the essential details. You can configure room types and policies next."
      onClose={onClose}
    >
      {formErrors.formError && (
        <div className="mb-4">
          <Alert tone="error">{formErrors.formError}</Alert>
        </div>
      )}
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={submit}>
        <Field label="Property name" required error={formErrors.getError('name')}>
          <Input
            name="name"
            required
            minLength={2}
            placeholder="The Linden House"
            isError={Boolean(formErrors.getError('name'))}
          />
        </Field>
        <Field label="Property slug" required error={formErrors.getError('slug')}>
          <Input
            name="slug"
            required
            placeholder="the-linden-house"
            className="font-mono"
            isError={Boolean(formErrors.getError('slug'))}
          />
        </Field>
        <Field label="Street address" fullWidth required error={formErrors.getError('address.line1')}>
          <Input
            name="address.line1"
            required
            placeholder="18 Residency Road"
            isError={Boolean(formErrors.getError('address.line1'))}
          />
        </Field>
        <Field label="City" required error={formErrors.getError('address.city')}>
          <Input
            name="address.city"
            required
            placeholder="Bengaluru"
            isError={Boolean(formErrors.getError('address.city'))}
          />
        </Field>
        <Field label="Postal code" required error={formErrors.getError('address.postalCode')}>
          <Input
            name="address.postalCode"
            required
            placeholder="560025"
            isError={Boolean(formErrors.getError('address.postalCode'))}
          />
        </Field>
        <Field label="Country code" required error={formErrors.getError('address.countryCode')}>
          <Input
            name="address.countryCode"
            required
            minLength={2}
            maxLength={2}
            defaultValue="IN"
            className="uppercase font-mono"
            isError={Boolean(formErrors.getError('address.countryCode'))}
          />
        </Field>
        <Field label="Time zone" required error={formErrors.getError('timezone')}>
          <Input
            name="timezone"
            required
            defaultValue="Asia/Kolkata"
            className="font-mono"
            isError={Boolean(formErrors.getError('timezone'))}
          />
        </Field>
        <Field label="Contact email" fullWidth required error={formErrors.getError('contact.email')}>
          <Input
            name="contact.email"
            required
            type="email"
            placeholder="frontdesk@example.com"
            isError={Boolean(formErrors.getError('contact.email'))}
          />
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
