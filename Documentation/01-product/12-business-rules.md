# Business Rules

## Stay dates and occupancy

- Check-in date is occupied; checkout date is not. Nights are `[checkIn, checkOut)` in the hotel's local calendar.
- Checkout must be later than check-in; define maximum stay and booking horizon.
- Required room count must satisfy requested guest allocation and room type capacity. Do not assume guests can be distributed across rooms without explicit allocation rules.

## Availability

For each room type and night, sellable quantity is total rooms minus blocked, active held and confirmed quantity. Every night in a stay must have enough rooms. Hold/confirm operations must be atomic across the full range. Search results can become stale; the hold is the authoritative recheck.

## Holds and booking

- Default hold: 10 minutes, with server clock and recorded expiry.
- One idempotency key maps to one logical create operation and payload; reuse with different payload returns conflict.
- A hold expiry releases inventory once. Payment success after expiry enters a reconciliation state; do not confirm without inventory.
- Save guest, policy, nightly price, tax and fee snapshots with the booking.

## Pricing and tax

Total is the sum of nightly room amounts times room quantity, plus configured taxes/fees, minus eligible discounts. Use minor currency units and deterministic rounding. Define whether tax is inclusive/exclusive and how GST slabs apply with qualified finance/legal review before launch. Show the breakdown before payment.

## Cancellation and lifecycle

Policy is snapshotted on booking. Cancellation fee/refund depends on the snapshot, property-local cutoff and payment state. A refund is an asynchronous financial workflow; cancellation status and refund status are distinct. Release inventory exactly once after cancellation is accepted.

Suggested booking states: `PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `PAYMENT_REVIEW`. Transitions are explicit and audited. Payment states are separate: `NOT_REQUIRED`, `PENDING`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `PARTIALLY_REFUNDED`, `REFUNDED`.

## Reporting definitions

Document whether revenue is based on captured amount, stay date or transaction date; occupancy is sold room-nights divided by sellable room-nights for selected local dates; cancellations count bookings or room nights and state the denominator.
