import type { FormEvent } from 'react';
import { DollarSign } from 'lucide-react';
import { Button, Field, Input } from '../../../components/ui';

interface BaseRateData {
  _id?: string;
  version?: number;
  amountMinorUnits: number;
  currency: string;
}

interface BaseRatesViewProps {
  selectedRoomName?: string;
  selectedHotelName?: string;
  rate: BaseRateData | null;
  roomId: string;
  canEditRates: boolean;
  busy: boolean;
  onSaveRate: (e: FormEvent<HTMLFormElement>) => void;
}

export function BaseRatesView({
  selectedRoomName,
  selectedHotelName,
  rate,
  roomId,
  canEditRates,
  busy,
  onSaveRate,
}: BaseRatesViewProps) {
  return (
    <div
      className="rate-card max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6"
      key={`${roomId}-${rate?._id || 'unset'}`}
    >
      <div className="rate-head flex items-center gap-3 pb-4 border-b border-slate-100">
        <span className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
          <DollarSign size={20} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{selectedRoomName}</h2>
          <p className="text-xs text-slate-500">{selectedHotelName} · base nightly price</p>
        </div>
      </div>

      {rate && (
        <div className="current-rate p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-baseline gap-2 text-xs">
          <span className="text-amber-800 font-medium">Current rate:</span>
          <strong className="text-base font-bold text-amber-950 font-mono">
            {rate.currency} {Number(rate.amountMinorUnits).toLocaleString()}
          </strong>
          <span className="text-amber-700 text-[11px]">minor units / night (before tax)</span>
        </div>
      )}

      <form onSubmit={onSaveRate} className="rate-form grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nightly amount (minor units)" required>
          <Input
            name="amount"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={rate?.amountMinorUnits ?? ''}
            placeholder="e.g. 15000 for 150.00"
          />
        </Field>
        <Field label="Currency code" required>
          <Input
            name="currency"
            required
            pattern="[A-Za-z]{3}"
            maxLength={3}
            defaultValue={rate?.currency || ''}
            placeholder="ISO 4217 (e.g. INR)"
            className="uppercase font-mono"
          />
        </Field>
        <Field label="Reason for change" fullWidth required>
          <Input
            name="reason"
            required
            minLength={3}
            placeholder="Initial rate setup"
          />
        </Field>
        <div className="col-span-full pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canEditRates}
            isLoading={busy}
            loadingLabel="Saving rate…"
          >
            {rate ? 'Save base rate' : 'Set base rate'}
          </Button>
          {!canEditRates && (
            <small className="text-xs text-slate-400 block mt-2">You have view access only for rates.</small>
          )}
        </div>
      </form>
    </div>
  );
}
