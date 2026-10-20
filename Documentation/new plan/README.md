# New plan — index and shared baseline

- **Date:** 2026-10-20
- **Status:** proposal; becomes the source of truth once approved. After approval, `../MVP.md` and `../TASKS.md` are updated to point here.
- **Inputs:**
  - [admin-ux-plan.md](./admin-ux-plan.md): UX lead proposal;
  - [reports/Hotel admin UX plan evaluation.md](./reports/Hotel%20admin%20UX%20plan%20evaluation.md): research verdict and five fixes;
  - `research_notes/`: sourced notes;
  - the current code in `apps/api` and `apps/admin-web`;
  - the current docs in `../`.

## Documents in this folder

| File | Purpose | Main reader |
|---|---|---|
| [PRD.md](./PRD.md) | Product requirements: users, problems, goals, features, success metrics | Product, everyone |
| [MVP-PLAN.md](./MVP-PLAN.md) | Step-by-step implementation tasks for the MVP (phases P1–P6) | Coding model + reviewer |
| [PHASES.md](./PHASES.md) | Phase-to-phase roadmap P0–P8: gates, dependencies, detailed tasks for post-MVP phases | Coding model + lead |
| [UX-PLAN.md](./UX-PLAN.md) | Journeys, flows, screen behaviour, states, copy, accessibility | Designer, coding model |
| [UI-PLAN.md](./UI-PLAN.md) | Visual system, tokens, components, layouts per screen | Coding model + designer |
| [DATA-MODEL.md](./DATA-MODEL.md) | Entities, fields, relationships, indexes, state machines, migrations | Backend, coding model |
| [MIGRATION-PLAN.md](./MIGRATION-PLAN.md) | How to move from the current structure to the target, with effort estimates | Lead, planning |

## Shared baseline (every document must follow this)

### Product scope
- **Market:** India first. Currency INR, money as **integer minor units (paise)**, time zone per hotel (default `Asia/Kolkata`), GST rules below.
- **Users** (see the roles correction under Canonical names):
  - **Super admin:** all hotels.
  - **Hotel manager / staff:** assigned hotels only. Today only Super Administrator is seeded; Manager and Editor role presets are added in P0/P1 (see Canonical names).
  - **Guest:** public booking flow.
- **MVP objective (kept from `../MVP.md`):**
  - an admin publishes a hotel and its inventory;
  - a guest searches, holds and books with **no overbooking**;
  - staff find and manage bookings.
- **MVP adds, from the research:**
  - a hotel-scoped admin with a global switcher;
  - a Rooms & rates table;
  - a room type × date inventory grid;
  - an audit log;
  - an Overview with setup health;
  - Tax & billing (GSTIN);
  - pay-at-hotel bookings.
- **Out of MVP:**
  - online payment and refunds;
  - invoice PDF;
  - WhatsApp/SMS;
  - the Today dashboard with live arrivals;
  - reports and exports;
  - physical room assignment;
  - channel managers;
  - multi-currency.

### Phases (use these exact IDs and names)

| ID | Name | In MVP | Summary |
|---|---|---|---|
| **P0** | Current state (built) | ✅ done | Hotels CRUD, workspace checklist, room types + photos, base rates, nightly inventory (open dates, block/unblock), cancellation/no-show policy, publish readiness, archived hidden from list, list/cards view |
| **P1** | Admin foundations | ✅ | Hotel-scoped routes + global hotel switcher; Rooms & rates table + room side panel (details/photos/price/availability); enable/disable/duplicate room type; audit log viewer; UI theme quick wins |
| **P2** | Inventory & rates grid | ✅ | Room type × date grid: range select, bulk price (daily rates), open/close (stop-sell), min stay, booking cut-off; zero/suspicious-rate check; replaces separate Rates/Availability pages |
| **P3** | Hotel content, Overview & tax | ✅ | Overview tab (status, setup health / needs attention, content-completeness score); content: check-in/out times, amenities, child & extra-bed policy, star rating, map pin, photo categories; Tax & billing (GSTIN, legal name, state, specified premises) |
| **P4** | Holds & booking core | ✅ | Quote/pricing engine (per-night price + per-night GST), holds (TTL, transaction, idempotency), bookings with snapshots, pay-at-hotel; staff New booking page |
| **P5** | Guest booking web (MVP) | ✅ | New `apps/guest-web`: search (city/dates/guests), hotel page, room choice, hold + guest details, confirmation with booking reference |
| **P6** | Booking management + MVP launch | ✅ | Admin bookings list, detail, cancel / no-show with fee preview, booking calendar (reuses the P2 grid), email confirmation, launch hardening (backups, monitoring, rollback) |
| **P7** | Payments, refunds, invoices | ❌ post-MVP | Razorpay/Cashfree payment links + UPI, webhooks, refunds state machine, per-night GST invoices, SMS/WhatsApp |
| **P8** | Operations & insight | ❌ post-MVP | Today dashboard (arrivals/departures/in-house), guest profiles, Form-III for foreign guests (at check-in), reports + CSV, portfolio "All hotels" view |

