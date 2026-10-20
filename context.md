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

Read [`AGENT.md`](./AGENT.md) for mandatory engineering rules and [`Documentation/README.md`](./Documentation/README.md) for the documentation map. All paths below are inside `Documentation/`.

### Product and delivery documents

- `MVP.md`: what is in and out of the MVP, MVP exit criteria, and the delivery phases (old 03, 18, roadmap phases 0–2). **Main document to follow.**
- `TASKS.md`: the module-wise checklist plus the task board (old 22, 19); statuses require evidence, unchecked is the default. **Main document to follow.**
- `PRODUCT.md`: guest/admin requirements, cross-cutting business rules and state rules, roadmap items that are "not now", AI ideas (old 01, 12, 02 phases 3–4, 17).
- `README.md`: project context (old 00), reading order (old EXECUTION-ORDER), how the docs drive the agent (old DOCUMENTATION-REPORT), contributor rules (old 21) and the old → new file map.

### Technical contracts

- `ARCHITECTURE.md`: module boundaries, stack, code organization and the decision log (old 04, 05, 06, 20).
- `DATA_MODEL.md`: core collections, indexes and inventory representation (old 07).
- `API.md`: versioned endpoint conventions and contract (old 08).
- `guidelines/frontend-ui.md`: frontend, UI/UX, UI generation brief and the admin UI kit (old 09, 13, 23, modules/admin-ui-kit).
- `guidelines/backend.md`: backend, auth/RBAC and security rules (old 10, 11, 14).
- `guidelines/testing-devops.md`: testing strategy and operations (old 15, 16).
- `modules/index.md` → `modules/<domain>.md`: one spec per module, including module-specific business rules.

### History, analyses and guides

- `HISTORY.md`: Sprint 2 plan (24, not yet built), hardening log (25), full-stack fix plan and its progress log (26).
- `ANALYSIS.md`: business analyses of the hotel, room-type and pricing modules, the form field-type analysis and the hotel module UX review.
- `GUIDES.md`: local setup (Quickstart), admin-web navigation guide (27) and platform configuration guide (28).

### Detailed module specs

Start at [`modules/index.md`](./Documentation/modules/index.md). It indexes the dedicated specs for authentication, RBAC, staff lifecycle, guest accounts, hotels, room types, inventory/availability, pricing/tax, search, booking lifecycle, payments/refunds, cancellation policies, reviews, notifications, media, reporting, audit, deployment, and the admin UI kit.

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

1. Check `TASKS.md#19-task-board` for the current status and dependencies.
2. Select the earliest incomplete phase with its gate still open.
3. Read the corresponding detailed module spec(s) and one-line checklist section.
4. Identify API/schema/index/security/audit impacts before editing.
5. Implement one cohesive item, verify its acceptance criteria, update documentation, then mark the checklist/task done with evidence.

## 8. Known decisions and boundaries

The selected core stack and session model are established. The launch country, exact GST/tax treatment, payment provider and merchant capability, cancellation default, data-retention legal basis, numeric production SLO/RPO/RTO, and whether guest login is required at launch still need explicit product/operations approval. Do not invent legal or financial behavior for these items.

The detailed specs are engineering plans, not evidence of implementation, security certification, legal compliance, gateway approval, or production readiness. Verify behavior in code and the target deployment topology.
