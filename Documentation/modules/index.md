# Module Specifications

<a id="README"></a>
## Module Specifications Index

- **What these documents are:** The implementation-level specifications for the hotel platform.
  - They complement the product-wide requirements ([../PRODUCT.md](../PRODUCT.md)) and architecture docs ([../ARCHITECTURE.md](../ARCHITECTURE.md)).
  - Each module document defines responsibilities, data ownership, rules, API expectations, authorization, failure behavior, and acceptance checks.
- **Boundary:** Module files say WHAT a module must do; coding rules live in the guidelines ([../guidelines/frontend-ui.md](../guidelines/frontend-ui.md), [../guidelines/backend.md](../guidelines/backend.md), [../guidelines/testing-devops.md](../guidelines/testing-devops.md)).

### Module map

- **Authentication** — [authentication.md](./authentication.md): staff and guest sign-in, sessions and tokens.
- **RBAC and permissions** — [rbac.md](./rbac.md): roles, permission names and hotel-scope authorization checks.
- **Staff lifecycle** — [staff-users.md](./staff-users.md): creating, inviting, updating and disabling staff users.
- **Guest identity and profile** — [guest-accounts.md](./guest-accounts.md): guest registration, profile and guest-owned data.
- **Hotel operations** — [hotels.md](./hotels.md): hotel aggregate, property content, timezone, policies and publication lifecycle (`DRAFT`, `PUBLISHED`, `SUSPENDED`, `ARCHIVED`).
- **Room types** — [room-types.md](./room-types.md): the sellable inventory unit, capacity and `totalRooms`.
- **Inventory and availability / Booking lifecycle** — [bookings.md](./bookings.md): nightly inventory, holds, booking creation, booking state machine and operations (merges the old availability-booking and booking-lifecycle specs).
- **Pricing and tax** — [pricing.md](./pricing.md): base rates, rate resolution, taxes, fees, discounts and immutable quotes in integer minor units.
- **Guest search and details** — [guest-search.md](./guest-search.md): public search query contract and hotel detail.
- **Payments and refunds** — [payments.md](./payments.md): gateway integration, payment and refund state machines, webhooks and reconciliation.
- **Cancellation policies** — [cancellation-policies.md](./cancellation-policies.md): versioned policies, booking snapshot and cancellation fee/refund calculation.
- **Reviews** — [reviews.md](./reviews.md): guest reviews and ratings.
- **Notifications** — [notifications.md](./notifications.md): guest and staff messages sent after durable state changes.
- **Media** — [media.md](./media.md): hotel/room-type (later review) image upload, storage, lifecycle and delivery.
- **Reports** — [reports.md](./reports.md): admin dashboard and reports.
- **Audit** — [audit-logging.md](./audit-logging.md): cross-cutting audit trail for admin mutations and state transitions.
- **Deployment operations** — [deployment-operations.md](./deployment-operations.md): environments, deployment and operational runbooks.
- **Admin UI components** — formerly `admin-ui-kit.md`; now lives in [../guidelines/frontend-ui.md](../guidelines/frontend-ui.md) (a guideline, not a module).

### Module dependencies

- **Dependency order:** Identity and RBAC → hotel and room catalog → inventory and rates → search and quotes → holds and booking → payment/refund → notifications, reports, reviews.
  - Audit is cross-cutting and should be present from the first admin mutation.
- **Per-module dependencies (derived from the dependency order and the module specs):**
  - **authentication** — foundation; no module prerequisites.
  - **rbac** — depends on authentication.
  - **staff-users** — depends on authentication and rbac.
  - **guest-accounts** — depends on authentication.
  - **hotels** — depends on rbac (hotel scope), audit-logging, media (photos) and cancellation-policies; publication is gated on room-types, pricing (base rates) and bookings inventory (future available inventory nights).
  - **room-types** — depends on hotels; inventory commitments in bookings constrain `totalRooms` changes.
  - **pricing** — depends on room-types (base rate per room type) and hotels (currency/tax configuration).
  - **cancellation-policies** — depends on hotels (property selects policy, property timezone) and is snapshotted into bookings; refund basis feeds payments.
  - **guest-search** — depends on hotels, room-types, bookings inventory (availability), pricing (quotes), cancellation-policies (summary) and reviews (rating summary).
  - **bookings** — depends on room-types, pricing, cancellation-policies and payments; uses guest-accounts for ownership and audit-logging for transitions.
  - **payments** — depends on bookings (booking state), pricing (amount from persisted quote snapshot) and cancellation-policies (refund basis).
  - **media** — depends on hotels and room-types (owner entities) and rbac (hotel scope); later reviews (review photos).
  - **notifications** — depends on bookings, payments and cancellation-policies events (sent after durable state change).
  - **reviews** — depends on bookings (stays) and guest-accounts.
  - **reports** — depends on bookings, payments and inventory data.
  - **audit-logging** — cross-cutting; used by every admin mutation.
  - **deployment-operations** — cross-cutting; MongoDB replica set required for booking transactions.

### System-wide contracts

- **API:** NestJS, TypeScript, REST under `/api/v1`; DTO validation at the boundary; OpenAPI contract maintained with implementation. See [../API.md](../API.md).
- **Persistence:** MongoDB with Mongoose.
  - Multi-document booking transactions require replica-set deployment.
  - Unique indexes and conditional updates enforce concurrency invariants. See [../DATA_MODEL.md](../DATA_MODEL.md).
- **Web clients:** React, TypeScript, Tailwind CSS. Client validation improves usability; backend validation is authoritative.
- **Dates:** Stay dates are date-only values interpreted in the hotel's IANA time zone; event timestamps are UTC.
- **Money:** Integer minor units plus ISO currency; price, tax, discounts, and refunds are calculated on the server.
- **Inventory:** Pooled by room type and stay night; check-in included and checkout excluded.
- **Authorization:** Every API operation authenticates and authorizes on the server, including resource ownership and hotel scope.
- **Status:** Booking, payment, refund, hold, and hotel publication states are separate state machines.
- **Change control:** Update impacted module docs, API docs, schema/index plan, tests, and task board ([../TASKS.md](../TASKS.md)) together.

### Definition of a module specification

- **Implementation-ready checklist:** Before a module is implementation-ready, identify its:
  - owner, non-goals, persistent records, invariants, API actions, role permissions, validation rules, state transitions, failure/retry behavior, audit requirements, tests, and operational metrics.
- **Open market decisions:** Open market-specific decisions such as GST treatment must be resolved before production behavior is enabled.
