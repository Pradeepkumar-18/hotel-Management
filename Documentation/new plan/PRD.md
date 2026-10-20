# Staywise — Product Requirements Document (PRD)

## 1. Document control

- **Product:** Staywise hotel booking platform (admin web, API, guest booking web).
- **Date:** 2026-10-20.
- **Status:** Proposal. Becomes the product source of truth once approved, together with the other documents in this folder (see [README.md](./README.md)).
- **Owner:** _<Product owner name — to be filled>_.
- **Reviewers:** _<Tech lead>_, _<UX lead>_, _<Operations / hotel partner representative>_, _<Tax professional for §8 GST rules>_.
- **Version:** 0.1 (first draft).
- **Shared baseline:** this PRD follows the phase IDs (P0–P8), entity names, routes, state machines and India rules defined in [README.md — Shared baseline](./README.md#shared-baseline-every-document-must-follow-this). Where this document and the baseline disagree, the baseline wins and this document must be corrected.
- **Related new-plan documents:**
  - **Index and baseline:** [README.md](./README.md).
  - **Implementation tasks (MVP, P1–P6):** [MVP-PLAN.md](./MVP-PLAN.md).
  - **Roadmap and gates (P0–P8):** [PHASES.md](./PHASES.md).
  - **Journeys, flows, copy, accessibility:** [UX-PLAN.md](./UX-PLAN.md).
  - **Visual system and screen layouts:** [UI-PLAN.md](./UI-PLAN.md).
  - **Entities, indexes, state machines:** [DATA-MODEL.md](./DATA-MODEL.md).
  - **Moving from today's structure:** [MIGRATION-PLAN.md](./MIGRATION-PLAN.md).
  - **Inputs:** [admin-ux-plan.md](./admin-ux-plan.md), [reports/Hotel admin UX plan evaluation.md](./reports/Hotel%20admin%20UX%20plan%20evaluation.md), `research_notes/Hotel admin UX plan evaluation/`.
- **Existing documents this builds on:** [../MVP.md](../MVP.md), [../PRODUCT.md](../PRODUCT.md), [../TASKS.md](../TASKS.md), [../modules/index.md](../modules/index.md).
- **Conventions:**
  - **Priority:** Must (MVP blocker for its phase), Should (expected in its phase, can slip one phase), Could (nice to have).
  - **Phase:** the baseline phase in which the requirement is delivered.
  - **Decision marker:** items that need a product decision are marked "**Decision needed:**" and collected in §10.4.
  - **Money:** amounts shown in rupees (₹) for readability are stored and calculated as integer paise.

---

## 2. Problem statement and opportunity

### 2.1 The market

- **Who we serve:** independent Indian hotels, guest houses and small chains, most of them single-property, run by an owner or manager with a small front-desk team.
- **How they sell today:** mostly through OTAs (MakeMyTrip/Goibibo, Booking.com, Agoda), paying roughly 15–30% commission per booking. Some add a budget PMS (eZee, Hotelogix, StayFlexi) and a channel manager (AxisRooms, STAAH, eZee Centrix).
- **Multi-property pain:** a vendor-run survey of about 200 Indian hotel companies found 45% of chains struggle to manage multiple properties and about 23% lack timely access to data.
- **Mobile-first habit:** owners already update prices daily or in bulk, block and unblock dates, and set restrictions from their phone in the MakeMyTrip **Connect** app (formerly InGo-MMT). This is the baseline they will compare Staywise against.

### 2.2 What admins do today on MMT Connect and OTA extranets

- **Rates and availability:** a calendar per room type with date-range bulk edit of price, minimum stay and closure (Booking.com "Bulk edit", Connect daily/bulk price updates).
- **Go-live:** a short hard gate (property details, rooms, a rate, a default cancellation policy, finance details), followed by a soft 0–100% content score that never blocks publishing.
- **Content:** property-level and room-level photos with categories, amenities, child and extra-bed policies, check-in/out times.
- **Bookings:** received from each OTA, reconciled by hand, with tax and payout rules set by each OTA.
- **Gaps they live with:** no direct-booking channel they own, commission on every booking, tax handled differently per OTA, no single place to see setup health, and change history that is hard or impossible to find.

### 2.3 What Staywise has today (P0, built)

- **Admin web routes:** `/admin/dashboard`, `/admin/hotels`, `/admin/hotels/new`, `/admin/hotels/:id`, `/admin/hotels/:id/edit` (workspace with tabs), `/admin/room-types` (+ new / edit), `/admin/inventory`, `/admin/rates` (see `apps/admin-web/src/routes/AppRoutes.tsx`).
- **API modules:** `auth`, `hotels` (hotels and room types), `inventory` (`NightInventory`), `pricing` (`BaseRate`), `audit` (`AuditLog` written by `AuditService`), `health` (see `apps/api/src/modules`).
- **Working features:** hotels CRUD with draft/publish/suspend/archive, a server-driven 5-step setup checklist, room types with photos, base rates in paise, nightly inventory (open dates, block/unblock), cancellation and no-show policy, publish readiness checks, archived hotels hidden from the list, list/cards view, staff sessions with permission checks.
- **Missing for an MVP:** hotel picker repeated on every page, room details split across four places, a 14-night calendar that blocks one night at a time, no date-specific prices, no audit viewer, no holds, no bookings, no guest web, no GST handling, no booking emails.

### 2.4 Why Staywise

- **Own the direct channel:** give each hotel a commission-free booking channel with server-calculated, GST-correct totals.
- **Match the phone baseline, then beat it:** an inventory grid that is at least as fast as MMT Connect on a phone, plus things OTAs don't offer:
  - **sellability health:** every room type shows whether it can be sold and the one-click fix if not;
  - **guided go-live:** an in-app checklist (major PMS vendors rely on coach-led onboarding instead);
  - **correct tax from day one:** per-night GST slabs calculated and snapshotted on the server;
  - **traceability:** an audit log of who changed which price or date.
- **No overbooking by design:** inventory writes run in MongoDB transactions with time-limited holds, and manual date blocking protects against OTA sales until a channel manager exists.

---

## 3. Goals, non-goals and success metrics

### 3.1 MVP goals (P1–P6)

- **G1 — Publish fast:** an admin publishes a hotel and its inventory through a guided checklist (kept from `../MVP.md`).
- **G2 — Book safely:** a guest searches, holds and books with **no overbooking**, and receives a booking reference (kept from `../MVP.md`).
- **G3 — Operate bookings:** staff find, create and manage bookings, including cancel and no-show with a fee preview (kept from `../MVP.md`).
- **G4 — One hotel at a time, clearly:** a hotel-scoped admin with a global switcher; the hotel is always in the URL.
- **G5 — Daily inventory on any device:** a room type × date grid for prices, open/close, minimum stay and cut-off, usable on a phone.
- **G6 — Trust and compliance:** an audit log from P1, a tax profile with GSTIN in P3, and per-night GST on every quote and booking from P4.
- **G7 — Pay at hotel:** bookings confirm without online payment; payment status is tracked separately.

### 3.2 Later goals (post-MVP)

- **P7 — Money:** online prepayment (full or partial) by payment link and UPI, refunds, per-night GST invoices, SMS/WhatsApp messages.
- **P8 — Operations and insight:** live Today dashboard, guest profiles, Form-III support at check-in, reports with CSV, portfolio "All hotels" view.

### 3.3 Non-goals

- **Not in the MVP:** online payment and refunds, invoice PDF, WhatsApp/SMS, the live Today dashboard, reports and exports, physical room assignment, channel managers, multi-currency (baseline "Out of MVP").
- **Never in scope without a new decision:** microservices, loyalty wallets, dynamic yield pricing, automated tax advice, AI that changes inventory, prices or refunds (see [../MVP.md#out-of-mvp](../MVP.md#out-of-mvp) and [../PRODUCT.md#17-ai-features](../PRODUCT.md#17-ai-features)).
- **Not a full PMS in the MVP:** housekeeping, room numbers, folios, POS and night audit are not part of this product plan.

### 3.4 Success metrics

- **Status of every target:** proposals. **Decision needed:** product to confirm each target and its measurement method before P1 starts (D-18).

| ID | Metric | Proposed target | How measured | Phase |
|---|---|---|---|---|
| M-01 | Time to publish a new hotel (draft created → Published), one room type, photos ready | Median ≤ 30 min | Audit log timestamps | P3 |
| M-02 | Setup completion rate | ≥ 70% of drafts reach Published within 14 days | Hotel status history | P3 |
| M-03 | Overbooking caused by Staywise | 0 incidents; concurrency test: N parallel last-room requests → exactly 1 hold, 100% of runs | Integration test + incident log | P4 |
| M-04 | Inventory released exactly once (expiry, cancel, no-show) | 100% | Reconciliation job comparing `NightInventory` with active holds/bookings | P4–P6 |
| M-05 | Staff task time: set one price for a room type across 30 nights | ≤ 60 s, ≤ 6 interactions | Moderated usability test | P2 |
| M-06 | Staff task time: block a date range for a room type | ≤ 30 s | Usability test | P2 |
| M-07 | Staff task time: create a pay-at-hotel booking | ≤ 2 min | Usability test + server timing (hold → booking) | P4 |
| M-08 | Staff task time: find a booking by name, phone or reference | ≤ 15 s | Usability test | P6 |
| M-09 | Inventory grid on a phone (360 px wide) | All P2 grid tasks completed by ≥ 4 of 5 test users | Usability test on a phone | P2 |
| M-10 | Guest hold → confirmed booking | ≥ 60%; hold expiry rate < 20% | Hold and booking records | P5 |
| M-11 | Tax correctness | 100% of bookings have a per-night GST snapshot equal to a fresh recompute | Automated check | P4 |
| M-12 | Edits applied to the wrong hotel | 0 reported | Support tickets + audit review | P1 |
| M-13 | Content completeness of published hotels at 30 days | Median ≥ 80% | Overview score | P3 |
| M-14 | Search response time | P95 < 500 ms at expected MVP load (from `../PRODUCT.md`) | API metrics | P5 |
| M-15 | Accessibility | 0 critical automated violations; manual WCAG 2.2 AA review passed per release | axe + manual review | P1–P6 |
| M-16 | Audit coverage | 100% of admin mutations write an `AuditLog` record | Automated test per endpoint | P1 |

---

## 4. Users and personas

- **Roles in the system:** roles and permissions already exist (`Role`, `StaffMembership`, permission keys such as `hotels.edit`, `inventory.block`, `rates.edit`). The baseline names three roles: **Super Administrator**, **Manager**, **Editor**. Today only Super Administrator is seeded; Manager and Editor are defined as role presets. Hotel scope comes from `StaffMembership`.

### 4.1 Super admin (platform operator)

- **Who:** Staywise operations staff or the owner of a small chain.
- **Context:** desktop most of the day; phone for urgent fixes.
- **Needs:**
  - **Onboard hotels:** create and publish new hotels quickly, copy setup between hotels;
  - **See the portfolio:** which hotels are not bookable and why;
  - **Control access:** assign staff to hotels and roles;
  - **Trace changes:** who changed a price, policy or status, and when.
- **Permissions:** all hotels, all actions, staff and role administration, audit log across hotels. Sensitive actions (role assignment, overrides) are still audited.

### 4.2 Hotel manager / front desk

- **Who:** owner-manager or front-desk staff of one hotel (sometimes 2–5 hotels for a small group).
- **Context:** phone first for prices and dates (habit from MMT Connect); front-desk desktop or tablet for bookings; interruptions and walk-in guests.
- **Needs:**
  - **Daily prices and availability:** change prices for date ranges, close sold-out or maintenance dates, set minimum stays;
  - **Bookings:** create walk-in and phone bookings in under 2 minutes; find any booking in seconds; cancel or mark no-show with the fee shown first;
  - **Clarity:** always know which hotel they are editing.
- **Permissions:** assigned hotels only. Typical Manager role: view and edit hotel content, rooms, inventory, rates, bookings (create, cancel, no-show), view audit for their hotels. Cannot publish/archive unless granted, cannot manage staff.

### 4.3 Editor (content)

- **Who:** marketing or content staff, sometimes an agency.
- **Context:** desktop; works in batches (photos, descriptions, amenities).
- **Needs:** edit descriptions, photos with categories, amenities and policies; see the completeness score and what to improve.
- **Permissions:** assigned hotels; `hotels.view`, `hotels.edit`, room-type content and media. No prices, inventory, bookings or publishing.

### 4.4 Guest

- **Who:** domestic leisure and business travellers booking directly with the hotel; some foreign guests.
- **Context:** mostly mobile web; expects UPI-era speed and clear totals; business guests need a company GSTIN on the bill.
- **Needs:** search by city, dates and guests; see real availability and an itemised total including GST before committing; a clear cancellation policy; a booking reference and confirmation email; pay at hotel in the MVP.
- **Permissions:** public search and hotel pages; their own holds and bookings only (no account required in the MVP — **Decision needed:** guest checkout vs account, D-15).

---

## 5. Jobs-to-be-done and user journeys

### 5.1 Jobs-to-be-done

- **JTBD-1 (super admin / manager):** "When I sign a new property, I want to get it bookable today, so it starts earning without waiting for a coach."
- **JTBD-2 (manager):** "When demand changes, I want to change prices and close dates for a range from my phone, so I don't lose money or overbook against OTA sales."
- **JTBD-3 (front desk):** "When a guest calls or walks in, I want to book a room in under two minutes with the correct total, so the guest isn't kept waiting and no one else sells the same room."
- **JTBD-4 (guest):** "When I find a hotel I like, I want to see the full price with tax and the cancellation terms, and book in a few taps, so I can trust the booking."
- **JTBD-5 (front desk / manager):** "When plans change, I want to cancel or mark a no-show with the fee calculated for me, so I apply the policy fairly and consistently."
- **JTBD-6 (editor):** "When I improve a listing, I want to know what's missing, so guests see a complete hotel."

### 5.2 Journey A — Add a hotel and publish (P1, P3)

- **Step 1 — Create draft:** `/admin/hotels/new`: name, city, contact. Draft created in under a minute (built today).
- **Step 2 — Guided setup:** the workspace checklist leads through Details → Photos → Rooms → Inventory → Policies; steps that depend on others show "Cannot start yet".
- **Step 3 — Rooms & rates:** add room types in the side panel (details, photos, base price), or duplicate an existing room type with explicit field choice.
- **Step 4 — Open dates:** open a date range in the inventory grid.
- **Step 5 — Policies and tax:** cancellation and no-show terms; check-in/out times; Tax & billing (GSTIN) — recommended, not blocking publish.
- **Step 6 — Publish:** Publish enables only when the hard gate passes; the ⓘ icon lists what's missing with links to each fix.
- **After publish:** the hotel opens on **Overview** (status, setup health, completeness score); the checklist steps become ordinary tabs.

### 5.3 Journey B — Daily price and availability (P2)

- **Step 1:** open `/admin/hotels/:hotelId/inventory` (from the switcher, a bookmark, or a "Needs attention" link).
- **Step 2:** pick a 7, 14 or 30-day view; select a date range across one or more room types (tap-and-extend on phone, no dragging required).
- **Step 3:** choose an action: set price, open/close, minimum stay, cut-off days.
- **Step 4:** review the summary ("Set ₹4,200 for Deluxe King, 21 Oct – 19 Nov, 30 nights"), with a warning for zero or unusually low/high prices.
- **Step 5:** save; only changed fields are written, in one transaction, with one audit entry per change set.

### 5.4 Journey C — Staff creates a booking (P4)

- **Step 1 — Stay:** `/admin/hotels/:hotelId/bookings/new` (also from the top-bar "+" or by clicking an empty grid cell, which pre-fills dates and room type): dates, adults, children, rooms.
- **Step 2 — Room:** availability and per-night price per room type; choosing a room creates a **hold** (10 minutes by default) shown as quiet text "Room held · 9:32" with an Extend action.
- **Step 3 — Guest and payment:** name, phone, email, optional company GSTIN; itemised total with per-night GST; cancellation terms; payment method Pay at hotel.
- **Step 4 — Confirm:** the server converts the hold into a `CONFIRMED` booking with snapshots and returns the booking reference.
- **If the hold expires:** the form stays filled in; the page shows "Room no longer held — check availability again".

### 5.5 Journey D — Guest books online (P5)

- **Step 1 — Search:** city, check-in, check-out, guests (adults, children), rooms.
- **Step 2 — Results:** only hotels with a room type that fits the party and has inventory on every night; price shown per stay with tax label.
- **Step 3 — Hotel page:** photos, description, amenities, check-in/out times, policies, room types with prices.
- **Step 4 — Room choice → hold:** a hold is created when the guest chooses a room; guest details are collected with the timer in the background and an extend option.
- **Step 5 — Review and confirm:** itemised total (per-night price, GST, total), cancellation terms, pay at hotel; confirm.
- **Step 6 — Confirmation:** booking reference on screen and by email (P6).

### 5.6 Journey E — Manage a booking: cancel and no-show (P6)

- **Step 1 — Find:** `/admin/bookings` (all accessible hotels) or `/admin/hotels/:hotelId/bookings`; search by reference, guest name, phone or email; filter by dates, status, room type, payment.
- **Step 2 — Detail:** guest, stay, rooms, per-night price and GST breakdown, policy snapshot, booking and payment status as separate badges, history.
- **Step 3 — Cancel:** the dialog shows the server-calculated fee under the snapshotted policy and names the hotel, booking and outcome on the button ("Cancel booking SW-10234 · fee ₹1,750").
- **Step 3 (alt) — No-show:** available only after the check-in date has started in hotel local time; shows the no-show fee before confirming.
- **Result:** booking status changes once; inventory is released exactly once; the payment status is updated separately; the action is audited; a cancellation email is sent.

---

## 6. Functional requirements

- **Reading the tables:** each area has a lookup table (ID, requirement, priority, phase), followed by acceptance criteria per requirement.
- **Common acceptance rule for every admin mutation:** server-side permission and hotel-scope check, DTO validation (`whitelist`, `forbidNonWhitelisted`), optimistic `version` check, per-field errors `{ errorCode, message, errors: [{ field, message }] }`, and an `AuditLog` record.

### 6.1 Navigation and hotel scope (FR-NAV)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-NAV-01 | Hotel-scoped routes under `/admin/hotels/:hotelId/` | Must | P1 |
| FR-NAV-02 | Global hotel switcher in the top bar | Must | P1 |
| FR-NAV-03 | Switcher hidden for single-hotel users | Must | P1 |
| FR-NAV-04 | "All hotels" only on top-level read views | Must | P1 |
| FR-NAV-05 | Unsaved-changes confirmation when switching hotels | Must | P1 |
| FR-NAV-06 | Redirects from old routes | Must | P1 |
| FR-NAV-07 | Top-level navigation: Today, Hotels, Bookings, Audit, Settings | Must | P1 |
| FR-NAV-08 | Global "+ New booking" and booking search entry in the top bar | Should | P4 |

- **FR-NAV-01 — Hotel-scoped routes:**
  - **Routes:** `overview`, `details`, `photos`, `rooms`, `inventory`, `policies`, `tax`, `bookings`, `bookings/new`, `bookings/:bookingId` exist under `/admin/hotels/:hotelId/`.
  - **Source of truth:** the hotel comes from the URL; bookmarks and links open the same hotel in any tab; two tabs can show two hotels.
  - **Scope:** opening a hotel the user can't access shows the unauthorized page; the API returns 403/404 without leaking the hotel's data.
- **FR-NAV-02 — Global hotel switcher:**
  - **Content:** lists only hotels the user can access; searchable by name and city; shows recent hotels first.
  - **Behaviour:** choosing a hotel navigates to the same tab of the new hotel; the last-used hotel is only a default for pages without `:hotelId`.
- **FR-NAV-03 — Single-hotel users:** the top bar shows a static hotel name instead of a dropdown.
- **FR-NAV-04 — "All hotels":**
  - **Where:** only `/admin/bookings`, `/admin/today`, `/admin/reports`.
  - **Edit screens:** always need exactly one hotel; arriving at one without a hotel asks the user to pick one.
  - **Labels:** every row and count in an "All hotels" view names its hotel.
- **FR-NAV-05 — Unsaved changes:** switching hotels or leaving a page with unsaved edits asks "Discard changes to <hotel>?"; cancelling keeps the user on the page with edits intact.
- **FR-NAV-06 — Redirects:**
  - **Mapping:** `/admin/hotels/:id/edit?tab=…` → matching new tab; `/admin/room-types?hotel=:id` → `/admin/hotels/:id/rooms`; `/admin/rates` and `/admin/inventory` → `/admin/hotels/:id/inventory` (last-used hotel, or pick one).
  - **Verification:** every old route in `AppRoutes.tsx` has a tested redirect; no 404s for old bookmarks.
- **FR-NAV-07 — Top-level navigation:** `/admin/today` (P3 setup health, P8 live), `/admin/hotels`, `/admin/hotels/new`, `/admin/bookings` (P6), `/admin/audit`, `/admin/settings/staff`, `/admin/reports` (P8); items the user lacks permission for are hidden.
- **FR-NAV-08 — Global entry points:** a "+" button opens New booking for the current hotel (asks for one if none); booking search accepts a reference, name or phone and opens results in `/admin/bookings`.

### 6.2 Access and staff (FR-ACCESS)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-ACCESS-01 | Every request checked for actor status, permission and hotel scope | Must | P1 |
| FR-ACCESS-02 | Role presets: Super Administrator, Manager, Editor | Must | P1 |
| FR-ACCESS-03 | Staff settings: assign hotels and roles | Should | P1 |
| FR-ACCESS-04 | Money confirmations name the hotel and the booking | Must | P4 |

- **FR-ACCESS-01 — Server authorisation:**
  - **Check:** actor active + permission key + hotel in the actor's `StaffMembership` scope.
  - **Substitution:** cross-hotel ID substitution is rejected even with the same permission (from [../modules/rbac.md](../modules/rbac.md)).
- **FR-ACCESS-02 — Role presets:** the three roles are seeded idempotently with the permission sets in §4; custom roles cannot grant permissions the actor can't delegate.
- **FR-ACCESS-03 — Staff settings:**
  - **Screen:** `/admin/settings/staff` lists staff, roles and assigned hotels; super admin can invite, suspend and change scope; changes take effect on the next request.
  - **Decision needed:** confirm this screen ships in P1 (the phase table does not list it) or P6 (D-16).
- **FR-ACCESS-04 — Named confirmations:** every dialog that changes money or inventory states the hotel name, the booking reference or room type, and the amount.

### 6.3 UI foundations (FR-UI)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-UI-01 | Theme quick wins from the UI theme audit | Must | P1 |
| FR-UI-02 | Status badges: small set, never colour alone | Must | P1 |
| FR-UI-03 | Side panels for single-record edits | Must | P1 |

- **FR-UI-01 — Theme quick wins:** the issues in `../ANALYSIS.md#ui-theme-consistency-audit` are fixed; the "Active" status has its own style (today it falls back to the amber draft style).
- **FR-UI-02 — Status badges:** at most 5–6 visual types; each pairs colour with an icon and text; "Bookable" is visually quiet so problems stand out.
- **FR-UI-03 — Side panels:** editing one record opens a non-modal side panel that keeps the list visible; long multi-step flows (New booking) use their own page, not a panel.

### 6.4 Hotel content, Overview and publishing (FR-HOTEL)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-HOTEL-01 | Create a draft hotel in one short step (built) | Must | P0 |
| FR-HOTEL-02 | Hotel lifecycle: Draft, Published, Suspended, Archived (built) | Must | P0 |
| FR-HOTEL-03 | Publish hard gate with "what's missing" list (built; extended) | Must | P0/P3 |
| FR-HOTEL-04 | Workspace tabs with independent saves | Must | P1 |
| FR-HOTEL-05 | Live-hotel web-address warning and locked time zone hint | Must | P1 |
| FR-HOTEL-06 | Overview tab as default for published hotels | Must | P3 |
| FR-HOTEL-07 | Setup health / "Needs attention" list | Must | P3 |
| FR-HOTEL-08 | Content-completeness score (0–100%) | Must | P3 |
| FR-HOTEL-09 | Check-in and check-out times | Must | P3 |
| FR-HOTEL-10 | Amenities with three states | Must | P3 |
| FR-HOTEL-11 | Child and extra-bed policy; house rules | Must | P3 |
| FR-HOTEL-12 | Star rating | Should | P3 |
| FR-HOTEL-13 | Map pin (coordinates) | Must | P3 |
| FR-HOTEL-14 | Photo categories and main photo per room type | Must | P3 |
| FR-HOTEL-15 | "Copy from another hotel" with explicit field choice | Could | P3 |
| FR-HOTEL-16 | Guest preview card | Should | P3 |

- **FR-HOTEL-01 — Draft creation:** name, city and contact create a `DRAFT` hotel in under a minute; slug auto-filled and unique.
- **FR-HOTEL-02 — Lifecycle:** status actions in the header; archived hotels are read-only and hidden from the list unless filtered; transitions audited.
- **FR-HOTEL-03 — Publish gate:**
  - **Hard gate (blocks publish):** valid, effective cancellation and no-show policy; at least one active room type with `totalRooms ≥ 1`; a price for every active room type; future open inventory; minimum photos.
  - **Photo minimum:** proposed 5 property photos and 1 main photo per room type. **Decision needed:** confirm as hard gate (D-13).
  - **Not in the gate:** GSTIN, amenities, star rating, richer content (these feed the soft score).
  - **Display:** each problem has plain words and a link to the fix.
- **FR-HOTEL-04 — Tabs with independent saves:** Details, Photos, Rooms, Inventory, Policies, Tax each save on their own; saving one doesn't require scrolling or re-saving another; unsaved-change protection per tab.
- **FR-HOTEL-05 — Hidden rules made visible:**
  - **Web address:** changing the slug of a published hotel shows "Existing guest links will stop working" before saving.
  - **Time zone:** shown as locked with the reason when future bookings exist, instead of failing on save.
- **FR-HOTEL-06 — Overview:** shows status, published since, last updated by, setup health, completeness score and what's bookable in the next 14 days; default tab for published hotels; draft hotels keep the checklist.
- **FR-HOTEL-07 — Setup health:**
  - **Items:** missing price, no open dates in the next N days, zero or suspicious rates, disabled room types, missing GSTIN (advisory).
  - **Ranking:** High / Medium / Low; each line links to the exact fix screen.
  - **Also on:** `/admin/today` (P3), labelled "Setup health", per hotel or across all accessible hotels.
- **FR-HOTEL-08 — Completeness score:**
  - **Score:** 0–100%, weighted towards photos (Agoda weights property photos 45%, room photos 25%); each missing item has an action.
  - **Never blocks publishing.**
  - **Decision needed:** item list and weights (D-14).
- **FR-HOTEL-09 — Check-in/out times:** local times (hotel time zone) shown on hotel page, booking and email. **Decision needed:** defaults (D-05).
- **FR-HOTEL-10 — Amenities:** fixed option list, each Yes / No / Not answered; property level now, room level later. **Decision needed:** option list (D-01).
- **FR-HOTEL-11 — Child, extra-bed and house rules:** child age bands and whether children stay free; extra-bed availability and charge (paise); house rules (pets, smoking, ID required, couples/local ID policy). **Decision needed:** option lists (D-02).
- **FR-HOTEL-12 — Star rating:** optional 1–5 value. **Decision needed:** self-declared vs government-classified, and whether shown to guests (D-04).
- **FR-HOTEL-13 — Map pin:** latitude/longitude input with a map preview; validated ranges; used on the guest hotel page.
- **FR-HOTEL-14 — Photo categories:** uploads land in "To be categorised"; categories (exterior, lobby, room, dining, pool, bathroom, other) at hotel level or assigned to a room type; one cover per hotel and one main photo per room type; "at least 5 photos" tip.
- **FR-HOTEL-15 — Copy from another hotel:** choose fields explicitly (rooms, policy, amenities), preview what will be overwritten, confirm; audited per target.
- **FR-HOTEL-16 — Guest preview:** a card showing how the hotel appears in guest search results.

### 6.5 Rooms & rates (FR-ROOM)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-ROOM-01 | Rooms & rates table per hotel | Must | P1 |
| FR-ROOM-02 | Sellability health badge per room type | Must | P1 |
| FR-ROOM-03 | Room side panel: Details, Photos, Price, Availability | Must | P1 |
| FR-ROOM-04 | Disable and enable a room type | Must | P1 |
| FR-ROOM-05 | Duplicate a room type | Should | P1 |
| FR-ROOM-06 | Room-count change shows its impact | Must | P1 |
| FR-ROOM-07 | Bed types and room view | Should | P3 |

- **FR-ROOM-01 — Table:** `/admin/hotels/:hotelId/rooms`, one row per room type: photo, name, code, capacity (adults + children), room count, base price per night (₹), free tonight, health badge, row actions (Edit, Photos, Price, Open dates, Disable/Enable, Duplicate).
- **FR-ROOM-02 — Health badge:** one of Bookable, Missing price, No open dates, Disabled; each problem badge sits next to its fix action ("⚠ Missing price → Set price").
- **FR-ROOM-03 — Side panel:** the same panel creates and edits; tabs Details · Photos · Price · Availability; the list stays visible.
- **FR-ROOM-04 — Disable/enable:**
  - **Disable:** uses the existing `disableRoomType` API; disabled room types are not sellable; a disable that affects future open inventory explains the effect first.
  - **Enable:** a new endpoint restores `ACTIVE`; audited.
- **FR-ROOM-05 — Duplicate:** copies chosen fields (details, photos, base price) into a new room type with a new code; never copies inventory or bookings.
- **FR-ROOM-06 — Room-count impact:** before saving a new `totalRooms`, show how many future opened nights change and any nights where the new count is below booked/held units (blocked by the server).
- **FR-ROOM-07 — Bed types and view:** fixed lists. **Decision needed:** bed-type list (D-03).

### 6.6 Inventory and rates grid (FR-INV)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-INV-01 | Room type × date grid replaces Rates and Availability pages | Must | P2 |
| FR-INV-02 | Range selection without dragging | Must | P2 |
| FR-INV-03 | Bulk price per date (`DailyRate`) | Must | P2 |
| FR-INV-04 | Open/close (stop-sell) per date | Must | P2 |
| FR-INV-05 | Minimum stay per date | Must | P2 |
| FR-INV-06 | Booking cut-off (days before arrival) | Must | P2 |
| FR-INV-07 | Zero and suspicious rate check | Must | P2 |
| FR-INV-08 | Today / 7 / 14 / 30-day views and date jump | Must | P2 |
| FR-INV-09 | Usable on a phone | Must | P2 |
| FR-INV-10 | Only changed fields saved, atomically | Must | P2 |
| FR-INV-11 | Sold / held / free counts per cell | Must | P4 |
| FR-INV-12 | Booking calendar view reuses the grid | Must | P6 |

- **FR-INV-01 — Grid:** `/admin/hotels/:hotelId/inventory`; rows = room types, columns = nights; each cell shows price, open/closed, rooms available, min stay; replaces `/admin/rates` and `/admin/inventory` (redirected per FR-NAV-06).
- **FR-INV-02 — Range selection:** select by tap-start + tap-end, keyboard (Shift+arrows), or a "From / To / Days of week" form; dragging is optional, never required (WCAG 2.5.7).
- **FR-INV-03 — Bulk price:**
  - **Storage:** a `DailyRate` per room type per date overrides `BaseRate`; amounts in paise.
  - **Options:** set amount, or change by ±₹ / ±%; optional day-of-week filter.
  - **Resolution:** price for a night = `DailyRate` if present, else `BaseRate`.
- **FR-INV-04 — Open/close:** sets `NightInventory.closed`; closed nights are not sellable by guests or staff; existing bookings are unaffected.
- **FR-INV-05 — Minimum stay:** `NightInventory.minStay` checked on the arrival night at quote and hold time; the error says which night and the minimum.
- **FR-INV-06 — Cut-off:** `NightInventory.cutoffDays`; a night can't be booked fewer than N days before arrival, in hotel local time.
- **FR-INV-07 — Rate check:** saving a zero price is blocked; a price below or above a configurable band (e.g. < 30% or > 300% of the base rate) needs explicit confirmation. **Decision needed:** band values (D-22).
- **FR-INV-08 — Views:** one-click Today / 7 / 14 / 30 days; jump to a date; horizontal range visible without excessive sideways scrolling.
- **FR-INV-09 — Phone:** at 360 px the grid shows one room type at a time (or a sticky first column) with large cells; all P2 actions are reachable; target size ≥ 24×24 CSS px (WCAG 2.5.8).
- **FR-INV-10 — Saves:** only changed fields are written in one MongoDB transaction; a conflict (version changed) shows which cells changed and offers reload; one audit entry per change set listing the range and old/new values.
- **FR-INV-11 — Live counts:** after P4, each cell also shows sold, held and free units, from the same authoritative data as holds.
- **FR-INV-12 — Booking calendar:** the same component, room type × night, shows bookings per cell; clicking an empty cell starts New booking with dates pre-filled; no physical room rows in the MVP.

### 6.7 Tax and billing (FR-TAX)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-TAX-01 | Hotel tax profile (`Hotel.taxProfile`) | Must | P3 |
| FR-TAX-02 | GSTIN validation: format, state, check digit | Must | P3 |
| FR-TAX-03 | Per-night GST slab on the server | Must | P4 |
| FR-TAX-04 | CGST + SGST split | Must | P4 |
| FR-TAX-05 | Tax snapshot on the booking | Must | P4 |
| FR-TAX-06 | Optional guest company GSTIN on bookings | Should | P4 |
| FR-TAX-07 | GSTIN required before invoices, not holds | Must | P7 |
| FR-TAX-08 | Per-night GST invoices | Must | P7 |

- **FR-TAX-01 — Tax profile:** `/admin/hotels/:hotelId/tax`: `gstin`, `legalName`, `stateCode`, `specifiedPremises`; collected during setup; advisory in setup health; audited.
- **FR-TAX-02 — GSTIN validation:** 15 characters = 2-digit state code + PAN + entity character + `Z` + mod-36 check digit; the state code must match the hotel's state; per-field error messages.
- **FR-TAX-03 — Per-night slab:**
  - **Rule:** each night's actual price ≤ ₹7,500 (750,000 paise) → 5%; > ₹7,500 → 18%.
  - **Basis:** the final per-night price after any discount, per room.
  - **Where:** calculated only on the server, in paise, with deterministic rounding.
  - **Decision needed:** tax professional to confirm slab, basis (extra beds, meal plans, multi-night discounts) and the status of tariffs under ₹1,000 (D-06).
- **FR-TAX-04 — Split:** place of supply is the hotel's location, so tax is always CGST + SGST (half each), even for out-of-state business guests.
- **FR-TAX-05 — Snapshot:** each `Booking.nights[]` line stores price, slab, rate, CGST and SGST in paise; later rule or price changes never alter a saved booking.
- **FR-TAX-06 — Guest GSTIN:** optional company GSTIN and legal name at booking; validated like FR-TAX-02 (state need not match).
- **FR-TAX-07 — Invoice gate:** invoice generation is blocked until the hotel has a valid GSTIN; holds and bookings are not blocked.
- **FR-TAX-08 — Invoices:** sequential series per financial year; per-night lines with SAC, slab and CGST/SGST; recipient details when the guest is registered (CGST Rule 46).

### 6.8 Holds (FR-HOLD)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-HOLD-01 | Atomic multi-night hold in a transaction | Must | P4 |
| FR-HOLD-02 | Hold TTL, configurable per channel | Must | P4 |
| FR-HOLD-03 | Idempotency key on hold and booking creation | Must | P4 |
| FR-HOLD-04 | Expiry and release exactly once | Must | P4 |
| FR-HOLD-05 | Extend a hold (WCAG 2.2.1) | Must | P4 |
| FR-HOLD-06 | Quiet countdown and expiry recovery | Must | P4 |
| FR-HOLD-07 | Hold states separate from booking states | Must | P4 |

- **FR-HOLD-01 — Atomic hold:** a `Hold` decrements available units on every night of `[checkIn, checkOut)` for the room type in one transaction; if any night lacks units, is closed, breaks min stay or cut-off, nothing changes and the user sees which night failed.
- **FR-HOLD-02 — TTL:** 10 minutes by default for staff and guest web; 30–60 minutes for payment-link channels (P7); stored on the hold. **Decision needed:** exact values per channel (D-08).
- **FR-HOLD-03 — Idempotency:** repeating the same request with the same key returns the same hold or booking; never a second decrement.
- **FR-HOLD-04 — Release once:** a background job (and on-demand checks) moves expired holds to `EXPIRED` and restores units exactly once; releasing manually sets `RELEASED`.
- **FR-HOLD-05 — Extend:** a warning at least 20 seconds before expiry; one-click extend that works at least 10 times; extension renews the same hold without a new decrement.
- **FR-HOLD-06 — Countdown and recovery:** "Room held · 9:32" as quiet text (not announced every second to screen readers); on expiry the form keeps its data and offers "Check availability again".
- **FR-HOLD-07 — States:** `ACTIVE → CONVERTED | EXPIRED | RELEASED`; conversion to a booking happens in the same transaction that creates the booking.

### 6.9 Bookings (FR-BOOK)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-BOOK-01 | Server quote engine (per-night price + GST) | Must | P4 |
| FR-BOOK-02 | Staff New booking page | Must | P4 |
| FR-BOOK-03 | Booking creation with snapshots and reference | Must | P4 |
| FR-BOOK-04 | Booking state machine | Must | P4 |
| FR-BOOK-05 | Optional (tentative) booking with release date | Should | P4 |
| FR-BOOK-06 | Admin bookings list and search | Must | P6 |
| FR-BOOK-07 | Booking detail | Must | P6 |
| FR-BOOK-08 | Cancel with fee preview | Must | P6 |
| FR-BOOK-09 | Mark no-show with fee preview | Must | P6 |
| FR-BOOK-10 | Check-in and check-out status changes | Should | P6 |
| FR-BOOK-11 | Resend confirmation | Should | P6 |
| FR-BOOK-12 | Modify dates / rooms | Could | P8 |

- **FR-BOOK-01 — Quote:** input hotel, room type, dates, guests, rooms; output per-night lines (price source, price, GST slab, CGST, SGST) and totals in paise; validates capacity, open nights, min stay, cut-off; the client never sends prices.
- **FR-BOOK-02 — New booking page:** own URL `/admin/hotels/:hotelId/bookings/new`; three steps (Stay, Room, Guest & payment); price overrides only for permitted staff, with a reason, audited.
- **FR-BOOK-03 — Creation:**
  - **Snapshots:** guest details, policy, per-night price and tax, room type name and capacity saved on the `Booking`.
  - **Reference:** unique, human-readable (e.g. `SW-10234`), not guessable as an access key. **Decision needed:** format (D-19).
  - **Result:** booking `CONFIRMED`, payment `NOT_REQUIRED` or `PENDING` with method `PAY_AT_HOTEL`.
- **FR-BOOK-04 — States:** `OPTIONAL → CONFIRMED → CHECKED_IN → CHECKED_OUT → COMPLETED`, plus `CANCELLED`, `NO_SHOW`; only listed transitions allowed; each audited with actor and reason.
- **FR-BOOK-05 — Optional booking:** staff can create an `OPTIONAL` booking with `releaseAt`; it holds inventory until confirmed or auto-released at `releaseAt`. **Decision needed:** include in MVP (D-12).
- **FR-BOOK-06 — List:** `/admin/bookings` (all accessible hotels, labelled) and per-hotel list; search by reference, name, phone, email; filters for stay dates, status, room type, payment status; list or calendar (FR-INV-12).
- **FR-BOOK-07 — Detail:** guest, stay, rooms, per-night price and GST, totals, policy snapshot, booking status and payment status as separate badges, timeline of changes.
- **FR-BOOK-08 — Cancel:** server preview of fee under the snapshotted policy and property-local cutoff; the button names hotel, booking and amount; idempotent; inventory released once; cancellation email sent.
- **FR-BOOK-09 — No-show:** allowed only from the check-in date (hotel local time); fee from the policy snapshot shown first; inventory for remaining nights released once.
- **FR-BOOK-10 — Check-in/out:** simple status transitions with timestamps; no room assignment or ID capture in the MVP.
- **FR-BOOK-11 — Resend:** resend the confirmation email to the guest address on file; audited.
- **FR-BOOK-12 — Modify:** change dates or room type with re-quote and inventory swap in one transaction; deferred until safe repricing exists.

### 6.10 Guest booking web (FR-GUEST)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-GUEST-01 | New `apps/guest-web` app | Must | P5 |
| FR-GUEST-02 | Search: city, dates, guests, rooms | Must | P5 |
| FR-GUEST-03 | Results with only fully available hotels | Must | P5 |
| FR-GUEST-04 | Hotel page | Must | P5 |
| FR-GUEST-05 | Room choice → hold → guest details | Must | P5 |
| FR-GUEST-06 | Review with itemised total and policy | Must | P5 |
| FR-GUEST-07 | Confirmation with booking reference | Must | P5 |
| FR-GUEST-08 | Secure booking lookup | Should | P6 |
| FR-GUEST-09 | Guest self-service cancellation | Could | P6 |
| FR-GUEST-10 | Guest profiles separate from booking snapshots | Must | P8 |
| FR-GUEST-11 | Form-III data for foreign guests at check-in | Must | P8 |

- **FR-GUEST-01 — App:** responsive React + Tailwind app, mobile first; only `PUBLISHED` hotels visible. **Decision needed:** Staywise-branded marketplace vs per-hotel branding and domains (D-10).
- **FR-GUEST-02 — Search:** check-out after check-in; positive guest and room counts; maximum stay and booking horizon enforced.
- **FR-GUEST-03 — Results:** only hotels with a room type that fits capacity and is open on every night; stay total with a clear tax label. **Decision needed:** show prices inclusive or exclusive of GST (D-07).
- **FR-GUEST-04 — Hotel page:** photos, description, amenities, map, check-in/out times, child/extra-bed and house rules, cancellation summary, room types with price for the dates.
- **FR-GUEST-05 — Hold and details:** the hold starts when a room is chosen; name, phone, email, optional company GSTIN; FR-HOLD-05/06 apply.
- **FR-GUEST-06 — Review:** per-night price and GST, totals, exact local cancellation cutoff and fees, "Pay at hotel"; the guest accepts the policy; double submission prevented.
- **FR-GUEST-07 — Confirmation:** booking reference, stay summary, payment status ("Pay at hotel"), hotel contact.
- **FR-GUEST-08 — Lookup:** retrieve a booking with reference + email/phone verification or an expiring link; protected against reference guessing.
- **FR-GUEST-09 — Self-cancel:** same rules and preview as FR-BOOK-08. **Decision needed:** in MVP or later (D-21).
- **FR-GUEST-10 — Profiles:** `GuestProfile` holds contact and history; editing a profile never changes past booking snapshots.
- **FR-GUEST-11 — Form-III:** at check-in, capture the data needed for the Form-III report within 24 hours of a foreign guest's arrival; "Pending Form-III" appears on Today; ID scans have retention and erasure fields (see NFR-PRIV).

### 6.11 Payments and refunds (FR-PAY)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-PAY-01 | Payment status separate from booking status | Must | P4 |
| FR-PAY-02 | Pay-at-hotel bookings | Must | P4 |
| FR-PAY-03 | Record an offline payment at the desk | Should | P6 |
| FR-PAY-04 | Payment links and UPI (full or partial prepayment) | Must | P7 |
| FR-PAY-05 | Signed, idempotent webhooks and reconciliation | Must | P7 |
| FR-PAY-06 | Refund state machine | Must | P7 |
| FR-PAY-07 | Refund amount and timeline shown before confirming | Must | P7 |

- **FR-PAY-01 — Separate states:** `NOT_REQUIRED | PENDING | AUTHORIZED | CAPTURED | FAILED | PARTIALLY_REFUNDED | REFUNDED`; shown as its own badge.
- **FR-PAY-02 — Pay at hotel:** bookings confirm with method `PAY_AT_HOTEL` and payment `NOT_REQUIRED` or `PENDING`; balance due shown on detail.
- **FR-PAY-03 — Offline payment:** staff record cash / UPI QR / card-at-desk amount and reference; status updates to `CAPTURED` when fully paid; audited.
- **FR-PAY-04 — Prepayment:** payment link or UPI for full amount or a deposit; hold length for payment links per FR-HOLD-02; no design around card authorisations (they lapse in 5–7 days). **Decision needed:** gateway (D-09).
- **FR-PAY-05 — Webhooks:** signature verified; duplicate events ignored; late success after hold expiry reconciled (rebook if inventory allows, else refund).
- **FR-PAY-06 — Refunds:** `REQUESTED → PROCESSING → SUCCEEDED | FAILED`; capped at captured amount; cancellation never waits for the refund.
- **FR-PAY-07 — Refund preview:** the button names the outcome ("Cancel and refund ₹X"); copy says refunds take about 5–7 working days.

### 6.12 Notifications (FR-NOTIF)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-NOTIF-01 | Booking confirmation email | Must | P6 |
| FR-NOTIF-02 | Cancellation and no-show email | Must | P6 |
| FR-NOTIF-03 | SMS / WhatsApp messages | Should | P7 |

- **FR-NOTIF-01 — Confirmation email:** sent after the booking is durably saved (never inside the transaction); contains reference, hotel, dates, rooms, per-night price and GST, policy, check-in time; failures retried and visible on the booking (`Notification` record). **Decision needed:** email provider and sender domain (D-20).
- **FR-NOTIF-02 — Cancellation email:** states fee and (P7) refund status.
- **FR-NOTIF-03 — SMS/WhatsApp:** confirmation and payment-link messages via an approved provider and templates.

### 6.13 Today, reports and portfolio (FR-REP)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-REP-01 | Today page with setup health | Must | P3 |
| FR-REP-02 | Live Today dashboard: arrivals, departures, in-house | Must | P8 |
| FR-REP-03 | Reports: occupancy, revenue, cancellations, no-shows | Must | P8 |
| FR-REP-04 | CSV export | Must | P8 |
| FR-REP-05 | Portfolio "All hotels" view | Should | P8 |
| FR-REP-06 | Previous-FY maximum room value (specified premises) | Could | P8 |
| FR-REP-07 | Guest register export (local police) | Could | P8 |

- **FR-REP-01 — Today (P3):** `/admin/today` shows only setup health and "Needs attention" until bookings exist; no empty or invented booking numbers.
- **FR-REP-02 — Live Today:** fixed layout; counts with "remaining" next to totals; each count clicks through to a filtered list; pending payments and pending Form-III items.
- **FR-REP-03 — Reports:** date range and hotel filters; definitions from [../modules/reports.md](../modules/reports.md) (revenue basis, occupancy formula, cancellation denominator).
- **FR-REP-04 — CSV:** exports match on-screen totals; export of personal data needs a separate permission and is audited.
- **FR-REP-05 — Portfolio:** read-only, every tile labelled with its hotel; no editing actions.
- **FR-REP-06 — Specified-premises helper:** highest per-night room value in the previous financial year per hotel.
- **FR-REP-07 — Guest register:** printable/CSV register for district police requirements.

### 6.14 Audit (FR-AUDIT)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-AUDIT-01 | Every admin mutation and state transition writes an `AuditLog` | Must | P1 |
| FR-AUDIT-02 | Audit log viewer `/admin/audit` | Must | P1 |
| FR-AUDIT-03 | Per-record history ("who changed this price") | Must | P2 |
| FR-AUDIT-04 | Sensitive data redacted, records immutable | Must | P1 |
| FR-AUDIT-05 | Audit export | Could | P8 |

- **FR-AUDIT-01 — Coverage:** actor, hotel, entity, action, old/new values (diff), reason, request ID, UTC timestamp; written in the same transaction as the change where possible.
- **FR-AUDIT-02 — Viewer:** filter by hotel (scope-limited), entity type, actor, action, date range; super admin sees all hotels; managers see their hotels.
- **FR-AUDIT-03 — Record history:** a "History" link on room types, inventory cells, rates, policies and bookings opens the filtered audit list.
- **FR-AUDIT-04 — Safety:** passwords, tokens and secrets never logged; records can't be edited or deleted through the app.
- **FR-AUDIT-05 — Export:** CSV export with a permission check.

---

## 7. Non-functional requirements

| ID | Area | Requirement | Phase |
|---|---|---|---|
| NFR-CONC | Concurrency | No overbooking under concurrent requests | P4 |
| NFR-MONEY | Money | Integer paise, server-only calculation | P2–P7 |
| NFR-TAX | Tax | GST per night, snapshotted | P4 |
| NFR-SEC | Security and scope | Server authorisation with hotel scope | P1 |
| NFR-AUDIT | Audit | Complete, immutable trail | P1 |
| NFR-A11Y | Accessibility | WCAG 2.2 AA | P1–P6 |
| NFR-PERF | Performance | Response-time targets | P2–P6 |
| NFR-MOBILE | Mobile | Grid and guest web usable on phones | P2, P5 |
| NFR-REL | Reliability | Backups, monitoring, rollback | P6 |
| NFR-PRIV | Data protection | DPDP-ready by ~May 2027 | P4–P8 |
| NFR-L10N | Localisation | Ready for languages and formats | P1+ |

- **NFR-CONC — No overbooking:**
  - **Mechanism:** MongoDB replica-set transactions for every inventory write; conditional updates ("decrement if available ≥ n") on `NightInventory`; partial-range failures roll back fully.
  - **Proof:** an integration test fires N parallel requests for the last room; exactly one succeeds, 100% of runs (MVP exit criterion).
  - **Authority:** search may be slightly stale; holds and bookings always check the authoritative store.
  - **OTA protection:** until a channel manager exists, manual close-outs (FR-INV-04) are the control against OTA double-selling. **Decision needed:** confirm zero intentional overbooking allowance (D-17).
- **NFR-MONEY — Minor units:** all prices, taxes, fees and refunds stored as integer paise with ISO currency `INR`; deterministic rounding; the client displays only; no price accepted from the client except permitted overrides.
- **NFR-TAX — GST:** per-night slab classification and CGST+SGST split on the server; snapshot on `Booking.nights[]`; rule versioned with an effective date so future rate changes don't alter past bookings.
- **NFR-SEC — Security and hotel scope:**
  - **Authorisation:** actor status + permission + hotel scope on every request; no reliance on hidden UI.
  - **Sessions:** secure cookies, login throttling and lockout (built), MFA for privileged production accounts (planned).
  - **Input:** DTO validation with `whitelist` and `forbidNonWhitelisted`; media type and size checks for uploads.
  - **Transport and secrets:** HTTPS only; secrets in environment configuration, never in code or logs.
- **NFR-AUDIT — Audit:** 100% of admin mutations and state transitions audited (M-16); audit retained at least as long as related bookings; viewer scoped by hotel.
- **NFR-A11Y — Accessibility (WCAG 2.2 AA):**
  - **2.2.1 Timing adjustable:** holds warn ≥ 20 s before expiry, extend in one action ≥ 10 times, keep entered data on expiry (FR-HOLD-05/06).
  - **2.5.7 Dragging movements:** every drag action (range select, future room moves) has a click/tap or keyboard alternative.
  - **2.5.8 Target size:** interactive targets ≥ 24×24 CSS px, including grid cells and badge actions.
  - **General:** keyboard operation, visible focus, labels, meaningful errors, contrast ≥ 4.5:1 for text, status never by colour alone.
  - **Review:** automated checks per build plus a manual review per phase (human checkpoint).
- **NFR-PERF — Performance (proposed, D-18):**
  - **Search:** P95 < 500 ms at expected MVP load, excluding external services.
  - **Quote and hold:** P95 < 800 ms.
  - **Grid:** 30 days × 10 room types renders in < 1.5 s on a mid-range Android phone on 4G; bulk save of 30 nights × 1 room type P95 < 1.5 s.
  - **Admin lists:** P95 < 500 ms for 10,000 bookings per hotel with pagination.
- **NFR-MOBILE — Phones:** inventory grid and booking list usable at 360 px wide (FR-INV-09, M-09); guest web mobile first; no horizontal page scroll outside the grid itself.
- **NFR-REL — Reliability:**
  - **Backups:** daily database backups with point-in-time recovery; a restore rehearsed before launch (P6 gate).
  - **Monitoring:** health checks, error-rate and latency alerts, hold-expiry job heartbeat, inventory reconciliation alert.
  - **Deploys:** documented rollback rehearsed before launch; migrations reversible or guarded.
  - **Availability target (proposed):** 99.5% monthly for guest booking and admin APIs.
- **NFR-PRIV — Data protection (DPDP):**
  - **Timeline:** DPDP Rules notified Nov 2025; consent-manager rule about Nov 2026; notice, security, breach and retention/erasure obligations about **13–14 May 2027**.
  - **Minimum data:** the booking MVP collects name, phone, email, optional company GSTIN, nationality only when needed; **no ID scans before check-in exists (P8)**.
  - **Retention and erasure:** every personal-data field has a defined retention period and an erasure path; invoices keep their legal retention exception. **Decision needed:** retention periods (D-23).
  - **Notice and breach:** privacy notice on guest web; breach-response runbook before May 2027.
- **NFR-L10N — Localisation readiness:**
  - **Formats:** INR with Indian digit grouping (₹1,00,000); dates `DD MMM YYYY`; times in the hotel time zone (default `Asia/Kolkata`); event timestamps stored in UTC.
  - **Text:** UI strings kept in one place so Indian languages can be added later; no multi-currency in the MVP.

---

## 8. Business rules summary

- **Source rules:** full rules live in [../PRODUCT.md#12-business-rules](../PRODUCT.md#12-business-rules) and the module specs: [../modules/bookings.md](../modules/bookings.md), [../modules/pricing.md](../modules/pricing.md), [../modules/cancellation-policies.md](../modules/cancellation-policies.md), [../modules/payments.md](../modules/payments.md), [../modules/hotels.md](../modules/hotels.md), [../modules/rbac.md](../modules/rbac.md), [../modules/reports.md](../modules/reports.md). This section restates the rules the PRD depends on.
- **Stay nights:** `[checkIn, checkOut)` in the hotel's local calendar; check-in night occupied, checkout date not.
- **Availability:** a room type is sellable for a stay only if every night is open (not `closed`), has units free after holds and bookings, meets `minStay` on arrival and respects `cutoffDays`.
- **Price per night:** `DailyRate` for that date if set, else `BaseRate`; integer paise.
- **GST (verify with a tax professional):**
  - **Slab:** per night, actual price ≤ ₹7,500 → 5% without input tax credit; > ₹7,500 → 18% with input tax credit (from 22 Sep 2025).
  - **Split:** CGST + SGST, place of supply = hotel.
  - **Where:** calculated per night on the server; snapshot saved on the booking.
  - **GSTIN:** required before invoices (P7), not before holds or bookings.
- **Holds:**
  - **Length:** 10 minutes by default (staff and guest web); 30–60 minutes for payment-link channels (P7); configurable per channel.
  - **Atomicity:** all nights or none, in one transaction, with an idempotency key.
  - **Release:** expired or released holds return units exactly once.
- **Cancellation and no-show:**
  - **Policy snapshot:** the hotel's cancellation and no-show terms are copied onto the booking at confirmation; later policy edits don't affect it.
  - **Fee:** calculated by the server from the snapshot and the property-local cutoff; shown before confirming.
  - **No-show:** only from the check-in date in hotel local time.
  - **Inventory:** released exactly once; repeating the request changes nothing.
  - **Overrides:** need permission, a reason and an audit record.
- **Status separation:** hold, booking, payment and refund statuses are separate state machines (project rule):
  - **Hold:** `ACTIVE → CONVERTED | EXPIRED | RELEASED`.
  - **Booking:** `OPTIONAL → CONFIRMED → CHECKED_IN → CHECKED_OUT → COMPLETED`; also `CANCELLED`, `NO_SHOW`.
  - **Payment:** `NOT_REQUIRED | PENDING | AUTHORIZED | CAPTURED | FAILED | PARTIALLY_REFUNDED | REFUNDED`; MVP pay-at-hotel uses `NOT_REQUIRED` or `PENDING` with method `PAY_AT_HOTEL`.
  - **Refund (P7):** `REQUESTED → PROCESSING → SUCCEEDED | FAILED`; a cancellation never waits for its refund.
- **Publishing:** hard gate blocks publish; the completeness score never does.
- **Hotel scope:** every action belongs to exactly one hotel, checked on the server; "All hotels" is read-only.

---

## 9. Out of scope and deferred

| Item | Status | Earliest phase |
|---|---|---|
| Online payment (payment links, UPI), refunds | Deferred | P7 |
| Invoice PDF and GST invoices | Deferred | P7 |
| SMS / WhatsApp messages | Deferred | P7 |
| Live Today dashboard (arrivals, departures, in-house) | Deferred | P8 |
| Reports, CSV exports, portfolio view | Deferred | P8 |
| Guest profiles; Form-III; ID capture at check-in | Deferred | P8 |
| Booking modification (dates/rooms) | Deferred | P8 or later |
| Physical room assignment, room numbers, housekeeping | Deferred | Later than P8 |
| Drag-and-drop booking moves on a room-level tape chart | Deferred | Later than P8 |
| Channel managers and OTA sync | Deferred | Later |
| Rate plans (non-refundable, early booker), seasonal rules, coupons | Deferred | Later |
| Card pre-authorisation guarantees | Not planned (5–7 day lapse) | — |
| Multi-currency, multiple languages | Deferred | Later |
| Guest accounts, Google/OTP login, reviews | Deferred | Later |
| Hotel CSV import/export | Deferred | Later |
| Microservices, loyalty wallet, dynamic yield pricing, automated tax advice, AI decisions | Out of scope | — |

---

## 10. Dependencies, assumptions, risks and open decisions

### 10.1 Dependencies

- **MongoDB replica set:** required in every environment for transactions (holds, bookings, inventory writes).
- **Existing P0 code:** hotels, room types, `BaseRate`, `NightInventory`, `AuditService`, RBAC — the plan extends rather than replaces them (see [MIGRATION-PLAN.md](./MIGRATION-PLAN.md)).
- **Email provider:** needed for P6 confirmations.
- **Payment gateway contract and KYC:** needed before P7 (Razorpay, Cashfree or PayU).
- **SMS/WhatsApp provider and template approval:** needed for P7.
- **Tax professional review:** needed before P4 quotes go live and before P7 invoices.
- **Front-desk test users:** real Indian front-desk staff for usability tests of the grid (P2) and booking flow (P4).
- **Hosting, backups and monitoring:** in place before the P6 launch gate.

### 10.2 Assumptions

- **Single-property majority:** most early customers run one hotel; multi-hotel users are a minority but important (chains, operators).
- **Room-type pooling:** inventory is a count per room type per night; no physical rooms in the MVP.
- **Pay at hotel is acceptable** for MVP direct bookings; hotels accept no-show risk managed by policy.
- **Hotels keep using OTAs:** Staywise is an additional direct channel; manual close-outs handle cross-channel availability until integrations exist.
- **India only:** INR, GST, Asia/Kolkata default; one currency per deployment.
- **GST rule stable:** the 5%/18% slab stays in force through the MVP (no review pending as of mid-2026, but contested by industry bodies).

### 10.3 Risks (ranked, most serious first)

| Rank | Risk | Impact | Mitigation | Owner phase |
|---|---|---|---|---|
| 1 | Overbooking against OTA sales if date blocking comes late | Walked guests, lost trust | Grid with close-outs in P2, before bookings; zero-overbooking concurrency tests | P2, P4 |
| 2 | Changes applied to the wrong hotel if "All hotels" reaches editing screens | Wrong prices or closures | Hotel in URL, one-hotel edit screens, named confirmations | P1 |
| 3 | GST errors if tax is a fixed field | Under/over-charging, compliance exposure | Per-night slab on server, snapshot, tax professional sign-off | P4 |
| 4 | Abandoned bookings or accessibility failures if holds expire silently | Lost bookings, WCAG failure | Extendable holds, warnings, data kept on expiry | P4, P5 |
| 5 | DPDP rework if ID scans are collected without retention and erasure before ~May 2027 | Legal and rework cost | No ID capture in booking MVP; retention/erasure fields designed now | P4–P8 |
| 6 | Weak evidence on PMS usability; grid and booking flow may not fit Indian front desks | Slow adoption | Test with real front-desk staff before locking P2/P4 UX | P2, P4 |
| 7 | Bulk edits or copy tools overwrite good data (e.g. zero rates) | Revenue loss | Zero/suspicious rate check, explicit field choice, audit history | P1–P3 |
| 8 | Route migration breaks bookmarks and links | Support load | Tested redirects for every old route | P1 |
| 9 | Late payment success after hold expiry (P7) | Paid guest without room | Webhook reconciliation: rebook or refund | P7 |

### 10.4 Open product decisions

| ID | Decision needed | Options / proposal | Needed by |
|---|---|---|---|
| D-01 | **Decision needed:** amenities option list | Proposal in `../ANALYSIS.md` field-type analysis; three-state Yes/No/Not answered | P3 |
| D-02 | **Decision needed:** house rules and child/extra-bed options | Pets, smoking, ID required, local-ID/couples policy, child age bands, extra-bed charge | P3 |
| D-03 | **Decision needed:** bed types and room views | King, Queen, Twin, Double, Single, Bunk / city, garden, pool, sea, mountain | P3 |
| D-04 | **Decision needed:** star rating | Self-declared 1–5; government-classified only; or hidden from guests | P3 |
| D-05 | **Decision needed:** check-in/out defaults | 12:00 / 11:00 or 14:00 / 12:00; editable per hotel | P3 |
| D-06 | **Decision needed:** GST confirmation by a tax professional | Confirm slab, value basis (extra bed, meals, discounts), < ₹1,000 status, SAC 996311 | P4 |
| D-07 | **Decision needed:** guest price display | Tax-inclusive total vs base + "₹X taxes" line | P5 |
| D-08 | **Decision needed:** hold length per channel and extension cap | Staff 10 min, guest web 10 min, payment link 30 or 60 min; max extensions ≥ 10 | P4 |
| D-09 | **Decision needed:** payment gateway | Razorpay, Cashfree, PayU | P7 (contract before P6 ends) |
| D-10 | **Decision needed:** guest-web branding | Staywise marketplace; per-hotel branded pages on Staywise domain; per-hotel custom domains | P5 |
| D-11 | **Decision needed:** approve global switcher and Overview as default tab for published hotels | Approve / amend | P1 |
| D-12 | **Decision needed:** `OPTIONAL` booking status in MVP | P4 (Should) or defer to P7 with payment links | P4 |
| D-13 | **Decision needed:** photo minimum in publish gate | 5 property + 1 per room type as hard gate; or soft score only | P3 |
| D-14 | **Decision needed:** completeness score items and weights | Photo-weighted, Agoda-style; list to confirm | P3 |
| D-15 | **Decision needed:** guest checkout vs guest accounts in MVP | Checkout without account (proposed) + secure lookup | P5 |
| D-16 | **Decision needed:** staff settings screen phase | P1 (proposed) or P6 | P1 |
| D-17 | **Decision needed:** overbooking allowance | Zero (proposed) vs controlled limit per room type | P4 |
| D-18 | **Decision needed:** success-metric and performance targets | Confirm §3.4 and NFR-PERF values | P1 |
| D-19 | **Decision needed:** booking reference format | `SW-` + number; per-hotel prefix; random alphanumeric | P4 |
| D-20 | **Decision needed:** email provider and sender domain | Provider choice; Staywise vs hotel sender name | P6 |
| D-21 | **Decision needed:** guest self-service cancellation in MVP | P6 (Could) or later | P6 |
| D-22 | **Decision needed:** suspicious-rate band | e.g. < 30% or > 300% of base rate needs confirmation | P2 |
| D-23 | **Decision needed:** personal-data retention periods | Per field: bookings, guest contacts, audit, (P8) ID scans | P4 |

---

## 11. Release plan summary

- **Detailed plans:** MVP tasks in [MVP-PLAN.md](./MVP-PLAN.md); phase gates, dependencies and post-MVP tasks in [PHASES.md](./PHASES.md); migration effort in [MIGRATION-PLAN.md](./MIGRATION-PLAN.md).
- **Gate rule:** a phase advances only with working acceptance criteria, operational ownership and known failure recovery (from [../MVP.md#gate-between-phases](../MVP.md#gate-between-phases)); human checkpoints per [README.md](./README.md#human-in-the-loop-convention-used-in-mvp-plan-phases-ux-plan-ui-plan).
- **Old phase mapping:** old Phase 1 = P1–P6; old Phase 2 = P7; old Phases 3–4 = P8 and later.

| Phase | Name | MVP | Requirements | Exit evidence |
|---|---|---|---|---|
| P0 | Current state (built) | ✅ done | FR-HOTEL-01–03 (base), existing room types, base rates, inventory, policy | Built and verified (see `../TASKS.md`) |
| P1 | Admin foundations | ✅ | FR-NAV-01–07, FR-ACCESS-01–03, FR-UI-01–03, FR-HOTEL-04–05, FR-ROOM-01–06, FR-AUDIT-01, 02, 04 | Redirects tested; scope tests; M-12, M-16 |
| P2 | Inventory & rates grid | ✅ | FR-INV-01–10, FR-AUDIT-03 | Usability test on phone (M-05, M-06, M-09) |
| P3 | Hotel content, Overview & tax | ✅ | FR-HOTEL-03 (extended), 06–16, FR-ROOM-07, FR-TAX-01–02, FR-REP-01 | GSTIN tests; M-01, M-02, M-13 baselines |
| P4 | Holds & booking core | ✅ | FR-TAX-03–06, FR-HOLD-01–07, FR-BOOK-01–05, FR-PAY-01–02, FR-ACCESS-04, FR-NAV-08, FR-INV-11 | Last-room concurrency test (M-03); tax recompute (M-11); tax professional sign-off |
| P5 | Guest booking web (MVP) | ✅ | FR-GUEST-01–07 | End-to-end guest booking; M-10, M-14 |
| P6 | Booking management + MVP launch | ✅ | FR-BOOK-06–11, FR-INV-12, FR-GUEST-08–09, FR-PAY-03, FR-NOTIF-01–02, NFR-REL | MVP exit criteria in `../MVP.md`; backup restore and rollback rehearsed |
| P7 | Payments, refunds, invoices | ❌ | FR-PAY-04–07, FR-TAX-07–08, FR-NOTIF-03 | Webhook and refund tests; reconciliation runbook |
| P8 | Operations & insight | ❌ | FR-REP-02–07, FR-GUEST-10–11, FR-BOOK-12, FR-AUDIT-05 | Report definitions validated with real data; DPDP review |
