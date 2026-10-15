# Staywise Full-Stack Analysis & Fix Plan

> **Historical plan:** the status of fixes B1–B10 and F1–F12 is tracked in [26-fullstack-fix-plan-progress.md](./26-fullstack-fix-plan-progress.md). The checkboxes in this file were never updated. Use this file for the reasoning behind each fix.

Oct 12, 2026 · @Pradeep

## Summary

The backend is the stronger half: transactions, optimistic locking, tenant scoping and input whitelisting are done well. The two biggest risks are elsewhere. Production login is fully blocked by an MFA check with no MFA flow. The bulk-status endpoint likely lets anyone with `hotels.edit` publish or un-archive hotels without the publish checks.

The frontend has a different problem. Reading both audits side by side shows it may call rate endpoints that don't exist, and it uses status names the backend doesn't have. Confirm these first (section 3); if true, the Rates page is broken today, not just inconsistent.

**Top issues, in order:**

1. Production staff login always fails with `AUTH_MFA_REQUIRED` (`auth.service.ts:L61-73`).
2. Bulk status may bypass publish preconditions, the `hotels.publish` permission, the irreversible-archive rule and optimistic locking (`hotel.service.ts:L117-145`).
3. No startup env validation: a missing `SESSION_SECRET` silently uses a public default (`configuration.ts`).
4. Frontend rate calls don't match `GET/PUT /admin/room-types/:roomTypeId/base-rate`.
5. Frontend uses "Paused" / `PAUSED`; the backend uses `SUSPENDED`.
6. Any API 403, including a CSRF failure, sends the user to the access-denied screen (`AppLayout.tsx:L75-77`).
7. Validation errors return field names only inside English strings, so forms can't highlight fields.

**How much to trust the audits.** The backend audit is solid (8/10): an exact endpoint table, real error bodies and transaction coverage. It missed the bulk-status bypass. Three of its recommendations are weaker:

- Its new exception filter guesses field names by splitting the message on the first space.
- Its response envelope change would break every frontend call for little gain.
- Its room-types pagination would change an array response into an object to solve a non-problem (hotels rarely have 50+ room types).

This plan replaces all three. Moving rate limiting to Redis is only needed once you run more than one API instance.

**Decisions already made.** No TanStack Query: data fetching uses a small `useApiQuery` hook (F4). This document replaces the earlier "Admin Web UI Fix Plan" where they differ.

## All fixes at a glance

Twenty-two fixes: 10 backend (B) and 12 frontend (F), sorted by severity. Week 1 holds everything Critical plus the quick wins that stop data or access problems.

| ID | Fix | App | Severity | Effort | Week |
| --- | --- | --- | --- | --- | --- |
| B1 | Gate the MFA check behind `MFA_ENABLED` so production login works | API | Critical | Quick win | 1 |
| B2 | Validate env at boot; fail fast on missing secrets | API | Critical | Quick win | 1 |
| B3 | Bulk status: enforce transitions, per-status permissions, publish checks | API | Critical | Moderate | 1 |
| F5 | Rates: call the real base-rate endpoints; freeze IDs on save | Web | Critical (if mismatch confirmed) | Quick win | 1 |
| F7 | Bulk actions: `SUSPENDED` naming, correct body, confirm dialog | Web | High | Quick win | 1 |
| F1 | 403 handling by `errorCode`, not just status | Web | High | Quick win | 1 |
| F2 | Root and page Error Boundaries | Web | High | Quick win | 1 |
| F12 | Inventory block/unblock with `version` and `reason` | Web | High | Moderate | 2 |
| B4 | Structured validation errors + consistent `errorCode` (additive) | API | High | Moderate | 2 |
| F6 | Field-level errors and `errorCode`-based handling | Web | High | Moderate | 2 |
| B5 | Publish returns all failed preconditions at once | API | High | Quick win | 2 |
| B7 | Tests for auth, permission guard, scoping, pricing | API | High | Moderate | 2–4 |
| F3 | AuthProvider: one place for 401, logout, idle expiry | Web | Medium | Moderate | 2 |
| F4 | `useApiQuery` hook: cancellation, no stale overwrites, invalidation | Web | High | Moderate | 2 |
| F11 | Hide or disable actions the user lacks permission for | Web | Medium | Quick win | 2 |
| F8 | Split CatalogPage into 3 pages, same URLs | Web | Medium | Moderate | 3 |
| B6 | Production index management (`autoIndex` off, sync at deploy) | API | Medium | Quick win | 3 |
| B8 | Split `HotelService`; move `digest` to a shared crypto util | API | Medium | Moderate | 3 |
| F9 | Theme tokens via Tailwind v4 `@theme` | Web | Medium | Moderate | 4 |
| B9 | Login throttling: proper 429 now, Redis only when scaling out | API | Medium | Quick win | 4 |
| F10 | Cleanup: `@/` alias, dead shim, KPI merge, primitives | Web | Low | Quick win | 1–4 |
| B10 | Audit log retention (TTL or archive) | API | Low | Quick win | after decision |

## Where frontend and backend disagree

Comparing the frontend audits with the backend endpoint table shows at least four mismatches that would break features outright. All frontend details come from the audits, so confirm each one in the code before fixing it.

