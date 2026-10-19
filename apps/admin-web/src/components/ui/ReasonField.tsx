import { Field } from './Field';
import { Textarea, type TextareaProps } from './Textarea';

export const REASON_MIN = 3;
export const REASON_MAX = 500;

export interface ReasonFieldProps extends Omit<TextareaProps, 'minLength' | 'maxLength' | 'showCount' | 'isError'> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Audit reason box used wherever the API takes a `reason` (status changes,
 * room-count changes, rate changes, inventory blocks): 3–500 characters with a counter.
 */
export function ReasonField({
  label = 'Reason',
  hint,
  error,
  required = false,
  className,
  rows = 2,
  ...props
}: ReasonFieldProps) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className} fullWidth>
      <Textarea
        rows={rows}
        required={required}
        minLength={REASON_MIN}
        maxLength={REASON_MAX}
        showCount
        isError={Boolean(error)}
        {...props}
      />
    </Field>
  );
}
