# Migration plan — current Staywise structure → new plan target

- **Date:** 2026-10-20
- **Status:** proposal. It follows the shared baseline in [README.md](./README.md) exactly (phase IDs P0–P8, entity names, routes, state machines, human-in-the-loop convention).
- **Reader:** lead and planning. The coding model uses [MVP-PLAN.md](./MVP-PLAN.md) for task-level detail; this file says **in what order the existing code changes, what is kept, moved, replaced or deleted, and how much it costs**.
- **Companion docs:** [PRD.md](./PRD.md) · [MVP-PLAN.md](./MVP-PLAN.md) · [PHASES.md](./PHASES.md) · [UX-PLAN.md](./UX-PLAN.md) · [UI-PLAN.md](./UI-PLAN.md) · [DATA-MODEL.md](./DATA-MODEL.md).
- **Basis:** a read of the code on branch `feat-update` (after `e55db15`), file and line counts taken with `wc -l` and import searches with `grep` on 2026-10-20, plus [admin-ux-plan.md](./admin-ux-plan.md), [the evaluation report](./reports/Hotel%20admin%20UX%20plan%20evaluation.md), `../ANALYSIS.md` (hotel module UX review, form field-type analysis, UI theme consistency audit), `../TASKS.md`, `../MVP.md`, `../ARCHITECTURE.md`, `../API.md`, `../DATA_MODEL.md` and `apps/admin-web/docs/*.md`.
- **All effort figures are estimates**, not commitments. Section 7 explains what they assume and what moves them.

---

## 1. Executive summary

- **What changes**
  - **Admin web:** from a set of **data pages** (Hotels, Room types, Base rates, Availability, each with its own hotel picker) to a **hotel-scoped workspace** under `/admin/hotels/:hotelId/…` with a **global hotel switcher**, a **Rooms & rates table** with a side panel, a **room type × date inventory grid**, an **audit log**, an **Overview** with setup health, **Tax & billing**, and later **Bookings**.
  - **API:** from catalog-only modules (`auth`, `hotels`, `inventory`, `pricing`, `audit` write-only) to a booking platform: `DailyRate` and restrictions (P2), hotel content and `taxProfile` (P3), **quotes / holds / bookings** (P4), public search and guest booking endpoints (P5), admin booking management and **notifications** (P6).
  - **New app:** `apps/guest-web` (P5).
  - **Docs:** `../MVP.md` and `../TASKS.md` stop being the plan of record and point at this folder.
- **Why**
  - **Research verdict:** the UX plan is right but needs five fixes. The most important are a date grid (not just a table) and a URL-based hotel switcher. See [the evaluation](./reports/Hotel%20admin%20UX%20plan%20evaluation.md).
  - **Current pain:** one room type is split across four places, the hotel is picked again on every page, the availability calendar shows 14 nights and blocks one night at a time, there is no change history in the UI, the theme drifts (6.5 / 10 in the audit), about 2,300 lines of dead code remain, and there is no booking or guest web at all.
- **Total effort (MVP, P0 prep + P1–P6), estimate:** **138 / 185 / 264 person-days** (low / likely / high).
  - **Admin-only slice (P0–P3):** 67 / 89.5 / 124; **booking slice (P4–P6):** 71 / 95.5 / 140 — the larger and riskier half (§7).
- **Recommended approach: incremental "strangler" migration, no big-bang rewrite.**
  - New hotel-scoped routes are added **next to** the old ones; old routes become **redirects** as soon as their replacement passes verification; old files are deleted **only after the user approves** (AGENTS.md).
  - Every phase ships something usable and leaves `main` releasable.
  - The API stays on `/api/v1`. Every change is **additive** (new endpoints, new optional fields); no existing endpoint changes shape before P6, so the old screens keep working while the new ones are built.
  - Risky work (holds, bookings, guest web, booking list) sits behind **feature flags** until its checkpoint is passed.
- **Timeline options (calendar, estimate; assumes ~17 productive days per person-month)**

| Option | Human effort (likely) | Calendar, likely (range) | Notes |
|---|---|---|---|
| **1 full-stack developer** | 185 person-days | **~11 months** (8–15.5) | Strictly sequential; the long pole is P4 → P5 → P6. |
| **2 developers** (backend-leaning + frontend-leaning) | 185 + ~15% coordination ≈ 213 | **~6–6.5 months** (4.5–9) | Frontend and backend of a phase run in parallel; guest web (P5) overlaps P6 admin screens. |
| **Smaller coding model + 1 human reviewer** | ~118 human days (88–170) | **~7–7.5 months** (5.5–10.5) | Less typing, more review, testing and checkpoint time; see §7.3. |
| **Smaller coding model + 2 humans** (reviewer + tester/designer) | ~118 + 10% | **~4–4.5 months** (3.5–6.5) | Review is the bottleneck, so a second human shortens it most. |

- **Biggest decisions before starting** (all 🧑 human checkpoints, listed in §9): approve the route restructure and redirects, approve deleting 14 dead files, choose the shared-package approach, confirm GST rules with a tax professional, and choose the guest-web stack.

---

## 2. Current structure (as-is)

### 2.1 Size by area (counted 2026-10-20)

| Area | Files | Lines | Notes |
|---|---|---|---|
| `apps/admin-web/src` total | 109 | 12,099 | React + Tailwind v4 + React Router (`BrowserRouter`), no frontend tests |
| — `components/ui` | 31 | 2,356 | 29 exported from `index.ts` |
| — `features/*` | 33 | 4,873 | `auth` 3, `hotels` 21 (incl. `workspace/` 4), `inventory` 2, `rates` 2, `rooms` 5 |
| — `pages/*` | 24 | 3,650 | `auth`, `catalog` (10 incl. `components/`, `views/`), `dashboard`, `error`, `hotels` (11) |
| — `layout`, `routes`, `hooks`, `utils`, `api/`, root | 21 | 1,220 | `api.ts` 143, `AppRoutes.tsx` 107, `route-config.ts` 48 |
| — **dead code** (no route reaches it) | 14 | **~2,338** | ~19% of the admin web; listed in §2.6 |
| `apps/api/src` total | 58 | 4,739 | NestJS 11 + Mongoose; includes 4 spec files (574 lines) and 2 scripts |
| `packages/contracts` | 3 | 85 | enums only; `BookingStatus` and `HotelStatus` **disagree** with the baseline and the API (see §2.4) |

### 2.2 Frontend routes and pages

| Route | Page / component | Permission | What it does today |
|---|---|---|---|
| `/` , `/admin`, `/admin/login` | `Navigate` → `homePath()` | — | First permitted nav item |
| `/admin/dashboard` | `pages/dashboard/DashboardPage.tsx` (263) | `hotels.view` | Counts, recent hotels, four "rainbow" quick-action cards |
| `/admin/hotels` | `pages/hotels/HotelsPage.tsx` (500) + `components/*` (6 live) | `hotels.view` | List/cards, filters, bulk status, real setup progress |
| `/admin/hotels/new` | `HotelCreatePage.tsx` → `features/hotels/HotelCreateForm.tsx` | `hotels.create` | Draft hotel with details + photos |
| `/admin/hotels/:id` | `HotelDetailPage.tsx` (423) | `hotels.view` | Read-only detail; **overlaps the workspace**; row-click target from the list |
| `/admin/hotels/:id/edit?tab=hotel\|rooms\|rates\|availability\|cancellation` | `HotelEditPage.tsx` → `features/hotels/HotelWorkspace.tsx` (442) | `hotels.view` | 5-step setup checklist = tabs; tab kept in `?tab=` |
| `/admin/room-types?hotel=` | `pages/catalog/RoomTypesPage.tsx` + `views/RoomTypesView.tsx` + `components/HotelRoomPicker.tsx` (274) | `room_types.view` | Pick hotel → list room types (amber "draft" pill for active rooms) |
| `/admin/room-types/new?hotel=` | `RoomTypeCreatePage.tsx` → `features/rooms/RoomTypeForm.tsx` | `room_types.create` | Create room type |
| `/admin/room-types/:id/edit` | `RoomTypeEditPage.tsx` → `RoomTypeForm.tsx` | `room_types.view` | Edit room type (leaves the workspace) |
| `/admin/rates` | `pages/catalog/RatesPage.tsx` + `views/BaseRatesView.tsx` | `rates.view` | Pick hotel + room → one base rate |
| `/admin/inventory?hotel=&room=` | `pages/catalog/InventoryPage.tsx` + `views/InventoryCalendarView.tsx` + `components/InventoryAdjustModal.tsx` | `inventory.view` | **Fixed 14-night** calendar, one night at a time |
| `/admin/unauthorized`, `*` | `pages/error/AccessPage.tsx` | — | 403 / 404 |
| (outside router) | `pages/auth/LoginPage.tsx`, boot screen in `App.tsx` | — | Boot screen CSS classes no longer exist (audit A4) |

- **Sidebar** (`routes/route-config.ts`): Dashboard · *Property setup*: Hotels, Room types · *Operations*: Availability, Base rates.
- **Workspace tabs** (inside `/admin/hotels/:id/edit`): Hotel & photos (`HotelDetailsFields`, `HotelMediaGalleryManager`, `PhotoModal`) · Rooms (`HotelRoomsList`, `RoomCreateModal`, `RoomMediaModal`) · Rates (`features/rates/HotelRatesTab.tsx`, 278) · Availability (`features/inventory/HotelAvailabilityTab.tsx`, 175) · Cancellation (`CancellationPolicyFields`). Header: `PublishBlockersInfo`, suspend/archive with `ConfirmDialog`.

### 2.3 Feature folders, shared components, hooks, utils

