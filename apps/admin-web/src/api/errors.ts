export type PublishProblem = { code: string; message: string };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,                                   // backend errorCode
    readonly fieldErrors: Record<string, string> = {},       // from B4 `errors`
    readonly details: PublishProblem[] = [],                 // from B5 `details`
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  const body: any = await res.json().catch(() => ({}));
  const message = Array.isArray(body.message) ? body.message.join('; ') : body.message ?? res.statusText;
  const fields: Record<string, string> = {};
  for (const e of body.errors ?? []) {
    if (e?.field) fields[e.field] ??= e.message;
  }
  return new ApiError(message, res.status, body.errorCode ?? 'UNKNOWN', fields, body.details ?? []);
}

export const isApiError = (e: unknown, status?: number, code?: string): e is ApiError =>
  e instanceof ApiError && (status === undefined || e.status === status) && (code === undefined || e.code === code);