| Area | Frontend (per audits) | Backend (actual) | Impact | Fix |
| --- | --- | --- | --- | --- |
| Rate endpoints | Audit 1: `GET/PUT/POST /admin/rates`. Audit 2: `POST /admin/hotels/:hotelId/base-rates` or `PUT :id` | `GET /admin/room-types/:roomTypeId/base-rate`, `PUT` same path | If either audit is right, the Rates page gets 404s for every load and save | F5 |
| Unconfigured rate | Treated as an "Unconfigured" alert | `GET base-rate` returns **404** when no rate exists | Can show as an error instead of an empty state | F5 |
| Rate save body | Unknown | `amountMinorUnits`, `currency` (ISO-3), `version` (needed on update), `reason` | Missing `version` on update → 409; unknown fields → 400 (`forbidNonWhitelisted`) | F5 |
| Hotel status names | "Paused", Pause action, `Paused` summary card | `SUSPENDED`; metrics key `suspended` | Paused card likely shows blank; a bulk `PAUSED` status → 400 | F7 |
| Bulk status body | Plan assumed `{ ids, status }` | `{ hotelIds (1–100), status, reason }` | Wrong field name → 400 | F7 |
| Bulk status result | Shows success | Returns `modifiedCount`; out-of-scope IDs are silently skipped | "5 hotels archived" when only 3 were | F7, B3 |
| Single-night block | Body unknown | Requires `version`, `quantity` (1–10000), `reason` (3–500 chars) | If the UI sends no reason or version, every block fails | F12 |
| Unblock | No UI | `POST .../:stayDate/unblock` exists | A blocked night can't be released from the admin app | F12 |
| Validation errors | Reads `message` as a string | `message` is a **string array** for 400s | Toasts show comma-joined raw messages | B4, F6 |
| 409 meaning | Treated as one case | `VERSION_CONFLICT` **and** publish failures (`HOTEL_*_REQUIRED`) both use 409 | Wrong recovery shown to the user | F6 |
| 403 meaning | Any 403 → access-denied screen | `FORBIDDEN` (scope or permission) **and** `CSRF_REJECTED` | A CSRF problem looks like a permission problem | F1 |
| Session expiry | No awareness | 30-minute idle timeout; 12-hour max | Users lose unsaved forms after a coffee break | F3 |
| Hotel create | Button likely visible to all | `POST /admin/hotels` is SUPER\_ADMIN only | Managers click Create and get a 403 | F11 |
| Catalog hotel picker | `GET /admin/hotels?limit=100` | Max `limit` is 100 | Hotels beyond 100 can't be selected | F8 |
| Dev CORS default | Vite dev server on port 5173 | Default `CORS_ORIGINS` is ports 3001 and 3002; the CSRF Origin check uses the same list | Every write fails `CSRF_REJECTED` unless env is set | B2 |

Things that do match: login, `/auth/me`, `/auth/logout`, hotel list and filters, metrics, create, `PATCH /admin/hotels/:id`, media, publish, room-types list and create, inventory range and initialize, and the CSRF header name.

## Backend fixes

### B1. Unblock production login (Critical, quick win)

`auth.service.ts:L61-73` throws `AUTH_MFA_REQUIRED` for every login when `NODE_ENV=production`, and no MFA flow exists. Nobody can sign in to production.

```ts
// common/config/configuration.ts
auth: {
  mfaRequired: process.env.MFA_ENABLED === 'true', // default false until MFA exists
},
```

```ts
// auth.service.ts — replace the NODE_ENV check
if (this.config.get<boolean>('auth.mfaRequired')) {
  throw new UnauthorizedException({ error: 'AUTH_MFA_REQUIRED', message: 'Multi-factor sign-in is required' });
}
```

Without MFA, staff accounts are protected only by password, the existing lockout (`failedLoginCount`, `lockUntil`) and login throttling. Log a warning at boot in production when `mfaRequired` is false, and put TOTP MFA on the roadmap (decision in the last section).

### B2. Validate environment at boot (Critical, quick win)

Nothing checks `process.env`, so production can start with the public default `SESSION_SECRET` or a local unauthenticated `MONGODB_URI`.

```ts
// common/config/env.schema.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default('/api/v1'),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must be a mongodb:// URI')
    .default('mongodb://127.0.0.1:27017/staywise_dev'),
  SESSION_SECRET: z.string().min(32).default('dev-secret-do-not-use-in-production-min-32-chars'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3001,http://localhost:3002'),
  MFA_ENABLED: z.enum(['true', 'false']).default('false'),
  STAFF_SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(43200),
  STAFF_SESSION_IDLE_SECONDS: z.coerce.number().int().positive().default(1800),
  // ...the remaining vars from the audit's table, same pattern
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== 'production') return;
  const fail = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
  if (env.SESSION_SECRET.startsWith('dev-secret')) fail('SESSION_SECRET', 'must be set in production');
  if (/127\.0\.0\.1|localhost/.test(env.MONGODB_URI)) fail('MONGODB_URI', 'must not point at localhost in production');
  if (/localhost/.test(env.CORS_ORIGINS)) fail('CORS_ORIGINS', 'must list production origins only');
});

export function validateEnv(raw: Record<string, unknown>) {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return result.data;
}
```

```ts
// app.module.ts
ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
```

The dev CORS default now includes port 5173, so the admin web works locally without env changes. Commit an `.env.example` listing every variable.

### B3. Make bulk status safe (Critical, moderate)

`hotel.service.ts:L117-145` runs one `updateMany` with only `hotels.edit` checked at the controller. Unless the code checks more than the audit describes, this means:

- A `DRAFT` hotel can be bulk-set to `PUBLISHED` **without the 5 publish preconditions**.
- A user with `hotels.edit` but not `hotels.publish` can publish. The `hotels.archive` permission is seeded but never checked.
- An `ARCHIVED` hotel can be moved back, breaking the irreversible-archive rule at `hotel.service.ts:L349`.
- No `version` check, and out-of-scope IDs are silently dropped.

Confirm by reading L117-145 for a status filter, then replace it with per-hotel transitions.

