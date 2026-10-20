# MVP implementation plan — Staywise (P1–P6)

- **Date:** 2026-10-20
- **Status:** proposal; becomes the task source of truth once the [shared baseline](./README.md#shared-baseline-every-document-must-follow-this) is approved.
- **Reader:** a coding model (possibly a smaller one) plus the human reviewer who approves each 🧑 checkpoint.
- **Scope:** phases **P1–P6** from the baseline. P0 is built; P7–P8 are in [PHASES.md](./PHASES.md).
- **Inputs:**
  - [README.md](./README.md): baseline, names, routes, state machines, India rules, checkpoint convention;
  - [admin-ux-plan.md](./admin-ux-plan.md) and [reports/Hotel admin UX plan evaluation.md](./reports/Hotel%20admin%20UX%20plan%20evaluation.md);
  - `../MVP.md`, `../TASKS.md`, `../API.md`, `../DATA_MODEL.md`, `../ARCHITECTURE.md`, `../guidelines/backend.md`, `../guidelines/frontend-ui.md`, `../ANALYSIS.md#ui-theme-consistency-audit`;
  - `../../AGENTS.md`, `../../AGENT.md`, `../../.agent/rules/orchestration.md`, `../../.agent/workflows/implement-task.md`;
  - the current code in `apps/api` and `apps/admin-web`, read on 2026-10-20.

**Contents**

1. [How to use this plan](#1-how-to-use-this-plan)
2. [Conventions cheat-sheet](#2-conventions-cheat-sheet)
3. [Phase plans (P1–P6)](#3-phase-plans-p1p6)
   - [P1 — Admin foundations](#p1--admin-foundations)
   - [P2 — Inventory & rates grid](#p2--inventory--rates-grid)
   - [P3 — Hotel content, Overview & tax](#p3--hotel-content-overview--tax)
   - [P4 — Holds & booking core](#p4--holds--booking-core)
   - [P5 — Guest booking web (MVP)](#p5--guest-booking-web-mvp)
   - [P6 — Booking management + MVP launch](#p6--booking-management--mvp-launch)
4. [Cross-phase checklists](#4-cross-phase-checklists)
5. [Risks and where the coding model is most likely to fail](#5-risks-and-where-the-coding-model-is-most-likely-to-fail)

---

## 1. How to use this plan

### 1.1 Rules for the coding model

- **One task at a time.**
  - Do tasks in ID order inside a phase (`P1-T01`, `P1-T02`, …) unless **Depends on** says otherwise.
  - Don't start a task until every task in its **Depends on** list is done and approved.
  - Don't start a phase until the previous phase's **exit criteria** are met and its exit checkpoint is approved.
- **Stop at every 🧑 HUMAN CHECKPOINT.**
  - Finish the work up to the checkpoint, report (see [1.4](#14-how-to-report)), then **stop and wait**.
  - Never assume approval. Never decide a product, tax, money, security or design question yourself.
  - If the human answers with a different value than this plan suggests, use the human's value and update the plan's "Docs to update" files with it.
- **Use the pipeline.** Every task is a feature change, so run it through `/implement-task` (`.agent/workflows/implement-task.md`):
  - task ID for the work folder: `<yyyymmdd>-<task-id-lowercase>-<short-name>`, e.g. `20261021-p1-t05-room-enable`;
  - roles edit only their allowed paths (`.agent/rules/orchestration.md`);
  - the docs-keeper stage is mandatory.
- **Verification commands (from the baseline; run all three unless the task says otherwise):**
  - **API types:** `npx tsc --noEmit -p apps/api/tsconfig.json`
  - **Admin web types:** `cd apps/admin-web && npx tsc -b` (in Windows PowerShell 5.1 use `cd apps/admin-web; npx tsc -b`, because `&&` does not work there)
  - **API tests:** `npm --workspace=apps/api run test` (one file: `npm --workspace=apps/api run test -- <file-name-part>`)
  - **Guest web types (from P5):** `cd apps/guest-web && npx tsc -b`
- **Never:**
  - run `nest build` or `npm run build:api` (the dev server `npm run dev` may be running and `nest build` fights its watcher; use `tsc --noEmit`);
  - `git commit`, `git push`, or delete any file or directory without explicit human approval (`../../AGENTS.md`);
  - touch production data or production configuration;
  - trust client-sent prices, totals, availability, roles or hotel scope;
  - put a network call (email, payment, HTTP) inside a Mongo transaction;
  - use floating-point money. Money is **integer minor units (paise)** plus an ISO currency.
- **Follow existing patterns.** Before writing a new file, open the file this plan names as the pattern and copy its structure (section [2](#2-conventions-cheat-sheet)). Don't introduce new libraries unless the task says so.
- **Files you would like to delete** (old pages, dead code): list them in your report under "Deletion candidates". Don't delete them.
- **If something in this plan is wrong** (a file moved, an API differs): stop, report the difference, and propose the smallest fix. Don't redesign.

### 1.2 Definition of done (every task)

- **Built:** every step is implemented; no `TODO` left in the changed code.
- **Acceptance criteria:** each bullet passes, and you can say how you checked it.
- **Types:** the type checks above pass with zero errors.
- **Tests:** the tests named in **Tests** exist and pass; existing tests still pass.
- **Server rules:** permission + hotel scope checked on the server for every new endpoint; every write that changes hotel, room, rate, inventory, policy, tax or booking data writes an `AuditLog` entry in the same transaction.
- **UI rules:** shared components only (no hand-built `<button>`, `<select>`, `<input type="date">`, tab bars or error boxes); loading, empty and error states present; keyboard reachable; sentence-case copy.
- **Docs:** files under **Docs to update** are updated (docs-keeper stage). `../TASKS.md` lines are ticked `[x]` **only** with evidence (`.agent/work/<task-id>/verify.md`).
- **Checkpoint:** if the task has a 🧑 checkpoint, it is approved.

### 1.3 Task format used below

- **Goal**, **Depends on**, **Files to create/modify**, **Steps**, **Acceptance criteria**, **Tests**, **Verification**, **Docs to update**, and, where needed, a **🧑 HUMAN CHECKPOINT** block:
  > **🧑 HUMAN CHECKPOINT — <reason>**: what the human must decide, review or test, and what "approved" looks like.
- Paths are relative to the repo root unless they start with `NP/` (= `Documentation/new plan/`) or `../` (= `Documentation/`).

### 1.4 How to report

- **After each task (and at each checkpoint)**, report in this order:
  1. **Task:** ID and title.
  2. **Changed files:** one line each, with "created" or "modified".
  3. **Behaviour delivered:** 3–6 bullets.
  4. **Verification:** each command with PASS / FAIL and the number of tests run.
  5. **Acceptance criteria:** each bullet with PASS / FAIL / NOT CHECKED and how it was checked.
  6. **Docs updated:** files and sections.
  7. **Checkpoint:** the exact question(s) for the human, with your suggested answer and the alternatives.
  8. **Deletion candidates and open issues.**
  9. "Commit these changes?" (never commit without a yes).

### 1.5 Names already aligned across the new-plan documents

- **Resolved by the coordinator on 2026-10-20** (defaults recorded in [README.md](./README.md#canonical-names); the human can still change them at the P1-T01 / P4-T06 checkpoints, and the docs-keeper then updates every document):
  - **Permission keys:** `audit.view`, `hotels.edit_tax`, `bookings.view`, `bookings.create` (includes walk-ins), `bookings.manage` (modify dates/guest details, check in, check out), `bookings.cancel`, `bookings.no_show`; P8 adds `bookings.assign_room`, `bookings.check_in_override`. Cancellation-policy edits keep the existing `hotels.edit`.
  - **Booking reference format:** `SW-` + 6 Crockford base32 characters (no I/L/O/U), e.g. `SW-7K3M9Q`; unique index, regenerate on duplicate (up to 3 tries).
  - **Field and collection names:** follow [DATA-MODEL.md](./DATA-MODEL.md). If a task here names a field differently, stop at the task's checkpoint and report it.

---

## 2. Conventions cheat-sheet

### 2.1 Backend (NestJS, `apps/api`)

- **Module layout** (copy `apps/api/src/modules/pricing/`):
  - `<domain>.module.ts`: imports `AuthModule` (needed by `StaffPermissionGuard`) and `MongooseModule.forFeature([...])` for every model the services inject. Example: `apps/api/src/modules/pricing/pricing.module.ts`.
  - `<domain>.controller.ts`: HTTP only. Example: `apps/api/src/modules/pricing/pricing.controller.ts`.
  - `<domain>.service.ts`: business rules and transactions. Example: `apps/api/src/modules/pricing/pricing.service.ts`.
  - `dto/*.dto.ts`: `class-validator` DTOs. Example: `apps/api/src/modules/hotels/dto/room-type.dto.ts`.
  - `schemas/*.schema.ts`: `@Schema({ timestamps: true, collection: '<snake_plural>' })`, `SchemaFactory.createForClass`, named indexes. Example: `apps/api/src/modules/inventory/schemas/night-inventory.schema.ts`.
  - **Register** a new module in `apps/api/src/app.module.ts` `imports` (today: `HotelsModule` imports `InventoryModule` and `PricingModule`).
- **Controller pattern** (from `apps/api/src/modules/hotels/room-types.controller.ts`):

  ```ts
  @ApiTags('Admin room types')
  @ApiCookieAuth('staywise_staff_sid')
  @Controller('admin')
  @UseGuards(StaffPermissionGuard)
  export class AdminRoomTypesController {
    @Post('room-types/:id/disable')
    @RequirePermission('room_types.archive')
    disable(@Param('id') id: string, @Body() dto: StatusChangeDto, @Req() request: StaffRequest) {
      return this.roomTypes.disable(id, dto.version, request.user, dto.reason);
    }
  }
  ```

- **Permissions:**
  - `@RequirePermission('<domain>.<action>')` from `apps/api/src/common/auth/staff-permission.guard.ts`.
  - The guard also checks hotel scope **only** when the route has `:hotelId` (or `:id` under `/hotels`). Routes like `/admin/room-types/:id` get no automatic scope check, so the **service must call `assertHotelScope(actor, hotelId)`** after loading the record (see `RoomTypeService.getById`).
  - Permission keys are code-owned in `apps/api/src/modules/auth/seed-super-admin.ts` (`CATALOG_PERMISSIONS`). New keys are added there and synced by the script from P1-T01.
- **Hotel scope:** `assertHotelScope(actor, hotelId)` in `apps/api/src/modules/hotels/hotel.policies.ts`. Copies exist in `room-type.service.ts`, `inventory.service.ts` and `pricing.service.ts`; P1-T01 replaces them with the shared one.
- **Child records must match the URL hotel.** When a route has `:hotelId` and also takes a child ID (`roomTypeId`, `bookingId`, `holdId`), the service must load the child and check `child.hotelId === hotelId`, else `404 NOT_FOUND`. The guard only checks the URL hotel; without this check a manager of hotel A could touch hotel B's records by passing A's ID in the URL.
- **ObjectIds:** `asObjectId(id)` from `hotel.policies.ts` (throws `404` for bad IDs).
- **Transactions:** `TransactionService.executeInTransaction(async (session) => { ... })` from `apps/api/src/common/database/transaction.service.ts`.
  - Pass `{ session }` to every read and write inside (`.session(session)` on queries, `{ session }` on `create`/`findOneAndUpdate`/`updateMany`).
  - It retries transient conflicts (default 3; pass a higher `maxRetries` for holds).
  - Standalone Mongo only works when `NODE_ENV=development` and gives **no** atomicity (ADR-012). Concurrency tests must use `MongoMemoryReplSet`.
- **Optimistic `version`:** read `before`, compare `before.version !== dto.version` → `409 VERSION_CONFLICT`, then `findOneAndUpdate({ _id, version }, { $set, $inc: { version: 1 } }, { new: true, session })`; a `null` result is also `VERSION_CONFLICT`. Pattern: `RoomTypeService.update`.
- **Inventory capacity updates:** conditional update with `$expr` on `total - (blocked + held + confirmed)`. Pattern: `InventoryService.adjustNight`. Invariant: `held + confirmed + blocked <= total` for every room type and night.
- **Audit:** `AuditService.log({ actorId, actorType: 'STAFF', action, resourceType, resourceId, hotelId, outcome: 'SUCCESS', reason, metadata: { before, after }, session })` inside the same transaction. Pattern: `RoomTypeService.writeAudit`. Action names are `<resource>.<verb>` in lower snake case (`room_type.disable`, `inventory.batch_block`).
- **Errors:**
  - throw Nest exceptions with `{ error: 'UPPER_SNAKE_CODE', message, errors?, details? }`;
  - `AllExceptionsFilter` (`apps/api/src/common/filters/http-exception.filter.ts`) turns that into `{ statusCode, errorCode, message, errors?: [{ field, message }], details?, timestamp, path }`;
  - DTO failures come from the `ValidationPipe` in `apps/api/src/main.ts` as `400 VALIDATION_FAILED` with per-field `errors`;
  - status codes: `400` bad input, `403 FORBIDDEN`, `404 NOT_FOUND`, `409` conflicts (`VERSION_CONFLICT`, `INVENTORY_UNAVAILABLE`, `HOLD_EXPIRED`, `IDEMPOTENCY_CONFLICT`), `422` business rule (`OCCUPANCY_EXCEEDED`, `INVALID_STAY_DATES`), `429 RATE_LIMITED`.
- **Dates:** stay dates are `YYYY-MM-DD` strings in the hotel's time zone; check-out is excluded. Use `dateRange(from, to)` from `apps/api/src/modules/inventory/inventory.service.ts` and `dateInTimezone(new Date(), hotel.timezone)` from `hotel.policies.ts` for "local today".
- **Tests:** Jest, `*.spec.ts` next to the code (`apps/api/jest.config.js`). Integration pattern: `apps/api/src/modules/hotels/hotel-lifecycle.integration.spec.ts` (creates `MongoMemoryReplSet`, builds models with `connection.model(...)`, calls `model.init()`, constructs services with `new Service(...)`, `jest.setTimeout(120_000)`).

### 2.2 Frontend (React + Tailwind v4, `apps/admin-web`)

- **API client:** `request<T>(path, init)` from `apps/admin-web/src/api.ts` (adds CSRF header, credentials, throws `ApiError` with `status`, `code`, `fieldErrors`, `details` from `apps/admin-web/src/api/errors.ts`). Feature API files wrap it: `apps/admin-web/src/features/rooms/rooms.api.ts`.
- **Data loading:** `useApiQuery(fetcher, deps, { tags, enabled })` and `invalidate(...tags)` from `apps/admin-web/src/hooks/useApiQuery.ts`. Pattern: `apps/admin-web/src/pages/hotels/HotelEditPage.tsx`. Tag names used in this plan: `hotels`, `hotel:<id>`, `rooms-summary`, `readiness`, `inventory-grid`, `audit`, `bookings`.
- **Form errors:** `const formErrors = useServerErrors()` (`hooks/useServerErrors.ts`) and `handleFormError(err, formErrors, toast, { onConflict })` (`hooks/handleFormError.ts`); show per-field messages through `Field error={formErrors.getError('name')}`.
- **Double-submit guard:** `const { busy, run } = useBusyGuard()` from `apps/admin-web/src/ui-feedback.tsx`.
- **Toasts:** `const toast = useToast()` → `toast.success / error / info`.
- **Permission gate (UI only, never security):** `<Can permission="rates.edit">…</Can>` from `apps/admin-web/src/features/auth/Can.tsx`; `useAuth().can(key)`. Routes: `routePermissions` in `apps/admin-web/src/routes/route-config.ts` + `PermissionRoute`.
- **Shared UI** (`apps/admin-web/src/components/ui/`, exported from `index.ts`):
  - `Button` (`variant`: primary | secondary | outline | ghost | danger; `size`: sm | md | lg; `isLoading`, `loadingLabel`, `leftIcon`);
  - `Field` (`label`, `required`, `error`, `hint`, `fullWidth`) wrapping `Input`, `Select`, `Textarea`;
  - `MoneyInput` (`name`, `currency`, `defaultMinorUnits`, `onMinorUnitsChange`; staff type rupees, the value sent is minor units);
  - `Combobox` (`options`, `value`, `onChange`, `onSearch`, `loading`, `allowCustom`), `DatePicker` (`value`, `onChange`, `min`, `max`), `Checkbox`, `ReasonField` (3–500 chars, matches the API);
  - `Modal` (`title`, `subtitle`, `footer`, `size`, `variant`: drawer | dialog, `closeOnBackdrop`), `ConfirmDialog`;
  - `DataTable` (`columns: Column<T>[]`, `rowKey`, `loading`, `error`, `emptyTitle`, `toolbarHeader`, `pagination`, `onRowClick`, and `renderBody(rows)` for a card layout);
  - `Tabs` (`items: TabItem[]`, `activeId`, `onChange`, `variant`: underline | pills, `size`), `Status` (`status`, `variant`: dot | pill), `Alert` (`tone`), `EmptyState`, `Loader`, `LoadingRows`, `PageHeading` (`eyebrow`, `title`, `description`, `action`).
- **Money:** `apps/admin-web/src/utils/money.ts` → `toMinorUnits`, `fromMinorUnits`, `formatMoney(minor, currency)`, `DEFAULT_CURRENCY = 'INR'`. Never divide by 100 by hand.
- **Dates:** `isoToday(timeZone)` and `plusDays(date, n)` from `apps/admin-web/src/utils/helpers.ts`; `readId(record)` for `_id`/`id`.
- **Theme rules:** `../ANALYSIS.md#ui-theme-consistency-audit` "The reference theme" (page root `space-y-6`, `PageHeading`, main container `bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-6 sm:p-8`, form footer `pt-6 border-t border-slate-100 flex justify-end gap-2`, Cancel = `outline`, confirm = `primary`/`danger`) and `apps/admin-web/docs/ui-decisions.md`.
- **Structure:** one component per file, ~200 lines max (`../guidelines/frontend-ui.md` §3); routed pages in `src/pages/`, feature parts in `src/features/<domain>/`, shared primitives in `src/components/ui/` (a new shared primitive needs a 🧑 design checkpoint).
- **Router:** `BrowserRouter` (`apps/admin-web/src/main.tsx`), react-router-dom 7. `useBlocker` is **not** available with `BrowserRouter`; unsaved-change guards use the context from P1-T04, not router blocking.

---

## 3. Phase plans (P1–P6)

- **Order:** P1 → P2 → P3 → P4 → P5 → P6. Each phase starts only after the previous phase's exit checkpoint is approved.
- **Parallel work inside a phase:** only where **Depends on** allows it (e.g. P2-T07 with P2-T04, P3-T03 with P3-T01). A smaller model should still do one task at a time.
- **Summary:**

| Phase | Tasks | 🧑 checkpoints | Main deliverable | Riskiest task |
|---|---|---|---|---|
| P1 Admin foundations | 14 | 9 | Hotel-scoped routes, switcher, Rooms & rates table + panel, audit log | P1-T04 route change |
| P2 Inventory & rates grid | 12 | 8 | `DailyRate`, restrictions, grid + bulk edit | P2-T05 bulk transaction |
| P3 Hotel content, Overview & tax | 10 | 9 | Content fields, Overview, completeness, GSTIN | P3-T03 GSTIN rules |
| P4 Holds & booking core | 10 | 8 | Quote + GST, holds, bookings, staff page | P4-T04/T08 concurrency |
| P5 Guest booking web | 11 | 7 | `apps/guest-web`, public API, tokens, rate limits | P5-T03 guest access security |
| P6 Booking management + launch | 11 | 5 | Bookings list/detail/actions, calendar, email, hardening | P6-T10 launch hardening |
| **Total** | **68** | **46** | | |

<a id="p1"></a>

## P1 — Admin foundations

- **Goal:** one hotel-scoped admin. The hotel lives in the URL, a global switcher changes it, each hotel has a Rooms & rates table with a side panel, room types can be enabled/disabled/duplicated, every change can be read in an audit log, and the worst theme inconsistencies are fixed.
- **Entry criteria:**
  - P0 works locally: `npm run dev` starts API and admin; you can create, set up and publish a hotel.
  - The three verification commands pass on the current code (record the starting test count).
  - The baseline in `NP/README.md` is approved.
- **Exit criteria:**
  - Every per-hotel screen is under `/admin/hotels/:hotelId/...`; all old routes redirect (P1-T04 checkpoint approved).
  - The hotel switcher follows the switcher rules in the baseline.
  - Rooms & rates table, side panel, enable/disable/duplicate work for a manager scoped to one hotel and fail with `403` for another hotel.
  - `/admin/audit` lists and filters audit entries within the actor's scope.
  - Theme quick wins done and visually signed off.
  - All verification commands pass; P1 docs updated.

### P1-T00 — Soft-delete foundation (all collections)
- **Goal:** every delete becomes a soft delete, as decided on 2026-10-20 ([DATA-MODEL.md §1.6](./DATA-MODEL.md#soft-delete)). Do this before any other P1 task, so new endpoints are built on it. If MIGRATION-PLAN M0.7 was already done in P0, only verify.
- **Depends on:** P0 (MIGRATION-PLAN M0.1 baseline snapshot).
- **Files to create/modify:**
  - `apps/api/src/common/database/soft-delete.plugin.ts` (new);
  - every schema in `apps/api/src/modules/*/schemas/*.ts`;
  - `apps/api/src/scripts/ensure-indexes.ts`;
  - `apps/api/src/scripts/backfill-soft-delete.ts` (new);
  - services with delete paths.
- **Steps:**
  1. **Add the fields to each schema:** `isDeleted: { type: Boolean, required: true, default: false, index: true }`, `deletedAt: { type: Date, default: null }`, `deletedBy: { type: Types.ObjectId, ref: 'User', default: null }`, `deleteReason: { type: String, maxlength: 500, default: null }`.
  2. **Write the plugin:**
     - `pre(['find','findOne','countDocuments','findOneAndUpdate','updateMany','updateOne'])` adds `isDeleted: { $ne: true }` unless the query option `withDeleted: true` is set;
     - `pre('aggregate')` prepends `{ $match: { isDeleted: { $ne: true } } }` unless the option is set;
     - register it on every schema.
  3. **Partial unique indexes:** in `ensure-indexes.ts`, change each unique index to include `partialFilterExpression: { isDeleted: false }` (hotel slug, room type code per hotel, base rate per room type, night inventory per room type + date, daily rate per room type + date, role key, user email).
  4. **Backfill script:** set `isDeleted: false, deletedAt: null, deletedBy: null, deleteReason: null` where `isDeleted` is missing. It prints counts and has `--dry-run`.
  5. **Delete paths:**
     - change `DailyRate` clearing to soft delete (audit `rate.daily.clear`);
     - where an entity has a delete action, it sets the four fields, bumps `version` and writes audit `<entity>.delete`;
     - add `POST …/:id/restore` for super admin (audit `<entity>.restore`).
  6. **Never-deletable collections:** `Booking`, `Payment`, `PaymentEvent`, `Refund`, `Invoice`, `AuditLog` get the fields but **no** delete endpoint. A service guard throws if anything tries to set `isDeleted: true` on them.
- **Acceptance criteria:**
  - every collection has the four fields after the backfill;
  - deleted documents never appear in lists, search, detail, counts, readiness checks or the hotel switcher;
  - restore brings a document back unchanged;
  - a hotel slug or room code can be reused after soft delete;
  - no code path calls `deleteOne`/`deleteMany` except the approved TTL and privacy jobs.
- **Tests:**
  - plugin unit test (find/count/aggregate hide deleted; `withDeleted` shows them);
  - integration test: delete, then hidden, then restore, then visible;
  - partial unique index test.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test`; `grep -rn "deleteOne|deleteMany" apps/api/src` shows only approved uses.
- **Docs to update:** `DATA-MODEL.md` (if names change), `../DATA_MODEL.md`, `../API.md` (restore endpoints), `../TASKS.md`.
> **🧑 HUMAN CHECKPOINT — soft delete**: approve the field name (`isDeleted` vs `is_deleted`), the never-deletable list and the TTL/DPDP exceptions (DATA-MODEL §1.6) **before** step 1. Run the backfill and index rebuild with `--dry-run` on a copy of the database and approve the counts **before** running on shared data. Approved = written "yes" plus dry-run output.

### P1-T01 — Permission sync script and one shared hotel-scope helper

- **Goal:** add new permission keys safely and stop copying `assertHotelScope` into every service.
- **Depends on:** none.
- **Files to create/modify:**
  - `apps/api/src/modules/auth/permissions.ts` — **create**: the single exported `CATALOG_PERMISSIONS` array.
  - `apps/api/src/modules/auth/seed-super-admin.ts` — **modify**: import `CATALOG_PERMISSIONS` from `./permissions`.
  - `apps/api/src/scripts/sync-permissions.ts` — **create**.
  - `apps/api/package.json` — **modify**: add script `"sync:permissions": "ts-node -r tsconfig-paths/register src/scripts/sync-permissions.ts"`.
  - `apps/api/src/modules/hotels/room-type.service.ts`, `apps/api/src/modules/inventory/inventory.service.ts`, `apps/api/src/modules/pricing/pricing.service.ts` — **modify**: delete the local `assertHotelScope` function and import it from `hotel.policies.ts`.
- **Steps:**
  1. Move the array from `seed-super-admin.ts` into `permissions.ts` and add the keys every MVP phase needs (adding them now avoids re-seeding each phase):
     - existing: `hotels.view`, `hotels.create`, `hotels.edit`, `hotels.publish`, `hotels.archive`, `room_types.view`, `room_types.create`, `room_types.edit`, `room_types.archive`, `inventory.view`, `inventory.block`, `inventory.adjust`, `rates.view`, `rates.edit`;
     - new: `audit.view` (P1), `hotels.edit_tax` (P3), `bookings.view`, `bookings.create`, `bookings.manage` (P4/P6).
  2. `sync-permissions.ts`: same env loading and connection code as `seed-super-admin.ts`; upsert each `Permission` (`$setOnInsert`); then `Role.updateOne({ key: 'SUPER_ADMIN' }, { $set: { permissionKeys: CATALOG_PERMISSIONS } })`. It must **not** create users, change passwords or touch other roles. Print the number of keys synced.
  3. Replace the three local `assertHotelScope` copies with the import. Behaviour must not change (same `403 FORBIDDEN` body).
- **Acceptance criteria:**
  - `npm --workspace=apps/api run sync:permissions` against the local dev DB adds the new keys to `SUPER_ADMIN` and exits 0; running it twice changes nothing the second time.
  - Only one `function assertHotelScope` exists in `apps/api/src` (`grep -rn "function assertHotelScope" apps/api/src` returns one line).
  - All existing tests pass unchanged.
- **Tests:** existing suites (`hotel-lifecycle.integration.spec.ts`, `inventory.service.spec.ts`, `catalog-setup.service.spec.ts`) cover the scope refactor.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test`.
- **Docs to update:** `../modules/rbac.md` (permission key list); `../GUIDES.md` seeding section (add the `sync:permissions` command).

> **🧑 HUMAN CHECKPOINT — security and permissions**: confirm the new permission keys and their names (`audit.view`, `hotels.edit_tax`, `bookings.view`, `bookings.create`, `bookings.manage`), and the default grants for the existing Manager and Editor roles (proposal in [4.1](#41-security-and-permissions-per-endpoint)). Also settle the naming differences listed in [1.5](#15-known-differences-with-the-other-new-plan-documents). Approved = the human accepts the key list and the role matrix, or edits it. The script runs against the dev DB only.

### P1-T02 — Rooms summary endpoint with health badges

- **Goal:** one request returns everything the Rooms & rates table shows, so the UI never loops over room types calling three APIs each.
- **Depends on:** P1-T01.
- **Files to create/modify:**
  - `apps/api/src/modules/hotels/room-summary.service.ts` — **create** (`RoomSummaryService`).
  - `apps/api/src/modules/hotels/room-types.controller.ts` — **modify**: new route.
  - `apps/api/src/modules/hotels/hotels.module.ts` — **modify**: add `RoomSummaryService` to `providers` (the module already registers the `Hotel`, `RoomType`, `BaseRate`, `NightInventory` models).
  - `apps/api/src/modules/hotels/room-summary.service.spec.ts` — **create**.
- **Steps:**
  1. Endpoint: `GET /api/v1/admin/hotels/:hotelId/rooms-summary`, permission `room_types.view`, scope via `:hotelId` (guard).
  2. Service `summaryForHotel(hotelId)`:
     - load the hotel (`404` if missing); `readOnly = hotel.status === 'ARCHIVED'`;
     - load **all** room types of the hotel (active and disabled), sorted by `name`;
     - load base rates for those room types in one query (`roomTypeId: { $in }`);
     - `localToday = dateInTimezone(new Date(), hotel.timezone)`; load nights for `[localToday, localToday + 365 days)` in one query with `.select('roomTypeId stayDate total blocked held confirmed')` (P2 adds `closed`);
     - per room type compute `freeTonight` (available on `localToday`, or `null` when that night is not initialized), `openNights` (nights with available > 0), `nextOpenDate` (first such night or `null`).
  3. Health (first match wins): `DISABLED` (status `DISABLED`) → `MISSING_PRICE` (no base rate) → `NO_OPEN_DATES` (`openNights === 0`) → `BOOKABLE`.
  4. Response types (export them):

     ```ts
     export interface RoomSummaryRow {
       id: string; name: string; code: string; status: 'ACTIVE' | 'DISABLED';
       maxAdults: number; maxChildren: number; totalRooms: number;
       coverPhotoUrl: string | null;          // media.find(isPrimary) ?? media[0]
       photoCount: number;
       baseRate: { amountMinorUnits: number; currency: string; version: number } | null;
       freeTonight: number | null; openNights: number; nextOpenDate: string | null;
       health: 'BOOKABLE' | 'MISSING_PRICE' | 'NO_OPEN_DATES' | 'DISABLED';
       version: number;
     }
     export interface RoomSummaryResponse { hotelId: string; localToday: string; readOnly: boolean; rows: RoomSummaryRow[] }
     ```

- **Acceptance criteria:**
  - Exactly one read each for hotel, room types, rates and nights, whatever the room count.
  - A room with no base rate shows `MISSING_PRICE`; a priced room with no available future night shows `NO_OPEN_DATES`; a disabled room shows `DISABLED` even when priced.
  - A manager scoped to another hotel gets `403`.
- **Tests:** `room-summary.service.spec.ts` with `MongoMemoryReplSet` (copy the setup of `hotel-lifecycle.integration.spec.ts`): four room types covering each health value; `freeTonight` null vs a number.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- room-summary`.
- **Docs to update:** `../API.md` (Admin room types: new endpoint); `../modules/room-types.md` (health rules); `NP/UX-PLAN.md` health badge section if present.

### P1-T03 — Enable and duplicate room type endpoints

- **Goal:** complete the room-type lifecycle: disable exists; add enable and duplicate.
- **Depends on:** P1-T01.
- **Files to create/modify:**
  - `apps/api/src/modules/hotels/dto/room-type.dto.ts` — **modify**: add `DuplicateRoomTypeDto`.
  - `apps/api/src/modules/hotels/room-type.service.ts` — **modify**: `enable()`, `duplicate()`; inject `@InjectModel(BaseRate.name)` (already in the module's `forFeature`).
  - `apps/api/src/modules/hotels/room-types.controller.ts` — **modify**: two routes.
  - `apps/api/src/modules/hotels/hotel-lifecycle.integration.spec.ts` — **modify** the `new RoomTypeService(...)` call if the constructor changes.
  - `apps/api/src/modules/hotels/room-type-lifecycle.spec.ts` — **create**.
- **Steps:**
  1. **Enable:** `POST /api/v1/admin/room-types/:id/enable`, permission `room_types.archive` (same as disable), body `StatusChangeDto` (`version`, optional `reason`).
     - Copy `disable()`: load, `assertHotelScope`, version check, already `ACTIVE` → return as-is, hotel `ARCHIVED` → `409 HOTEL_ARCHIVED`, set `status: ACTIVE`, `$inc: { version: 1 }`, audit `room_type.enable` with the reason.
  2. **Duplicate:** `POST /api/v1/admin/room-types/:id/duplicate`, permission `room_types.create`.
     - DTO:

       ```ts
       export class DuplicateRoomTypeDto {
         @IsString() @MinLength(2) @MaxLength(120) name: string;
         @IsString() @MinLength(1) @MaxLength(32) @Matches(ROOM_CODE, { message: 'code may use letters, digits and single dashes, e.g. DLX-K' }) code: string;
         @IsInt() @Min(0) @Max(10000) totalRooms: number;
         @IsBoolean() copyDescription: boolean;
         @IsBoolean() copyCapacityAndBeds: boolean;   // maxAdults, maxChildren, beds
         @IsBoolean() copyAmenities: boolean;
         @IsBoolean() copyPhotos: boolean;
         @IsBoolean() copyBaseRate: boolean;
       }
       ```

     - Load the source; `assertHotelScope` on the source's hotel; hotel not archived.
     - Build the new room in the **same hotel**: `status: ACTIVE`, `version: 0`. Without `copyCapacityAndBeds`: `maxAdults: 2`, `maxChildren: 0`, `beds: []`.
     - In one transaction: create the room type; if `copyBaseRate` and the source has a base rate, create a `BaseRate` (`version: 0`, same amount and currency); audit `room_type.duplicate` with `metadata: { sourceRoomTypeId, copied: { ...flags } }`; if a rate was created, also audit `rate.base.create` with reason `"Copied from <source code>"`.
     - **Never copy nightly inventory or daily rates.** Response: `{ roomType, baseRateCopied: boolean, inventoryCopied: false }`.
     - Duplicate code in the same hotel → the existing `mapDuplicate` gives `409 DUPLICATE` with `errors: [{ field: 'code' }]`.
- **Acceptance criteria:**
  - Enable on a disabled room → `ACTIVE`, `version + 1`, one `room_type.enable` audit entry.
  - Duplicate with all flags false creates a room with only name, code, room count and defaults; with `copyPhotos` true its media equals the source's.
  - Duplicate with an existing code → `409` and **no** base rate created (transaction rolled back).
  - Both endpoints return `403` for an out-of-scope manager.
- **Tests:** `room-type-lifecycle.spec.ts`: disable → enable round trip with a version-conflict case; duplicate with and without rate; duplicate-code rollback (count base rates before/after).
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- room-type`.
- **Docs to update:** `../API.md` catalog endpoints (`/enable`, `/duplicate`); `../modules/room-types.md` lifecycle; `../TASKS.md` §3 (new line "Enable and duplicate room types").

> **🧑 HUMAN CHECKPOINT — product decision**: confirm which fields "Duplicate" offers (proposal: description, capacity & beds, amenities, photos, base rate; never inventory or daily rates) and that enabling uses the same permission as disabling. Approved = list accepted or edited.

### P1-T04 — Hotel-scoped routes, hotel layout and redirects from old routes

- **Goal:** move every per-hotel screen under `/admin/hotels/:hotelId/...` with one shared hotel layout, and keep every old link working through redirects.
- **Depends on:** none for code; the Rooms tab shows a placeholder until P1-T07.
- **Files to create/modify:**
  - `apps/admin-web/src/features/hotels/HotelContext.tsx` — **create**: `HotelProvider`, `useHotel()`.
  - `apps/admin-web/src/features/hotels/HotelStatusActions.tsx` — **create**: Publish / Reactivate / Suspend / Archive buttons and their modals, moved out of `HotelWorkspace.tsx` (`publish`, `suspend`, `doArchive`, `BulkStatusConfirmModal`, `PublishBlockersInfo`).
  - `apps/admin-web/src/features/hotels/HotelTabsNav.tsx` — **create**: shared `Tabs` (`variant="underline"`) whose `onChange` calls `navigate`.
  - `apps/admin-web/src/pages/hotels/HotelLayout.tsx` — **create**: loads the hotel; renders `PageHeading` (eyebrow "HOTEL", title = name, description = city · time zone), `Status`, `HotelStatusActions`, `HotelSetupChecklist` (only when `status !== 'PUBLISHED'`), `HotelTabsNav`, the archived `Alert`, and `<Outlet />` inside the standard container.
  - `apps/admin-web/src/pages/hotels/tabs/HotelDetailsTab.tsx` — **create**: the details form and "Save details" (the `activeTab === 'hotel'` form block of `HotelWorkspace.tsx`, without photos).
  - `apps/admin-web/src/pages/hotels/tabs/HotelPhotosTab.tsx` — **create**: `HotelMediaGalleryManager` + "Save photos" (separate save, Appendix B quick win).
  - `apps/admin-web/src/pages/hotels/tabs/HotelRoomsTab.tsx` — **create**: placeholder rendering the existing `HotelRoomsList` until P1-T07.
  - `apps/admin-web/src/pages/hotels/tabs/HotelInventoryTab.tsx` — **create**: **interim** page stacking the existing `HotelRatesTab` and `HotelAvailabilityTab` (P2 replaces it with the grid).
  - `apps/admin-web/src/pages/hotels/tabs/HotelPoliciesTab.tsx` — **create**: `CancellationPolicyFields` form + "Save cancellation policy".
  - `apps/admin-web/src/routes/legacy-redirects.tsx` — **create**: redirect components.
  - `apps/admin-web/src/routes/AppRoutes.tsx`, `apps/admin-web/src/routes/route-config.ts` — **modify**.
  - `apps/admin-web/src/features/hotels/HotelSetupChecklist.tsx` — **modify**: `onSelect(step)` navigates (map below).
  - Links to update: `pages/hotels/HotelCreatePage.tsx:14`, `pages/hotels/components/HotelDetailsModal.tsx:21`, the "Manage" buttons in `pages/hotels/HotelsPage.tsx` and `pages/hotels/components/HotelCardGrid.tsx`, `features/inventory/HotelAvailabilityTab.tsx:162`, `features/hotels/workspace/HotelRoomsSection.tsx:110`, quick actions in `pages/dashboard/DashboardPage.tsx`.
- **Steps:**
  1. **Route table** (nested under one layout route):

     ```tsx
     <Route path="/admin/hotels/:hotelId" element={<PermissionRoute staff={staff} path="/admin/hotels/:hotelId"><HotelLayout staff={staff} /></PermissionRoute>}>
       <Route index element={<HotelIndexRedirect />} />  {/* DRAFT → details, otherwise rooms (P3 changes this to overview) */}
       <Route path="details" element={<HotelDetailsTab />} />
       <Route path="photos" element={<HotelPhotosTab />} />
       <Route path="rooms" element={<HotelRoomsTab />} />
       <Route path="inventory" element={<HotelInventoryTab />} />
       <Route path="policies" element={<HotelPoliciesTab />} />
     </Route>
     ```

     - `routePermissions`: add `'/admin/hotels/:hotelId': 'hotels.view'`; keep `/admin/hotels` and `/admin/hotels/new`.
     - Declare `/admin/hotels/new` before `/admin/hotels/:hotelId`.
  2. **`HotelContext` value:** `{ hotel, hotelId, reloadHotel(), readiness, reloadReadiness(), readOnly, setDirty(key: string, dirty: boolean) }`. `HotelLayout` loads the hotel with `useApiQuery(..., [hotelId], { tags: ['hotels', \`hotel:${hotelId}\`] })` and the readiness with `getHotelReadiness`. Tabs read from `useHotel()` and never refetch the hotel themselves.
  3. **Tabs** (labels in order): `Details`, `Photos`, `Rooms & rates`, `Inventory`, `Policies`. Not shown in P1: `Overview`, `Tax & billing` (P3), `Bookings` (P4/P6). Active tab = last path segment.
  4. **Checklist step → route:** `hotel → details`, `rooms → rooms`, `rates → inventory`, `availability → inventory`, `cancellation → policies`. Server step keys stay unchanged.
  5. **Unsaved changes:** each form tab calls `setDirty('<tab>', true|false)`. Leaving a dirty tab through the tab bar opens the "Discard unsaved changes?" `ConfirmDialog` (move that logic from `HotelWorkspace.tsx`); keep the `beforeunload` warning. P1-T05 connects the switcher to the same state.
  6. **Redirects** (`legacy-redirects.tsx`, all with `replace`):
     - `/admin/hotels/:hotelId/edit?tab=X` → `hotel` or none → `details`; `rooms` → `rooms`; `rates` → `inventory`; `availability` → `inventory`; `policy` or `cancellation` → `policies`; unknown → `details`.
     - `/admin/room-types?hotel=:id` → `/admin/hotels/:id/rooms`; `/admin/room-types/new?hotel=:id` → `/admin/hotels/:id/rooms?new=1`.
     - `/admin/room-types/:roomTypeId/edit` → call `getRoomType(roomTypeId)`, then `/admin/hotels/<room.hotelId>/rooms?room=<roomTypeId>&panel=details` (show `Loader` while loading; on error show `AccessPage kind="not-found"`).
     - `/admin/rates` and `/admin/inventory` (optional `?hotel=:id&room=…`) → `/admin/hotels/:id/inventory` (keep `room` as a query param).
     - Any of the above **without** a hotel ID → last-used hotel (`getLastHotelId()` from P1-T05; until P1-T05 exists, go to `/admin/hotels`); if none → `/admin/hotels` with `toast.info('Choose a hotel first.')`.
  7. Remove the routes for `RoomTypesPage`, `RoomTypeCreatePage`, `RoomTypeEditPage`, `InventoryPage`, `RatesPage`, `HotelEditPage`, `HotelDetailPage` from `AppRoutes.tsx`; **keep the files** (deletion candidates). `HotelWorkspace.tsx` stays unrouted (deletion candidate after P1 sign-off).
- **Acceptance criteria:**
  - Every redirect in step 6 lands on the right URL (type each into the browser).
  - Reloading any new URL shows the same tab; back/forward moves between tabs.
  - Details and Photos save independently; each shows "You have unsaved changes" and blocks tab switching with the dialog.
  - Publish / Suspend / Archive still work from the layout header; the archived read-only `Alert` still shows.
  - No route in `AppRoutes.tsx` renders a page that asks the user to pick a hotel.
- **Tests:** manual (there is no frontend test runner). Write the redirect table and results into `.agent/work/<task-id>/verify.md`.
- **Verification:** `cd apps/admin-web && npx tsc -b`; manual browser check with `npm run dev`.
- **Docs to update:** `NP/UX-PLAN.md`, `NP/MIGRATION-PLAN.md` (route map, if present); `apps/admin-web/docs/ui-decisions.md` §1 and §6; `../TASKS.md` §3 (new line "Hotel-scoped admin routes with redirects"); `../guidelines/frontend-ui.md` "Admin console navigation".

> **🧑 HUMAN CHECKPOINT — route change with redirects**: before the old routes are removed, the human opens every old URL from the redirect table in `verify.md` (including bookmarks with `?tab=` values) and confirms none 404. Also confirm the index rule (draft → Details, otherwise → Rooms & rates). Approved = every old URL lands on the intended tab and the human OKs removing the old routes.

### P1-T05 — Global hotel switcher, hotel scope from the URL, unsaved-changes guard

- **Goal:** one switcher in the top bar that follows the baseline rules: the URL is the source of truth, hidden for a single hotel, searchable with recent hotels, "All hotels" only on top-level pages, confirmation when edits are unsaved.
- **Depends on:** P1-T04.
- **Files to create/modify:**
  - `apps/admin-web/src/features/hotel-scope/hotel-scope-storage.ts` — **create**: `getLastHotelId(staffId)`, `setLastHotelId(staffId, id)`, `getRecentHotels(staffId)`, `pushRecentHotel(staffId, { id, name, city })` (max 5; every `localStorage` call in `try/catch`; keys `staywise-admin-last-hotel:<staffId>`, `staywise-admin-recent-hotels:<staffId>`).
  - `apps/admin-web/src/features/hotel-scope/useHotelScope.ts` — **create**: returns `{ mode: 'hotel' | 'portfolio' | 'other', hotelId: string | null }` from the URL.
  - `apps/admin-web/src/features/navigation/UnsavedChangesContext.tsx` — **create**: `UnsavedChangesProvider`, `useUnsavedChanges()` → `{ isDirty, setDirty(key, dirty), confirmThen(action) }`; renders one `ConfirmDialog` ("Discard unsaved changes?", confirm "Discard changes", cancel "Keep editing", `variant="danger"`, `icon="warning"`).
  - `apps/admin-web/src/features/hotel-scope/HotelSwitcher.tsx` — **create**.
  - `apps/admin-web/src/layout/Topbar.tsx` — **modify**: render `<HotelSwitcher staff={staff} />` left of the search box.
  - `apps/admin-web/src/layout/AppLayout.tsx` — **modify**: wrap the layout in `UnsavedChangesProvider` (it is inside `BrowserRouter`).
  - `apps/admin-web/src/features/hotels/HotelContext.tsx` — **modify**: `setDirty` delegates to `useUnsavedChanges().setDirty`; the tab-bar dialog from P1-T04 now uses `confirmThen`.
  - `apps/admin-web/src/routes/legacy-redirects.tsx` — **modify**: use `getLastHotelId`.
- **Steps:**
  1. **Scope from the URL** (`useHotelScope`):
     - `/admin/hotels/:hotelId/*` (not `/admin/hotels/new`) → `mode: 'hotel'`, `hotelId` from the path;
     - `/admin/bookings`, `/admin/today`, `/admin/reports` → `mode: 'portfolio'`, `hotelId` from `?hotelId=` (missing = "All hotels");
     - everything else → `mode: 'other'`, `hotelId: null`.
  2. **Single hotel:** on mount call `listHotels({ limit: 1 })` (existing; excludes archived). `total === 1` → static label (building icon + hotel name, no button). `total === 0` → render nothing.
  3. **Multi-hotel button:** label = current hotel name (`hotel`), "All hotels" (`portfolio` without `hotelId`) or "Choose a hotel" (`other`). It opens a popover with the shared `Combobox`:
     - empty search → "Recent" options from storage, then the first 20 hotels from `listHotels({ limit: 20 })`;
     - typing → `listHotels({ search, limit: 20 })` debounced 250 ms (`hooks/useDebouncedValue.ts`);
     - option label = `name`, description = `city · status`;
     - "All hotels" is the first option **only** when `mode === 'portfolio'`.
  4. **On select** (wrapped in `confirmThen` so unsaved edits ask first):
     - `hotel` → replace the hotel ID in the path and keep the tab (`/admin/hotels/A/rooms` → `/admin/hotels/B/rooms`); deeper paths (`bookings/:bookingId`, `bookings/new`) go to `/admin/hotels/B/bookings`; drop query params;
     - `portfolio` → set or remove `?hotelId=` on the same page;
     - `other` → navigate to `/admin/hotels/B` (layout index);
     - then `setLastHotelId` and `pushRecentHotel`. Also call both whenever `HotelLayout` loads a hotel (so the URL drives "last used").
  5. **Accessibility:** button with `aria-haspopup="listbox"` and `aria-expanded`; `Esc` closes and returns focus to the button.
  6. **Phone (<768px):** the name is truncated (`max-w-[140px] truncate`); the popover is full width under the top bar.
- **Acceptance criteria:**
  - Opening `/admin/hotels/B/rooms` directly shows B even if A was last used (URL wins).
  - A staff member with one hotel sees a static name and no dropdown.
  - "All hotels" never appears on a `/admin/hotels/:hotelId/...` page.
  - With unsaved Details edits, choosing another hotel opens the discard dialog; "Keep editing" stays, "Discard changes" navigates.
  - Recent hotels survive a reload; a private window (storage blocked) works without errors.
- **Tests:** manual: the five criteria with a super admin (several hotels) and a test manager scoped to one hotel (`apps/api/src/scripts/verify-scenarios.ts` shows how test roles and memberships are created).
- **Verification:** `cd apps/admin-web && npx tsc -b`; manual browser check.
- **Docs to update:** `NP/UX-PLAN.md`, `NP/UI-PLAN.md` switcher sections (if present); `apps/admin-web/docs/components.md` (HotelSwitcher, UnsavedChangesContext); `apps/admin-web/docs/ui-decisions.md` (new "Hotel scope" section).

> **🧑 HUMAN CHECKPOINT — navigation behaviour and visual sign-off**: the human tries the switcher as a multi-hotel super admin and as a single-hotel manager, on a hotel tab, on `/admin/hotels`, and with unsaved edits. Approved = behaviour matches the baseline switcher rules and the look matches the top bar.

### P1-T06 — Status component fix and room health badge

- **Goal:** active room types stop showing an amber "draft" pill; health shows icon + text, never colour alone.
- **Depends on:** P1-T02 (health values).
- **Files to create/modify:**
  - `apps/admin-web/src/components/ui/Status.tsx` — **modify**.
  - `apps/admin-web/src/features/rooms/RoomHealthBadge.tsx` — **create**.
  - `apps/admin-web/src/pages/catalog/views/RoomTypesView.tsx:48` — **modify**: `variant="dot"` (only if the file is still routed).
- **Steps:**
  1. In `pillConfig` add `ACTIVE` (colours and `CheckCircle2` icon as `PUBLISHED`) and `DISABLED` (colours as `ARCHIVED`, icon `Ban`). Change the fallback to a neutral slate style with no icon (today it falls back to `DRAFT`).
  2. Add `capitalize` to the pill label class (audit R10), so pills read "Published", "Needs setup".
  3. `RoomHealthBadge` props `{ health: RoomSummaryRow['health']; compact?: boolean }`:
     - `BOOKABLE` → quiet grey text "Bookable" with a small `CheckCircle2` (quiet so problems stand out);
     - `MISSING_PRICE` → amber `AlertCircle` + "Missing price";
     - `NO_OPEN_DATES` → amber `CalendarX` + "No open dates";
     - `DISABLED` → slate `Ban` + "Disabled";
     - icons `aria-hidden`; text always rendered (in `compact` the text is `sr-only` and the badge has a `title`).
- **Acceptance criteria:**
  - Active rooms show green "Active", disabled rooms grey "Disabled", in every list that uses `Status`.
  - Nothing renders amber unless the status is `DRAFT` or `NEEDS_SETUP` or the health is a problem.
- **Tests:** manual visual check: hotels list, room list, badge in four states.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md` (Status values, RoomHealthBadge); `../ANALYSIS.md` theme audit status note (RT5, R10 fixed).

> **🧑 HUMAN CHECKPOINT — visual design sign-off (shared component change)**: `Status` is shared; the human reviews screenshots of hotel pills, room dots and the four health badges. Approved = colours, icons and wording accepted.

### P1-T07 — Rooms & rates table

- **Goal:** `/admin/hotels/:hotelId/rooms` shows one row per room type with photo, name/code, capacity, rooms, price, free tonight and health, with the fix action next to each problem.
- **Depends on:** P1-T02, P1-T04, P1-T06.
- **Files to create/modify:**
  - `apps/admin-web/src/features/rooms/rooms.api.ts` — **modify**: `getRoomsSummary(hotelId, signal)`, `enableRoomType(id, version, reason?)`, `duplicateRoomType(id, body)`; export the `RoomSummaryRow` type (a copy of the API type).
  - `apps/admin-web/src/features/rooms/RoomsRatesTable.tsx` — **create**.
  - `apps/admin-web/src/features/rooms/RoomRowActions.tsx` — **create** (row menu).
  - `apps/admin-web/src/pages/hotels/tabs/HotelRoomsTab.tsx` — **modify**: replace the placeholder.
- **Steps:**
  1. Load with `useApiQuery((s) => getRoomsSummary(hotelId, s), [hotelId], { tags: ['rooms-summary'] })`.
  2. `DataTable<RoomSummaryRow>` columns:
     - **Photo:** 40×40 `rounded-lg object-cover` from `resolveImageUrl(coverPhotoUrl)`, else a `bg-brand-pale` `BedDouble` icon;
     - **Room:** name (`text-sm font-semibold`) + code (`font-mono text-slate-400`);
     - **Guests:** `2+1` with `title="Up to 2 adults and 1 child"`;
     - **Rooms:** `totalRooms`;
     - **Price / night:** `formatMoney(baseRate.amountMinorUnits, baseRate.currency)` or "—";
     - **Tonight:** `freeTonight` → "4 free", `0` → "Sold out", `null` → "Not open";
     - **Status:** `RoomHealthBadge`;
     - **Actions** (right): `MISSING_PRICE` → `Button size="sm" variant="secondary"` "Set price" (panel on Price); `NO_OPEN_DATES` → "Open dates" (panel on Availability); then `RoomRowActions`: Edit · Photos · Price · Availability · Duplicate · Disable/Enable, each gated with `Can`.
  3. `onRowClick` opens the side panel (P1-T08) on Details. Panel state lives in the URL: `?room=<id>&panel=details|photos|price|availability`; `?new=1` opens the create panel.
  4. Toolbar (`toolbarHeader`): `Tabs variant="pills" size="sm"` "Active (n)" / "All (n)" (client-side filter) and `Button variant="secondary" size="sm"` "Add room type" (`room_types.create`, hidden when `readOnly`).
  5. Empty: `EmptyState` "No room types yet" with the Add button.
  6. Phone (<640px): `renderBody` shows cards (photo, name, price, tonight, badge, actions).
- **Acceptance criteria:**
  - Correct values for a hotel with 3 room types in different health states.
  - "Set price" / "Open dates" open the panel on the right tab; the URL updates and reload reopens it.
  - Archived hotel: no add/edit/disable buttons; rows still open the panel read-only.
  - One `rooms-summary` call per load (Network tab).
- **Tests:** manual against seeded data; screenshots in `verify.md`.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `NP/UI-PLAN.md` Rooms & rates screen (if present); `../TASKS.md` §3 (new line "Rooms & rates table with health badges").

### P1-T08 — Room side panel with Details / Photos / Price / Availability

- **Goal:** edit everything about one room in one drawer next to the table.
- **Depends on:** P1-T07.
- **Files to create/modify:**
  - `apps/admin-web/src/features/rooms/RoomSidePanel.tsx` — **create**: `Modal variant="drawer" size="wide"`, title = room name or "Add room type", shared `Tabs` with 4 items.
  - `apps/admin-web/src/features/rooms/panel/RoomDetailsPanel.tsx` — **create**: `RoomTypeFields` (`features/rooms/RoomTypeFields.tsx`) in a form; create → `createRoomType`, edit → `updateRoomType` with `version`; when `totalRooms` changes, show a required `ReasonField` (same rule as `features/rooms/RoomTypeForm.tsx`).
  - `apps/admin-web/src/features/rooms/panel/RoomPhotosPanel.tsx` — **create**: move the body of `features/rooms/RoomMediaModal.tsx` into this component; `RoomMediaModal` renders it inside its `Modal` so old callers keep working.
  - `apps/admin-web/src/features/rates/BaseRateForm.tsx` — **create**: the base-rate form extracted from `features/rates/HotelRatesTab.tsx` (`MoneyInput`, currency `Select`, `ReasonField`, `setBaseRate` with `version`); `HotelRatesTab` uses it too (audit RA7).
  - `apps/admin-web/src/features/rooms/panel/RoomPricePanel.tsx` — **create**: `BaseRateForm` for this room.
  - `apps/admin-web/src/features/rooms/panel/RoomAvailabilityPanel.tsx` — **create**: next 30 nights for this room (`getInventoryRange`), "Open dates" (`initializeInventory` with two `DatePicker`s, default today → +90 days), link "Open the inventory grid" → `/admin/hotels/:hotelId/inventory?room=<id>`.
- **Steps:**
  1. Panel props: `{ hotelId: string; roomId: string | null; initialTab: 'details' | 'photos' | 'price' | 'availability'; readOnly: boolean; onClose(): void; onChanged(): void }`.
  2. Create mode (`roomId === null`): only Details is enabled (`TabItem.disabled` on the others); after creating, change the URL to `?room=<newId>&panel=photos`.
  3. Each tab has its own Save and registers `useUnsavedChanges().setDirty('room-panel-<tab>', …)`; switching tabs or closing while dirty opens the discard dialog.
  4. After any save: `toast.success(...)`, `invalidate('rooms-summary', 'readiness')`, `onChanged()`.
  5. `VERSION_CONFLICT` → `handleFormError(..., { onConflict })` showing "This room was changed in another session. Reload to see the latest version." with a "Reload" button that refetches the room.
- **Acceptance criteria:**
  - Creating a room in the panel adds a table row without a page reload.
  - Changing the room count without a reason shows a field error and makes no API call.
  - ₹3,500 saved is stored as `350000` and shown in the table as ₹3,500.00.
  - Opening dates in the Availability tab turns a priced `NO_OPEN_DATES` row into `BOOKABLE`.
  - Esc closes the panel unless dirty; focus returns to the row that opened it.
- **Tests:** manual end to end: add room → photos → price → open dates → row becomes Bookable; record in `verify.md`.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md` (RoomSidePanel, BaseRateForm); `../TASKS.md` §3.

### P1-T09 — Disable, enable and duplicate in the UI

- **Goal:** the room lifecycle works from the table.
- **Depends on:** P1-T03, P1-T07.
- **Files to create/modify:**
  - `apps/admin-web/src/features/rooms/RoomStatusDialog.tsx` — **create**: `Modal variant="dialog" size="small"` with `ReasonField` (required for disable, optional for enable).
  - `apps/admin-web/src/features/rooms/RoomDuplicateDialog.tsx` — **create**.
  - `apps/admin-web/src/features/rooms/RoomRowActions.tsx` — **modify**: wire the actions.
- **Steps:**
  1. **Disable:** title "Disable <name>?", message "Guests can no longer book this room type. Its dates and prices are kept, and you can enable it again." Footer: Cancel (`outline sm`), "Disable room type" (`danger sm`). Calls `disableRoomType(id, version, reason)`.
  2. **Enable:** "Enable <name>?", button "Enable room type" (`primary sm`).
  3. **Duplicate:** fields `name` (default "<name> (copy)"), `code` (empty, required, same pattern as `RoomTypeFields`), `totalRooms` (default = source), checkboxes for the copy flags (all checked except photos). Note under the form: "Prices for specific dates and open dates are not copied. Open dates for the new room after creating it." On success open the new room's panel on Availability.
  4. After each action: toast, `invalidate('rooms-summary', 'readiness')`.
- **Acceptance criteria:**
  - Disable without a reason is blocked in the UI.
  - A taken code shows the error on the code field (`errors[].field === 'code'`).
  - Buttons hidden without `room_types.archive` / `room_types.create`.
- **Tests:** manual; API behaviour covered by P1-T03 tests.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `../ANALYSIS.md` Room types Appendix A status (problems 3–5 fixed).

> **🧑 HUMAN CHECKPOINT — copy and wording**: review the disable / enable / duplicate texts and button labels. Approved = wording accepted.

### P1-T10 — Audit log API (list and filter)

- **Goal:** a read API over `audit_logs` that respects hotel scope.
- **Depends on:** P1-T01.
- **Files to create/modify:**
  - `apps/api/src/modules/audit/dto/audit-query.dto.ts` — **create**.
  - `apps/api/src/modules/audit/audit.controller.ts` — **create**.
  - `apps/api/src/modules/audit/audit-query.service.ts` — **create** (keep `AuditService` write-only).
  - `apps/api/src/modules/audit/audit.module.ts` — **modify**: import `AuthModule`; add `User` (`modules/auth/schemas/user.schema.ts`) and `Hotel` models to `forFeature`; register controller and service.
  - `apps/api/src/modules/audit/schemas/audit-log.schema.ts` — **modify**: add index `{ hotelId: 1, resourceType: 1, createdAt: -1 }` named `audit_hotel_resource_time`.
  - `apps/api/src/modules/audit/audit-query.service.spec.ts` — **create**.
- **Steps:**
  1. Check that `AuthModule` does not import `AuditModule` (it relies on the global module). If importing `AuthModule` creates a cycle, use `forwardRef(() => AuthModule)` and say so in the report.
  2. `GET /api/v1/admin/audit`, permission `audit.view`. Query DTO, all optional:
     - `hotelId` (`@IsMongoId()`);
     - `resourceType` (`@IsIn(['HOTEL','ROOM_TYPE','BASE_RATE','NIGHT_INVENTORY','DAILY_RATE','HOLD','BOOKING','STAFF'])`);
     - `resourceId` (`@IsString() @MaxLength(64)`);
     - `action` (prefix, `@Matches(/^[a-z_.]{1,60}$/)`);
     - `actorId` (`@IsMongoId()`);
     - `from`, `to` (`YYYY-MM-DD`, UTC; `from` inclusive, `to` exclusive);
     - `limit` (`@IsInt() @Min(1) @Max(100)`, default 25), `offset` (`@IsInt() @Min(0)`, default 0).
  3. Scope:
     - super admin: any `hotelId`, including entries with no hotel;
     - others: a given `hotelId` must be in `actor.hotelIds` (else `403 FORBIDDEN`); with no `hotelId`, filter `hotelId: { $in: actor.hotelIds }` (entries without a hotel are never shown).
  4. Query sorted `createdAt: -1` with `countDocuments` for `total`; `action` uses an anchored, escaped regex (`escapeRegex` from `hotel.policies.ts`).
  5. Enrich with two extra queries: actor emails (`User.find({ _id: { $in } }).select('normalizedEmail')`) and hotel names (`Hotel.find({ _id: { $in } }).select('name')`).
  6. Response: `{ items: [{ id, createdAt, action, resourceType, resourceId, hotelId, hotelName, actorId, actorEmail, actorType, outcome, reason, metadata }], total, limit, offset }`. Never return `ipAddressPrefix` or `userAgent`.
- **Acceptance criteria:**
  - A manager of hotel A never sees hotel B entries, with or without `hotelId`.
  - Filters combine with AND; `limit=101` → `400`.
  - Every query has a `limit`.
- **Tests:** `audit-query.service.spec.ts` (in-memory replica set): entries for two hotels and one without a hotel; super admin vs manager results, prefix filter, date range, pagination.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- audit-query`.
- **Docs to update:** `../API.md` (new "Admin audit" section); `../modules/audit-logging.md` (read API, scope rules); `../TASKS.md` §0/§1 audit line.

> **🧑 HUMAN CHECKPOINT — security and privacy**: confirm who may read audit logs (super admin all; managers only their hotels?) and that showing `metadata` (before/after values, reasons) is acceptable. Approved = scope rule and visible fields accepted.

### P1-T11 — Audit page `/admin/audit` and per-record history links

- **Goal:** staff can answer "who changed this price?".
- **Depends on:** P1-T10, P1-T05.
- **Files to create/modify:**
  - `apps/admin-web/src/features/audit/audit.api.ts` — **create**: `listAudit(params, signal)`.
  - `apps/admin-web/src/features/audit/audit-labels.ts` — **create**: action → human label map.
  - `apps/admin-web/src/features/audit/AuditFiltersBar.tsx` — **create**.
  - `apps/admin-web/src/features/audit/AuditEntryDetails.tsx` — **create**: drawer with before/after.
  - `apps/admin-web/src/pages/audit/AuditPage.tsx` — **create**.
  - `apps/admin-web/src/routes/AppRoutes.tsx`, `apps/admin-web/src/routes/route-config.ts` — **modify**: route `/admin/audit` (`audit.view`).
  - `apps/admin-web/src/features/rooms/RoomSidePanel.tsx` — **modify**: "History" link in the header → `/admin/audit?hotelId=<hotelId>&resourceId=<roomId>`.
- **Steps:**
  1. Filters (kept in the URL query): Hotel (`Combobox` of accessible hotels; "All hotels" for super admin), Area (`Select`: All, Hotel, Room types, Prices, Availability, Bookings → `resourceType`), Action (`Input`, prefix), From / To (`DatePicker`), "Clear filters".
  2. `DataTable` columns: When (`Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })`), Who (`actorEmail` or "System"), Hotel, What (label from `audit-labels.ts`, e.g. `room_type.disable` → "Disabled room type"; unknown → raw key), Record (type + short id), Reason. 25 per page with `pagination`.
  3. Row click → `AuditEntryDetails`: "Before / After" for changed keys only (shallow compare of `metadata.before` and `metadata.after`; keys ending in `MinorUnits` shown with `formatMoney`); other metadata as key/value rows.
- **Acceptance criteria:**
  - Changing a base rate in the side panel creates an entry at the top of `/admin/audit` with old and new price in rupees.
  - The History link opens the page filtered to that room.
  - Without `audit.view`, the nav item is hidden and the route shows the access page.
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `../guidelines/frontend-ui.md` "Audit log"; `../TASKS.md`.

### P1-T12 — Navigation update

- **Goal:** the sidebar matches the new structure.
- **Depends on:** P1-T04, P1-T11.
- **Files to create/modify:** `apps/admin-web/src/routes/route-config.ts`; `apps/admin-web/src/layout/Sidebar.tsx` (only if it hard-codes items).
- **Steps:**
  1. `navGroups`: "Properties" → Hotels (`/admin/hotels`); "Settings" → Audit log (`/admin/audit`, `audit.view`). Remove "Room types", "Availability", "Base rates".
  2. When `useHotelScope().mode === 'hotel'`, show a "This hotel" group with Rooms & rates, Inventory and Policies links for the current `hotelId`.
  3. `homePath()` still returns the first permitted item.
- **Acceptance criteria:** no sidebar link leads to a hotel picker page; the active item highlights on hotel tabs.
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `../guidelines/frontend-ui.md` "Admin console navigation"; `apps/admin-web/docs/ui-decisions.md` §1.

### P1-T13 — UI theme quick wins

- **Goal:** apply the "Quick wins" of `../ANALYSIS.md#ui-theme-consistency-audit` → "Recommended fix plan" (no new components, no token changes).
- **Depends on:** P1-T04 (some pages move).
- **Files to create/modify** (line numbers from the audit; re-check before editing):
  - `apps/admin-web/src/pages/hotels/HotelsPage.tsx` — R1 (`PageHeading` with `action`), R2 (`Button variant="primary" size="md" leftIcon={<Plus size={16} />}` for both "Add a hotel" buttons), R3 (remove `className` overrides on Import / Manage), R4 (`bg-brand-pale text-brand-primary` thumbnail).
  - `apps/admin-web/src/pages/dashboard/DashboardPage.tsx` — D1 (`PageHeading`), D3 (`Button variant="ghost"|"outline" size="sm"`), D5 (`rounded-2xl p-6`), D6 (metric tones as `HotelSummaryCards`), D7 (`Button` instead of `AsyncButton`). D2/D4 need new components and are **out of scope**.
  - `apps/admin-web/src/features/rates/HotelRatesTab.tsx` — RA1/RA2 (standard container, not amber), X3 ("Set base rate").
  - `apps/admin-web/src/features/hotels/PhotoModal.tsx` — R6 (`Tabs variant="pills" size="sm"` for the source toggle), R8 (Cancel `outline sm` in the `Modal` `footer`).
  - `apps/admin-web/src/pages/hotels/components/BulkStatusConfirmModal.tsx` — R8, and `Field` for the reason label.
  - `apps/admin-web/src/pages/hotels/components/HotelBulkActionsBar.tsx:46` — "Publish selected".
  - `apps/admin-web/src/components/ui/ErrorBoundary.tsx:70` — "Try again".
  - `apps/admin-web/src/layout/Topbar.tsx`, `apps/admin-web/src/layout/Sidebar.tsx` — raw hex → brand tokens (S1–S3).
  - `apps/admin-web/src/App.tsx` — boot screen: replace the unstyled `boot-screen` markup with a centred `Loader` (A4).
  - `apps/admin-web/src/pages/catalog/components/InventoryAdjustModal.tsx` — **skip** (unrouted after P1-T04; P2 replaces it). Record the skip.
- **Steps:** one change per bullet; look at the page in the browser after each.
- **Acceptance criteria:**
  - `grep -rn "bg-\[#164e3f\]" apps/admin-web/src` returns nothing.
  - `grep -rn "AsyncButton" apps/admin-web/src/pages` returns nothing.
  - Every touched page uses `PageHeading`.
- **Tests:** manual before/after screenshots per page in `verify.md`.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `../ANALYSIS.md` theme audit ("Status update" listing fixed IDs); `apps/admin-web/docs/ui-decisions.md` §2 (canvas colour is `#eef5f0`, R13) and §4 (modal footer convention).

> **🧑 HUMAN CHECKPOINT — visual design sign-off**: the human compares before/after screenshots of the Hotels list, Dashboard, rate card, photo modal, status modal and top bar. Approved = all accepted or a short list of changes.

### P1-T14 — P1 exit review

- **Goal:** prove P1 is complete before P2 starts.
- **Depends on:** P1-T01 … P1-T13.
- **Files to create/modify:** docs only (`../TASKS.md`, `../API.md`).
- **Steps:**
  1. Run all verification commands; compare the test count with the P1 start.
  2. Walk through: create hotel → add a room in the panel → price → open dates → publish → switch hotel → duplicate room → disable / enable → read the audit log.
  3. As a manager scoped to hotel A, open hotel B URLs and call B's APIs: every call returns `403`, the UI shows the access page.
  4. Mark P1 rows in [4.1](#41-security-and-permissions-per-endpoint) as verified.
- **Acceptance criteria:** all P1 exit criteria met.
- **Tests:** full suite.
- **Verification:** all three commands.
- **Docs to update:** `../TASKS.md` (tick P1 lines with evidence), `../API.md` statuses.

> **🧑 HUMAN CHECKPOINT — phase gate (security, accessibility, design)**: the human repeats the walkthrough, including the scoped-manager check and a keyboard-only pass over the switcher, table and side panel. Approved = P1 accepted; P2 may start.

---

<a id="p2"></a>

## P2 — Inventory & rates grid

- **Goal:** one room type × date grid per hotel where staff select ranges and change price (daily rates), open/close (stop-sell), minimum stay, booking cut-off and blocked rooms in bulk, with zero/suspicious-rate checks and an audit entry for every change. It replaces the separate Rates and Availability screens.
- **Entry criteria:** P1 exit checkpoint approved.
- **Exit criteria:**
  - `DailyRate` collection and `NightInventory` restriction fields exist, with indexes, and are documented.
  - Effective price = `DailyRate ?? BaseRate` everywhere a price is shown or calculated (one shared resolver).
  - The grid works with mouse, keyboard and on a phone, without drag.
  - Every bulk change is atomic (all cells or none) and audited per room type.
  - Readiness and room health use `closed` and effective prices.
  - Concurrency and accessibility checkpoints approved.

### P2-T01 — `NightInventory` restriction fields

- **Goal:** store stop-sell, minimum stay and booking cut-off per room type and night.
- **Depends on:** P1 done.
- **Files to create/modify:**
  - `apps/api/src/modules/inventory/schemas/night-inventory.schema.ts` — **modify**.
  - `apps/api/src/modules/inventory/inventory.service.ts` — **modify**: `InventoryCalendarResponse` night shape and `getCalendar` mapping; `initialize` sets the new defaults.
  - `apps/admin-web/src/features/inventory/inventory.api.ts`, `apps/admin-web/src/api.ts` (`InventoryDay`) — **modify**: add the fields to the types.
- **Steps:**
  1. Add:

     ```ts
     @Prop({ required: true, default: false }) closed: boolean;              // stop-sell: no new holds for this night
     @Prop({ type: Number, min: 1, max: 30, default: null }) minStay: number | null;     // applies when this night is the check-in night
     @Prop({ type: Number, min: 0, max: 365, default: null }) cutoffDays: number | null; // check-in must be ≥ N days after hotel-local today
     ```

  2. **No backfill migration:** existing documents have no `closed` field. Every query that means "open" must use `closed: { $ne: true }` (never `closed: false`). Mapping code reads `record.closed === true`, `record.minStay ?? null`, `record.cutoffDays ?? null`.
  3. Add index `{ roomTypeId: 1, closed: 1, stayDate: 1 }` named `night_inventory_room_closed_date` (used by search in P5).
  4. Calendar night response adds `closed`, `minStay`, `cutoffDays`.
- **Acceptance criteria:**
  - Old documents (without the fields) read as `closed: false`, `minStay: null`, `cutoffDays: null`.
  - New nights from `initialize` have the defaults.
  - `grep -rn "closed: false" apps/api/src --include=*.ts` finds no query filters (only schema/defaults).
- **Tests:** extend `apps/api/src/modules/inventory/inventory.service.spec.ts`: insert a raw document without `closed` via `inventoryModel.collection.insertOne(...)`, read through `getCalendar`, expect `closed: false`.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- inventory`.
- **Docs to update:** `../DATA_MODEL.md` (NightInventory fields and rule "missing = open"); `NP/DATA-MODEL.md` (if present); `../modules/bookings.md` restrictions semantics.

> **🧑 HUMAN CHECKPOINT — product decision (restriction meaning)**: confirm (a) `minStay` applies to the check-in night only (industry "min stay on arrival"); (b) `cutoffDays` counts whole days from hotel-local today to the check-in date, 0 = same-day booking allowed; (c) restrictions apply to staff bookings too, with no staff override in the MVP; (d) `closed` blocks every night of a stay that includes it. Approved = the four rules accepted or changed (changed rules go into `../modules/bookings.md`).

### P2-T02 — `DailyRate` collection and the effective-price resolver

- **Goal:** per room type per date price overrides, and one function every feature uses to get the price of a night.
- **Depends on:** P2-T01.
- **Files to create/modify:**
  - `apps/api/src/modules/pricing/schemas/daily-rate.schema.ts` — **create**.
  - `apps/api/src/modules/pricing/rate-resolver.service.ts` — **create** (`RateResolver`).
  - `apps/api/src/modules/pricing/pricing.module.ts` — **modify**: register `DailyRate`; provide and export `RateResolver`.
  - `apps/api/src/modules/hotels/hotels.module.ts` — **modify**: add `DailyRate` to `forFeature` if a hotels service injects it.
  - `apps/api/src/scripts/ensure-indexes.ts` — **modify**: include `DailyRate`.
  - `apps/api/src/modules/pricing/rate-resolver.service.spec.ts` — **create**.
- **Steps:**
  1. Schema (`collection: 'daily_rates'`, `timestamps: true`):

     ```ts
     roomTypeId: Types.ObjectId (required, ref RoomType)
     hotelId: Types.ObjectId (required, ref Hotel)        // denormalised for hotel-wide queries and scope checks
     stayDate: string (required, /^\d{4}-\d{2}-\d{2}$/)
     amountMinorUnits: number (required, min 0, max 9000000000000, integer)
     currency: string (required, /^[A-Z]{3}$/)
     version: number (default 0)
     ```

     Indexes: `{ roomTypeId: 1, stayDate: 1 }` unique `daily_rate_room_date_unique`; `{ hotelId: 1, stayDate: 1 }` `daily_rate_hotel_date`.
  2. `RateResolver.resolve(roomTypeIds: Types.ObjectId[], dates: string[], session?)` → `Map<string /* roomTypeId|date */, { amountMinorUnits: number; currency: string; source: 'DAILY_RATE' | 'BASE_RATE' } | null>`:
     - one query for base rates, one for daily rates (`stayDate: { $in: dates }`);
     - per key: daily rate if present, else base rate, else `null`.
     - If a daily rate's currency differs from the base rate's, throw `409 RATE_CURRENCY_MISMATCH` (prevented at write time by P2-T05, so this is a safety net).
  3. Export a helper `rateKey(roomTypeId, date)` so callers never build keys by hand.
- **Acceptance criteria:**
  - Daily rate wins over base rate; missing both → `null`.
  - Exactly two queries for any number of room types and dates.
- **Tests:** `rate-resolver.service.spec.ts`: base only, daily override on one date, no base rate, currency mismatch.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- rate-resolver`.
- **Docs to update:** `../DATA_MODEL.md` (`DailyRate`; replace the old "RatePlan / NightlyRate" line with "DailyRate (MVP) — rate plans later"); `../modules/pricing.md` (resolution rule); `NP/DATA-MODEL.md`.

> **🧑 HUMAN CHECKPOINT — data model and money**: review the `DailyRate` schema, the unique index and the rule "daily rate overrides base rate; one currency per hotel". Approved = schema accepted before any write endpoint is built.

### P2-T03 — Zero and suspicious rate validation

- **Goal:** stop bulk tools from pushing ₹0 or absurd prices by mistake.
- **Depends on:** P2-T02.
- **Files to create/modify:**
  - `apps/api/src/modules/pricing/rate-checks.ts` — **create** (pure functions).
  - `apps/api/src/modules/pricing/rate-checks.spec.ts` — **create**.
  - `apps/api/src/common/config/configuration.ts` — **modify**: `pricing: { suspiciousLowPct: number; suspiciousHighPct: number; allowZeroRates: boolean }` from env `RATE_SUSPICIOUS_LOW_PCT` (default 30), `RATE_SUSPICIOUS_HIGH_PCT` (default 300), `RATE_ALLOW_ZERO` (default `false`).
  - `apps/api/src/modules/pricing/pricing.service.ts` — **modify**: base-rate `setBaseRate` also rejects zero unless allowed.
- **Steps:**
  1. `checkRate({ amountMinorUnits, baseRateMinorUnits | null, config })` returns `{ ok: true } | { ok: false, code: 'RATE_ZERO_NOT_ALLOWED' } | { ok: false, code: 'RATE_SUSPICIOUS', reason: 'BELOW_BASE' | 'ABOVE_BASE', percentOfBase: number }`.
     - zero and `!allowZeroRates` → `RATE_ZERO_NOT_ALLOWED` (hard error, `422`);
     - with a base rate: `amount * 100 < base * lowPct` → `BELOW_BASE`; `amount * 100 > base * highPct` → `ABOVE_BASE` (integer math only);
     - no base rate → only the zero rule.
  2. Callers turn `RATE_SUSPICIOUS` into `409 RATE_SUSPICIOUS` with `details: [{ roomTypeId, roomTypeName, amountMinorUnits, baseRateMinorUnits, reason, percentOfBase }]` **unless** the request has `confirmSuspicious: true`.
- **Acceptance criteria:**
  - ₹0 is rejected by default for base and daily rates.
  - With base ₹3,000: ₹800 (26.7%) → suspicious low; ₹9,500 (316.7%) → suspicious high; ₹900 (30%) and ₹9,000 (300%) are OK (boundaries inclusive OK).
- **Tests:** `rate-checks.spec.ts` with the values above.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- rate-checks`.
- **Docs to update:** `../modules/pricing.md` (rules); `../ANALYSIS.md` pricing Question 2 (answered); `.env.example` (new variables).

> **🧑 HUMAN CHECKPOINT — money rule**: confirm (a) zero rates are never allowed in the MVP, (b) the 30% / 300% thresholds, (c) "Save anyway" (`confirmSuspicious`) is allowed for anyone with `rates.edit`. Approved = values accepted or replaced.

### P2-T04 — Inventory grid read API

- **Goal:** one call returns the full grid for a hotel and a date window.
- **Depends on:** P2-T01, P2-T02.
- **Files to create/modify:**
  - `apps/api/src/modules/inventory/dto/inventory-grid.dto.ts` — **create**: `InventoryGridQueryDto { from: string; to: string }` (same regex as `InventoryRangeDto`).
  - `apps/api/src/modules/inventory/inventory-grid.service.ts` — **create**.
  - `apps/api/src/modules/inventory/inventory-grid.controller.ts` — **create** (`@Controller('admin/hotels/:hotelId/inventory-grid')`).
  - `apps/api/src/modules/inventory/inventory.module.ts` — **modify**: import `PricingModule` (for `RateResolver`), add `Hotel`, `BaseRate`, `DailyRate` models, register the new controller/service. Check for an import cycle (`HotelsModule` imports `InventoryModule`; `InventoryModule` must **not** import `HotelsModule`).
  - `apps/api/src/modules/inventory/inventory-grid.service.spec.ts` — **create**.
- **Steps:**
  1. `GET /api/v1/admin/hotels/:hotelId/inventory-grid?from=YYYY-MM-DD&to=YYYY-MM-DD`, permission `inventory.view`. `to` exclusive; max **62** nights (`422 INVENTORY_RANGE_TOO_LONG`).
  2. Load hotel, active **and** disabled room types (disabled rows are read-only), nights in range (one query), rates via `RateResolver` (two queries).
  3. Response:

     ```ts
     interface InventoryGridResponse {
       hotelId: string; timezone: string; localToday: string; from: string; to: string;
       currency: string | null;                       // from base rates; null if none
       dates: string[];
       rows: Array<{
         roomTypeId: string; name: string; code: string; status: 'ACTIVE' | 'DISABLED'; totalRooms: number;
         baseRateMinorUnits: number | null;
         cells: Array<{
           stayDate: string; initialized: boolean;
           total: number; blocked: number; held: number; confirmed: number; available: number;
           closed: boolean; minStay: number | null; cutoffDays: number | null;
           priceMinorUnits: number | null; priceSource: 'DAILY_RATE' | 'BASE_RATE' | null;
           past: boolean;                              // stayDate < localToday
         }>;
       }>;
     }
     ```

     Uninitialized nights appear with `initialized: false` and zeros.
- **Acceptance criteria:** response has `rows.length × dates.length` cells, in date order; 63-night range → `422`; out-of-scope hotel → `403`.
- **Tests:** `inventory-grid.service.spec.ts`: two room types, a daily override, an uninitialized night, a closed night.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- inventory-grid`.
- **Docs to update:** `../API.md` (new endpoint); `../modules/bookings.md` or `NP/DATA-MODEL.md` (grid read model).

### P2-T05 — Bulk update API (price, open/close, min stay, cut-off, block)

- **Goal:** apply one change set to many room types × dates atomically, with permission per field and audit per room type.
- **Depends on:** P2-T03, P2-T04.
- **Files to create/modify:**
  - `apps/api/src/modules/inventory/dto/inventory-grid.dto.ts` — **modify**: `InventoryBulkUpdateDto`.
  - `apps/api/src/modules/inventory/inventory-grid.service.ts` — **modify**: `bulkUpdate()`.
  - `apps/api/src/modules/inventory/inventory-grid.controller.ts` — **modify**: route.
  - `apps/api/src/modules/inventory/inventory.service.ts` — **modify**: extract `ensureNights(session, roomType, dates)` from `initialize()` (creates missing nights with `total = roomType.totalRooms`, defaults) and reuse it in both places.
  - `apps/api/src/modules/inventory/inventory-bulk.spec.ts` — **create**.
- **Steps:**
  1. `POST /api/v1/admin/hotels/:hotelId/inventory-grid/bulk`, guard permission `inventory.view`; the service then requires per field: price → `rates.edit`; `closed`/`minStay`/`cutoffDays` → `inventory.adjust`; `block` → `inventory.block`. Missing → `403 FORBIDDEN` with `message: 'Missing permission rates.edit'`.
  2. DTO:

     ```ts
     class InventoryBulkUpdateDto {
       @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @IsMongoId({ each: true }) roomTypeIds: string[];
       @Matches(DATE) from: string; @Matches(DATE) to: string;            // [from, to), max 366 nights
       @IsOptional() @IsArray() @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true }) daysOfWeek?: number[]; // 0=Sun … 6=Sat; omitted = every day
       @IsOptional() @ValidateNested() @Type(() => PriceChangeDto) price?: PriceChangeDto;    // { mode: 'SET', amountMinorUnits, currency } | { mode: 'RESET_TO_BASE' }
       @IsOptional() @IsBoolean() closed?: boolean;
       @IsOptional() @ValidateIf((o) => o.minStay !== null) @IsInt() @Min(1) @Max(30) minStay?: number | null;     // null = clear
       @IsOptional() @ValidateIf((o) => o.cutoffDays !== null) @IsInt() @Min(0) @Max(365) cutoffDays?: number | null; // null = clear
       @IsOptional() @ValidateNested() @Type(() => BlockChangeDto) block?: BlockChangeDto;     // { action: 'BLOCK' | 'UNBLOCK', quantity: 1..10000 }
       @IsString() @MinLength(3) @MaxLength(500) reason: string;
       @IsOptional() @IsBoolean() confirmSuspicious?: boolean;
     }
     ```

     At least one of `price`, `closed`, `minStay`, `cutoffDays`, `block` must be present → else `400 NOTHING_TO_UPDATE`. Cells = room types × selected dates ≤ 5,000 → else `422 BULK_TOO_LARGE`.
  3. Validation before the transaction:
     - every room type belongs to `hotelId` and is `ACTIVE` (else `404 NOT_FOUND` / `409 ROOM_TYPE_DISABLED`);
     - hotel not `ARCHIVED` (`409 HOTEL_ARCHIVED`);
     - dates ≥ hotel-local today (`422 PAST_DATES_NOT_EDITABLE`);
     - `price.mode === 'SET'`: currency equals each room type's base-rate currency (`409 RATE_CURRENCY_MISMATCH`; a room with no base rate → `409 BASE_RATE_REQUIRED`); run `checkRate` per room type (P2-T03).
  4. One `executeInTransaction(..., 5)`:
     - `ensureNights` for every room type (only when `closed`, `minStay`, `cutoffDays` or `block` is present);
     - price SET: `bulkWrite` of `updateOne({ roomTypeId, stayDate }, { $set: { amountMinorUnits, currency, hotelId }, $inc: { version: 1 } }, { upsert: true })` per cell; RESET_TO_BASE: `deleteMany({ roomTypeId: { $in }, stayDate: { $in } })`;
     - `closed` / `minStay` / `cutoffDays`: one `updateMany` per room type with `$set` and `$inc: { version: 1 }`;
     - block: per night conditional update exactly like `InventoryService.adjustNight` (`$expr` capacity check for BLOCK, `blocked: { $gte: quantity }` for UNBLOCK). Use `updateMany` with the capacity predicate and compare `modifiedCount` with the expected night count; any shortfall → throw `409 INVENTORY_UNAVAILABLE` / `409 BLOCKED_QUANTITY_INSUFFICIENT` with `details` listing the first 10 failing `{ roomTypeId, stayDate }` (find them with a query inside the same transaction before throwing). The throw aborts **everything**.
     - audit **one entry per room type**: `action: 'inventory.bulk_update'`, `resourceType: 'ROOM_TYPE'`, `resourceId: roomTypeId`, `hotelId`, `reason`, `metadata: { from, to, daysOfWeek, nightCount, changes: { price, closed, minStay, cutoffDays, block }, before: { distinctPrices, closedNights } }` (`before` is a small summary, not every cell).
  5. Response `{ updatedCells, createdNights, roomTypeIds }`.
- **Acceptance criteria:**
  - A bulk that fails on one night (e.g. block more than available) changes **nothing** (prices, flags and blocks all rolled back).
  - Without `rates.edit`, a request with `price` is `403`, but the same request without `price` works for a user with `inventory.adjust`.
  - `RATE_SUSPICIOUS` returns `409` with details; resending with `confirmSuspicious: true` succeeds.
  - A room type from another hotel in `roomTypeIds` → `404`, nothing written.
  - One audit entry per room type per request.
- **Tests:** `inventory-bulk.spec.ts` (in-memory replica set): happy path for each field; rollback on block shortfall (assert daily rates unchanged afterwards); per-field permission; cross-hotel room type; days-of-week filter (only Fri/Sat changed); two concurrent bulk blocks on a 1-room night → exactly one succeeds and `blocked + held + confirmed <= total`.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- inventory-bulk`.
- **Docs to update:** `../API.md`; `../modules/bookings.md` (inventory adjustments), `../modules/pricing.md` (daily rates); `../TASKS.md` §4 and §5 (new lines).

> **🧑 HUMAN CHECKPOINT — concurrency and transactions**: the human reviews `bulkUpdate` line by line for: every read/write inside the transaction uses `session`; the capacity predicate matches `adjustNight`; any failure aborts all changes; the concurrent-block test passes on the in-memory replica set. Approved = review done and the rollback and concurrency tests are green.

### P2-T06 — Readiness, room health and summary use restrictions and effective prices

- **Goal:** setup checks and badges agree with the grid.
- **Depends on:** P2-T05.
- **Files to create/modify:**
  - `apps/api/src/modules/hotels/hotel-publish.checks.ts` — **modify**.
  - `apps/api/src/modules/hotels/room-summary.service.ts` — **modify**.
  - `apps/api/src/modules/hotels/hotels.module.ts` — **modify**: import `PricingModule` exports (`RateResolver`) if not already available; add `DailyRate` model.
  - `apps/admin-web/src/features/hotels/hotels.api.ts` — **modify**: `HotelReadiness.warnings`.
- **Steps:**
  1. In `collect()`, the future-inventory query adds `closed: { $ne: true }`.
  2. Add non-blocking `warnings: PublishProblem[]` to `readiness()` (publishing still uses only `problems`):
     - `ROOM_TYPE_FEW_OPEN_DATES`: an active room type has fewer than 30 open nights in the next 90 days;
     - `ROOM_TYPE_CLOSED_SOON`: an active room type is closed tonight or tomorrow;
     - map both to step `availability` in `STEP_FOR_CODE`-like `WARNING_STEP` map.
  3. Room summary: `openNights` excludes closed nights; `freeTonight` returns `0` when tonight is closed and adds `closedTonight: boolean`; add `priceTonight: { amountMinorUnits, currency, source } | null` via `RateResolver`.
- **Acceptance criteria:**
  - A room type whose only open nights are all `closed` makes publish fail with `HOTEL_FUTURE_INVENTORY_REQUIRED` and shows `NO_OPEN_DATES`.
  - Warnings never block publishing.
- **Tests:** extend `hotel-lifecycle.integration.spec.ts` (closed-only inventory blocks publish) and `room-summary.service.spec.ts`.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test`.
- **Docs to update:** `../API.md` readiness response (`warnings`); `../modules/hotels.md` publication rules.

### P2-T07 — Grid selection model (pure logic)

- **Goal:** keep selection logic out of the component so it can be checked in isolation.
- **Depends on:** none (frontend), can run in parallel with P2-T04.
- **Files to create/modify:**
  - `apps/admin-web/src/features/inventory/grid/grid-selection.ts` — **create**: pure reducer.
  - `apps/admin-web/src/features/inventory/grid/useGridSelection.ts` — **create**: `useReducer` wrapper.
- **Steps:**
  1. Types: `Cell = { row: number; col: number }`; state `{ anchor: Cell | null; focus: Cell; selected: Set<string> }` with keys `"row:col"`.
  2. Actions and results:
     - `CLICK(cell)` → select only `cell`; `anchor = focus = cell`;
     - `SHIFT_CLICK(cell)` → select the rectangle from `anchor` to `cell` (replace selection); `focus = cell`;
     - `TOGGLE(cell)` (Ctrl/Cmd+click or Space) → add/remove `cell`; `anchor = focus = cell`;
     - `SELECT_ROW(row)` / `SELECT_COL(col)` (header clicks) → whole row / column (skip read-only cells);
     - `MOVE(dRow, dCol, extend: boolean)` (arrow keys; Shift extends the rectangle from `anchor`), clamped to the grid; `HOME` / `END` → first/last column of the row;
     - `CLEAR` (Esc);
     - `SET_DISABLED(predicate)` → selection never includes disabled cells (past dates, disabled room types).
  3. Selector `toBulkRequest(state, rows, dates)` → `{ roomTypeIds, from, to, daysOfWeek? } | { error: 'NON_RECTANGULAR' }`. The bulk API takes a date range per request, so a non-rectangular selection is split into one request per room type with contiguous ranges (`splitIntoRanges`) — return `requests: BulkTarget[]`.
- **Acceptance criteria:** written examples in the file's top comment (5 cases) match the code; the component (P2-T08) holds no selection logic of its own.
- **Tests:** manual via the examples, or Vitest if the checkpoint below approves it (`apps/admin-web/src/features/inventory/grid/grid-selection.test.ts`).
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md` (grid selection model).

> **🧑 HUMAN CHECKPOINT — tooling decision**: admin-web has no test runner. Approve or decline adding Vitest (`npm i -D vitest --workspace=apps/admin-web`, script `"test": "vitest run"`) to unit-test `grid-selection.ts`. Approved = yes (add it and the test) or no (manual examples only).

### P2-T08 — Inventory grid component (desktop and tablet)

- **Goal:** a keyboard-accessible room type × date grid.
- **Depends on:** P2-T04, P2-T07.
- **Files to create/modify:**
  - `apps/admin-web/src/features/inventory/inventory-grid.api.ts` — **create**: `getInventoryGrid(hotelId, from, to, signal)`, `bulkUpdateInventory(hotelId, body)`, types copied from the API.
  - `apps/admin-web/src/features/inventory/grid/InventoryGrid.tsx` — **create**.
  - `apps/admin-web/src/features/inventory/grid/InventoryGridCell.tsx` — **create**.
  - `apps/admin-web/src/features/inventory/grid/GridWindowControls.tsx` — **create**.
  - `apps/admin-web/src/features/inventory/grid/GridLegend.tsx` — **create**.
- **Steps:**
  1. **Props:** `InventoryGrid({ data: InventoryGridResponse; mode: 'edit' | 'occupancy'; selection; dispatch; readOnly: boolean; onActivateCell?(row, col) })`. `mode='occupancy'` is used by the P6 booking calendar (no selection, cells show sold/held/free).
  2. **Window controls:** `Tabs variant="pills" size="sm"` with `7 days`, `14 days`, `30 days` (default 14; on phones 7); buttons "Previous" / "Next" (`outline sm`, move by the window size), "Today", and a `DatePicker` for the start date. Window state in the URL (`?from=YYYY-MM-DD&days=14`).
  3. **Layout:** a `<div role="grid" aria-label="Inventory for <hotel>, <from> to <to>" aria-rowcount aria-colcount>`; first column sticky (`sticky left-0 bg-white`) with room name + code (`role="rowheader"`); header row sticky with weekday + day number (`role="columnheader"`, weekends tinted `bg-slate-50`, today outlined `ring-1 ring-brand-primary`). Horizontal scroll inside the card only.
  4. **Cell (edit mode)**, `role="gridcell"`, `aria-selected`, roving `tabIndex` (focused cell `0`, others `-1`), `aria-label` e.g. "Deluxe King, Tue 21 Oct: ₹3,500, 4 of 10 free, min stay 2":
     - line 1: price short format (`₹3.5k` is **not** allowed; use `formatMoney` without decimals when whole, e.g. "₹3,500"); daily-rate prices marked with a small dot and `title="Price for this date"`;
     - line 2: "4/10" free/total;
     - badges with icon **and** text: `Lock` "Closed", "Min 2", "≥3d";
     - uninitialized: dashed border, text "Not open";
     - past dates and disabled rows: `opacity-50`, `aria-disabled="true"`, not selectable.
  5. **Mouse:** click / Shift+click / Ctrl(Cmd)+click / header click → dispatch P2-T07 actions. **No drag selection** (WCAG 2.5.7 is met because every action is a single click).
  6. **Keyboard:** arrows, Shift+arrows, Space, Home/End, Esc, Enter = open the bulk panel (P2-T09) for the current selection. Focus is visible (`focus-visible:ring-2 ring-brand-primary`).
  7. **Selection bar** (sticky bottom inside the card, shown when ≥1 cell is selected): "36 cells selected · 3 room types × 12 nights", buttons "Clear" (`ghost sm`) and "Edit selection" (`primary sm`).
  8. **Legend** under the grid: explains dot, Closed, Min, ≥d, Not open.
  9. **States:** `LoadingRows`-style skeleton while loading; `Alert tone="error"` with Retry on error; `EmptyState` "No room types yet" with a link to Rooms & rates.
- **Acceptance criteria:**
  - A keyboard-only user can move, select a 3×5 rectangle and open the panel.
  - Screen reader (NVDA or VoiceOver) reads the cell label on focus.
  - 14 days × 10 room types renders without layout shift; header and first column stay visible while scrolling.
  - No colour-only information (each state has text or an icon with text).
- **Tests:** manual keyboard and screen-reader pass; record in `verify.md`.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md` (InventoryGrid props and modes); `NP/UI-PLAN.md` grid section (if present); `../guidelines/frontend-ui.md` "Availability calendar".

### P2-T09 — Bulk edit panel

- **Goal:** edit the selected cells: only the fields the user turns on are sent.
- **Depends on:** P2-T05, P2-T08.
- **Files to create/modify:**
  - `apps/admin-web/src/features/inventory/grid/BulkEditPanel.tsx` — **create**.
  - `apps/admin-web/src/features/inventory/grid/SuspiciousRateAlert.tsx` — **create**.
- **Steps:**
  1. `Modal variant="drawer" size="medium"`, title "Edit 36 cells", subtitle "Deluxe King, Suite · 21 Oct – 1 Nov".
  2. Each section starts with a `Checkbox` "Change price" / "Change sell status" / "Change minimum stay" / "Change booking cut-off" / "Block or release rooms"; its fields are disabled until checked (Guesty pattern: only changed fields are saved):
     - **Price:** `Tabs pills` "Set price" | "Reset to base rate"; `MoneyInput name="amount" currency={data.currency}` (hidden for reset). Gated by `Can rates.edit` (section hidden without it).
     - **Sell status:** `Tabs pills` "Open" | "Closed (stop-sell)".
     - **Minimum stay:** `Input type="number" min=1 max=30` + `Checkbox` "No minimum".
     - **Booking cut-off:** `Input type="number" min=0 max=365` suffix "days before arrival" + `Checkbox` "No cut-off".
     - **Rooms:** `Tabs pills` "Block" | "Release", `Input type="number"` quantity.
     - **Days of week:** seven `Checkbox`es Mon…Sun (all checked by default) — sent as `daysOfWeek` only when not all are checked.
     - `ReasonField` (required).
  3. Summary line above the footer: "Will change 36 nights for 3 room types." Footer: Cancel (`outline sm`), "Apply changes" (`primary sm`, disabled until at least one section is checked and the reason is valid).
  4. Submit: send one request per `BulkTarget` from `toBulkRequest` **sequentially**; stop at the first failure and report which targets were saved ("2 of 3 room types updated; Suite failed: Not enough rooms on 24 Oct"). Prefer rectangular selections so this is one request; the panel shows a note when it will send more than one.
  5. `409 RATE_SUSPICIOUS` → show `SuspiciousRateAlert` (`Alert tone="warning"`) listing each room: "₹800 is 27% of the base rate ₹3,000"; buttons "Change price" and "Save anyway" (resends with `confirmSuspicious: true`).
  6. Success: `toast.success('Saved 36 cells.')`, close, `invalidate('inventory-grid', 'rooms-summary', 'readiness')`, keep the selection cleared.
- **Acceptance criteria:**
  - Only checked sections are in the request body (inspect in the Network tab).
  - A failing block shows the API's details and leaves the grid unchanged for that request.
  - ₹0 is refused with the field error from the API.
- **Tests:** manual: each section alone, two sections together, suspicious flow, failure flow.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `NP/UX-PLAN.md` bulk edit copy (if present).

> **🧑 HUMAN CHECKPOINT — copy and product decision**: review panel wording ("Closed (stop-sell)", "days before arrival", the suspicious-rate message) and confirm that a multi-request (non-rectangular) save may partly succeed with a clear message, or require rectangular selections only. Approved = wording and the partial-save rule accepted.

### P2-T10 — Phone layout and non-drag alternative

- **Goal:** owners can change prices and close dates from a phone.
- **Depends on:** P2-T09.
- **Files to create/modify:**
  - `apps/admin-web/src/features/inventory/grid/InventoryDayList.tsx` — **create**.
  - `apps/admin-web/src/pages/hotels/tabs/HotelInventoryTab.tsx` — **modify**: below 640px render `InventoryDayList` instead of `InventoryGrid` (use `window.matchMedia('(max-width: 639px)')` with a listener, in a small hook `hooks/useMediaQuery.ts`).
- **Steps:**
  1. `Select` "Room type" at the top (one room type at a time).
  2. A list of dates (7 by default), each row: `Checkbox` (select), weekday + date, price, "4/10 free", badges. Rows are ≥ 44px tall (touch target).
  3. "Select all", "Select weekends" helper buttons (`ghost sm`).
  4. Sticky bottom bar "Edit 5 days" → the same `BulkEditPanel` (drawer slides from the bottom on phones: `Modal variant="drawer"` full width).
- **Acceptance criteria:** at 375px width: no horizontal page scroll; selecting 3 days and closing them works with taps only.
- **Tests:** manual in the browser's device emulation (iPhone SE size) and one real phone if available.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `NP/UI-PLAN.md` phone layout (if present); `apps/admin-web/docs/components.md`.

### P2-T11 — Make the grid the Inventory tab; retire old Rates and Availability screens

- **Goal:** one place for daily inventory work.
- **Depends on:** P2-T08 … P2-T10.
- **Files to create/modify:**
  - `apps/admin-web/src/pages/hotels/tabs/HotelInventoryTab.tsx` — **modify**: grid (or day list) + window controls + bulk panel; `?room=<id>` scrolls to and highlights that row.
  - `apps/admin-web/src/features/rooms/panel/RoomAvailabilityPanel.tsx` — **modify**: link to the grid with `?room=`.
  - `apps/admin-web/src/features/rooms/RoomsRatesTable.tsx` — **modify**: price column shows `priceTonight` with "Base ₹x" as secondary text when different.
- **Steps:**
  1. Remove `HotelRatesTab` and `HotelAvailabilityTab` from the Inventory tab (files stay; deletion candidates with `pages/catalog/*`).
  2. Add an "Open dates" shortcut in the toolbar for the visible window (calls the bulk API with `closed: false` for all active rooms, which also initializes missing nights) — label "Open all rooms for these dates".
- **Acceptance criteria:** `/admin/rates` and `/admin/inventory` redirect here; the room panel link lands on the right row; the old pages are unreachable.
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `../TASKS.md` §4/§5 (grid lines); `NP/MIGRATION-PLAN.md`; deletion candidates listed in the report.

> **🧑 HUMAN CHECKPOINT — accessibility review**: the human does a keyboard-only and screen-reader pass over the grid and panel, and checks the phone layout at 375px. Approved = no blocker found (WCAG 2.1.1 keyboard, 2.4.7 focus visible, 1.4.1 use of colour, 2.5.7 dragging alternatives, 2.5.8 target size).

### P2-T12 — P2 exit review

- **Goal:** prove P2 is complete.
- **Depends on:** P2-T01 … P2-T11.
- **Files to create/modify:** docs only.
- **Steps:**
  1. Run all verification commands.
  2. Walkthrough: set weekend prices for two room types for 4 weeks; close one date; set min stay 2 on Fridays; block 2 rooms on a date; check the audit log shows one entry per room type per save; check room health and readiness.
  3. Try ₹0 and a suspicious price; try a bulk as a user without `rates.edit`.
- **Acceptance criteria:** all P2 exit criteria met.
- **Tests:** full suite.
- **Verification:** all three commands.
- **Docs to update:** `../TASKS.md`, `../API.md`, `../DATA_MODEL.md` statuses.

> **🧑 HUMAN CHECKPOINT — phase gate**: the human repeats the walkthrough on a phone and a desktop. Approved = P2 accepted; P3 may start.

---

<a id="p3"></a>

## P3 — Hotel content, Overview & tax

- **Goal:** hotels have the content guests and booking sites expect, a live hotel opens on an Overview with setup health and a completeness score, and the hotel's GST registration is captured and validated.
- **Entry criteria:** P2 exit checkpoint approved.
- **Exit criteria:**
  - Content fields stored, validated and editable; option lists approved.
  - Overview tab with "Needs attention" (reusing readiness) and the completeness score (approved weights).
  - `taxProfile` with GSTIN validation (format, state code, check digit) and the `/admin/hotels/:hotelId/tax` page.
  - `/admin/today` shows setup health across accessible hotels.
  - Public hotel detail returns the new content (input for P5).

### P3-T01 — Hotel and photo content fields (schema, DTO, service)

- **Goal:** store check-in/out times, amenities (three-state), child & extra-bed policy, star rating and photo categories.
- **Depends on:** P2 done.
- **Files to create/modify:**
  - `apps/api/src/modules/hotels/schemas/hotel.schema.ts` — **modify**.
  - `apps/api/src/modules/hotels/dto/hotel.dto.ts` — **modify**: `UpdateHotelDto`, `HotelMediaItemDto`.
  - `apps/api/src/modules/hotels/hotel-content.options.ts` — **create**: code-owned option lists (exported constants used by DTO `@IsIn`).
  - `apps/api/src/modules/hotels/hotel.service.ts` — **modify**: `update()` normalisation; `safeAuditView` in `hotel.policies.ts` includes the new fields.
  - `apps/api/src/modules/hotels/hotel-content.spec.ts` — **create**.
- **Steps:**
  1. Hotel fields:

     ```ts
     checkInTime?: string;              // 'HH:mm' 24h, /^([01]\d|2[0-3]):[0-5]\d$/ ; UI default '14:00'
     checkOutTime?: string;             // same format; UI default '11:00'
     starRating?: number | null;        // 1–5 integer, null = not rated
     amenities: string[];               // existing field: codes answered YES
     amenitiesUnavailable: string[];    // new: codes answered NO (missing from both = not answered)
     childPolicy?: {
       childrenAllowed: boolean;
       freeStayMaxAge: number | null;   // 0–17; children up to this age stay free in existing beds
       extraBedAvailable: boolean;
       extraBedFeeMinorUnits: number | null;   // display only in the MVP (not added to quotes)
       cribAvailable: boolean;
     };
     ```

     Media item (`HotelMedia` in `hotel.schema.ts`, shared by room types): `category?: string` (`@IsIn(PHOTO_CATEGORIES)`); missing = "to be categorised".
  2. Option lists in `hotel-content.options.ts` (proposals, from `../ANALYSIS.md#fixed-option-lists-to-define`):
     - `AMENITY_CODES`: `WIFI`, `PARKING`, `AIR_CONDITIONING`, `RESTAURANT`, `ROOM_SERVICE`, `POOL`, `GYM`, `SPA`, `POWER_BACKUP`, `LIFT`, `FRONT_DESK_24H`, `AIRPORT_SHUTTLE`, `LAUNDRY`, `CCTV`, `WHEELCHAIR_ACCESS`, `PET_FRIENDLY`, `BAR`, `CONFERENCE_ROOM`, `KIDS_PLAY_AREA`, `GARDEN`;
     - `PHOTO_CATEGORIES`: `EXTERIOR`, `LOBBY`, `ROOM`, `BATHROOM`, `DINING`, `POOL`, `AMENITY`, `VIEW`, `OTHER`.
  3. Validation in the service: a code may not be in both `amenities` and `amenitiesUnavailable` (`422 AMENITY_CONFLICT`); `checkOutTime` may be after or before `checkInTime` (no rule); `extraBedFeeMinorUnits` requires `extraBedAvailable`.
  4. Existing hotels: no migration; missing fields = not answered.
- **Acceptance criteria:** `PATCH /admin/hotels/:id` accepts and returns the fields with `version` checks; invalid codes → `400` with per-field errors; audit `hotel.update` metadata includes the new fields.
- **Tests:** `hotel-content.spec.ts`: valid update, bad time, amenity conflict, bad photo category.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- hotel-content`.
- **Docs to update:** `../DATA_MODEL.md` (Hotel fields); `../modules/hotels.md`, `../modules/media.md`; `../API.md`; `NP/DATA-MODEL.md`.

> **🧑 HUMAN CHECKPOINT — product decision (option lists)**: approve the amenity list, photo categories, star rating range (1–5 + not rated), default check-in/out times and the child & extra-bed fields (including "extra-bed fee is display-only in the MVP"). Approved = lists frozen in `hotel-content.options.ts` and copied to the docs.

### P3-T02 — Content editing UI (details, map pin, amenities, policies, photo categories)

- **Goal:** staff can fill in the new content.
- **Depends on:** P3-T01.
- **Files to create/modify:**
  - `apps/admin-web/src/features/hotels/hotel-options.ts` — **modify**: copy the option lists with labels (e.g. `WIFI` → "Wi-Fi").
  - `apps/admin-web/src/features/hotels/HotelDetailsFields.tsx` — **modify**: star rating `Select` (Not rated, 1–5 stars); "Location on map" section with `latitude` / `longitude` `Input type="number" step="0.000001"` and a link "Check on Google Maps" (`https://www.google.com/maps?q=<lat>,<lng>`, `target="_blank" rel="noopener"`); live-hotel slug warning (`Alert tone="warning"` when the slug field changes on a `PUBLISHED` hotel: "Changing the web address breaks links guests already have."); time zone hint when the API says it is locked.
  - `apps/admin-web/src/features/hotels/AmenitiesFields.tsx` — **create**: per amenity a three-option `Tabs variant="pills" size="sm"` (Yes / No / Not answered), grouped in two columns; count "12 of 20 answered".
  - `apps/admin-web/src/pages/hotels/tabs/HotelDetailsTab.tsx` — **modify**: add the Amenities section with its own save.
  - `apps/admin-web/src/features/hotels/StayPolicyFields.tsx` — **create**: check-in / check-out times (`Select` of half-hours 00:00–23:30), child policy fields (`Checkbox`, `Input`, `MoneyInput` for the extra-bed fee).
  - `apps/admin-web/src/pages/hotels/tabs/HotelPoliciesTab.tsx` — **modify**: "Stay rules" section (StayPolicyFields) above "Cancellation & no-show terms"; separate saves.
  - `apps/admin-web/src/pages/hotels/tabs/HotelPhotosTab.tsx`, `apps/admin-web/src/features/hotels/PhotoEditModal.tsx` — **modify**: category `Select` per photo; a "To be categorised (n)" filter chip that shows uncategorised photos first; tip "Add at least 5 property photos".
  - `apps/admin-web/src/features/rooms/panel/RoomPhotosPanel.tsx` — **modify**: same category select (default `ROOM`).
- **Steps:** follow existing form patterns (`readHotelDetails(FormData)` in `HotelDetailsFields.tsx`); each section saves with the hotel `version` and handles `VERSION_CONFLICT`.
- **Acceptance criteria:** every new field round-trips; latitude outside −90..90 shows the API error on the field; the slug warning appears only for published hotels.
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `../ANALYSIS.md` Appendix B status (problems 2, 5, 6 addressed).

> **🧑 HUMAN CHECKPOINT — visual design and copy**: review the Amenities three-state control, Stay rules section and photo category flow. Approved = accepted, or an interactive map is requested instead of numeric inputs (that would be a separate task with a library decision).

### P3-T03 — GSTIN validator (format, state code, check digit)

- **Goal:** one tested validator used by the API and mirrored in the UI.
- **Depends on:** none (can run in parallel with P3-T01).
- **Files to create/modify:**
  - `apps/api/src/modules/hotels/tax/gstin.ts` — **create**.
  - `apps/api/src/modules/hotels/tax/gst-state-codes.ts` — **create**.
  - `apps/api/src/modules/hotels/tax/gstin.spec.ts` — **create**.
  - `apps/admin-web/src/features/tax/gstin.ts` — **create**: a copy of `gstin.ts` + the state map (keep both files identical; header comment "Keep in sync with apps/api/src/modules/hotels/tax/gstin.ts").
- **Steps:**
  1. **Normalise:** `trim()`, remove spaces, `toUpperCase()`.
  2. **Format:** `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/` (2-digit state code, 10-char PAN, entity number, the letter `Z`, check character). Fail → `GSTIN_FORMAT`.
  3. **Check order:** format → state code known (`GSTIN_STATE_UNKNOWN`) → check character (`GSTIN_CHECKSUM`) → state matches the hotel's state (`GSTIN_STATE_MISMATCH`). The expected state code comes from the hotel's `address.region` mapped through the same table. Checking the checksum before the mismatch means a typo is reported as a typo.
  4. **Check character (mod-36):**

     ```ts
     const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
     export function gstinCheckChar(first14: string): string {
       let sum = 0;
       for (let i = 0; i < 14; i++) {
         const value = CHARS.indexOf(first14[i]);
         const product = value * (i % 2 === 0 ? 1 : 2);   // factor 1 on odd positions (1st, 3rd…), 2 on even
         sum += Math.floor(product / 36) + (product % 36);
       }
       return CHARS[(36 - (sum % 36)) % 36];
     }
     ```

     Fail → `GSTIN_CHECKSUM`.
  5. Return type: `{ ok: true; gstin: string; stateCode: string; pan: string } | { ok: false; code: 'GSTIN_FORMAT' | 'GSTIN_STATE_UNKNOWN' | 'GSTIN_STATE_MISMATCH' | 'GSTIN_CHECKSUM'; message: string }`. Signature: `validateGstin(raw: string, expectedStateCode?: string)`.
  6. `GST_STATE_CODES` (code → state name exactly as in `INDIA_STATES` in `apps/admin-web/src/features/hotels/hotel-options.ts`): `01` Jammu and Kashmir, `02` Himachal Pradesh, `03` Punjab, `04` Chandigarh, `05` Uttarakhand, `06` Haryana, `07` Delhi, `08` Rajasthan, `09` Uttar Pradesh, `10` Bihar, `11` Sikkim, `12` Arunachal Pradesh, `13` Nagaland, `14` Manipur, `15` Mizoram, `16` Tripura, `17` Meghalaya, `18` Assam, `19` West Bengal, `20` Jharkhand, `21` Odisha, `22` Chhattisgarh, `23` Madhya Pradesh, `24` Gujarat, `26` Dadra and Nagar Haveli and Daman and Diu, `27` Maharashtra, `29` Karnataka, `30` Goa, `31` Lakshadweep, `32` Kerala, `33` Tamil Nadu, `34` Puducherry, `35` Andaman and Nicobar Islands, `36` Telangana, `37` Andhra Pradesh, `38` Ladakh. (Not accepted for hotels: `97` Other Territory, `99` Centre Jurisdiction; legacy `25`, `28`.)
  7. **Test vectors** (checksums computed with the algorithm above; real-world validity to be confirmed by the human):

     | Input | Expected state | Result |
     |---|---|---|
     | `27AAPFU0939F1ZV` | `27` | ok, state `27`, PAN `AAPFU0939F` |
     | `29AAGCB7383J1Z4` | `29` | ok |
     | `24AAACC1206D1ZM` | `24` | ok |
     | ` 27aapfu0939f1zv ` | `27` | ok (normalised) |
     | `27AAPFU0939F1ZW` | `27` | `GSTIN_CHECKSUM` |
     | `27AAPFU0939F1YV` | `27` | `GSTIN_FORMAT` (14th char not Z) |
     | `27AAPFU0939F1Z` | `27` | `GSTIN_FORMAT` (14 chars) |
     | `29AAPFU0939F1ZR` | `27` | `GSTIN_STATE_MISMATCH` (checksum valid, Karnataka GSTIN for a Maharashtra hotel) |
     | `99AAPFU0939F1ZV` | `27` | `GSTIN_STATE_UNKNOWN` (code 99 not accepted) |

- **Acceptance criteria:** all vectors pass in `gstin.spec.ts`; the admin copy gives the same results (call it from a tiny `node`-free check: compare the two files with `git diff --no-index` and expect only the header comment to differ).
- **Tests:** `gstin.spec.ts` with the table above plus `gstinCheckChar('27AAPFU0939F1Z') === 'V'`.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- gstin`; `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `../modules/hotels.md` (Tax & billing: GSTIN rules); `NP/DATA-MODEL.md`; `../ARCHITECTURE.md` ADR-007 note (validation only; tax calculation is P4).

> **🧑 HUMAN CHECKPOINT — tax rule**: a person with GST knowledge confirms the format regex, the state-code table (including codes 26 and 38, and rejecting 97/99/25/28), the check-digit algorithm, and tests at least two real GSTINs of known businesses. Approved = vectors and table confirmed; the "unverified – please confirm" note in `../ANALYSIS.md` can be removed.

### P3-T04 — `taxProfile` on the hotel and its endpoint

- **Goal:** store GSTIN, legal name, state code and specified-premises status with audit.
- **Depends on:** P3-T03.
- **Files to create/modify:**
  - `apps/api/src/modules/hotels/schemas/hotel.schema.ts` — **modify**: embedded `HotelTaxProfile`.
  - `apps/api/src/modules/hotels/dto/tax-profile.dto.ts` — **create**.
  - `apps/api/src/modules/hotels/hotel-tax.service.ts` — **create**.
  - `apps/api/src/modules/hotels/hotels.controller.ts` — **modify**: route on `AdminHotelsController`.
  - `apps/api/src/modules/hotels/hotels.module.ts` — **modify**: provider.
  - `apps/api/src/modules/hotels/dto/hotel.dto.ts` — **modify**: make sure `UpdateHotelDto` does **not** accept `taxProfile` (only the dedicated endpoint can change it).
  - `apps/api/src/modules/hotels/hotel-tax.service.spec.ts` — **create**.
- **Steps:**
  1. Schema:

     ```ts
     @Schema({ _id: false }) class HotelTaxProfile {
       @Prop({ trim: true, uppercase: true, match: /^[0-9A-Z]{15}$/ }) gstin?: string;
       @Prop({ trim: true, maxlength: 200 }) legalName?: string;
       @Prop({ match: /^\d{2}$/ }) stateCode?: string;     // derived from the GSTIN, or from address.region when no GSTIN
       @Prop({ required: true, default: false }) specifiedPremises: boolean;
       @Prop() updatedAt?: Date;
     }
     // Hotel: @Prop({ type: HotelTaxProfileSchema }) taxProfile?: HotelTaxProfile;
     ```

  2. `PUT /api/v1/admin/hotels/:id/tax-profile`, permission `hotels.edit_tax`. DTO: `version` (int), `gstin` (optional string ≤ 20; empty string clears it), `legalName` (required when `gstin` is set, 2–200), `specifiedPremises` (boolean), `reason` (3–500).
  3. Service: load hotel, `assertHotelScope`, version check, not archived; expected state code = `GST_STATE_CODES` lookup of `address.region` (if the country is not `IN`, return `422 TAX_PROFILE_INDIA_ONLY`); run `validateGstin(gstin, expected)`; a failure → `400` with `errors: [{ field: 'gstin', message }]` and `error: <code>`. Save with `$set: { taxProfile }`, `$inc: { version: 1 }`, audit `hotel.tax_profile.update` with masked before/after (`gstin` shown fully — it is public business data; no PAN extraction in logs).
  4. `GET /admin/hotels/:id` already returns the whole document, so `taxProfile` appears there.
  5. GSTIN is **not** required for publishing, holds or bookings (baseline: required before invoices in P7). Add a readiness **warning** `HOTEL_GSTIN_MISSING` (step `hotel`) in `hotel-publish.checks.ts`.
- **Acceptance criteria:** valid GSTIN saves; mismatched state → field error; PATCH `/admin/hotels/:id` with `taxProfile` → `400` (non-whitelisted); missing permission → `403`; publish still works without a GSTIN.
- **Tests:** `hotel-tax.service.spec.ts`: save, clear, mismatch, version conflict, audit entry written.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- hotel-tax`.
- **Docs to update:** `../API.md`; `../DATA_MODEL.md`; `../modules/hotels.md`; `../TASKS.md` §3 (new line "Tax & billing: GSTIN"); `NP/DATA-MODEL.md`.

> **🧑 HUMAN CHECKPOINT — security, permissions and tax**: confirm the new permission `hotels.edit_tax` (who gets it), the specified-premises field meaning and help text, and that a missing GSTIN only warns. Approved = permission grant and copy accepted.

### P3-T05 — Tax & billing page `/admin/hotels/:hotelId/tax`

- **Goal:** staff enter and see the hotel's GST details.
- **Depends on:** P3-T04.
- **Files to create/modify:**
  - `apps/admin-web/src/features/tax/tax.api.ts` — **create**: `saveTaxProfile(hotelId, body)`.
  - `apps/admin-web/src/features/tax/TaxProfileForm.tsx` — **create**.
  - `apps/admin-web/src/pages/hotels/tabs/HotelTaxTab.tsx` — **create**.
  - `apps/admin-web/src/routes/AppRoutes.tsx`, `apps/admin-web/src/features/hotels/HotelTabsNav.tsx` — **modify**: route `tax`, tab "Tax & billing" (visible with `hotels.view`; form editable with `hotels.edit_tax`).
- **Steps:**
  1. Fields: GSTIN (`Input`, `maxLength=15`, uppercase on input, live validation with `features/tax/gstin.ts` showing "Valid GSTIN for Maharashtra" or the error), Legal business name, State (read-only, from the hotel address, with a link "Change address in Details"), "Specified premises" `Checkbox` with hint text from the checkpoint, `ReasonField`.
  2. Info `Alert tone="info"`: "GST on rooms is calculated per night on the server: 5% up to ₹7,500 per room per night, 18% above (from 22 Sep 2025). Confirm with your tax adviser."
  3. Save → `handleFormError` maps `gstin` field errors.
- **Acceptance criteria:** client and server agree on validity for all P3-T03 vectors; read-only without `hotels.edit_tax`.
- **Tests:** manual with the vectors.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `NP/UX-PLAN.md` tax screen copy (if present).

### P3-T06 — Setup health and content-completeness score (API)

- **Goal:** one endpoint gives the Overview its "Needs attention" list and the completeness score.
- **Depends on:** P3-T01, P3-T04, P2-T06.
- **Files to create/modify:**
  - `apps/api/src/modules/hotels/hotel-health.service.ts` — **create**.
  - `apps/api/src/modules/hotels/completeness.ts` — **create** (pure function + weights constant).
  - `apps/api/src/modules/hotels/hotels.controller.ts` — **modify**: route.
  - `apps/api/src/modules/hotels/completeness.spec.ts`, `apps/api/src/modules/hotels/hotel-health.service.spec.ts` — **create**.
- **Steps:**
  1. `GET /api/v1/admin/hotels/:id/health`, permission `hotels.view`.
  2. Response:

     ```ts
     interface HotelHealth {
       readiness: HotelReadiness;                         // existing, incl. P2 warnings
       needsAttention: Array<{
         code: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; message: string;
         fix: { label: string; route: string };           // e.g. { label: 'Set price', route: '/admin/hotels/<id>/rooms?room=<rid>&panel=price' }
         roomTypeId?: string;
       }>;
       completeness: { score: number; items: Array<{ key: string; label: string; points: number; maxPoints: number; done: boolean; fix: { label: string; route: string } }> };
       lastChange: { at: string; actorEmail: string | null; action: string } | null;   // latest audit entry for the hotel
     }
     ```

  3. `needsAttention` = readiness `problems` (severity `HIGH`) + `warnings` (`MEDIUM`) + per-room health from `RoomSummaryService` (`MISSING_PRICE` `HIGH`, `NO_OPEN_DATES` `HIGH`) + `HOTEL_GSTIN_MISSING` (`LOW`). Sorted HIGH → LOW; de-duplicated by `code + roomTypeId`. Each code maps to a fix route in a `FIX_ROUTES` table in the service.
  4. Completeness (proposal; integer points, total 100):

     | Key | Rule | Max points |
     |---|---|---|
     | `propertyPhotos` | `min(hotelPhotos, 10) / 10 × 25`, floored | 25 |
     | `roomPhotos` | share of active room types with ≥1 photo × 15, floored | 15 |
     | `photoCategories` | all photos (hotel + rooms) have a category → 5, else 0 | 5 |
     | `description` | description ≥ 200 characters | 10 |
     | `amenities` | ≥ 10 amenities answered (yes or no) | 10 |
     | `stayTimes` | check-in and check-out times set | 10 |
     | `mapPin` | coordinates set | 10 |
     | `childPolicy` | child policy set | 10 |
     | `starRating` | `starRating` present in the document (1–5, or `null` saved by choosing "Not rated"); missing = not answered | 5 |

     The weights live in `COMPLETENESS_WEIGHTS` in `completeness.ts`. The score never blocks publishing.
- **Acceptance criteria:** a bare draft hotel scores ≤ 10; a fully filled hotel with 10+ categorised photos scores 100; the needs-attention list for a hotel with one unpriced room contains exactly one `MISSING_PRICE` entry with a working fix route.
- **Tests:** `completeness.spec.ts` (empty, partial, full); `hotel-health.service.spec.ts` (ordering, de-duplication).
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- completeness`; `npm --workspace=apps/api run test -- hotel-health`.
- **Docs to update:** `../API.md`; `../modules/hotels.md` (score formula); `NP/PRD.md` success metrics (if present).

> **🧑 HUMAN CHECKPOINT — product decision (weights)**: approve the completeness items and weights (photos-heavy, following Agoda), the severity of each needs-attention code, and the "Not rated" answer. Approved = table accepted or edited in `completeness.ts` and the docs.

### P3-T07 — Overview tab

- **Goal:** live hotels open on an Overview that tells staff what to fix.
- **Depends on:** P3-T06.
- **Files to create/modify:**
  - `apps/admin-web/src/features/hotels/overview/HotelHealthCard.tsx`, `CompletenessCard.tsx`, `GuestPreviewCard.tsx` — **create**.
  - `apps/admin-web/src/pages/hotels/tabs/HotelOverviewTab.tsx` — **create**.
  - `apps/admin-web/src/routes/AppRoutes.tsx`, `apps/admin-web/src/features/hotels/HotelTabsNav.tsx` — **modify**: `overview` route and first tab "Overview".
  - `apps/admin-web/src/pages/hotels/HotelLayout.tsx` (or the `HotelIndexRedirect`) — **modify**: index → `overview` for `PUBLISHED`/`SUSPENDED`, `details` for `DRAFT`.
- **Steps:**
  1. Layout: two columns on desktop (left: Needs attention + Completeness; right: Guest preview + Status), one column on phones.
  2. **Needs attention:** list rows with severity icon + text (High = `AlertCircle` rose, Medium = amber, Low = slate), message, and a `Button size="sm" variant="secondary"` with `fix.label` that navigates to `fix.route`. Empty → quiet "Everything needed for booking is in place."
  3. **Completeness:** "Content score 72%" with a bar (`role="progressbar" aria-valuenow`), the missing items as a checklist with fix links (done items visually quiet).
  4. **Guest preview:** cover photo, name, star rating, city, "From ₹x / night" (lowest base rate), first 5 amenities.
  5. **Status:** status pill, "Published since" (from `lastChange` when the action is `hotel.publish`, else "—"), "Last change: <action label> by <email>, <time>".
- **Acceptance criteria:** every fix button lands on the right tab/panel; the index redirect follows the status rule.
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `NP/UI-PLAN.md` Overview (if present).

> **🧑 HUMAN CHECKPOINT — product decision and visual sign-off**: confirm Overview as the default tab for published hotels, and review the Overview layout. Approved = default and design accepted.

### P3-T08 — `/admin/today` (setup health across hotels)

- **Goal:** a home page that ships now with real data: which hotels need attention.
- **Depends on:** P3-T06, P1-T05.
- **Files to create/modify:**
  - `apps/api/src/modules/hotels/hotels.controller.ts` — **modify**: `GET /api/v1/admin/hotels/setup-health?hotelId=&limit=&offset=` (declare **before** `@Get(':id')`), permission `hotels.view`.
  - `apps/api/src/modules/hotels/hotel-health.service.ts` — **modify**: `listSetupHealth(actor, { hotelId?, limit ≤ 50, offset })` → `{ items: [{ hotelId, name, status, highCount, mediumCount, topItems: needsAttention.slice(0,3), completenessScore }], total }`, non-archived hotels in scope only, sorted by `highCount` desc then name.
  - `apps/admin-web/src/pages/today/TodayPage.tsx` — **create**.
  - `apps/admin-web/src/routes/AppRoutes.tsx`, `apps/admin-web/src/routes/route-config.ts` — **modify**: `/admin/today` (`hotels.view`), first nav item "Today"; `/admin/dashboard` → redirect to `/admin/today`; `homePath()` prefers `/admin/today`.
- **Steps:**
  1. Page heading "Today" with the hotel-local date; the switcher is in portfolio mode (`?hotelId=`; "All hotels" allowed).
  2. Sections: "Needs attention" (hotels with `highCount > 0`, each row: hotel name, counts, top items with fix buttons), "All set" (collapsed list). Every row is labelled with its hotel name (portfolio rule).
  3. A note card: "Arrivals and departures appear here once bookings are live." (no invented numbers).
- **Acceptance criteria:** a manager sees only their hotels; with `?hotelId=` only that hotel shows; `/admin/dashboard` redirects.
- **Tests:** API test for scope and sorting in `hotel-health.service.spec.ts`; manual UI.
- **Verification:** all three commands.
- **Docs to update:** `../API.md`; `../guidelines/frontend-ui.md` "Operations overview"; `NP/UX-PLAN.md`.

> **🧑 HUMAN CHECKPOINT — route change**: approve replacing `/admin/dashboard` with `/admin/today` (redirect kept) and the computational cost note (each hotel runs the readiness checks; limit 50 per page). Approved = route change accepted.

### P3-T09 — Public hotel detail returns the new content

- **Goal:** P5 can show the content without more API work.
- **Depends on:** P3-T01.
- **Files to create/modify:** `apps/api/src/modules/hotels/hotel.service.ts` (`PublicHotelDetail`, `getPublicBySlug`).
- **Steps:**
  1. Add to the public response: `starRating`, `checkInTime`, `checkOutTime`, `amenities` (YES only), `childPolicy` (without internal fields), `coordinates`, `media` (url, caption, category, isPrimary — sorted by `displayOrder`), per room type `media` and `totalRooms` **not** included (internal).
  2. Never expose `taxProfile.specifiedPremises`, `version`, audit data or staff fields. Expose `taxProfile.legalName` and `gstin` only if the checkpoint says so.
- **Acceptance criteria:** response matches the documented shape; unpublished hotels still `404`.
- **Tests:** extend `hotel-lifecycle.integration.spec.ts` with a public detail assertion.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- hotel-lifecycle`.
- **Docs to update:** `../API.md` (`GET /hotels/:slug`); `../modules/guest-search.md`.

> **🧑 HUMAN CHECKPOINT — privacy**: confirm which fields are public (especially whether the GSTIN and legal name are shown to guests before booking). Approved = public field list accepted.

### P3-T10 — P3 exit review

- **Goal:** prove P3 is complete.
- **Depends on:** P3-T01 … P3-T09.
- **Files to create/modify:** docs only.
- **Steps:** fill a hotel's content to 100%; enter a valid and an invalid GSTIN; check Overview fix links; check `/admin/today` as super admin and as a manager.
- **Acceptance criteria:** all P3 exit criteria met.
- **Tests:** full suite.
- **Verification:** all three commands.
- **Docs to update:** `../TASKS.md` §3, `../API.md`, `../DATA_MODEL.md` statuses.

> **🧑 HUMAN CHECKPOINT — phase gate**: the human reviews Overview, Tax & billing and Today. Approved = P3 accepted; P4 may start.

---

<a id="p4"></a>

## P4 — Holds & booking core

- **Goal:** the server quotes a stay (per-night price × rooms, per-night GST), holds inventory atomically for a short time, and turns a hold into a pay-at-hotel booking with immutable snapshots. Staff can create a booking on its own page. **No overbooking under concurrency.**
- **Entry criteria:**
  - P3 exit checkpoint approved.
  - ADR-007 (tax) has an approved **development default** (P4-T01 checkpoint) — production tax display stays behind the checkpoint until a tax professional confirms.
  - Local MongoDB runs as a **replica set** for manual testing (standalone gives no atomicity, ADR-012).
- **Exit criteria:**
  - Quote, hold, booking and expiry work through the API with tests.
  - The parallel last-room test, partial-range rollback test, release-exactly-once test and idempotency test pass on `MongoMemoryReplSet`.
  - Staff New booking page works end to end with the hold indicator and extend.
  - Hold, booking and payment statuses are separate fields with explicit transition functions.
  - Tax and concurrency checkpoints approved.

### P4-T01 — Money and GST functions (pure, tested)

- **Goal:** one place that does the tax maths, in integer paise.
- **Depends on:** P3 done.
- **Files to create/modify:**
  - `apps/api/src/modules/pricing/money.ts` — **create**: `roundHalfUpDiv(numerator: number, denominator: number): number`, `assertMinor(n)`.
  - `apps/api/src/modules/pricing/gst.ts` — **create**.
  - `apps/api/src/modules/pricing/gst.spec.ts` — **create**.
  - `apps/api/src/common/config/configuration.ts` — **modify**: `tax: { gstSlabThresholdMinor: number; lowRateBps: number; highRateBps: number; pricesIncludeTax: boolean }` from env `GST_SLAB_THRESHOLD_MINOR` (default `750000`), `GST_LOW_RATE_BPS` (`500`), `GST_HIGH_RATE_BPS` (`1800`), `PRICES_INCLUDE_TAX` (`false`).
- **Steps:**
  1. `roundHalfUpDiv(n, d)` for non-negative integers: `Math.floor((2 * n + d) / (2 * d))`. Throw if inputs are not safe integers or the intermediate `2 * n + d` is not a safe integer.
  2. `gstForNight({ unitPriceMinor, quantity, config })`:
     - **slab is chosen from the per-room-per-night price** (`unitPriceMinor`), never from the total for several rooms: `unitPriceMinor <= threshold` → `lowRateBps` (5%), else `highRateBps` (18%);
     - `baseMinor = unitPriceMinor * quantity`;
     - `cgstMinor = roundHalfUpDiv(baseMinor * (rateBps / 2), 10000)`, `sgstMinor` = same (CGST + SGST, place of supply = hotel);
     - `taxMinor = cgstMinor + sgstMinor`; `totalMinor = baseMinor + taxMinor`;
     - returns `{ unitPriceMinor, quantity, baseMinor, rateBps, cgstMinor, sgstMinor, taxMinor, totalMinor, slab: 'LOW' | 'HIGH' }`.
     - `pricesIncludeTax: true` is **not implemented** in the MVP: throw `Error('Tax-inclusive pricing is not supported yet')` so nobody switches it on by accident.
  3. **Test vectors** (tax-exclusive prices, 1 room unless stated):

     | Unit price | Qty | Slab | CGST | SGST | Tax | Total |
     |---|---|---|---|---|---|---|
     | ₹3,500 (`350000`) | 1 | 5% | `8750` | `8750` | `17500` | `367500` |
     | ₹7,500 (`750000`) | 1 | 5% | `18750` | `18750` | `37500` | `787500` |
     | ₹7,500.01 (`750001`) | 1 | 18% | `67500` | `67500` | `135000` | `885001` |
     | ₹7,500.50 (`750050`) | 1 | 18% | `67505` (67504.5 rounds up) | `67505` | `135010` | `885060` |
     | ₹1,000.20 (`100020`) | 1 | 5% | `2501` (2500.5 rounds up) | `2501` | `5002` | `105022` |
     | ₹4,000 (`400000`) | 2 | 5% (slab from ₹4,000, not ₹8,000) | `20000` | `20000` | `40000` | `840000` |
     | ₹9,000 (`900000`) | 3 | 18% | `243000` | `243000` | `486000` | `3186000` |

- **Acceptance criteria:** all vectors pass; no `*` or `/` on money outside `money.ts`/`gst.ts` in later tasks (reviewer greps).
- **Tests:** `gst.spec.ts` with the table, plus the threshold read from config.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- gst`.
- **Docs to update:** `../ARCHITECTURE.md` decision log ADR-007 (development default: tax-exclusive prices, per-night slab, CGST/SGST half each, round half up per component); `../modules/pricing.md`; `.env.example`.

> **🧑 HUMAN CHECKPOINT — tax and money rules**: a tax professional (or the product owner after consulting one) confirms: the ₹7,500 threshold and "≤ 7,500 → 5%, > 7,500 → 18%" per room per night on the actual price; tax-exclusive prices for the MVP; CGST/SGST each at half the rate; **rounding half-up per component per night line**; and that the slab uses the price per room, not the total. Approved = written confirmation recorded in ADR-007; until then the guest web shows "Taxes estimated" next to totals.

### P4-T02 — Quote service and staff quote endpoint

- **Goal:** the server computes the full price of a stay from the effective nightly prices.
- **Depends on:** P4-T01, P2-T02.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/` — **create the module folder**: `bookings.module.ts` (imports `AuthModule`, `PricingModule`, `InventoryModule`; `forFeature` for `Hotel`, `RoomType`, `NightInventory`, `BaseRate`, `DailyRate`; later `Hold`, `Booking`, `Notification`).
  - `apps/api/src/modules/bookings/stay.ts` — **create**: `validateStay({ checkIn, checkOut, localToday, maxNights })` → `nights: string[]` or `422 INVALID_STAY_DATES` (check-in ≥ local today; 1 ≤ nights ≤ `maxNights`, default 30 from config `BOOKING_MAX_NIGHTS`).
  - `apps/api/src/modules/bookings/quote.service.ts` — **create**.
  - `apps/api/src/modules/bookings/dto/quote.dto.ts` — **create**.
  - `apps/api/src/modules/bookings/admin-bookings.controller.ts` — **create** (`@Controller('admin/hotels/:hotelId')`).
  - `apps/api/src/app.module.ts` — **modify**: import `BookingsModule`.
  - `apps/api/src/modules/bookings/quote.service.spec.ts` — **create**.
- **Steps:**
  1. DTO `QuoteRequestDto`: `roomTypeId` (MongoId), `checkIn`, `checkOut` (`YYYY-MM-DD`), `rooms` (int 1–10), `adults` (int 1–60), `children` (int 0–40).
  2. `QuoteService.quote(hotel, roomType, req, { checkAvailability: boolean })`:
     - hotel must be `PUBLISHED` (staff cannot book `DRAFT` or `SUSPENDED` hotels either; else `409 HOTEL_NOT_BOOKABLE`), room type `ACTIVE` and in this hotel (`404`);
     - `validateStay` with hotel-local today;
     - occupancy: `adults <= maxAdults * rooms` and `children <= maxChildren * rooms`, else `422 OCCUPANCY_EXCEEDED`;
     - load nights for the stay; each must exist (`409 INVENTORY_UNAVAILABLE` with `details: [{ stayDate, reason: 'NOT_OPEN' }]`), not `closed` (`reason: 'CLOSED'`), and if `checkAvailability`, `available >= rooms` (`reason: 'SOLD_OUT'`);
     - restrictions on the **check-in night** (P2-T01 rules): `nights.length >= minStay` (`422 MIN_STAY_NOT_MET`, `details: { minStay }`), `daysUntil(checkIn) >= cutoffDays` (`422 BOOKING_CUTOFF_PASSED`);
     - prices from `RateResolver`; any `null` → `409 RATE_NOT_SET`;
     - per night `gstForNight`; totals are sums of the lines.
  3. Result:

     ```ts
     interface QuoteResult {
       hotelId: string; roomTypeId: string; checkIn: string; checkOut: string;
       rooms: number; adults: number; children: number; currency: string;
       nights: Array<{ stayDate: string; unitPriceMinor: number; priceSource: 'DAILY_RATE' | 'BASE_RATE'; quantity: number;
                       baseMinor: number; rateBps: number; cgstMinor: number; sgstMinor: number; taxMinor: number; totalMinor: number }>;
       totals: { baseMinor: number; cgstMinor: number; sgstMinor: number; taxMinor: number; grandTotalMinor: number };
       taxNote: 'GST_PER_NIGHT_V1';
       quotedAt: string;                       // UTC ISO
     }
     ```

  4. Staff endpoint: `POST /api/v1/admin/hotels/:hotelId/quotes`, permission `bookings.create`. Also `GET /api/v1/admin/hotels/:hotelId/availability?checkIn&checkOut&rooms&adults&children` → for every active room type `{ roomTypeId, name, maxAdults, maxChildren, available: number (min over nights), bookable: boolean, reasons: string[], quote: QuoteResult | null }` (used by step 2 of the staff page).
- **Acceptance criteria:** a 3-night stay with one daily override returns 3 lines with the right sources and totals equal to the sum of lines; each error code above is reachable.
- **Tests:** `quote.service.spec.ts` (in-memory replica set): happy path; slab change across nights (₹7,000 then ₹8,000 → 5% and 18% lines); closed night; min stay; cut-off; occupancy; missing rate.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- quote`.
- **Docs to update:** `../API.md` (quotes, staff availability); `../modules/pricing.md`; `../modules/bookings.md`; `../TASKS.md` §5 "Server-side quote" (tick only after P4-T07 snapshots exist).

### P4-T03 — `Hold` schema and hold state machine

- **Goal:** the hold record and its allowed transitions.
- **Depends on:** P4-T02.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/schemas/hold.schema.ts` — **create**.
  - `apps/api/src/modules/bookings/hold-status.ts` — **create**.
  - `apps/api/src/modules/bookings/hold-status.spec.ts` — **create**.
  - `apps/api/src/common/config/configuration.ts` — **modify**: `holds: { ttlMinutes: { STAFF: number; GUEST_WEB: number }; maxExtends: number; expiryIntervalSeconds: number; jobEnabled: boolean }` from `HOLD_TTL_MINUTES_STAFF` (default = existing `HOLD_EXPIRY_MINUTES`, 10), `HOLD_TTL_MINUTES_GUEST_WEB` (10), `HOLD_MAX_EXTENDS` (10), `HOLD_EXPIRY_INTERVAL_SECONDS` (30), `HOLD_EXPIRY_JOB_ENABLED` (`true`).
- **Steps:**
  1. Schema (`collection: 'holds'`, `timestamps: true`):

     ```ts
     hotelId: ObjectId; roomTypeId: ObjectId;
     checkIn: string; checkOut: string; nights: string[]; quantity: number;      // rooms
     adults: number; children: number;
     status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'RELEASED';
     channel: 'STAFF' | 'GUEST_WEB';                                             // P7 adds PAYMENT_LINK
     expiresAt: Date; extendCount: number;
     idempotencyKey: string; requestHash: string;                                // digest() of the canonical request
     holdTokenHash?: string;                                                     // guest web only (P5)
     quote: QuoteResult;                                                         // snapshot at hold time
     createdBy?: string;                                                         // staff user id
     convertedBookingId?: ObjectId; releasedAt?: Date; releaseReason?: string;
     version: number;
     ```

     Indexes: `{ idempotencyKey: 1 }` unique `hold_idempotency_unique`; `{ status: 1, expiresAt: 1 }` `hold_status_expiry`; `{ hotelId: 1, createdAt: -1 }` `hold_hotel_time`. **No TTL index** (expired holds must release inventory first; documents are kept for audit).
  2. `hold-status.ts`: `HOLD_TRANSITIONS = { ACTIVE: ['CONVERTED', 'EXPIRED', 'RELEASED'], CONVERTED: [], EXPIRED: [], RELEASED: [] }` and `assertHoldTransition(from, to)` → `409 INVALID_HOLD_TRANSITION`.
- **Acceptance criteria:** only the four statuses exist; a hold status is never stored on a booking and vice versa.
- **Tests:** `hold-status.spec.ts` (every allowed and a few forbidden transitions).
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- hold-status`.
- **Docs to update:** `../DATA_MODEL.md` (replace `InventoryHold`/`HoldNight` with `Hold` + `nights[]`); `NP/DATA-MODEL.md`; `../modules/bookings.md` (hold state machine).

### P4-T04 — Create a hold atomically (staff endpoint)

- **Goal:** claim every night of a stay in one transaction, or nothing.
- **Depends on:** P4-T03.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/holds.service.ts` — **create** (`HoldsService.create`).
  - `apps/api/src/modules/bookings/dto/hold.dto.ts` — **create**.
  - `apps/api/src/modules/bookings/admin-bookings.controller.ts` — **modify**.
  - `apps/api/src/modules/bookings/holds.service.spec.ts` — **create**.
- **Steps:**
  1. Endpoint: `POST /api/v1/admin/hotels/:hotelId/holds`, permission `bookings.create`, header `Idempotency-Key` (required, 16–100 chars `[A-Za-z0-9-]`, else `400 IDEMPOTENCY_KEY_REQUIRED`), body = `QuoteRequestDto`.
  2. Before the transaction: `requestHash = digest(JSON.stringify({ hotelId, roomTypeId, checkIn, checkOut, rooms, adults, children, channel }))` (`apps/api/src/common/crypto/digest.ts`). If a hold with this `idempotencyKey` exists: same `requestHash` → return it (HTTP 200, no new claim); different → `409 IDEMPOTENCY_CONFLICT`.
  3. Before the transaction: release expired holds touching this room type (call `HoldsService.releaseExpired({ roomTypeId })` from P4-T05) so stale `held` counts don't block the claim.
  4. Quote with `checkAvailability: true` (fast fail with good error details).
  5. `executeInTransaction(async (session) => { ... }, 5)`:
     - for **each** night, in date order:

       ```ts
       const claimed = await this.inventoryModel.findOneAndUpdate(
         { roomTypeId, stayDate, closed: { $ne: true },
           $expr: { $gte: [{ $subtract: ['$total', { $add: ['$blocked', '$held', '$confirmed'] }] }, quantity] } },
         { $inc: { held: quantity, version: 1 } },
         { new: true, session },
       );
       if (!claimed) throw new ConflictException({ error: 'INVENTORY_UNAVAILABLE', message: 'Not enough rooms left for these dates', details: [{ stayDate }] });
       ```

     - create the `Hold` (`status: 'ACTIVE'`, `expiresAt = now + ttlMinutes[channel]`, `extendCount: 0`, `quote` snapshot, `createdBy: actor.id`) with `{ session }`;
     - audit `hold.create` (`resourceType: 'HOLD'`, metadata: roomTypeId, nights, quantity, expiresAt, channel).
  6. A duplicate-key error on `idempotencyKey` (two identical requests racing) → load the existing hold and apply step 2's rule.
  7. Transient conflicts that exhaust retries → `409 INVENTORY_BUSY` "Someone else is booking these dates. Try again." (never a 500).
  8. Response: `{ holdId, status, expiresAt, extendsLeft, quote }`.
- **Acceptance criteria:**
  - After a successful hold, each night's `held` increased by `quantity`; the invariant holds.
  - A hold failing on the 3rd night leaves nights 1–2 unchanged (rollback).
  - Same key + same body twice → one hold, `held` incremented once.
  - Same key + different body → `409 IDEMPOTENCY_CONFLICT`.
  - A closed night → `409 INVENTORY_UNAVAILABLE` with `reason: 'CLOSED'` from the quote step.
- **Tests:** `holds.service.spec.ts` (in-memory replica set) for each criterion. The parallel tests are in P4-T08.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- holds.service`.
- **Docs to update:** `../API.md` (`POST /admin/hotels/:hotelId/holds`, idempotency header); `../modules/bookings.md` (claim algorithm); `../TASKS.md` §4 TB S2-1 (tick after P4-T05 and P4-T08).

> **🧑 HUMAN CHECKPOINT — concurrency and transactions**: the human reviews `HoldsService.create` for: the conditional `findOneAndUpdate` per night with the capacity `$expr` and `closed` check; every call inside uses `session`; the idempotency race handling; no network calls inside the transaction; mapping of exhausted retries to `409 INVENTORY_BUSY`. Approved = code review passed and the unit tests are green.

### P4-T05 — Extend, release and expire holds (exactly once)

- **Goal:** holds end in exactly one way, and inventory is released exactly once.
- **Depends on:** P4-T04.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/holds.service.ts` — **modify**: `extend()`, `release()`, `releaseExpired()`, private `releaseOne(holdId, toStatus, reason)`.
  - `apps/api/src/modules/bookings/hold-expiry.job.ts` — **create** (`HoldExpiryJob implements OnModuleInit, OnModuleDestroy`).
  - `apps/api/src/modules/bookings/admin-bookings.controller.ts` — **modify**: two routes.
  - `apps/api/src/modules/bookings/bookings.module.ts` — **modify**: provider `HoldExpiryJob`.
- **Steps:**
  1. **`releaseOne(holdId, to: 'EXPIRED' | 'RELEASED', reason)`** in one transaction:

     ```ts
     const filter = to === 'EXPIRED'
       ? { _id: holdId, status: 'ACTIVE', expiresAt: { $lte: new Date() } }
       : { _id: holdId, status: 'ACTIVE' };
     const hold = await this.holdModel.findOneAndUpdate(filter,
       { $set: { status: to, releasedAt: new Date(), releaseReason: reason }, $inc: { version: 1 } },
       { new: true, session });
     if (!hold) return false;                       // someone else already ended it: do nothing
     for (const stayDate of hold.nights) {
       const res = await this.inventoryModel.updateOne(
         { roomTypeId: hold.roomTypeId, stayDate, held: { $gte: hold.quantity } },
         { $inc: { held: -hold.quantity, version: 1 } }, { session });
       if (res.modifiedCount !== 1) throw new Error(`Held count underflow for ${stayDate}`);  // aborts; logged as an incident
     }
     // audit hold.expire or hold.release (actorType 'SYSTEM' for expiry)
     return true;
     ```

     The conditional status change is what guarantees "exactly once": two workers can't both move the same hold out of `ACTIVE`.
  2. **`releaseExpired({ roomTypeId?, limit = 100 })`**: find `{ status: 'ACTIVE', expiresAt: { $lte: now } }` (optionally by room type), sorted by `expiresAt`, limit; call `releaseOne(..., 'EXPIRED', 'TTL')` for each, one transaction per hold; return the count.
  3. **`HoldExpiryJob`**: if `holds.jobEnabled`, `setInterval` every `expiryIntervalSeconds` calling `releaseExpired({})`; skip a tick if the previous one is still running (boolean flag); clear the interval on destroy. Log counts at `debug`, errors at `error` (never personal data).
  4. **Extend**: `POST /api/v1/admin/hotels/:hotelId/holds/:holdId/extend` (`bookings.create`): hold must belong to `hotelId` (`404`), be `ACTIVE` and not past `expiresAt` (`409 HOLD_EXPIRED`), `extendCount < maxExtends` (`409 HOLD_EXTEND_LIMIT`). Conditional update `{ _id, status: 'ACTIVE', expiresAt: { $gt: now }, extendCount: { $lt: max } }` → `$set: { expiresAt: now + ttl }`, `$inc: { extendCount: 1, version: 1 }`. No inventory change. Audit `hold.extend`.
  5. **Release** (user cancels or changes the room): `POST /api/v1/admin/hotels/:hotelId/holds/:holdId/release` (`bookings.create`) → `releaseOne(id, 'RELEASED', 'USER')`; already ended → `200` with the current status (idempotent).
  6. Responses include `{ holdId, status, expiresAt, extendsLeft }`.
- **Acceptance criteria:**
  - Running `releaseExpired` twice (even concurrently) on one expired hold decrements `held` once.
  - Extend works 10 times, the 11th returns `409 HOLD_EXTEND_LIMIT`.
  - Releasing an `EXPIRED` hold changes nothing.
- **Tests:** in `holds.service.spec.ts`: expire twice in parallel (`Promise.all`), extend limit, release idempotency. Use a short TTL by setting `expiresAt` in the past directly in the test.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- holds`.
- **Docs to update:** `../API.md`; `../modules/bookings.md` (expiry job, release-once rule); `../MVP.md` exit criterion "Release once" evidence link.

> **🧑 HUMAN CHECKPOINT — product decision (hold length and extensions)**: confirm 10 minutes for staff and guest web, a maximum of 10 extensions (WCAG 2.2.1 needs at least 10), and a 30-second expiry job interval. Approved = values accepted (they are config, so changes don't need code).

### P4-T06 — `Booking` schema, booking reference and booking state machine

- **Goal:** the booking record with per-night lines and snapshots, and its transitions.
- **Depends on:** P4-T03.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/schemas/booking.schema.ts` — **create**.
  - `apps/api/src/modules/bookings/booking-status.ts` — **create**.
  - `apps/api/src/modules/bookings/booking-reference.ts` — **create**.
  - `apps/api/src/modules/bookings/booking-status.spec.ts`, `booking-reference.spec.ts` — **create**.
- **Steps:**
  1. Schema (`collection: 'bookings'` — **must** be this name and use `hotelId: ObjectId` and `checkOut: string`, because `HotelService.update` already counts `connection.collection('bookings').countDocuments({ hotelId, checkOut: { $gt: localToday } })` to lock the time zone):

     ```ts
     reference: string;                          // unique, e.g. 'SW-7K3M9Q'
     hotelId: ObjectId; roomTypeId: ObjectId; holdId: ObjectId;            // holdId unique: a hold converts once
     checkIn: string; checkOut: string; quantity: number; adults: number; children: number;
     status: 'OPTIONAL' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
     releaseAt?: Date;                           // only for OPTIONAL
     channel: 'STAFF' | 'GUEST_WEB';
     currency: string;
     nights: Array<{ stayDate, unitPriceMinor, priceSource, quantity, baseMinor, rateBps, cgstMinor, sgstMinor, taxMinor, totalMinor }>;
     totals: { baseMinor, cgstMinor, sgstMinor, taxMinor, grandTotalMinor };
     taxSnapshot: { rule: 'GST_PER_NIGHT_V1'; thresholdMinor: number; lowRateBps: number; highRateBps: number; pricesIncludeTax: false;
                    hotelStateCode?: string; hotelGstin?: string; hotelLegalName?: string };
     policySnapshot: HotelCancellationPolicy & { checkInTime?: string; checkOutTime?: string; timezone: string };
     hotelSnapshot: { name: string; slug: string; address: HotelAddress; contact: HotelContact };
     roomTypeSnapshot: { name: string; code: string; maxAdults: number; maxChildren: number };
     guest: { fullName: string; email?: string; phone: string; companyName?: string; companyGstin?: string; specialRequests?: string };
     payment: { status: 'NOT_REQUIRED' | 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
                method: 'PAY_AT_HOTEL'; amountDueMinor: number; collectedMinor: number; collectedAt?: Date; collectedBy?: string; collectedVia?: 'CASH' | 'UPI' | 'CARD' | 'OTHER' };
     cancellation?: { at: Date; by?: string; reason: string; feeMinor: number; feeRule: string };
     noShow?: { at: Date; by: string; feeMinor: number };
     statusHistory: Array<{ from: string | null; to: string; at: Date; by?: string; reason?: string }>;
     accessTokenHash?: string; accessTokenExpiresAt?: Date;     // guest access (P5)
     createdBy?: string; idempotencyKey: string;
     version: number;
     ```

     Indexes: `reference` unique `booking_reference_unique`; `holdId` unique `booking_hold_unique`; `idempotencyKey` unique `booking_idempotency_unique`; `{ hotelId: 1, checkIn: 1 }`; `{ hotelId: 1, status: 1, checkIn: 1 }`; `{ 'guest.phone': 1 }`; `{ 'guest.email': 1 }`; `{ status: 1, releaseAt: 1 }` (OPTIONAL release job).
  2. `booking-status.ts`:

     ```ts
     export const BOOKING_TRANSITIONS = {
       OPTIONAL:    ['CONFIRMED', 'CANCELLED'],
       CONFIRMED:   ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
       CHECKED_IN:  ['CHECKED_OUT'],
       CHECKED_OUT: ['COMPLETED'],
       COMPLETED: [], CANCELLED: [], NO_SHOW: [],
     } as const;
     export function assertBookingTransition(from, to) { /* 409 INVALID_BOOKING_TRANSITION */ }
     ```

     Payment status has its own map (`PAYMENT_TRANSITIONS`, MVP uses `NOT_REQUIRED`, `PENDING → CAPTURED`) — **never** derived from the booking status.
  3. `booking-reference.ts`: `generateReference()` = `'SW-' +` 6 chars from `'23456789ABCDEFGHJKMNPQRSTUVWXYZ'` using `crypto.randomInt` (no 0/1/I/L/O). The caller retries up to 5 times on a duplicate-key error on `reference`.
- **Acceptance criteria:** schema compiles with indexes; transition tests cover all allowed pairs and reject e.g. `CANCELLED → CONFIRMED`, `CHECKED_IN → CANCELLED`.
- **Tests:** `booking-status.spec.ts`, `booking-reference.spec.ts` (format regex `^SW-[2-9A-HJKMNP-Z]{6}$`, 1,000 generated values unique).
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- booking-`.
- **Docs to update:** `../DATA_MODEL.md` (Booking with embedded `nights[]`, replacing `BookingNight`); `NP/DATA-MODEL.md`; `../modules/bookings.md` (state machines, reference format).

> **🧑 HUMAN CHECKPOINT — data model, state machines and privacy**: review the Booking schema (snapshots, guest fields — phone required, email optional, optional company GSTIN), the booking and payment transition maps, and the reference format (this plan: `SW-` + 6 characters; `NP/DATA-MODEL.md`: `SW` + 8 Crockford characters — pick one, see [1.5](#15-known-differences-with-the-other-new-plan-documents)). Approved = schema and maps accepted before P4-T07.

### P4-T07 — Confirm a booking from a hold (pay at hotel), and the OPTIONAL status

- **Goal:** turn an active hold into a booking atomically, with snapshots.
- **Depends on:** P4-T05, P4-T06.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/bookings.service.ts` — **create** (`BookingsService.createFromHold`, `releaseDueOptional`).
  - `apps/api/src/modules/bookings/dto/booking.dto.ts` — **create**: `CreateBookingDto`, `GuestDto`.
  - `apps/api/src/modules/bookings/optional-release.job.ts` — **create** (same pattern as `HoldExpiryJob`).
  - `apps/api/src/modules/bookings/admin-bookings.controller.ts` — **modify**.
  - `apps/api/src/modules/hotels/room-type.service.ts` — **modify**: `disable()` → `409 ROOM_TYPE_HAS_FUTURE_BOOKINGS` when bookings with status `OPTIONAL|CONFIRMED|CHECKED_IN` and `checkOut > localToday` exist for the room type.
  - `apps/api/src/modules/bookings/bookings.service.spec.ts` — **create**.
- **Steps:**
  1. Endpoint: `POST /api/v1/admin/hotels/:hotelId/bookings`, permission `bookings.create`, header `Idempotency-Key`. Body:

     ```ts
     class GuestDto {
       @IsString() @MinLength(2) @MaxLength(120) fullName: string;
       @Matches(/^\+?[0-9 ]{10,15}$/) phone: string;                    // normalise: remove spaces; Indian 10-digit → '+91' prefix
       @IsOptional() @IsEmail() @MaxLength(254) email?: string;
       @IsOptional() @IsString() @MaxLength(200) companyName?: string;
       @IsOptional() @IsString() @Length(15, 15) companyGstin?: string;  // validated with validateGstin(raw) (no state match)
       @IsOptional() @IsString() @MaxLength(500) specialRequests?: string;
     }
     class CreateBookingDto {
       @IsMongoId() holdId: string;
       @ValidateNested() @Type(() => GuestDto) guest: GuestDto;
       @IsIn(['CONFIRMED', 'OPTIONAL']) status: 'CONFIRMED' | 'OPTIONAL';
       @ValidateIf((o) => o.status === 'OPTIONAL') @IsISO8601() releaseAt?: string;   // must be in the future and before check-in
       @IsIn(['PENDING', 'NOT_REQUIRED']) paymentStatus: 'PENDING' | 'NOT_REQUIRED';  // NOT_REQUIRED = complimentary; needs bookings.manage
     }
     ```

  2. Idempotency: an existing booking with this `idempotencyKey` → return it if `holdId` matches, else `409 IDEMPOTENCY_CONFLICT`.
  3. Load hotel (for snapshots) and hold **outside** the transaction for validation: hold belongs to `hotelId` (`404`), `ACTIVE` (`409 HOLD_EXPIRED` if `EXPIRED`, `409 HOLD_NOT_ACTIVE` otherwise), not past `expiresAt` (`409 HOLD_EXPIRED`).
  4. `executeInTransaction(..., 5)`:
     - convert the hold: `findOneAndUpdate({ _id, status: 'ACTIVE', expiresAt: { $gt: now } }, { $set: { status: 'CONVERTED' }, $inc: { version: 1 } })`; `null` → `409 HOLD_EXPIRED` (aborts; the expiry job will release it);
     - per night: `updateOne({ roomTypeId, stayDate, held: { $gte: q } }, { $inc: { held: -q, confirmed: q, version: 1 } })`; `modifiedCount !== 1` → throw (abort);
     - create the booking: `nights` and `totals` **copied from `hold.quote`** (the price the user saw), `taxSnapshot` from config + `hotel.taxProfile`, `policySnapshot` from `hotel.cancellationPolicy` + times + timezone, `hotelSnapshot`, `roomTypeSnapshot`, `guest`, `payment: { status, method: 'PAY_AT_HOTEL', amountDueMinor: totals.grandTotalMinor, collectedMinor: 0 }`, `statusHistory: [{ from: null, to: status, at, by }]`, reference with retry;
     - set `hold.convertedBookingId`;
     - audit `booking.create` (`resourceType: 'BOOKING'`, metadata: reference, totals, status; **no** guest phone/email in audit metadata).
  5. **Price drift:** the quote is snapshotted at hold time and honoured for the hold's life (max 10 min × extensions). Document this.
  6. `OPTIONAL` bookings keep inventory in `confirmed`. `releaseDueOptional()` (job every 60 s): find `{ status: 'OPTIONAL', releaseAt: { $lte: now } }`; per booking, one transaction: conditional status change `OPTIONAL → CANCELLED` (filter includes `status: 'OPTIONAL'`), decrement `confirmed` per night with `confirmed: { $gte: q }`, push `statusHistory` with reason `OPTIONAL_RELEASED`, audit `booking.optional_release` (actorType `SYSTEM`).
  7. Confirming an OPTIONAL booking (`OPTIONAL → CONFIRMED`) is a P6 transition endpoint.
- **Acceptance criteria:**
  - After confirm: the hold is `CONVERTED`; each night has `held -= q`, `confirmed += q`; the booking has `nights.length` = stay nights and totals equal to the hold's quote.
  - Confirming an expired hold → `409 HOLD_EXPIRED`, no booking, inventory unchanged.
  - Repeating the same request (same key) returns the same booking; no double `confirmed`.
  - `paymentStatus: 'NOT_REQUIRED'` without `bookings.manage` → `403`.
  - Disabling a room type with a future booking → `409 ROOM_TYPE_HAS_FUTURE_BOOKINGS`.
- **Tests:** `bookings.service.spec.ts` for each criterion + OPTIONAL release exactly once (run `releaseDueOptional` twice in parallel).
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- bookings.service`.
- **Docs to update:** `../API.md` (`POST /admin/hotels/:hotelId/bookings`); `../modules/bookings.md`; `../TASKS.md` §5 TB S2-2 and §7 TB S2-3 (staff part).

> **🧑 HUMAN CHECKPOINT — product decision and money**: confirm (a) the quoted price is honoured for the life of the hold, (b) OPTIONAL bookings are in the MVP (staff only), keep inventory as confirmed and auto-cancel at `releaseAt`, (c) complimentary (`NOT_REQUIRED`) bookings need `bookings.manage`, (d) guest phone required / email optional. Approved = all four answered.

### P4-T08 — Concurrency test suite (last room, rollback, release once, races)

- **Goal:** prove "no overbooking" and "release once" on a real replica set.
- **Depends on:** P4-T07.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/booking-concurrency.integration.spec.ts` — **create**.
  - `apps/api/src/scripts/verify-scenarios.ts` — **modify** (optional): add an HTTP-level parallel hold scenario against a running replica-set dev server.
- **Steps:**
  1. Setup: `MongoMemoryReplSet` (copy `hotel-lifecycle.integration.spec.ts`), a published hotel, one room type with `totalRooms: 1`, base rate, inventory for 30 nights.
  2. **Last room:** `Promise.allSettled` of 10 `holds.create(...)` calls for the same night, different idempotency keys. Expect exactly 1 fulfilled; the rest rejected with `INVENTORY_UNAVAILABLE` or `INVENTORY_BUSY`; then `held === 1` and `held + confirmed + blocked <= total` on every night.
  3. **Multi-night overlap:** room with 1 room; hold A for nights 1–3 and hold B for nights 3–5 in parallel → exactly one succeeds; the other leaves nights untouched (check nights 1,2,4,5 held counts).
  4. **Partial range rollback:** night 3 blocked fully; hold for nights 1–4 fails; nights 1–2 `held === 0`.
  5. **Release once:** expired hold; 5 parallel `releaseExpired()` → `held` back to 0, never negative, exactly one `hold.expire` audit entry.
  6. **Confirm vs expire race:** set `expiresAt = now + 50ms`; run `createFromHold` and `releaseExpired` in parallel after ~50ms → either a booking exists and `confirmed === 1, held === 0`, or the hold is `EXPIRED` and both counts are 0. Never both, never `held < 0`.
  7. **Idempotency race:** 5 parallel `holds.create` with the **same** key and body → 1 hold document, `held === 1`.
  8. **Block vs hold race:** parallel bulk block (P2-T05) of 1 room and hold of 1 room on the 1-room night → exactly one succeeds.
  9. Each test asserts the invariant on all nights at the end (helper `assertInvariant()`).
  10. Run the file 5 times in a row to catch flakiness: `for i in 1 2 3 4 5; do npm --workspace=apps/api run test -- booking-concurrency || break; done` (PowerShell: `1..5 | % { npm --workspace=apps/api run test -- booking-concurrency }`).
- **Acceptance criteria:** all scenarios pass 5/5 runs.
- **Tests:** this file.
- **Verification:** `npm --workspace=apps/api run test -- booking-concurrency` (×5); full suite once.
- **Docs to update:** `../TASKS.md` §4 TB S2-5 (tick with evidence); `../MVP.md` exit criteria "Last-room safety" and "Release once" (link the test); `../guidelines/testing-devops.md` (how to run).

> **🧑 HUMAN CHECKPOINT — concurrency proof**: the human runs the suite themselves 5 times, reads the assertions (especially that losers fail with a 409 and never a 500, and that the invariant helper checks every night), and confirms no test was weakened to pass. Approved = 5/5 green on the human's machine.

### P4-T09 — Staff New booking page (3 steps, hold indicator with extend)

- **Goal:** staff create a pay-at-hotel booking on its own page, safely.
- **Depends on:** P4-T07; P2-T08 (optional: start from a grid cell).
- **Files to create/modify:**
  - `apps/admin-web/src/features/bookings/bookings.api.ts` — **create**: `getStaffAvailability`, `createHold(hotelId, body, idempotencyKey)`, `extendHold`, `releaseHold`, `createBooking(hotelId, body, idempotencyKey)`; `request` with `headers: { 'Idempotency-Key': key }`.
  - `apps/admin-web/src/features/bookings/HoldTimer.tsx` — **create**.
  - `apps/admin-web/src/features/bookings/new/StayStep.tsx`, `RoomStep.tsx`, `GuestStep.tsx`, `PriceBreakdown.tsx`, `BookingConfirmedPanel.tsx` — **create**.
  - `apps/admin-web/src/pages/bookings/NewBookingPage.tsx` — **create**.
  - `apps/admin-web/src/routes/AppRoutes.tsx`, `apps/admin-web/src/routes/route-config.ts`, `apps/admin-web/src/features/hotels/HotelTabsNav.tsx` — **modify**: route `/admin/hotels/:hotelId/bookings/new` (`bookings.create`) inside the hotel layout; a "New booking" `Button` (`primary sm`, `Plus`) in the hotel layout header gated by `Can bookings.create`.
- **Steps:**
  1. **URL state:** `?checkIn=&checkOut=&adults=&children=&rooms=&roomTypeId=` so a grid cell or a link can pre-fill (P6-T07 uses it).
  2. **Step 1 — Stay:** two `DatePicker`s (min = hotel-local today), adults/children/rooms `Input type="number"`; "Check availability" (`primary md`). Collect these **before** any hold starts (W3C advice).
  3. **Step 2 — Room:** `getStaffAvailability` → one card per room type: name, "4 free", price per night (or "from–to" when nights differ), total incl. GST, reasons when not bookable ("Closed on 24 Oct", "Minimum stay 2 nights"). "Choose" creates the hold with a fresh `crypto.randomUUID()` key. While creating: button `isLoading`. Errors: `INVENTORY_UNAVAILABLE`/`INVENTORY_BUSY` → `Alert` "Those rooms were just taken. Choose another room or dates." and refresh availability.
  4. **`HoldTimer`** props `{ expiresAt: string; extendsLeft: number; onExtend(): Promise<void>; onExpired(): void }`:
     - quiet text "Room held · 9:32" (`text-xs text-slate-500`, updates every second, **no** `aria-live` on the ticking text);
     - at ≤ 60 s left, render once an `Alert tone="warning" role="alert"`: "Room hold ends in 1 minute." with `Button size="sm"` "Keep holding" (calls extend; disabled when `extendsLeft === 0` with text "No more extensions");
     - at 0: call `onExpired()`.
     - Clock skew: compute remaining from `expiresAt - (Date.now() + serverOffset)`; set `serverOffset` from the response `Date` header when available, else 0.
  5. **Step 3 — Guest & pay:** `Field`s full name, phone (`Input type="tel"`, hint "10-digit mobile, e.g. 98765 43210"), email (optional), company name and company GSTIN (optional, collapsed under "Add business details"), special requests (`Textarea showCount`), status `Tabs pills` "Confirmed" | "Optional (release on date)" with a `DatePicker` + time `Select` for `releaseAt`, payment `Select` "Pay at hotel" (only option shown in the MVP; "Complimentary" when `can('bookings.manage')`). `PriceBreakdown` shows each night (date, price, GST %, tax), CGST and SGST totals, grand total, and the cancellation terms from the hotel policy. Button: "Confirm booking for ₹x" (`primary md`).
  6. **Expiry:** the form stays filled; show `Alert tone="warning"`: "Room no longer held — check availability again." with "Hold again" (creates a new hold with a new key, same room) — if it fails, go back to step 2 with the error.
  7. **Leaving the page** with an active hold: `useUnsavedChanges().setDirty('new-booking', true)`; on confirm-leave, call `releaseHold` (fire-and-forget).
  8. **Success:** `BookingConfirmedPanel` with reference, summary and buttons "View booking" (→ `/admin/hotels/:hotelId/bookings/:bookingId`, available from P6) and "New booking".
  9. Confirm request uses its own idempotency key created when step 3 opens; a double click or retry after a network error reuses it.
- **Acceptance criteria:**
  - Happy path creates a booking; the grid shows one more sold room for those nights.
  - Waiting past expiry keeps the form and shows the message; "Hold again" works.
  - "Keep holding" extends; the warning is announced once by a screen reader, the ticking text is not.
  - Double-clicking "Confirm booking" creates one booking.
  - Two browsers trying the last room: one succeeds, the other sees "Those rooms were just taken".
- **Tests:** manual, including the two-browser race; record in `verify.md`.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md` (HoldTimer, PriceBreakdown); `NP/UX-PLAN.md` staff booking flow; `../TASKS.md` §7.

> **🧑 HUMAN CHECKPOINT — accessibility (WCAG 2.2.1) and copy**: the human tests the hold timer with a screen reader and keyboard (warning ≥ 20 s before expiry, one-click extend, at least 10 extensions, form kept after expiry) and approves all booking copy, including the price breakdown labels ("CGST 2.5%", "SGST 2.5%") and the confirm button text. Approved = timing behaviour and copy accepted.

### P4-T10 — P4 exit review

- **Goal:** prove P4 is complete.
- **Depends on:** P4-T01 … P4-T09.
- **Files to create/modify:** docs only.
- **Steps:**
  1. Run all verification commands and the concurrency suite 5 times.
  2. With a local replica set (`mongod --replSet rs0` + `rs.initiate()`, or the project's documented setup), walk through: quote → hold → extend → confirm; hold → let expire → check inventory restored within one job interval; OPTIONAL booking auto-release (set `releaseAt` 2 minutes ahead).
  3. Check audit entries exist for hold create/extend/expire and booking create.
- **Acceptance criteria:** all P4 exit criteria met.
- **Tests:** full suite.
- **Verification:** all three commands.
- **Docs to update:** `../TASKS.md` (TB S2-1, S2-2, S2-5 ticked with evidence), `../API.md`, `../DATA_MODEL.md`, `../MVP.md` exit-criteria evidence.

> **🧑 HUMAN CHECKPOINT — phase gate (concurrency, tax)**: the human confirms the tax checkpoint (P4-T01) is signed, the concurrency suite is green on their machine, and the staff flow works end to end. Approved = P4 accepted; P5 may start.

---

<a id="p5"></a>

## P5 — Guest booking web (MVP)

- **Goal:** a new public, mobile-first `apps/guest-web` where a guest searches by city, dates and guests, opens a hotel, chooses a room, holds it, enters details and gets a booking reference — all prices and availability from the server.
- **Entry criteria:** P4 exit checkpoint approved.
- **Exit criteria:**
  - Public endpoints for cities, search, hotel availability, quote, hold (create/read/extend/release), booking create and booking read exist, are rate-limited and documented.
  - Guest web pages work at 375px and desktop, keyboard accessible, with basic SEO.
  - Guest holds and bookings are protected by unguessable tokens (a booking reference alone never shows a booking).
  - Structure, abuse-control and SEO checkpoints approved.
- **Note on email:** the confirmation email is built in P6 (P6-T08). Until then the confirmation page is the only receipt; P5's page must show the reference and a link the guest can bookmark.

### P5-T01 — Decide the guest-web structure and scaffold `apps/guest-web`

- **Goal:** an empty, running Vite + React + TypeScript + Tailwind v4 app that matches the brand.
- **Depends on:** P4 done.
- **Files to create/modify:**
  - `apps/guest-web/package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `src/main.tsx`, `src/App.tsx`, `src/styles.css` — **create** (copy the shape of `apps/admin-web/package.json`, `vite.config.ts`, `tsconfig*.json`).
  - Root `package.json` — **modify**: `"start:guest": "npm --workspace=apps/guest-web run dev"`; add `guest` to the `dev` concurrently command.
  - `.env.example` — **modify**: add `http://localhost:5174` to `CORS_ORIGINS`; `VITE_API_BASE_URL` note for guest web.
  - `apps/api/src/common/config/configuration.ts` — **modify**: default `CORS_ORIGINS` includes `http://localhost:5174`.
- **Steps:**
  1. **Decision (checkpoint below):** option A — copy tokens and helpers; option B — create `packages/ui-tokens` (CSS `@theme` file) and `packages/shared-utils` (`money.ts`, `cn.ts`) used by both apps. **Default suggestion: A** for the MVP (fewer moving parts), with a header comment "Copied from apps/admin-web/… keep in sync".
  2. `package.json` scripts: `"dev": "vite --host 0.0.0.0 --port 5174"`, `"build": "tsc -b && vite build"`, `"preview": "vite preview --port 5174"`. Dependencies: `react`, `react-dom`, `react-router-dom`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `vite`. **Pin exact versions** to the ones installed for admin-web (read them from `node_modules/<pkg>/package.json`); do not use `latest`.
  3. `src/styles.css`: copy the Google Fonts import and the whole `@theme { … }` block from `apps/admin-web/src/styles.css`.
  4. Copy `apps/admin-web/src/utils/money.ts` → `apps/guest-web/src/utils/money.ts` and `utils/cn.ts`.
  5. `App.tsx`: `BrowserRouter` with a placeholder Home page "Staywise — find a stay".
- **Acceptance criteria:** `npm run start:guest` serves on `http://localhost:5174`; `cd apps/guest-web && npx tsc -b` passes; the page uses the brand font and colours.
- **Tests:** manual.
- **Verification:** `cd apps/guest-web && npx tsc -b`.
- **Docs to update:** `../ARCHITECTURE.md` (Suggested project structure + new decision ADR-014 "Guest web app"); `../GUIDES.md` (how to run); `NP/UI-PLAN.md` (guest tokens).

> **🧑 HUMAN CHECKPOINT — architecture decision**: choose option A (copy tokens/helpers) or B (shared packages), and approve pinning exact dependency versions. Approved = choice recorded as ADR-014.

### P5-T02 — Public search, cities and hotel availability API

- **Goal:** guests find bookable room types for their dates.
- **Depends on:** P5-T01 (CORS), P4-T02.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/public-search.service.ts` — **create**.
  - `apps/api/src/modules/bookings/public.controller.ts` — **create** (`@Controller()`; no guard; `@ApiTags('Public')`).
  - `apps/api/src/modules/bookings/dto/public-search.dto.ts` — **create**.
  - `apps/api/src/modules/hotels/schemas/hotel.schema.ts` — **modify**: index `{ status: 1, 'address.city': 1 }` exists (`hotel_status_city`); add a collation-insensitive lookup by storing `cityKey` (lowercase trimmed city) with index `{ status: 1, cityKey: 1 }`, set in `create`/`update` normalisation (`normalizeAddress` in `hotel.policies.ts`), and backfill script `apps/api/src/scripts/backfill-city-key.ts`.
  - `apps/api/src/modules/bookings/public-search.service.spec.ts` — **create**.
- **Steps:**
  1. `GET /api/v1/public/cities` → distinct cities of `PUBLISHED` hotels, sorted (max 200).
  2. `GET /api/v1/search?city=&checkIn=&checkOut=&adults=&children=&rooms=&limit=&offset=`:
     - DTO: `city` 1–120 chars; dates `YYYY-MM-DD`; `adults` 1–60; `children` 0–40; `rooms` 1–10; `limit` 1–20 (default 10).
     - find `PUBLISHED` hotels by `cityKey`; for each, active room types where `maxAdults * rooms >= adults` and `maxChildren * rooms >= children`;
     - load nights for all candidate room types in **one** query; keep room types where every night exists, is not closed, has `available >= rooms`, and the check-in night's `minStay` / `cutoffDays` pass;
     - quote each remaining room type with `QuoteService` logic but **without** per-room DB calls (pass in the loaded nights and `RateResolver` results — refactor `QuoteService` into `buildQuote(nights, prices, …)` pure + loaders);
     - response: `{ items: [{ hotel: { slug, name, city, starRating, coverPhotoUrl }, lowestTotalMinor, currency, offers: [{ roomTypeId, name, maxAdults, maxChildren, availableRooms (capped at 5 → "5+"), totals, nightsCount }] }], total, quotedAt }`;
     - hotels with no bookable room are omitted; sort by `lowestTotalMinor` ascending.
  3. `GET /api/v1/hotels/:slug/availability?checkIn&checkOut&adults&children&rooms` → same offer shape for one hotel, **including** unbookable room types with `reasons` (`SOLD_OUT`, `CLOSED`, `MIN_STAY`, `CUTOFF`, `OCCUPANCY`) so the hotel page can say why.
  4. Results are **indicative**; the hold re-checks everything (`../API.md` "Search response essentials").
  5. Hotel-local today is per hotel (`hotel.timezone`); a `checkIn` before that hotel's local today → that hotel is skipped (search) or `422 INVALID_STAY_DATES` (availability).
- **Acceptance criteria:** only hotels with every night available appear; occupancy filter works; a closed night removes the room; the number of DB queries does not grow per room type (one nights query, two rate queries per request).
- **Tests:** `public-search.service.spec.ts`: two hotels in one city, one sold out on one night; occupancy; min stay; case-insensitive city.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- public-search`.
- **Docs to update:** `../API.md` (`GET /search` status, new public endpoints); `../modules/guest-search.md`; `../TASKS.md` §6 TB S1-9.

> **🧑 HUMAN CHECKPOINT — data migration**: the `cityKey` backfill script changes existing hotel documents. The human reviews the script (idempotent, only sets `cityKey`, prints counts) and runs it on the dev DB. Approved = script reviewed and run on dev only; production run is part of P6 launch.

### P5-T03 — Public quote, hold and booking API with guest tokens

- **Goal:** guests hold and book without an account, securely.
- **Depends on:** P5-T02, P4-T07.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/public.controller.ts` — **modify**.
  - `apps/api/src/modules/bookings/dto/public-booking.dto.ts` — **create**.
  - `apps/api/src/modules/bookings/holds.service.ts`, `bookings.service.ts` — **modify**: accept `channel: 'GUEST_WEB'`, issue tokens.
  - `apps/api/src/modules/bookings/guest-tokens.ts` — **create**: `newToken()` (32 random bytes, base64url), `hashToken()` (= `digest`), `tokenMatches(raw, hash)` (`crypto.timingSafeEqual` on equal-length buffers).
  - `apps/api/src/modules/bookings/public-booking.spec.ts` — **create**.
- **Steps:**
  1. `POST /api/v1/quotes` — body: `hotelSlug`, `roomTypeId`, dates, guests, rooms → `QuoteResult` (no inventory change).
  2. `POST /api/v1/holds` — header `Idempotency-Key`; body as quote → creates a `GUEST_WEB` hold (TTL from config), returns `{ holdId, holdToken, expiresAt, extendsLeft, quote }`. Only `holdTokenHash` is stored. The idempotent replay returns the same hold **without** the token (`holdToken: null`) unless the request includes the original token in `X-Hold-Token`; the client must keep the token from the first response.
  3. `GET /api/v1/holds/:holdId`, `POST /api/v1/holds/:holdId/extend`, `POST /api/v1/holds/:holdId/release` — require header `X-Hold-Token`; wrong/missing → `404 NOT_FOUND` (don't reveal existence).
  4. `POST /api/v1/bookings` — header `Idempotency-Key`; body `{ holdId, holdToken, guest: GuestDto }`; status is always `CONFIRMED`, payment `PENDING` / `PAY_AT_HOTEL` (server decides; the body cannot set them). Response `{ reference, accessToken, booking: GuestBookingView }`. Store `accessTokenHash` and `accessTokenExpiresAt = checkOut + 30 days (end of day, hotel time zone)`.
  5. `GET /api/v1/bookings/:reference?t=<accessToken>` → `GuestBookingView` (hotel snapshot, stay, room, nights, totals, policy snapshot, guest name, masked phone `+91 98•••••210`, booking status, payment status). Wrong token or expired → `404`.
  6. `GuestBookingView` never includes internal ids other than `reference`, staff ids, audit data, `holdId`, token hashes.
  7. Audit entries use `actorType: 'GUEST'`, no personal data in metadata.
- **Acceptance criteria:**
  - A booking cannot be read with the reference alone, or with another booking's token.
  - A hold cannot be converted or extended without its token.
  - The guest cannot choose status, payment status or price (extra body fields → `400` from `forbidNonWhitelisted`).
- **Tests:** `public-booking.spec.ts`: full flow; wrong tokens; replay with same idempotency key; body tampering.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- public-booking`.
- **Docs to update:** `../API.md` (holds, bookings guest endpoints; `X-Hold-Token`; `?t=`); `../modules/bookings.md`; `../modules/guest-accounts.md` (guest checkout access); `../ARCHITECTURE.md` ADR-005 status.

> **🧑 HUMAN CHECKPOINT — security review (guest access)**: review token generation, hashing, timing-safe compare, `404` on wrong tokens, the 30-day access window, and the masked fields in `GuestBookingView`. Approved = security reviewer signs off (ADR-005 moves to Decided).

### P5-T04 — Rate limiting and abuse controls for public endpoints

- **Goal:** stop scraping, hold-flooding and booking spam.
- **Depends on:** P5-T03.
- **Files to create/modify:**
  - `apps/api/package.json` — **modify**: add `@nestjs/throttler` (exact version compatible with Nest 11).
  - `apps/api/src/modules/bookings/bookings.module.ts` — **modify**: `ThrottlerModule.forRoot(...)` (or in `app.module.ts`), `@Throttle` on public routes.
  - `apps/api/src/main.ts` — **modify**: `app.set('trust proxy', <config>)` if deployed behind a proxy (config `TRUST_PROXY`, default off).
  - `apps/api/src/modules/bookings/holds.service.ts` — **modify**: per-client active-hold cap.
- **Steps:**
  1. Limits (per IP, proposals): `GET /search` and `/hotels/:slug/availability` 60/min; `POST /quotes` 30/min; `POST /holds` 10/min; hold extend/release 30/min; `POST /bookings` 5/min; `GET /bookings/:reference` 20/min. Exceeded → `429` with body `{ errorCode: 'RATE_LIMITED' }` (map the throttler exception in `AllExceptionsFilter` if its body differs).
  2. Active guest holds per IP ≤ 3 (count `ACTIVE` `GUEST_WEB` holds with `clientKey = digest(ip)` stored on the hold) → `429 TOO_MANY_HOLDS`.
  3. Honeypot: `CreateBookingDto` (public) gets `@IsOptional() @IsEmpty() website?: string`; the guest form renders a visually hidden `website` input (`tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`). A filled value fails validation with `400 VALIDATION_FAILED`; log a counter (no personal data).
  4. CAPTCHA: **not** built unless the checkpoint says so; if chosen, add the provider's server-side verify call **before** creating the hold (outside any transaction) behind config `CAPTCHA_PROVIDER`.
- **Acceptance criteria:** the 11th hold in a minute from one IP → `429`; a 4th concurrent active hold → `429 TOO_MANY_HOLDS`; admin endpoints are not throttled by these rules.
- **Tests:** unit test of the hold cap in `public-booking.spec.ts`; throttler checked manually with a small loop script (`curl` ×11).
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- public-booking`.
- **Docs to update:** `../guidelines/backend.md` security (limits); `../API.md` (429 codes); `.env.example`.

> **🧑 HUMAN CHECKPOINT — security decision (rate limits and CAPTCHA)**: approve the limits, the 3-active-holds cap, and decide CAPTCHA: none for launch / Cloudflare Turnstile / hCaptcha / reCAPTCHA. Approved = values and decision recorded in `../guidelines/backend.md`.

### P5-T05 — Guest web foundation (API client, layout, SEO helper)

- **Goal:** shared building blocks for the guest pages.
- **Depends on:** P5-T01.
- **Files to create/modify** (under `apps/guest-web/src/`):
  - `api/client.ts` — `request<T>()` (no CSRF, no credentials; JSON; parses `{ errorCode, message, errors, details }` into `ApiError` like `apps/admin-web/src/api/errors.ts`).
  - `api/public.api.ts` — typed calls for every P5-T02/T03 endpoint.
  - `components/` — `Button.tsx`, `Field.tsx`, `Input.tsx`, `Select.tsx`, `DatePicker.tsx` (copy of `apps/admin-web/src/components/ui/DatePicker.tsx`), `DateRangeField.tsx` (two `DatePicker`s, check-out min = check-in + 1), `GuestsField.tsx` (adults/children/rooms steppers with `aria-label`s), `Alert.tsx`, `Spinner.tsx`, `Price.tsx` (uses `formatMoney`). Copy styles from the admin primitives; keep one component per file.
  - `layout/SiteLayout.tsx` — header (logo, "Find a stay"), footer (contact, policies links), skip link "Skip to content".
  - `hooks/useDocumentMeta.ts` — sets `document.title` and `<meta name="description">` per page.
  - `routes.tsx` — `/`, `/search`, `/hotels/:slug`, `/checkout/:holdId`, `/booking/:reference`, `*` (not found).
- **Steps:** mobile-first Tailwind (base styles for 375px, `sm:`/`lg:` for larger); touch targets ≥ 44px; `lang="en-IN"` on `<html>`.
- **Acceptance criteria:** navigating between placeholder routes works; Lighthouse accessibility ≥ 90 on the empty layout.
- **Tests:** manual.
- **Verification:** `cd apps/guest-web && npx tsc -b`.
- **Docs to update:** `apps/guest-web/README.md` is **not** needed; record components in `NP/UI-PLAN.md` (guest components) if present.

### P5-T06 — Home search and results pages

- **Goal:** search by city, dates and guests; see bookable hotels with totals.
- **Depends on:** P5-T02, P5-T05.
- **Files to create/modify:** `apps/guest-web/src/pages/HomePage.tsx`, `SearchResultsPage.tsx`, `components/SearchForm.tsx`, `components/HotelResultCard.tsx`.
- **Steps:**
  1. `SearchForm`: city (combobox from `/public/cities`), check-in/check-out (min = today in `Asia/Kolkata` for the UI; the server is the authority), guests & rooms; submit → `/search?city=&checkIn=&checkOut=&adults=&children=&rooms=` (all state in the URL).
  2. Results: list of `HotelResultCard` (photo, name, stars, city, "from ₹x total for 2 nights incl. GST", "Only 2 rooms left" when `availableRooms <= 2`, button "See rooms" → `/hotels/:slug?<same params>`). Loading skeletons; empty state "No hotels available for these dates. Try other dates."; error `Alert`.
  3. Validation messages on the form for missing city / dates / check-out before check-in.
- **Acceptance criteria:** changing dates updates the URL and results; back button restores the previous search; works at 375px.
- **Tests:** manual.
- **Verification:** `cd apps/guest-web && npx tsc -b`.
- **Docs to update:** `NP/UX-PLAN.md` guest search (if present).

### P5-T07 — Hotel page with room choice

- **Goal:** show the hotel and its rooms for the chosen dates.
- **Depends on:** P5-T06, P3-T09.
- **Files to create/modify:** `apps/guest-web/src/pages/HotelPage.tsx`, `components/PhotoGallery.tsx`, `components/RoomOfferCard.tsx`, `components/PolicySummary.tsx`.
- **Steps:**
  1. Load `GET /hotels/:slug` and, when dates are in the URL, `GET /hotels/:slug/availability`. Without dates show the room list with "Choose dates to see prices" and the `SearchForm`.
  2. Sections: gallery (keyboard-operable, `alt` from captions, fallback "Photo of <hotel>"), name, stars, address, check-in/out times, amenities, child policy, map link (`https://www.google.com/maps?q=lat,lng`), cancellation summary in plain words (e.g. "Free cancellation until 48 hours before check-in. After that: 1 night's charge." built from the policy fields), rooms.
  3. `RoomOfferCard`: name, capacity, beds, total with "incl. GST", per-night range, reasons when not bookable, button "Reserve" → creates the hold (P5-T08) and navigates to `/checkout/:holdId`, keeping `holdToken` in `sessionStorage` (`staywise-hold-<holdId>`, wrapped in `try/catch`; if storage fails, keep it in memory and warn that refreshing will lose the hold).
  4. `useDocumentMeta`: title "<Hotel> in <City> — Staywise", description from the first 150 chars of the description.
- **Acceptance criteria:** prices shown equal the server quote; unbookable rooms explain why; Reserve on a just-sold room shows "This room was just booked. Choose another room."
- **Tests:** manual.
- **Verification:** `cd apps/guest-web && npx tsc -b`.
- **Docs to update:** `NP/UX-PLAN.md` hotel page (if present).

### P5-T08 — Checkout: hold, guest details, confirm

- **Goal:** the guest finishes the booking within the hold, with accessible timing.
- **Depends on:** P5-T03, P5-T07.
- **Files to create/modify:** `apps/guest-web/src/pages/CheckoutPage.tsx`, `components/GuestDetailsForm.tsx`, `components/HoldTimer.tsx` (copy of the admin `HoldTimer` with guest copy), `components/PriceBreakdown.tsx`.
- **Steps:**
  1. Load the hold with `X-Hold-Token`; if missing/expired → message + "Back to the hotel".
  2. Layout: summary card (hotel, dates, room, guests, `PriceBreakdown` per night with GST lines and total), the cancellation terms, the guest form (full name, mobile, email — **required for guests** so P6 can send the confirmation; optional business details), and the hold indicator "Room held · 9:32" with "Keep holding" at ≤ 60 s.
  3. "Confirm booking — pay ₹x at the hotel" button (`Idempotency-Key` generated when the page loads). Text under it: "No payment now. You pay at the hotel."
  4. On expiry: keep the form, show "Room no longer held — check availability again." with "Hold again".
  5. On success: clear the hold token, save `{ reference, accessToken }` to `sessionStorage`, navigate to `/booking/:reference?t=<accessToken>`.
  6. If P4-T01's tax checkpoint is not signed yet, show "Taxes estimated" next to the GST lines.
- **Acceptance criteria:** booking succeeds end to end on a phone; double tap creates one booking; expiry behaves as specified; the email field is required in the guest flow.
- **Tests:** manual on desktop + phone emulation; two-browser last-room race.
- **Verification:** `cd apps/guest-web && npx tsc -b`.
- **Docs to update:** `NP/UX-PLAN.md` checkout copy (if present).

> **🧑 HUMAN CHECKPOINT — product decision and copy**: confirm email is required for guest bookings (phone required too), the "pay at the hotel" wording, and the checkout copy. Approved = copy accepted.

### P5-T09 — Confirmation page and booking view

- **Goal:** the guest sees the reference and can come back to the booking.
- **Depends on:** P5-T08.
- **Files to create/modify:** `apps/guest-web/src/pages/BookingPage.tsx`.
- **Steps:**
  1. Load `GET /bookings/:reference?t=`; show: "Booking confirmed" heading, reference (large, copy button), hotel, address + map link, dates with check-in/out times, room, guests, price breakdown, "Pay at the hotel", cancellation terms, hotel contact.
  2. Text: "Bookmark this page to see your booking again." (until P6 email exists) and, after P6, "We've emailed a confirmation to <email>".
  3. Missing/invalid token → "We couldn't find this booking. Check the link in your confirmation."
  4. `useDocumentMeta` with `noindex` (add `<meta name="robots" content="noindex">` for booking and checkout pages).
- **Acceptance criteria:** refreshing the page works; the page is not indexable; no internal ids shown.
- **Tests:** manual.
- **Verification:** `cd apps/guest-web && npx tsc -b`.
- **Docs to update:** `../TASKS.md` §2 (guest booking access lines with evidence).

### P5-T10 — Mobile, accessibility and SEO pass

- **Goal:** the guest web is usable and findable.
- **Depends on:** P5-T06 … P5-T09.
- **Files to create/modify:** `apps/guest-web/public/robots.txt` (allow `/`, `/hotels/`; disallow `/checkout/`, `/booking/`), `apps/guest-web/index.html` (default title/description, `theme-color`, Open Graph basics), fixes from the pass.
- **Steps:**
  1. Lighthouse (mobile) on Home, Results, Hotel, Checkout: accessibility ≥ 90, best practices ≥ 90; fix issues found.
  2. Keyboard-only booking; screen reader pass of the hold warning.
  3. SEO: the SPA renders client-side, so search engines see limited content; document the options for later (prerendering hotel pages at build time, or SSR).
- **Acceptance criteria:** scores met; no horizontal scroll at 375px; all form errors announced.
- **Tests:** manual; record scores in `verify.md`.
- **Verification:** `cd apps/guest-web && npx tsc -b`.
- **Docs to update:** `../guidelines/frontend-ui.md` guest experience; `NP/UX-PLAN.md`.

> **🧑 HUMAN CHECKPOINT — accessibility review and SEO decision**: the human does the keyboard and screen-reader booking and decides whether client-side rendering is acceptable for launch or hotel pages need prerendering. Approved = no accessibility blocker; SEO decision recorded.

### P5-T11 — P5 exit review

- **Goal:** prove P5 is complete.
- **Depends on:** P5-T01 … P5-T10.
- **Files to create/modify:** docs only.
- **Steps:** search → hotel → reserve → book on a phone; read the booking with the link; try the reference without the token; exceed the hold rate limit; staff see the booking's inventory in the grid.
- **Acceptance criteria:** all P5 exit criteria met.
- **Tests:** full API suite.
- **Verification:** all verification commands including guest web.
- **Docs to update:** `../TASKS.md` §2, §6, §7; `../API.md`.

> **🧑 HUMAN CHECKPOINT — phase gate**: the human books as a guest on a real phone. Approved = P5 accepted; P6 may start.

---

<a id="p6"></a>

## P6 — Booking management + MVP launch

- **Goal:** staff find and manage every booking (list, detail, cancel with fee preview, no-show, check-in/out, payment collected), see a booking calendar built on the P2 grid, guests get a confirmation email, and the platform is hardened for launch.
- **Entry criteria:** P5 exit checkpoint approved.
- **Exit criteria:**
  - Bookings list (hotel and "All hotels"), detail with timeline, and all MVP lifecycle actions work with audit and inventory release exactly once.
  - Booking calendar works (room type × night sold/held/free).
  - Confirmation and cancellation emails are sent through an outbox outside transactions.
  - Launch hardening checklist complete and signed (backups + restore test, monitoring, rollback rehearsal, security review).
  - `../MVP.md` exit criteria all have evidence.

### P6-T01 — Bookings list API (hotel and portfolio)

- **Goal:** search and filter bookings within scope.
- **Depends on:** P5 done.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/dto/booking-query.dto.ts` — **create**.
  - `apps/api/src/modules/bookings/booking-query.service.ts` — **create**.
  - `apps/api/src/modules/bookings/admin-bookings.controller.ts` — **modify**: `GET /admin/hotels/:hotelId/bookings`.
  - `apps/api/src/modules/bookings/admin-portfolio.controller.ts` — **create**: `@Controller('admin/bookings')`, `GET /`.
  - `apps/api/src/modules/bookings/booking-query.service.spec.ts` — **create**.
- **Steps:**
  1. Query DTO: `search` (≤ 100), `status` (comma list of booking statuses), `paymentStatus`, `roomTypeId`, `dateField` (`checkIn` | `checkOut` | `createdAt`, default `checkIn`), `from`, `to` (`YYYY-MM-DD`), `night` (`YYYY-MM-DD`: bookings staying that night, i.e. `checkIn <= night < checkOut`), `hotelId` (portfolio only), `sort` (`checkIn` | `-createdAt`), `limit` ≤ 100 (default 25), `offset`.
  2. Scope: hotel route → guard checks `:hotelId`; portfolio route → super admin any / others `hotelId: { $in: actor.hotelIds }`; a given `hotelId` outside scope → `403`.
  3. Search: if it matches `^SW-?[2-9A-Z]{6}$` → exact reference (normalise the dash); digits only (≥ 4) → `guest.phone` ends-with (escaped regex `\d+$` anchored at end); contains `@` → exact lowercased email; otherwise case-insensitive escaped regex on `guest.fullName` (prefix match `^` for index friendliness).
  4. Row shape: `{ id, reference, hotelId, hotelName, roomTypeName, checkIn, checkOut, nights, quantity, guestName, guestPhoneMasked, status, paymentStatus, grandTotalMinor, currency, createdAt }`.
- **Acceptance criteria:** scope enforced; each filter works alone and combined; `night` filter returns in-house bookings for that date.
- **Tests:** `booking-query.service.spec.ts`.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- booking-query`.
- **Docs to update:** `../API.md` (`GET /admin/bookings`, `GET /admin/hotels/:hotelId/bookings`); `../modules/bookings.md`.

### P6-T02 — Booking detail and timeline API

- **Goal:** everything staff need about one booking.
- **Depends on:** P6-T01.
- **Files to create/modify:** `apps/api/src/modules/bookings/booking-query.service.ts`, `admin-bookings.controller.ts`.
- **Steps:**
  1. `GET /api/v1/admin/hotels/:hotelId/bookings/:bookingId`, permission `bookings.view`; the booking must belong to `hotelId` (`404`).
  2. Response: the booking document (all snapshots, guest with full phone/email for staff), plus `timeline` = `statusHistory` merged with audit entries for this booking (`resourceType: 'BOOKING'`, `resourceId`) and the payment events, sorted by time, each `{ at, kind: 'STATUS' | 'PAYMENT' | 'NOTE' | 'EMAIL', label, by }`, plus `allowedActions: string[]` computed from the state machines and permissions (e.g. `['CHECK_IN', 'CANCEL', 'NO_SHOW', 'MARK_PAID']`).
  3. Viewing a booking is **not** audited in the MVP (too noisy); revisit with the DPDP work in P8.
- **Acceptance criteria:** `allowedActions` matches the state machine for each status; wrong hotel → `404`.
- **Tests:** add to `booking-query.service.spec.ts`.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- booking-query`.
- **Docs to update:** `../API.md`.

### P6-T03 — Lifecycle actions: cancel (with fee preview), no-show, check-in, check-out, payment collected, complete, confirm optional

- **Goal:** authorised, audited transitions that release inventory exactly once.
- **Depends on:** P6-T02.
- **Files to create/modify:**
  - `apps/api/src/modules/bookings/cancellation-fee.ts` — **create** (pure).
  - `apps/api/src/modules/bookings/booking-actions.service.ts` — **create**.
  - `apps/api/src/modules/bookings/dto/booking-action.dto.ts` — **create**.
  - `apps/api/src/modules/bookings/admin-bookings.controller.ts` — **modify**.
  - `apps/api/src/modules/bookings/cancellation-fee.spec.ts`, `booking-actions.service.spec.ts` — **create**.
- **Steps:**
  1. **Fee calculation** (`cancellation-fee.ts`), from the booking's `policySnapshot` only (never the hotel's current policy):
     - `checkInInstant` = check-in date at `policySnapshot.checkInTime ?? '14:00'` in `policySnapshot.timezone`, converted to UTC (write a helper `zonedDateTimeToUtc(date, time, tz)` using `Intl.DateTimeFormat` offset lookup; test it for `Asia/Kolkata`);
     - `hoursBefore = (checkInInstant - now) / 3_600_000`;
     - `hoursBefore >= freeCancellationHoursBeforeCheckIn` → fee 0, rule `FREE_WINDOW`;
     - else apply `afterCutoff`: `NO_FEE` → 0; `FULL_STAY` → `totals.grandTotalMinor`; `FIXED_MINOR_UNITS` → `min(amountMinorUnits, grandTotal)`; `PERCENTAGE_BPS` → `roundHalfUpDiv(grandTotal * bps, 10000)`;
     - no-show uses `noShow` the same way;
     - returns `{ feeMinor, rule, hoursBefore, basis }`.
  2. Endpoints (all under `/api/v1/admin/hotels/:hotelId/bookings/:bookingId/`, booking must belong to the hotel, body always has `version` and, where stated, `reason` 3–500):
     - `GET cancel-preview` (`bookings.view`) → `{ feeMinor, rule, currency, refundNote: 'Pay-at-hotel booking: no payment to refund.' }`;
     - `POST cancel` (`bookings.manage`): body `{ version, reason, expectedFeeMinor }`; recompute the fee; if it differs from `expectedFeeMinor` → `409 FEE_CHANGED` with the new preview (the policy window may have passed while the dialog was open); allowed from `OPTIONAL` and `CONFIRMED`;
     - `POST no-show` (`bookings.manage`): `{ version, reason?, expectedFeeMinor }`; allowed from `CONFIRMED` when hotel-local today ≥ `checkIn`;
     - `POST check-in` (`bookings.manage`): `{ version }`; allowed from `CONFIRMED` when `checkIn <= localToday < checkOut`;
     - `POST check-out` (`bookings.manage`): `{ version }`; from `CHECKED_IN`;
     - `POST payment/collected` (`bookings.manage`): `{ version, amountMinor, via: 'CASH' | 'UPI' | 'CARD' | 'OTHER', reason? }`; payment `PENDING → CAPTURED` when `amountMinor === amountDueMinor` (partial amounts → `422 PARTIAL_PAYMENT_NOT_SUPPORTED` in the MVP); this is an **offline record**, no gateway;
     - `POST complete` (`bookings.manage`): `{ version }`; `CHECKED_OUT → COMPLETED` only when payment is `CAPTURED` or `NOT_REQUIRED` (`409 PAYMENT_OUTSTANDING`);
     - `POST confirm` (`bookings.manage`): `{ version }`; `OPTIONAL → CONFIRMED`, clears `releaseAt`.
  3. Each action in one transaction: conditional update `{ _id, version, status: <from> }` → `$set` new status (+ cancellation/noShow/payment fields), `$push: { statusHistory }`, `$inc: { version: 1 }`; `null` → re-read and return `409 VERSION_CONFLICT` or `409 INVALID_BOOKING_TRANSITION`. Audit `booking.<action>` with reason and fee.
  4. **Inventory release:** cancel releases **all** nights (`confirmed -= quantity` with `confirmed: { $gte: q }` guard); no-show releases nights with `stayDate >= localToday` (past nights stay counted); check-in/out/complete change no inventory. Because the status change is conditional, release happens once.
  5. After cancel: enqueue a cancellation email (P6-T08 outbox) **inside** the transaction as a `Notification` document (no network call).
- **Acceptance criteria:**
  - Fee preview matches the fee charged; a stale dialog gets `409 FEE_CHANGED`.
  - Cancelling twice (parallel) releases inventory once.
  - Each forbidden transition returns `409 INVALID_BOOKING_TRANSITION`.
  - `complete` refused while payment is `PENDING`.
- **Tests:** `cancellation-fee.spec.ts` (free window, each basis, boundary exactly at the cutoff hour counts as free, IST conversion); `booking-actions.service.spec.ts` (each action, parallel cancel, inventory counts).
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- cancellation-fee`; `npm --workspace=apps/api run test -- booking-actions`.
- **Docs to update:** `../API.md` (replace the planned `POST /admin/bookings/:id/transitions` with these endpoints); `../modules/bookings.md`, `../modules/cancellation-policies.md`; `../TASKS.md` §7 TB S2-4.

> **🧑 HUMAN CHECKPOINT — money and policy rules**: confirm (a) the fee base is the grand total including GST, (b) default check-in time 14:00 when the hotel hasn't set one, (c) the boundary (exactly at the cutoff = free), (d) no-show releases only today and future nights, (e) pay-at-hotel fees are recorded as "amount owed", not collected automatically, (f) partial payments are out of the MVP. Approved = rules accepted and written into `../modules/cancellation-policies.md`.

### P6-T04 — Bookings list pages (`/admin/bookings` and `/admin/hotels/:hotelId/bookings`)

- **Goal:** find any booking in seconds.
- **Depends on:** P6-T01, P1-T05.
- **Files to create/modify:**
  - `apps/admin-web/src/features/bookings/bookings.api.ts` — **modify**: `listBookings`, `listHotelBookings`, `getBooking`, action calls.
  - `apps/admin-web/src/features/bookings/BookingsTable.tsx`, `BookingFiltersBar.tsx`, `BookingStatusBadges.tsx` — **create**.
  - `apps/admin-web/src/pages/bookings/BookingsPage.tsx` (portfolio), `apps/admin-web/src/pages/hotels/tabs/HotelBookingsTab.tsx` — **create**.
  - `apps/admin-web/src/routes/*`, `features/hotels/HotelTabsNav.tsx` — **modify**: `/admin/bookings` (`bookings.view`, nav "Bookings"), hotel tab "Bookings" → `bookings`.
- **Steps:**
  1. Filters in the URL: search (`Input` with `Search` icon, placeholder "Reference, guest name, phone or email"), status (`Select` multi via checkboxes in a popover or a `Select` with common sets: Upcoming, In house, Cancelled, No-show, All), dates (`DatePicker` from/to + "Arrivals today", "Departures today" quick buttons), room type (hotel page only), payment status. Portfolio page: hotel comes from the switcher (`?hotelId=`), "All hotels" adds a Hotel column.
  2. `BookingStatusBadges`: booking status and payment status as **two separate** badges with text (e.g. "Confirmed" + "Pay at hotel · due"; "Cancelled" + "Fee ₹2,000 owed").
  3. Columns: Reference (mono), Guest, Dates ("21–23 Oct · 2 nights"), Room ("Deluxe ×1"), Total, Status badges, Created. Row click → detail.
  4. "New booking" button on the hotel page (`bookings.create`).
- **Acceptance criteria:** searching a reference opens one row; "All hotels" shows hotel names; filters survive reload.
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `../guidelines/frontend-ui.md` "Booking directory".

### P6-T05 — Booking detail page

- **Goal:** one screen with the guest, stay, money, policy and history.
- **Depends on:** P6-T02, P6-T04.
- **Files to create/modify:** `apps/admin-web/src/pages/bookings/BookingDetailPage.tsx` (route `/admin/hotels/:hotelId/bookings/:bookingId`), `features/bookings/detail/BookingSummaryCard.tsx`, `GuestCard.tsx`, `PriceBreakdown.tsx` (reuse P4), `PolicySnapshotCard.tsx`, `BookingTimeline.tsx`, `BookingActionsBar.tsx`.
- **Steps:**
  1. Header: `PageHeading` eyebrow "BOOKING", title = reference, description = guest name · dates; `BookingStatusBadges`; actions from `allowedActions` (buttons hidden when not allowed; never computed on the client).
  2. Cards: stay & room; guest (phone with `tel:` link, email `mailto:`); price breakdown per night with CGST/SGST; payment (due, collected, via); policy snapshot in plain words with a note "Terms saved when the booking was made"; timeline (newest first).
  3. "Resend confirmation" (P6-T08) when an email exists.
- **Acceptance criteria:** all snapshot data shows even after the hotel changes its policy or prices (test by editing the policy).
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md`; `../guidelines/frontend-ui.md` "Booking detail".

### P6-T06 — Action dialogs (cancel with fee, no-show, check-in/out, payment collected)

- **Goal:** money impact shown before confirming; the hotel and booking are named.
- **Depends on:** P6-T03, P6-T05.
- **Files to create/modify:** `apps/admin-web/src/features/bookings/actions/CancelBookingDialog.tsx`, `NoShowDialog.tsx`, `CheckInOutDialog.tsx`, `PaymentCollectedDialog.tsx`, `ConfirmOptionalDialog.tsx`.
- **Steps:**
  1. **Cancel:** on open call `cancel-preview`; show "Cancel booking SW-7K3M9Q at Bell Hotel?", the fee ("Cancellation fee: ₹2,000 (after the free cancellation window)" or "No fee — within the free cancellation window"), "Pay-at-hotel booking: nothing to refund.", `ReasonField` required; button "Cancel booking · fee ₹2,000" (`danger sm`) — the outcome is in the label. On `409 FEE_CHANGED`, refresh the preview in place and show `Alert` "The fee changed because the free cancellation window ended."
  2. **No-show:** same pattern with the no-show fee.
  3. **Check-in / Check-out:** simple confirm dialogs naming guest and room.
  4. **Payment collected:** amount (read-only = amount due), method `Select`, optional note; button "Record ₹x collected".
  5. After each: toast, `invalidate('bookings', 'inventory-grid')`, reload the detail.
- **Acceptance criteria:** the fee shown equals the fee saved; every dialog names the booking and hotel; Cancel = `outline sm`, destructive = `danger sm`.
- **Tests:** manual (including the window-passing case by setting a short policy).
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `NP/UX-PLAN.md` action copy (if present).

> **🧑 HUMAN CHECKPOINT — copy and money display**: review all dialog wording and fee messages. Approved = copy accepted.

### P6-T07 — Booking calendar (reuses the P2 grid)

- **Goal:** room type × night view of sold / held / free, with links to the bookings behind each cell.
- **Depends on:** P2-T08, P6-T04.
- **Files to create/modify:**
  - `apps/admin-web/src/features/inventory/grid/InventoryGridCell.tsx` — **modify**: `mode='occupancy'` rendering ("3 sold · 1 held · 2 free", closed badge), no price.
  - `apps/admin-web/src/features/bookings/NightBookingsDrawer.tsx` — **create**: lists bookings for `roomTypeId` + `night` (`listHotelBookings({ roomTypeId, night })`).
  - `apps/admin-web/src/pages/hotels/tabs/HotelBookingsTab.tsx` — **modify**: `Tabs pills` "List" | "Calendar" (`?view=calendar`).
- **Steps:**
  1. Calendar uses `getInventoryGrid` (same endpoint, same window controls 7/14/30 and phone day list).
  2. Activating a cell (click / Enter) with sold rooms → `NightBookingsDrawer`; a cell with free rooms → "New booking" pre-filled: `/admin/hotels/:hotelId/bookings/new?checkIn=<night>&checkOut=<night+1>&roomTypeId=<id>`.
  3. No drag; no physical room assignment (out of MVP).
- **Acceptance criteria:** counts match the grid; the drawer lists exactly the bookings staying that night; the pre-filled new booking opens on step 2.
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `apps/admin-web/docs/components.md` (grid occupancy mode); `../guidelines/frontend-ui.md`.

### P6-T08 — Email confirmation via outbox (provider decision)

- **Goal:** guests (and optionally the hotel) get confirmation and cancellation emails, reliably and outside transactions.
- **Depends on:** P6-T03.
- **Files to create/modify:**
  - `apps/api/src/modules/notifications/` — **create**: `notifications.module.ts`, `schemas/notification.schema.ts`, `notification.worker.ts`, `email/email-provider.ts` (interface), `email/console-email.provider.ts` (dev: writes the HTML to `apps/api/tmp/emails/<id>.html` and logs the path), `email/<chosen>.provider.ts` (after the checkpoint), `templates/booking-confirmed.ts`, `templates/booking-cancelled.ts`.
  - `apps/api/src/modules/bookings/bookings.service.ts`, `booking-actions.service.ts` — **modify**: insert a `Notification` in the same transaction as booking create / cancel.
  - `apps/api/src/modules/bookings/admin-bookings.controller.ts` — **modify**: `POST .../bookings/:bookingId/resend-confirmation` (`bookings.manage`).
  - `apps/api/src/app.module.ts` — **modify**: import `NotificationsModule`.
  - `.gitignore` — **modify**: `apps/api/tmp/`.
- **Steps:**
  1. `Notification` (`collection: 'notifications'`): `bookingId`, `hotelId`, `channel: 'EMAIL'`, `template: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED'`, `to` (email), `status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED'`, `attempts`, `nextAttemptAt`, `lastError` (truncated, no PII), `providerMessageId`, timestamps. Index `{ status: 1, nextAttemptAt: 1 }`.
  2. Worker (every 15 s, like `HoldExpiryJob`): claim one at a time with `findOneAndUpdate({ status: 'QUEUED', nextAttemptAt: { $lte: now } }, { $set: { status: 'SENDING' }, $inc: { attempts: 1 } })`; render the template from the **booking snapshot**; call the provider **outside any transaction**; success → `SENT`; failure → back to `QUEUED` with backoff (1, 5, 15, 60 min), `FAILED` after 5 attempts. Also re-queue `SENDING` older than 10 min (crash recovery).
  3. Templates: plain, mobile-friendly HTML + text; content: reference, hotel, address, dates and times, room, guests, price breakdown with GST lines, "Pay at the hotel", cancellation terms, the guest booking link (`GUEST_WEB_BASE_URL` + `/booking/<reference>?t=<token>`). The raw access token is only known when the booking is created, so store it in the notification's `secret` field (same transaction) and `$unset` it once the notification is `SENT` or `FAILED`. Document this.
  4. Sending to guests without an email (staff bookings may have none) → skip (no notification row).
  5. Booking timeline shows email events (P6-T02 `kind: 'EMAIL'`).
- **Acceptance criteria:** creating a guest booking produces one `SENT` email (dev provider writes the HTML file); a provider failure retries with backoff; nothing calls the provider inside a transaction (reviewer checks); `secret` is removed after sending.
- **Tests:** `notification.worker.spec.ts` with a fake provider: success, retry, give-up, crash recovery, secret unset.
- **Verification:** `npx tsc --noEmit -p apps/api/tsconfig.json`; `npm --workspace=apps/api run test -- notification`.
- **Docs to update:** `../modules/notifications.md`; `../API.md`; `../ARCHITECTURE.md` (new ADR for the email provider); `.env.example` (`EMAIL_PROVIDER`, provider keys, `EMAIL_FROM`, `GUEST_WEB_BASE_URL`); `../TASKS.md` §9 TB S3-4 (email part).

> **🧑 HUMAN CHECKPOINT — provider decision, security and copy**: choose the email provider (e.g. Amazon SES, SendGrid, Postmark, or SMTP via Nodemailer), the sender domain (SPF/DKIM set up by the human), approve storing the guest link token in the outbox until sent, and approve the email copy. Approved = provider chosen and credentials added to the environment by the human (never committed); copy accepted.

### P6-T09 — Global booking search in the top bar

- **Goal:** find a booking from anywhere.
- **Depends on:** P6-T04.
- **Files to create/modify:** `apps/admin-web/src/layout/Topbar.tsx`.
- **Steps:** the search box gets a scope: if the text looks like a reference, phone or email, navigate to `/admin/bookings?search=<text>` (keeping `?hotelId=` from the switcher when in hotel mode); otherwise keep today's hotel search. Placeholder: "Search hotels or bookings…". Add a "+ New booking" button next to it when in hotel mode (`bookings.create`).
- **Acceptance criteria:** typing `SW-7K3M9Q` + Enter opens that booking in the list.
- **Tests:** manual.
- **Verification:** `cd apps/admin-web && npx tsc -b`.
- **Docs to update:** `../ANALYSIS.md` (top bar search note).

### P6-T10 — Launch hardening

- **Goal:** the platform can be run, watched, restored and rolled back safely.
- **Depends on:** P6-T01 … P6-T09.
- **Files to create/modify:**
  - `Documentation/GUIDES.md` (or `../modules/deployment-operations.md`) — runbooks (docs only).
  - `apps/api/src/scripts/ensure-indexes.ts` — **modify**: include `Hold`, `Booking`, `DailyRate`, `Notification`, new `NightInventory` and `AuditLog` indexes.
  - `apps/api/src/modules/health/health.service.ts` — **modify**: readiness reports replica-set status (`TransactionService.isReplicaSet()`), last successful hold-expiry and notification-worker tick (stale > 5 min → `degraded`), without secrets.
- **Steps (checklist — each item needs evidence in `.agent/work/<task-id>/verify.md`):**
  1. **Configuration:** production requires a replica set (already enforced by `TransactionService`), `CORS_ORIGINS` set, `SESSION_SECRET` ≥ 32 chars, `NODE_ENV=production`, Swagger disabled or protected in production (`main.ts` currently always mounts `/api/docs` — gate it with config).
  2. **Indexes:** `npm --workspace=apps/api run ensure:indexes` on staging; list indexes per collection.
  3. **Backups:** automated daily backups of the Mongo cluster with ≥ 7-day retention (Atlas or `mongodump` cron); **restore test**: restore last night's backup to a scratch cluster, run `verify:api`, record duration (RTO) and data age (RPO).
  4. **Monitoring:** uptime check on `/api/v1/health`; error-rate alert (5xx > 1% for 5 min); alerts on health `degraded`; log retention set; no PII in logs (spot-check 100 lines).
  5. **Rollback:** documented steps to redeploy the previous build; rehearse once on staging, including a schema-compatible rollback (new fields are additive).
  6. **Security review:** permissions table in [4.1](#41-security-and-permissions-per-endpoint) verified per endpoint (403 tests); dependency audit (`npm audit --omit=dev`); secrets only in env; CSRF and Origin checks on staff writes; rate limits on public routes; HTTPS and HSTS at the edge; upload limits (10 MB, JPEG/PNG/WebP).
  7. **Data:** production `cityKey` backfill (P5-T02) and `sync:permissions` run by the human with a backup taken first.
  8. **Load baseline:** 20 concurrent guests searching + 5 holding the same last room on staging; no 5xx; invariant holds (query all nights afterwards).
  9. **Support runbook:** how to find a booking, cancel on behalf of a guest, handle an email bounce, and handle an "inventory underflow" error log.
- **Acceptance criteria:** every checklist item has evidence or an explicit, approved deferral.
- **Tests:** health service unit test for `degraded`; the rest is operational evidence.
- **Verification:** all verification commands; staging checks as listed.
- **Docs to update:** `../modules/deployment-operations.md`, `../guidelines/testing-devops.md`, `../TASKS.md` §10 (TB S4-1, S4-2, S4-3 with evidence).

> **🧑 HUMAN CHECKPOINT — production readiness (backups, monitoring, rollback, security)**: the human (or ops owner) performs or witnesses the restore test and rollback rehearsal, owns production credentials and runs every production data step. The coding model never touches production. Approved = checklist signed with evidence.

### P6-T11 — MVP exit review and launch decision

- **Goal:** decide to launch with evidence.
- **Depends on:** P6-T10.
- **Files to create/modify:** `../MVP.md` (exit criteria evidence links), `../TASKS.md` (TB S4-4), `NP/MVP-PLAN.md` (status line).
- **Steps:**
  1. Map each `../MVP.md` exit criterion to its evidence: catalog publish (P1/P2 walkthrough), search correctness (P5-T02 tests), last-room safety (P4-T08), release once (P4-T05/P4-T08, P6-T03), server totals and snapshots (P4-T07), staff operations (P6), launch verification (P6-T10).
  2. List known gaps and their phase (P7/P8).
- **Acceptance criteria:** every criterion has a link to evidence.
- **Tests:** full suite one last time.
- **Verification:** all verification commands.
- **Docs to update:** as listed.

> **🧑 HUMAN CHECKPOINT — launch decision**: the product owner reviews the evidence table and decides go / no-go. Approved = go recorded with date in `../MVP.md` and `../HISTORY.md`.

---

## 4. Cross-phase checklists

### 4.1 Security and permissions per endpoint

- **How to read:** "Guard" = `StaffPermissionGuard` scope check from `:hotelId`; "Service" = the service must call `assertHotelScope` and/or check that child records belong to the URL hotel. Every row needs a `403` test for an out-of-scope manager (or `404` for a guest with a wrong token) before the phase exit.

| Phase | Method and path (`/api/v1` prefix) | Permission | Scope check | Audit action |
|---|---|---|---|---|
| P1 | `GET /admin/hotels/:hotelId/rooms-summary` | `room_types.view` | Guard | — |
| P1 | `POST /admin/room-types/:id/enable` | `room_types.archive` | Service (room's hotel) | `room_type.enable` |
| P1 | `POST /admin/room-types/:id/duplicate` | `room_types.create` | Service (source's hotel) | `room_type.duplicate`, `rate.base.create` |
| P1 | `GET /admin/audit` | `audit.view` | Service (`hotelId ∈ hotelIds`) | — |
| P2 | `GET /admin/hotels/:hotelId/inventory-grid` | `inventory.view` | Guard | — |
| P2 | `POST /admin/hotels/:hotelId/inventory-grid/bulk` | `inventory.view` + per field `rates.edit` / `inventory.adjust` / `inventory.block` | Guard + Service (every `roomTypeId` in hotel) | `inventory.bulk_update` (one per room type) |
| P3 | `GET /admin/hotels/:id/health` | `hotels.view` | Guard (`:id` under `/hotels`) | — |
| P3 | `GET /admin/hotels/setup-health` | `hotels.view` | Service (hotels in scope) | — |
| P3 | `PUT /admin/hotels/:id/tax-profile` | `hotels.edit_tax` | Guard + Service | `hotel.tax_profile.update` |
| P4 | `POST /admin/hotels/:hotelId/quotes`, `GET /admin/hotels/:hotelId/availability` | `bookings.create` | Guard + Service (room in hotel) | — |
| P4 | `POST /admin/hotels/:hotelId/holds` | `bookings.create` | Guard + Service | `hold.create` |
| P4 | `POST /admin/hotels/:hotelId/holds/:holdId/extend` / `release` | `bookings.create` | Guard + Service (hold in hotel) | `hold.extend` / `hold.release` |
| P4 | `POST /admin/hotels/:hotelId/bookings` | `bookings.create` (+ `bookings.manage` for `NOT_REQUIRED`) | Guard + Service (hold in hotel) | `booking.create` |
| P4 | system jobs (hold expiry, optional release) | — | — | `hold.expire`, `booking.optional_release` (actor `SYSTEM`) |
| P5 | `GET /public/cities`, `GET /search`, `GET /hotels/:slug`, `GET /hotels/:slug/availability`, `POST /quotes` | public | published hotels only; rate-limited | — |
| P5 | `POST /holds`, `GET /holds/:holdId`, `POST /holds/:holdId/extend` / `release` | public | `X-Hold-Token`; rate-limited; ≤ 3 active per IP | `hold.*` (actor `GUEST`) |
| P5 | `POST /bookings`, `GET /bookings/:reference?t=` | public | hold token / access token; rate-limited | `booking.create` (actor `GUEST`) |
| P6 | `GET /admin/bookings` | `bookings.view` | Service (`hotelId ∈ hotelIds`) | — |
| P6 | `GET /admin/hotels/:hotelId/bookings`, `GET …/bookings/:bookingId`, `GET …/cancel-preview` | `bookings.view` | Guard + Service (booking in hotel) | — |
| P6 | `POST …/bookings/:bookingId/cancel`, `no-show`, `check-in`, `check-out`, `payment/collected`, `complete`, `confirm`, `resend-confirmation` | `bookings.manage` | Guard + Service (booking in hotel) | `booking.<action>` |

- **Proposed role matrix** (🧑 approve at P1-T01):

| Permission | Super Administrator | Manager (assigned hotels) | Editor (assigned hotels) |
|---|---|---|---|
| `hotels.view`, `room_types.view`, `inventory.view`, `rates.view`, `bookings.view` | ✅ | ✅ | ✅ |
| `hotels.create` | ✅ | ❌ | ❌ |
| `hotels.edit`, `room_types.create`, `room_types.edit` | ✅ | ✅ | ✅ |
| `hotels.publish`, `room_types.archive` | ✅ | ✅ | ❌ |
| `hotels.archive` | ✅ | ❌ | ❌ |
| `inventory.adjust`, `inventory.block`, `rates.edit` | ✅ | ✅ | ✅ |
| `hotels.edit_tax` | ✅ | ✅ | ❌ |
| `audit.view` | ✅ | ✅ (own hotels) | ❌ |
| `bookings.create` | ✅ | ✅ | ✅ |
| `bookings.manage` | ✅ | ✅ | ❌ |

- **Always:**
  - every new admin controller has `@UseGuards(StaffPermissionGuard)` and a `@RequirePermission` on every handler;
  - child IDs are checked against the URL hotel (see [2.1](#21-backend-nestjs-appsapi));
  - DTOs whitelist every field; clients can never send prices, totals, statuses (except where an action endpoint takes a target), payment status or hotel scope;
  - no guest phone or email in audit metadata or logs.

### 4.2 Accessibility checklist (apply to every UI task)

- **Keyboard:** every action reachable with Tab/Shift+Tab, Enter and Space; Esc closes dialogs and returns focus to the trigger; no keyboard traps (WCAG 2.1.1, 2.1.2).
- **Focus:** always visible (`focus-visible:ring-2 ring-brand-primary`), logical order, focus moved into dialogs on open (2.4.3, 2.4.7).
- **Names and roles:** every control has a visible label or `aria-label`; icons are `aria-hidden` when next to text; custom widgets use the right roles (`grid`/`gridcell`, `tablist`/`tab`, `listbox`) (4.1.2).
- **Colour:** never the only signal — statuses and grid states have text or icon + text; contrast ≥ 4.5:1 for text (1.4.1, 1.4.3).
- **Timing:** hold timers warn ≥ 20 s before expiry, offer one-click extend at least 10 times, keep the form after expiry, and don't announce every second (2.2.1).
- **Dragging:** no feature needs drag; selection uses clicks and keys (2.5.7).
- **Targets:** at least 24×24 px, 44×44 px on the guest web and phone layouts (2.5.8).
- **Errors:** field errors next to the field, linked with `aria-describedby`, announced on submit; server field errors mapped through `useServerErrors` (3.3.1, 3.3.3).
- **Reflow:** no horizontal page scroll at 320–375 px except inside the grid card (1.4.10).
- **Language and titles:** `lang` set, unique page titles (3.1.1, 2.4.2).
- **Checkpoints:** P1-T14, P2-T11, P4-T09, P5-T10 are the formal accessibility reviews.

### 4.3 Test matrix

| Area | Unit (pure) | Integration (Jest + `MongoMemoryReplSet`) | Manual |
|---|---|---|---|
| Permissions sync, scope helper | — | existing suites (P1-T01) | sync script on dev DB |
| Room summary and health | — | `room-summary.service.spec.ts` | table values |
| Room lifecycle | — | `room-type-lifecycle.spec.ts` | dialogs |
| Audit read | — | `audit-query.service.spec.ts` | audit page |
| Restrictions fields | — | `inventory.service.spec.ts` (extended) | — |
| Rate resolver | — | `rate-resolver.service.spec.ts` | — |
| Rate checks | `rate-checks.spec.ts` | — | suspicious flow |
| Grid read / bulk | — | `inventory-grid.service.spec.ts`, `inventory-bulk.spec.ts` (rollback, permissions, concurrency) | grid, panel, phone |
| Grid selection | `grid-selection.test.ts` (if Vitest approved) | — | keyboard pass |
| Content fields | — | `hotel-content.spec.ts` | content UI |
| GSTIN | `gstin.spec.ts` | `hotel-tax.service.spec.ts` | tax page with vectors |
| Completeness and health | `completeness.spec.ts` | `hotel-health.service.spec.ts` | Overview, Today |
| GST maths | `gst.spec.ts` | — | price breakdown |
| Quote | — | `quote.service.spec.ts` | — |
| Hold / booking state machines | `hold-status.spec.ts`, `booking-status.spec.ts`, `booking-reference.spec.ts` | — | — |
| Holds and bookings | — | `holds.service.spec.ts`, `bookings.service.spec.ts` | staff page |
| Concurrency | — | `booking-concurrency.integration.spec.ts` (×5 runs) | two-browser race |
| Public search and booking | — | `public-search.service.spec.ts`, `public-booking.spec.ts` | guest flow on a phone |
| Booking query and actions | `cancellation-fee.spec.ts` | `booking-query.service.spec.ts`, `booking-actions.service.spec.ts` | list, detail, dialogs, calendar |
| Notifications | — | `notification.worker.spec.ts` (fake provider) | dev email file |
| Health | health service unit test | — | staging checks |

- **Rules:** integration tests that rely on transactions **must** use `MongoMemoryReplSet`, never a standalone in-memory server; every money test uses integer paise; every concurrency test ends by asserting `held + confirmed + blocked <= total` on all nights.

### 4.4 Docs-keeper updates (per phase)

| Phase | `../API.md` | `../DATA_MODEL.md` | `../TASKS.md` | Module specs (`../modules/`) | New-plan docs (`NP/`) | Other |
|---|---|---|---|---|---|---|
| P1 | rooms-summary, enable, duplicate, audit read | — | §3 new lines (routes, table, lifecycle), §0 audit read | `room-types.md`, `audit-logging.md`, `rbac.md` | UX-PLAN (routes, switcher), MIGRATION-PLAN (route map) | `apps/admin-web/docs/*`, `../ANALYSIS.md` status notes, `../guidelines/frontend-ui.md` navigation |
| P2 | inventory-grid, bulk, readiness `warnings` | `DailyRate`, `NightInventory` restrictions | §4, §5 grid lines | `pricing.md`, `bookings.md` (restrictions), `hotels.md` | DATA-MODEL, UI-PLAN (grid) | `.env.example` (rate checks) |
| P3 | hotel content, tax-profile, health, setup-health, public detail | Hotel content + `taxProfile` | §3 content, tax | `hotels.md`, `media.md`, `guest-search.md` | DATA-MODEL, UX-PLAN (Overview, Today) | ADR-007 note (validation only) |
| P4 | quotes, availability, holds, bookings (staff) | `Hold`, `Booking` (replace `InventoryHold`/`HoldNight`/`BookingNight`) | §4 TB S2-1, S2-5; §5 TB S2-2; §7 TB S2-3 | `bookings.md`, `pricing.md` | DATA-MODEL (state machines) | ADR-004, ADR-007 decisions; `../MVP.md` evidence |
| P5 | public cities, search, availability, quotes, holds, bookings | `cityKey` | §2, §6 TB S1-9, §7 | `guest-search.md`, `guest-accounts.md`, `bookings.md` | UI-PLAN (guest), UX-PLAN (guest flow) | ADR-005, new ADR-014; `../GUIDES.md` run guest web |
| P6 | booking list/detail/actions, resend | `Notification` | §7 TB S2-4, §9 TB S3-4, §10 TB S4-1…S4-4 | `bookings.md`, `cancellation-policies.md`, `notifications.md`, `deployment-operations.md` | PHASES (P7 hand-off notes) | `../MVP.md` exit evidence, `../HISTORY.md` launch entry, email ADR |

- **Rules:** keep each `../TASKS.md` line to one line; tick `[x]` only with an evidence path; update existing living docs instead of creating progress files (`.agent/rules/orchestration.md`).

---

## 5. Risks and where the coding model is most likely to fail

| # | Where it goes wrong | What it looks like | Mitigation in this plan |
|---|---|---|---|
| 1 | **Transactions without `session`** | A read or write inside `executeInTransaction` forgets `.session(session)` / `{ session }`; tests pass on a fast machine but rollback doesn't cover that write | Cheat-sheet [2.1](#21-backend-nestjs-appsapi); rollback tests in P2-T05, P4-T04, P4-T08; 🧑 code reviews at P2-T05 and P4-T04 |
| 2 | **Standalone Mongo in tests** | Concurrency tests "pass" because there are no real transactions | Rule in [4.3](#43-test-matrix): `MongoMemoryReplSet` only; P4-T08 checkpoint runs on the human's machine |
| 3 | **Check-then-act races** | Code reads availability, then increments `held` unconditionally | Claim pattern given verbatim in P4-T04 (conditional `findOneAndUpdate` with `$expr`); release-once pattern verbatim in P4-T05 |
| 4 | **Cross-hotel ID mix-ups (IDOR)** | Guard checks `:hotelId` but the service uses a `bookingId`/`roomTypeId` from another hotel | "Child records must match the URL hotel" rule ([2.1](#21-backend-nestjs-appsapi)); explicit `404` steps in P2-T05, P4-T05, P6-T02/T03; table [4.1](#41-security-and-permissions-per-endpoint) |
| 5 | **Floating-point money / wrong GST base** | `price * 0.18`, `/ 100` in UI code, slab chosen from the total of several rooms | `money.ts` + `gst.ts` with vectors (P4-T01) incl. the 2-rooms case; UI uses `utils/money.ts` only; 🧑 tax checkpoint |
| 6 | **Expired holds blocking sales** | `held` stays high when the job is off or crashed | Pre-claim `releaseExpired({ roomTypeId })` in P4-T04; job health in P6-T10 |
| 7 | **"All hotels" leaking into edit screens** | An edit page renders with no hotel or the wrong one after switching | URL-only scope (`useHotelScope`), "All hotels" only in portfolio mode (P1-T05), confirmation on unsaved edits |
| 8 | **Breaking old links** | Bookmarks to `/admin/hotels/:id/edit?tab=rates` 404 | Redirect table and 🧑 checkpoint in P1-T04 |
| 9 | **Rewriting snapshots** | Booking detail reads the hotel's current policy or price instead of the snapshot | P4-T07 copies quote/policy into the booking; P6-T05 acceptance test edits the policy after booking |
| 10 | **Mixed state machines** | A single `status` used for hold, booking and payment, or payment derived from booking status | Separate fields and transition maps (P4-T03, P4-T06); reviewer check |
| 11 | **Over-building the grid** | Drag-select, virtualised scrolling or a new library added | P2-T08 says click/keyboard only, 7/14/30-day windows, no new libraries |
| 12 | **Giant components** | `InventoryGrid.tsx` or `NewBookingPage.tsx` grows past 400 lines | File lists split components per step; ~200-line rule ([2.2](#22-frontend-react--tailwind-v4-appsadmin-web)) |
| 13 | **Hand-built UI** | Raw `<button>`, `<select>`, colour-only badges | Shared component list ([2.2](#22-frontend-react--tailwind-v4-appsadmin-web)); visual 🧑 checkpoints |
| 14 | **Running `nest build` / committing / deleting** | Dev watcher breaks; unwanted commits; lost files | Rules in [1.1](#11-rules-for-the-coding-model); deletion candidates listed in reports only |
| 15 | **Inventing product or tax answers** | Choosing amenity lists, fee rules or GST behaviour without asking | Every such item is a 🧑 checkpoint; the model reports a suggested answer and waits |
| 16 | **Network calls inside transactions** | Email sent inside the booking transaction; a provider timeout aborts the booking | Outbox pattern in P6-T08; rule in [1.1](#11-rules-for-the-coding-model) |
| 17 | **Guest token mistakes** | Booking readable by reference alone; tokens stored raw; non-constant-time compare | P5-T03 spec + 🧑 security review |
| 18 | **Index drift in production** | `autoIndex` is off in production (`database.module.ts`), so new indexes never get created | `ensure-indexes.ts` updated in P2-T02 and P6-T10; staging run is part of launch |
| 19 | **Time zone bugs** | "Today" computed in UTC, so Indian guests can't book after 18:30 IST or can book yesterday | Always `dateInTimezone(new Date(), hotel.timezone)`; IST conversion test in P6-T03 |
| 20 | **Scope creep from post-MVP items** | Payment links, invoices, Today arrivals, physical rooms sneak in | Phase scopes and the baseline's "Out of MVP" list; P7/P8 live in `PHASES.md` |

- **When stuck:** stop, report what you tried, the exact error, and two options with your recommendation. Do not loosen a test, skip a transaction or remove a permission check to make something pass.
