# Frontend Handoff: 20261016-restore-hotel-lifecycle-actions

## Summary of Changes
- **File**: [`apps/admin-web/src/pages/hotels/HotelEditPage.tsx`](file:///c:/Users/Pradeep%20Kumar%20S/Downloads/Project/Hotel%20Management/hotel-Management/apps/admin-web/src/pages/hotels/HotelEditPage.tsx)
  - Restored full hotel status lifecycle controls in the header toolbar next to the status badge:
    - **Draft State**: "Publish Property" button (calls `publishHotel(hotelId, hotel.version)`), gated with `<Can permission="hotels.publish">`.
    - **Published State**: "Suspend" button (opens `ConfirmDialog` and calls `suspendHotel(hotelId, hotel.version, reason)`), gated with `<Can permission="hotels.edit">`.
    - **Suspended State**: "Reactivate Property" button (calls `publishHotel(hotelId, hotel.version)`), gated with `<Can permission="hotels.publish">`.
    - **Non-Archived States**: "Archive" button (opens `ConfirmDialog` and calls `archiveHotel(hotelId, hotel.version, reason)`), gated with `<Can permission="hotels.archive">`.
  - Reused the newly created generic [`ConfirmDialog`](file:///c:/Users/Pradeep%20Kumar%20S/Downloads/Project/Hotel%20Management/hotel-Management/apps/admin-web/src/components/ui/ConfirmDialog.tsx) for confirming Suspend and Archive operations.
  - Added loading indicator (`isLoading={isTransitioning}`) to prevent double-clicks.
  - Invalided cache and re-fetched hotel data in place via `invalidate('hotels')` and `refetch()` so the status badge and active action buttons update smoothly upon each state transition.

## Verification
- `npm run build:admin` builds with zero errors.
- `npm run build:api` builds with zero errors.