```ts
// modules/hotels/hotel-status.rules.ts
export const BULK_TRANSITIONS: Record<HotelStatus, HotelStatus[]> = {
  DRAFT: ['ARCHIVED'],                 // DRAFT → PUBLISHED only via POST /:id/publish
  PUBLISHED: ['SUSPENDED', 'ARCHIVED'],
  SUSPENDED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],                        // terminal
};

export const PERMISSION_FOR_STATUS: Record<HotelStatus, string> = {
  PUBLISHED: 'hotels.publish',
  SUSPENDED: 'hotels.edit',
  ARCHIVED: 'hotels.archive',
  DRAFT: 'hotels.edit',
};
```

```ts
// hotel.service.ts
async bulkStatusUpdate(actor: StaffActor, dto: BulkHotelStatusDto) {
  const required = PERMISSION_FOR_STATUS[dto.status];
  if (!actor.permissions.includes(required)) {
    throw new ForbiddenException({ error: 'FORBIDDEN', message: `Requires ${required}` });
  }

  return this.tx.executeInTransaction(async (session) => {
    const hotels = await this.hotelModel.find({ _id: { $in: dto.hotelIds } }).session(session);
    const found = new Map(hotels.map((h) => [h.id, h]));
    const updated: string[] = [];
    const skipped: { hotelId: string; code: string; message: string }[] = [];

    for (const id of dto.hotelIds) {
      const h = found.get(id);
      if (!h) { skipped.push({ hotelId: id, code: 'NOT_FOUND', message: 'Hotel not found' }); continue; }
      if (!isInScope(actor, id)) { skipped.push({ hotelId: id, code: 'FORBIDDEN', message: 'Outside your hotels' }); continue; }
      if (!BULK_TRANSITIONS[h.status].includes(dto.status)) {
        skipped.push({ hotelId: id, code: 'INVALID_TRANSITION', message: `Cannot move ${h.status} to ${dto.status}` });
        continue;
      }
      if (dto.status === 'PUBLISHED') {
        const problems = await this.publishChecks.collect(h, session); // B5
        if (problems.length) { skipped.push({ hotelId: id, code: 'NOT_READY', message: problems[0].message }); continue; }
      }
      const res = await this.hotelModel.updateOne(
        { _id: h._id, version: h.version, status: h.status },
        { $set: { status: dto.status }, $inc: { version: 1 } },
        { session },
      );
      if (res.modifiedCount === 1) updated.push(id);
      else skipped.push({ hotelId: id, code: 'VERSION_CONFLICT', message: 'Changed by another request' });
    }

    await this.audit.record({ /* action: HOTEL_BULK_STATUS, updated, skipped, reason: dto.reason */ });
    return { modifiedCount: updated.length, status: dto.status, updated, skipped };
  });
}
```

The response keeps `modifiedCount` and `status`, so the current frontend keeps working; `updated` and `skipped` are new fields. Bulk publish of a `SUSPENDED` hotel re-runs the publish checks, because rates or inventory may have changed while it was suspended. Add a single `POST /admin/hotels/:id/archive` (permission `hotels.archive`) so archiving isn't bulk-only.

### B4. Structured validation errors, consistent codes (High, moderate)

Two problems in `http-exception.filter.ts:L32`. Validation errors only carry field names inside English text. And `errorCode` is sometimes `VERSION_CONFLICT`, sometimes `Not Found`.

The audit's proposed filter guesses the field by splitting on the first space and renames every key, which breaks the frontend. Instead, build fields from class-validator's own error tree and **only add** to the current shape.

```ts
// common/validation/flatten-validation-errors.ts
import type { ValidationError } from 'class-validator';

export type FieldError = { field: string; message: string };

export function flattenValidationErrors(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property; // e.g. address.city, media.0.url
    const own = Object.values(e.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flattenValidationErrors(e.children ?? [], field)];
  });
}
```

```ts
// main.ts — keep whitelist / forbidNonWhitelisted / transform
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => new BadRequestException({
    error: 'VALIDATION_FAILED',
    message: 'Some fields are invalid',
    errors: flattenValidationErrors(errors),
  }),
}));
```

```ts
// http-exception.filter.ts — inside catch(), for HttpException
const body = exception.getResponse() as string | Record<string, any>;
const obj = typeof body === 'string' ? { message: body } : body;

const errorCode = typeof obj.error === 'string' && /^[A-Z0-9_]+$/.test(obj.error)
  ? obj.error
  : HttpStatus[status] ?? 'ERROR';   // 404 → NOT_FOUND, 400 → BAD_REQUEST

response.status(status).json({
  statusCode: status,
  errorCode,
  message: Array.isArray(obj.message) ? obj.message.join('; ') : obj.message ?? 'Request failed',
  ...(obj.errors ? { errors: obj.errors } : {}),
  ...(obj.details ? { details: obj.details } : {}),
  timestamp: new Date().toISOString(),
  path: request.url,
});
```

Also map Mongo duplicate-key errors, so a duplicate slug or room code points at a field:

```ts
// http-exception.filter.ts — before the generic 500 branch
if (exception instanceof MongoServerError && exception.code === 11000) {
  const keys = Object.keys(exception.keyPattern ?? {});
  const field = keys.includes('normalizedCode') ? 'code' : keys.find((k) => k !== 'hotelId') ?? keys[0];
  return response.status(409).json({
    statusCode: 409, errorCode: 'DUPLICATE', message: `${field} is already in use`,
    errors: [{ field, message: `This ${field} is already in use` }],
    timestamp: new Date().toISOString(), path: request.url,
  });
}
```

The one visible change is that 400 `message` becomes a single string instead of an array. F6 handles both shapes, so either app can deploy first.

### B5. Publish returns every failed check (High, quick win)

Publishing fails with 409 on the first unmet precondition. The admin fixes one thing, clicks Publish, and hits the next. Collect all failures and return them as `details`:

