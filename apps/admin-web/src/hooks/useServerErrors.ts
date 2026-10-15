import { useState, useCallback } from 'react';

export function useServerErrors() {
  const [fieldErrors, setFieldErrorsRaw] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>('');

  const setFieldErrors = useCallback((errors: Record<string, string>) => {
    const expanded: Record<string, string> = { ...errors };
    for (const [key, msg] of Object.entries(errors)) {
      const parts = key.split('.');
      const leaf = parts[parts.length - 1];
      if (leaf && !expanded[leaf]) {
        expanded[leaf] = msg;
      }
    }
    setFieldErrorsRaw(expanded);
  }, []);

  const clear = useCallback(() => {
    setFieldErrorsRaw({});
    setFormError('');
  }, []);

  const clearField = useCallback((field: string) => {
    setFieldErrorsRaw((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      const leaf = field.split('.').pop();
      if (leaf && next[leaf]) delete next[leaf];
      return next;
    });
  }, []);

  const getError = useCallback(
    (name: string): string | undefined => {
      return fieldErrors[name] || fieldErrors[name.split('.').pop() || ''];
    },
    [fieldErrors],
  );

  return {
    fieldErrors,
    formError,
    setFieldErrors,
    setFormError,
    clear,
    clearErrors: clear,
    clearField,
    getError,
  };
}
