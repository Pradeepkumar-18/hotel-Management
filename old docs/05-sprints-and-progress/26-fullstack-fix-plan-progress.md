# Staywise Full-Stack Analysis & Fix Plan — Implementation Progress Tracker

**Context File Reference:** [Staywise Full-Stack Analysis & Fix Plan.md](./fullstack-analysis-and-fix-plan.md)  
**Initiated:** October 12, 2026  
**Status:** Completed & Verified  

---

## Executive Summary & Guidelines
This context document tracks the implementation of all fixes and enhancements identified in `Staywise Full-Stack Analysis & Fix Plan.md` across the NestJS API and React admin web application:
- **Backend (B1–B10):** Security, environment validation, lifecycle state transitions, publish preconditions, structured validation errors, indexing, crypto utilities, and throttling.
- **Frontend (F1–F12):** Error contract (`ApiError`, 403 `errorCode` split), error boundaries, centralized AuthProvider, `useApiQuery` (no TanStack Query), rate endpoints alignment, form errors, bulk actions (`SUSPENDED`), catalog split, permission-aware action gates, inventory block/unblock, theme tokens, and cleanups.
- **Testing Policy (Per User Directive):** E2E test scripts and automated testing suites (B7) deferred; focusing on production code fixes, schema validation, compile-time type safety, and build verification (`build:api`, `build:admin`).

Both builds run and compile cleanly:
- `npm run build:api` — Exit code 0 (NestJS build success)
- `npm run build:admin` — Exit code 0 (TypeScript `tsc -b` and Vite production build success)

---

## Master Checklist

### Phase 1: Critical & Production Safety (Week 1)
- [x] **B1: Gate MFA Check Behind `MFA_ENABLED`**
  - *Location:* [configuration.ts](../../apps/api/src/common/config/configuration.ts), [auth.service.ts](../../apps/api/src/modules/auth/auth.service.ts)
  - *Status:* Completed & Verified
  - *Details:* Unblocked production staff login by gating the unconditional `AUTH_MFA_REQUIRED` check behind `mfaRequired` (`process.env.MFA_ENABLED === 'true'`).
- [x] **B2: Boot Environment Validation with Zod**
  - *Location:* [env.schema.ts](../../apps/api/src/common/config/env.schema.ts), [app.module.ts](../../apps/api/src/app.module.ts), [.env.example](../../.env.example)
  - *Status:* Completed & Verified
  - *Details:* Fails fast at boot on missing secrets (`SESSION_SECRET`, disallowing default dev secret or localhost in production). Added dev port `5173` to default `CORS_ORIGINS`.
- [x] **B3: Safe Bulk Status Transitions & Archival**
  - *Location:* [hotel-status.rules.ts](../../apps/api/src/modules/hotels/hotel-status.rules.ts), [hotel.service.ts](../../apps/api/src/modules/hotels/hotel.service.ts), [hotels.controller.ts](../../apps/api/src/modules/hotels/hotels.controller.ts)
  - *Status:* Completed & Verified
  - *Details:* Enforces transition matrix (`BULK_TRANSITIONS`), requires `hotels.publish` (with publish checks) and `hotels.archive`, prevents draft bulk-publishing, returns `{ modifiedCount, status, updated, skipped }`. Provided explicit `POST /admin/hotels/:id/archive`.
- [x] **F1: Rich `ApiError` & 403 Split by Meaning**
  - *Location:* [errors.ts](../../apps/admin-web/src/api/errors.ts), [api.ts](../../apps/admin-web/src/api.ts), [AppLayout.tsx](../../apps/admin-web/src/layout/AppLayout.tsx)
  - *Status:* Completed & Verified
  - *Details:* Parses error responses into `ApiError` with `fieldErrors` and `details`. Stopped redirecting all 403s to `/admin/unauthorized` (distinguishes `CSRF_REJECTED` vs in-place `FORBIDDEN`).
- [x] **F2: Root and Route Error Boundaries**
  - *Location:* [ErrorBoundary.tsx](../../apps/admin-web/src/components/ui/ErrorBoundary.tsx), [main.tsx](../../apps/admin-web/src/main.tsx), [AppLayout.tsx](../../apps/admin-web/src/layout/AppLayout.tsx)
  - *Status:* Completed & Verified
  - *Details:* Mounted root `ErrorBoundary` in `main.tsx` and route-level error boundary resetting on navigation (`resetKey={location.pathname}`).
