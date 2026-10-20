# Documentation Reading and Execution Order

Use this guide to find the right existing documents as the project moves from planning to implementation. The documents are references and plans; task status is complete only when implementation and acceptance evidence exist.

## 1. Read before starting a work session

1. [`../AGENT.md`](../AGENT.md) — engineering rules and document authority.
2. [`../context.md`](../context.md) — product context, architecture, dependency gates, and implementation order.
3. [`03-mvp-scope.md`](./01-product/03-mvp-scope.md) — what belongs in the first release.
4. [`12-business-rules.md`](./01-product/12-business-rules.md) — invariants that implementation must preserve.
5. [`20-decision-log.md`](./04-planning-and-tracking/20-decision-log.md) — approved decisions and unresolved product choices.
6. [`19-task-board.md`](./04-planning-and-tracking/19-task-board.md) — current status and the next incomplete work.

If a needed decision is still open, keep production behavior dependent on it disabled and record the question; do not invent a product rule.

## 2. Prepare each implementation item

For the next incomplete task on the task board, follow this order:

1. Find its domain in [`modules/README.md`](modules/README.md), then read that module specification.
2. Check the matching section in [`22-module-wise-line-items-checklist.md`](./04-planning-and-tracking/22-module-wise-line-items-checklist.md) to see the implementation details and acceptance expectations.
3. Read the relevant system contract before changing it: [`04-architecture.md`](./02-architecture/04-architecture.md), [`07-database-design.md`](./02-architecture/07-database-design.md), [`08-api-specification.md`](./02-architecture/08-api-specification.md), and the relevant frontend, backend, security, or UI guidelines (`09`, `10`, `13`, `14`).
4. Implement one cohesive item, including necessary API, schema/index, authorization, audit, and failure handling.
5. Verify its acceptance criteria using [`15-testing-strategy.md`](./03-guidelines/15-testing-strategy.md) and the module specification. Update the task board, checklist, and affected contracts with evidence; only then mark work complete.

## 3. Follow the dependency order

The current planned order is:

1. **Foundation and decisions:** [`18-development-phases.md`](./04-planning-and-tracking/18-development-phases.md), [`16-devops.md`](./03-guidelines/16-devops.md), and open items in [`20-decision-log.md`](./04-planning-and-tracking/20-decision-log.md).
2. **Identity and access:** `modules/authentication.md`, `modules/rbac-permissions.md`, `modules/staff-user-management.md`, and `modules/audit-logging.md`.
3. **Hotel catalog:** `modules/hotel-management.md`, `modules/room-type-management.md`, and `modules/media-management.md` as needed.
4. **Inventory and rates:** `modules/availability-booking.md`, `modules/pricing-tax.md`, and [`12-business-rules.md`](./01-product/12-business-rules.md).
5. **Search and booking:** `modules/guest-search.md`, `modules/booking-lifecycle.md`, and `modules/cancellation-policies.md` as relevant.
6. **Payments and guest operations:** `modules/payments-refunds.md`, `modules/guest-accounts.md`, and `modules/notifications.md`.
7. **Later operations and growth:** reviews, reports, deployment, and other modules after their dependencies and MVP scope allow.

The API and data contracts come before client features. Admin hotel setup UI can begin once hotel and room APIs are ready. Guest search UI follows the search API and usable catalog, inventory, and pricing. Use [`23-ui-generation-brief.md`](./03-guidelines/23-ui-generation-brief.md), [`09-frontend-guidelines.md`](./03-guidelines/09-frontend-guidelines.md), [`13-ui-ux-guidelines.md`](./03-guidelines/13-ui-ux-guidelines.md), and `modules/admin-ui-kit.md` when starting the relevant UI work.

## 4. Current next step (updated 2026-10-15)

**Built so far (Sprint 1 + hardening):** staff login with sessions and CSRF; hotel CRUD with lifecycle, publish gates and media URLs; room types; one base rate per room type; nightly inventory with initialize and block/unblock; audit logging. The admin web covers these screens. Fixes from [`05-sprints-and-progress/26-fullstack-fix-plan-progress.md`](./05-sprints-and-progress/26-fullstack-fix-plan-progress.md) and [`25-admin-production-hardening-progress.md`](./05-sprints-and-progress/25-admin-production-hardening-progress.md) are applied. The only open item is B7 (end-to-end tests), which is deferred. For the actual screens and flows, see [`07-guides/27-admin-web-end-to-end-navigation-guide.md`](./07-guides/27-admin-web-end-to-end-navigation-guide.md).

**Not built:** guest auth, search/quote, holds, bookings, payments, refunds, staff management, reports.

**Next domain work:**
1. Close the catalog gaps that [`06-analysis/`](./06-analysis/) found: room-type edit/disable UI, editing hotel basics, and the inventory DTO `reason` validator bug.
2. Then do either guest search and quote (`modules/guest-search.md`, `modules/pricing-tax.md`), or Sprint 2 holds and booking ([`05-sprints-and-progress/24-sprint-2-availability-and-booking-plan.md`](./05-sprints-and-progress/24-sprint-2-availability-and-booking-plan.md)).

Before starting Sprint 2, reconcile plan 24 with ADR-005 and ADR-007 in [`20-decision-log.md`](./04-planning-and-tracking/20-decision-log.md). Do not enable guest totals or checkout until approved server-side tax and cancellation rules exist.

**Keep tracking in one place:** record new work in [`19-task-board.md`](./04-planning-and-tracking/19-task-board.md) and [`22-module-wise-line-items-checklist.md`](./04-planning-and-tracking/22-module-wise-line-items-checklist.md), not only in new standalone progress files. Record new decisions in `20-decision-log.md`.

For local commands, see [`07-guides/QUICKSTART.md`](./07-guides/QUICKSTART.md). For UI work, see [`03-guidelines/09-frontend-guidelines.md`](./03-guidelines/09-frontend-guidelines.md), [`modules/admin-ui-kit.md`](./modules/admin-ui-kit.md), and the ui-architect project memory in `apps/admin-web/docs/`.
