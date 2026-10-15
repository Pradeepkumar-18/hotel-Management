import { Types } from 'mongoose';
import { NotFoundException, UnprocessableEntityException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CancellationFeeBasis, HotelCancellationPolicy } from './schemas/hotel.schema';
import { CreateHotelDto, HotelCancellationPolicyDto } from './dto/hotel.dto';

export function asObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Resource not found');
  return new Types.ObjectId(id);
}

export function normalizeSlug(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new UnprocessableEntityException('Hotel slug must contain letters or numbers');
  return slug;
}

export function normalizeAddress(address: CreateHotelDto['address']) {
  return {
    ...address,
    line1: address.line1.trim(),
    line2: address.line2?.trim() || undefined,
    city: address.city.trim(),
    region: address.region?.trim() || undefined,
    postalCode: address.postalCode.trim(),
    countryCode: address.countryCode.trim().toUpperCase(),
  };
}

export function normalizeContact(contact: CreateHotelDto['contact']) {
  return { email: contact.email?.trim().toLowerCase() || undefined, phone: contact.phone?.trim() || undefined };
}

export function normalizeCancellationPolicy(dto: HotelCancellationPolicyDto, version: number): HotelCancellationPolicy {
  const policy = {
    effectiveFrom: dto.effectiveFrom,
    freeCancellationHoursBeforeCheckIn: dto.freeCancellationHoursBeforeCheckIn,
    afterCutoff: normalizeFeeRule(dto.afterCutoff),
    noShow: normalizeFeeRule(dto.noShow),
    version,
  };
  validateCancellationPolicy(policy);
  return policy;
}

export function normalizeFeeRule(rule: HotelCancellationPolicyDto['afterCutoff']) {
  if (!rule || !Object.values(CancellationFeeBasis).includes(rule.basis)) {
    throw new UnprocessableEntityException('Cancellation fee rule basis is invalid');
  }
  const normalized = {
    basis: rule.basis,
    amountMinorUnits: rule.amountMinorUnits,
    currency: rule.currency?.toUpperCase(),
    percentageBps: rule.percentageBps,
  };
  const fixed = rule.basis === CancellationFeeBasis.FIXED_MINOR_UNITS;
  const percentage = rule.basis === CancellationFeeBasis.PERCENTAGE_BPS;
  if (fixed && (!Number.isSafeInteger(rule.amountMinorUnits) || !rule.currency || !/^[A-Z]{3}$/.test(rule.currency.toUpperCase()))) {
    throw new UnprocessableEntityException('Fixed cancellation fees require integer minor units and an ISO currency code');
  }
  if (percentage && (!Number.isInteger(rule.percentageBps) || rule.percentageBps! < 0 || rule.percentageBps! > 10000)) {
    throw new UnprocessableEntityException('Percentage cancellation fees require basis points from 0 to 10000');
  }
  if (!fixed && (rule.amountMinorUnits !== undefined || rule.currency !== undefined)) {
    throw new UnprocessableEntityException('Only fixed cancellation fees accept an amount and currency');
  }
  if (!percentage && rule.percentageBps !== undefined) {
    throw new UnprocessableEntityException('Only percentage cancellation fees accept basis points');
  }
  return normalized;
}

export function validateCancellationPolicy(policy: HotelCancellationPolicy) {
  if (!policy || !policy.afterCutoff || !policy.noShow) {
    throw new UnprocessableEntityException('Cancellation and no-show fee terms are required');
  }
  const date = new Date(`${policy.effectiveFrom}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policy.effectiveFrom) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== policy.effectiveFrom) {
    throw new UnprocessableEntityException('Cancellation policy effectiveFrom must be a valid YYYY-MM-DD date');
  }
  if (!Number.isInteger(policy.freeCancellationHoursBeforeCheckIn) || policy.freeCancellationHoursBeforeCheckIn < 0 || policy.freeCancellationHoursBeforeCheckIn > 8760) {
    throw new UnprocessableEntityException('Free cancellation cutoff must be between 0 and 8760 hours before check-in');
  }
  normalizeFeeRule(policy.afterCutoff as any);
  normalizeFeeRule(policy.noShow as any);
}

export function validatePolicyCurrency(policy: HotelCancellationPolicy, rateCurrency: string) {
  for (const fee of [policy.afterCutoff, policy.noShow]) {
    if (fee.basis === CancellationFeeBasis.FIXED_MINOR_UNITS && fee.currency !== rateCurrency) {
      throw new ConflictException({ error: 'HOTEL_POLICY_CURRENCY_MISMATCH', message: 'Fixed policy fees must use the hotel base-rate currency' });
    }
  }
}

export function normalizeList(values?: string[]) {
  return [...new Set((values || []).map((value) => value.trim()).filter(Boolean))];
}

export function validateTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
  } catch {
    throw new UnprocessableEntityException('timezone must be a supported IANA timezone');
  }
}

export function dateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function safeAuditView(value: any) {
  if (!value) return undefined;
  const { _id, name, slug, address, timezone, status, version, contact, coordinates, cancellationPolicy } = value;
  return { id: _id?.toString(), name, slug, address, timezone, status, version, contact, coordinates, cancellationPolicy };
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function assertHotelScope(actor: { role?: string; hotelIds?: string[] }, hotelId: string) {
  if (actor.role !== 'SUPER_ADMIN' && !actor.hotelIds?.includes(hotelId)) {
    throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Hotel is outside the staff member scope' });
  }
}

