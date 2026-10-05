# Room Type Management Specification

## Purpose and data

Room type is the sellable inventory unit. Fields include hotelId, stable name/code, description, maxAdults/maxChildren or approved occupancy model, bed configuration, amenities, media, total sellable rooms, default base price reference, status, and version. Do not imply physical room assignment unless that subsystem is added later.

## Rules

- Capacity validation is performed both when configuring room type and when quoting requested occupancy.
- If occupancy includes child ages, define age bands and maximums centrally; do not leave allocation ambiguous.
- `totalRooms` cannot be reduced below blocked + held + confirmed inventory for any affected date.
- Disabling a room type stops future holds but does not erase existing bookings.
- Room type identity/details and booked room description are snapshotted sufficiently for historical booking display.
- A hotel must be active/published before a room type is publicly bookable.

## API

Admin `GET/POST /api/v1/admin/hotels/:hotelId/room-types`, `GET/PATCH /admin/room-types/:id`, `POST /admin/room-types/:id/disable`. Public room-type details are returned through hotel detail/search, not unrestricted draft endpoints.

## Acceptance criteria

- Invalid capacity, negative room count, and invalid price references are rejected.
- Updates cannot violate date-level inventory commitments.
- A disabled room type is excluded from new search/holds while historical bookings remain intact.
- All writes are scoped to an authorized hotel and audited.
