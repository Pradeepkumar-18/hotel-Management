# Task 20261016-hotel-edit-form-unify: Unify Hotel Create and Edit Form
Phase / gate: Phase 2 · Module spec: Documentation/modules/hotel-management.md · Checklist lines: 22-module-wise-line-items-checklist.md § Hotel Management

## Goal
Simplify the hotel editing user experience by replacing the heavy multi-tab workspace embedded on `/admin/hotels/:id/edit` with a dedicated, reusable `HotelForm` (modeled after `RoomTypeForm`) that handles both create and edit modes cleanly with single-click submit and optimistic concurrency control (`version`).

## Scope
- In:
  - Create/upgrade `HotelForm.tsx` in `apps/admin-web/src/features/hotels/` to support both creation (`POST /api/v1/admin/hotels`) and editing (`PATCH /api/v1/admin/hotels/:id`).
  - Pre-populate all property identity, address, and contact fields when editing.
  - Enforce optimistic concurrency control using `hotel.version` on edit.
  - Simplify `HotelEditPage.tsx` to render `HotelForm` with breadcrumbs and clean page headers.
  - Provide a quick secondary link or button in `HotelEditPage` to access room types (`/admin/room-types?hotel=:id`) or the photo gallery workspace.
  - Ensure `HotelCreatePage.tsx` and `HotelCreateModal.tsx` remain fully functional using `HotelForm`.
- Out:
  - Backend API changes (`PATCH /admin/hotels/:id` is already fully implemented and verified).
  - Changes to inventory, rates, or bookings.

## API contract (fixed — dev agents must not change it without returning here)
| Method | Path | Permission | Request Body | Response | Errors |
|---|---|---|---|---|---|
| POST | `/api/v1/admin/hotels` | `hotels.create` | `CreateHotelDto` (`name`, `slug`, `timezone`, `description?`, `address`, `contact`) | `Hotel` | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 409 Duplicate Slug |
| PATCH | `/api/v1/admin/hotels/:id` | `hotels.edit` | `UpdateHotelDto` (`version`, `name?`, `slug?`, `timezone?`, `description?`, `address?`, `contact?`) | `Hotel` | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Version Conflict |

## Data / schema / index changes
None. Backend Mongoose schema `Hotel` and OCC versioning already exist and are unchanged.

## Business rules & invariants that apply
- **Optimistic Concurrency Control (OCC):** Edits must supply the current document `version`. If the document was modified concurrently, handle `409 VERSION_CONFLICT` with a reload prompt via `handleFormError`.
- **Property Identity Validation:** `name` minLength 2, lowercase alphanumeric `slug` with hyphens, valid IANA `timezone` (e.g. `Asia/Kolkata`), ISO-2 `countryCode` (e.g. `IN`).

## Security & audit
- Requires `hotels.create` for new properties, `hotels.edit` for property updates.
- Hotel scoped permissions apply via existing `StaffPermissionGuard`.
- Audit actions (`hotel.create`, `hotel.update`) recorded by existing backend `HotelService`.

## Backend work (for backend-dev)
None.

## Frontend work (for frontend-dev)
1. **Refactor/Create `HotelForm.tsx`:**
   - Props: `{ hotel?: Hotel | null; onSuccess: (saved: Hotel) => void; onCancel: () => void }`.
   - Single unified form with 2 clear visual sections: Property Identity and Physical Location.
   - When `hotel` is present: prefill `defaultValue`s, submit to `updateHotel(readId(hotel), { version: hotel.version, ... })`, button label "Save property changes".
   - When `hotel` is omitted: submit to `createHotel(...)`, button label "Create draft property".
   - Maintain `useServerErrors`, `useBusyGuard`, and `handleFormError`.
2. **Update `HotelEditPage.tsx`:**
   - Render `HotelForm` wrapped in page layout with back button, property status badge, and clear title `Edit Property: ${hotel.name}`.
   - Add secondary shortcut button to "Manage Rooms" (`/admin/room-types?hotel=${id}`) or workspace.
3. **Update `HotelCreatePage.tsx` & `HotelCreateModal.tsx`:**
   - Use the unified `HotelForm`.

## Acceptance criteria
1. Navigating to `/admin/hotels/:id/edit` renders a clean, focused property edit form without requiring navigation across 4 tabs.
2. All existing hotel fields (Name, Slug, Timezone, Contact Email, Contact Phone, Description, Street Address, City, Postal Code, Country) are correctly pre-populated.
3. Submitting the edit form sends `PATCH /api/v1/admin/hotels/:id` with the current `version`.
4. Successful update shows toast "Property \"...\" updated successfully" and invalidates the `'hotels'` query cache.
5. Concurrent updates (stale `version`) trigger a user-friendly conflict alert prompting a reload.
6. Hotel creation from `/admin/hotels/new` continues to work seamlessly with the unified form.
7. TypeScript compiles cleanly with zero errors (`npm run build:admin`).

## Verification plan
```powershell
npm --workspace=apps/admin-web run build
```
Verify manually or via Puppeteer screenshot script that `/admin/hotels/new` and `/admin/hotels/:id/edit` render clean forms with pre-filled inputs and responsive action buttons.

## Docs to update (for docs-keeper)
- `Documentation/04-planning-and-tracking/19-task-board.md`
- `Documentation/04-planning-and-tracking/22-module-wise-line-items-checklist.md`

## Parallel safe?
Yes (Backend work is none; pure frontend change).
