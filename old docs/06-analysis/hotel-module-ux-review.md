# Hotel Module UX Review: Admin Web

**Platform:** Staywise Hotel Operations Platform (`apps/admin-web`, with `apps/api` where it affects the user)
**Module:** Hotel setup and operations — hotels list, add/edit hotel workspace, room types, rates, availability
**Author:** Pair Programming Agent
**Date:** October 20, 2026
**Scope:** Every screen a hotel admin uses to set up and run a property, as committed at `f929658` (branch `feat-update`): `/admin/hotels`, `/admin/hotels/new`, `/admin/hotels/:id`, `/admin/hotels/:id/edit`, `/admin/room-types` (+ new/edit), `/admin/rates`, `/admin/inventory`, and the shared controls they use.

**Method:** Followed `routes/AppRoutes.tsx` into each page and the components it renders, read the JSX, state handling and submit code, and compared what the UI says against the server's publish rules (`apps/api/src/modules/hotels/hotel-publish.checks.ts`). Every finding cites the file and line it comes from. Nothing was run in a browser, so visual polish and real timing are not judged here — only behaviour that is visible in the code.

---

## Executive summary

**Overall user-friendliness: 6.5 / 10.** The hotel workspace is a real improvement: one page, a numbered checklist, rupee entry, plain-language labels, shared pickers and per-field errors. What holds the score back is that the workspace does not cover the whole job (availability lives on another page and is required to publish), a few indicators show made-up or misleading progress, and edits can be lost without warning.

| Area | Score | Why |
|---|---|---|
| Hotels list | 6 / 10 | Good filters and search; but the "Setup progress" bar is hard-coded, a summary card shows fake text, and Import is a dead button. |
| Add / Edit hotel | 7 / 10 | Clear 4-step workspace with friendly fields; but the checklist misjudges readiness, inventory is missing, and switching tabs drops unsaved edits. |
| Room types | 6.5 / 10 | One shared form with good validation; but rooms can't be edited from the workspace, can't be deactivated anywhere, and the standalone pages auto-pick the first hotel. |
| Rates | 7 / 10 | Rupee entry and ₹ display everywhere; but some copy still says "minor units", two validation errors are toast-only, and prices "flash" as missing while loading. |
| Availability | 5 / 10 | Works, but cryptic labels ("tot / held / book / blk"), fixed 14-night window, one night at a time, and it sits outside the setup flow. |
| Shared controls | 7 / 10 | New DatePicker, Combobox, ReasonField, MoneyInput and Checkbox are solid; but modals don't manage focus, close on a backdrop click, and labels aren't linked to inputs. |

### Top 5 strengths

1. **One workspace with a numbered checklist** (`HotelWorkspace.tsx:234-324`): Hotel & Photos → Room Types → Rates → Cancellation, with a tick or dot per step and counts.
2. **Money is typed and shown in rupees** (`MoneyInput`, `formatMoney`): no paise maths for staff anywhere except two hint texts.
3. **Consistent create and edit forms**: `HotelDetailsFields` and `RoomTypeFields` are shared, so the same fields, limits and hints appear in both.
4. **Constrained inputs where it matters**: country, state, time zone (filtered by country), PIN pattern, room-code pattern, calendar date picker, searchable property picker.
5. **Errors land on the field** for server validation (per-field `errors[]` → `useServerErrors`), and publish problems are listed in plain language (`HotelWorkspace.tsx:332-341`).

### Top 8 problems

