# Mini-Brief: 20261016-click-photo-edit-modal (Quick Fix)

## Request
When the user clicks any photo in the photo grid, open a centered popup modal displaying the photo preview, allow editing the caption, and save the updated caption back to the form.

## Affected Files
- `apps/admin-web/src/features/hotels/PhotoEditModal.tsx` (New: Centered dialog modal showing large photo preview, caption field, primary cover toggle, and save/cancel actions)
- `apps/admin-web/src/features/hotels/HotelForm.tsx` (Wire photo card click to open `PhotoEditModal`, update caption and primary status on save)

## Expected Behaviour
1. In the property photo grid within `HotelForm`, clicking any photo card opens `PhotoEditModal`.
2. The modal appears as a centered floating dialog (`variant="dialog"`).
3. The modal displays a clear preview of the clicked photo along with its current caption in an editable text input.
4. The user can also toggle "Primary Cover" or remove the photo from within the modal.
5. Clicking "Save Caption" saves the updated caption in `mediaList` and closes the modal.
6. The updated caption is immediately reflected on the card in the form and persisted when saving property changes.

## Acceptance Check
- `npm run build:admin` compiles cleanly with zero TypeScript errors.
- Clicking any photo card in the grid opens the modal with the photo preview and caption input.
- Editing caption and clicking "Save Caption" updates the photo in the grid.
- Submitting the form persists the updated caption to the backend.

## Role
`frontend-dev`
