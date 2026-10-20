# Admin Dashboard and Reports

<a id="admin-dashboard-reports"></a>
## Admin Dashboard and Reports Specification

### Metric definitions

- **Bookings:** count by booking creation date unless the report explicitly says stay date; exclude test bookings.
- **Gross booking value:** sum of confirmed booking totals or captured payments as explicitly selected; do not label either simply "revenue" without definition.
- **Recognized revenue:** not provided as accounting advice; a finance-approved definition is required.
- **Occupancy:** sold room-nights / sellable room-nights for the selected property and local stay dates; define treatment of blocks and out-of-service inventory.
- **Cancellation rate:** cancelled bookings / eligible bookings in a specified cohort and date basis.
- **Refunds:** report initiated and completed refunds separately.

<a id="business-rules"></a>
### Business rules

- **Reporting definitions:** document whether revenue is based on captured amount, stay date or transaction date; occupancy is sold room-nights divided by sellable room-nights for selected local dates; cancellations count bookings or room nights and state the denominator. (moved from 12-business-rules)
- **Cross-cutting rules:** other business rules that span modules are in [../PRODUCT.md#12-business-rules](../PRODUCT.md#12-business-rules).

### Query behavior

- **Required parameters:** all reports require date range, date basis, hotel scope, currency and timezone.
- **Validation:** validate maximum range, supported filters, sort keys and pagination.
- **Multi-currency:** multi-currency aggregation is prohibited unless the conversion source/time is specified.
- **Scope:** hotel managers see only assigned hotels; super admin may see platform totals.

### Dashboard widgets

- **Widgets:**
  - booking counts by state;
  - upcoming arrivals/departures;
  - occupancy trend;
  - payment/refund exceptions;
  - property performance;
  - recent activity.
- **Widget states:** every widget has loading, empty, error and last-updated states and links to filtered detail where permission allows.

### Exports

- **Export handling:** exports are async for large datasets, permission-gated, audited, use short-lived download links, and redact fields not needed for the report.
- **Limits and safety:** apply row/column limits and prevent spreadsheet formula injection in CSV/XLSX values.

### Acceptance criteria

- **Stable definitions:** the same documented query returns stable metric definitions and timezone boundaries.
- **Boundary tests:** tests cover daylight-saving transitions where relevant and month-end boundaries.
- **Scope in aggregation:** property scope is enforced in aggregations, not merely in UI filters.
- **Export reconciliation:** export rows reconcile to displayed totals and record actor, filters, and time.