1. **Availability is required to publish but missing from the workspace.** The server blocks publishing until every room type has a future night with rooms (`hotel-publish.checks.ts:110-126`). The workspace has no availability step and no link to `/admin/inventory`, so users hit "Publish", get an error, and must find another page.
2. **The hotels list "Setup progress" is fake.** Every non-published hotel shows "3 of 5 · 60%" and every published hotel "4 of 5 · 80%" (`HotelsPage.tsx:298-302`). Staff will trust it and be misled.
3. **The checklist misjudges readiness.** "3. Rates" turns green as soon as one room exists, even with no prices (`HotelWorkspace.tsx:299`); "1. Hotel & Photos" stays amber without photos although the server doesn't require them (`:180`); "4. Cancellation" turns green even when the start date is in the future, which blocks publishing (`:182`).
4. **Unsaved edits are lost silently.** Switching workspace tabs unmounts the form (`HotelWorkspace.tsx:345-455`), modals close on Escape or a backdrop click (`Modal.tsx:39,56`), and there is no leave-page warning anywhere.
5. **Two save buttons on one tab.** "Save hotel details" and "Save photos" are separate (`HotelWorkspace.tsx:358,384`); uploading photos and then saving only the details loses the photos. Create saves both together, so behaviour differs between create and edit.
6. **Room types can't be fully managed from the workspace.** The Rooms tab only offers "Add photos / Manage photos" (`HotelRoomsList.tsx:66-81`); editing capacity or room count needs `/admin/room-types`, and there is no deactivate action anywhere.
7. **Availability screen is hard to read and slow to use**: abbreviations (`InventoryCalendarView.tsx:98-101`), a legend that doesn't match the colours used (`:37-44` vs `:92`), a fixed 14-night window (`InventoryPage.tsx:49,79`) and blocking one night at a time.
8. **Accessibility gaps in shared pieces**: `Field` labels aren't linked to inputs (no `htmlFor`/`id`), the workspace checklist is built from plain buttons without tab roles (its `tabpanel` points at ids that don't exist, `HotelWorkspace.tsx:343`), and modals don't move or trap focus.

---

## Setup journey walkthrough (Add hotel → Published, one room type)

| # | Step | Screen | Clicks (min.) | Friction |
|---|---|---|---|---|
| 1 | Hotels list → **Add a hotel** | `/admin/hotels` | 1 | — |
| 2 | Fill Basics, Contact, Location (11 fields, slug auto-fills; photos optional) → **Create hotel** | `/admin/hotels/new` | 1 + typing | Good defaults (India, IST). Lands on the workspace automatically. |
| 3 | Add hotel photos (if not done on create) → **Save photos** | Workspace · 1 | 2+ | Separate save from details (problem 5). |
| 4 | **2. Room Types** → **Add room type** → 5 fields → **Add** | Workspace · 2 + modal | 3 | Fine. Editing later needs another page (problem 6). |
| 5 | (Optional) **Add photos** for the room → **Save room photos** | Modal | 2+ | Modal closes on backdrop click (problem 4). |
| 6 | **3. Rates** → **Set price** → amount + reason → **Save rate** | Workspace · 3 + modal | 3 | Reason is mandatory even for the first price; tab already looks "done" (problem 3). |
| 7 | **4. Cancellation** → set terms → **Save cancellation policy** | Workspace · 4 | 2 | Good: future-date heads-up. |
| 8 | Leave workspace → sidebar **Availability** → pick hotel + room → **Initialize date range** | `/admin/inventory` | 4 | Not mentioned anywhere in the workspace (problem 1); only 14 nights per click. |
| 9 | Back to **Hotels** → **Manage** → **Publish Hotel** | `/admin/hotels` → workspace | 3 | If anything is missing, the error list doesn't link to where to fix it. |

**Total: about 21 clicks across 3 screens for one room type**, plus roughly 8 more clicks per extra room type (add, price, initialise). Without prior knowledge of step 8, a first-time user will fail at step 9.

---

## 1. Hotels list (`/admin/hotels`)

**What works**
- Search, status, city, setup and "updated" filters, all reflected in the URL (`HotelsPage.tsx:45-75`); archived hotels hidden by default with a clear "All (excluding archived)" label.
- City filter is a searchable `Combobox` fed by all cities, not just the current page (`HotelFiltersBar.tsx:60-70`).
- Row click opens a read-only overview (`/admin/hotels/:id`), "Manage" opens the workspace — sensible split.
- Bulk select with indeterminate header checkbox and a reason-required confirm for Suspend/Archive.

