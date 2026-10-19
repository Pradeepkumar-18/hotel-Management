# Mini-Brief: 20261016-inline-hotel-photos (Quick Fix)

## Request
Integrate photo upload directly into `HotelForm` instead of an external header/sidebar button, using a popup for photo upload with uploaded photos appearing directly in a gallery grid below the upload trigger field.

## Affected Files
- `apps/admin-web/src/features/hotels/HotelForm.tsx` (line 124+: Add Section 3 "Property Photos" with upload trigger, upload popup modal, and thumbnail cards below the field)
- `apps/admin-web/src/pages/hotels/HotelEditPage.tsx` (lines 35-115: Remove external header photo button and standalone modal)

## Expected Behaviour
1. `HotelForm` contains a dedicated Section 3: "Property Photos".
2. An "Add / Upload Photos" button opens an accessible popup modal supporting file upload (via `uploadHotelMediaFile`) and URL input with optional caption.
3. Once added, uploaded photos immediately render in a responsive thumbnail grid below the upload button within the form.
4. Each photo card in the grid displays the image, caption, primary badge/toggle, and a delete button.
5. On form submit ("Save property changes"), both property metadata and the media list are saved atomically using optimistic concurrency control.
6. `HotelEditPage` remains clean and uncluttered without redundant photo buttons in the header.

## Acceptance Check
- `npm run build:admin` compiles with 0 errors.
- Navigating to `/admin/hotels/:id/edit` displays the Photos section directly within the form.
- Clicking "Add / Upload Photos" opens the upload popup.
- Uploaded photos display beneath the trigger.
- Submitting the form updates hotel details and media gallery.

## Role
`frontend-dev`
