# Cancellation Policy Specification

## Policy model

Policy versions define free-cancellation cutoff relative to check-in (e.g., hours/days), fee schedule after cutoff, no-show treatment, currency/fee basis, timezone interpretation, and effective dates. Property may select an approved policy. Keep policy configuration deterministic and versioned.

## Booking snapshot

At confirmation, copy policy ID/version and all terms needed to calculate cancellation into booking. Later edits affect new bookings only. Display exact local cutoff timestamp and fee/refund estimate to guest before booking and cancellation submission.

## Calculation

Input: booking snapshot, request time, booking state, captured amount, prior refunds. Resolve property-local cancellation deadline, compute fee under configured schedule, cap refundable amount at remaining captured balance, and return itemized calculation. Use integer minor units and approved rounding policy. Tax reversal requirements must be market-configured and reviewed.

## Flow

Guest/admin submits cancellation with idempotency key. Validate actor, current status, policy, cutoff and refund state. Transactionally transition booking to cancelled and release inventory once; create refund request when applicable. Gateway refund completes asynchronously. Preserve event history and send notification after durable state change.

## Exceptions

Admin override requires permission, reason, second approval for configured thresholds, and audit record. Do not silently edit booking policy. Partial cancellation/room reduction requires separate per-room/per-night allocation rules and is out of initial scope unless specified.

## Acceptance criteria

- Boundary tests cover immediately before/at/after cutoff in property timezone.
- Policy changes do not rewrite existing booking results.
- Repeated cancellation request does not release inventory or refund twice.
- Guest sees fee and estimated refund before confirming cancellation.
