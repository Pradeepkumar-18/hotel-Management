# Initial Task Board

Status values: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`. No tasks are marked done until verified in the implementation.

## Sprint 0 — Decisions and foundations

- [x] Confirm launch market, currency, time-zone model, tax rules and payment provider defaults (`.env.example`, `configuration.ts`).
- [x] Choose API/database/ORM and hosting; record ADRs (ADR-001, ADR-002, ADR-011, ADR-013 established).
- [x] Scaffold apps, migrations, lint/build pipeline, config and health checks (NestJS API, `@staywise/contracts`, `/api/v1/health` verified, and MongoDB replica-set transactions verified).
- [x] Publish API contract and define audit/logging conventions (Swagger OpenAPI at `/api/docs`, `AuditLog` schema, and `AuditService` with metadata redaction).

## Sprint 1 — Hotel catalog and inventory

- [ ] Staff session login, permission loading, and initial super-admin bootstrap (in progress; MFA, invitations, recovery, and broader session management remain).
- [ ] Hotel and room-type data model and admin CRUD (in progress: versioned, audited APIs and the first admin property/room workflows; media and remaining catalog actions remain).
- [x] Inventory by room type and local stay date; blocks and total-room changes (bounded initialization, exclusive date ranges, scoped calendar, audited blocks, and guarded room-count updates; replica-set integration tests pass for initialization, blocks, and capacity safeguards).
- [x] Base rate setup and hotel publication workflow (API and admin screens implemented; replica-set integration tests pass for optimistic rate versioning, audit records, and publication gates for policy, rates, and future inventory).
- [x] Admin property setup UI & Modular Architecture (Refactored `apps/admin-web` to 1-component-per-file modular architecture with Tailwind CSS v4, Staywise brand forest green & lime green theme, standardized `Button` primitive, scaled typography & icons, and flexbox alignment fixes; production build verified).
- [ ] Planned Hotel Backend Extensions (Media upload API `POST /admin/hotels/:id/media`, Mongoose text search index, backend multi-filter queries, `PATCH /admin/hotels/bulk-status`, and `POST /admin/hotels/import` bulk CSV endpoints).
- [ ] Public hotel detail and search UI/API (detail endpoint exists; search, quote, tax decisions and guest UI remain).

## Sprint 2 — Availability and booking

- [ ] Atomic multi-night availability claim and hold expiry.
- [ ] Server-side quote and immutable booking price snapshot.
- [ ] Idempotent booking creation and guest booking retrieval.
- [ ] Admin booking list/details and audited lifecycle transitions.
- [ ] Integration test concurrent final-room claims and partial-range rollback.

## Sprint 3 — Payment and cancellation

- [ ] Provider adapter and test credentials.
- [ ] Signed, idempotent webhook processing and late-success reconciliation.
- [ ] Cancellation policy snapshot, refund workflow and status visibility.
- [ ] Confirmation/cancellation email and receipt.

## Sprint 4 — Release readiness

- [ ] Mobile/accessibility pass, security review and load baseline.
- [ ] Backup restore and deployment rollback rehearsal.
- [ ] Payment reconciliation and support runbooks.
- [ ] MVP exit criteria review and launch decision.
