# Tasks — Module-Wise Checklist and Task Board

- **What this file holds**: the single tracker for implementation work. It merges the module-wise line-items checklist (old `04-planning-and-tracking/22-module-wise-line-items-checklist.md`) with the sprint task board (old `04-planning-and-tracking/19-task-board.md`).
- **How the merge works**:
  - **Checklist lines**: every checklist line is kept verbatim with its `[x]`/`[ ]` state and evidence.
  - **Task-board items**: every task-board item is kept verbatim. Each has an ID such as `TB S1-6` (sprint 1, item 6). Where a task-board item clearly equals a checklist line, the line is marked "(task board: <id/title>)" and the task-board text is kept as a nested bullet. Otherwise the task-board item appears as its own line under the right module, marked "(task board: <id>)".
  - **Section numbering**: the checklist's sections 1–3 keep their numbers. Sections 0 and 4–10 are added for task-board items whose module had no checklist section (old checklist covered only auth, guest profile and hotel — see [README.md#DOCUMENTATION-REPORT](./README.md#DOCUMENTATION-REPORT) §6).
- **Keep tracking here**: record new work here, not in new standalone progress files (see [README.md#EXECUTION-ORDER](./README.md#EXECUTION-ORDER) §4). Module behaviour is specified in [modules/index.md](./modules/index.md); MVP boundaries in [MVP.md](./MVP.md).

---

<a id="19-task-board"></a>

## Initial Task Board

- **Status values**: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- **Done rule**: no tasks are marked done until verified in the implementation.
- **Title caveat**: the board was still titled "Initial" and had no entries for the 25/26 hardening and fix-plan work (see [HISTORY.md](./HISTORY.md) and [README.md#DOCUMENTATION-REPORT](./README.md#DOCUMENTATION-REPORT) §6).
- **Sprint index**: the full text of each item lives in the module section named after the arrow.

### Sprint 0 — Decisions and foundations

- [x] **TB S0-1**: Confirm launch market, currency, time-zone model, tax rules and payment provider defaults → [0. Foundations](#tasks-0-foundations).
- [x] **TB S0-2**: Choose API/database/ORM and hosting; record ADRs → [0. Foundations](#tasks-0-foundations).
- [x] **TB S0-3**: Scaffold apps, migrations, lint/build pipeline, config and health checks → [0. Foundations](#tasks-0-foundations).
- [x] **TB S0-4**: Publish API contract and define audit/logging conventions → [0. Foundations](#tasks-0-foundations).

### Sprint 1 — Hotel catalog and inventory

- [ ] **TB S1-1**: Staff session login, permission loading, and initial super-admin bootstrap → [1. Authentication & Authorization](#tasks-1-auth).
- [ ] **TB S1-2**: Hotel and room-type data model and admin CRUD → [3. Hotel Management](#tasks-3-hotel).
- [x] **TB S1-3**: Inventory by room type and local stay date; blocks and total-room changes → [4. Inventory & Availability](#tasks-4-inventory).
- [x] **TB S1-4**: Base rate setup and hotel publication workflow → [5. Pricing & Rates](#tasks-5-pricing).
- [x] **TB S1-5**: Admin property setup UI & Modular Architecture → [3. Hotel Management](#tasks-3-hotel).
- [x] **TB S1-6**: Creative Hotel Workspace Command Center → merged into a [3. Hotel Management](#tasks-3-hotel) checklist line.
- [x] **TB S1-7**: Planned Hotel Backend & UI Extensions → merged into [3. Hotel Management](#tasks-3-hotel) checklist lines (media upload, text index/multi-filters, bulk-status).
- [x] **TB S1-8**: Unified 4-Tab Hotel Workspace and Room Media Management → [3. Hotel Management](#tasks-3-hotel).
- [ ] **TB S1-9**: Public hotel detail and search UI/API → [6. Guest Search](#tasks-6-search).

### Sprint 2 — Availability and booking

- [ ] **TB S2-1**: Atomic multi-night availability claim and hold expiry → [4. Inventory & Availability](#tasks-4-inventory).
- [ ] **TB S2-2**: Server-side quote and immutable booking price snapshot → [5. Pricing & Rates](#tasks-5-pricing).
- [ ] **TB S2-3**: Idempotent booking creation and guest booking retrieval → [7. Bookings](#tasks-7-bookings).
- [ ] **TB S2-4**: Admin booking list/details and audited lifecycle transitions → [7. Bookings](#tasks-7-bookings).
- [ ] **TB S2-5**: Integration test concurrent final-room claims and partial-range rollback → [4. Inventory & Availability](#tasks-4-inventory).

### Sprint 3 — Payment and cancellation

- [ ] **TB S3-1**: Provider adapter and test credentials → [8. Payments, Refunds & Cancellation](#tasks-8-payments).
- [ ] **TB S3-2**: Signed, idempotent webhook processing and late-success reconciliation → [8. Payments, Refunds & Cancellation](#tasks-8-payments).
- [ ] **TB S3-3**: Cancellation policy snapshot, refund workflow and status visibility → [8. Payments, Refunds & Cancellation](#tasks-8-payments).
- [ ] **TB S3-4**: Confirmation/cancellation email and receipt → [9. Notifications](#tasks-9-notifications).

### Sprint 4 — Release readiness

- [ ] **TB S4-1**: Mobile/accessibility pass, security review and load baseline → [10. Release Readiness & Operations](#tasks-10-release).
- [ ] **TB S4-2**: Backup restore and deployment rollback rehearsal → [10. Release Readiness & Operations](#tasks-10-release).
- [ ] **TB S4-3**: Payment reconciliation and support runbooks → [10. Release Readiness & Operations](#tasks-10-release).
- [ ] **TB S4-4**: MVP exit criteria review and launch decision → [10. Release Readiness & Operations](#tasks-10-release).

---

<a id="22-module-wise-line-items-checklist"></a>

## Hotel Management Platform — Module-Wise Line Items Checklist

- **Status convention**: `[ ]` not started, `[x]` verified complete.
- **Entry rule**: keep each checklist entry to one line and mark it complete only after its acceptance criteria are implemented and verified.

<a id="tasks-0-foundations"></a>

### 0. Foundations & Decisions (added from task board, Sprint 0)

- **Specs**: [ARCHITECTURE.md#20-decision-log](./ARCHITECTURE.md#20-decision-log), [guidelines/testing-devops.md#16-devops](./guidelines/testing-devops.md#16-devops), [modules/audit-logging.md](./modules/audit-logging.md).

- [x] Confirm launch market, currency, time-zone model, tax rules and payment provider defaults (`.env.example`, `configuration.ts`). (task board: TB S0-1)
- [x] Choose API/database/ORM and hosting; record ADRs (ADR-001, ADR-002, ADR-011, ADR-013 established). (task board: TB S0-2)
- [x] Scaffold apps, migrations, lint/build pipeline, config and health checks (NestJS API, `@staywise/contracts`, `/api/v1/health` verified, and MongoDB replica-set transactions verified). (task board: TB S0-3)
- [x] Publish API contract and define audit/logging conventions (Swagger OpenAPI at `/api/docs`, `AuditLog` schema, and `AuditService` with metadata redaction). (task board: TB S0-4)

<a id="tasks-1-auth"></a>

### 1. Authentication & Authorization

- **Specs**: [modules/authentication.md](./modules/authentication.md), [modules/rbac.md](./modules/rbac.md), [modules/staff-users.md](./modules/staff-users.md).

#### Guest Authentication
- [ ] Guest registration with name, email, phone, and password
- [ ] Email format, password strength, and duplicate account validation
- [ ] Password visibility toggle and accessible password guidance
- [ ] Guest login and logout with secure session handling
- [ ] Current authenticated guest endpoint (`GET /api/v1/auth/me`)
- [ ] Client authentication state initialization on app load and refresh
- [ ] Protected guest routes and return-to-page redirect after login
- [ ] Password reset request and expiring single-use reset token flow
- [ ] Authenticated password change with current password verification
- [ ] Email verification and resend verification flow if required by launch policy
- [ ] Google or OTP sign-in only after the core booking flow is stable

#### Admin Authentication and Roles
- [x] Dedicated admin sign-in and session check endpoints
- [x] Super admin role and protected admin route handling
- [x] Backend guards for authenticated admin endpoints
- [ ] Permission checks for hotel, inventory, booking, staff, and reporting actions
- [ ] Hotel manager role scoped to explicitly assigned properties in a later phase
- [ ] Staff account creation, suspension, and session revocation
- [x] Admin login and sensitive action audit events
- [ ] MFA requirement for privileged production accounts
- [ ] Login throttling, lockout policy, account recovery protections
  - **Drift note (2026-10-15 report)**: "The throttling/lockout item is unchecked, but it is done (B9)" — left unchecked here because the state is kept verbatim; see [README.md#DOCUMENTATION-REPORT](./README.md#DOCUMENTATION-REPORT) §6 and [HISTORY.md#26-fullstack-fix-plan-progress](./HISTORY.md#26-fullstack-fix-plan-progress).
- [ ] Staff session login, permission loading, and initial super-admin bootstrap (in progress; MFA, invitations, recovery, and broader session management remain). (task board: TB S1-1)

<a id="tasks-2-guest-profile"></a>

### 2. Guest Profile & Booking Access

- **Specs**: [modules/guest-accounts.md](./modules/guest-accounts.md), [modules/bookings.md](./modules/bookings.md).

- [ ] View and update guest name, email, and phone details
- [ ] Support guest checkout without requiring account creation
- [ ] Provide secure booking lookup through ownership or expiring access link
- [ ] List bookings belonging to the authenticated guest
- [ ] View booking details, payment status, stay dates, and cancellation terms
- [ ] Protect booking access against reference guessing and unauthorized lookup

<a id="tasks-3-hotel"></a>

### 3. Hotel Management

- **Specs**: [modules/hotels.md](./modules/hotels.md), [modules/room-types.md](./modules/room-types.md), [modules/media.md](./modules/media.md).

- [x] Create hotel schema with name, slug, city, address, coordinates, and time zone
- [x] Add hotel description, address, contact information, creative unified command center workspace (`apps/admin-web/src/features/hotels/HotelWorkspace.tsx`) with 1 smart primary action, `···` menu, floating save bar, room creation, cancellation policies, and pre-publish readiness gates (evidence: .agent/work/20261016-restore-hotel-workspace-flow/verify.md) (task board: TB S1-6 — Creative Hotel Workspace Command Center)
  - **Task board text (TB S1-6, `[x]`)**: Creative Hotel Workspace Command Center (`apps/admin-web/src/features/hotels/HotelWorkspace.tsx`, `/admin/hotels/:id/edit` with decluttered header [1 smart primary action + `···` menu], floating unsaved changes bar, single-page card deck for Identity, Photos, Rooms, and Policy, readiness alerts, and full status lifecycle controls; verified via task `20261016-restore-hotel-workspace-flow`).
- [ ] Add cancellation, check-in, checkout, and guest policies
- [x] Admin property directory UI, workspace drawer, and publication readiness checks
- [x] Validate unique hotel slugs and required property details
- [x] Workspace setup checklist driven by server readiness (5 steps incl. Availability), real list setup progress, unsaved-change protection (evidence: .agent/work/20261020-ux-top4-fixes/verify.md)
- [x] Form field typing Phase A+B: India PIN, ISO country/currency, https/`/uploads` media URLs, JPEG/PNG/WebP uploads, room code pattern, clearable room description, conditional room-count reason, cities + updatedSince list filters; shared Checkbox/DatePicker/Combobox/PasswordInput/ReasonField (evidence: .agent/work/20261019-field-types-phase-ab/verify.md)
- [x] Hotel form keeps address line 2 and state/region on edit (state dropdown for India); inventory block/unblock reason validation fixed (`@MinLength(3)`) (evidence: Documentation/06-analysis/form-field-type-analysis.md, Status update)
  - **Evidence location now**: [ANALYSIS.md#form-field-type-analysis](./ANALYSIS.md#form-field-type-analysis) (Status update).
- [x] Simplified Add/Edit hotel UI: one shared fields block (`HotelDetailsFields`) with slug auto-fill and country/time-zone dropdowns, workspace on shared `Tabs` (Details, Photos, Rooms, Cancellation policy), archived read-only banner; all money inputs (base rate, fixed cancellation/no-show fee) typed in rupees via shared `MoneyInput` and sent as integer minor units (evidence: .agent/work/20261019-simplify-hotel-forms-inr-money/verify.md)
- [x] Implement `POST /admin/hotels/:id/media` photo upload API with primary image selection, gallery ordering, dedicated upload popup dialog, centered photo details modal for caption editing/cover selection, and reusable `ConfirmDialog` for photo deletions with popup bypass (evidence: .agent/work/20261016-delete-confirmation-dialog/verify.md) (task board: TB S1-7 — Planned Hotel Backend & UI Extensions)
  - **Task board text (TB S1-7, `[x]`)**: Planned Hotel Backend & UI Extensions (Media upload API `POST /admin/hotels/:id/media`, dedicated upload popup dialog, centered photo details modal for captions/cover, reusable `ConfirmDialog` primitive for photo deletions with popup bypass rule, Mongoose text search index, backend multi-filter queries, `PATCH /admin/hotels/bulk-status`, photo gallery modal, floating bulk directory action bar; verified NestJS API and React admin web builds).
- [x] Implement Mongoose text index and backend query multi-filters (`search`, `city`, `setupStatus`) on `GET /admin/hotels` (task board: TB S1-7 — Planned Hotel Backend & UI Extensions)
- [x] Hide archived hotels from `GET /admin/hotels` and the hotel list unless `status=ARCHIVED` is requested; fix `setupStatus` overriding `status` (evidence: .agent/work/20261019-hide-archived-hotels/verify.md)
- [x] Implement `PATCH /admin/hotels/bulk-status` endpoint for multi-select floating action bar status updates (task board: TB S1-7 — Planned Hotel Backend & UI Extensions)
- [ ] Implement `POST /admin/hotels/import` and `GET /admin/hotels/export` for bulk CSV property directory operations (Phase 4 planned)
- [ ] Prevent disabling or deleting hotels with active confirmed stays without a resolution flow
- [ ] Add hotel manager assignment and property scope in a later phase
- [ ] Hotel and room-type data model and admin CRUD (in progress: versioned, audited APIs and the first admin property/room workflows; media and remaining catalog actions remain). (task board: TB S1-2)
- [x] Admin property setup UI & Modular Architecture (Refactored `apps/admin-web` to 1-component-per-file modular architecture with Tailwind CSS v4, Staywise brand forest green & lime green theme, standardized `Button` primitive, scaled typography & icons, and flexbox alignment fixes; production build verified). (task board: TB S1-5)
- [x] Unified 4-Tab Hotel Workspace and Room Media Management (task `20261019-hotel-workspace-4-tabs`: Hotel & Photos, Room Types with room-level media uploads, embedded Room Rates management, dedicated Cancellation Policy tab, and interactive Publishing Checklist bar; verified with full NestJS API and React admin web builds). (task board: TB S1-8)

<a id="tasks-4-inventory"></a>

### 4. Inventory & Availability (added from task board)

- **Specs**: [modules/bookings.md](./modules/bookings.md) (availability, inventory and holds), [PRODUCT.md#12-business-rules](./PRODUCT.md#12-business-rules).

- [x] Inventory by room type and local stay date; blocks and total-room changes (bounded initialization, exclusive date ranges, scoped calendar, audited blocks, and guarded room-count updates; replica-set integration tests pass for initialization, blocks, and capacity safeguards). (task board: TB S1-3)
- [ ] Atomic multi-night availability claim and hold expiry. (task board: TB S2-1)
- [ ] Integration test concurrent final-room claims and partial-range rollback. (task board: TB S2-5)

<a id="tasks-5-pricing"></a>

### 5. Pricing & Rates (added from task board)

- **Specs**: [modules/pricing.md](./modules/pricing.md); publication gates in [modules/hotels.md](./modules/hotels.md).

- [x] Base rate setup and hotel publication workflow (API and admin screens implemented; replica-set integration tests pass for optimistic rate versioning, audit records, and publication gates for policy, rates, and future inventory). (task board: TB S1-4)
- [ ] Server-side quote and immutable booking price snapshot. (task board: TB S2-2)

<a id="tasks-6-search"></a>

### 6. Guest Search (added from task board)

- **Specs**: [modules/guest-search.md](./modules/guest-search.md).

- [ ] Public hotel detail and search UI/API (detail endpoint exists; search, quote, tax decisions and guest UI remain). (task board: TB S1-9)

<a id="tasks-7-bookings"></a>

### 7. Bookings (added from task board)

- **Specs**: [modules/bookings.md](./modules/bookings.md); guest-side access lines are in [2. Guest Profile & Booking Access](#tasks-2-guest-profile).

- [ ] Idempotent booking creation and guest booking retrieval. (task board: TB S2-3)
- [ ] Admin booking list/details and audited lifecycle transitions. (task board: TB S2-4)

<a id="tasks-8-payments"></a>

### 8. Payments, Refunds & Cancellation (added from task board)

- **Specs**: [modules/payments.md](./modules/payments.md), [modules/cancellation-policies.md](./modules/cancellation-policies.md).

- [ ] Provider adapter and test credentials. (task board: TB S3-1)
- [ ] Signed, idempotent webhook processing and late-success reconciliation. (task board: TB S3-2)
- [ ] Cancellation policy snapshot, refund workflow and status visibility. (task board: TB S3-3)

<a id="tasks-9-notifications"></a>

### 9. Notifications (added from task board)

- **Specs**: [modules/notifications.md](./modules/notifications.md).

- [ ] Confirmation/cancellation email and receipt. (task board: TB S3-4)

<a id="tasks-10-release"></a>

### 10. Release Readiness & Operations (added from task board)

- **Specs**: [modules/deployment-operations.md](./modules/deployment-operations.md), [guidelines/testing-devops.md](./guidelines/testing-devops.md), [MVP.md#03-mvp-scope](./MVP.md#03-mvp-scope) (exit criteria).

- [ ] Mobile/accessibility pass, security review and load baseline. (task board: TB S4-1)
- [ ] Backup restore and deployment rollback rehearsal. (task board: TB S4-2)
- [ ] Payment reconciliation and support runbooks. (task board: TB S4-3)
- [ ] MVP exit criteria review and launch decision. (task board: TB S4-4)
