import { useState } from 'react';
import { Hotel } from '../../api';
import { DatePicker, Field, Input, MoneyInput, Select } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { isoToday } from '../../utils/helpers';
import { DEFAULT_CURRENCY } from '../../utils/money';

type Policy = NonNullable<Hotel['cancellationPolicy']>;
type FeeRule = Policy['afterCutoff'];

interface CancellationPolicyFieldsProps {
  hotel: Hotel;
  formErrors: ReturnType<typeof useServerErrors>;
}

/** Effective date, free-cancellation window and the two fee rules. */
export function CancellationPolicyFields({ hotel, formErrors }: CancellationPolicyFieldsProps) {
  const policy = hotel.cancellationPolicy;
  // Fixed fees must match the room-rate currency; keep any saved one, else INR.
  const currency = policy?.afterCutoff?.currency || policy?.noShow?.currency || DEFAULT_CURRENCY;
  const err = formErrors.getError;
  const today = isoToday(hotel.timezone);
  const [effectiveFrom, setEffectiveFrom] = useState(policy?.effectiveFrom || today);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Field
        label="Applies from"
        required
        hint={
          effectiveFrom > today
            ? 'Heads-up: a future date blocks publishing until that day.'
            : 'New bookings from this date use these terms'
        }
        error={err('cancellationPolicy.effectiveFrom')}
      >
        <DatePicker
          name="cancellationPolicy.effectiveFrom"
          required
          value={effectiveFrom}
          onChange={setEffectiveFrom}
          today={today}
          aria-label="Applies from"
          isError={Boolean(err('cancellationPolicy.effectiveFrom'))}
        />
      </Field>

      <Field
        label="Free cancellation until"
        required
        hint="Guests cancel for free up to this many hours before check-in"
        error={err('cancellationPolicy.freeCancellationHoursBeforeCheckIn')}
      >
        <Input
          type="number"
          name="cancellationPolicy.freeCancellationHoursBeforeCheckIn"
          required
          min={0}
          max={8760}
          step={1}
          defaultValue={policy?.freeCancellationHoursBeforeCheckIn ?? 24}
          rightIcon={<span className="text-[11px] font-medium text-slate-500">hours before</span>}
          className="pr-24"
          isError={Boolean(err('cancellationPolicy.freeCancellationHoursBeforeCheckIn'))}
        />
      </Field>

      <CancellationFeeField label="Fee for late cancellation" prefix="afterCutoff" initial={policy?.afterCutoff} currency={currency} />
      <CancellationFeeField label="Fee for no-show" prefix="noShow" initial={policy?.noShow} currency={currency} />
    </div>
  );
}

function CancellationFeeField({
  label,
  prefix,
  initial,
  currency,
}: {
  label: string;
  prefix: 'afterCutoff' | 'noShow';
  initial?: FeeRule;
  currency: string;
}) {
  const [basis, setBasis] = useState(initial?.basis || 'NO_FEE');
  const name = `cancellationPolicy.${prefix}`;

  return (
    <Field label={label}>
      <Select name={`${name}.basis`} value={basis} onChange={(e) => setBasis(e.target.value)}>
        <option value="NO_FEE">No fee</option>
        <option value="FULL_STAY">Full stay amount</option>
        <option value="FIXED_MINOR_UNITS">Fixed amount</option>
        <option value="PERCENTAGE_BPS">Percentage of stay</option>
      </Select>

      {basis === 'FIXED_MINOR_UNITS' && (
        <>
          <MoneyInput
            aria-label={`${label} amount`}
            name={`${name}.amountMinorUnits`}
            currency={currency}
            defaultMinorUnits={initial?.amountMinorUnits}
            required
          />
          <input type="hidden" name={`${name}.currency`} value={currency} />
        </>
      )}

      {basis === 'PERCENTAGE_BPS' && (
        <Input
          aria-label={`${label} percentage`}
          type="number"
          name={`${name}.percent`}
          required
          min={0}
          max={100}
          step={0.01}
          defaultValue={initial?.percentageBps !== undefined ? initial.percentageBps / 100 : ''}
          rightIcon={<span className="text-[11px] font-medium text-slate-500">% of stay</span>}
          className="pr-20"
        />
      )}
    </Field>
  );
}

/** Reads the fields above into the `cancellationPolicy` API shape (minor units, basis points). */
export function readCancellationPolicy(f: FormData) {
  const fee = (prefix: 'afterCutoff' | 'noShow') => {
    const key = `cancellationPolicy.${prefix}`;
    const basis = String(f.get(`${key}.basis`) || 'NO_FEE');
    if (basis === 'FIXED_MINOR_UNITS') {
      return {
        basis,
        amountMinorUnits: Number(f.get(`${key}.amountMinorUnits`)),
        currency: String(f.get(`${key}.currency`) || DEFAULT_CURRENCY).toUpperCase(),
      };
    }
    if (basis === 'PERCENTAGE_BPS') {
      return { basis, percentageBps: Math.round(Number(f.get(`${key}.percent`)) * 100) };
    }
    return { basis };
  };

  return {
    effectiveFrom: String(f.get('cancellationPolicy.effectiveFrom') || ''),
    freeCancellationHoursBeforeCheckIn: Number(f.get('cancellationPolicy.freeCancellationHoursBeforeCheckIn') ?? 24),
    afterCutoff: fee('afterCutoff'),
    noShow: fee('noShow'),
  };
}
