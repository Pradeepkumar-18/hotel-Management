// Money helpers: staff type amounts in major units (₹1,500.50) and the API
// stores integer minor units (150050 paise). Conversion is string-based so
// no floating-point rounding can change the stored value.

export const DEFAULT_CURRENCY = 'INR';

const digitsCache = new Map<string, number>();

/** Number of decimal places the currency uses (INR → 2, JPY → 0). */
export function currencyDigits(currency = DEFAULT_CURRENCY): number {
  const code = currency.toUpperCase();
  const cached = digitsCache.get(code);
  if (cached !== undefined) return cached;
  let digits = 2;
  try {
    digits = new Intl.NumberFormat('en-IN', { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  } catch {
    /* Unknown code: fall back to 2 decimals */
  }
  digitsCache.set(code, digits);
  return digits;
}

/** Currency symbol for display, e.g. "₹" for INR. Falls back to the code. */
export function currencySymbol(currency = DEFAULT_CURRENCY): string {
  try {
    const part = new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency.toUpperCase() })
      .formatToParts(0)
      .find((p) => p.type === 'currency');
    return part?.value ?? currency.toUpperCase();
  } catch {
    return currency.toUpperCase();
  }
}

/** Regex source for a valid major-unit amount in this currency (no negatives, commas allowed). */
export function amountPattern(currency = DEFAULT_CURRENCY): string {
  const digits = currencyDigits(currency);
  return digits > 0 ? `\\d[\\d,]*(\\.\\d{0,${digits}})?` : '\\d[\\d,]*';
}

/**
 * "1500.5" → 150050 for INR. Returns null when the text is not a valid
 * non-negative amount or has more decimals than the currency allows.
 */
export function toMinorUnits(amount: string | number, currency = DEFAULT_CURRENCY): number | null {
  const text = String(amount).trim().replace(/,/g, '');
  if (!new RegExp(`^${amountPattern(currency)}$`).test(text)) return null;
  const digits = currencyDigits(currency);
  const [whole, fraction = ''] = text.split('.');
  const minor = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || 0);
  return Number.isSafeInteger(minor) ? minor : null;
}

/** 150050 → "1500.50", 249900 → "2499" (for pre-filling inputs). */
export function fromMinorUnits(minor: number | null | undefined, currency = DEFAULT_CURRENCY): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) return '';
  const digits = currencyDigits(currency);
  const value = (minor / 10 ** digits).toFixed(digits);
  return digits > 0 && minor % 10 ** digits === 0 ? value.split('.')[0] : value;
}

/** 150050 → "₹1,500.50" (Indian digit grouping). */
export function formatMoney(minor: number | null | undefined, currency = DEFAULT_CURRENCY): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) return '—';
  const digits = currencyDigits(currency);
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency.toUpperCase() }).format(
      minor / 10 ** digits,
    );
  } catch {
    return `${currency.toUpperCase()} ${(minor / 10 ** digits).toFixed(digits)}`;
  }
}
