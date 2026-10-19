# Mini-Brief: 20261016-remove-room-types-and-rich-toast-errors (Quick Fix)

## Request
1. Remove the "Room Types" button from the header of `HotelEditPage.tsx`.
2. Ensure the "Reactivate Property", "Archive", "Suspend", and "Publish" action handlers capture and display the full backend API error details (including `err.message` and `err.details`) inside toast error notifications.
3. Answer user's architectural question on implementing toast messages across each and every page.

## Affected Files
- `apps/admin-web/src/pages/hotels/HotelEditPage.tsx` (remove Room Types button; enhance catch blocks with `isApiError` detail formatting).

## Expected Behaviour
1. In `HotelEditPage.tsx`, the "Room Types" button is removed from the header toolbar.
2. In `HotelEditPage.tsx`, when `handlePublish` (publish or reactivate), `handleConfirmSuspend`, or `handleConfirmArchive` fails, the toast error extracts the full API error message and itemized `err.details` if present, displaying the exact failure reasons from the backend.
3. The build compiles cleanly with zero TypeScript errors.

## Role
`frontend-dev`
