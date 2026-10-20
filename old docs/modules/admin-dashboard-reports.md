# Admin Dashboard and Reports Specification

## Metric definitions

- **Bookings:** count by booking creation date unless report explicitly says stay date; exclude test bookings.
- **Gross booking value:** sum of confirmed booking totals or captured payments as explicitly selected; do not label either simply “revenue” without definition.
- **Recognized revenue:** not provided as accounting advice; finance-approved definition required.
- **Occupancy:** sold room-nights / sellable room-nights for the selected property and local stay dates; define treatment of blocks and out-of-service inventory.
- **Cancellation rate:** cancelled bookings / eligible bookings in a specified cohort and date basis.
- **Refunds:** report initiated and completed refunds separately.

## Query behavior

All reports require date range, date basis, hotel scope, currency and timezone. Validate maximum range, supported filters, sort keys and pagination. Multi-currency aggregation is prohibited unless conversion source/time is specified. Hotel managers see only assigned hotels; super admin may see platform totals.

## Dashboard widgets

Booking counts by state, upcoming arrivals/departures, occupancy trend, payment/refund exceptions, property performance, recent activity. Every widget has loading, empty, error and last-updated states and links to filtered detail where permission allows.

## Exports

Exports are async for large datasets, permission-gated, audited, short-lived download links, and redact fields not needed for the report. Apply row/column limits and prevent spreadsheet formula injection in CSV/XLSX values.

## Acceptance criteria

- Same documented query returns stable metric definitions and timezone boundaries.
- Tests cover daylight-saving transitions where relevant and month-end boundaries.
- Property scope is enforced in aggregations, not merely in UI filters.
- Export rows reconcile to displayed totals and record actor, filters, and time.
