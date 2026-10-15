import { isApiError, PublishProblem } from '../api';
import { useServerErrors } from './useServerErrors';

export function handleFormError(
  err: unknown,
  form: ReturnType<typeof useServerErrors>,
  toast: { error: (msg: string) => void },
  opts: {
    onConflict?: () => void;
    onNotReady?: (p: PublishProblem[]) => void;
  } = {},
) {
  if (!isApiError(err)) {
    return toast.error("Couldn't save. Check your connection and try again.");
  }
  if (Object.keys(err.fieldErrors).length > 0) {
    return form.setFieldErrors(err.fieldErrors);
  }
  if (err.code === 'VERSION_CONFLICT') {
    return opts.onConflict ? opts.onConflict() : form.setFormError('Someone else changed this record. Please reload to see the latest version.');
  }
  if (err.code === 'HOTEL_NOT_READY' && opts.onNotReady) {
    return opts.onNotReady(err.details);
  }
  if (err.status === 422 || err.code === 'UNPROCESSABLE_ENTITY') {
    return form.setFormError(err.message);
  }
  toast.error(err.message);
}