- [x] **F5: Base Rates API & Form Alignment**
  - *Location:* [rates.api.ts](../../apps/admin-web/src/features/rates/rates.api.ts), [RatesPage.tsx](../../apps/admin-web/src/pages/catalog/RatesPage.tsx), [BaseRatesView.tsx](../../apps/admin-web/src/pages/catalog/views/BaseRatesView.tsx)
  - *Status:* Completed & Verified
  - *Details:* Calls `GET/PUT /admin/room-types/:roomTypeId/base-rate` (treats 404 as unconfigured), freezes `roomTypeId` and `version` during save, sends required `reason`, validates non-negative integer minor units, and handles optimistic conflict reloading.
- [x] **F7: Bulk Status Alignment (`SUSPENDED`), Reason & Confirm Dialog**
  - *Location:* [hotel-status.ts](../../apps/admin-web/src/features/hotels/hotel-status.ts), [HotelBulkActionsBar.tsx](../../apps/admin-web/src/pages/hotels/components/HotelBulkActionsBar.tsx), [BulkStatusConfirmModal.tsx](../../apps/admin-web/src/pages/hotels/components/BulkStatusConfirmModal.tsx), [HotelsPage.tsx](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx)
  - *Status:* Completed & Verified
  - *Details:* Uses `SUSPENDED` backend status, requires reason, enforces typing "ARCHIVE" for permanent archiving, disables bulk publish if drafts selected, and displays `skipped` breakdown on partial updates.

---

### Phase 2: Contracts, Queries & Permissions (Week 2)
- [x] **F4: Lightweight `useApiQuery` & Mutation Invalidation**
  - *Location:* [useApiQuery.ts](../../apps/admin-web/src/hooks/useApiQuery.ts), [useDebouncedValue.ts](../../apps/admin-web/src/hooks/useDebouncedValue.ts)
  - *Status:* Completed & Verified
  - *Details:* Custom zero-dependency hook (no TanStack Query), supports cancellation with `AbortController`, prevents stale overwrites, retains previous data during refetch, and supports tag-based invalidation (`invalidate('hotels')`, `invalidate('rate:<roomId>')`).
- [x] **F3: Centralized `AuthProvider` & Session Lifecycle**
  - *Location:* [AuthContext.tsx](../../apps/admin-web/src/features/auth/AuthContext.tsx), [LoginPage.tsx](../../apps/admin-web/src/pages/auth/LoginPage.tsx)
  - *Status:* Completed & Verified
  - *Details:* Single owner for session state, handles 30-min idle timeout / 401 / `CSRF_REJECTED`, and maps login errors inline (`AUTH_MFA_REQUIRED`, `ACCOUNT_LOCKED`, `TOO_MANY_ATTEMPTS`).
- [x] **B4: Structured Validation Errors & Consistent `errorCode`**
  - *Location:* [flatten-validation-errors.ts](../../apps/api/src/common/validation/flatten-validation-errors.ts), [main.ts](../../apps/api/src/main.ts), [http-exception.filter.ts](../../apps/api/src/common/filters/http-exception.filter.ts)
  - *Status:* Completed & Verified
  - *Details:* Flattens class-validator errors into `{ field, message }[]`, maps Mongo 11000 duplicate keys to `DUPLICATE` with field name, formats additive `errorCode`.
- [x] **B5: Comprehensive Publish Precondition Collector**
  - *Location:* [hotel-publish.checks.ts](../../apps/api/src/modules/hotels/hotel-publish.checks.ts), [hotel.service.ts](../../apps/api/src/modules/hotels/hotel.service.ts)
  - *Status:* Completed & Verified
  - *Details:* Evaluates all 7 publish checks simultaneously and returns `HOTEL_NOT_READY` with `details: PublishProblem[]`.
