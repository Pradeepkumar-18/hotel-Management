# Bookings (Availability and Booking Lifecycle)

<a id="availability-booking"></a>
## Availability and Booking Module Plan

### Purpose

- **Core promise:** This module protects the core promise: a confirmed stay has inventory for every night, at the price and policy shown when it was booked.

### Inventory model

- **Nightly documents:** Represent sellable quantity as one MongoDB document per `(roomTypeId, localStayDate)`, protected by a unique compound index.
- **Authoritative counters:** Persist `total`, `blocked`, `held`, and `confirmed` counts as the authoritative counters; reservation/hold detail rows provide traceability and reconciliation.
- **Invariant:** Keep `held + confirmed + blocked <= total` true under concurrent writes.
- **Date range:** Every inventory claim includes all dates from check-in to checkout exclusive.
- **Replica set:** MongoDB runs as a replica set in all transaction-enabled environments (see [deployment-operations.md](./deployment-operations.md)).

#### Initial administrative inventory API

- **Read calendar:** `GET /api/v1/admin/room-types/:roomTypeId/inventory?from=YYYY-MM-DD&to=YYYY-MM-DD` reads the `[from, to)` calendar and reports missing dates.
- **Initialize:** `POST /api/v1/admin/room-types/:roomTypeId/inventory/initialize` creates missing dates from the room type's current sellable total; ranges are capped at 366 nights.
- **Block/unblock:** `POST /api/v1/admin/room-types/:roomTypeId/inventory/:stayDate/block` and `/unblock` make reasoned, version-checked nightly adjustments.
- **Total rooms update:** Updating `totalRooms` on a room type changes every initialized night only if the new total still covers blocked, held, and confirmed quantities (see [room-types.md](./room-types.md)).
- **Audit:** All catalog inventory changes are audited in the same transaction.

### Create hold

- **Step 1 — Validate:** Validate hotel/room type is bookable, occupancy fits, dates are allowed, and requested quantity is positive.
- **Step 2 — Quote:** Resolve per-night prices and policy; calculate a server-side quote (see [pricing.md](./pricing.md)).
- **Step 3 — Conditional claim:** Start a MongoDB transaction and conditionally update each nightly document only where `total - blocked - held - confirmed >= requestedRooms`.
- **Step 4 — Commit or abort:** If any conditional update modifies zero documents, abort the transaction and return `INVENTORY_UNAVAILABLE`; otherwise persist the hold, expiry, idempotency key, quote, and guest/session association in the same transaction.
- **Step 5 — Retry and respond:** Retry transient transaction errors within a bounded policy; never retry business conflicts as if they were transient. Return hold ID, expiry, and itemized quote only after commit.

### Confirm booking

- **Payment intent:** Create payment intent outside inventory transaction where provider requires it (see [payments.md](./payments.md)).
- **Verified success:** On verified provider success, lock hold/booking and atomically transition to confirmed if valid. Deduplicate provider event ID.
- **Expired hold:** If hold expired or inventory was released, mark `PAYMENT_REVIEW`, reconcile inventory, and refund/void according to provider capability.
- **Audit:** Store provider event outcome and booking transition for audit.

### Expiry and cancellation

- **Expiry worker:** An expiry worker reaps overdue holds, but correctness cannot depend only on the worker running. Claims must check expiry transactionally.
- **Release before claim:** To prevent expired holds from occupying counters indefinitely, transactionally query/release expired hold-night claims before making a new claim for affected inventory documents, using idempotent hold state transitions and bounded contention retries.
- **Cancellation release:** Cancellation releases each night once; keep refund processing separate and retryable.
- **Reconciliation:** Periodic reconciliation compares counters to active hold/booking records and alerts on mismatch; automated repair must be controlled and audited.

### Data consistency rules

- **Quantities:** Use integer room quantities and reject zero/negative counts.
- **Compare-and-set holds:** Create/consume/release a hold with a compare-and-set state change so two workers cannot process it twice.
- **Held to confirmed:** Convert held quantity to confirmed quantity in one transaction; total occupied quantity remains unchanged.
- **Release conditions:** Release confirmed quantity only after a valid cancellation/no-show policy transition; do not release for a pending refund alone.
- **Short transactions:** Keep database transactions short and never call a payment/email/media provider inside one.
- **Write concern and retries:** Use transaction-level write concern suitable for booking correctness and retry only MongoDB transient transaction errors.

### Required tests

- **Test list:** Concurrent claim for last room; multi-night partial availability; checkout-date boundary; DST/time-zone boundary; duplicate create key; expiry worker delayed; duplicate/out-of-order webhooks; payment after expiry; repeated cancellation.
- **Testing approach:** See [../guidelines/testing-devops.md](../guidelines/testing-devops.md).

