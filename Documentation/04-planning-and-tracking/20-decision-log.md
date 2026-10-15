# Decision Log

Record: ID, date, status, context, decision, alternatives, consequences, owner. Items not explicitly selected by the product owner remain proposals or open decisions.

| ID | Topic | Proposed default | Status / validation |
|---|---|---|---|
| ADR-001 | Architecture | Modular monolith with REST API | Proposed; validate team/hosting |
| ADR-002 | Persistence | MongoDB with Mongoose; transactions on a replica set | **DECIDED**; configure unique indexes and transactional inventory updates |
| ADR-003 | Inventory | Pooled inventory by room type and local stay night | Proposed; confirm hotel operations |
| ADR-004 | Hold duration | 10 minutes, server-expiring | Proposed; validate gateway checkout timing |
| ADR-005 | Booking access | Allow guest checkout; secure retrieval link/session | Proposed; security review |
| ADR-006 | Launch region | One country/currency/time-zone policy initially | Proposed; owner decision required |
| ADR-007 | Tax | Configure server-side; validate GST slabs and inclusive/exclusive treatment | Open; finance/legal review required |
| ADR-008 | Payment provider | Select Razorpay or Stripe based on merchant eligibility and geography | Open; business decision required |
| ADR-009 | Cancellation | Snapshot property policy on booking; refund asynchronous | Proposed; define default policy |
| ADR-010 | Staff tenancy | Super admin first; hotel manager later with explicit property scope | Proposed |
| ADR-011 | Browser authentication | Opaque server-managed sessions in secure HttpOnly cookies; separate guest/staff audiences; CSRF protection | **STANDARD**; defaults and lifecycle defined in `modules/authentication.md` |
| ADR-012 | Standalone MongoDB in local development | Permit non-transactional writes only when `NODE_ENV=development`; production and other environments continue to require a replica set | **DECIDED** for local development; standalone mode does not provide atomic inventory guarantees |
| ADR-013 | Frontend Architecture & Theme System | Modular feature-driven structure (1 component = 1 file) with Tailwind CSS v4 and Staywise brand theme palette tokens | **DECIDED**; migrated `apps/admin-web` to modular architecture with Tailwind v4 styling and `Button` primitive |

Update related requirements, schema, API and business rules when a decision is approved.
