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
  /** Called when a control that doesn't fire a form change event (the date picker) is edited. */
  onEdit?: () => void;
}

/** Effective date, free-cancellation window and the two fee rules. */
export function CancellationPolicyFields({ hotel, formErrors, onEdit }: CancellationPolicyFieldsProps) {
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
          onChange={(value) => {
            setEffectiveFrom(value);
            onEdit?.();
          }}
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
  const when = prefix === 'noShow' ? 'doesn’t turn up' : 'cancels after the free window';
  const hint: Record<string, string> = {
    NO_FEE: `Nothing is charged if the guest ${when}.`,
    FULL_STAY: `The guest pays the whole booking if they ${when}.`,
    FIXED_MINOR_UNITS: `The guest pays this fixed amount if they ${when}.`,
    PERCENTAGE_BPS: `The guest pays this share of the booking total if they ${when}.`,
  };
  const needsValue = basis === 'FIXED_MINOR_UNITS' || basis === 'PERCENTAGE_BPS';

  return (
    <Field label={label} hint={hint[basis]}>
      {/* Value box sits beside the dropdown so both fee columns keep the same height. */}
      <div className={needsValue ? 'grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_11rem] gap-2' : ''}>
        <Select aria-label={`${label} type`} name={`${name}.basis`} value={basis} onChange={(e) => setBasis(e.target.value)}>
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
              placeholder="e.g. 1500"
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
            placeholder="e.g. 50"
            defaultValue={initial?.percentageBps !== undefined ? initial.percentageBps / 100 : ''}
            rightIcon={<span className="text-[11px] font-medium text-slate-500">% of stay</span>}
            className="pr-20"
          />
        )}
      </div>
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
