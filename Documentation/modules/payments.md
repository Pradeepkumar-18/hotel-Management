# Payments and Refunds

<a id="payments-refunds"></a>
## Payments and Refunds Specification

### Boundaries

- **Gateway integration only:** Payment module integrates gateway; it does not decide room availability or cancellation eligibility.
- **Ownership split:**
  - Booking service owns booking state ([bookings.md](./bookings.md)).
  - Pricing service owns amount ([pricing.md](./pricing.md)).
  - Cancellation policy service owns refund basis ([cancellation-policies.md](./cancellation-policies.md)).
- **Card data:** Never store card data.

### Payment state machine

- **Payment states:** `CREATED → PENDING → AUTHORIZED/CAPTURED` or `FAILED/EXPIRED`.
- **Refund states:** Refund has its own state `REQUESTED → APPROVED → PROCESSING → SUCCEEDED/FAILED`.
- **Provider mapping:** Exact provider mapping is documented per adapter.
- **No auto-confirm:** A gateway success does not confirm a booking until inventory/hold conditions are checked.

### Initiation

- **Server-created order:** Server creates provider order/intent using booking currency and amount from persisted quote snapshot.
- **Persist first:** Persist unique internal payment ID and provider reference before returning checkout parameters.
- **Client data:** Client receives only provider-safe data; secrets remain server-side.
- **Idempotency:** Use provider idempotency key mapped to booking/payment attempt.

### Webhooks

- **Step 1 — Verify:** Capture raw request bytes and verify signature/timestamp per provider spec.
- **Step 2 — Persist event ID:** Persist provider event ID with unique index before applying effects.
- **Step 3 — Reject/deduplicate:** Reject invalid signatures; deduplicate valid repeated event IDs.
- **Step 4 — Apply:** Apply event using monotonic/allowed transition rules and transaction where local records change together.
- **Step 5 — Unmatched events:** Record unmatched/out-of-order events for reconciliation instead of discarding.
- **Step 6 — Respond:** Return provider-required success response only after durable acceptance; asynchronous processing uses durable inbox/outbox.

### Refunds

- **Refundable amount:** Compute refundable amount from booking snapshot and cancellation policy; staff cannot submit arbitrary amount without a separately granted override permission.
- **Cap:** Refund amount cannot exceed captured amount less prior successful refunds.
- **Persisted fields:** Persist refund request, approver, reason, amount, currency, gateway reference, and status.
- **Safe retries:** Retry safely with provider idempotency; reconcile uncertain outcomes before issuing another refund.
- **No rollback on delay:** Booking cancellation and inventory release are not rolled back merely because gateway refund is delayed; show refund pending.

### Reconciliation and security

- **Reconciliation:** Daily or frequent reconciliation compares internal payments/refunds with provider reports.
- **Alerts:** Alert on captured payment without confirmed booking, confirmed booking without required capture, duplicate capture, and aged refund.
- **Access:** Restrict payment detail access and redact sensitive provider payloads (see [../guidelines/backend.md](../guidelines/backend.md)).

### Acceptance criteria

- **Duplicate webhooks:** Duplicate webhook cannot duplicate capture/refund effects.
- **Invalid signatures:** Invalid signature never changes booking/payment state.
- **Late success:** Late success after hold expiry enters explicit review/compensation path.
- **Refund cap:** Refund retries cannot exceed captured balance.
- **Provider outage:** Provider outage does not corrupt inventory or strand an untracked payment.

<a id="business-rules"></a>
### Business rules

- **Payment states:** Payment states are separate: `NOT_REQUIRED`, `PENDING`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `PARTIALLY_REFUNDED`, `REFUNDED`. (moved from 12-business-rules)
  - Note: this list differs from the state machine above (`CREATED`, `EXPIRED` there; `NOT_REQUIRED`, `PARTIALLY_REFUNDED`, `REFUNDED` here). Both are kept as written in their sources.
- **Cross-cutting rules:** Stay dates, minor units and separate state machines are defined in [../PRODUCT.md#12-business-rules](../PRODUCT.md#12-business-rules).