```ts
// hotel-publish.checks.ts
export type PublishProblem = { code: string; message: string };

async collect(hotel: HotelDoc, session?: ClientSession): Promise<PublishProblem[]> {
  const problems: PublishProblem[] = [];
  if (!hotel.cancellationPolicy) problems.push({ code: 'HOTEL_CANCELLATION_POLICY_REQUIRED', message: 'Add a cancellation policy' });
  else if (!isEffective(hotel)) problems.push({ code: 'HOTEL_POLICY_NOT_YET_EFFECTIVE', message: 'Cancellation policy starts in the future' });
  // ...room types, sellable inventory, base rates, currency, future inventory — same pattern
  return problems;
}

// publish()
const problems = await this.publishChecks.collect(hotel, session);
if (problems.length) {
  throw new ConflictException({ error: 'HOTEL_NOT_READY', message: 'Hotel is not ready to publish', details: problems });
}
```

The individual codes stay the same, so anything matching on them still works. The frontend shows `details` as a checklist (F6).

### B6. Manage indexes for production (Medium, quick win)

Indexes are built by Mongoose `autoIndex` at boot. On large collections that slows startup and runs unplanned index builds in production. There's no migration tool, and for Mongo that's acceptable; index management is the part that matters.

```ts
// common/database/database.module.ts
MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (c: ConfigService) => ({
    uri: c.get<string>('mongodb.uri'),
    autoIndex: c.get<string>('nodeEnv') !== 'production',
  }),
}),
```

```ts
// scripts/ensure-indexes.ts — run once per deploy, before the new version starts
const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
const conn = app.get<Connection>(getConnectionToken());
for (const model of Object.values(conn.models)) {
  await model.createIndexes(); // creates missing indexes; never drops existing ones
  console.log(`indexes ok: ${model.modelName}`);
}
await app.close();
```

Use `createIndexes`, not `syncIndexes`: `syncIndexes` drops indexes that aren't in the schema, which is dangerous to run automatically. Skip the audit's suggested `{ stayDate: 1 }` index; no query in the audit filters on `stayDate` alone. Move `verify-foundation.ts` into `scripts/` with this one and add both to `package.json`.

### B7. Tests where a bug would hurt most (High, moderate)

There are 9 unit tests and none for auth, the permission guard or pricing. Add HTTP-level e2e tests with `supertest`, and use `MongoMemoryReplSet` because the services use transactions, which need a replica set.

```ts
// test/setup.ts
import { MongoMemoryReplSet } from 'mongodb-memory-server';
let mongo: MongoMemoryReplSet;
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongo.getUri();
});
afterAll(() => mongo.stop());
```

Write these cases first, in this order:

1. **Tenant scoping (IDOR).** A manager scoped to hotel A gets 403 on hotel B through each route family: `/admin/hotels/:id`, `/admin/hotels/:hotelId/room-types`, `/admin/room-types/:id`, inventory and base-rate. One parameterized test covers all of them.
2. **Bulk status (B3).** Draft can't be bulk-published; archived can't come back; out-of-scope IDs appear in `skipped`; `hotels.edit` alone can't publish or archive.
3. **CSRF.** A write with no header, a wrong header, or a bad `Origin` is rejected; GET is allowed without it.
4. **Sessions.** Login success and failure, lockout after N failures, idle expiry after 30 minutes (inject a clock), logout revokes.
5. **Error shape (B4).** One request per status code asserts `statusCode`, `errorCode`, string `message`, and `errors` for validation.
6. **Pricing.** Create rate, update with the correct `version`, update with a stale `version` → 409.

Add `npm run test:e2e` to CI so these run on every PR.

### B8. Split HotelService and tidy boundaries (Medium, moderate)

`hotel.service.ts` is 531 lines, with 128 lines of loose validation functions at L377-505. Split by reason to change:

- `hotel-query.service.ts`: list, metrics, get.
- `hotel-command.service.ts`: create, update, media.
- `hotel-lifecycle.service.ts`: publish, suspend, archive, bulk status (B3).
- `hotel-publish.checks.ts`: the precondition collector (B5).
- `hotel.policies.ts`: the pure validators from L377-505. Being pure functions, they're easy to unit test.

Move `digest` into `common/crypto/digest.ts` so `auth.service.ts` and `staff-session.service.ts` both import it from there. Wrap the raw `bookings` query at `hotel.service.ts:L235-238` in a small interface (`FutureBookingsChecker`) so a real Bookings module can replace it later without touching hotel code. Do this after B3 and B5 land, so you split working code rather than code you're still changing.

### B9. Login throttling (Medium, quick win)

The in-memory attempt map (`auth.service.ts:L175-177`) is fine on one API instance. Account lockout already uses `lockUntil` in the database, so it works across instances anyway. Move to Redis (or `@nestjs/throttler` with a Redis store) only when you run more than one instance.

The part to fix now is the response. Make sure throttling returns 429 with `errorCode: 'TOO_MANY_ATTEMPTS'` and a `Retry-After` header, and that a locked account returns a distinct code such as `ACCOUNT_LOCKED`. Then the login page can say "Try again in 5 minutes" instead of "Invalid credentials".

### B10. Audit log retention (Low, after a decision)

`audit_logs` grows without limit, and inventory edits will write many rows. Once you decide the retention period, add a TTL index:

```ts
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // e.g. 1 year
```

If compliance needs a longer period, export old entries to cheap storage before they expire instead of keeping them in the primary database.

## Frontend fixes

These replace the earlier UI fix plan. Fixes marked "unchanged" keep the code from that document; everything else is rewritten here for the real API and without TanStack Query.

### F1. One error object, and 403 handled by meaning (High, quick win)

