# Task 20261016-restore-hotel-workspace-flow: Restore Complete Hotel Workspace, Readiness Pipeline & Lifecycle Flow
Phase / gate: Phase 1 — Hotel Catalog & Admin UI · Module spec: Documentation/modules/hotel-management.md · Checklist lines: 22 Checklist Item 3

## Goal
Restore the complete, documented Hotel Workspace architecture and lifecycle flow (`DRAFT` → `PUBLISHED` ⇄ `SUSPENDED` → `ARCHIVED`) on `/admin/hotels/:id/edit`. Replace the isolated flat form with the modular 4-pillar workspace (`General`, `Photos`, `Rooms`, `Policy`), sidebar `HotelReadinessWidget`, URL tab synchronization (`?tab=...`), pre-flight gate feedback (`HOTEL_NOT_READY`), typed archive confirmation, and operational suspend/reactivate controls.

## Scope
- **In**:
  - Refactor `apps/admin-web/src/features/hotels/HotelWorkspace.tsx` to integrate the modular subcomponents:
    - `HotelGeneralSection` (Identity, Location, Contact)
    - `HotelMediaGalleryManager` (Gallery, Cover Photo, Photo Upload Popup, Delete Confirm)
    - `HotelRoomsSection` (Room Categories grid, Capacity, RoomCreateModal trigger)
    - `HotelPolicySection` (Cancellation Policy, Cutoff hours, Penalties)
    - `HotelReadinessWidget` (4-pillar stepper, missing requirements alert, clickable tab switcher)
  - Connect URL tab state (`useSearchParams`: `?tab=general|photos|rooms|policy`) to support deep links from property creation and catalog directory.
  - Implement the complete lifecycle action bar in `HotelWorkspace`:
    - **Publish Property**: Calls `publishHotel`. On 409 `HOTEL_NOT_READY`, feeds `problems[]` into `HotelReadinessWidget` with clickable remediation steps.
    - **Suspend**: Prompts for reason via `ConfirmDialog` and calls `suspendHotel`.
    - **Reactivate**: Re-evaluates readiness gates via `publishHotel`.
    - **Archive**: Prompts with typed `"ARCHIVE"` barrier via `BulkStatusConfirmModal` and calls `archiveHotel`.
  - Update `apps/admin-web/src/pages/hotels/HotelEditPage.tsx` to render `HotelWorkspace` in `inline` mode.
- **Out**:
  - Backend API changes (all endpoints `/publish`, `/suspend`, `/archive`, `/bulk-status` and `HotelPublishChecks` are already implemented and tested).

## API contract (fixed — dev agents must not change it without returning here)
| Method | Path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/admin/hotels/:id` | `hotels.view` | none | `Hotel` | 404 |
| PATCH | `/admin/hotels/:id` | `hotels.edit` | `{ version, name, slug, address, ... }` | `Hotel` | 400, 409 |
| POST | `/admin/hotels/:id/publish` | `hotels.publish` | `{ version }` | `Hotel` | 409 (HOTEL_NOT_READY, VERSION_CONFLICT) |
| POST | `/admin/hotels/:id/suspend` | `hotels.edit` | `{ version, reason? }` | `Hotel` | 409 |
| POST | `/admin/hotels/:id/archive` | `hotels.archive` | `{ version, reason? }` | `Hotel` | 409 |
| GET | `/admin/hotels/:id/room-types` | `rooms.view` | none | `RoomType[]` | none |

## Data / schema / index changes
None.

## Business rules & invariants that apply
- **Gate B5 Pre-Flight Checks**: Hotel cannot transition to `PUBLISHED` without active cancellation policy, at least 1 active room type, positive capacity, base rate, matching currency, and future inventory.
- **Terminal State**: `ARCHIVED` is permanent and irreversible. Requires typed confirmation `"ARCHIVE"`.
- **OCC**: All mutations enforce matching `version`.

## Security & audit
- Gated with permissions: `hotels.publish`, `hotels.edit`, `hotels.archive`, `rooms.create`.
- Backend logs all transitions with actor and reason.

## Backend work
none

## Frontend work (for frontend-dev)
1. In `apps/admin-web/src/features/hotels/HotelWorkspace.tsx`:
   - Replace monolithic form markup with the modular workspace subcomponents (`HotelGeneralSection`, `HotelPolicySection`, `HotelRoomsSection`, `HotelReadinessWidget`, `HotelMediaGalleryManager`).
   - Wire pre-flight problem state (`publishProblems`) between publish action and `HotelReadinessWidget`.
   - Wire Suspend confirmation and Archive typed confirmation modal.
2. In `apps/admin-web/src/pages/hotels/HotelEditPage.tsx`:
   - Render `HotelWorkspace variant="inline"` with `onSaved` cache invalidation and clean navigation.

## Acceptance criteria
1. `/admin/hotels/:id/edit` displays the 4 setup tabs: General, Photos, Rooms, Cancellation Policy.
2. The `HotelReadinessWidget` displays real-time progress (e.g. 2/4 steps) and clicking any uncompleted step navigates directly to that tab.
3. If an admin attempts to publish an incomplete draft, the pre-flight checklist alert mounts with itemized missing requirements.
4. Admins can configure and save cancellation policy terms directly on the Policy tab.
5. Admins can view room categories and add room types directly via the Rooms tab without leaving the workspace.
6. Suspending a published property prompts for confirmation/reason and updates status to SUSPENDED.
7. Reactivating a suspended property calls publish and transitions back to PUBLISHED.
8. Archiving requires typing `"ARCHIVE"` and permanently marks the property ARCHIVED.
9. `npm run build:admin` compiles cleanly with 0 TypeScript or Vite errors.

## Verification plan
- Run `npm run build:admin`
- Run `npm run build:api`

## Docs to update (for docs-keeper)
- `Documentation/04-planning-and-tracking/19-task-board.md`
- `Documentation/04-planning-and-tracking/22-module-wise-line-items-checklist.md`

## Parallel safe?
yes (Frontend only, backend is none)
