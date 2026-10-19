import { useState, type FormEvent } from 'react';
import { Hotel } from '../../../api';
import { Field, Input, Select, Button } from '../../../components/ui';
import { isoToday } from '../../../utils/helpers';
import { Can } from '../../auth/Can';

interface HotelPolicySectionProps {
  hotel: Hotel;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  getError: (field: string) => string | undefined;
}

export function HotelPolicySection({
  hotel,
  onSubmit,
  busy,
  getError,
}: HotelPolicySectionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Cancellation & Policy Terms</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Explicit guest terms stored with every booking snapshot and pre-publish verification.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Group 1: Basic Parameters */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            General Terms
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Effective date" required error={getError('cancellationPolicy.effectiveFrom')}>
              <Input
                type="date"
                name="cancellationPolicy.effectiveFrom"
                required
                defaultValue={hotel.cancellationPolicy?.effectiveFrom || isoToday(hotel.timezone)}
                isError={Boolean(getError('cancellationPolicy.effectiveFrom'))}
              />
            </Field>

            <Field
              label="Free cancellation cutoff"
              required
              error={getError('cancellationPolicy.freeCancellationHoursBeforeCheckIn')}
            >
              <Input
                type="number"
                name="cancellationPolicy.freeCancellationHoursBeforeCheckIn"
                required
                min="0"
                max="8760"
                defaultValue={hotel.cancellationPolicy?.freeCancellationHoursBeforeCheckIn ?? 24}
                rightIcon={<span className="text-[11px] font-medium text-slate-500">hours before check-in</span>}
                isError={Boolean(getError('cancellationPolicy.freeCancellationHoursBeforeCheckIn'))}
              />
            </Field>
          </div>
        </div>

        {/* Group 2: Penalty Rules */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Cancellation Penalties
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <PolicyFeeField
              label="Cancellation after cutoff window"
              prefix="afterCutoff"
              initial={hotel.cancellationPolicy?.afterCutoff}
            />
            <PolicyFeeField
              label="Guest no-show penalty"
              prefix="noShow"
              initial={hotel.cancellationPolicy?.noShow}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Note: Any fixed fee must use the same ISO currency code as the property's room rates.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <Can permission="hotels.edit">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={busy}
              loadingLabel="Saving policies…"
            >
              Save policy rules
            </Button>
          </Can>
        </div>
      </form>
    </div>
  );
}

function PolicyFeeField({
  label,
  prefix,
  initial,
}: {
  label: string;
  prefix: string;
  initial?: any;
}) {
  const [basis, setBasis] = useState(initial?.basis || 'NO_FEE');

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 block">{label}</label>
        <Select
          name={`cancellationPolicy.${prefix}.basis`}
          value={basis}
          onChange={(e) => setBasis(e.target.value)}
        >
          <option value="NO_FEE">No fee (Free cancellation)</option>
          <option value="FULL_STAY">Full stay amount penalty</option>
          <option value="FIXED_MINOR_UNITS">Fixed amount penalty</option>
          <option value="PERCENTAGE_BPS">Percentage of total stay</option>
        </Select>
      </div>

      {basis === 'FIXED_MINOR_UNITS' && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Input
            aria-label={`${label} amount in minor units`}
            type="number"
            min="0"
            step="1"
            name={`cancellationPolicy.${prefix}.amountMinorUnits`}
            required
            defaultValue={initial?.amountMinorUnits}
            placeholder="Amount (minor units)"
          />
          <Input
            aria-label={`${label} currency code`}
            name={`cancellationPolicy.${prefix}.currency`}
            required
            minLength={3}
            maxLength={3}
            defaultValue={initial?.currency || 'INR'}
            placeholder="ISO currency"
            className="uppercase font-mono"
          />
        </div>
      )}

      {basis === 'PERCENTAGE_BPS' && (
        <div className="pt-1">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            name={`cancellationPolicy.${prefix}.percentageBps`}
            required
            defaultValue={initial?.percentageBps !== undefined ? initial.percentageBps / 100 : ''}
            rightIcon={<span className="text-[11px] font-medium text-slate-500">% of stay</span>}
          />
        </div>
      )}
    </div>
  );
}