| # | Finding | Where | Impact on user | Recommendation | Priority | Effort |
|---|---|---|---|---|---|---|
| L1 | "Setup progress" is hard-coded: 3/5 (60%) or 4/5 (80%) | `HotelsPage.tsx:298-302` | Misleading; staff can't see which hotels really need work | Compute from real readiness (API `publishChecks` summary per hotel) or remove the column | High | M |
| L2 | "Active Hotels" card detail shows fixed text "↑ 2 this month" | `HotelSummaryCards.tsx:15` | False information on the first screen | Remove or compute | Medium | S |
| L3 | **Import** button only shows a "coming soon" toast | `HotelsPage.tsx:378-384` | Dead end; erodes trust | Hide until the feature exists | Low | S |
| L4 | Missing dates fall back to a fixed "15 Oct 2026" | `HotelsPage.tsx:328` | Wrong "Updated" value shown | Show "—" when unknown | Low | S |
| L5 | Empty state always says "No matching properties found", even with zero hotels and no filters | `HotelsPage.tsx:422-423` | Confusing first-run experience | Separate "no hotels yet — add your first" from "no matches — clear filters" | Medium | S |
| L6 | Status names differ: card "Paused"/"Needs Setup" vs pill "Suspended"/"Draft" | `HotelSummaryCards.tsx:29,36` | Two words for one state | Use `STATUS_LABEL` everywhere | Low | S |
| L7 | "Add a hotel" buttons are raw `<button>` with hex colours, not `Button` | `HotelsPage.tsx:386-394,426-433` | Inconsistent focus/disabled styling | Use shared `Button` | Low | S |

## 2. Add hotel and Edit hotel workspace

**What works**
- Add hotel: three titled groups, slug auto-fill, country/state/time-zone dropdowns, PIN rule, single "Create hotel" with a clear "what comes next" note (`HotelCreateForm.tsx`).
- Workspace: one header with status pill and only the actions valid for that status (`HotelWorkspace.tsx:194-230`); suspend/archive ask for a reason; archived hotels show a read-only banner and disabled forms (`:326-330`).
- Publish problems are listed in plain words (`:332-341`); the policy tab warns about future dates.
- Tab state is kept in `?tab=` and old links (`general`, `photos`, `policy`) still work (`:33-40`).

| # | Finding | Where | Impact on user | Recommendation | Priority | Effort |
|---|---|---|---|---|---|---|
| W1 | No availability step or link, although the server requires future inventory to publish | `HotelWorkspace.tsx:234-324`; `hotel-publish.checks.ts:110-126` | Users fail at Publish and must discover `/admin/inventory` | Add "5. Availability" (initialise next N nights per room) or at least a link with status | High | M |
| W2 | "3. Rates" shows a green tick when any room exists, even with no prices | `HotelWorkspace.tsx:299-303` | Looks done when it isn't | Tick only when every room has a base rate | High | S |
| W3 | "1. Hotel & Photos" requires a photo; server doesn't | `HotelWorkspace.tsx:180` | Amber dot that never blocks publishing — mixed signals | Align with product rule (make photos required server-side, or drop from the check) | Medium | S |
| W4 | "4. Cancellation" ticks green even when the start date is in the future | `HotelWorkspace.tsx:182` | Publish fails despite a green tick | Include `effectiveFrom <= today` | Medium | S |
| W5 | Switching tabs discards unsaved form edits; no warning | `HotelWorkspace.tsx:345-455` | Lost work | Track dirty state; warn on tab switch and page leave | High | M |
| W6 | Two save buttons on the Hotel tab (details vs photos) | `HotelWorkspace.tsx:358,376-386` | Photos lost if only details are saved | One "Save" for the tab, or auto-save the gallery, or a "you have unsaved photos" banner | High | M |
| W7 | Publish problem list has no links to the tab that fixes each item | `HotelWorkspace.tsx:332-341` | Users must map messages to tabs themselves | Map problem codes to tabs and add "Fix" links | Medium | S |
| W8 | No pre-publish readiness check; problems appear only after clicking Publish | `HotelWorkspace.tsx:128-143` | Trial and error | Expose the server's checks (e.g. `GET /admin/hotels/:id/readiness`) and show them in the checklist | Medium | M |
| W9 | Rates tab intro still says "minor currency units" | `HotelWorkspace.tsx:426` | Jargon contradicts rupee entry | "Set the nightly price in rupees for each room type." | Medium | S |
| W10 | Checklist tabs are plain buttons; `tabpanel` references non-existent tab ids | `HotelWorkspace.tsx:246-322,343` | Screen readers don't announce tabs | Use shared `Tabs` (has roles) or add `role="tab"`, ids, `aria-selected` | Medium | S |
| W11 | Archive errors are toast-only and lose the server message format | `HotelWorkspace.tsx:154-161` | Inconsistent with other actions | Use `handleFormError` like suspend | Low | S |
| W12 | Overview page shows percentage fees rounded (12.5% → "13%") and raw `YYYY-MM-DD` dates | `HotelDetailPage.tsx:287,296,300` | Small inaccuracy | Format with up to 2 decimals and a readable date | Low | S |