- **`features/auth`:** `AuthContext`, `Can`, `auth.api.ts`. **Keep.**
- **`features/hotels`:** live — `HotelWorkspace`, `HotelSetupChecklist`, `HotelDetailsFields`, `HotelCreateForm`, `CancellationPolicyFields`, `HotelMediaGalleryManager`, `PhotoModal`, `PublishBlockersInfo`, `HotelRoomsList`, `hotel-options.ts`, `hotel-status.ts`, `hotels.api.ts`; dead — see §2.6.
- **`features/rooms`:** `RoomTypeFields` (shared form), `RoomTypeForm` (page form), `RoomCreateModal`, `RoomMediaModal`, `rooms.api.ts` (`disableRoomType` exists but **no UI calls it**).
- **`features/rates`:** `HotelRatesTab`, `rates.api.ts`. Rate form markup is duplicated in `pages/catalog/views/BaseRatesView.tsx` (audit RA7).
- **`features/inventory`:** `HotelAvailabilityTab`, `inventory.api.ts` (does **not** call the existing server `batch-adjust` endpoint).
- **`components/ui`** (30 components + `index.ts`): `Button`, `Input`, `MoneyInput`, `Select`, `Textarea`, `Checkbox`, `DatePicker`, `Combobox`, `PasswordInput`, `ReasonField`, `Field` (no `htmlFor`), `Modal` (drawer default), `ConfirmDialog` (**live**: used by `HotelWorkspace` and `HotelEditPage`), `DataTable`, `Pagination`, `Status` (no `ACTIVE`/`DISABLED`), `Alert`, `EmptyState`, `PageHeading`, `MetricCard` (30 raw hex), `Tabs`, `Toast`, `Loader`, `LoadingRows`, `Spinner`, `ErrorBoundary`, `NotFound`; unused — `KpiStrip`, `Skeleton`, `ImageUploadDropzone`.
- **`hooks`:** `useApiQuery`, `useServerErrors`, `handleFormError`, `useBusyGuard`, `useDebouncedValue`.
- **`utils`:** `money.ts` (minor ↔ major units, `formatMoney`), `helpers.ts` (`readId`, `resolveImageUrl`), `cn.ts`.
- **`api.ts`:** fetch wrapper with CSRF header, `API_ACCESS_EVENT` on 401, shared types (`Hotel`, `RoomType`, `StaffMe`, …).
- **Dependencies:** `apps/admin-web/package.json` pins **`"latest"`** for React, React Router, Vite, Tailwind and lucide — a migration risk (§8).

### 2.4 API modules, endpoints and data

| Module | Endpoints (all under `/api/v1`) | Permission | Notes |
|---|---|---|---|
| `health` | `GET /health` | — | Replica-set check |
| `auth` | `POST /auth/staff/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/logout-all` | session | Opaque session + CSRF; `me` returns `hotelIds` scope |
| `hotels` (`HotelsController`) | `GET /admin/hotels` (search, status, city, setupStatus, updatedSince, paging), `GET …/cities`, `GET …/metrics`, `POST /admin/hotels`, `PATCH …/bulk-status`, `POST …/media/upload`, `GET/PATCH …/:id`, `GET …/:id/readiness`, `POST …/:id/media`, `POST …/:id/publish`, `POST …/:id/suspend`, `POST …/:id/archive` | `hotels.*` | Optimistic `version`, audited; `metrics` and `media/upload` are not in `../API.md` |
| `hotels` (public) | `GET /hotels/:slug` | — | Published hotel + active room types |
| `hotels` (`RoomTypesController`) | `GET/POST /admin/hotels/:hotelId/room-types`, `GET /admin/room-types/names`, `GET/PATCH /admin/room-types/:id`, `POST /admin/room-types/:id/disable` | `room_types.*` | **No enable, no duplicate** |
| `inventory` | `GET /admin/room-types/:roomTypeId/inventory?from&to`, `POST …/initialize`, `POST …/batch-adjust` (range block/unblock, **unused by UI, undocumented**), `POST …/:stayDate/block`, `POST …/:stayDate/unblock` | `inventory.*` | Transactions + capacity predicate |
| `pricing` | `GET/PUT /admin/room-types/:roomTypeId/base-rate` | `rates.*` | One price per room type; no date prices |
| `audit` | *(no controller)* — `AuditService.record()` only | — | `audit_logs` has hotel/actor/action indexes and a **365-day TTL** |

- **Collections (10):** `users`, `roles`, `permissions`, `staff_memberships`, `staff_sessions`, `hotels`, `room_types`, `night_inventory` (`total`, `blocked`, `held`, `confirmed`, `version`), `base_rates`, `audit_logs`.
- **Permission keys seeded (14):** `hotels.view/create/edit/publish/archive`, `room_types.view/create/edit/archive`, `inventory.view/block/adjust`, `rates.view/edit`. **No** `audit.*`, `bookings.*`, `tax.*`.
- **Contracts drift:** `packages/contracts` has `BookingStatus.PENDING_PAYMENT` / `PAYMENT_REVIEW` (baseline uses `OPTIONAL`) and `HotelStatus.DISABLED` (API uses `SUSPENDED`). Nothing imports these enums yet, so fixing them is cheap now and expensive later.
- **Scripts:** `seed:super-admin`, `ensure:indexes`, `verify:foundation`, `verify:api` (`verify-scenarios.ts`, 378 lines, creates Editor/Manager test roles); root `dev` runs API + admin with `concurrently`; `screenshots` uses Puppeteer.

### 2.5 Docs today

- **Plan of record:** `../MVP.md` (old Phases 0–4), `../TASKS.md` (Sprints 0–4 + module checklist), `../../context.md` (Phases 0–7 — a third scheme).
- **Specs:** `../API.md` (107 lines), `../DATA_MODEL.md` (55; describes `RatePlan/NightlyRate`, `InventoryHold/HoldNight`, `BookingNight` — names the new plan replaces), `../ARCHITECTURE.md`, 17 module specs in `../modules/`, `../guidelines/*`, `../GUIDES.md#…admin-web` navigation guide.
- **Admin UI docs:** `apps/admin-web/docs/components.md`, `ui-decisions.md`.
- **Agent setup:** `.agent/roles/*` (6 roles incl. `docs-keeper`), `.agent/rules/orchestration.md`, `.agent/workflows/*`, `.agent/skills/ui-architect`.

### 2.6 Dead / legacy files (import search, 2026-10-20)

| File | Lines | Evidence | Proposed action |
|---|---|---|---|
| `features/hotels/HotelForm.tsx` | 483 | imported by nothing | delete-after-approval |
| `features/hotels/HotelCreateModal.tsx` | 138 | imported by nothing (replaced by `/admin/hotels/new`) | delete-after-approval |
| `features/hotels/HotelMediaModal.tsx` | 220 | imported by nothing (replaced by `HotelMediaGalleryManager`) | delete-after-approval |
| `features/hotels/PhotoEditModal.tsx` | 127 | imported only by dead `HotelForm` | delete-after-approval |
| `features/hotels/PhotoUploadPopup.tsx` | 292 | imported only by dead `HotelForm` | delete-after-approval |
| `features/hotels/workspace/HotelGeneralSection.tsx` | 172 | imported by nothing | delete-after-approval |
| `features/hotels/workspace/HotelPolicySection.tsx` | 175 | imported by nothing | delete-after-approval |
| `features/hotels/workspace/HotelReadinessWidget.tsx` | 142 | imported by nothing | delete-after-approval |
| `features/hotels/workspace/HotelRoomsSection.tsx` | 124 | imported by nothing | delete-after-approval |
| `pages/hotels/components/HotelDetailsModal.tsx` | 168 | imported by nothing | delete-after-approval |
| `components/ui/ImageUploadDropzone.tsx` | 245 | exported from `index.ts`, used nowhere | delete-after-approval, or keep as the base of a future `FileDropzone` (🧑 decide) |
| `components/ui/KpiStrip.tsx` | 36 | not exported, used nowhere | delete-after-approval |
| `components/ui/Skeleton.tsx` | 15 | exported, used nowhere | delete-after-approval (or keep for grid loading) |
| `src/dashboard.css` | 1 | not imported ("Deprecated" comment) | delete-after-approval |

- **Correction to `../ANALYSIS.md`:** `components/ui/ConfirmDialog.tsx` is **no longer unused** — `HotelWorkspace.tsx:420` and `HotelEditPage.tsx` use it. **Keep it.**
- **Will become legacy during the migration** (replaced, then deleted after approval): everything in `pages/catalog/*` (10 files, 1,505 lines), `HotelDetailPage.tsx`, `HotelEditPage.tsx`, `features/rates/HotelRatesTab.tsx`, `features/inventory/HotelAvailabilityTab.tsx`, `features/rooms/RoomTypeForm.tsx`, `HotelRoomsList.tsx`, `HotelSetupChecklist.tsx` (folds into Overview).

### 2.7 Pain points mapped to the research

| Pain point (code evidence) | Research source | Fixed in |
|---|---|---|
| **Hotel picked again on every page** — `HotelRoomPicker` used by 4 pages; `?hotel=` query state | Evaluation §2 (switcher, hotel in URL) | P1 |
| **One room split across 4 places**; no edit from workspace cards; no disable/enable/duplicate | admin-ux-plan App. A; ANALYSIS UX review R1–R3 | P1 |
| **Separate Rates and Availability pages** plus workspace tabs = two homes for the same edit | ANALYSIS UX review P5; Evaluation §3 | P1 (rates into side panel) → P2 (grid) |
| **14-night calendar, one night at a time**, jargon labels, legend mismatch | ANALYSIS UX review A1–A5; Evaluation §3 (MMT Connect baseline) | P2 |
| **No audit UI** although `audit_logs` is written | Evaluation §3 "build the audit log now" | P1 |
| **No Overview / content score / tax** (no check-in times, amenities UI, GSTIN, map pin) | admin-ux-plan App. B; Evaluation §3–4 | P3 |
| **Theme inconsistencies** — 77 findings, 537 `slate-*` uses in `.tsx`, raw hex in `MetricCard`/`Status`/`HotelsPage`/`Topbar`, amber "draft" pill on active rooms | ANALYSIS UI theme audit | P1 quick wins; tokens in P1–P3 |
| **Legacy dead files** (~2,338 lines) that confuse the coding model | ANALYSIS "Unused / legacy components" | P0 (after approval) |
| **No navigation blocker** (`BrowserRouter`) — sidebar links skip unsaved-change checks | ANALYSIS UX review status update | P1 (data router) |
| **No bookings, holds, quotes, guest web** | MVP objective; Evaluation §4–5 | P4–P6 |
| **Contracts enums out of date** | this inventory | P4 (before first booking code) |

---

## 3. Target structure (to-be)

### 3.1 Admin web folder structure

