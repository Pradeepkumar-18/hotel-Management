# Initial Task Board

Status values: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`. No tasks are marked done until verified in the implementation.

## Sprint 0 — Decisions and foundations

- [x] Confirm launch market, currency, time-zone model, tax rules and payment provider defaults (`.env.example`, `configuration.ts`).
- [x] Choose API/database/ORM and hosting; record ADRs (ADR-001, ADR-002, ADR-011 established).
- [x] Scaffold apps, migrations, lint/build pipeline, config and health checks (NestJS API, `@staywise/contracts`, `/api/v1/health` verified, and MongoDB replica-set transactions verified).
- [x] Publish API contract and define audit/logging conventions (Swagger OpenAPI at `/api/docs`, `AuditLog` schema, and `AuditService` with metadata redaction).

## Sprint 1 — Hotel catalog and inventory

- [ ] Staff session login, permission loading, and initial super-admin bootstrap (in progress; MFA, invitations, recovery, and broader session management remain).
- [ ] Hotel and room-type data model and admin CRUD (in progress: versioned, audited APIs and the first admin property/room workflows; media and remaining catalog actions remain).
- [ ] Inventory by room type and local stay date; blocks and total-room changes (in progress: bounded initialization, scoped calendar, audited blocks, guarded room-count updates; replica-set integration checks cover initialization and block safeguards).
- [ ] Base rate setup and hotel publication workflow (API and admin screens implemented; integration acceptance still needed).
- [ ] Admin property setup UI (first slice implemented: hotels, room types, policy, rates, inventory, and publish; responsive production review remains).
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
