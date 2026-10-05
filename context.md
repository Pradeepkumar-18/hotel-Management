# Hotel Platform — Agent Context

## 1. What we are building

The project is a hotel booking and hotel operations platform with a guest-facing responsive site and an admin console. Guests search hotels by destination and stay dates, compare room types and total prices, place a booking, pay where enabled, and manage eligible bookings. Super admins operate the platform. Hotel managers may be introduced later with strict property-level access.

The defining system challenge is correct room-type availability across a date range under concurrent bookings. A successful booking must have inventory for every occupied night. The checkout date is not an occupied night.

## 2. Product roles

- **Guest:** public search; own profile and bookings; cancellation/review only under the applicable rules.
- **Super admin:** platform-wide hotel, staff, booking, audit, and report permissions.
- **Hotel manager (later release):** only assigned property resources and granted operations.
- **System worker/provider:** narrowly scoped service identity for expiry, payment callbacks, and notifications; never silently impersonates staff.

## 3. Technology and architecture

- NestJS + TypeScript REST API.
- MongoDB + Mongoose, using replica-set topology for multi-document transactions.
- React + TypeScript + Tailwind CSS for guest and admin web clients.
- Modular monolith; domains own their service logic and persistence boundaries.
- Opaque server-managed browser sessions in secure HttpOnly cookies; separate guest/staff session audiences and CSRF defenses.
- MongoDB nightly inventory documents, conditional atomic updates, unique indexes, transaction retries, and reconciliation.
- Payment gateway adapter, cryptographically verified idempotent webhooks, and asynchronous refund state.

## 4. Core business invariants

1. Each stay covers `[checkIn, checkOut)` in the property's local timezone.
2. A room type is available only if requested quantity is available for every stay night and guest capacity is satisfied.
3. For each room type/night: `held + confirmed + blocked <= total`.
4. Hold acquisition is all-or-nothing across the stay range, with a 10-minute default expiry.
5. Search is indicative; hold creation revalidates inventory and quote.
6. Price/tax/fees/discount/refund are calculated server-side in integer minor units and explicit currency.
7. Confirmed booking snapshots preserve rate, tax, guest contact, and policy as booked.
8. Payment callback does not by itself confirm a booking; inventory and booking state are checked transactionally.
9. Booking, hold, payment, and refund each have separate states and retry/idempotency handling.
10. Every admin request checks identity, permission, and hotel/resource scope on the server.

## 5. Documentation guide

Read [`AGENT.md`](./AGENT.md) for mandatory engineering rules and [`README.md`](./README.md) for the top-level product document map.

### Product and delivery documents

- `00-project-context.md`: mission, personas, assumptions, and success measures.
- `01-product-requirements.md`: guest/admin requirements and quality needs.
- `02-feature-roadmap.md`: long-range capability phases.
- `03-mvp-scope.md`: what is included, deferred, excluded, and MVP exit criteria.
- `18-development-phases.md`: proposed sequence of delivery phases.
- `19-task-board.md`: current task tracking; statuses require evidence.
- `20-decision-log.md`: approved, proposed, and open decisions.
- `22-module-wise-line-items-checklist.md`: one-line module implementation tracker; unchecked is the default.

### Technical contracts

- `04-architecture.md`: module boundaries and core booking architecture.
- `05-tech-stack.md`: selected stack and supporting libraries.
- `06-project-structure.md`: code organization proposal.
- `07-database-design.md`: core collections, indexes, and inventory representation.
- `08-api-specification.md`: versioned endpoint conventions and initial contract.
- `09-frontend-guidelines.md`, `10-backend-guidelines.md`, `13-ui-ux-guidelines.md`: implementation and interaction conventions.
- `11-auth-rbac.md`, `14-security-guidelines.md`: project-wide security overview.
- `12-business-rules.md`: business invariants and state rules.
- `15-testing-strategy.md`, `16-devops.md`: verification and operations overview.

### Detailed module specs

Start at [`modules/README.md`](./modules/README.md). It indexes the dedicated specs for authentication, RBAC, staff lifecycle, guest accounts, hotels, room types, inventory/availability, pricing/tax, search, booking lifecycle, payments/refunds, cancellation policies, reviews, notifications, media, reporting, audit, deployment, and the admin UI kit.

## 6. Recommended implementation order and gates

This is the dependency order. Do not skip a gate because a later UI screen exists.

### Phase 0 — Decisions and foundations

Resolve launch market/currency/timezone, tax approval, payment provider, cancellation defaults, retention policy, and hosting. Establish NestJS/React applications, MongoDB replica-set development setup, Mongoose schema/index conventions, OpenAPI, config/secrets, logging, health checks, and CI.

**Gate:** replica-set transactions work in development; environments and API contracts are documented; open production-only rules remain disabled.

### Phase 1 — Identity and access control

Implement authentication sessions, CSRF, password recovery, MFA policy for staff, role/permission catalog, super-admin bootstrap, staff invitations, audit foundation, and authorization test matrix. Guest self-service can be limited initially.

**Gate:** unauthenticated, guest, staff, suspended, and out-of-scope users are reliably distinguished; manager cross-hotel access is denied before manager role ships.

### Phase 2 — Hotel and room catalog

Implement hotel lifecycle/media/policies, room types/capacity, base rates, and admin setup screens. Seed development fixtures only.

**Gate:** only complete, valid, published hotels and room types are eligible for search; changes are permissioned and audited.

### Phase 3 — Inventory and pricing

Implement nightly inventory, maintenance blocks, rate resolution, quote snapshots, atomic multi-night claims, holds, expiry, and reconciliation. This is the highest-risk engineering gate.

**Gate:** real MongoDB replica-set integration proves concurrent final-room requests cannot both succeed; failed multi-night claim leaves no partial hold; expiry/cancel releases once.

### Phase 4 — Search and booking lifecycle

Implement guest search/details, occupancy, quote display, booking creation against holds, guest access, admin booking operations, and allowed state transitions.

**Gate:** end-to-end booking flow succeeds with no payment and inventory/booking records reconcile.

### Phase 5 — Payments and cancellations

Implement selected gateway adapter, signed/idempotent webhooks, payment reconciliation, approved cancellation policy snapshots, refund workflow, receipts, and notifications.

**Gate:** sandbox tests cover success/failure/duplicate/late webhooks and refund retries; no unmatched capture is silently lost.

### Phase 6 — Operational features

Implement staff property scoping, guest accounts, reviews, coupons/date rates, reports, exports, and notification templates as approved by MVP scope.

**Gate:** report definitions and scopes are tested; operations has runbooks, backups, alerting, restore rehearsal, and support ownership.

### Phase 7 — Growth

Consider channel managers, localization/multiple currencies, analytics, caching/queues, and assistive AI only with recorded requirements, partner/legal review, and an approved decision.

## 7. How to choose the next task

1. Check `19-task-board.md` for the current status and dependencies.
2. Select the earliest incomplete phase with its gate still open.
3. Read the corresponding detailed module spec(s) and one-line checklist section.
4. Identify API/schema/index/security/audit impacts before editing.
5. Implement one cohesive item, verify its acceptance criteria, update documentation, then mark the checklist/task done with evidence.

## 8. Known decisions and boundaries

The selected core stack and session model are established. The launch country, exact GST/tax treatment, payment provider and merchant capability, cancellation default, data-retention legal basis, numeric production SLO/RPO/RTO, and whether guest login is required at launch still need explicit product/operations approval. Do not invent legal or financial behavior for these items.

The detailed specs are engineering plans, not evidence of implementation, security certification, legal compliance, gateway approval, or production readiness. Verify behavior in code and the target deployment topology.
