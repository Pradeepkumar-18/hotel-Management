import { useState, type ReactNode } from 'react';
import { Hotel } from '../../api';
import { Field, Input, Select, Textarea } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  INDIA_STATES,
  POSTAL_RULES,
  timezonesFor,
  slugify,
  withCurrent,
} from './hotel-options';

interface HotelDetailsFieldsProps {
  /** Existing hotel for edit mode; omit for a new property. */
  hotel?: Hotel;
  formErrors: ReturnType<typeof useServerErrors>;
}

/** Identity, contact and location fields shared by Add hotel and Edit hotel. */
export function HotelDetailsFields({ hotel, formErrors }: HotelDetailsFieldsProps) {
  const [slug, setSlug] = useState(hotel?.slug ?? '');
  // A new hotel's slug follows the name until the user types their own.
  const [slugEdited, setSlugEdited] = useState(Boolean(hotel));
  const [country, setCountry] = useState(hotel?.address?.countryCode?.toUpperCase() || DEFAULT_COUNTRY);
  const [timezone, setTimezone] = useState(hotel?.timezone || timezonesFor(country)[0].value);
  const postal = POSTAL_RULES[country];

  const changeCountry = (next: string) => {
    setCountry(next);
    const zones = timezonesFor(next);
    if (!zones.some((z) => z.value === timezone)) setTimezone(zones[0].value);
  };
  const err = formErrors.getError;

  return (
    <div className="space-y-8">
      <Group title="Basics">
        <Field label="Property name" required error={err('name')}>
          <Input
            name="name"
            required
            minLength={2}
            maxLength={140}
            defaultValue={hotel?.name}
            placeholder="The Linden Grand Hotel"
            onChange={(e) => !slugEdited && setSlug(slugify(e.target.value))}
            isError={Boolean(err('name'))}
          />
        </Field>

        <Field
          label="Web address"
          required
          hint={slug ? `Guests will see /${slug}` : 'Filled in from the name. You can change it.'}
          error={err('slug')}
        >
          <Input
            name="slug"
            required
            minLength={2}
            maxLength={160}
            pattern="[a-z0-9]+(-[a-z0-9]+)*-?"
            title="Lowercase letters, digits and dashes"
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              // Light clean-up while typing; the server normalises the final slug.
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-'));
            }}
            placeholder="linden-grand"
            className="font-mono"
            isError={Boolean(err('slug'))}
          />
        </Field>

        <Field label="Description" fullWidth hint="What makes the property special: highlights, amenities, experience." error={err('description')}>
          <Textarea
            name="description"
            rows={3}
            maxLength={5000}
            showCount
            defaultValue={hotel?.description ?? ''}
            placeholder="Nestled in the heart of the city, The Linden Grand offers…"
            isError={Boolean(err('description'))}
          />
        </Field>
      </Group>

      <Group title="Contact">
        <Field label="Email" required hint="Front desk or reservations" error={err('contact.email')}>
          <Input
            name="contact.email"
            type="email"
            required
            maxLength={254}
            defaultValue={hotel?.contact?.email ?? ''}
            placeholder="frontdesk@lindengrand.com"
            isError={Boolean(err('contact.email'))}
          />
        </Field>

        <Field label="Phone" hint="Optional, e.g. +91 80 4123 4567" error={err('contact.phone')}>
          <Input
            name="contact.phone"
            type="tel"
            pattern="\+?[0-9\(\).\-\s]{7,32}"
            title="7–32 digits; may start with + and include spaces, dashes or brackets"
            defaultValue={hotel?.contact?.phone ?? ''}
            placeholder="+91 80 4123 4567"
            isError={Boolean(err('contact.phone'))}
          />
        </Field>
      </Group>

      <Group title="Location">
        <Field label="Street address" required fullWidth error={err('address.line1')}>
          <Input
            name="address.line1"
            required
            maxLength={240}
            defaultValue={hotel?.address?.line1 ?? ''}
            placeholder="18 Residency Road, Richmond Town"
            isError={Boolean(err('address.line1'))}
          />
        </Field>

        <Field label="Address line 2" fullWidth hint="Optional: building, floor, landmark" error={err('address.line2')}>
          <Input
            name="address.line2"
            maxLength={240}
            defaultValue={hotel?.address?.line2 ?? ''}
            placeholder="Near Brigade Road"
            isError={Boolean(err('address.line2'))}
          />
        </Field>

        <Field label="City" required error={err('address.city')}>
          <Input
            name="address.city"
            required
            maxLength={120}
            defaultValue={hotel?.address?.city ?? ''}
            placeholder="Bengaluru"
            isError={Boolean(err('address.city'))}
          />
        </Field>

        <Field label={country === 'IN' ? 'PIN code' : 'Postal code'} required error={err('address.postalCode')}>
          <Input
            key={country}
            name="address.postalCode"
            required
            inputMode={postal ? 'numeric' : undefined}
            pattern={postal?.pattern}
            title={postal?.title}
            maxLength={postal?.maxLength ?? 80}
            defaultValue={hotel?.address?.postalCode ?? ''}
            placeholder={postal?.placeholder ?? ''}
            isError={Boolean(err('address.postalCode'))}
          />
        </Field>

        <Field label={country === 'IN' ? 'State' : 'State / region'} error={err('address.region')}>
          {country === 'IN' ? (
            <Select name="address.region" defaultValue={hotel?.address?.region ?? ''} isError={Boolean(err('address.region'))}>
              <option value="">Select state</option>
              {withCurrent(INDIA_STATES.map((s) => ({ value: s, label: s })), hotel?.address?.region).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          ) : (
            <Input
              name="address.region"
              maxLength={120}
              defaultValue={hotel?.address?.region ?? ''}
              isError={Boolean(err('address.region'))}
            />
          )}
        </Field>

        <Field label="Country" required error={err('address.countryCode')}>
          <Select
            name="address.countryCode"
            required
            value={country}
            onChange={(e) => changeCountry(e.target.value)}
            isError={Boolean(err('address.countryCode'))}
          >
            {withCurrent(COUNTRY_OPTIONS, hotel?.address?.countryCode?.toUpperCase()).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>

        <Field
          label="Time zone"
          required
          hint={hotel ? "Can't be changed once the hotel has future bookings" : 'Used for check-in times and the inventory calendar'}
          error={err('timezone')}
        >
          <Select
            name="timezone"
            required
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            isError={Boolean(err('timezone'))}
          >
            {withCurrent(timezonesFor(country), hotel?.timezone).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
    </section>
  );
}

/** Reads the fields above from a submitted form into the API shape. */
export function readHotelDetails(f: FormData) {
  const text = (key: string) => String(f.get(key) ?? '').trim();
  return {
    name: text('name'),
    slug: text('slug').replace(/^-+|-+$/g, ''),
    description: text('description'),
    timezone: text('timezone'),
    address: {
      line1: text('address.line1'),
      line2: text('address.line2') || undefined,
      city: text('address.city'),
      region: text('address.region') || undefined,
      postalCode: text('address.postalCode'),
      countryCode: text('address.countryCode').toUpperCase(),
    },
    contact: {
      email: text('contact.email'),
      phone: text('contact.phone') || undefined,
    },
  };
}