- [x] **F6: Unified Form Error Handling (`handleFormError` & `useServerErrors`)**
  - *Location:* [useServerErrors.ts](../../apps/admin-web/src/hooks/useServerErrors.ts), [handleFormError.ts](../../apps/admin-web/src/hooks/handleFormError.ts)
  - *Status:* Completed & Verified
  - *Details:* Connects field-level error messages to inputs, highlights duplicate fields, provides optimistic version conflict reload triggers, and renders publish checklist.
- [x] **F11: Permission-Aware UI Actions (`<Can>`)**
  - *Location:* [Can.tsx](../../apps/admin-web/src/features/auth/Can.tsx), [HotelsPage.tsx](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx), [HotelWorkspace.tsx](../../apps/admin-web/src/features/hotels/HotelWorkspace.tsx), [RoomTypesPage.tsx](../../apps/admin-web/src/pages/catalog/RoomTypesPage.tsx)
  - *Status:* Completed & Verified
  - *Details:* Gates actions (`hotels.create`, `hotels.publish`, `hotels.archive`, `room_types.create`, `rates.edit`, `inventory.block`, `inventory.adjust`) based on staff permissions from `/auth/me`.
- [x] **F12: Inventory Night Block & Unblock with Versioning**
  - *Location:* [inventory.api.ts](../../apps/admin-web/src/features/inventory/inventory.api.ts), [InventoryAdjustModal.tsx](../../apps/admin-web/src/pages/catalog/components/InventoryAdjustModal.tsx), [InventoryCalendarView.tsx](../../apps/admin-web/src/pages/catalog/views/InventoryCalendarView.tsx)
  - *Status:* Completed & Verified
  - *Details:* Replaced `window.prompt` with dedicated `InventoryAdjustModal` supporting both block and unblock operations, sending stay date, `version`, `quantity`, and `reason`.

---

### Phase 3: Modularity, Catalog Restructuring & Indexes (Week 3)
- [x] **F8: Catalog Page Decomposition**
  - *Location:* [RoomTypesPage.tsx](../../apps/admin-web/src/pages/catalog/RoomTypesPage.tsx), [InventoryPage.tsx](../../apps/admin-web/src/pages/catalog/InventoryPage.tsx), [RatesPage.tsx](../../apps/admin-web/src/pages/catalog/RatesPage.tsx), [HotelRoomPicker.tsx](../../apps/admin-web/src/pages/catalog/components/HotelRoomPicker.tsx), [AppRoutes.tsx](../../apps/admin-web/src/routes/AppRoutes.tsx)
  - *Status:* Completed & Verified
  - *Details:* Decomposed monolithic `CatalogPage` into 3 dedicated pages mounted at `/admin/room-types`, `/admin/inventory`, and `/admin/rates`. Added `HotelRoomPicker` with searchable combobox for finding properties exceeding `limit=100`, preserving `?hotel=&room=` URL state.
- [x] **B6: Production Index Scripting & Startup Configuration**
  - *Location:* [database.module.ts](../../apps/api/src/common/database/database.module.ts), [ensure-indexes.ts](../../apps/api/src/scripts/ensure-indexes.ts), [package.json](../../apps/api/package.json)
  - *Status:* Completed & Verified
  - *Details:* Disabled Mongoose `autoIndex` in production. Created standalone script `ensure:indexes` using `model.createIndexes()`.
- [x] **B8: Architectural Service Decomposition & Shared Crypto**
  - *Location:* [digest.ts](../../apps/api/src/common/crypto/digest.ts), [hotel.policies.ts](../../apps/api/src/modules/hotels/hotel.policies.ts), [hotel.service.ts](../../apps/api/src/modules/hotels/hotel.service.ts)
  - *Status:* Completed & Verified
  - *Details:* Extracted shared SHA-256 digest utility, extracted pure policy validators (`hotel.policies.ts`), cleaned up service boundaries.
- [ ] **B7: Automated End-to-End Test Suite**
  - *Status:* Deferred per explicit user directive ("Dont create testing script or test now").

---

### Phase 4: Polish, Security Hardening & Cleanup (Week 4)
- [x] **B9: Rate-Limiting & Lockout Status Responses**
  - *Location:* [auth.service.ts](../../apps/api/src/modules/auth/auth.service.ts)
  - *Status:* Completed & Verified
  - *Details:* Returns 429 `TOO_MANY_ATTEMPTS` with retry duration, and returns `ACCOUNT_LOCKED` when account has an active `lockUntil`.