### Operational metrics

- **Metrics:** Hold creation conflicts, expiry lag, orphaned payment count/age, booking conversion, inventory invariant violations (alert immediately), and manual reconciliation queue size.

<a id="booking-lifecycle"></a>
## Booking Lifecycle Specification

### State model

- **Booking status:** `PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `PAYMENT_REVIEW` (also stated in 12-business-rules; see Business rules below).
- **Payment state:** Payment state is separate (see [payments.md](./payments.md)).
- **Hold state:** Hold state is separate (`ACTIVE`, `CONSUMED`, `EXPIRED`, `RELEASED`).
- **Transition record:** Every transition has actor/source, timestamp, reason, and idempotency/event reference.

### Allowed transitions

- **`PENDING_PAYMENT → CONFIRMED`:** Only after verified payment or an explicitly supported no-payment method.
- **`PENDING_PAYMENT → CANCELLED`:** On failure/expiry.
- **`CONFIRMED → CHECKED_IN | CANCELLED | NO_SHOW`:** From confirmed.
- **`CHECKED_IN → CHECKED_OUT`:** From checked in.
- **`CHECKED_OUT → COMPLETED`:** From checked out.
- **Exceptional corrections:** Require a separately permissioned audited operation.
- **No reopening:** Never reopen cancelled bookings by directly editing status.

### Create flow

- **Step 1 — Accept:** Accept hold ID, idempotency key, guest/contact details and accepted policy version.
- **Step 2 — Verify:** Verify ownership, hold state/expiry, quote validity and guest/contact requirements.
- **Step 3 — Persist:** Persist booking, booking-night snapshots, inventory conversion, and outbox/event record transactionally where applicable.
- **Step 4 — Initiate payment:** Initiate payment after commit; store provider intent reference.
- **Step 5 — Confirm:** Confirm only through verified provider result or permitted non-online flow.

### Modification/cancellation

- **Modification as repricing:** Modification is a repricing operation:
  - quote new stay;
  - claim added nights before releasing old nights;
  - calculate any payment/refund difference;
  - require guest acceptance;
  - commit with optimistic version.
- **Fallback:** If this atomic workflow is not implemented, disable self-service modification.
- **Cancellation:** Cancellation delegates fee calculation to policy module ([cancellation-policies.md](./cancellation-policies.md)) and releases inventory once; refund processing remains separately tracked.

### Walk-in and operations

- **Walk-in booking:** Requires `bookings.create_walkin`, server pricing and inventory claim, staff actor, payment method/status, guest consent/contact rules, and audit reason.
- **Check-in:** Requires confirmed booking and valid local date/policy.
- **Checkout:** Requires checked-in state unless a privileged exception is recorded.

### Idempotency and concurrency

- **Key scope:** Use idempotency key unique per actor/operation and request fingerprint.
- **Replays:** Repeated same request returns original result; different payload with same key conflicts.
- **Double transition prevention:** Use booking version/conditional state update to prevent double transition.
- **No open transactions over network:** Never hold database transaction open during gateway/network call.

### Acceptance criteria

- **Stable errors:** Invalid transitions fail with stable error codes.
- **Single effect:** Duplicate requests create one booking and one inventory effect.
- **Crash recovery:** Payment result, inventory, and booking state remain reconcilable after process crash.
- **History:** All state transitions appear in booking history and audit trail (see [audit-logging.md](./audit-logging.md)).

<a id="business-rules"></a>
### Business rules

- **Availability:** For each room type and night, sellable quantity is total rooms minus blocked, active held and confirmed quantity. Every night in a stay must have enough rooms. Hold/confirm operations must be atomic across the full range. Search results can become stale; the hold is the authoritative recheck. (moved from 12-business-rules)
- **Holds and booking:**
  - **Default hold:** 10 minutes, with server clock and recorded expiry. (moved from 12-business-rules)
  - **Idempotency key:** One idempotency key maps to one logical create operation and payload; reuse with different payload returns conflict. (moved from 12-business-rules)
  - **Hold expiry:** A hold expiry releases inventory once. Payment success after expiry enters a reconciliation state; do not confirm without inventory. (moved from 12-business-rules)
  - **Snapshots:** Save guest, policy, nightly price, tax and fee snapshots with the booking. (moved from 12-business-rules)
- **Suggested booking states:** `PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `PAYMENT_REVIEW`. Transitions are explicit and audited. Payment states are separate (listed in [payments.md](./payments.md#business-rules)). (moved from 12-business-rules)
- **Cross-cutting rules:** Stay dates, minor units and separate state machines are defined in [../PRODUCT.md#12-business-rules](../PRODUCT.md#12-business-rules).