```
apps/admin-web/src/
├─ routes/
│  ├─ router.tsx               # createBrowserRouter (data router → useBlocker for unsaved edits)
│  ├─ legacy-redirects.tsx     # every old URL → new URL (kept ≥ 2 releases)
│  ├─ route-config.ts          # nav + permission map (extended with :hotelId patterns)
│  └─ PermissionRoute.tsx
├─ layout/
│  ├─ AppLayout.tsx  Sidebar.tsx  Topbar.tsx   # Topbar hosts the HotelSwitcher
│  └─ HotelScopeLayout.tsx     # hotel header (name, status, ⓘ, actions) + tab nav + <Outlet/>
├─ features/
│  ├─ auth/                    # unchanged
│  ├─ hotel-switcher/          # HotelSwitcher, useCurrentHotel (URL first), recent-hotels store, single-hotel mode
│  ├─ hotels/                  # HotelDetailsFields, media (gallery, PhotoModal, categories), PublishBlockersInfo, overview widgets, content score
│  ├─ rooms/                   # RoomsTable, RoomSidePanel (Details · Photos · Price · Availability), RoomTypeFields, room-health.ts
│  ├─ rates/                   # BaseRateFields (one shared form), rates.api
│  ├─ inventory-grid/          # InventoryGrid, GridCell, useGridSelection, BulkEditPanel, views (Today/7/14/30), mode: 'inventory' | 'bookings'
│  ├─ policies/                # CancellationPolicyFields, StayPolicyFields (check-in/out, child, extra bed)
│  ├─ tax/                     # TaxFields, GSTIN validation (from packages/contracts)
│  ├─ audit/                   # AuditTable, HistoryLink, audit.api
│  ├─ today/                   # SetupHealthList (P3), live tiles (P8)
│  └─ bookings/                # NewBookingFlow, HoldIndicator, BookingsTable, BookingDetail, CancelDialog, quotes/holds/bookings api
├─ pages/
│  ├─ today/TodayPage.tsx
│  ├─ hotels/HotelsPage.tsx  HotelCreatePage.tsx  components/*
│  ├─ hotel/                   # one file per tab, all under /admin/hotels/:hotelId/
│  │  ├─ OverviewPage.tsx  DetailsPage.tsx  PhotosPage.tsx  RoomsPage.tsx
│  │  ├─ InventoryPage.tsx  PoliciesPage.tsx  TaxPage.tsx
│  │  └─ BookingsPage.tsx  NewBookingPage.tsx  BookingDetailPage.tsx
│  ├─ bookings/BookingsPage.tsx    # all accessible hotels ("All hotels" allowed)
│  ├─ audit/AuditPage.tsx
│  ├─ settings/StaffPage.tsx       # route reserved; built when staff-users work is scheduled
│  ├─ auth/  error/
├─ components/ui/              # existing primitives + additions below
├─ hooks/                      # + useUnsavedChangesBlocker, useFeatureFlag, useHotelId
└─ utils/                      # + dates.ts (hotel-local dates, ranges)
```

- **Shared `components/ui` additions** (from the UI theme audit "larger work" list and the new screens; exact specs in [UI-PLAN.md](./UI-PLAN.md)):
  - **New:** `SectionHeading`, `Card` (page container), `Badge`, `StatTile`, `QuickActionCard`, `ButtonLink`, `SidePanel` (thin wrapper over `Modal variant="drawer"` that keeps the list visible), `DateRangePicker`, `TimePicker`, `TriStateToggle` (amenities yes / no / not answered), `MultiSelect`, `HealthBadge` (symbol + text, never colour only), `HoldIndicator` (quiet countdown, not announced every second), `KeyValueList`.
  - **Changed:** `Status` (+`ACTIVE`, `DISABLED`, booking/payment statuses as separate badges), `Field` (`htmlFor`/`id`), `Modal` (written drawer-vs-dialog rule, footer slot), `Tabs` (route-link mode for hotel tabs, step mode with status icon), `Button` (`danger-ghost`), `PageHeading` (one weight), `MetricCard` (tokens, no `teal`/`sand`).
  - **Tokens:** semantic `success / warning / info` (+ pale / border) and one neutral family (map `slate-*` to `ink` / `line` tokens) — 🧑 decision recorded in `apps/admin-web/docs/ui-decisions.md`.

### 3.2 Route map (target) with redirects

| Target route | Phase | Replaces / redirects from |
|---|---|---|
| `/admin/today` | P3 (setup health), P8 (live) | `/admin/dashboard` → `/admin/today` |
| `/admin/hotels` | kept | — |
| `/admin/hotels/new` | kept | — |
| `/admin/hotels/:hotelId` | P1 | → `/admin/hotels/:hotelId/overview` (P3); until P3 → `…/details` |
| `/admin/hotels/:hotelId/overview` | P3 | `/admin/hotels/:id` (old detail page) |
| `/admin/hotels/:hotelId/details` | P1 | `/admin/hotels/:id/edit`, `…/edit?tab=hotel` |
| `/admin/hotels/:hotelId/photos` | P1 (split from details) | `…/edit?tab=photos` (used by `HotelsPage.tsx:273`) |
| `/admin/hotels/:hotelId/rooms` | P1 | `…/edit?tab=rooms`, `…/edit?tab=rates`, `/admin/room-types?hotel=:id`, `/admin/room-types/new?hotel=:id` (→ `rooms?new=1`), `/admin/room-types/:id/edit` (→ `rooms?room=:id`, hotel resolved from the room) |
| `/admin/hotels/:hotelId/inventory` | P1 (current calendar, embedded) → P2 (grid) | `…/edit?tab=availability`, `/admin/inventory?hotel=:id&room=:r` (→ `inventory?room=:r`), `/admin/rates?hotel=:id` |
| `/admin/hotels/:hotelId/policies` | P1 | `…/edit?tab=cancellation`, `…/edit?tab=policy` |
| `/admin/hotels/:hotelId/tax` | P3 | — |
| `/admin/hotels/:hotelId/bookings`, `…/bookings/new`, `…/bookings/:bookingId` | P4 (new), P6 (list, detail) | — |
| `/admin/bookings` | P6 | — (portfolio view; "All hotels" allowed) |
| `/admin/audit` (+ per-hotel filter) | P1 | — |
| `/admin/settings/staff` | reserved | — |
| `/admin/reports` | P8 | — |

- **Old URLs without a hotel** (`/admin/room-types`, `/admin/rates`, `/admin/inventory` with no `?hotel=`): redirect to the **last-used hotel's** matching tab; if none, or the user can't access it, show a "Choose a hotel" step that then continues to the tab. Single-hotel users go straight to their hotel.
- **Switcher rules** (baseline): hotel comes from the URL; last-used is only the default; hidden for one-hotel users; searchable with recent hotels; "All hotels" only on `/admin/bookings`, `/admin/today`, `/admin/reports`; switching with unsaved edits asks first. Switching keeps the **same tab** on the new hotel.

### 3.3 API target

| Module | Phase | Adds | Collections |
|---|---|---|---|
| `audit` | P1 | `AuditController`: `GET /admin/audit`, `GET /admin/hotels/:hotelId/audit` (filters, paging, scope, redaction) | `audit_logs` (existing) |
| `hotels` | P1, P3 | room summary (price, free tonight, health), `enable`, `duplicate`; P3: content fields, `taxProfile`, `GET …/:id/overview`, content score | `hotels`, `room_types` |
| `pricing` | P2, P4 | `DailyRate` + one **price resolver** (`DailyRate ?? BaseRate`); P4: **quote engine** (per-night price + per-night GST, CGST/SGST) as `pricing/quotes` sub-module | `daily_rates` (new) |
| `inventory` | P2 | grid read + bulk write (price, open/close, minStay, cutoffDays, block/unblock) reusing `batch-adjust` logic; zero/suspicious-rate check | `night_inventory` (+`closed`, `minStay`, `cutoffDays`) |
| `holds` | P4 | `POST/GET /admin/hotels/:hotelId/holds`, extend, release; expiry reaper; idempotency | `holds`, `idempotency_keys` (new) |
| `bookings` | P4, P6 | create from hold, pay-at-hotel; P6: list/search, detail, transitions (cancel / no-show with fee preview, check-in/out) | `bookings` (embedded `nights[]`) |
| `search` (public) | P5 | `GET /search`, extended `GET /hotels/:slug`, public quote/hold/booking endpoints, booking lookup by reference + access token | — |
| `notifications` | P6 | email adapter, outbox, templates (confirmation, cancellation) | `notifications` (new) |
| `payments`, `invoices` | P7 | Razorpay/Cashfree links + UPI, webhooks, refunds, GST invoices | `payments`, `refunds`, `invoices` |
| `guests`, `reports` | P8 | guest profiles, Form-III, reports + CSV | `guest_profiles` |
| `common/` | P0–P4 | feature-flag config, idempotency interceptor, scheduler for hold expiry | — |

- **Conventions kept:** `/api/v1`, DTO `whitelist` + `forbidNonWhitelisted`, optimistic `version`, Mongo transactions for inventory writes, per-field errors `{ errorCode, message, errors: [{ field, message }] }`.
- **New permission keys** (seeded by extending `seed-super-admin.ts` and the role setup): `audit.view` (P1), `hotels.edit_tax` (P3; or reuse `hotels.edit` — 🧑 decide), `bookings.view`, `bookings.create`, `bookings.manage` (P4/P6). Exact list in [DATA-MODEL.md](./DATA-MODEL.md).

### 3.4 New app `apps/guest-web` (P5)

- **Scope:** search (city / dates / guests) → hotel page → room choice → hold + guest details → confirmation with booking reference; booking lookup.
- **Stack default:** Vite + React + Tailwind (same as admin) unless the SEO decision chooses server rendering — 🧑 checkpoint in step M5.1.
- **Root scripts:** `start:guest`, `build:guest`; `dev` runs api + admin + guest.

### 3.5 Shared package decision — 🧑 HUMAN CHECKPOINT

> **🧑 HUMAN CHECKPOINT — shared package**: choose how admin-web, guest-web and the API share code. "Approved" = one option chosen and recorded in `../ARCHITECTURE.md#20-decision-log`.