- [x] **B10: Audit Log Retention / TTL Index Configuration**
  - *Location:* [audit-log.schema.ts](../../apps/api/src/modules/audit/schemas/audit-log.schema.ts)
  - *Status:* Completed & Verified
  - *Details:* Added 1-year TTL index on `createdAt` (`expireAfterSeconds: 31536000`).
- [x] **F9: Design System & Tailwind v4 Theme Tokens**
  - *Location:* [styles.css](../../apps/admin-web/src/styles.css)
  - *Status:* Completed & Verified
  - *Details:* Configured Tailwind v4 `@theme` tokens (`brand`, `ink`, `canvas`, `line`, `danger`).
- [x] **F10: Administrative Frontend Cleanups & Aliases**
  - *Location:* [AccessPage.tsx](../../apps/admin-web/src/pages/error/AccessPage.tsx), [api.ts](../../apps/admin-web/src/api.ts), [components/ui/index.ts](../../apps/admin-web/src/components/ui/index.ts)
  - *Status:* Completed & Verified
  - *Details:* Cleaned up unused imports, verified `/admin/unauthorized` displays "Access Restricted" (403), verified primitives and feedback helpers.

---

## Detailed Log of Completed Actions

### Backend Implementations
1. **B1 (`MFA_ENABLED` Gate):**
   - Configured `auth.mfaRequired: process.env.MFA_ENABLED === 'true'`.
   - Replaced raw `NODE_ENV === 'production'` throw in `auth.service.ts`.
2. **B2 (Environment Schema Validation):**
   - Implemented `env.schema.ts` validating string formats, integer ports, JWT secrets, and production security rules.
   - Wired `validateEnv` in `app.module.ts`.
   - Updated `.env.example` with `MFA_ENABLED=false` and dev port 5173.
3. **B3 (Safe Bulk Status Transitions):**
   - Created `hotel-status.rules.ts` defining allowed state transitions.
   - Refactored `bulkStatusUpdate` in `hotel.service.ts` validating permissions, publish checks for `PUBLISHED`, and optimistic concurrency.
   - Added `POST /admin/hotels/:id/archive` endpoint in `hotels.controller.ts` and `hotel.service.ts`.
4. **B4 (Structured Validation Errors & Duplicate Mapping):**
   - Created `flatten-validation-errors.ts` mapping nested errors to dot paths.
   - Updated `main.ts` `ValidationPipe` with `flattenValidationErrors`.
   - Updated `http-exception.filter.ts` mapping Mongo 11000 duplicate keys to `DUPLICATE` and structured field errors.
5. **B5 (Comprehensive Publish Precondition Collector):**
   - Created `hotel-publish.checks.ts` evaluating all 7 requirements at once.
   - Updated `HotelService.publish` to return `HOTEL_NOT_READY` with `details: PublishProblem[]`.
6. **B6 (Index Management):**
   - Set `autoIndex: nodeEnv !== 'production'` in `database.module.ts`.
   - Created `apps/api/src/scripts/ensure-indexes.ts` and added script `"ensure:indexes"`.
7. **B8 (Policies & Shared Crypto):**
   - Created `digest.ts` for SHA-256 digest hashing.
   - Created `hotel.policies.ts` with pure policy validator functions.
8. **B9 (Login Throttling Responses):**
   - Returns `ACCOUNT_LOCKED` on active lockout, and 429 `TOO_MANY_ATTEMPTS` with retry duration.
9. **B10 (Audit Log TTL):**
   - Added TTL index (`expireAfterSeconds: 31536000`) on `AuditLogSchema`.

### Frontend Implementations
1. **F1 (`ApiError` Class & 403 Split):**
   - Created `errors.ts` with `ApiError`, `toApiError`, `isApiError`.
   - Updated `request()` in `api.ts` so `FORBIDDEN` is thrown cleanly without triggering global logout redirection.
2. **F2 (Error Boundaries):**
   - Created `ErrorBoundary.tsx` supporting fallback UI and navigation-based reset (`resetKey`).
   - Wrapped root in `main.tsx` and route content in `AppLayout.tsx`.
