# Task 20261019-edit-hotel-save-fix: Fix Hotel Information Editing and Saving in Hotel Workspace
Phase / gate: Phase 1 / Gate B5 · Module spec: Documentation/modules/hotel-management.md · Checklist lines: 22 §Hotel Management lines 40-75

## Goal
Allow staff to successfully edit and persist hotel name, slug, description, address, timezone, contact details, and cancellation policies in the Hotel Workspace without encountering HTTP 400 validation rejections or missing save actions, and clearly display an informative lock banner when a property is permanently archived.

## Scope
- In:
  - Fix `handleSaveAll` in `HotelWorkspace.tsx`: exclude `media` from the payload sent to `PATCH /admin/hotels/:id` (which was triggering NestJS `forbidNonWhitelisted` validation error `property media should not exist`).
  - Coordinate photo gallery persistence via `updateHotelMedia` (`POST /admin/hotels/:id/media`) when photos are modified.
  - Provide an explicit "Save Changes" button in Card 1 (Identity & Location) and the top workspace header so saving does not rely exclusively on the floating bar.
  - Display an informative read-only lock banner when viewing an `ARCHIVED` property explaining that archived properties are permanently preserved and cannot be modified.
- Out:
  - Modifying backend schemas or DTO contracts.

## API contract (fixed — dev agents must not change it without returning here)
| Method | Path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `PATCH` | `/admin/hotels/:id` | `hotels.edit` | `UpdateHotelDto` (`{ version, name, slug, address, timezone, contact, description, cancellationPolicy }`) | `Hotel` | 400 `VALIDATION_FAILED`, 401 `AUTH_REQUIRED`, 409 `VERSION_CONFLICT`, 404 `NOT_FOUND` |
| `POST` | `/admin/hotels/:id/media` | `hotels.edit` | `SetHotelMediaDto` (`{ version, media }`) | `Hotel` | 400 `VALIDATION_FAILED`, 401 `AUTH_REQUIRED`, 409 `CONCURRENCY_CONFLICT`, 404 `NOT_FOUND` |

## Data / schema / index changes
None.

## Business rules & invariants that apply (cite 12-business-rules / module spec)
- BR-HOTEL-01: Hotel updates require optimistic locking via integer `version`. Stale edits reject with `VERSION_CONFLICT`.
- BR-HOTEL-04: Archived hotels are terminal and immutable; their properties cannot be updated.
- ADR-002: Integer minor units and strict whitelist validation apply across all endpoints.

## Security & audit (permission, hotel scope, audit action names)
- Requires `hotels.edit` permission.
- Audit actions: `hotel.update` and `hotel.media_update`.

## Backend work (for backend-dev)
None. Backend API already supports `PATCH /admin/hotels/:id` and `POST /admin/hotels/:id/media` correctly.

## Frontend work (for frontend-dev)
1. In `apps/admin-web/src/features/hotels/HotelWorkspace.tsx`:
   - Strip `media` out of the object passed to `updateHotel(hotelId, payload)`.
   - If media gallery has unsaved changes, call `updateHotelMedia(hotelId, updatedHotel.version, mediaList)`.
   - Add explicit "Save Changes" and "Discard" actions at the bottom of Card 1 (Identity & Location) and in the workspace header bar when dirty.
   - For `ARCHIVED` hotels, display a prominent amber/slate lock banner: "This property is permanently archived and read-only. Information cannot be edited."
   - Ensure input fields reflect updated values without stale state locks.

## Acceptance criteria (numbered, testable)
1. Modifying the property name, slug, address, or contact details in Hotel Workspace and clicking "Save" sends a clean `UpdateHotelDto` payload to `PATCH /admin/hotels/:id` without the forbidden `media` field.
2. The server responds with `HTTP 200 OK` and the workspace updates the displayed hotel name and increments the version counter.
3. If media was modified, `updateHotelMedia` is invoked with the updated version and succeeds.
4. An explicit "Save Changes" button is visible and active in Card 1 whenever inputs have changed, in addition to the floating changes bar.
5. Viewing an `ARCHIVED` hotel clearly renders a banner stating the property is archived and locked, explaining why fields are disabled.

## Verification plan (commands for verifier; no new tests unless the user asked)
- Run `npm run build:admin` to verify TypeScript and bundling pass with 0 errors.
- Run `npm --workspace=apps/api run test` to verify backend integration tests remain green.
- Verify through node script that `PATCH /admin/hotels/:id` succeeds with the sanitized payload.

## Docs to update (for docs-keeper)
- `Documentation/04-planning-and-tracking/22-module-wise-line-items-checklist.md`
- `Documentation/modules/hotel-management.md`

## Parallel safe?
Yes (Frontend only task; backend API contract is fixed).