## 3. Room types

**What works**
- One shared field block for the page and the quick-add modal (`RoomTypeFields.tsx`): code uppercases as you type with a clear pattern hint, "0 means not bookable" hint, description counter, reason required only when the room count changes.
- Room cards in the workspace show photo, code, capacity and photo count (`HotelRoomsList.tsx`).

| # | Finding | Where | Impact on user | Recommendation | Priority | Effort |
|---|---|---|---|---|---|---|
| R1 | Workspace Rooms tab can't edit a room's details | `HotelRoomsList.tsx:66-81` | Must leave the workspace to change capacity or count | Add "Edit" opening `RoomTypeForm` in a modal | Medium | S |
| R2 | No way to deactivate a room type (API exists, no UI) | `rooms.api.ts` `disableRoomType`; no caller | Unused rooms block publishing (need rates/inventory) | Add "Deactivate" with reason | Medium | M |
| R3 | Standalone pages auto-select the first hotel when none is in the URL | `HotelRoomPicker.tsx:66` | Risk of adding a room to the wrong hotel | Require an explicit choice when there is more than one hotel | Medium | S |
| R4 | Empty-state copy says rooms need photos to publish; server doesn't | `HotelRoomsList.tsx:20` | Wrong requirement | Match the real rule | Low | S |
| R5 | Room types table empty-state button is a raw `<button>` | `RoomTypesView.tsx:87-93` | Inconsistent styling | Use `Button` | Low | S |

## 4. Rates

**What works**
- Rupee entry with ₹ prefix and decimal validation (`MoneyInput`), formatted display (`₹2,499.00`) on the workspace, overview and rates page.
- Coverage banner ("2 room types are missing pricing") and per-room "Set price / Edit price" cards (`HotelRatesTab.tsx:148-215`); currency locks after the first rate.

| # | Finding | Where | Impact on user | Recommendation | Priority | Effort |
|---|---|---|---|---|---|---|
| P1 | Price hint says "Stored securely as integer minor units" | `HotelRatesTab.tsx:230` | Jargon; confusing | "e.g. 3500 or 3500.50 (before tax)" | Medium | S |
| P2 | Amount and currency errors are toast-only | `HotelRatesTab.tsx:86-94` | Error not shown on the field | Use `formErrors.setFieldErrors` | Low | S |
| P3 | While rates load, every room shows "No price configured" and the warning banner | `HotelRatesTab.tsx:33,67-72,149-157` | Brief false alarm | Show a loading state until the first load finishes | Medium | S |
| P4 | Any load error is treated as "no price" | `HotelRatesTab.tsx:46-48` | Users may overwrite a price they can't see | Distinguish 404 from other errors and show an error state | Medium | S |
| P5 | Rates editable in two places (workspace tab and `/admin/rates`) with different layouts | `HotelRatesTab.tsx`; `BaseRatesView.tsx` | Two mental models | Keep one primary place; make the other link to it | Low | M |
| P6 | Unlocked currency `Select` doesn't update the `MoneyInput` currency | `HotelRatesTab.tsx:233-257` | Wrong symbol/decimals for non-INR first rate | Track the selected currency in state (as `BaseRatesView` does) | Low | S |
| P7 | Reason required even for the very first price | `HotelRatesTab.tsx:261-267` | Extra typing during setup | Pre-fill "Initial rate setup" when no rate exists | Low | S |
| P8 | Nav icon for Base rates is a dollar sign | `route-config.ts:25` | Minor mismatch in an INR product | Use `IndianRupee` | Low | S |

