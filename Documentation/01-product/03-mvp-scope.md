# MVP Scope and Boundaries

## MVP objective

A super admin can publish a hotel and room inventory; a guest can search a date range, select an available room type, place a booking with a safe inventory hold, and receive a booking reference; staff can find and manage that booking. The system must not overbook under concurrent attempts.

## Must have

- Single-country/currency configuration and explicit property time zone.
- Super-admin login; hotel, room type, policies and base-rate management.
- City/date/guest search; date-range availability and capacity checks.
- Server-side total calculation and clear price breakdown.
- Atomic room hold with expiry, booking creation, release and audit trail.
- Admin booking search/details and limited lifecycle actions.
- Basic responsive guest web flow; logging, backups, error handling and access controls.
- Payment can be initially omitted or use a documented manual/COD flow; if online payment launches, Phase 2 payment controls are mandatory.

## Defer

Hotel manager accounts, Google/OTP login, reviews, coupons, complex seasonal rules, refunds automation, WhatsApp/SMS, invoice PDF, report exports, multiple currencies/languages, channel managers, recommendation AI.

## Explicitly out of MVP

Microservices, multi-property channel synchronization, loyalty wallet, dynamic yield pricing, physical room assignment/housekeeping, automated tax advice, AI in booking decisions.

## MVP exit criteria

- Admin can create and publish a hotel with a room type and inventory.
- Search returns only room types available for every requested night and valid occupancy.
- Simultaneous requests for the final inventory cannot both obtain a hold.
- Expired/cancelled holds release inventory exactly once.
- Booking totals are calculated by the server and persisted with a price breakdown snapshot.
- Staff can inspect booking history and perform authorized lifecycle actions.
- Critical paths, access controls, backup restore and deployment rollback are verified before public launch.
