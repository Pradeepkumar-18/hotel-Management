# Pricing and Tax

<a id="pricing-tax"></a>
## Pricing and Tax Module Specification

### Responsibilities

- **Scope:** Resolve nightly rate, quantity, occupancy surcharge if configured, taxes, fees, discounts, and final total.
- **Output:** The service returns an immutable quote and booking snapshot.
- **Browser role:** Browser display components only format returned amounts.

### Data and amount conventions

- **Money format:** Use integer minor units and ISO currency on every monetary record.
- **Admin UI input:** Staff type amounts in major units (e.g. ₹2,499.50).
  - The shared `MoneyInput` / `utils/money.ts` converts exactly to minor units (249950) using the currency's decimal places.
  - It rejects extra decimals and negatives.
  - The server remains the authority that validates the integer.
- **Rate rules:** Include roomTypeId, date/effective interval, amount, currency, priority, status, restrictions, createdBy, version.
- **Tax configuration:** Includes jurisdiction, effective dates, rate/slab, inclusive/exclusive mode, taxable basis, rounding policy, and source/reference.
- **Approval:** Tax rules require launch-market finance/legal approval.

### Rate resolution

- **Current implementation:** The first implementation stores one audited base rate per room type using integer minor units, an ISO currency code, and optimistic versioning.
  - Date-specific rate rules and quote resolution are not implemented yet.
- **Per-night selection:** For each night, select the highest-priority active applicable rule under an explicit tie-breaker; otherwise use base rate.
- **Overlap rejection:** Reject ambiguous equal-priority overlaps during rule creation.
- **Quote lines:** The quote lists each night's rate and subtotal.
- **Hold revalidation:** Revalidate when creating the hold.
- **Material price change:** If price changes materially between search and hold, show updated quote and require guest acceptance before payment.

### Tax, fees and rounding

- **Deterministic logic:** Implement approved tax policy as deterministic server logic.
- **Decisions to define:** tax basis, whether fees are taxable, tax-inclusive/exclusive behavior, slab threshold basis, rounding per line or invoice, and residual allocation.
- **GST caution:** Do not infer GST legal treatment from code examples.
- **Snapshot:** Persist tax components and rule version in booking snapshot.
- **Implementation status:** Base-rate administration and hotel publication are implemented.
  - Publication requires every active room type to have a base rate in the same currency, and fixed cancellation fees must match it (see [hotels.md](./hotels.md)).
  - This setup does not calculate taxes or establish a guest quote; ADR-007 remains open (see [../ARCHITECTURE.md](../ARCHITECTURE.md)).

### Coupon extension

- **Separation:** Coupon application is separate from rate selection.
- **Validation:** Validate activation dates, property/room scope, minimum amount, maximum cap, guest eligibility, usage limits and concurrent redemption atomically.
- **Redemption:** Record redemption against booking and reverse only under explicit cancellation rules.

### API and quote fields

- **Quote response fields:** currency, room type, stay dates, room quantity, nightly lines, subtotal, tax components, fees, discount, grand total, policy summary, generatedAt, validUntil, and quote ID.
- **Advisory quote:** Quote is advisory until inventory hold is committed (see [bookings.md](./bookings.md)).

### Acceptance criteria

- **Determinism:** Same input and rule version produces the same total.
- **Invalid amounts:** Negative, overflow, mixed-currency, and floating-point-derived amounts are rejected.
- **Overlaps:** Rate overlaps are deterministic or rejected.
- **Snapshot immutability:** Booking snapshot remains unchanged after later rate/tax configuration edits.
- **Production gate:** Tax rules are disabled in production until documented approval is recorded.

<a id="business-rules"></a>
### Business rules

- **Pricing and tax:** Total is the sum of nightly room amounts times room quantity, plus configured taxes/fees, minus eligible discounts. Use minor currency units and deterministic rounding. Define whether tax is inclusive/exclusive and how GST slabs apply with qualified finance/legal review before launch. Show the breakdown before payment. (moved from 12-business-rules)
- **Cross-cutting rules:** Stay dates, minor units and separate state machines are defined in [../PRODUCT.md#12-business-rules](../PRODUCT.md#12-business-rules).
