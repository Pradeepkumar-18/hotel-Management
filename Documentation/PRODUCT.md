# Product — Requirements, Cross-Cutting Rules and Later Roadmap

- **What this file holds**: the product requirements (old `01-product/01-product-requirements.md`), the cross-cutting part of the business rules (old `01-product/12-business-rules.md`), and the "Roadmap — not now" items — Phases 3–4 of the feature roadmap (old `01-product/02-feature-roadmap.md`) and the AI ideas (old `01-product/17-ai-features.md`).
- **Related files**: project context, users and operating principles are in [README.md#00-project-context](./README.md#00-project-context); MVP boundaries, phases and Phases 0–2 of the roadmap are in [MVP.md](./MVP.md); module behaviour is in [modules/index.md](./modules/index.md).

---

<a id="01-product-requirements"></a>

## Product Requirements

### Goal

- **Goal**: enable guests to discover and book available hotel rooms and enable platform staff to operate hotel inventory and stays.

### Guest requirements

#### Search and discovery

- **Search inputs**: search by destination, check-in, checkout, adults, children and room count.
- **Input validation**: require checkout after check-in and valid positive guest/room counts.
- **Result eligibility**: list only hotels with a room type meeting capacity and inventory for every night.
- **Filtering and price display**: filter/sort by price, rating, amenities and room type; show date-specific total or clearly labeled nightly rate, fees, taxes and availability timestamp.
- **Hotel detail**: includes description, location, photos, amenities, room types, capacity, policies, check-in/out times and verified reviews.

#### Booking

- **Booking steps**: select room type and quantity, enter guest/contact details, review itemized total, accept policy and create a time-limited hold.
- **Hold and payment feedback**: show hold expiry and payment result; prevent duplicate submission.
- **Confirmation**: includes a unique reference, stay summary, payment state and invoice/receipt access.
- **After booking**: guest can retrieve booking securely, view history, and cancel within policy.
  - **Modification**: can be deferred until a safe repricing workflow exists.

#### Reviews

- **Eligibility**: only a guest associated with a completed stay can submit one review per eligible booking/room experience.
- **Moderation**: reviews are moderated before public display in the initial release.

### Admin requirements

- **Hotel lifecycle**: authenticated staff can create, edit, publish, disable and archive hotels.
- **Catalog**: manage room types, capacities, total room counts, base rates and policies.
- **Inventory and prices**: view date-range inventory; block/unblock rooms for maintenance and set date-specific prices.
- **Booking search**: search bookings by reference, property, guest, date and status; view booking/payment timeline.
- **Lifecycle actions**: manage lifecycle actions with permission checks and audit records.
- **Platform administration**: super admin can manage staff and view platform-wide reports.
  - **Manager access**: property-scoped manager access is a later phase.

### Shared services

- **Service list**: availability and reservation service; pricing and coupon service; booking lifecycle; payment gateway adapter and verified webhook; refund workflow; notification delivery; media storage; audit trail.
- **Reports**: revenue, occupancy and cancellation reports use documented definitions and date basis (definitions in [modules/reports.md](./modules/reports.md)).

### Non-functional requirements

- **Correctness**: concurrency-safe room inventory and idempotent payment events.
- **Security**: validated input, secure sessions, least-privilege authorization, encrypted transport, secrets management and auditability.
- **Performance**: establish baselines; target search P95 under 500 ms at expected MVP load, excluding external services.
- **Accessibility**: keyboard operation, labels, visible focus, sufficient contrast and meaningful errors.
- **Reliability**: backups with tested restore procedure, monitoring and payment reconciliation.
- **Privacy**: collect only needed guest data; define retention and deletion rules for launch jurisdictions.

---

<a id="12-business-rules"></a>

## Business Rules

- **Split note**: this section keeps the stay-date and occupancy rules in full and the cross-cutting rules. The module-specific rules from the old file moved to the module specs (see [Where the module-specific rules live](#where-the-module-specific-rules-live)).
- **Authority**: business rules rank third in the document authority order, after the latest product-owner instruction / approved ADR and AGENT.md + context.md (see [README.md#source-of-truth](./README.md#source-of-truth)).

### Stay dates and occupancy

- **Night range**: check-in date is occupied; checkout date is not. Nights are `[checkIn, checkOut)` in the hotel's local calendar (also stated in 00-project-context, "Initial assumptions").
- **Stay length**: checkout must be later than check-in; define maximum stay and booking horizon.
- **Room allocation**: required room count must satisfy requested guest allocation and room type capacity.
  - **No implicit distribution**: do not assume guests can be distributed across rooms without explicit allocation rules.

### Cross-cutting rules

- **Money in minor units**: use minor currency units and deterministic rounding (full pricing rule in [modules/pricing.md](./modules/pricing.md)).
- **Separate state machines**: booking, payment and refund statuses are separate state machines.
  - **Cancellation vs refund**: cancellation status and refund status are distinct; a refund is an asynchronous financial workflow (see [modules/cancellation-policies.md](./modules/cancellation-policies.md)).
  - **Payment states**: kept separate from booking states (see [modules/payments.md](./modules/payments.md)); booking states and transitions are in [modules/bookings.md](./modules/bookings.md).
- **Snapshots saved with bookings**: save guest, policy, nightly price, tax and fee snapshots with the booking; the cancellation policy is snapshotted on booking (see [modules/bookings.md](./modules/bookings.md) and [modules/cancellation-policies.md](./modules/cancellation-policies.md)).
- **Property-local calendar and time**: stay nights use the hotel's local calendar; cancellation cutoffs are property-local; occupancy reporting uses selected local dates (see [modules/cancellation-policies.md](./modules/cancellation-policies.md) and [modules/reports.md](./modules/reports.md)).

### Where the module-specific rules live

- **Availability**: sellable quantity, every-night check, atomic range operations, stale search vs authoritative hold → [modules/bookings.md](./modules/bookings.md).
- **Holds and booking**: 10-minute hold, idempotency keys, expiry release, late payment reconciliation, booking snapshots → [modules/bookings.md](./modules/bookings.md).
- **Booking states**: suggested booking states and audited explicit transitions → [modules/bookings.md](./modules/bookings.md).
- **Pricing and tax**: total formula, minor units and rounding, inclusive/exclusive tax and GST slabs pending review, breakdown before payment → [modules/pricing.md](./modules/pricing.md).
- **Cancellation and lifecycle**: policy snapshot, fee/refund basis, release inventory exactly once → [modules/cancellation-policies.md](./modules/cancellation-policies.md).
- **Payment states**: the separate payment state list → [modules/payments.md](./modules/payments.md).
- **Reporting definitions**: revenue basis, occupancy formula, cancellation denominator → [modules/reports.md](./modules/reports.md).

---

<a id="roadmap-not-now"></a>

## Roadmap — not now

- **Meaning**: items below are outside the MVP (see [MVP.md#out-of-mvp](./MVP.md#out-of-mvp)). They follow the [gate between phases](./MVP.md#gate-between-phases): advance only when the prior phase has working acceptance criteria, operational ownership, and known failure recovery; do not schedule integrations or AI before the core booking and payment reconciliation are dependable.

<a id="02-feature-roadmap"></a>

### Feature Roadmap — later phases (3–4)

- **Split note**: Phases 0–2 and the gate between phases are in [MVP.md#02-feature-roadmap](./MVP.md#02-feature-roadmap). The matching development phases (Phase 3 — Operational polish, Phase 4 — Expansion) are in [MVP.md#18-development-phases](./MVP.md#18-development-phases).

#### Phase 3 — Guest retention and property operations

- **Scope**: guest accounts, booking retrieval, verified reviews, coupons, seasonal pricing, richer notifications, hotel manager role with property scoping, dashboard metrics.

#### Phase 4 — Growth and scale

- **Scope**: exportable reports, localization/currency where required, channel-manager integrations, advanced analytics, caching/queues where measured traffic justifies them.

<a id="17-ai-features"></a>

### AI Features — Later Considerations

- **Not in MVP**: AI is not part of the booking MVP.
- **Deterministic core**: availability, quoted price, payment, cancellation eligibility and refunds must remain deterministic domain logic.
- **Possible later assistive features**:
  - **Search help**: search query suggestions and multilingual query understanding.
  - **Hotel descriptions**: draft hotel descriptions from operator-provided facts, with human review.
  - **Review summaries**: review theme summaries that link back to original reviews and avoid unsupported claims.
  - **Support drafting**: support-agent answer drafting from approved policy documents.
- **Before use**: define consent, data handling, evaluation, error reporting and human override.
- **Privacy guard**: do not send sensitive guest details to a model without an approved privacy and security review.
- **No direct effects**: AI output must never directly change inventory or execute a refund.