| Option | Contents | Pros | Cons |
|---|---|---|---|
| **A. Extend `packages/contracts`** (recommended for P1–P4) | enums aligned with the baseline, DTO/response types, GSTIN validator, money helpers, date helpers | small, framework-free, usable by API and both webs | no shared React components |
| **B. Add `packages/ui`** (decide at P5 start) | Tailwind tokens + shared primitives (`Button`, `Input`, `DatePicker`, `Badge`, …) | one look across admin and guest web | build setup, versioning, the guest web will want a different density and brand feel |
| **C. Copy primitives into guest-web** | — | fastest | duplication returns (the problem the UI audit flagged) |

- **Recommendation:** A now; decide B vs C when P5 starts, based on how many components the guest-web design really shares.

---

## 4. Change map (old → new)

- **Actions:** **keep** (unchanged), **refactor** (same place, changed), **move** (new location, little change), **replace** (new implementation; old one redirects, then is deleted after approval), **delete-after-approval** (dead today).

### 4.1 Routes and pages

| Current | Action | New | Phase | Notes |
|---|---|---|---|---|
| `/admin/dashboard` · `DashboardPage.tsx` | replace | `/admin/today` · `pages/today/TodayPage.tsx` | P1 theme fixes, P3 rebuild | Quick-action cards → `QuickActionCard`; recent hotels table → `DataTable` |
| `/admin/hotels` · `HotelsPage.tsx` + `components/*` | refactor | same | P1 | `PageHeading`, `Button` instead of raw-hex buttons; row click → `…/:id/overview` (P3) or `…/details` |
| `/admin/hotels/new` · `HotelCreatePage.tsx`, `HotelCreateForm.tsx` | keep / refactor | same | P1 | After create, go to `…/:id/details` (was `…/edit`) |
| `/admin/hotels/:id` · `HotelDetailPage.tsx` | replace | `…/:hotelId/overview` | P3 | Until P3, redirect to `…/details` (🧑 confirm) |
| `/admin/hotels/:id/edit` · `HotelEditPage.tsx` | replace | `HotelScopeLayout` + per-tab pages | P1 | Loader and archived banner move into the layout |
| `/admin/room-types` · `RoomTypesPage.tsx`, `views/RoomTypesView.tsx` | replace | `…/:hotelId/rooms` · `RoomsPage.tsx` + `RoomsTable` | P1 | Redirect keeps `?hotel=` |
| `/admin/room-types/new` · `RoomTypeCreatePage.tsx` | replace | `rooms?new=1` (side panel) | P1 | |
| `/admin/room-types/:id/edit` · `RoomTypeEditPage.tsx` | replace | `rooms?room=:id` (side panel) | P1 | Redirect resolves the hotel from the room |
| `/admin/rates` · `RatesPage.tsx`, `views/BaseRatesView.tsx` | replace | side panel "Price" (P1) → grid (P2) | P1/P2 | `BaseRateFields` extracted first |
| `/admin/inventory` · `InventoryPage.tsx`, `views/InventoryCalendarView.tsx`, `components/InventoryAdjustModal.tsx` | replace | `…/:hotelId/inventory` · `features/inventory-grid` | P1 (embed) / P2 (grid) | |
| `pages/catalog/components/HotelRoomPicker.tsx` | replace | `features/hotel-switcher` + room filter in grid | P1/P2 | |
| `pages/auth/LoginPage.tsx` | refactor | same | P1 | Brand tokens instead of raw emerald (audit) |
| `pages/error/AccessPage.tsx`, `components/ui/NotFound.tsx` | refactor | same | P1 | `ButtonLink` |
| — | new | `/admin/audit` · `AuditPage.tsx` | P1 | |
| — | new | `…/:hotelId/tax`, `…/policies`, `…/photos`, `…/overview` | P1/P3 | |
| — | new | `/admin/bookings`, `…/:hotelId/bookings[/new\|/:bookingId]` | P4/P6 | Behind `bookings` flag until P6 sign-off |

### 4.2 Features and components

| Current | Action | New | Phase | Notes |
|---|---|---|---|---|
| `features/hotels/HotelWorkspace.tsx` (442) | replace (split) | `HotelScopeLayout` + `pages/hotel/*` | P1 | Unsaved-edit logic → `useUnsavedChangesBlocker`; publish/suspend/archive → layout header |
| `HotelSetupChecklist.tsx` | move / refactor | setup banner on Overview (drafts), tab status icons | P1/P3 | Still fed by `GET …/readiness` |
| `HotelDetailsFields.tsx`, `hotel-options.ts`, `hotel-status.ts` | keep / refactor | `features/hotels` | P1/P3 | Split into Details vs Contact & location sections; map pin, star rating (P3) |
| `HotelCreateForm.tsx` | keep | same | — | |
| `CancellationPolicyFields.tsx` | move | `features/policies` | P1 | + `StayPolicyFields` (P3) |
| `HotelMediaGalleryManager.tsx`, `PhotoModal.tsx` | refactor | `features/hotels/media` | P1/P3 | Separate save (Photos tab); categories + "to be categorised" inbox (P3) |
| `PublishBlockersInfo.tsx` | keep | layout header | P1 | Links each problem to its tab URL |
| `HotelRoomsList.tsx` | replace | `features/rooms/RoomsTable` | P1 | |
| `features/rooms/RoomTypeFields.tsx` | keep | side panel "Details" | P1 | |
| `RoomTypeForm.tsx` | replace | `RoomSidePanel` | P1 | |
| `RoomCreateModal.tsx`, `RoomMediaModal.tsx` | refactor | side panel tabs | P1 | |
| `rooms.api.ts` | refactor | + `enableRoomType`, `duplicateRoomType`, summary | P1 | `disableRoomType` finally gets a button |
| `features/rates/HotelRatesTab.tsx` (278) | replace | `BaseRateFields` in side panel; grid | P1/P2 | |
| `features/inventory/HotelAvailabilityTab.tsx` | replace | grid toolbar "Open dates…" + side panel "Availability" | P1/P2 | Keeps the idempotent `initialize` call |
| `inventory.api.ts` | refactor | `inventory-grid.api.ts` (grid read, bulk write) | P2 | |
| `features/auth/*` | keep | — | — | `Can` used for new permission keys |
| Dead files in §2.6 (14) | delete-after-approval | — | P0 | 🧑 |
| `components/ui/ConfirmDialog.tsx` | keep | — | — | Live; also used for switch-hotel and discard confirmations |
| `components/ui/Status.tsx`, `Field.tsx`, `Modal.tsx`, `Tabs.tsx`, `Button.tsx`, `PageHeading.tsx`, `MetricCard.tsx` | refactor | — | P1 | See §3.1 |
| Other `components/ui/*` (Input, MoneyInput, Select, Textarea, Checkbox, DatePicker, Combobox, PasswordInput, ReasonField, DataTable, Pagination, Alert, EmptyState, Toast, Loader, LoadingRows, Spinner, ErrorBoundary) | keep | — | — | Token clean-up only |
| `layout/Topbar.tsx` | refactor | hosts `HotelSwitcher`; raw hex → tokens; real notification dot | P1 | |
| `layout/Sidebar.tsx`, `routes/route-config.ts` | refactor | Today · Hotels · Bookings (flag) · Audit · Settings | P1 | Room types / Availability / Base rates leave the sidebar |
| `routes/AppRoutes.tsx` (`BrowserRouter`) | replace | `routes/router.tsx` (`createBrowserRouter`) + `legacy-redirects.tsx` | P1 | Needed for `useBlocker` |
| `hooks/*`, `utils/*`, `api.ts`, `api/errors.ts` | keep / refactor | + new hooks; types gradually move to `packages/contracts` | P1–P4 | |

### 4.3 API modules, data and scripts

| Current | Action | New | Phase | Notes |
|---|---|---|---|---|
| `modules/auth`, `modules/health` | keep | — | — | `auth/me` unchanged (switcher reads `hotelIds`) |
| `modules/audit` (service only) | refactor | + controller, query service, permission `audit.view` | P1 | Ensure price/inventory audits carry before → after values |
| `modules/hotels` (hotel + room types) | refactor | + room summary, enable, duplicate (P1); content, `taxProfile`, overview, content score (P3) | P1/P3 | All additive |
| `modules/inventory` | refactor | + grid read, bulk write, restrictions | P2 | Existing single-date block/unblock endpoints kept for one release, then 🧑 deprecate |
| `modules/pricing` | refactor | + `DailyRate`, price resolver (P2), quote engine (P4) | P2/P4 | `BaseRate` stays the default price |
| — | new | `modules/holds`, `modules/bookings` | P4 | |
| — | new | `modules/search` (public) | P5 | |
| — | new | `modules/notifications` | P6 | |
| `packages/contracts` | refactor | enums aligned to baseline; shared types; GSTIN validator | P3/P4 | 🧑 shared-package checkpoint |
| `scripts/verify-scenarios.ts` | refactor | + scenarios per phase (switcher scope, grid bulk, holds race) | every phase | |
| — | new | `scripts/migrations/*.ts` (idempotent, `--dry-run`) | P2/P3 | See §5 data steps |
| `seed-super-admin.ts` | refactor | new permission keys | P1/P4 | Existing roles (Manager, Editor) need keys added — 🧑 |

---

## 5. Migration steps

- **How to read a step:** **Do** · **Files** · **Data migration** · **Compatibility** · **Flag** · **Verify** · **Rollback** · 🧑 when needed.
- **Verification commands** (baseline): `npx tsc --noEmit -p apps/api/tsconfig.json`, `cd apps/admin-web && npx tsc -b`, `npm --workspace=apps/api run test`, `npm run verify:api`. Never run `nest build` while `npm run dev` may be running.
- **Data details** for every schema change live in [DATA-MODEL.md](./DATA-MODEL.md) (entities, indexes, migrations).
- **Feature flags:** `VITE_FEATURE_<NAME>` on the web (read by `useFeatureFlag`), `FEATURE_<NAME>` in the API config (`env.schema.ts`). Flags: `INVENTORY_GRID`, `HOLDS`, `BOOKINGS`, `GUEST_WEB_PUBLIC`, `EMAIL`. A flag is removed one release after its phase is signed off.

### P0 — Prepare (before any P1 code)

- **M0.1 · Baseline snapshot**
  - **Do:** record current routes and take screenshots (`npm run screenshots`) as the "before" set; list every internal link to old URLs (`grep "navigate(\|to=" -r apps/admin-web/src`).
  - **Files:** none changed.
  - **Verify / rollback:** n/a.
  > **🧑 HUMAN CHECKPOINT — release baseline**: the user decides whether to tag or branch the current state (git actions need permission). Approved = a named baseline exists to roll back to.
