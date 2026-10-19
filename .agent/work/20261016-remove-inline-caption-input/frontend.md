# Frontend Handoff: 20261016-remove-inline-caption-input

## Changes Made
- **File**: `apps/admin-web/src/features/hotels/HotelForm.tsx`
  - Removed `Pencil` icon import from `lucide-react`.
  - Removed `handleUpdateCaption` method since captions are no longer edited inline in the card.
  - Replaced the inline input element `<input value={item.caption} ... />` and pencil icon button with clean typography (`<p className="text-xs font-bold text-slate-800 truncate hover:text-emerald-700 transition-colors">`).
  - Added click handlers to both the photo thumbnail and the caption text block: clicking either immediately opens `PhotoEditModal` for that photo.
  - In `PhotoEditModal`, the user can view the large preview, edit the caption in an auto-focused text field, toggle the primary cover status, or delete the photo.
  - On saving in `PhotoEditModal`, `handleSavePhotoModal` updates the `mediaList` state in `HotelForm`, reflecting the updated caption on the card and persisting upon saving the hotel.

## Verification
- Clean build: `npm --workspace=apps/admin-web run build` completed with 0 errors.
- Monorepo API build: `npm run build:api` completed with 0 errors.