- **Old phase names** in `../MVP.md` (Phase 0–4) map as follows:
  - old Phase 1 "Hotel setup and booking without online payment" = **P1–P6**;
  - old Phase 2 "Payment and cancellations" = **P7**;
  - old Phases 3–4 = **P8** and later.

### Naming (use exactly)

- **Entities and collections:**
  - existing:
    - `User`, `Role`, `StaffMembership`, `StaffSession`;
    - `Hotel`, `RoomType`;
    - `BaseRate`, `NightInventory`;
    - `AuditLog`.
  - new:
    - `DailyRate` (per room type per date price override, P2);
    - `Hold` (P4);
    - `Booking` with embedded `nights[]` lines (P4);
    - `Payment`, `Refund`, `Invoice` (P7);
    - `GuestProfile` (P8);
    - `Notification` (P6 email, P7 SMS/WhatsApp).
- **Restrictions live on `NightInventory`** (P2 new fields): `closed` (stop-sell), `minStay`, `cutoffDays`.
- **Tax profile is embedded in `Hotel`** as `taxProfile` (P3): `gstin`, `legalName`, `stateCode`, `specifiedPremises`.
- **State machines stay separate** (project rule):
  - **Hold:** `ACTIVE → CONVERTED | EXPIRED | RELEASED`.
  - **Booking:** `OPTIONAL` (tentative, with `releaseAt`) → `CONFIRMED` → `CHECKED_IN` → `CHECKED_OUT` → `COMPLETED`; also `CANCELLED`, `NO_SHOW`.
  - **Payment:** `NOT_REQUIRED | PENDING | AUTHORIZED | CAPTURED | FAILED | PARTIALLY_REFUNDED | REFUNDED`. In the MVP, pay-at-hotel bookings use `NOT_REQUIRED` or `PENDING` with method `PAY_AT_HOTEL`.
  - **Refund (P7):** `REQUESTED → PROCESSING → SUCCEEDED | FAILED`.
- **Admin routes (target):**
  - top level:
    - `/admin/today` (P3 setup health, P8 live);
    - `/admin/hotels` (list);
    - `/admin/hotels/new`;
    - `/admin/bookings` (all accessible hotels, search);
    - `/admin/audit`;
    - `/admin/settings/staff`;
    - `/admin/reports` (P8).
  - per hotel (all under `/admin/hotels/:hotelId/`):
    - `overview`, `details`, `photos`, `rooms`, `inventory` (grid), `policies`, `tax`;
    - `bookings`, `bookings/new`, `bookings/:bookingId`.
  - **old routes redirect:**
    - `/admin/hotels/:id/edit?tab=…` → the matching new tab;
    - `/admin/room-types?hotel=:id` → `/admin/hotels/:id/rooms`;
    - `/admin/rates` and `/admin/inventory` → `/admin/hotels/:id/inventory`.
- **Global hotel switcher rules:**
  - the hotel comes from the URL (`:hotelId`); the last-used hotel is only the default;
  - hidden (static name) when the user has access to one hotel;
  - searchable, with recent hotels;
  - "All hotels" is only available on top-level pages (`/admin/bookings`, `/admin/today`, `/admin/reports`); editing pages always need one hotel;
  - switching hotels with unsaved edits asks for confirmation.
- **API:** keep `/api/v1`, NestJS modules, DTO validation (`whitelist`, `forbidNonWhitelisted`), optimistic `version`, Mongo transactions for inventory writes, per-field error responses `{ errorCode, message, errors: [{ field, message }] }`.

<a id="canonical-names"></a>

### Canonical names and corrections (consistency pass, 2026-10-20)

- **Roles (correction):** only **Super Administrator** is seeded in code today. **Manager** and **Editor** appear only in a test script, so seeding them as role presets is a **P0/P1 task** (MIGRATION-PLAN M0.x / MVP-PLAN P1).
- **Staff settings page** (`/admin/settings/staff`): **P1** (PRD decision D-16 proposes this; confirm).
- **Permission keys** (new keys follow the existing `resource.action` style):
  - **existing:** `hotels.view|create|edit|publish|archive`, `room_types.view|create|edit|archive`, `rates.view|edit`, `inventory.view|adjust|block`;
  - **new:**
    - `audit.view`;
    - `hotels.edit_tax`;
    - `bookings.view`, `bookings.create` (includes walk-ins), `bookings.manage` (modify dates/guest details, check in, check out), `bookings.cancel`, `bookings.no_show`;
    - **P8:** `bookings.assign_room`, `bookings.check_in_override`;
    - **P7:** payment and refund keys are defined in PHASES.md.
  - **Cancellation-policy edits** keep `hotels.edit`.
