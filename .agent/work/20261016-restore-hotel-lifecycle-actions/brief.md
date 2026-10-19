# Task 20261016-restore-hotel-lifecycle-actions: Restore Hotel Lifecycle Actions (Publish, Suspend, Reactivate, Archive)
Phase / gate: Phase 1 — Hotel Catalog & Admin UI · Module spec: Documentation/modules/hotel-management.md · Checklist lines: 22 Checklist Item 3

## Goal
Restore the missing hotel status transition controls (`Publish Property` for DRAFT, `Suspend` for PUBLISHED, `Reactivate Property` for SUSPENDED, and `Archive Property`) on the property edit page (`HotelEditPage.tsx`), complete with optimistic concurrency check (`version`), confirmation dialogs, loading indicators, and toast feedback.

## Scope
- **In**:
  - Add lifecycle action buttons to [`HotelEditPage.tsx`](file:///apps/admin-web/src/pages/hotels/HotelEditPage.tsx) header toolbar:
    - **Draft** state: "Publish Property" button (calls `publishHotel(hotelId, hotel.version)`).
    - **Published** state: "Suspend" button (with confirmation via `ConfirmDialog`, calls `suspendHotel(hotelId, hotel.version, reason)`).
    - **Suspended** state: "Reactivate Property" button (calls `publishHotel(hotelId, hotel.version)`).
    - **Non-archived** states: "Archive" action (with confirmation, calls `archiveHotel(hotelId, hotel.version, reason)`).
  - Gate actions with staff permissions using `<Can>` (`hotels.publish`, `hotels.edit`, `hotels.archive`).
  - Upon successful transition, invalidate query cache and refetch hotel data to update status badge in place.
- **Out**:
  - Backend API changes (endpoints `POST /admin/hotels/:id/publish`, `POST /admin/hotels/:id/suspend`, `POST /admin/hotels/:id/archive` are already implemented and tested).

## API contract (fixed — dev agents must not change it without returning here)
| Method | Path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/admin/hotels/:id/publish` | `hotels.publish` | `{ version: number }` | `Hotel` | 400 (validation), 409 (conflict) |
| POST | `/admin/hotels/:id/suspend` | `hotels.edit` | `{ version: number, reason?: string }` | `Hotel` | 400 (validation), 409 (conflict) |
| POST | `/admin/hotels/:id/archive` | `hotels.archive` | `{ version: number, reason?: string }` | `Hotel` | 400 (validation), 409 (conflict) |

## Data / schema / index changes
None.

## Business rules & invariants that apply
- **Lifecycle transitions**: Strict server-side state machine (DRAFT → PUBLISHED ⇄ SUSPENDED → ARCHIVED).
- **Optimistic Concurrency Control**: All lifecycle transitions must pass the current `hotel.version` to prevent overwriting concurrent updates.
- **Permission gating**: Privileged operations require explicit staff permissions.

## Security & audit
- Gated with permissions: `hotels.publish`, `hotels.edit`, `hotels.archive`.
- Actions are audited on the backend with user ID, hotel ID, previous state, and new state.

## Backend work
none

## Frontend work (for frontend-dev)
1. In `apps/admin-web/src/pages/hotels/HotelEditPage.tsx`:
   - Import `publishHotel`, `suspendHotel`, `archiveHotel` from `features/hotels/hotels.api`.
   - Import `ConfirmDialog` from `components/ui`.
   - Add action handlers for Publish, Suspend, Reactivate, and Archive with loading state (`busy`).
   - Add status action buttons in the header toolbar conditionally rendered based on `hotel.status`.
   - Wire `ConfirmDialog` to confirm Suspend and Archive actions before triggering API calls.
   - On success, display feedback toast and refresh hotel data via `invalidate('hotels')` and `refetch()`.

## Acceptance criteria
1. When viewing a DRAFT hotel on `/admin/hotels/:id/edit`, a "Publish Property" action is clearly visible in the header toolbar and successfully transitions the property to PUBLISHED.
2. When viewing a PUBLISHED hotel on `/admin/hotels/:id/edit`, a "Suspend" action is visible, prompts for confirmation via `ConfirmDialog`, and transitions the property to SUSPENDED.
3. When viewing a SUSPENDED hotel, a "Reactivate Property" action is visible and transitions the property back to PUBLISHED.
4. An "Archive" action is available for non-archived properties, requiring confirmation before permanent deactivation.
5. `npm run build:admin` compiles cleanly with zero TypeScript or Vite errors.

## Verification plan
- Run `npm run build:admin`
- Run `npm run build:api`

## Docs to update (for docs-keeper)
- `Documentation/04-planning-and-tracking/19-task-board.md`
- `Documentation/04-planning-and-tracking/22-module-wise-line-items-checklist.md`

## Parallel safe?
yes (Frontend only, backend is none)