## 5. Availability (`/admin/inventory`)

**What works**
- Clear formula footnote ("Available = total − blocked − held − confirmed", `InventoryCalendarView.tsx:125-128`), "Not set" cells, a single "Initialize date range" action, block/unblock with a required reason and a calendar date picker.

| # | Finding | Where | Impact on user | Recommendation | Priority | Effort |
|---|---|---|---|---|---|---|
| A1 | Cell labels are abbreviations: "tot", "held", "book", "blk" | `InventoryCalendarView.tsx:98-101` | Hard to read at a glance | Full words or icons with tooltips | Medium | S |
| A2 | Legend ("Available" green, "Fully allocated" grey) doesn't match cell colours (red number when 0) | `InventoryCalendarView.tsx:37-44,92` | Legend misleads | Make legend match, or colour cells by state | Low | S |
| A3 | Fixed 14-night window; no next/previous navigation | `InventoryPage.tsx:49` | Slow to look ahead | Add week/fortnight arrows and a month view | Medium | M |
| A4 | "Initialize" covers only the 14 nights shown | `InventoryPage.tsx:79` | Opening a season takes many clicks | Let users pick a range (e.g. next 90/180 days) | High | M |
| A5 | Blocking works one night at a time; batch API exists but no UI | `InventoryAdjustModal.tsx`; batch endpoint | Multi-day maintenance is tedious | Date-range block (DateRangePicker + quantity + reason) | Medium | M |
| A6 | Summary cards omit "held" | `InventoryPage.tsx:122-145` | Totals don't add up visually | Add a held card or fold it into "Reserved" | Low | S |
| A7 | Header shows raw ISO date ("Fourteen nights from 2026-10-20") | `InventoryCalendarView.tsx:34` | Less readable | Format the date | Low | S |
| A8 | Not reachable from the workspace (see W1) | — | Breaks the setup flow | Link or embed | High | M |

## 6. Shared controls

**What works**
- `MoneyInput`, `DatePicker` (calendar, min/max, "Today", property-local today), `Combobox` (ARIA combobox, keyboard, async search), `ReasonField` (3–500 with counter), `Checkbox` (indeterminate), `PasswordInput` — all consistent and token-styled.

| # | Finding | Where | Impact on user | Recommendation | Priority | Effort |
|---|---|---|---|---|---|---|
| S1 | `Field` label isn't linked to its input (no `htmlFor`/`id`) | `components/ui/Field.tsx:25` | Clicking a label does nothing; weaker screen-reader names | Generate an id with `useId` and pass it to the child | Medium | S |
| S2 | `Modal` doesn't focus the dialog, trap focus or return focus on close | `components/ui/Modal.tsx:37-80` | Keyboard users can tab behind the modal | Add focus management | Medium | S |
| S3 | `Modal` closes on backdrop click and Escape even with unsaved input | `components/ui/Modal.tsx:35,39,56` | Lost rate/photo edits | `closeOnBackdrop={false}` for forms, confirm when dirty | Medium | S |
| S4 | `DatePicker` popover has no arrow-key grid navigation and doesn't move focus into the calendar | `components/ui/DatePicker.tsx` | Slower keyboard use | Focus the selected day on open; arrow keys move days | Low | M |
| S5 | `Combobox` shows no clear "×" to reset to "All" | `components/ui/Combobox.tsx` | Must reopen and pick "All locations" | Optional clear button | Low | S |

---

## Cross-cutting

**Accessibility.** Label association (S1), modal focus (S2), checklist tabs without roles (W10), and status shown mainly by colour dots in the checklist (`HotelWorkspace.tsx:255-259`; the tick vs dot is also shape-coded, which helps). Many touch targets are small (`size="sm"` buttons at 32 px, calendar text at 10 px). Mobile layout is handled (grids collapse, checklist becomes 2 columns).