- **M0.2 · Pin frontend dependencies**
  - **Do:** replace `"latest"` in `apps/admin-web/package.json` with the currently installed exact versions (read from `package-lock.json`).
  - **Verify:** `npx tsc -b`; dev server starts; screenshots match M0.1.
  - **Rollback:** revert `package.json`.
- **M0.3 · Frontend test harness**
  - **Do:** add Vitest + React Testing Library to admin-web; write smoke tests that render every current route with a mocked `StaffMe` (these later become redirect tests).
  - **Files:** `apps/admin-web/package.json`, `vite.config.ts`, `src/**/*.test.tsx`.
  - **Verify:** tests pass in CI and locally.
- **M0.4 · Test data and users**
  - **Do:** extend seeding so every environment has: a super admin; a **one-hotel manager**; a **three-hotel editor**; hotels in DRAFT / PUBLISHED / SUSPENDED / ARCHIVED; room types with and without prices and open dates; one hotel crossing the ₹7,500 GST slab on some nights (for P4).
  - **Files:** `apps/api/src/scripts/seed-demo.ts` (new), `verify-scenarios.ts`.
  - **Data migration:** no (test data only, never against production).
- **M0.5 · Feature-flag plumbing**
  - **Do:** add `useFeatureFlag` and the API config flags listed above (all off).
  - **Files:** `hooks/useFeatureFlag.ts`, `common/config/env.schema.ts`, `configuration.ts`, `.env.example`.
- **M0.6 · Remove dead code**
  - **Do:** delete the 14 files in §2.6 and the `index.ts` exports for `ImageUploadDropzone` and `Skeleton`.
  - **Verify:** both `tsc` commands; smoke tests; `grep` shows no references.
  - **Rollback:** restore from the M0.1 baseline.
  > **🧑 HUMAN CHECKPOINT — file deletion**: the user approves the exact list in §2.6 (AGENTS.md: deletions always need confirmation), including the keep-or-delete choice for `ImageUploadDropzone` and `Skeleton`. Approved = written "yes, delete these" for a named list.

