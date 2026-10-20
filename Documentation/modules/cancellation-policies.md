# Cancellation Policies

<a id="cancellation-policies"></a>
## Cancellation Policy Specification

### Policy model

- **Policy versions:** Define free-cancellation cutoff relative to check-in (e.g., hours/days), fee schedule after cutoff, no-show treatment, currency/fee basis, timezone interpretation, and effective dates.
- **Property selection:** Property may select an approved policy (see [hotels.md](./hotels.md)).
- **Determinism:** Keep policy configuration deterministic and versioned.

### Booking snapshot

- **Snapshot at confirmation:** At confirmation, copy policy ID/version and all terms needed to calculate cancellation into booking.
- **Future-only edits:** Later edits affect new bookings only.
- **Guest display:** Display exact local cutoff timestamp and fee/refund estimate to guest before booking and cancellation submission.

### Calculation

- **Input:** booking snapshot, request time, booking state, captured amount, prior refunds.
- **Steps:** Resolve property-local cancellation deadline, compute fee under configured schedule, cap refundable amount at remaining captured balance, and return itemized calculation.
- **Money:** Use integer minor units and approved rounding policy.
- **Tax reversal:** Tax reversal requirements must be market-configured and reviewed.

### Flow

- **Submission:** Guest/admin submits cancellation with idempotency key.
- **Validation:** Validate actor, current status, policy, cutoff and refund state.
- **Transaction:** Transactionally transition booking to cancelled and release inventory once; create refund request when applicable (see [bookings.md](./bookings.md)).
- **Async refund:** Gateway refund completes asynchronously (see [payments.md](./payments.md)).
- **History and notification:** Preserve event history and send notification after durable state change (see [notifications.md](./notifications.md)).

### Exceptions

- **Admin override:** Requires permission, reason, second approval for configured thresholds, and audit record.
- **No silent edits:** Do not silently edit booking policy.
- **Partial cancellation:** Partial cancellation/room reduction requires separate per-room/per-night allocation rules and is out of initial scope unless specified.

### Acceptance criteria

- **Cutoff boundaries:** Boundary tests cover immediately before/at/after cutoff in property timezone.
- **No rewrite:** Policy changes do not rewrite existing booking results.
- **Idempotent cancellation:** Repeated cancellation request does not release inventory or refund twice.
- **Guest preview:** Guest sees fee and estimated refund before confirming cancellation.

<a id="business-rules"></a>
### Business rules

- **Cancellation and lifecycle:** Policy is snapshotted on booking. Cancellation fee/refund depends on the snapshot, property-local cutoff and payment state. A refund is an asynchronous financial workflow; cancellation status and refund status are distinct. Release inventory exactly once after cancellation is accepted. (moved from 12-business-rules)
- **Cross-cutting rules:** Stay dates, minor units and separate state machines are defined in [../PRODUCT.md#12-business-rules](../PRODUCT.md#12-business-rules).