**Consistency.** Same things done differently: two save models (create saves photos with details, edit doesn't), two rate editors, raw `<button>` vs `Button` (L7, R5), status words (L6), archive vs suspend error handling (W11).

**Copy and terminology.** Mostly plain and friendly ("Web address", "Free cancellation until", "0 means not bookable"). Remaining jargon: "minor currency units" (W9, P1), abbreviations on the calendar (A1). Title case vs sentence case is mixed ("Publish Hotel", "Room Categories" vs "Add room type").

**Feedback and errors.** Good: per-field server errors, success toasts, busy guards on every submit, version-conflict message. Gaps: toast-only errors in a few places (P2, W11), silent failures when room types fail to load (`HotelWorkspace.tsx:97-103`), loading flashes (P3), and no readiness feedback before Publish (W8).

---

## Prioritised action plan

**Quick wins (effort S)**
1. Fix checklist logic: Rates tick only when all rooms are priced (W2), Cancellation tick requires a current start date (W4), align the photo rule (W3, R4).
2. Remove fake data: setup progress column (L1, or hide until real), "↑ 2 this month" (L2), dead Import button (L3), fixed fallback date (L4).
3. Replace jargon: W9, P1; full words on the calendar (A1); fix legend (A2).
4. Rates tab loading state and error handling (P3, P4); field-level errors (P2).
5. Link publish problems to tabs (W7); add an availability link in the workspace (part of W1).
6. Accessibility basics: `Field` `htmlFor` (S1), tab roles (W10), modal focus (S2), `closeOnBackdrop={false}` on form modals (S3).
7. Edit room details from the workspace (R1); explicit hotel choice on standalone pages (R3).

**Next sprint (effort M)**
1. "5. Availability" step in the workspace with "initialise next N nights for all rooms" (W1, A4, A8).
2. Unsaved-changes protection across tabs and pages (W5) and a single save model for the Hotel tab (W6).
3. Server readiness endpoint feeding the checklist and the list's setup column (W8, L1).
4. Room type deactivate (R2); date-range blocking (A5); calendar navigation (A3).

**Later**
1. One home for rate editing (P5).
2. DatePicker keyboard grid (S4), Combobox clear (S5), larger touch targets, consistent sentence case.

---

## Needs a product decision

- **Are hotel photos and room photos required to publish?** The UI says yes (W3, R4); the server says no.
- **How far ahead should availability be opened by default** (30 / 90 / 180 / 365 nights), and should it be automatic when a room type is created?
- **Should the first base rate need a reason?** (P7)
- **Which screen is the primary place to edit rates** — the workspace tab or `/admin/rates`? (P5)
- **Should "Setup progress" mirror the server's publish checks exactly**, and how many steps does it count? (L1)

## Status update — top 4 problems fixed (2026-10-20)
1. **Availability added to the workspace.** New step 4 "Availability" (`features/inventory/HotelAvailabilityTab.tsx`): per room type it shows open nights in the next 30/90/180/365 days and rooms available tonight, lets staff open dates for one or all room types (`POST …/inventory/initialize`, idempotent), and links to the calendar for blocks.
2. **Real setup progress on the hotels list.** `GET /admin/hotels` now returns `setup: { done, total, ready }` per row, computed by `HotelPublishChecks.readiness()` (same rules as publish). The column shows "N of 5 steps done" or "Ready to publish".
3. **Checklist now matches publishing.** New `GET /admin/hotels/:id/readiness` maps each publish problem to a step (hotel, rooms, rates, availability, cancellation). Rates is green only when every room has a price; photos no longer block the hotel step; a future-dated policy keeps Cancellation amber. A "Still needed before you can publish" list shows before the user presses Publish, and refreshes after every save.
4. **Unsaved edits are protected.** Switching steps with unsaved changes asks "Discard unsaved changes?"; "Back to hotels" asks too; closing or reloading the browser tab warns. The Hotel step has one "Save hotel" button (details, then photos if changed). Form pop-ups no longer close on a stray click outside (Escape still closes). Saving no longer flashes a full-page loader or resets the open step.
Limitation: sidebar links are not guarded (the app uses `BrowserRouter`, which has no navigation blocker); the browser-tab warning still covers reload/close.