Today every 403 navigates to `/admin/unauthorized` (`AppLayout.tsx:L75-77`). The backend sends 403 for two different reasons: `FORBIDDEN` (no permission or out of scope) and `CSRF_REJECTED` (a session or token problem). Start by making `request()` turn every error response into one rich `ApiError`. It handles both today's error shape and the B4 shape.

```ts
// src/api/errors.ts
export type PublishProblem = { code: string; message: string };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,                                   // backend errorCode
    readonly fieldErrors: Record<string, string> = {},       // from B4 `errors`
    readonly details: PublishProblem[] = [],                 // from B5 `details`
  ) { super(message); this.name = 'ApiError'; }
}

export async function toApiError(res: Response): Promise<ApiError> {
  const body: any = await res.json().catch(() => ({}));
  const message = Array.isArray(body.message) ? body.message.join('; ') : body.message ?? res.statusText;
  const fields: Record<string, string> = {};
  for (const e of body.errors ?? []) if (e?.field) fields[e.field] ??= e.message;
  return new ApiError(message, res.status, body.errorCode ?? 'UNKNOWN', fields, body.details ?? []);
}

export const isApiError = (e: unknown, status?: number, code?: string): e is ApiError =>
  e instanceof ApiError && (status === undefined || e.status === status) && (code === undefined || e.code === code);
```

```ts
// src/api.ts — inside request(), replacing the block at L28-30
if (!response.ok) {
  const err = await toApiError(response);
  const sessionProblem =
    (err.status === 401 && path !== '/auth/staff/login') ||
    (err.status === 403 && err.code === 'CSRF_REJECTED');
  if (sessionProblem && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(API_ACCESS_EVENT, { detail: { status: 401, code: err.code } }));
  }
  throw err; // FORBIDDEN is no longer broadcast
}
```

Then handle `FORBIDDEN` where it happens:

- **Button actions:** the form's `catch` already toasts `err.message`, which is now readable ("Hotel is outside the staff member scope"). The user stays on the page.
- **Page data:** pages render `<AccessPage kind="unauthorized" />` inline when the main load fails with 403, instead of navigating away.

```tsx
if (isApiError(hotels.error, 403)) return <AccessPage kind="unauthorized" />;
```

Delete the 403 branch from `AppLayout.tsx:L75-77`. Route-level permission checks stay in `PermissionRoute`.

### F2. Error Boundaries (High, quick win, unchanged)

Add a root boundary in `main.tsx` and a page boundary in `AppLayout` that resets on `location.pathname`, exactly as in the earlier plan's Fix 2. The app uses `<BrowserRouter>`, so a class component is needed.

### F3. AuthProvider: one owner for session state (Medium, moderate)

Use the AuthProvider from the earlier plan's Fix 3, with these confirmed details from the backend:

- Logout is `POST /auth/logout`, which revokes the server session and clears both cookies. There's also `POST /auth/logout-all`; offer it in the Topbar menu as "Sign out everywhere".
- Sessions expire after **30 minutes idle** or 12 hours total. The listener now receives both 401 and `CSRF_REJECTED` (F1), and both mean "session over": redirect to login with `state: { from, reason: 'expired' }`.
- `/auth/me` returns `{ user: { id, email }, roles, permissions, hotelIds }`. Keep that as the `StaffMe` type and expose `can(permission)` from `useAuth()` for F11.

Show login failures by `errorCode`, not by a single generic toast:

```ts
// LoginPage.tsx — in the catch
const LOGIN_MESSAGES: Record<string, string> = {
  AUTH_MFA_REQUIRED: 'Multi-factor sign-in is required for this account.',
  ACCOUNT_LOCKED: 'Too many failed attempts. This account is locked for a few minutes.',
  TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait and try again.',
};
setFormError(isApiError(err) ? LOGIN_MESSAGES[err.code] ?? 'Email or password is incorrect.' : 'Network error. Check your connection.');
```

Show the error inline above the form, not as a toast, since the user is looking at the form. The `ACCOUNT_LOCKED` and `TOO_MANY_ATTEMPTS` codes depend on B9; until then they fall back to the generic message.

### F4. `useApiQuery`: cancellation, no stale overwrites, refresh after changes (High, moderate)

This replaces TanStack Query. It fixes the out-of-order search results (`HotelsPage.tsx:L38-56`), the missing cancellation (`DashboardPage.tsx:L24-48`, `CatalogPage.tsx:L49`), and lists going stale after a mutation.

```ts
// src/hooks/useApiQuery.ts
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
  opts: { tags?: string[]; enabled?: boolean } = {},
) {
  const enabled = opts.enabled !== false;
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(enabled);
  const current = useRef<AbortController>();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    current.current?.abort();               // also aborts on refetch()
    const c = new AbortController();
    current.current = c;
    setLoading(true);
    setError(undefined);
    fetcher(c.signal)
      .then((res) => { if (!c.signal.aborted) setData(res); })
      .catch((err) => { if (!c.signal.aborted) setError(err); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
  }, deps);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    run();
    return () => current.current?.abort();
  }, [run, enabled]);

  const tagKey = (opts.tags ?? []).join('|');
  useEffect(() => (enabled && tagKey ? subscribe(tagKey.split('|'), run) : undefined), [run, enabled, tagKey]);

  return { data, error, loading, refetch: run };
}

// --- invalidation: mutations call invalidate('hotels') and every subscribed query refetches
const subs = new Set<{ tags: string[]; fn: () => void }>();
export function invalidate(...tags: string[]) {
  subs.forEach((s) => { if (s.tags.some((t) => tags.includes(t))) s.fn(); });
}
function subscribe(tags: string[], fn: () => void) {
  const entry = { tags, fn };
  subs.add(entry);
  return () => { subs.delete(entry); };
}
```

What makes it correct:

- **No stale overwrites.** Every result is checked against its own `AbortController`, so an old response can never overwrite a newer one.
- **Data kept while loading.** `data` is not cleared on reload, so paging and filtering don't flash an empty table.
- **Real cancellation needs one more step.** Confirm `request()` passes `init.signal` into `fetch`; otherwise requests are ignored but still run.

```tsx
// HotelsPage.tsx
const debouncedSearch = useDebouncedValue(search, 300);
useEffect(() => setPage(1), [debouncedSearch, status, city]);

const hotels = useApiQuery((s) => listHotels({ search: debouncedSearch, status, city, page, pageSize }, s),
  [debouncedSearch, status, city, page, pageSize], { tags: ['hotels'] });
const metrics = useApiQuery((s) => getHotelMetrics(s), [], { tags: ['hotels'] });

// after create, update, media, publish, bulk status:
invalidate('hotels');
```

Use tags `hotels`, `room-types:<hotelId>`, `inventory:<roomTypeId>` and `rate:<roomTypeId>`. `useDebouncedValue` is the 6-line hook from the earlier plan. All endpoint calls move into `features/<domain>/<domain>.api.ts` files, which removes the inline URLs at `CatalogPage.tsx:L51` and `HotelWorkspace.tsx:L42`.

### F5. Rates: the real endpoints, safe saves (Critical if mismatched, quick win)

Rates belong to a **room type**, not a hotel. The only endpoints are `GET` and `PUT /admin/room-types/:roomTypeId/base-rate`.

```ts
// src/features/rates/rates.api.ts
export type BaseRate = { id: string; roomTypeId: string; amountMinorUnits: number; currency: string; version: number };

export async function getBaseRate(roomTypeId: string, signal?: AbortSignal): Promise<BaseRate | null> {
  try {
    return await request<BaseRate>(`/admin/room-types/${roomTypeId}/base-rate`, { signal });
  } catch (e) {
    if (isApiError(e, 404)) return null; // no rate yet = "Unconfigured", not an error
    throw e;
  }
}

export const setBaseRate = (roomTypeId: string, body: {
  amountMinorUnits: number; currency: string; version?: number; reason: string;
}) => request<BaseRate>(`/admin/room-types/${roomTypeId}/base-rate`, { method: 'PUT', body: JSON.stringify(body) });
```

The backend also returns 404 when the room type itself doesn't exist. That case is already covered by the stale-selection check in the room picker (F8). If you want them separate, ask for a specific `BASE_RATE_NOT_FOUND` code in B4.

```tsx
// RatesPage / BaseRatesView — save
const save = () => run(async () => {
  const target = { roomTypeId: roomId!, version: rate.data?.version }; // frozen at click time
  try {
    await setBaseRate(target.roomTypeId, {
      amountMinorUnits: toMinorUnits(amount), currency, reason, version: target.version,
    });
    toast.success('Rate saved');
    invalidate(`rate:${target.roomTypeId}`);
  } catch (err) {
    handleFormError(err, errors, toast, { onConflict: () => invalidate(`rate:${target.roomTypeId}`) }); // F6
  }
});

<HotelRoomPicker needsRoom disabled={busy} />  {/* can't switch room mid-save */}
```

Three details avoid server errors:

- **Send `version`** from the loaded rate on updates, and omit it when creating.
- **Add a required "Reason for change" field.** The DTO accepts `reason`; confirm whether it's required.
- **Lock the currency** to the one the hotel's other rates already use. Mixed currencies fail publishing with `HOTEL_RATE_CURRENCY_MISMATCH`. Default to `INR`.

### F6. Form errors by `errorCode` (High, moderate)

With B4 and F1 in place, every form uses one handler that decides how to show an error from its code:

| errorCode | Show as |
| --- | --- |
| `VALIDATION_FAILED` (400) | Message under each field, from `fieldErrors` |
| `DUPLICATE` (409) | Message under the duplicated field (slug, room code) |
| `VERSION_CONFLICT` (409) | Banner: "Someone else changed this. Reload to see the latest." with a Reload button |
| `HOTEL_NOT_READY` (409) | Checklist of `details` in the HotelWorkspace publish panel |
| Other 422 business rules | Alert above the form with `message` |
| `FORBIDDEN` (403) | Toast; stay on the page |
| Network or 500 | Toast "Couldn't save. Try again."; keep the form values |

```ts
// src/hooks/handleFormError.ts
export function handleFormError(
  err: unknown,
  form: ReturnType<typeof useServerErrors>,
  toast: { error: (msg: string) => void }, // pass useToast() from the component
  opts: { onConflict?: () => void; onNotReady?: (p: PublishProblem[]) => void } = {},
) {
  if (!isApiError(err)) return toast.error("Couldn't save. Check your connection and try again.");
  if (Object.keys(err.fieldErrors).length) return form.setFieldErrors(err.fieldErrors); // VALIDATION_FAILED, DUPLICATE
  if (err.code === 'VERSION_CONFLICT') return opts.onConflict ? opts.onConflict() : form.setFormError(err.message);
  if (err.code === 'HOTEL_NOT_READY' && opts.onNotReady) return opts.onNotReady(err.details);
  if (err.status === 422) return form.setFormError(err.message);
  toast.error(err.message);
}
```

`useServerErrors` is the hook from the earlier plan's Fix 6, simplified: it now only stores `fieldErrors` and `formError`, because parsing happens once in `toApiError`. Field names are dot paths from the backend (`address.city`, `contact.email`, `code`), so give each input a matching `name` attribute; that's what links the error to the field and focuses it.