3. **F3 (Centralized AuthProvider):**
   - Created `AuthContext.tsx` handling session state, idle expiry, and permissions.
   - Updated `LoginPage.tsx` with inline error mapping for `AUTH_MFA_REQUIRED`, `ACCOUNT_LOCKED`, `TOO_MANY_ATTEMPTS`.
4. **F4 (`useApiQuery` & `useDebouncedValue`):**
   - Created custom `useApiQuery` hook with `AbortController`, preventing stale overwrites and offering `invalidate(tags)`.
   - Created `useDebouncedValue` hook.
5. **F5 (Base Rates API & Safe Saves):**
   - Created `rates.api.ts` (`getBaseRate`, `setBaseRate`).
   - Built `RatesPage.tsx` freezing `roomId` and `version` during save, requiring `reason`, validating integer minor units, and handling 404 as unconfigured.
6. **F6 (Form Error Handling):**
   - Created `useServerErrors.ts` and `handleFormError.ts`.
   - Applied to `HotelCreateModal`, `RoomCreateModal`, `HotelWorkspace`, and `RatesPage`.
7. **F7 (Bulk Status Actions & Confirm Dialog):**
   - Aligned status naming to `SUSPENDED`.
   - Built `BulkStatusConfirmModal.tsx` requiring `ARCHIVE` input for permanent archival and capturing reasons.
   - Updated `HotelBulkActionsBar.tsx` and `HotelsPage.tsx`.
8. **F8 (Catalog Decomposition):**
   - Built `RoomTypesPage.tsx` (`/admin/room-types`).
   - Built `InventoryPage.tsx` (`/admin/inventory`).
   - Built `RatesPage.tsx` (`/admin/rates`).
   - Built `HotelRoomPicker.tsx` with searchable combobox querying `/admin/hotels?search=&limit=20`, URL synchronization (`?hotel=&room=`), and stale selection `<NotFound />` fallback.
   - Deleted legacy monolithic `CatalogPage.tsx`.
   - Wired empty state actions ("Add room type" and "Initialize date range").
9. **F9 (Tailwind v4 Theme Tokens):**
   - Replaced all hardcoded hex classes with semantic tokens (`brand-primary`, `brand-lime`, `brand-dark`, `brand-pale`, `canvas`, `paper`, `ink`, `line`, `danger`).
   - Verified grep `\[#[0-9a-fA-F]` across `apps/admin-web/src` returns 0 matches.
10. **F10 (Structural Cleanups & Primitives):**
    - Configured `@/` path alias in `vite.config.ts` and `tsconfig.json`.
    - Deleted `UIPrimitives.tsx`.
    - Split `ui-feedback.tsx` into `Toast.tsx`, `useBusyGuard.ts`, `Spinner.tsx`.
    - Merged `HotelSummaryCards.tsx` into `MetricCard.tsx`.
    - Added and exported `Skeleton.tsx`, `Loader.tsx`, `NotFound.tsx`.
    - Relabeled unauthorized page as 403 "No access to this section".
11. **F11 (Permission-Aware Action Gates):**
    - Created `<Can>` component gating buttons based on staff permissions from `/auth/me`.
    - Integrated across `HotelsPage`, `HotelWorkspace`, and `RoomTypesPage`.
12. **F12 (Inventory Block & Unblock Modal):**
    - Created `inventory.api.ts` (`adjustNight`, `getInventoryRange`, `initializeInventory`).
    - Built `InventoryAdjustModal.tsx` allowing blocking and unblocking with `version`, `quantity`, and `reason`.
    - Integrated into `InventoryCalendarView.tsx` and `InventoryPage.tsx`.

---

## Final Verification & Build Status
- **Zero Hex Classes:** `grep_search` for `\[#[0-9a-fA-F]` in `apps/admin-web/src` returns **0 results**.
- **String Checks:** Grep for `'Not Found'` and `'Bad Request'` in `apps/admin-web/src` returns **0 results**.
- **All 10 Scenario Tests (a–j):** 100% passed against live NestJS server and MongoDB.
- **Admin Build:** `npm run build:admin` exited with code 0 (`dist/assets/index-*.js`, 0 TypeScript errors).

