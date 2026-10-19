# Mini-Brief: 20261016-remove-inline-caption-input (Quick Fix)

## Request
Remove the inline text input and pencil icon from the photo card in the grid. The photo caption should be displayed as clean text on the card, and only become editable when clicking the photo to open the popup modal (`PhotoEditModal`).

## Affected Files
- `apps/admin-web/src/features/hotels/HotelForm.tsx` (lines 1-4, 363-402: remove inline caption input and pencil icons; render clean text caption that opens `PhotoEditModal` on click).

## Expected Behaviour
1. On each photo card in the gallery grid, the caption is displayed as plain, crisp text (`<p className="text-xs font-bold ...">`).
2. The inline text box and pencil icons are completely removed from the card.
3. Clicking on the photo card (thumbnail or caption text) opens the centered `PhotoEditModal`.
4. In `PhotoEditModal`, the user can view the full photo, edit the caption in the input field, and save.
5. On save, the updated caption updates on the card.

## Acceptance Check
- `npm run build:admin` compiles cleanly with zero TypeScript errors.
- Photo cards in the grid display clean text for caption (no input box or pencil icon).
- Clicking the photo card opens `PhotoEditModal` where the caption can be edited and saved.
- Form submit persists all captions to the backend.

## Role
`frontend-dev`
