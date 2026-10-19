import React, { useState } from 'react';
import { Input, type InputProps } from './Input';
import { amountPattern, currencyDigits, currencySymbol, DEFAULT_CURRENCY, fromMinorUnits, toMinorUnits } from '../../utils/money';

export interface MoneyInputProps
  extends Omit<InputProps, 'name' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'leftIcon' | 'pattern'> {
  /** Form field name that receives the integer minor units (e.g. paise). */
  name: string;
  /** ISO 4217 code; decides the symbol and decimal places. Defaults to INR. */
  currency?: string;
  /** Starting value in minor units. */
  defaultMinorUnits?: number | null;
  /** Called with the minor-unit value (null while the text is invalid or empty). */
  onMinorUnitsChange?: (minor: number | null) => void;
}

/**
 * Amount input for staff: they type rupees (₹1500.50), the form submits
 * integer minor units (150050) through a hidden input named `name`.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { name, currency = DEFAULT_CURRENCY, defaultMinorUnits, onMinorUnitsChange, placeholder, title, ...props },
  ref
) {
  const [text, setText] = useState(() => fromMinorUnits(defaultMinorUnits, currency));
  const minor = text.trim() ? toMinorUnits(text, currency) : null;
  const digits = currencyDigits(currency);

  return (
    <>
      <Input
        ref={ref}
        type="text"
        inputMode={digits > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        pattern={amountPattern(currency)}
        title={title ?? (digits > 0 ? `Enter an amount with up to ${digits} decimals` : 'Enter a whole amount')}
        placeholder={placeholder ?? (digits > 0 ? `0.${'0'.repeat(digits)}` : '0')}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const next = e.target.value.trim() ? toMinorUnits(e.target.value, currency) : null;
          onMinorUnitsChange?.(next);
        }}
        leftIcon={<span className="text-xs font-semibold text-slate-500">{currencySymbol(currency)}</span>}
        {...props}
      />
      <input type="hidden" name={name} value={minor ?? ''} />
    </>
  );
});
