# Product Requirements

## Goal

Enable guests to discover and book available hotel rooms and enable platform staff to operate hotel inventory and stays.

## Guest requirements

### Search and discovery

- Search by destination, check-in, checkout, adults, children and room count.
- Require checkout after check-in and valid positive guest/room counts.
- List only hotels with a room type meeting capacity and inventory for every night.
- Filter/sort by price, rating, amenities and room type; show date-specific total or clearly labeled nightly rate, fees, taxes and availability timestamp.
- Hotel detail includes description, location, photos, amenities, room types, capacity, policies, check-in/out times and verified reviews.

### Booking

- Select room type and quantity, enter guest/contact details, review itemized total, accept policy and create a time-limited hold.
- Show hold expiry and payment result; prevent duplicate submission.
- Confirmation includes a unique reference, stay summary, payment state and invoice/receipt access.
- Guest can retrieve booking securely, view history, and cancel within policy. Modification can be deferred until a safe repricing workflow exists.

### Reviews

- Only a guest associated with a completed stay can submit one review per eligible booking/room experience.
- Reviews are moderated before public display in the initial release.

## Admin requirements

- Authenticated staff can create, edit, publish, disable and archive hotels.
- Manage room types, capacities, total room counts, base rates and policies.
- View date-range inventory; block/unblock rooms for maintenance and set date-specific prices.
- Search bookings by reference, property, guest, date and status; view booking/payment timeline.
- Manage lifecycle actions with permission checks and audit records.
- Super admin can manage staff and view platform-wide reports. Property-scoped manager access is a later phase.

## Shared services

- Availability and reservation service; pricing and coupon service; booking lifecycle; payment gateway adapter and verified webhook; refund workflow; notification delivery; media storage; audit trail.
- Revenue, occupancy and cancellation reports use documented definitions and date basis.

## Non-functional requirements

- Correctness: concurrency-safe room inventory and idempotent payment events.
- Security: validated input, secure sessions, least-privilege authorization, encrypted transport, secrets management and auditability.
- Performance: establish baselines; target search P95 under 500 ms at expected MVP load, excluding external services.
- Accessibility: keyboard operation, labels, visible focus, sufficient contrast and meaningful errors.
- Reliability: backups with tested restore procedure, monitoring and payment reconciliation.
- Privacy: collect only needed guest data; define retention and deletion rules for launch jurisdictions.
