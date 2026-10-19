# Mini-Brief: 20261016-photo-caption-edit (Quick Fix)

## Issue Description
1. In `PhotoUploadPopup.tsx`: When an image is uploaded, `handleClose()` is immediately triggered, abruptly closing the modal before the user has a chance to preview the uploaded image or edit its caption.
2. In `HotelForm.tsx`: Once an image is uploaded and displayed in the grid below the form field, there is no way to edit its caption.

## Affected Files
- `apps/admin-web/src/features/hotels/PhotoUploadPopup.tsx` (lines 53-68, 107-116: keep modal open after file upload, display uploaded image preview, allow caption editing, and provide explicit "Add Photo" confirmation in footer).
- `apps/admin-web/src/features/hotels/HotelForm.tsx` (lines 40+, 315-350: add `handleUpdateCaption` handler and editable caption input with pencil indicator on each photo card).

## Expected Behaviour
1. In the upload popup, uploading an image uploads the file to the backend, keeps the popup open, displays an uploaded image preview, and lets the user review and edit the caption before clicking "Add Photo".
2. On the photo cards grid in `HotelForm`, the user can click directly on the caption to edit or refine it at any time.
3. Submitting the form saves the updated captions with `updateHotelMedia`.

## Acceptance Check
- `npm run build:admin` compiles cleanly with zero TypeScript errors.
- Uploading a file in the popup displays the preview and allows editing the caption before closing.
- Photo cards in `HotelForm` allow direct editing of the caption text.
- Form submit persists the updated captions.

## Role
`frontend-dev`
