# Booking Lifecycle Specification

## State model

Booking status: `PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `PAYMENT_REVIEW`. Payment state is separate. Hold state is separate (`ACTIVE`, `CONSUMED`, `EXPIRED`, `RELEASED`). Every transition has actor/source, timestamp, reason, and idempotency/event reference.

## Allowed transitions

`PENDING_PAYMENT → CONFIRMED` only after verified payment or an explicitly supported no-payment method; `PENDING_PAYMENT → CANCELLED` on failure/expiry; `CONFIRMED → CHECKED_IN | CANCELLED | NO_SHOW`; `CHECKED_IN → CHECKED_OUT`; `CHECKED_OUT → COMPLETED`. Exceptional corrections require a separately permissioned audited operation. Never reopen cancelled bookings by directly editing status.

## Create flow

1. Accept hold ID, idempotency key, guest/contact details and accepted policy version.
2. Verify ownership, hold state/expiry, quote validity and guest/contact requirements.
3. Persist booking, booking-night snapshots, inventory conversion, and outbox/event record transactionally where applicable.
4. Initiate payment after commit; store provider intent reference.
5. Confirm only through verified provider result or permitted non-online flow.

## Modification/cancellation

Modification is a repricing operation: quote new stay, claim added nights before releasing old nights, calculate any payment/refund difference, require guest acceptance, and commit with optimistic version. If this atomic workflow is not implemented, disable self-service modification. Cancellation delegates fee calculation to policy module and releases inventory once; refund processing remains separately tracked.

## Walk-in and operations

Walk-in booking requires `bookings.create_walkin`, server pricing and inventory claim, staff actor, payment method/status, guest consent/contact rules, and audit reason. Check-in requires confirmed booking and valid local date/policy; checkout requires checked-in state unless a privileged exception is recorded.

## Idempotency and concurrency

Use idempotency key unique per actor/operation and request fingerprint. Repeated same request returns original result; different payload with same key conflicts. Use booking version/conditional state update to prevent double transition. Never hold database transaction open during gateway/network call.

## Acceptance criteria

- Invalid transitions fail with stable error codes.
- Duplicate requests create one booking and one inventory effect.
- Payment result, inventory, and booking state remain reconcilable after process crash.
- All state transitions appear in booking history and audit trail.
