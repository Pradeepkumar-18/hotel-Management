# Availability and Booking Module Plan

## Purpose

This module protects the core promise: a confirmed stay has inventory for every night, at the price and policy shown when it was booked.

## Inventory model

Represent sellable quantity as one MongoDB document per `(roomTypeId, localStayDate)`, protected by a unique compound index. Persist `total`, `blocked`, `held`, and `confirmed` counts as the authoritative counters; reservation/hold detail rows provide traceability and reconciliation. Keep `held + confirmed + blocked <= total` true under concurrent writes. Every inventory claim includes all dates from check-in to checkout exclusive. MongoDB runs as a replica set in all transaction-enabled environments.

### Initial administrative inventory API

- `GET /api/v1/admin/room-types/:roomTypeId/inventory?from=YYYY-MM-DD&to=YYYY-MM-DD` reads the `[from, to)` calendar and reports missing dates.
- `POST /api/v1/admin/room-types/:roomTypeId/inventory/initialize` creates missing dates from the room type's current sellable total; ranges are capped at 366 nights.
- `POST /api/v1/admin/room-types/:roomTypeId/inventory/:stayDate/block` and `/unblock` make reasoned, version-checked nightly adjustments.
- Updating `totalRooms` on a room type changes every initialized night only if the new total still covers blocked, held, and confirmed quantities. All catalog inventory changes are audited in the same transaction.

## Create hold

1. Validate hotel/room type is bookable, occupancy fits, dates are allowed, and requested quantity is positive.
2. Resolve per-night prices and policy; calculate a server-side quote.
3. Start a MongoDB transaction and conditionally update each nightly document only where `total - blocked - held - confirmed >= requestedRooms`.
4. If any conditional update modifies zero documents, abort the transaction and return `INVENTORY_UNAVAILABLE`; otherwise persist the hold, expiry, idempotency key, quote, and guest/session association in the same transaction.
5. Retry transient transaction errors within a bounded policy; never retry business conflicts as if they were transient. Return hold ID, expiry, and itemized quote only after commit.

## Confirm booking

- Create payment intent outside inventory transaction where provider requires it.
- On verified provider success, lock hold/booking and atomically transition to confirmed if valid. Deduplicate provider event ID.
- If hold expired or inventory was released, mark `PAYMENT_REVIEW`, reconcile inventory, and refund/void according to provider capability.
- Store provider event outcome and booking transition for audit.

## Expiry and cancellation

An expiry worker reaps overdue holds, but correctness cannot depend only on the worker running. Claims must check expiry transactionally. To prevent expired holds from occupying counters indefinitely, transactionally query/release expired hold-night claims before making a new claim for affected inventory documents, using idempotent hold state transitions and bounded contention retries. Cancellation releases each night once; keep refund processing separate and retryable. Periodic reconciliation compares counters to active hold/booking records and alerts on mismatch; automated repair must be controlled and audited.

## Data consistency rules

- Use integer room quantities and reject zero/negative counts.
- Create/consume/release a hold with a compare-and-set state change so two workers cannot process it twice.
- Convert held quantity to confirmed quantity in one transaction; total occupied quantity remains unchanged.
- Release confirmed quantity only after a valid cancellation/no-show policy transition; do not release for a pending refund alone.
- Keep database transactions short and never call a payment/email/media provider inside one.
- Use transaction-level write concern suitable for booking correctness and retry only MongoDB transient transaction errors.

## Required tests

- Concurrent claim for last room; multi-night partial availability; checkout-date boundary; DST/time-zone boundary; duplicate create key; expiry worker delayed; duplicate/out-of-order webhooks; payment after expiry; repeated cancellation.

## Operational metrics

Hold creation conflicts, expiry lag, orphaned payment count/age, booking conversion, inventory invariant violations (alert immediately), and manual reconciliation queue size.
