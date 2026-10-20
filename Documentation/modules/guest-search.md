# Guest Search

<a id="guest-search"></a>
## Guest Search and Hotel Detail Specification

### Query contract

- **Inputs:** destination/city, checkIn, checkOut, rooms, adults, children/ages if supported, filters, sort, page, pageSize.
- **Dates:** Dates are date-only and evaluated in each hotel's timezone; platform must define destination behavior where timezone differs.
- **Rejections:** Reject invalid dates, unsupported filters, excessive stay length, invalid occupancy and unbounded pagination.

### Search correctness

- **Eligible results:** Include only published, non-suspended hotels and active room types (see [hotels.md](./hotels.md), [room-types.md](./room-types.md)).
- **Room type qualification:** A room type qualifies only if requested occupancy fits and quantity is available on every night.
- **No inventory promise:** Search may use denormalized/read-optimized data but must not promise inventory; hold endpoint rechecks atomically (see [bookings.md](./bookings.md)).
- **Low inventory display:** Do not expose exact low inventory if business chooses not to; if shown, label as time-sensitive.
- **Totals:** Search total must be computed from the pricing service and identify taxes/fees included or excluded (see [pricing.md](./pricing.md)).

### Response and filters

- **Response fields:** hotel ID/slug/name/location, rating summary, image, amenities, matching room type, capacity, available quantity indicator, itemized quote, cancellation summary, currency, and quote time.
- **Filters:** Filter by price bounds, star classification, amenity IDs, room type and rating only when definitions are available.
- **Sorting:** Sort keys are allowlisted.

### API and performance

- **Endpoints:** `GET /api/v1/search`; `GET /api/v1/hotels/:slug` (see [../API.md](../API.md)).
- **Indexes:** Index city/status and relevant filter fields; inventory lookup strategy must be benchmarked.
- **Limits:** Apply result limits and query timeouts.
- **Caching:** Cache hotel content cautiously; do not use stale cached inventory as final availability authority.

### UI states and acceptance

- **Screen states:** Search screen handles invalid input, loading, empty results, partial filter matches, API error and stale quote.
- **URL state:** URL preserves destination/dates/occupancy.
- **Tests:** Tests prove checkout date exclusion, full-range availability, capacity matching, suspended hotel exclusion and hold revalidation.
