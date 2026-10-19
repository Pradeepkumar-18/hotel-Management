# Task 20261016-delete-confirmation-dialog: Global Delete Confirmation & Popup Bypass Rule
Phase / gate: Phase 1 — Hotel Catalog & Admin UI · Module spec: Documentation/modules/hotel-management.md · Checklist lines: 22 Checklist Item 3

## Goal
Implement a standardized, reusable `ConfirmDialog` component in the admin web UI (`apps/admin-web/src/components/ui/ConfirmDialog.tsx`) and apply it across photo and resource delete buttons on pages/forms. If a delete button is located inside an existing popup/modal dialog (such as `PhotoEditModal`), it executes immediately without triggering a second confirmation dialog.

## Scope
- **In**:
  - Create reusable `ConfirmDialog` modal primitive in `apps/admin-web/src/components/ui/ConfirmDialog.tsx` with alert/trash icon, clear warning message, cancel button, and danger confirmation button.
  - Export `ConfirmDialog` from `apps/admin-web/src/components/ui/index.ts`.
  - In `apps/admin-web/src/features/hotels/HotelForm.tsx`, wire the photo card delete button to open `ConfirmDialog`. Removing is only committed after the user confirms.
  - In `apps/admin-web/src/features/hotels/PhotoEditModal.tsx`, ensure the delete button inside this popup removes the photo directly without an extra confirmation popup (per user requirement).
  - In `apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx`, wire photo deletion in the gallery view to `ConfirmDialog`.
- **Out**:
  - Backend API changes (media deletion and persistence remain untouched).
  - Modifying existing typed archive confirmation modals (`HotelArchiveModal`, `BulkStatusConfirmModal`).

## API contract (fixed — dev agents must not change it without returning here)
None (pure frontend UI component & state enhancement).

## Data / schema / index changes
None.

## Business rules & invariants that apply
- **Accidental Deletion Prevention**: Standalone delete buttons situated on pages and forms must require confirmation to protect against accidental click.
- **Popup Bypass Rule**: When a user has already explicitly opened a dedicated modal dialog for an item (e.g. `PhotoEditModal`), the delete button inside the popup deletes immediately without redundant confirmation nesting.

## Security & audit
No security or audit changes required.

## Backend work
none

## Frontend work (for frontend-dev)
1. Create `apps/admin-web/src/components/ui/ConfirmDialog.tsx` supporting `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel`, `cancelLabel`, and `variant`.
2. Export `ConfirmDialog` and its props in `apps/admin-web/src/components/ui/index.ts`.
3. Update `apps/admin-web/src/features/hotels/HotelForm.tsx` to use `ConfirmDialog` on the photo card delete button.
4. Verify `apps/admin-web/src/features/hotels/PhotoEditModal.tsx` deletes without confirmation.
5. Update `apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx` to use `ConfirmDialog` on photo removal.

## Acceptance criteria
1. `ConfirmDialog` exists as a reusable UI component with clear danger styling, cancel, and confirm actions.
2. Clicking the delete trash icon on any photo card in `HotelForm.tsx` displays the `ConfirmDialog`; clicking cancel dismisses it without deleting; clicking confirm deletes the photo.
3. Clicking the "Delete Photo" button inside `PhotoEditModal.tsx` removes the photo immediately without opening an extra confirmation dialog.
4. Clicking remove photo in `HotelMediaGalleryManager.tsx` opens the `ConfirmDialog` before removing the photo.
5. `npm run build:admin` compiles cleanly with zero TypeScript or Vite errors.

## Verification plan
- Run `npm run build:admin` to verify TypeScript types, component exports, and bundle build.
- Run `npm run build:api` to verify monorepo integrity.

## Docs to update (for docs-keeper)
- `Documentation/04-planning-and-tracking/19-task-board.md`
- `Documentation/04-planning-and-tracking/22-module-wise-line-items-checklist.md`

## Parallel safe?
yes (Frontend only, backend is none)
