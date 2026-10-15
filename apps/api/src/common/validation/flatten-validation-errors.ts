import type { ValidationError } from 'class-validator';

export type FieldError = { field: string; message: string };

export function flattenValidationErrors(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property; // e.g. address.city, media.0.url
    const own = Object.values(e.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flattenValidationErrors(e.children ?? [], field)];
  });
}
