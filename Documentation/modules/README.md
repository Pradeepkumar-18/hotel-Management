# Module Specifications Index

These documents are the implementation-level specifications for the hotel platform. They complement the product-wide requirements and architecture docs. Each module document defines responsibilities, data ownership, rules, API expectations, authorization, failure behavior, and acceptance checks.

## Module map

| Module | Specification |
|---|---|
| Authentication | [authentication.md](./authentication.md) |
| RBAC and permissions | [rbac-permissions.md](./rbac-permissions.md) |
| Staff lifecycle | [staff-user-management.md](./staff-user-management.md) |
| Guest identity and profile | [guest-accounts.md](./guest-accounts.md) |
| Hotel operations | [hotel-management.md](./hotel-management.md) |
| Room types | [room-type-management.md](./room-type-management.md) |
| Inventory and availability | [availability-booking.md](./availability-booking.md) |
| Pricing and tax | [pricing-tax.md](./pricing-tax.md) |
| Guest search and details | [guest-search.md](./guest-search.md) |
| Booking lifecycle | [booking-lifecycle.md](./booking-lifecycle.md) |
| Payments and refunds | [payments-refunds.md](./payments-refunds.md) |
| Cancellation policies | [cancellation-policies.md](./cancellation-policies.md) |
| Reviews | [reviews-ratings.md](./reviews-ratings.md) |
| Notifications | [notifications.md](./notifications.md) |
| Media | [media-management.md](./media-management.md) |
| Reports | [admin-dashboard-reports.md](./admin-dashboard-reports.md) |
| Audit | [audit-logging.md](./audit-logging.md) |
| Deployment operations | [deployment-operations.md](./deployment-operations.md) |
| Admin UI components | [admin-ui-kit.md](./admin-ui-kit.md) |

## System-wide contracts

- API: NestJS, TypeScript, REST under `/api/v1`; DTO validation at the boundary; OpenAPI contract maintained with implementation.
- Persistence: MongoDB with Mongoose. Multi-document booking transactions require replica-set deployment. Unique indexes and conditional updates enforce concurrency invariants.
- Web clients: React, TypeScript, Tailwind CSS. Client validation improves usability; backend validation is authoritative.
- Dates: stay dates are date-only values interpreted in the hotel's IANA time zone; event timestamps are UTC.
- Money: integer minor units plus ISO currency; price, tax, discounts, and refunds are calculated on the server.
- Inventory: pooled by room type and stay night; check-in included and checkout excluded.
- Authorization: every API operation authenticates and authorizes on the server, including resource ownership and hotel scope.
- Status: booking, payment, refund, hold, and hotel publication states are separate state machines.
- Change control: update impacted module docs, API docs, schema/index plan, tests, and task board together.

## Dependency order

Identity and RBAC → hotel and room catalog → inventory and rates → search and quotes → holds and booking → payment/refund → notifications, reports, reviews. Audit is cross-cutting and should be present from the first admin mutation.

## Definition of a module specification

Before a module is implementation-ready, identify its owner, non-goals, persistent records, invariants, API actions, role permissions, validation rules, state transitions, failure/retry behavior, audit requirements, tests, and operational metrics. Open market-specific decisions such as GST treatment must be resolved before production behavior is enabled.