Apply it to all five forms: `HotelCreateModal`, `HotelMediaModal`, `HotelWorkspace` (policy save and publish), `RoomCreateModal`, and the rate form. `LoginPage` uses F3's messages. For HotelMediaModal, keep the client-side `new URL()` check (`HotelMediaModal.tsx:L45`); the backend stores URLs only and doesn't accept uploads.

### F7. Bulk actions that match the backend (High, quick win)

The bulk bar (`HotelBulkActionsBar.tsx`) and the summary cards use "Paused", but the backend status is `SUSPENDED` and the metrics key is `suspended`. Put the mapping in one place:

```ts
// src/features/hotels/hotel-status.ts
export type HotelStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED';

export const STATUS_LABEL: Record<HotelStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  SUSPENDED: 'Suspended', // or 'Paused' — the label is yours; the value must be SUSPENDED
  ARCHIVED: 'Archived',
};
```

Use it in `Status.tsx`, `HotelSummaryCards.tsx` (read `metrics.suspended`), `HotelFiltersBar.tsx` and the bulk bar. The bulk call becomes:

```ts
export const bulkUpdateStatus = (body: { hotelIds: string[]; status: HotelStatus; reason: string }) =>
  request<{ modifiedCount: number; status: HotelStatus; skipped?: { hotelId: string; message: string }[] }>(
    '/admin/hotels/bulk-status', { method: 'PATCH', body: JSON.stringify(body) });
```

Build the `ConfirmDialog` from the earlier plan's Fix 7 with these changes:

- **Collect a reason** in the dialog (a textarea), since the DTO takes one.
- **Archive is irreversible.** Say so in the dialog, and make the user type `ARCHIVE` to enable the button.
- **Report the real result.** If `modifiedCount` is less than the number selected, show "3 of 5 hotels updated" and list `skipped` (available after B3), instead of a plain success toast.
- **Disable Publish for drafts.** Disable bulk Publish when any selected hotel is `DRAFT`; drafts publish one at a time from HotelWorkspace so the readiness checklist shows.

Then call `invalidate('hotels')` and clear the selection.

### F8. Split CatalogPage, keep the URLs (Medium, moderate)

Same plan as the earlier Fix 8: `RoomTypesPage`, `InventoryPage` and `RatesPage` on the existing paths (no redirects), with `?hotel=&room=` in the URL and a shared `HotelRoomPicker` that shows "not found" for a stale selection. Two updates:

- **Data hook.** Use `useApiQuery` with tags instead of `useQuery`.
- **Hotel picker limit.** The API caps the list at `limit=100`. Replace the plain hotel `Select` with a searchable combobox that calls `GET /admin/hotels?search=<text>&limit=20`, so any hotel can be found.

Rates page detail: rates belong to room types, so the page shows one row per room type of the selected hotel. Each row loads with `getBaseRate(roomTypeId)` and shows "Not set" when it returns `null`. For a typical hotel with under 10 room types, separate calls are fine.

### F9. Theme tokens (Medium, unchanged)

As in the earlier Fix 9: Tailwind v4 `@theme` tokens named by role (`brand`, `ink`, `canvas`, `line`, `danger`), keeping the exact current hex values.

### F10. Cleanup (Low, unchanged)

As in the earlier Fix 10: `@/` alias, delete `UIPrimitives.tsx`, split `ui-feedback.tsx`, merge `KpiStrip` and `HotelSummaryCards`, add `Skeleton` / `Loader` / `NotFound` (Link styled as a button), and relabel `/admin/unauthorized` as "no access" (403), not 401.

### F11. Show only the actions a user can take (Medium, quick win)

The backend enforces permissions; the UI should stop offering buttons that will fail. `useAuth()` exposes `can()` from `/auth/me` permissions:

```tsx
// src/features/auth/Can.tsx
export function Can({ permission, children, fallback = null }: {
  permission: string; children: React.ReactNode; fallback?: React.ReactNode;
}) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}
```

| Action | Permission |
| --- | --- |
| Create hotel | `hotels.create` (SUPER\_ADMIN only) |
| Edit hotel, policy, media, suspend | `hotels.edit` |
| Publish | `hotels.publish` |
| Archive | `hotels.archive` (enforced after B3) |
| Add room type / edit / disable | `room_types.create` / `room_types.edit` / `room_types.archive` |
| Block or unblock nights | `inventory.block` |
| Initialize inventory | `inventory.adjust` |
| Edit base rate | `rates.edit` |

Hide actions the user can never take. Disable, with a tooltip, actions that depend on state, such as Publish on a hotel that isn't ready.

### F12. Inventory block and unblock that actually work (High, moderate)

The backend requires `{ version, quantity, reason }` for `POST .../inventory/:stayDate/block` and `.../unblock`. If the calendar's Block button sends none of these (`CatalogPage.tsx:L157`), every block fails with 400. There's also no Unblock in the UI.

```ts
// src/features/inventory/inventory.api.ts
export type NightInventory = {
  stayDate: string; total: number; blocked: number; held: number; confirmed: number; version: number;
};

export const adjustNight = (roomTypeId: string, stayDate: string, action: 'block' | 'unblock',
  body: { version: number; quantity: number; reason: string }) =>
  request<NightInventory>(`/admin/room-types/${roomTypeId}/inventory/${stayDate}/${action}`, {
    method: 'POST', body: JSON.stringify(body),
  });
```

In the UI, clicking a day opens a small panel:

- **Shows** total, blocked, held, confirmed and available (`total - blocked - held - confirmed`).
- **Asks for** a quantity (1 to available for Block, 1 to `blocked` for Unblock) and a reason (3–500 characters).
- **Sends** that night's `version`.

On success, replace just that day with the returned document, which carries the new `version`, instead of reloading 14 days. On `VERSION_CONFLICT` or the capacity error, call `invalidate('inventory:<roomTypeId>')` and show "This night changed; reloaded." A range version can use the existing `batch-adjust` endpoint later.

