# Feature Roadmap

## Phase 0 — Product and technical foundation

Confirm launch market, tax/payment provider, cancellation defaults, room inventory semantics, policies, and operational owner. Scaffold the application, environments, database, logs, API docs and health check.

## Phase 1 — Inventory and booking core

Hotel and room-type setup; base pricing; date-range search; per-night availability; atomic temporary holds; guest details; booking without online payment; admin booking list and lifecycle. This phase must prove no overbooking under concurrent requests.

## Phase 2 — Money and stay operations

Payment gateway in test mode, signed webhooks, idempotency, cancellation policy, refunds, invoice/receipt, confirmation email, check-in/out and reconciliation view.

## Phase 3 — Guest retention and property operations

Guest accounts, booking retrieval, verified reviews, coupons, seasonal pricing, richer notifications, hotel manager role with property scoping, dashboard metrics.

## Phase 4 — Growth and scale

Exportable reports, localization/currency where required, channel-manager integrations, advanced analytics, caching/queues where measured traffic justifies them.

## Gate between phases

Advance only when the prior phase has working acceptance criteria, operational ownership, and known failure recovery. Do not schedule integrations or AI before the core booking and payment reconciliation are dependable.