- **M0.7 · Soft-delete foundation (decided 2026-10-20)**
  - **Do:**
    - add `isDeleted` (default `false`), `deletedAt`, `deletedBy`, `deleteReason` to every schema;
    - add the shared `common/database/soft-delete.plugin.ts` (default `{ isDeleted: { $ne: true } }` filter on reads, `withDeleted()` escape hatch);
    - convert unique indexes to partial (`isDeleted: false`);
    - change any existing delete paths to soft delete (`DailyRate` clear);
    - add super-admin restore endpoints where a delete exists.
  - **Data migration:** yes. Backfill `isDeleted: false, deletedAt: null, deletedBy: null` on all existing documents, then rebuild the unique indexes (see [DATA-MODEL.md §1.6](./DATA-MODEL.md#soft-delete) and §7).
  - **Never deletable:** `Booking`, `Payment`, `PaymentEvent`, `Refund`, `Invoice`, `AuditLog` (field present, always `false`, no delete endpoint).
  - **Verify:** existing tests pass; a new test shows a soft-deleted hotel is hidden from list/search/detail and restorable; slug can be reused after delete.
  - **Rollback:** the fields are additive. Drop the partial indexes and restore the old unique indexes from the M0.1 snapshot.
  - **Effort:** +3–5 person-days (backend 2–3, data migration 0.5–1, tests 0.5–1) on top of P0.
  > **🧑 HUMAN CHECKPOINT — soft delete**: confirm the field name (`isDeleted` vs `is_deleted`), the never-deletable list, the `StaffSession`/`AuditLog` TTL exceptions and the DPDP anonymisation rule (DATA-MODEL §1.6), and review the backfill + index rebuild on a copy of the data first. Approved = written "yes" to each point and a successful dry run.

### P1 — Admin foundations

- **M1.1 · Move to the data router**
  - **Do:** replace `<Routes>` in `AppRoutes.tsx` with `createBrowserRouter` in `routes/router.tsx`, same routes and same `PermissionRoute`; add `useUnsavedChangesBlocker` (wraps `useBlocker`) and use it in the workspace instead of the tab-only guard.
  - **Files:** `routes/*`, `App.tsx`, `main.tsx`, `features/hotels/HotelWorkspace.tsx`.
  - **Compatibility:** no URL changes.
  - **Verify:** smoke tests; sidebar links now warn about unsaved edits (closes the ANALYSIS limitation).
  - **Rollback:** revert the router files (single commit).
- **M1.2 · Hotel-scoped route skeleton**
  - **Do:** add `/admin/hotels/:hotelId/*` with `HotelScopeLayout` and child routes `details`, `photos`, `rooms`, `inventory`, `policies`; each child initially **renders the existing workspace panel** for that tab (no behaviour change). Extend `routePermissions` to match `:hotelId` patterns. The layout checks the hotel is in `staff.hotelIds` (or super admin) and shows Access denied otherwise; the API still enforces scope.
  - **Files:** `layout/HotelScopeLayout.tsx`, `pages/hotel/*.tsx`, `routes/route-config.ts`, `hooks/useHotelId.ts`.
  - **Compatibility:** old `/edit?tab=` still works in parallel.
  - **Verify:** every tab reachable by URL; deep links open the right tab; reload keeps the tab; one-hotel and three-hotel users see only their hotels.
  > **🧑 HUMAN CHECKPOINT — route restructure**: approve the target route list (§3.2), the tab names and order, and what `/admin/hotels/:id` shows before P3. Approved = signed-off route table.
- **M1.3 · Legacy redirects**
  - **Do:** implement every redirect in §3.2 in `legacy-redirects.tsx`, keeping query values (`room`, `new`); "no hotel" cases use last-used hotel or a chooser. Update internal links (`HotelsPage`, `HotelCardGrid`, `DashboardPage`, `HotelAvailabilityTab`, `HotelDetailPage`, create flow) to new URLs.
  - **Compatibility:** bookmarks keep working; redirects stay **at least two releases** after P2.
  - **Verify:** a table-driven test per old URL → expected new URL, for super admin, one-hotel and multi-hotel users, including a hotel the user can't access (→ Access denied, never another hotel's data).
  - **Rollback:** remove redirect routes; old pages still exist.
  > **🧑 HUMAN CHECKPOINT — redirects**: the human clicks through the redirect table in a browser with the three test users. Approved = every row lands on the right hotel and tab.
- **M1.4 · Global hotel switcher**
  - **Do:** `features/hotel-switcher` in the Topbar: searchable (`Combobox`), recent hotels (localStorage, try/catch), hidden for one-hotel users (static name), keeps the current tab when switching, asks before discarding unsaved edits; "All hotels" option shown only on the top-level pages listed in the baseline. Data from `GET /admin/hotels?limit=…` (scoped already); add a lightweight `fields=` projection only if list size requires it.
  - **Files:** `features/hotel-switcher/*`, `layout/Topbar.tsx`.
  - **Verify:** URL is the source of truth (two browser tabs on two hotels both work); editing pages never show "All hotels".
  > **🧑 HUMAN CHECKPOINT — permissions**: review that the switcher lists only accessible hotels and that a pasted URL for another hotel is refused by the API (403) as well as the UI. Approved = negative tests pass for the Editor and Manager test roles.
- **M1.5 · Navigation restructure**
  - **Do:** sidebar = Today (still the old dashboard at `/admin/today`, redirect from `/admin/dashboard`) · Hotels · Bookings (hidden, flag) · Audit · Settings (hidden). Remove Room types / Availability / Base rates items; `homePath()` updated.
  - **Files:** `route-config.ts`, `Sidebar.tsx`.
- **M1.6 · Room APIs: summary, enable, duplicate**
  - **Do:** `GET /admin/hotels/:hotelId/room-types?include=summary` adds `price` (base rate, later resolver), `freeTonight`, `health` (`BOOKABLE`, `MISSING_PRICE`, `NO_OPEN_DATES`, `DISABLED`); `POST /admin/room-types/:id/enable`; `POST /admin/room-types/:id/duplicate` with an explicit field list (no inventory or rates copied unless asked). All audited, versioned.
  - **Files:** `modules/hotels/room-type.service.ts`, `room-types.controller.ts`, `dto/room-type.dto.ts`, specs.
  - **Data migration:** no.
  - **Compatibility:** additive; existing list response unchanged without `include`.
  - **Verify:** unit + integration tests; `verify:api` scenario.
- **M1.7 · Rooms & rates table and side panel**
  - **Do:** `pages/hotel/RoomsPage.tsx` with `RoomsTable` (photo, name, code, guests, rooms, ₹/night, free tonight, `HealthBadge`, row actions Edit · Photos · Price · Open dates · Disable/Enable · Duplicate) and `RoomSidePanel` tabs Details (`RoomTypeFields`) · Photos (from `RoomMediaModal`) · Price (new shared `BaseRateFields`, extracted from `BaseRatesView` + `HotelRatesTab`) · Availability (from `HotelAvailabilityTab`). Room-count change shows its impact on opened future nights before saving.
  - **Files:** `features/rooms/*`, `features/rates/BaseRateFields.tsx`, `pages/hotel/RoomsPage.tsx`.
  - **Compatibility:** old Room types / Rates pages now redirect (M1.3); files stay until M1.10.
  - **Verify:** create / edit / disable / enable / duplicate / set price / open dates all from one screen; health badges match `GET …/readiness`.
  > **🧑 HUMAN CHECKPOINT — product copy**: approve health badge names, the duplicate field list and the disable warning text. Approved = copy table signed off.
- **M1.8 · Audit log viewer**
  - **Do:** API `GET /admin/audit` and `GET /admin/hotels/:hotelId/audit` (filters: actor, action, resource, date range; paging; scope by `hotelIds`; metadata redaction kept); make sure base-rate, daily-rate, inventory and room-count changes record before → after values. FE `pages/audit/AuditPage.tsx` + `HistoryLink` on rooms and policies ("who changed this price").
  - **Files:** `modules/audit/audit.controller.ts`, `audit.query.service.ts`, `features/audit/*`, `seed-super-admin.ts` (`audit.view`).
  - **Data migration:** no (existing documents are shown as they are; older ones may lack before/after).
  > **🧑 HUMAN CHECKPOINT — audit access and retention**: decide who gets `audit.view`, whether 365-day retention (current TTL index) is enough, and which metadata fields must stay redacted. Approved = decision logged in `../ARCHITECTURE.md#20-decision-log`.
- **M1.9 · Theme quick wins and shared-component fixes**
  - **Do:** the eight quick wins of the UI audit fix plan (`../ANALYSIS.md#ui-theme-consistency-audit`), `Status` `ACTIVE`/`DISABLED`, `Field` `htmlFor`, modal convention, `PageHeading` everywhere, raw hex → tokens in `HotelsPage`, `Topbar`, `Sidebar`; add `SectionHeading`, `Card`, `Badge`, `ButtonLink`.
  - **Verify:** audit `grep` counts drop (raw hex in live files → 0 outside tokens); screenshots compared with M0.1.
  > **🧑 HUMAN CHECKPOINT — visual sign-off and tokens**: approve the token decision (slate → `ink`/`line`, semantic colours) and the before/after screenshots. Approved = recorded in `apps/admin-web/docs/ui-decisions.md`.
- **M1.10 · Retire replaced P1 files**
  - **Do:** after one release with redirects, delete `RoomTypesPage`, `RoomTypeCreatePage`, `RoomTypeEditPage`, `views/RoomTypesView`, `RatesPage`, `views/BaseRatesView`, `RoomTypeForm`, `HotelRoomsList`, `HotelEditPage`, `HotelWorkspace` (if fully split) and `HotelRatesTab`.
  > **🧑 HUMAN CHECKPOINT — file deletion**: approve the exact list. Approved = written confirmation.

### P2 — Inventory & rates grid

- **M2.1 · Data model: `DailyRate` and restrictions**
  - **Do:** new `DailyRate` (`hotelId`, `roomTypeId`, `stayDate`, `amountMinor`, `currency`, `version`, unique `(roomTypeId, stayDate)`); `NightInventory` gains `closed` (default `false`), `minStay` (default 1), `cutoffDays` (default 0).
  - **Files:** `modules/pricing/schemas/daily-rate.schema.ts`, `modules/inventory/schemas/night-inventory.schema.ts`, `scripts/ensure-indexes.ts`.
  - **Data migration:** **yes, light** — defaults are applied on read, so no backfill is required; an optional idempotent script `scripts/migrations/2026xx-night-inventory-restrictions.ts --dry-run` writes explicit defaults. See [DATA-MODEL.md](./DATA-MODEL.md).
  - **Compatibility:** old documents valid; `BaseRate` stays the fallback price.
  - **Rollback:** fields are optional; drop `daily_rates` if unused.
  > **🧑 HUMAN CHECKPOINT — data migration**: review the script on a copy of production data (counts before / after, dry-run output). Approved = dry-run diff accepted.
- **M2.2 · Price resolver**
  - **Do:** one function in `pricing` (`priceForNight(roomTypeId, date) = DailyRate ?? BaseRate`) used by the room summary, the grid and later the quote engine.
  > **🧑 HUMAN CHECKPOINT — publish rule**: decide whether a room with only daily rates and no base rate counts as "priced" for publishing. Approved = rule written in [PRD.md](./PRD.md) and `modules/pricing.md`.
- **M2.3 · Grid API**
  - **Do:** `GET /admin/hotels/:hotelId/inventory-grid?from&to&roomTypeIds` (per room type × night: total, blocked, held, confirmed, free, price + source, closed, minStay, cutoffDays); `POST /admin/hotels/:hotelId/inventory-grid/bulk` (room types, date range, weekdays, operations: set price, open/close, minStay, cutoffDays, block/unblock quantity, open missing nights) with `dryRun` preview, one transaction per room type, capacity predicate kept, versions checked, audited. Zero price is refused unless confirmed; prices far from the base rate return a warning.
  - **Files:** `modules/inventory/*` (reuse `batchAdjust`), `modules/pricing/*`, DTOs, specs.
  - **Verify:** integration tests on the replica set: concurrent bulk edits on overlapping ranges never break `held + confirmed + blocked ≤ total`; partial failure rolls back the room type.
  > **🧑 HUMAN CHECKPOINT — concurrency and transactions**: a human reviews the transaction boundaries and the race tests. Approved = review notes + passing race tests.
- **M2.4 · Grid UI**
  - **Do:** `features/inventory-grid` (room types down, nights across; Today / 7 / 14 / 30 views; mouse, keyboard and touch range selection; `BulkEditPanel`; mobile stacked layout); `pages/hotel/InventoryPage.tsx` replaces the embedded calendar. Grid cell click on an empty night is wired later for New booking (P4).
  - **Flag:** `INVENTORY_GRID` (old embedded calendar stays as fallback while off).
  - **Verify:** keyboard-only bulk edit; screen-reader labels on cells (text, not colour only); 30-day view with 10 room types renders fast enough on a mid-range phone.
  > **🧑 HUMAN CHECKPOINT — design and accessibility**: usability check with at least one real front-desk user and a keyboard/screen-reader pass. Approved = issues triaged, blockers fixed.
- **M2.5 · Switch over and retire**
  - **Do:** flag on by default; `/admin/rates` and `/admin/inventory` redirects now land on the grid; side-panel "Availability" links to the grid with the room preselected; delete `InventoryPage` (catalog), `InventoryCalendarView`, `InventoryAdjustModal`, `HotelRoomPicker`, `HotelAvailabilityTab` after approval; mark the single-date block/unblock endpoints as deprecated in `../API.md` (kept working).
  > **🧑 HUMAN CHECKPOINT — file deletion**: approve the list. Approved = written confirmation.

### P3 — Hotel content, Overview & tax

- **M3.1 · Hotel content fields**
  - **Do:** add `checkInTime`, `checkOutTime`, `childPolicy`, `extraBedPolicy`, `starRating`, amenities as yes / no / not answered, `media[].category`; expose the existing `coordinates` as a map-pin input.
  - **Data migration:** **yes** — `amenities: string[]` → tri-state map (each existing code = YES); every `media` item without a category → `UNCATEGORISED`. Idempotent script with `--dry-run`, run per environment. See [DATA-MODEL.md](./DATA-MODEL.md).
  - **Compatibility:** API accepts the old `amenities` array for one release and converts it (`GET` returns the new shape plus a deprecated array if needed — 🧑 decide).
  > **🧑 HUMAN CHECKPOINT — option lists and data backfill**: approve amenity, star rating, child/extra-bed and photo-category lists (proposals in `../ANALYSIS.md#form-field-type-analysis`) and the backfill dry-run. Approved = lists in [PRD.md](./PRD.md), dry-run accepted.
- **M3.2 · Tax profile (GSTIN)**
  - **Do:** `Hotel.taxProfile` (`gstin`, `legalName`, `stateCode`, `specifiedPremises`); GSTIN validation (format, state code matches address state, mod-36 check digit) in `packages/contracts` used by API and web; `PATCH /admin/hotels/:id/tax` (versioned, audited). Not required to publish or hold; required later for invoices (P7).
  - **Data migration:** no (new optional field).
  > **🧑 HUMAN CHECKPOINT — tax rules**: a tax professional confirms GSTIN rules and "specified premises" meaning; human reviews validator tests with real and invalid GSTINs. Approved = written confirmation.
- **M3.3 · Overview API**
  - **Do:** `GET /admin/hotels/:id/overview`: status, "needs attention" ranked High / Medium / Low (from readiness + grid: missing price, no open dates, closed nights soon, zero rates), content-completeness score (weighted towards photos), last updated by / when (from audit).
  > **🧑 HUMAN CHECKPOINT — score weights**: approve completeness weights and the attention list order. Approved = table in [PRD.md](./PRD.md).
- **M3.4 · Split the workspace into tabs**
  - **Do:** Overview (setup banner with the 5 steps for drafts, health, guest preview card), Details (live-hotel slug warning, time-zone lock with reason), Photos (own save, categories, inbox), Policies (cancellation + stay policies), Tax. `/admin/hotels/:id` → `overview`. `HotelDetailPage` retired.
  - **Verify:** each section saves on its own; unsaved-edit blocker per tab; readiness and publish unchanged.
- **M3.5 · Today (setup health) and dashboard retirement**
  - **Do:** `/admin/today` shows setup health across accessible hotels ("All hotels" allowed, each row names its hotel) with links straight to the fix; rebuild with `DataTable`, `QuickActionCard`; remove `DashboardPage` and `HotelDetailPage` after approval.
  > **🧑 HUMAN CHECKPOINT — file deletion and visual sign-off**: approve deleting `DashboardPage`/`HotelDetailPage` and the new Today and Overview screens. Approved = written confirmation + screenshots accepted.

### P4 — Holds & booking core

- **M4.1 · Align contracts**
  - **Do:** `packages/contracts`: `BookingStatus` = `OPTIONAL, CONFIRMED, CHECKED_IN, CHECKED_OUT, COMPLETED, CANCELLED, NO_SHOW`; `HotelStatus` = `DRAFT, PUBLISHED, SUSPENDED, ARCHIVED`; add `RefundStatus`, payment method `PAY_AT_HOTEL`; shared quote/hold/booking types.
  - **Compatibility:** nothing imports the old enums today (checked), so no consumer breaks.
  > **🧑 HUMAN CHECKPOINT — state machines**: confirm the four separate state machines and allowed transitions match the baseline. Approved = transition tables in [DATA-MODEL.md](./DATA-MODEL.md) signed off.
- **M4.2 · Quote engine**
  - **Do:** `pricing/quotes`: per night `priceForNight` → GST slab (≤ ₹7,500 → 5%; > ₹7,500 → 18%) → CGST/SGST split → integer paise with one documented rounding rule; returns lines + totals + policy summary + expiry. `POST /admin/hotels/:hotelId/quotes`.
  - **Verify:** table-driven tests incl. a stay that crosses the slab and exactly ₹7,500.00.
  > **🧑 HUMAN CHECKPOINT — tax and money**: tax professional confirms slabs, rounding and per-night basis; human reviews the test table. Approved = written confirmation.
- **M4.3 · Holds**
  - **Do:** `modules/holds` + `holds` collection (`ACTIVE → CONVERTED | EXPIRED | RELEASED`), multi-night claim in one transaction with the capacity predicate plus `closed`, `minStay`, `cutoffDays`; TTL per channel (staff and guest 10 min, configurable); extend (bounded, ≥ 10 times per WCAG); release; expiry reaper (interval job) **and** lazy reap on every claim; idempotency keys (`idempotency_keys`, unique per key + route).
  - **Data migration:** no (new collections; `night_inventory.held` already exists).
  - **Flag:** `HOLDS`.
  - **Verify:** TB S2-1 and S2-5: concurrent last-room claims → exactly one hold; partial-range failure rolls back all nights; expired holds release exactly once.
  > **🧑 HUMAN CHECKPOINT — concurrency**: human reviews transactions, retry policy and race tests; runs the race test against a replica set. Approved = review notes + passing tests.
- **M4.4 · Bookings (staff, pay-at-hotel)**
  - **Do:** `modules/bookings` + `bookings` collection: public reference, guest snapshot (optional company GSTIN), hotel / room type, `nights[]` with price and tax snapshot, policy snapshot, status (`OPTIONAL` with `releaseAt` or `CONFIRMED`), payment status `NOT_REQUIRED`/`PENDING` with method `PAY_AT_HOTEL`; converting a hold moves `held → confirmed` in one transaction; permissions `bookings.view`, `bookings.create`, `bookings.manage`.
  - **Flag:** `BOOKINGS`.
  > **🧑 HUMAN CHECKPOINT — permissions**: decide which existing roles (Super Administrator, Manager, Editor) get which booking keys; negative tests for out-of-scope hotels. Approved = role matrix signed off.
- **M4.5 · Staff New booking page**
  - **Do:** `/admin/hotels/:hotelId/bookings/new`: 1 Stay → 2 Room (live availability, hold starts here, quiet `HoldIndicator`) → 3 Guest & pay (server total with per-night GST, cancellation terms) → Confirm. If the hold expires, keep the form and ask to re-check. Start from a "+" in the top bar and from an empty grid cell.
  > **🧑 HUMAN CHECKPOINT — accessibility and copy**: timing safeguards (warning ≥ 20 s before expiry, extend) and confirmation copy reviewed. Approved = checklist passed.

### P5 — Guest booking web (MVP)

- **M5.1 · Guest-web decisions**
  > **🧑 HUMAN CHECKPOINT — guest-web scaffolding**: decide SPA (Vite) vs server rendering for SEO; domain and hosting; shared package B vs C (§3.5); guest checkout without account; bot protection and rate limits; analytics and consent. Approved = ADR in `../ARCHITECTURE.md#20-decision-log`.
- **M5.2 · Public API**
  - **Do:** `GET /search` (city, dates, guests; only room types available for every night and fitting occupancy), extended `GET /hotels/:slug`, `POST /quotes`, `POST /holds`, `GET /holds/:id`, `POST /bookings`, `GET /bookings/:reference` (reference + access token, not guessable). Guest origin in CORS; throttling; no staff cookies.
  > **🧑 HUMAN CHECKPOINT — security**: review public endpoints for enumeration, abuse and data exposure. Approved = security review notes, issues fixed.
- **M5.3 · Scaffold and build `apps/guest-web`**
  - **Do:** app skeleton, tokens, pages (search, results, hotel, room choice, details + hold, confirmation, lookup), mobile first; root scripts `start:guest`, `build:guest`, `dev` runs three apps.
  - **Flag:** `GUEST_WEB_PUBLIC` (site deployed but not public until P6 launch).
  - **Verify:** end-to-end booking on a phone; two browsers racing for the last room → one wins with a clear message.
  > **🧑 HUMAN CHECKPOINT — visual design**: approve guest-web look and copy. Approved = designs signed off.

### P6 — Booking management + MVP launch

- **M6.1 · Admin bookings API**
  - **Do:** `GET /admin/bookings` (all accessible hotels; search name / phone / reference; filters), `GET /admin/hotels/:hotelId/bookings`, `GET …/bookings/:id`, `POST …/:id/transitions` (cancel and no-show with server fee preview endpoint, check-in, check-out), all audited.
  > **🧑 HUMAN CHECKPOINT — money impact**: cancellation / no-show fee rules match the policy snapshot. Approved = scenario table passes.
- **M6.2 · Bookings list and detail UI**
  - **Do:** `/admin/bookings` (portfolio, "All hotels" allowed, each row names its hotel), per-hotel list, detail (stay, nights, tax breakdown, policy snapshot, separate booking / payment badges), cancel dialog naming hotel, booking and fee.
- **M6.3 · Booking calendar**
  - **Do:** `InventoryGrid` in `bookings` mode (sold / held / free per room type × night, click through to bookings).
- **M6.4 · Email notifications**
  - **Do:** `modules/notifications` (provider adapter, outbox with retries, templates), confirmation and cancellation emails.
  - **Flag:** `EMAIL`.
  > **🧑 HUMAN CHECKPOINT — provider and templates**: choose email provider and approve template copy. Approved = provider credentials in env, templates signed off.
- **M6.5 · Launch hardening**
  - **Do:** backups + restore rehearsal, monitoring and alerts, deployment rollback rehearsal, security review, load baseline, accessibility pass (TB S4-1, S4-2, S4-4).
  > **🧑 HUMAN CHECKPOINT — go / no-go**: MVP exit criteria in [PRD.md](./PRD.md) reviewed against evidence; production data touched only with approval. Approved = launch decision recorded.
- **M6.6 · Final clean-up**
  - **Do:** remove flags that are permanently on; decide when legacy redirects can go (keep them while logs show hits); delete remaining replaced files.
  > **🧑 HUMAN CHECKPOINT — file deletion and redirect removal**: approve the list. Approved = written confirmation.

### P7–P8 (post-MVP, brief)

- **P7 — Payments, refunds, invoices:** new `payments` and `invoices` modules, `Payment` / `Refund` / `Invoice` collections, payment links + UPI, signed idempotent webhooks, refund state machine, per-night GST invoices (requires `taxProfile.gstin`), SMS/WhatsApp via `notifications`; hold TTL 30–60 min for payment-link channels. Additive to P4 bookings (payment status already separate). 🧑 checkpoints: gateway choice and contract, webhook security, refund rules, invoice format, tax review.
- **P8 — Operations & insight:** Today live tiles (arrivals / departures / in-house), `GuestProfile` separate from booking snapshots, Form-III at check-in (DPDP retention fields), reports + CSV, portfolio "All hotels" view. 🧑 checkpoints: metric definitions, ID data retention, export permissions.

---

## 6. Documentation migration

- **When:** right after the new plan is approved (before M0.6), then updated at the end of each phase by `docs-keeper`.

| Doc | Change |
|---|---|
| `../MVP.md` | Add a banner at the top: "Plan of record moved to `new plan/`". Keep the MVP objective and exit criteria; replace "Development Phases" with the P0–P8 table and the old-to-new mapping (old Phase 1 = P1–P6, Phase 2 = P7, Phases 3–4 = P8+). |
| `../TASKS.md` | Add a P1–P6 board that links to step IDs in [MVP-PLAN.md](./MVP-PLAN.md) and to `M`-steps here; map old items (TB S1-9 → P5, TB S2-1/S2-5 → P4, TB S2-2 → P4, TB S2-3 → P4/P5, TB S2-4 → P6, TB S3-* → P7, TB S4-* → P6). Old checklist lines keep their state. |
| `../API.md` | Add the missing current endpoints (`metrics`, `media/upload`, `batch-adjust`); add each new endpoint per phase with status; mark single-date block/unblock deprecated in P2. |
| `../DATA_MODEL.md` | Replace `RatePlan/NightlyRate`, `InventoryHold/HoldNight`, `BookingNight` with the baseline names (`DailyRate`, `Hold`, `Booking.nights[]`); point to [DATA-MODEL.md](./DATA-MODEL.md) for detail. |
| `../ARCHITECTURE.md` | Decision log entries: hotel-scoped routes, data router, shared package, quote engine placement, guest-web stack, audit retention, GST rules. Update "Suggested Project Structure" to §3. |
| `../modules/*.md` | `hotels`, `room-types`, `pricing` (daily rates, resolver, quotes), `bookings` (holds, statuses), `audit-logging` (viewer), `guest-search`, `notifications`, `rbac` (new keys) updated as each phase lands. |
| `../GUIDES.md` (admin navigation guide) | Rewrite routes and journeys after P1, P2, P3 and P6. |
| `../ANALYSIS.md` | Status updates: dead code removed (M0.6), `ConfirmDialog` is live, audit findings closed. |
| `../README.md`, `EXECUTION-ORDER` | Point "next step" at this folder; add `new plan/` to the documentation map. |
| `../../context.md`, `../../AGENT.md` | Replace the 0–7 phase scheme with P0–P8 so there is **one** scheme. |
| `.agent/roles/task-planner.md` | Read `new plan/README.md`, `MVP-PLAN.md`, `PHASES.md` before `TASKS.md`. |
| `.agent/roles/docs-keeper.md` | Add rows: route changes → `new plan/UX-PLAN.md` + redirect table here; schema changes → `new plan/DATA-MODEL.md` as well as `../DATA_MODEL.md`. |
| `.agent/rules/orchestration.md`, `.agent/workflows/implement-task.md` | Add "stop at 🧑 HUMAN CHECKPOINT and wait for approval". |
| `apps/admin-web/docs/components.md`, `ui-decisions.md` | Add new shared components and the token, modal and icon-size decisions. |

- **Rule kept:** no new standalone progress files; finished phase logs go to `../HISTORY.md`.

---

## 7. Effort estimate

- **Unit:** person-days of a mid/senior full-stack developer who knows NestJS, Mongo transactions and React. **These are estimates.**
- **Includes:** implementation, unit/integration tests, self-review, docs updates, fixing review findings.
- **Excludes:** product decision time, tax-professional fees, hosting procurement, P7–P8.

### 7.1 Per phase (low / likely / high)

| Phase | Backend | Frontend admin | Guest web | Data migration | QA, testing & ops | Docs | Design/UX review | **Total (L / likely / H)** |
|---|---|---|---|---|---|---|---|---|
| **P0** Prepare | 0.5 | 1 | — | 0.5 | 1.5 | 0.5 | — | **3 / 4 / 6** |
| **P1** Admin foundations | 7 | 23 | — | — | 3 | 1.5 | 1.5 | **27 / 36 / 49** |
| **P2** Inventory grid | 8 | 12 | — | 1 | 3 | 1 | 2 | **20 / 27 / 39** |
| **P3** Content, Overview, tax | 7 | 9 | — | 1.5 | 2.5 | 1 | 1.5 | **17 / 22.5 / 30** |
| **P4** Holds & booking core | 18 | 7 | — | 0.5 | 4 | 1.5 | 1.5 | **24 / 32.5 / 48** |
| **P5** Guest web | 7 | — | 13 | — | 4 | 1 | 3 | **21 / 28 / 42** |
| **P6** Booking mgmt + launch | 11 | 9 | 1 | 0.5 | 10 | 2 | 1.5 | **26 / 35 / 50** |
| **MVP total** | 58.5 | 61 | 14 | 4 | 28 | 8.5 | 11 | **138 / 185 / 264** |

- Workstream columns show the **likely** figure.
- **Admin-only slice (P0–P3):** 67 / 89.5 / 124 person-days. **Booking slice (P4–P6):** 71 / 95.5 / 140.
- **Post-MVP (rough):** P7 30 / 40 / 55; P8 25 / 35 / 50.

### 7.2 Per workstream (MVP)

| Workstream | Low | Likely | High | Main items |
|---|---|---|---|---|
| Backend | 44 | 58.5 | 82 | audit API, room APIs, grid + daily rates, content + tax, quotes, holds, bookings, public API, notifications |
| Frontend admin | 46 | 61 | 85 | router + redirects, switcher, Rooms & rates, grid, tabs split, Overview/Today, New booking, bookings UI, theme |
| Guest web | 10 | 14 | 22 | scaffold + 7 screens |
| Data migration | 3 | 4 | 7 | restrictions defaults, amenities + photo categories backfill, permission seeds |
| QA, testing & ops | 21 | 28 | 40 | test harness, redirect tests, race tests, GST tests, E2E, launch hardening |
| Docs | 6 | 8.5 | 12 | §6 updates per phase |
| Design / UX review | 8 | 11 | 16 | visual sign-offs, grid usability test, guest-web design, a11y passes |
| **Total** | **138** | **185** | **264** | |

### 7.3 Smaller coding model + human reviewer

- **Assumption:** the model writes most code and docs; the human reviews every diff, runs the app, handles all 🧑 checkpoints, writes or checks race/tax tests, and fixes what the model gets wrong. Review share is higher where the model is likely to err (transactions, tax, permissions).

| Phase | Human review of model code | Human testing & checkpoints | Design/UX + docs review | **Human total (likely)** | Range |
|---|---|---|---|---|---|
| P0 | 1 | 2.5 | 0.5 | **4** | 3–6 |
| P1 | 13.5 (≈45–50% of build) | 4 | 2 | **19.5** | 15–28 |
| P2 | 10 (≈50–60%; grid + transactions) | 4.5 | 2.5 | **17** | 13–25 |
| P3 | 7.5 | 4 | 2 | **13.5** | 10–19 |
| P4 | 17 (≈75%; concurrency, tax) | 4.5 | 2 | **23.5** | 18–35 |
| P5 | 9.5 | 4 | 3.5 | **17** | 13–26 |
| P6 | 11 | 10 | 2 | **23** | 17–31 |
| **Total** | **69.5** | **33.5** | **14.5** | **~117.5** | **88–170** |

- **Effect:** about **35% fewer human days** than the conventional likely (185), but **not 35% shorter**: the human is the bottleneck and model rework loops add ~10–15% calendar time.
- **Don't delegate to the model without a human pair:** M1.3 redirect matrix, M1.4 scope tests, M2.3 bulk transaction, M4.2 GST engine, M4.3 holds, M5.2 public API security.

### 7.4 Calendar duration

| Staffing | Likely | Range | Assumption |
|---|---|---|---|
| 1 developer | ~11 months | 8–15.5 | 185 ÷ ~17 productive days/month |
| 2 developers | ~6–6.5 months | 4.5–9 | +15% coordination; P5 guest web overlaps P6 admin UI; P2 grid FE overlaps P3 BE |
| Model + 1 human | ~7–7.5 months | 5.5–10.5 | 117.5 human days + rework loops |
| Model + 2 humans | ~4–4.5 months | 3.5–6.5 | reviewer + tester/designer split |

### 7.5 What drives the range

- **Grid ambition:** keyboard + touch range selection and mobile layout can double frontend P2 time.
- **Concurrency bugs:** holds and bulk writes are the most likely source of rework (P4 high = 48).
- **Product decision latency:** option lists, copy, GST confirmation and guest-web stack; each week of waiting idles the phase.
- **Guest-web stack:** server rendering for SEO adds ~5–8 days over a Vite SPA.
- **Design maturity:** if [UI-PLAN.md](./UI-PLAN.md) screens are ready before each phase, design review stays near "low".
- **Test debt:** no frontend tests today; the harness (M0.3) is cheap, but writing redirect and grid tests is real work.
- **Unpinned dependencies:** a major React Router or Tailwind upgrade landing mid-migration can cost days (mitigated by M0.2).
- **Model quality** (model-assisted option): weaker models shift time from typing to review.

---

## 8. Risks and mitigations (migration-specific)

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **Broken links and bookmarks** after the route restructure | High / Medium | Redirect table with tests per old URL and per user type (M1.3); keep redirects ≥ 2 releases; log redirect hits to know when they can go. |
| **Permission regressions** — a hotel-scoped URL shows another hotel's data, or "All hotels" reaches an edit screen | Medium / High | API scope checks unchanged and authoritative; layout-level scope check; negative tests with Editor / Manager roles; switcher only lists `hotelIds`; 🧑 at M1.4 and M4.4. |
| **Inventory data correctness** — bulk edits or restrictions break `held + confirmed + blocked ≤ total` | Medium / High | Reuse the existing transaction + capacity predicate; `dryRun` preview; race tests on a replica set; audit with before / after; 🧑 at M2.3. |
| **Concurrency** — double holds, hold released twice, reaper vs convert race | Medium / High | Single transaction per claim; status-guarded updates (`ACTIVE` only); idempotency keys; TB S2-1 / S2-5 tests; 🧑 at M4.3. |
| **Data backfill errors** (amenities, photo categories) | Low / Medium | Idempotent scripts with `--dry-run` and counts; run on a production copy first; API accepts old shape for one release. |
| **Tax errors** (fixed GST rate, rounding drift) | Medium / High | Server-only per-night calculation; table tests at slab edges; tax professional sign-off; snapshot on booking. |
| **Two systems at once** — old pages and new tabs both editable during P1–P2, users confused | Medium / Low | Redirect old pages as soon as the replacement verifies; short overlap; release notes. |
| **Scope creep** — Today live tiles, reports, payments pulled into MVP | High / Medium | Baseline "Out of MVP" list; anything new goes to P7/P8 in [PHASES.md](./PHASES.md) unless the user re-scopes. |
| **Model errors** — plausible but wrong code in transactions, redirects, permissions; silent deletion | Medium / High | 🧑 checkpoints; model never commits, pushes or deletes; verification commands every step; small diffs per step. |
| **Dependency drift** (`"latest"`) | Medium / Medium | Pin in M0.2; upgrade only as its own task. |
| **Big workspace file split** (`HotelWorkspace` 442 lines) loses unsaved-edit or publish behaviour | Medium / Medium | Move logic into hooks first (M1.1), split second (M3.4); smoke tests before and after. |
| **Guest-web launch exposes inventory to abuse** | Low / High | Throttling, non-guessable references, `GUEST_WEB_PUBLIC` flag until M6.5. |

### Cut-line (drop in this order if time is short)

1. **P8 and P7** stay out (already post-MVP).
2. **Content-completeness score and photo inbox** (P3) → keep Overview with setup health only.
3. **Duplicate room type / "copy from another hotel"** (P1) → later.
4. **Grid extras:** minStay and cutoffDays UI, 30-day view, mobile layout (keep desktop Today / 7 / 14 with price, open/close, block).
5. **Booking calendar view** (M6.3) → list + detail only.
6. **Theme token migration** beyond quick wins → only the eight quick wins.
7. **Guest booking lookup page** → confirmation email carries the details.
- **Never cut:** hotel in URL + scope checks, redirects, audit of price and inventory changes, server-side per-night GST, transactional holds and their race tests, backups/rollback rehearsal.

---

## 9. Checklist to start

- **Approvals (🧑, before M0.6 / M1.2)**
  - [ ] New plan folder approved as plan of record (README status changes from "proposal").
  - [ ] Route table and redirects (§3.2) approved.
  - [ ] Dead-file deletion list (§2.6) approved, incl. `ImageUploadDropzone` / `Skeleton` choice.
  - [ ] Shared-package option (§3.5) chosen.
  - [ ] Token decision (slate vs `ink`/`line`, semantic colours) chosen.
  - [ ] Owner named for product decisions (option lists, copy) and a tax professional booked for P3/P4.
  - [ ] Staffing option chosen (§7.4) and who acts as human reviewer.
- **Environment**
  - [ ] MongoDB **replica set** running locally and in test (transactions); `GET /api/v1/health` green.
  - [ ] `.env` from `.env.example`, incl. new `FEATURE_*` flags (all off).
  - [ ] `npm run dev` works; reviewer knows to use `tsc --noEmit` instead of `nest build` while it runs.
  - [ ] Admin-web dependencies pinned (M0.2); Vitest harness running (M0.3).
  - [ ] Screenshot tool (`npm run screenshots`) working for before/after comparisons.
- **Test data and users**
  - [ ] Seed: super admin, one-hotel manager, three-hotel editor (M0.4).
  - [ ] Hotels in every status; rooms with and without prices / open dates; one hotel with prices both sides of ₹7,500.
  - [ ] A copy of production-like data for migration dry-runs (no real guest data on dev machines).
- **Process**
  - [ ] `.agent` workflow updated to stop at 🧑 checkpoints; docs-keeper rows added (§6).
  - [ ] Baseline tag/branch decided by the user (M0.1); commits and pushes only with user permission.
  - [ ] `../TASKS.md` P1 board created and linked to the M-steps.
