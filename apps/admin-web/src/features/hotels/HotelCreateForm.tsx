import { useState, type FormEvent } from 'react';
import { Building2, Check } from 'lucide-react';
import { Hotel, HotelMediaItem, updateHotelMedia } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Textarea, Alert } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { createHotel } from './hotels.api';
import { readId } from '../../utils/helpers';
import { HotelMediaGalleryManager } from './HotelMediaGalleryManager';

export interface HotelCreateFormProps {
  onSuccess: (createdHotel: Hotel) => void;
  onCancel: () => void;
}

export function HotelCreateForm({ onSuccess, onCancel }: HotelCreateFormProps) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>([]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const f = new FormData(e.currentTarget);

    void run(async () => {
      const name = String(f.get('name') ?? '').trim();
      const description = String(f.get('description') ?? '').trim() || undefined;
      try {
        const h = await createHotel({
          name,
          slug: String(f.get('slug') ?? '').trim(),
          timezone: String(f.get('timezone') ?? '').trim(),
          description,
          address: {
            line1: String(f.get('address.line1') ?? f.get('line1') ?? '').trim(),
            city: String(f.get('address.city') ?? f.get('city') ?? '').trim(),
            postalCode: String(f.get('address.postalCode') ?? f.get('postalCode') ?? '').trim(),
            countryCode: String(f.get('address.countryCode') ?? f.get('countryCode') ?? '').trim().toUpperCase(),
          },
          contact: {
            email: String(f.get('contact.email') ?? f.get('email') ?? '').trim(),
            phone: f.get('contact.phone') ? String(f.get('contact.phone')).trim() : undefined,
          },
        });

        // If gallery photos were uploaded, save them to hotel media immediately
        if (mediaList.length > 0) {
          try {
            const withMedia = await updateHotelMedia(readId(h), h.version, mediaList);
            toast.success(`Property "${name}" created with ${mediaList.length} gallery photos.`);
            onSuccess(withMedia);
            return;
          } catch {
            // Media update failed but hotel was created
          }
        }

        toast.success(`Property "${name}" created as a draft.`);
        onSuccess(h);
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-brand-primary flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Add New Property</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Start with the essential details. You can configure room types, rates, and policies next.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="p-6 sm:p-8 space-y-8">
        {formErrors.formError && (
          <Alert tone="error">{formErrors.formError}</Alert>
        )}

        {/* Section 1: Property Identity */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Property Identity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Property name" required hint="e.g. The Linden Grand Hotel" error={formErrors.getError('name')}>
              <Input
                name="name"
                required
                minLength={2}
                placeholder="The Linden Grand Hotel"
                isError={Boolean(formErrors.getError('name'))}
              />
            </Field>

            <Field label="Property URL slug" required hint="Unique URL slug (e.g. linden-grand)" error={formErrors.getError('slug')}>
              <Input
                name="slug"
                required
                placeholder="linden-grand"
                className="font-mono lowercase"
                isError={Boolean(formErrors.getError('slug'))}
              />
            </Field>

            <Field label="Time zone" required hint="Used for check-in cutoffs and inventory calendar" error={formErrors.getError('timezone')}>
              <Input
                name="timezone"
                required
                defaultValue="Asia/Kolkata"
                className="font-mono"
                isError={Boolean(formErrors.getError('timezone'))}
              />
            </Field>

            <Field label="Contact email" required hint="Primary frontdesk or reservations email" error={formErrors.getError('contact.email')}>
              <Input
                name="contact.email"
                required
                type="email"
                placeholder="frontdesk@lindengrand.com"
                isError={Boolean(formErrors.getError('contact.email'))}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Property description"
                hint="Describe the property's character, standout luxury amenities, and guest experience"
                error={formErrors.getError('description')}
              >
                <Textarea
                  name="description"
                  rows={3}
                  placeholder="e.g. Nestled in the heart of the city, The Linden Grand offers world-class dining, heated indoor pools, and bespoke concierge services..."
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Section 2: Location & Address */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Physical Location
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-3">
              <Field label="Street address" required error={formErrors.getError('address.line1')}>
                <Input
                  name="address.line1"
                  required
                  placeholder="18 Residency Road, Richmond Town"
                  isError={Boolean(formErrors.getError('address.line1'))}
                />
              </Field>
            </div>

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

            <Field label="Country code" required hint="ISO 2-letter (e.g. IN, US, GB)" error={formErrors.getError('address.countryCode')}>
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
          </div>
        </div>

        {/* Section 3: Property Photo Gallery & Visual Media */}
        <div className="pt-6 border-t border-slate-100">
          <HotelMediaGalleryManager
            media={mediaList}
            onChange={setMediaList}
            disabled={busy}
          />
        </div>

        {/* Actions Footer - Single Cancel button */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Check size={16} />}
            isLoading={busy}
            loadingLabel="Creating property…"
          >
            Create draft property
          </Button>
        </div>
      </form>
    </div>
  );
}