## Changes that touch both apps

One rule makes every contract change safe: ship the frontend first, written to accept both the old and the new response, then ship the backend change. Nothing breaks at any point, whichever deploy finishes first.

| Change | What changes on the wire | Ship first | Then |
| --- | --- | --- | --- |
| B4 structured errors | 400 `message` becomes a string; new `errors[]`; `errorCode` becomes `NOT_FOUND` instead of `Not Found` | F1 `toApiError` (accepts array or string `message`, optional `errors`) | B4 |
| B4 duplicate keys | Duplicate slug or room code returns 409 `DUPLICATE` with `errors[]` | F6 handler (field errors win regardless of status) | B4 |
| B5 publish checklist | One 409 `HOTEL_NOT_READY` with `details[]` instead of separate `HOTEL_*` codes | F6 `onNotReady` (falls back to `message` when `details` is empty) | B5 |
| B3 bulk status | Adds `updated[]`, `skipped[]`; rejects invalid transitions; checks `hotels.publish` / `hotels.archive` | F7 (reads `skipped` if present; disables Publish for drafts) and F11 | B3 |
| B3 archive endpoint | New `POST /admin/hotels/:id/archive` | B3 (new endpoint; nothing uses it yet) | Archive button in HotelWorkspace |
| B9 login codes | New `ACCOUNT_LOCKED` and 429 `TOO_MANY_ATTEMPTS` | F3 message map (unknown codes fall back to the generic message) | B9 |
| B1 MFA flag | None for the frontend while `MFA_ENABLED=false` | B1 | F3 already shows `AUTH_MFA_REQUIRED` clearly |

Before B4 ships, search the frontend for any code matching the old title-case codes (`grep -rn "'Not Found'\|'Bad Request'" apps/admin-web/src`). Anything found must switch to `status` or the new codes.

For each pair, test locally with both apps running before merging: submit an invalid hotel form, a duplicate room code, publish an unready hotel, and bulk-archive a mix of in-scope and out-of-scope hotels.

## Migration order

Four weeks, one PR per fix. Every week ends with both apps deployable.

1. **Week 1: make production usable and safe.**
   1. API: B1 (MFA flag), B2 (env validation), B3 (bulk status rules + archive endpoint), with its tests from B7 item 2.
   2. Web: confirm the rate endpoint mismatch, then F5 if confirmed. F7 (status names, bulk body, confirm dialog), F1 (`ApiError` + 403 split), F2 (Error Boundaries), F10 alias and dead shim.
2. **Week 2: one error contract, one data pattern.**
   1. Web first: F4 (`useApiQuery`, API files, debounce) on HotelsPage and DashboardPage; F6 (form error handler) on all five forms; F3 (AuthProvider, login messages); F11 (permission-aware actions).
   2. API after: B4 (structured errors, duplicate keys), B5 (publish checklist). Then B7 items 1, 3 and 5 (scoping, CSRF, error shape).
   3. Web: F12 (inventory block and unblock).
3. **Week 3: catalog and structure.**
   1. Web: F8 (split CatalogPage, URL selection, hotel combobox, empty states), then delete `CatalogPage.tsx`.
   2. API: B6 (index script, `autoIndex` off in production), B8 (split `HotelService`, shared crypto), B7 items 4 and 6.
4. **Week 4: polish.**
   1. Web: F9 (theme tokens), the rest of F10 (KPI merge, `ui-feedback` split, primitives), the in-page access state from F1.
   2. API: B9 (429 and lock codes), B10 once retention is decided.

Before merging any PR: run type checks and builds for both apps, and run the API e2e tests. Then click through login, dashboard, hotels (search, page, create, bulk action), workspace (edit, publish) and all three catalog pages.

## Verify first, then decide

Everything above comes from three AI-written audits, not from reading your code directly. These checks take minutes and decide whether a fix is needed or how it's written.

**Check in the code before starting.**

- [ ] Which rate URL does the frontend actually call (`CatalogPage.tsx:L73`, L196)? If it isn't `/admin/room-types/:id/base-rate`, the Rates page is broken today.
- [ ] Does `hotel.service.ts:L117-145` check the current status or run publish checks before `updateMany`? Decides whether B3 is Critical or just a cleanup.
- [ ] Does the inventory Block button send `version`, `quantity` and `reason` (`CatalogPage.tsx:L157`)? Decides F12's urgency.
- [ ] Does the frontend use `PAUSED` or `paused` anywhere (`grep -rni paused apps/admin-web/src`)?
- [ ] Does `request()` in `api.ts` pass `init.signal` to `fetch` (F4)?
- [ ] Is `reason` required in `SetBaseRateDto` and `BulkHotelStatusDto`?
- [ ] What status does `CSRF_REJECTED` use, 403 or 401 (F1)?
- [ ] Is the production MFA block live today? If production login works, someone may already deploy with `NODE_ENV` unset, which also means cookies aren't `secure`.

**Decisions for you.**

- [ ] **MFA:** ship B1 with MFA off and add TOTP later, or build TOTP before go-live? Without it, admin accounts rely on password plus lockout.
- [ ] **Status label:** show `SUSPENDED` as "Suspended" or "Paused" in the UI? Either works; just use one.
- [ ] **Audit log retention:** how long to keep entries (B10)?
- [ ] **Bookings:** the timezone rule queries a `bookings` collection that doesn't exist yet. Will bookings live in `apps/api`? This affects B8's interface.
- [ ] **Staff management UI:** roles and hotel assignments can only be set by seeding today. Is an admin screen planned?
- [ ] **Inventory freshness:** is manual refresh enough, or should the calendar poll? `useApiQuery` can refetch on an interval if needed.
