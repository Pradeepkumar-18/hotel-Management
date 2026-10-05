# Payments and Refunds Specification

## Boundaries

Payment module integrates gateway; it does not decide room availability or cancellation eligibility. Booking service owns booking state, pricing service owns amount, cancellation policy service owns refund basis. Never store card data.

## Payment state machine

`CREATED → PENDING → AUTHORIZED/CAPTURED` or `FAILED/EXPIRED`; refund has its own state `REQUESTED → APPROVED → PROCESSING → SUCCEEDED/FAILED`. Exact provider mapping is documented per adapter. A gateway success does not confirm a booking until inventory/hold conditions are checked.

## Initiation

- Server creates provider order/intent using booking currency and amount from persisted quote snapshot.
- Persist unique internal payment ID and provider reference before returning checkout parameters.
- Client receives only provider-safe data; secrets remain server-side.
- Use provider idempotency key mapped to booking/payment attempt.

## Webhooks

1. Capture raw request bytes and verify signature/timestamp per provider spec.
2. Persist provider event ID with unique index before applying effects.
3. Reject invalid signatures; deduplicate valid repeated event IDs.
4. Apply event using monotonic/allowed transition rules and transaction where local records change together.
5. Record unmatched/out-of-order events for reconciliation instead of discarding.
6. Return provider-required success response only after durable acceptance; asynchronous processing uses durable inbox/outbox.

## Refunds

- Compute refundable amount from booking snapshot and cancellation policy; staff cannot submit arbitrary amount without a separately granted override permission.
- Refund amount cannot exceed captured amount less prior successful refunds.
- Persist refund request, approver, reason, amount, currency, gateway reference, and status.
- Retry safely with provider idempotency; reconcile uncertain outcomes before issuing another refund.
- Booking cancellation and inventory release are not rolled back merely because gateway refund is delayed; show refund pending.

## Reconciliation and security

Daily or frequent reconciliation compares internal payments/refunds with provider reports. Alert on captured payment without confirmed booking, confirmed booking without required capture, duplicate capture, and aged refund. Restrict payment detail access and redact sensitive provider payloads.

## Acceptance criteria

- Duplicate webhook cannot duplicate capture/refund effects.
- Invalid signature never changes booking/payment state.
- Late success after hold expiry enters explicit review/compensation path.
- Refund retries cannot exceed captured balance.
- Provider outage does not corrupt inventory or strand an untracked payment.
