# Pricing and Tax Module Specification

## Responsibilities

Resolve nightly rate, quantity, occupancy surcharge if configured, taxes, fees, discounts, and final total. The service returns an immutable quote and booking snapshot. Browser display components only format returned amounts.

## Data and amount conventions

Use integer minor units and ISO currency on every monetary record. Rate rules include roomTypeId, date/effective interval, amount, currency, priority, status, restrictions, createdBy, version. Tax configuration includes jurisdiction, effective dates, rate/slab, inclusive/exclusive mode, taxable basis, rounding policy, and source/reference. Tax rules require launch-market finance/legal approval.

## Rate resolution

The first implementation stores one audited base rate per room type using integer minor units, an ISO currency code, and optimistic versioning. Date-specific rate rules and quote resolution are not implemented yet.

For each night, select the highest-priority active applicable rule under an explicit tie-breaker; otherwise use base rate. Reject ambiguous equal-priority overlaps during rule creation. The quote lists each night’s rate and subtotal. Revalidate when creating the hold. If price changes materially between search and hold, show updated quote and require guest acceptance before payment.

## Tax, fees and rounding

Implement approved tax policy as deterministic server logic. Define tax basis, whether fees are taxable, tax-inclusive/exclusive behavior, slab threshold basis, rounding per line or invoice, and residual allocation. Do not infer GST legal treatment from code examples. Persist tax components and rule version in booking snapshot.

Base-rate administration and hotel publication are implemented. Publication requires every active room type to have a base rate in the same currency, and fixed cancellation fees must match it. This setup does not calculate taxes or establish a guest quote; ADR-007 remains open.

## Coupon extension

Coupon application is separate from rate selection. Validate activation dates, property/room scope, minimum amount, maximum cap, guest eligibility, usage limits and concurrent redemption atomically. Record redemption against booking and reverse only under explicit cancellation rules.

## API and quote fields

Quote response includes currency, room type, stay dates, room quantity, nightly lines, subtotal, tax components, fees, discount, grand total, policy summary, generatedAt, validUntil, and quote ID. Quote is advisory until inventory hold is committed.

## Acceptance criteria

- Same input and rule version produces the same total.
- Negative, overflow, mixed-currency, and floating-point-derived amounts are rejected.
- Rate overlaps are deterministic or rejected.
- Booking snapshot remains unchanged after later rate/tax configuration edits.
- Tax rules are disabled in production until documented approval is recorded.