- **Soft delete everywhere (decided 2026-10-20):**
  - every collection has `isDeleted` (default `false`), `deletedAt`, `deletedBy` and `deleteReason`;
  - "delete" sets them, never removes the document;
  - reads hide deleted documents by default (shared Mongoose plugin);
  - unique indexes are partial on `isDeleted: false`;
  - `Booking`, `Payment`, `PaymentEvent`, `Refund`, `Invoice` and `AuditLog` are never deletable;
  - details: [DATA-MODEL.md §1.6](./DATA-MODEL.md#soft-delete); tasks: MVP-PLAN P1-T00, MIGRATION-PLAN M0.7.
- **Booking reference:** `SW-` + 6 Crockford base32 characters (no I/L/O/U), e.g. `SW-7K3M9Q`; unique index; regenerate on duplicate (up to 3 tries).
- **Booking field names are fixed by existing code:** the P0 time-zone check already queries `bookings` by `hotelId` and `checkOut`, so the P4 `Booking` must use exactly those names (see DATA-MODEL.md).
- **Collection name:** nightly inventory is stored in **`night_inventory`** (not `night_inventories`).
- **Already in the code (not new in P3):** `Hotel` coordinates (latitude/longitude) and `amenities`. Only the UI is new. Star rating, check-in/out times, child/extra-bed policy and photo categories are new fields.
- **API module layout (per MVP-PLAN):**
  - holds, quote/pricing engine (`modules/bookings/quote.service.ts`) and the hold sweeper (`modules/bookings/hold-expiry.job.ts`, a simple interval job) live in **`apps/api/src/modules/bookings/`**;
  - notifications live in `modules/notifications/`;
  - a scheduler library (`@nestjs/schedule`) is a P7 decision.
- **Guest web routes (P5, from UX-PLAN):** `/` (search home), `/search`, `/hotels/:slug`, `/checkout/:holdId`, `/booking/:reference/confirmation`.
- **Statuses:** the state machines above replace the older names in `../modules/*.md`, e.g. `CONSUMED` → `CONVERTED`, and `PENDING_PAYMENT` / `PAYMENT_REVIEW` → payment statuses. `packages/contracts` enums must be updated to match (MIGRATION-PLAN).
- **Effort (single source):** MIGRATION-PLAN.md §7 (MVP P0–P6: 138 / **185** / 264 person-days; ~117.5 human days with a smaller coding model + reviewer). PHASES.md §5 is aligned to it.

### India rules
- **GST on rooms (from 22 Sep 2025; verify with a tax professional):**
  - per night, actual price ≤ ₹7,500 → **5%, no input tax credit**; > ₹7,500 → **18%, with input tax credit**;
  - calculated **per night on the server**;
  - CGST+SGST split (place of supply = hotel);
  - snapshot saved on the booking.
- **GSTIN:** 15 characters: 2-digit state code + PAN + entity + `Z` + check digit (mod-36). Validate format, state match and check digit. Required before **invoices** (P7), not before holds.
- **Payments:**
  - MVP is pay-at-hotel;
  - P7 adds full or partial prepayment by payment link or UPI;
  - card authorisations lapse in 5–7 days, so don't design around long card holds.
- **Hold length:** 10 minutes by default (staff and guest web); 30–60 minutes for payment-link channels (P7); configurable per channel.

### Human-in-the-loop convention (used in MVP-PLAN, PHASES, UX-PLAN, UI-PLAN)
- **Format:** each task that a smaller coding model is likely to get wrong is marked:
  > **🧑 HUMAN CHECKPOINT — <reason>**: what the human must decide, review or test, and what "approved" looks like.
- **Always a checkpoint:**
  - product decisions (option lists, copy, prices, policies);
  - tax and money rules;
  - concurrency and transactions (holds, inventory);
  - payment gateway and webhook integration;
  - security and permissions;
  - data migrations and route changes with redirects;
  - visual design sign-off;
  - accessibility review;
  - anything touching production data.
- **Rules for the coding model:**
  - verify with `npx tsc --noEmit -p apps/api/tsconfig.json`, `cd apps/admin-web && npx tsc -b`, and `npm --workspace=apps/api run test`;
  - never run `nest build` while the dev server may be running;
  - never commit, push or delete files without human approval;
  - follow `../../AGENTS.md`.
