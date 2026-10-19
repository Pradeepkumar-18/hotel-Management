import { useState, type FormEvent } from 'react';
import { IndianRupee, Lock } from 'lucide-react';
import { Button, Field, Input, MoneyInput, ReasonField, Select } from '../../../components/ui';
import { DEFAULT_CURRENCY, formatMoney } from '../../../utils/money';

const RATE_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

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
  hotelCurrency?: string | null;
  canEditRates: boolean;
  busy: boolean;
  /** Field errors from the last save (e.g. amountMinorUnits, currency, reason). */
  getError?: (field: string) => string | undefined;
  onSaveRate: (e: FormEvent<HTMLFormElement>) => void;
}

export function BaseRatesView({
  selectedRoomName,
  selectedHotelName,
  rate,
  roomId,
  hotelCurrency,
  canEditRates,
  busy,
  getError = () => undefined,
  onSaveRate,
}: BaseRatesViewProps) {
  const lockedCurrency = hotelCurrency || rate?.currency || null;
  const [pickedCurrency, setCurrency] = useState(DEFAULT_CURRENCY);
  const currency = lockedCurrency || pickedCurrency;

  return (
    <div
      className="rate-card max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6"
      key={`${roomId}-${rate?._id || 'unset'}`}
    >
      <div className="rate-head flex items-center gap-3 pb-4 border-b border-slate-100">
        <span className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
          <IndianRupee size={20} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{selectedRoomName}</h2>
          <p className="text-xs text-slate-500">{selectedHotelName} · base nightly price</p>
        </div>
      </div>

      {rate && (
        <div className="current-rate p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-baseline gap-2 text-xs">
          <span className="text-amber-800 font-medium">Current rate:</span>
          <strong className="text-base font-bold text-amber-950">
            {formatMoney(rate.amountMinorUnits, rate.currency)}
          </strong>
          <span className="text-amber-700 text-[11px]">per night, before tax</span>
        </div>
      )}

      <form onSubmit={onSaveRate} className="rate-form grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Price per night" required hint="Before tax, e.g. 2499 or 2499.50" error={getError('amountMinorUnits')}>
          <MoneyInput
            name="amountMinorUnits"
            currency={currency}
            defaultMinorUnits={rate?.amountMinorUnits}
            required
            key={currency}
          />
        </Field>
        <Field
          label="Currency"
          required
          hint={lockedCurrency ? 'Same for every room at this hotel' : 'Choose once; all rooms at this hotel will use it'}
        >
          {lockedCurrency ? (
            <>
              <Input value={lockedCurrency} readOnly rightIcon={<Lock size={13} />} className="font-mono cursor-not-allowed" />
              <input type="hidden" name="currency" value={lockedCurrency} />
            </>
          ) : (
            <Select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {RATE_CURRENCIES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </Select>
          )}
        </Field>
        <ReasonField
          name="reason"
          label="Reason for change"
          required
          placeholder="e.g. Initial rate setup, festive season pricing"
          error={getError('reason')}
        />
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
