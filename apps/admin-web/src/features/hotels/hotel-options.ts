export type Option = { value: string; label: string };

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
export const DEFAULT_COUNTRY = 'IN';

export const TIMEZONE_OPTIONS: Option[] = [
  { value: 'Asia/Kolkata', label: 'India (IST, UTC+5:30)' },
  { value: 'Asia/Colombo', label: 'Sri Lanka (UTC+5:30)' },
  { value: 'Asia/Kathmandu', label: 'Nepal (UTC+5:45)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh (UTC+6)' },
  { value: 'Indian/Maldives', label: 'Maldives (UTC+5)' },
  { value: 'Asia/Dubai', label: 'UAE (UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Asia/Bangkok', label: 'Thailand (UTC+7)' },
  { value: 'Asia/Tokyo', label: 'Japan (UTC+9)' },
  { value: 'Europe/London', label: 'United Kingdom (London)' },
  { value: 'Europe/Paris', label: 'Central Europe (Paris)' },
  { value: 'America/New_York', label: 'US Eastern (New York)' },
  { value: 'America/Chicago', label: 'US Central (Chicago)' },
  { value: 'America/Denver', label: 'US Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (Los Angeles)' },
  { value: 'Australia/Sydney', label: 'Australia Eastern (Sydney, Melbourne)' },
  { value: 'Australia/Brisbane', label: 'Australia (Brisbane)' },
  { value: 'Australia/Perth', label: 'Australia Western (Perth)' },
  { value: 'UTC', label: 'UTC' },
];

export const COUNTRY_OPTIONS: Option[] = [
  { value: 'IN', label: 'India' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'NP', label: 'Nepal' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'MV', label: 'Maldives' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SG', label: 'Singapore' },
  { value: 'TH', label: 'Thailand' },
  { value: 'JP', label: 'Japan' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'FR', label: 'France' },
  { value: 'US', label: 'United States' },
  { value: 'AU', label: 'Australia' },
];

/** Time zones offered per country (first one is the default). */
const COUNTRY_TIMEZONES: Record<string, string[]> = {
  IN: ['Asia/Kolkata'],
  LK: ['Asia/Colombo'],
  NP: ['Asia/Kathmandu'],
  BD: ['Asia/Dhaka'],
  MV: ['Indian/Maldives'],
  AE: ['Asia/Dubai'],
  SG: ['Asia/Singapore'],
  TH: ['Asia/Bangkok'],
  JP: ['Asia/Tokyo'],
  GB: ['Europe/London'],
  FR: ['Europe/Paris'],
  US: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
  AU: ['Australia/Sydney', 'Australia/Brisbane', 'Australia/Perth'],
};

/** Time-zone options for a country; unknown countries get the full list. */
export function timezonesFor(country: string): Option[] {
  const zones = COUNTRY_TIMEZONES[country];
  return zones ? TIMEZONE_OPTIONS.filter((o) => zones.includes(o.value)) : TIMEZONE_OPTIONS;
}

/** Postal-code input rules per country (India: 6-digit PIN). */
export const POSTAL_RULES: Record<string, { pattern: string; maxLength: number; title: string; placeholder: string }> = {
  IN: { pattern: '[1-9][0-9]{5}', maxLength: 6, title: '6-digit PIN code, e.g. 560025', placeholder: '560025' },
};

/** Indian states and union territories, used as the region list when country is IN. */
export const INDIA_STATES: string[] = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

/** Keeps a saved value selectable even when it is not in the curated list. */
export function withCurrent(options: Option[], current?: string): Option[] {
  if (!current || options.some((o) => o.value === current)) return options;
  return [{ value: current, label: current }, ...options];
}

/** "The Linden Grand Hotel" → "the-linden-grand-hotel" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}
