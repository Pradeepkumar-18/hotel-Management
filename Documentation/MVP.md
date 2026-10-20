# MVP — Scope, Phases and Gates

- **What this file holds**: the MVP boundaries and exit criteria (old `01-product/03-mvp-scope.md`), the delivery phases and their gates (old `04-planning-and-tracking/18-development-phases.md`), and the MVP-phase items of the feature roadmap (Phases 0–2 and the gate of old `01-product/02-feature-roadmap.md`).
- **Later roadmap**: Phases 3–4 of the feature roadmap and AI ideas are in [PRODUCT.md — Roadmap — not now](./PRODUCT.md#roadmap-not-now).
- **Phase-scheme caveat**: the feature roadmap and the development phases each use a 0–4 scheme, while `context.md` uses 0–7; `context.md` (0–7) is the one the agent follows (see [README.md#DOCUMENTATION-REPORT](./README.md#DOCUMENTATION-REPORT), §6 and §8 item 5 — "Pick one phase scheme (context.md 0–7) and align 02 and 18" is still open).
- **Task status**: live status of the work lives in [TASKS.md](./TASKS.md).

---

<a id="03-mvp-scope"></a>

## MVP Scope and Boundaries

### MVP objective

- **Objective**: a super admin can publish a hotel and room inventory; a guest can search a date range, select an available room type, place a booking with a safe inventory hold, and receive a booking reference; staff can find and manage that booking.
- **Hard constraint**: the system must not overbook under concurrent attempts.

### In MVP (Must have)

- **Market configuration**: single-country/currency configuration and explicit property time zone.
- **Admin setup**: super-admin login; hotel, room type, policies and base-rate management.
- **Search**: city/date/guest search; date-range availability and capacity checks.
- **Pricing**: server-side total calculation and clear price breakdown.
- **Holds and booking**: atomic room hold with expiry, booking creation, release and audit trail.
- **Admin booking management**: admin booking search/details and limited lifecycle actions.
- **Guest flow and platform basics**: basic responsive guest web flow; logging, backups, error handling and access controls.
- **Payment**: payment can be initially omitted or use a documented manual/COD flow; if online payment launches, Phase 2 payment controls are mandatory (see [Phase 2 — Money and stay operations](#roadmap-phase-2) and [Phase 2 — Payment and cancellations](#phases-phase-2)).

### Out of MVP

#### Defer (later releases)

- **Hotel manager accounts**: deferred.
- **Google/OTP login**: deferred.
- **Reviews**: deferred.
- **Coupons**: deferred.
- **Complex seasonal rules**: deferred.
- **Refunds automation**: deferred.
- **WhatsApp/SMS**: deferred.
- **Invoice PDF**: deferred.
- **Report exports**: deferred.
- **Multiple currencies/languages**: deferred.
- **Channel managers**: deferred.
- **Recommendation AI**: deferred.

#### Explicitly out of MVP

- **Microservices**: out of MVP.
- **Multi-property channel synchronization**: out of MVP.
- **Loyalty wallet**: out of MVP.
- **Dynamic yield pricing**: out of MVP.
- **Physical room assignment/housekeeping**: out of MVP.
- **Automated tax advice**: out of MVP.
- **AI in booking decisions**: out of MVP (see also [PRODUCT.md#17-ai-features](./PRODUCT.md#17-ai-features)).

### MVP exit criteria

- **Catalog publish**: admin can create and publish a hotel with a room type and inventory.
- **Search correctness**: search returns only room types available for every requested night and valid occupancy.
- **Last-room safety**: simultaneous requests for the final inventory cannot both obtain a hold.
- **Release once**: expired/cancelled holds release inventory exactly once.
- **Server totals**: booking totals are calculated by the server and persisted with a price breakdown snapshot.
- **Staff operations**: staff can inspect booking history and perform authorized lifecycle actions.
- **Launch verification**: critical paths, access controls, backup restore and deployment rollback are verified before public launch.

---

<a id="18-development-phases"></a>

## Development Phases

### Phase 0 — Decisions and skeleton

- **Decisions to confirm**: product name, launch geography/currency, GST treatment, payment provider, policy ownership, guest account needs and hosting.
- **Skeleton to set up**: repository, migrations, CI, environment config, health checks and OpenAPI.
- **Related roadmap phase**: [Roadmap Phase 0](#roadmap-phase-0).

<a id="phases-phase-1"></a>

### Phase 1 — Hotel setup and booking without online payment

- **Build**: identity for staff, hotel/room setup, inventory calendar, base rates, public hotel detail/search, date-based capacity engine, transactional holds, booking record and admin booking views.
- **Demonstrate**: concurrent last-room behavior.
- **Related roadmap phase**: [Roadmap Phase 1](#roadmap-phase-1).

<a id="phases-phase-2"></a>

### Phase 2 — Payment and cancellations

- **Add**: payment adapter/test gateway, webhook signature verification/idempotency, confirmation workflow, cancellation policy snapshots, refund state machine, guest booking access and email notification.
- **Reconcile**: reconcile provider events.
- **MVP status**: required in the MVP only if online payment launches (see [In MVP — Payment](#in-mvp-must-have)).
- **Related roadmap phase**: [Roadmap Phase 2](#roadmap-phase-2).

### Phase 3 — Operational polish

- **Add**: coupons, date-specific pricing, guest account and verified reviews, hotel manager scope, reports and notification templates.
- **Validate**: validate usability with guests and staff.
- **MVP status**: not in MVP (coupons, reviews, hotel manager accounts and complex seasonal rules are deferred — see [Out of MVP](#out-of-mvp)). The matching roadmap phase is in [PRODUCT.md#02-feature-roadmap](./PRODUCT.md#02-feature-roadmap).

### Phase 4 — Expansion

- **Add**: exports, multiple locales/currencies, channel managers and analytics only after requirements, partner contracts and operational support are established.
- **MVP status**: not in MVP. The matching roadmap phase is in [PRODUCT.md#02-feature-roadmap](./PRODUCT.md#02-feature-roadmap).

### Phase exit rule

- **Every phase ends with**: acceptance evidence, documentation updates, security review of changed surfaces and operational handoff.

---

<a id="02-feature-roadmap"></a>

## Feature Roadmap — MVP phases (0–2)

- **Split note**: this section holds Phases 0–2 and the gate between phases from the old feature roadmap. Phases 3–4 are in [PRODUCT.md#02-feature-roadmap](./PRODUCT.md#02-feature-roadmap).

<a id="roadmap-phase-0"></a>

### Phase 0 — Product and technical foundation

- **Confirm**: launch market, tax/payment provider, cancellation defaults, room inventory semantics, policies, and operational owner.
- **Scaffold**: the application, environments, database, logs, API docs and health check.
- (Largely also stated in 18-development-phases, Phase 0 — Decisions and skeleton, above.)

<a id="roadmap-phase-1"></a>

### Phase 1 — Inventory and booking core

- **Scope**: hotel and room-type setup; base pricing; date-range search; per-night availability; atomic temporary holds; guest details; booking without online payment; admin booking list and lifecycle.
- **Proof required**: this phase must prove no overbooking under concurrent requests (also stated in 18-development-phases, Phase 1: "Demonstrate concurrent last-room behavior").

<a id="roadmap-phase-2"></a>

### Phase 2 — Money and stay operations

- **Scope**: payment gateway in test mode, signed webhooks, idempotency, cancellation policy, refunds, invoice/receipt, confirmation email, check-in/out and reconciliation view.
- **MVP status**: mandatory controls if online payment launches in the MVP (see [In MVP — Payment](#in-mvp-must-have)).

### Gate between phases

- **Advance condition**: advance only when the prior phase has working acceptance criteria, operational ownership, and known failure recovery.
- **Sequencing guard**: do not schedule integrations or AI before the core booking and payment reconciliation are dependable.
- **Applies to all phases**: this gate also governs moving into the later Phases 3–4 in [PRODUCT.md#02-feature-roadmap](./PRODUCT.md#02-feature-roadmap).
