# Documentation Reading and Execution Order

Use this guide to find the right existing documents as the project moves from planning to implementation. The documents are references and plans; task status is complete only when implementation and acceptance evidence exist.

## 1. Read before starting a work session

1. [`../AGENT.md`](../AGENT.md) — engineering rules and document authority.
2. [`../context.md`](../context.md) — product context, architecture, dependency gates, and implementation order.
3. [`03-mvp-scope.md`](03-mvp-scope.md) — what belongs in the first release.
4. [`12-business-rules.md`](12-business-rules.md) — invariants that implementation must preserve.
5. [`20-decision-log.md`](20-decision-log.md) — approved decisions and unresolved product choices.
6. [`19-task-board.md`](19-task-board.md) — current status and the next incomplete work.

If a needed decision is still open, keep production behavior dependent on it disabled and record the question; do not invent a product rule.

## 2. Prepare each implementation item

For the next incomplete task on the task board, follow this order:

1. Find its domain in [`modules/README.md`](modules/README.md), then read that module specification.
2. Check the matching section in [`22-module-wise-line-items-checklist.md`](22-module-wise-line-items-checklist.md) to see the implementation details and acceptance expectations.
3. Read the relevant system contract before changing it: [`04-architecture.md`](04-architecture.md), [`07-database-design.md`](07-database-design.md), [`08-api-specification.md`](08-api-specification.md), and the relevant frontend, backend, security, or UI guidelines (`09`, `10`, `13`, `14`).
4. Implement one cohesive item, including necessary API, schema/index, authorization, audit, and failure handling.
5. Verify its acceptance criteria using [`15-testing-strategy.md`](15-testing-strategy.md) and the module specification. Update the task board, checklist, and affected contracts with evidence; only then mark work complete.

## 3. Follow the dependency order

The current planned order is:

1. **Foundation and decisions:** [`18-development-phases.md`](18-development-phases.md), [`16-devops.md`](16-devops.md), and open items in [`20-decision-log.md`](20-decision-log.md).
2. **Identity and access:** `modules/authentication.md`, `modules/rbac-permissions.md`, `modules/staff-user-management.md`, and `modules/audit-logging.md`.
3. **Hotel catalog:** `modules/hotel-management.md`, `modules/room-type-management.md`, and `modules/media-management.md` as needed.
4. **Inventory and rates:** `modules/availability-booking.md`, `modules/pricing-tax.md`, and [`12-business-rules.md`](12-business-rules.md).
5. **Search and booking:** `modules/guest-search.md`, `modules/booking-lifecycle.md`, and `modules/cancellation-policies.md` as relevant.
6. **Payments and guest operations:** `modules/payments-refunds.md`, `modules/guest-accounts.md`, and `modules/notifications.md`.
7. **Later operations and growth:** reviews, reports, deployment, and other modules after their dependencies and MVP scope allow.

The API and data contracts come before client features. Admin hotel setup UI can begin once hotel and room APIs are ready. Guest search UI follows the search API and usable catalog, inventory, and pricing. Use [`23-ui-generation-brief.md`](23-ui-generation-brief.md), [`09-frontend-guidelines.md`](09-frontend-guidelines.md), [`13-ui-ux-guidelines.md`](13-ui-ux-guidelines.md), and `modules/admin-ui-kit.md` when starting the relevant UI work.

## 4. Current next step

The catalog, nightly inventory, base-rate, and publication APIs are implemented. The first admin setup screens now use those contracts. Replica-set tests cover inventory initialization, exclusive end dates, block/unblock safeguards, room-count changes, rate versioning/audit, and hotel publication gates; the API and admin production builds pass. Remaining Sprint 1 admin work is the responsive production review, completing any missing catalog actions against `modules/hotel-management.md` and `modules/room-type-management.md`, and recording acceptance evidence for staff sign-in/bootstrap. Do not mark those broader items complete from the current integration suite alone.

The next domain implementation after the admin setup slice is guest search and quote APIs. Read `modules/guest-search.md`, `modules/pricing-tax.md`, `modules/cancellation-policies.md`, and `20-decision-log.md` first. ADR-007 tax treatment and ADR-009 cancellation defaults remain unresolved, so do not enable guest totals or checkout until approved server-side rules exist. Build guest search UI only after those APIs provide authoritative availability, price breakdown, and policy data.

For local commands, see [`QUICKSTART.md`](QUICKSTART.md); it notes that some setup steps are illustrative and must match actual scripts. For UI requirements, use [`23-ui-generation-brief.md`](23-ui-generation-brief.md), [`09-frontend-guidelines.md`](09-frontend-guidelines.md), [`13-ui-ux-guidelines.md`](13-ui-ux-guidelines.md), and [`modules/admin-ui-kit.md`](modules/admin-ui-kit.md).
