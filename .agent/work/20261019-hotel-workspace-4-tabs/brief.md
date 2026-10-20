# Task 20261019-hotel-workspace-4-tabs: Unified 4-Tab Hotel Workspace (Hotel+Media, Room Types+Media, Rates, Cancellation)

Phase / gate: Phase 1 (Core Catalog & Hotel Management) · Module spec: `Documentation/modules/hotel-management.md`, `Documentation/modules/room-type-management.md`, `Documentation/modules/pricing-tax.md`, `Documentation/modules/cancellation-policies.md` · Checklist lines: 22 section 1, 2, 4, 7

## Goal
Consolidate hotel creation/editing into a unified 4-tab workspace:
1. **Hotel** (Basics + Overall Hotel Media/Gallery upload)
2. **Room Types** (Room configuration + Room-specific image upload)
3. **Rates** (Room base nightly pricing directly in hotel workspace)
4. **Cancellation** (Cancellation policy & penalty fee rules)
Include a top-level readiness checklist across all 4 tabs so operators can see completeness and publish the property once all criteria pass.

## Scope
- In:
  - Backend: Add `media` array to `RoomType` schema, DTOs, and controllers (`GET/PATCH /admin/room-types/:id`, `POST /admin/hotels/media/upload` reusable for room media).
  - Frontend: Update `HotelWorkspace.tsx` to 4 tabs: `hotel`, `rooms`, `rates`, `cancellation`.
  - Frontend Tab 1: Embed hotel details and photo gallery together with seamless save flow.
  - Frontend Tab 2: Enhance Room Type creation/edit with room photo gallery and thumbnail management.
  - Frontend Tab 3: Embed room base rate configuration directly within the hotel workspace (inline rate setting for each room type without navigating away).
  - Frontend Tab 4: Standalone cancellation policy configuration tab.
  - Readiness Status Banner: Real-time visual progress across the 4 tabs and pre-flight validation for the **Publish** button.
  - Docs: Update `Documentation/07-guides/28-platform-modules-features-and-configuration-guide.md`, `27-admin-web-end-to-end-navigation-guide.md`, and `19-task-board.md`.
- Out:
  - Public booking engine modifications (Sprint 2).

## API contract (fixed)
| Method | Path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/hotels/:id` | `hotels.view` | - | `Hotel` | 401, 403, 404 |
| `PATCH` | `/api/v1/admin/hotels/:id` | `hotels.edit` | `UpdateHotelDto` | `Hotel` | 400, 401, 403, 404, 409 |
| `POST` | `/api/v1/admin/hotels/:id/media` | `hotels.edit` | `SetHotelMediaDto` | `Hotel` | 400, 401, 403, 404, 409 |
| `POST` | `/api/v1/admin/hotels/media/upload` | `hotels.view` | `multipart/form-data` | `{ url, filename, originalName, size }` | 400, 401, 403 |
| `GET` | `/api/v1/admin/hotels/:hotelId/room-types` | `room_types.view` | `?includeDisabled=boolean` | `RoomType[]` | 401, 403 |
| `POST` | `/api/v1/admin/hotels/:hotelId/room-types` | `room_types.create` | `CreateRoomTypeDto` (with optional `media`) | `RoomType` | 400, 401, 403, 409 |
| `PATCH` | `/api/v1/admin/room-types/:id` | `room_types.edit` | `UpdateRoomTypeDto` (with optional `media`) | `RoomType` | 400, 401, 403, 409, 422 |
| `GET` | `/api/v1/admin/room-types/:roomTypeId/base-rate` | `rates.view` | - | `BaseRate` | 401, 403 |
| `PUT` | `/api/v1/admin/room-types/:roomTypeId/base-rate` | `rates.edit` | `SetBaseRateDto` | `BaseRate` | 400, 401, 403, 409, 422 |
| `POST` | `/api/v1/admin/hotels/:id/publish` | `hotels.publish` | `{ version }` | `Hotel` | 400, 401, 403, 409, 422 |

## Data / schema / index changes
- `apps/api/src/modules/hotels/schemas/room-type.schema.ts`:
  - Add `@Prop({ type: [HotelMediaSchema], default: [] }) media: HotelMedia[];`

## Business rules & invariants that apply
- Server authority on rates, inventory, and cancellation calculation.
- Concurrency control via optimistic `version` on `Hotel`, `RoomType`, and `BaseRate`.
- Publishing pre-flight checks require catalog validity, cancellation policy, room type with rate & inventory.

## Backend work
- Add `media` to `room-type.schema.ts`, `room-type.dto.ts` (`CreateRoomTypeDto`, `UpdateRoomTypeDto`), and update mapping in `room-type.service.ts`.
- Ensure tests in `apps/api` pass.

## Frontend work
- Update `HotelWorkspace.tsx` tab configuration to the 4 explicit tabs: `hotel`, `rooms`, `rates`, `cancellation`.
- Tab 1: Combine details and photo gallery with smooth inline interaction.
- Tab 2: Show rooms with thumbnail and modal for room photos.
- Tab 3: Inline rates configuration for all hotel room types.
- Tab 4: Cancellation policy form with preview and savings.
- Top banner: Step indicator / tab completeness check.

## Acceptance criteria
1. Tab 1 allows editing hotel details and uploading/managing property photos in one screen.
2. Tab 2 lists room types, allows creating/editing room types, and supports uploading/managing room photos.
3. Tab 3 allows viewing and setting base rates for each room type directly in the hotel workspace.
4. Tab 4 allows configuring effective date, free cancellation hours, late fee rule, and no-show fee rule.
5. Persistent workspace header indicates tab completeness and allows one-click publish once all tabs are ready.
6. TypeScript build passes for both `apps/api` and `apps/admin-web`.

## Verification plan
- `npm run build` in `apps/api`
- `npm run build` in `apps/admin-web`
- `npm test` in `apps/api`

## Docs to update
- `Documentation/07-guides/28-platform-modules-features-and-configuration-guide.md`
- `Documentation/07-guides/27-admin-web-end-to-end-navigation-guide.md`
- `Documentation/04-planning-and-tracking/19-task-board.md`

## Parallel safe?
No (backend schema change for room media must build before frontend references it).
