# Testing Strategy

Prioritize tests by financial and inventory risk.

## Unit tests

Test date interval boundaries, capacity allocation, per-night rate resolution, tax/discount rounding, cancellation cutoffs, state transitions and idempotency behavior.

## Database integration tests

- Two concurrent attempts for the last room: exactly one succeeds.
- Multi-night stay where one night is unavailable: no partial inventory is held.
- Expiry/cancellation/retry releases inventory exactly once.
- Duplicate webhook and out-of-order payment events do not double-confirm/refund.
- Date boundaries correctly exclude checkout night and respect property time zone.

## API and authorization tests

Validate DTO errors, stable status/error codes, guest ownership, hotel-manager scope, super-admin capabilities, audit records and rate limits.

## End-to-end tests

Admin configures a hotel → guest searches → creates hold → completes test payment → sees confirmation → admin checks guest in/out. Add expiry, payment failure, cancellation/refund, mobile viewport and keyboard paths.

## Operations verification

Test migrations from prior version, backup restore, payment reconciliation, monitoring alerts and rollback. Tests should run against a real transactional database engine, not only mocks, for concurrency guarantees.
