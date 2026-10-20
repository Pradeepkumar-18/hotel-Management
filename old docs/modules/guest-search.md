# Guest Search and Hotel Detail Specification

## Query contract

Inputs: destination/city, checkIn, checkOut, rooms, adults, children/ages if supported, filters, sort, page, pageSize. Dates are date-only and evaluated in each hotel's timezone; platform must define destination behavior where timezone differs. Reject invalid dates, unsupported filters, excessive stay length, invalid occupancy and unbounded pagination.

## Search correctness

- Include only published, non-suspended hotels and active room types.
- A room type qualifies only if requested occupancy fits and quantity is available on every night.
- Search may use denormalized/read-optimized data but must not promise inventory; hold endpoint rechecks atomically.
- Do not expose exact low inventory if business chooses not to; if shown, label as time-sensitive.
- Search total must be computed from the pricing service and identify taxes/fees included or excluded.

## Response and filters

Return hotel ID/slug/name/location, rating summary, image, amenities, matching room type, capacity, available quantity indicator, itemized quote, cancellation summary, currency, and quote time. Filter by price bounds, star classification, amenity IDs, room type and rating only when definitions are available. Sort keys are allowlisted.

## API and performance

`GET /api/v1/search`; `GET /api/v1/hotels/:slug`. Index city/status and relevant filter fields; inventory lookup strategy must be benchmarked. Apply result limits and query timeouts. Cache hotel content cautiously; do not use stale cached inventory as final availability authority.

## UI states and acceptance

Search screen handles invalid input, loading, empty results, partial filter matches, API error and stale quote. URL preserves destination/dates/occupancy. Tests prove checkout date exclusion, full-range availability, capacity matching, suspended hotel exclusion and hold revalidation.
