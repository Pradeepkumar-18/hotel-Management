# Development Phases

## Phase 0 — Decisions and skeleton

Confirm product name, launch geography/currency, GST treatment, payment provider, policy ownership, guest account needs and hosting. Set up repository, migrations, CI, environment config, health checks and OpenAPI.

## Phase 1 — Hotel setup and booking without online payment

Build identity for staff, hotel/room setup, inventory calendar, base rates, public hotel detail/search, date-based capacity engine, transactional holds, booking record and admin booking views. Demonstrate concurrent last-room behavior.

## Phase 2 — Payment and cancellations

Add payment adapter/test gateway, webhook signature verification/idempotency, confirmation workflow, cancellation policy snapshots, refund state machine, guest booking access and email notification. Reconcile provider events.

## Phase 3 — Operational polish

Add coupons, date-specific pricing, guest account and verified reviews, hotel manager scope, reports and notification templates. Validate usability with guests and staff.

## Phase 4 — Expansion

Add exports, multiple locales/currencies, channel managers and analytics only after requirements, partner contracts and operational support are established.

Each phase ends with acceptance evidence, documentation updates, security review of changed surfaces and operational handoff.
