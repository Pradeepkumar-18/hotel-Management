import { type FormEvent } from 'react';
import { Hotel } from '../../../api';
import { Field, Input, Textarea, Button } from '../../../components/ui';
import { Can } from '../../auth/Can';

interface HotelGeneralSectionProps {
  hotel: Hotel;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  getError: (field: string) => string | undefined;
}

export function HotelGeneralSection({
  hotel,
  onSubmit,
  busy,
  getError,
}: HotelGeneralSectionProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Basic Information</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage general identity, physical location, and direct contact details.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Group 1: Identity */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Property Identity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Property name" required error={getError('name')}>
              <Input
                name="name"
                required
                minLength={2}
                defaultValue={hotel.name}
                isError={Boolean(getError('name'))}
              />
            </Field>

            <Field label="URL slug" required error={getError('slug')}>
              <Input
                name="slug"
                required
                defaultValue={hotel.slug}
                className="font-mono lowercase"
                isError={Boolean(getError('slug'))}
              />
            </Field>

            <Field
              label="Property description"
              fullWidth
              hint="Provide an overview of the property, highlights, and amenities for guests."
              error={getError('description')}
            >
              <Textarea
                name="description"
                rows={4}
                defaultValue={hotel.description || ''}
                placeholder="e.g. Luxury heritage resort located along the serene coast..."
                isError={Boolean(getError('description'))}
              />
            </Field>
          </div>
        </div>

        {/* Group 2: Location */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Physical Location
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Street address" fullWidth required error={getError('address.line1')}>
              <Input
                name="address.line1"
                required
                defaultValue={hotel.address?.line1 || ''}
                isError={Boolean(getError('address.line1'))}
              />
            </Field>

            <Field label="City" required error={getError('address.city')}>
              <Input
                name="address.city"
                required
                defaultValue={hotel.address?.city || ''}
                isError={Boolean(getError('address.city'))}
              />
            </Field>

            <Field label="Postal code" required error={getError('address.postalCode')}>
              <Input
                name="address.postalCode"
                required
                defaultValue={hotel.address?.postalCode || ''}
                isError={Boolean(getError('address.postalCode'))}
              />
            </Field>

            <Field label="Country code" required error={getError('address.countryCode')}>
              <Input
                name="address.countryCode"
                required
                minLength={2}
                maxLength={2}
                defaultValue={hotel.address?.countryCode || 'IN'}
                className="uppercase font-mono"
                isError={Boolean(getError('address.countryCode'))}
              />
            </Field>

            <Field label="Time zone" required error={getError('timezone')}>
              <Input
                name="timezone"
                required
                defaultValue={hotel.timezone || 'Asia/Kolkata'}
                isError={Boolean(getError('timezone'))}
              />
            </Field>
          </div>
        </div>

        {/* Group 3: Contact */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Direct Contacts
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact email" required error={getError('contact.email')}>
              <Input
                type="email"
                name="contact.email"
                required
                defaultValue={hotel.contact?.email || ''}
                isError={Boolean(getError('contact.email'))}
              />
            </Field>

            <Field label="Contact phone" error={getError('contact.phone')}>
              <Input
                name="contact.phone"
                defaultValue={hotel.contact?.phone || ''}
                isError={Boolean(getError('contact.phone'))}
              />
            </Field>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <Can permission="hotels.edit">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={busy}
              loadingLabel="Saving details…"
            >
              Save property details
            </Button>
          </Can>
        </div>
      </form>
    </div>
  );
}
