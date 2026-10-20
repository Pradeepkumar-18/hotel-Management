# Room Types

<a id="room-type-management"></a>
## Room Type Management Specification

### Purpose and data

- **Purpose:** Room type is the sellable inventory unit.
- **Fields:** hotelId, stable name/code, description, maxAdults/maxChildren or approved occupancy model, bed configuration, amenities, media, total sellable rooms, default base price reference, status, and version.
- **No physical rooms:** Do not imply physical room assignment unless that subsystem is added later.

### Rules

- **Capacity validation:** Capacity validation is performed both when configuring room type and when quoting requested occupancy.
- **Child ages:** If occupancy includes child ages, define age bands and maximums centrally; do not leave allocation ambiguous.
- **Total rooms floor:** `totalRooms` cannot be reduced below blocked + held + confirmed inventory for any affected date (see [bookings.md](./bookings.md#availability-booking)).
- **Disabling:** Disabling a room type stops future holds but does not erase existing bookings.
- **Snapshot:** Room type identity/details and booked room description are snapshotted sufficiently for historical booking display.
- **Hotel prerequisite:** A hotel must be active/published before a room type is publicly bookable (see [hotels.md](./hotels.md)).

### API

- **Admin endpoints:**
  - `GET/POST /api/v1/admin/hotels/:hotelId/room-types`
  - `GET/PATCH /admin/room-types/:id`
  - `POST /admin/room-types/:id/disable`
- **Public exposure:** Public room-type details are returned through hotel detail/search, not unrestricted draft endpoints.
- **Full contract:** See [../API.md](../API.md).

### Acceptance criteria

- **Validation:** Invalid capacity, negative room count, and invalid price references are rejected.
- **Inventory commitments:** Updates cannot violate date-level inventory commitments.
- **Disabled exclusion:** A disabled room type is excluded from new search/holds while historical bookings remain intact.
- **Scope and audit:** All writes are scoped to an authorized hotel and audited.
