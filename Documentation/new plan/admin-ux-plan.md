# Admin UX Plan — Staywise

- **Date:** 2026-10-20
- **Author role:** UX lead review
- **Status:** Proposal for team review. Nothing here is built unless marked "built today".
- **Basis:** the current admin app (`apps/admin-web`), the module specs in `Documentation/modules/`, `MVP.md`, `TASKS.md`, and the findings in `Documentation/ANALYSIS.md` (UX review, field-type analysis, UI theme audit).

## Summary

- **Where we are:** the admin is a well-built **setup tool**. It creates hotels, room types, rates, availability and cancellation policies, and guards publishing with a readiness check.
- **Where we should go:** an **operations tool**. Staff open it, see what needs attention today, find any booking in seconds, and manage a hotel's rooms, prices and availability from one place.
- **The three biggest changes:**
  - **One hotel switcher** for the whole app instead of re-picking the hotel on every page.
  - **Rooms & rates as one screen** per hotel, with price, availability and a health badge for each room.
  - **Bookings and a "Today" home page** built around daily work (arrivals, departures, problems).

---

## 1. Design principle: organise by daily work, not by data tables

- **Admins think in tasks, not records.** Typical questions:
  - "What's happening today?" (arrivals, departures, problems)
  - "Can guests book my hotel?" (rooms, prices, open dates)
  - "Help this guest" (find a booking, change, cancel, refund)
  - "Set up a new property" (once, guided)
- **Three main entry points:**
  - **Today:** operations.
  - **Bookings:** guests.
  - **Properties:** setup and catalogue.
- **Supporting areas** sit around them: reports, guests, staff and settings.

## 2. Navigation

```
STAYWISE                        [Hotel: Bell Hotel ▾]   ← one hotel switcher for the whole app
──────────────────────
◉ Today            dashboard: arrivals, departures, alerts
📅 Bookings         list, calendar, new booking
👤 Guests           profiles, history
🏨 Properties       hotels → each hotel's workspace
   • Rooms & rates
   • Availability
   • Policies
📊 Reports          occupancy, revenue, cancellations
⚙️ Settings         staff & roles, taxes, notifications, audit log
```

- **Global hotel switcher (top bar):**
  - pick the hotel once and every page (rooms, rates, availability, bookings) follows;
  - super admins can choose "All hotels";
  - it replaces the hotel picker currently repeated on the Room types, Base rates and Availability pages.
- **Scope:** the switcher only lists hotels the staff member can access (existing hotel-scope rules).

## 3. Key screens

### 3.1 Today (home)

```
┌ Today · Bell Hotel · Tue 20 Oct ───────────────────────────────┐
│ Arrivals 12   Departures 9   In-house 41   Occupancy 78%       │
├───────────────────────────────┬────────────────────────────────┤
│ Needs attention (3)            │ Arrivals today                  │
│ ⚠ Deluxe King: no price set    │ 14:00  R. Kumar   Deluxe ×1  ✓ │
│ ⚠ Suite: no dates after 30 Nov │ 15:30  A. Shah    Suite  ×1  … │
│ ⚠ 2 payments need review       │ [View all arrivals]            │
├───────────────────────────────┴────────────────────────────────┤
│ Next 14 days: rooms free per night  ▁▃▅▇▅▃▂  [Open availability]│
└────────────────────────────────────────────────────────────────┘
```

- **Needs attention:** combines the readiness check (missing price or dates), payment problems and sold-out nights. Every line links straight to the fix.
- **Today vs the current dashboard:** the current dashboard shows counts and recent hotels; this one tells staff what to *do*.
- **Arrivals / departures:** need the Bookings module (Sprint 2).

### 3.2 Properties → hotel workspace (setup and running)

```
┌ Bell Hotel   ● Published  /bell-hotel   [ⓘ] [Suspend] [⋯]      ┐
│ Overview | Details | Photos | Rooms & rates | Availability | Policies │
└───────────────────────────────────────────────────────────────┘
```

- **New hotels:** see the numbered setup checklist (1–5) until published (built today).
- **Live hotels:** open on **Overview** (guest preview card, health, what's bookable); the steps become ordinary tabs.
- **Same screen, two modes:** one workspace serves both first-time setup and daily running.

### 3.3 Rooms & rates (one place per room)

```
│ Photo  Room          Guests  Rooms  ₹/night  Tonight  Status                      │
│ [img]  Deluxe King   2+1     10     ₹3,500   4 free   ● Bookable       [Edit ▾]   │
│ [img]  Suite         2       2      —        —        ⚠ Missing price  [Set price] │
│                                                              [+ Add room type]    │
```

- **One row per room type:** photo, name, code, capacity, room count, **price per night**, **free tonight**, **health badge**.
- **Health badges:** *Bookable* · *Missing price* · *No open dates* · *Disabled*, each with the fix action beside it.
- **Side panel on click:** tabs **Details · Photos · Price · Availability**, extending the existing "Add room type" panel, so creating and editing a room happen in one place.
- **Row actions:** Edit · Photos · Price · Open dates · **Disable** · **Duplicate**.

### 3.4 Bookings (not built yet; Sprint 2)

```
┌ Bookings  [Search name, phone, booking ID…]  [+ New booking]   ┐
│ Filters: Dates ▾  Status ▾  Room type ▾  Payment ▾  [List|Calendar] │
├────────────────────────────────────────────────────────────────┤
│ SW-10234  R. Kumar   21–23 Oct  Deluxe ×1  ₹7,000  Confirmed  Paid │
│ SW-10233  A. Shah    20–21 Oct  Suite ×1   ₹9,500  Pending    —    │
└────────────────────────────────────────────────────────────────┘
```

- **Two views:**
  - **List:** search and filters.
  - **Calendar / room grid:** rooms down the side, dates across the top, bookings as bars. This is what front desks use most.
- **Booking detail:** guest, stay, rooms, **price breakdown with taxes**, **policy snapshot**, and a payment and refund timeline.
- **Actions:** Modify dates · Cancel (shows the fee before confirming) · Mark no-show · Check in / out · Resend confirmation.
- **Statuses:** booking, payment and refund statuses are shown as separate badges (for example *Cancelled* + *Refund pending*), matching the business rules.

### 3.5 New booking (staff-created), three steps in one panel

```
1 Stay        Dates 21–23 Oct · Guests 2 adults 1 child
2 Room        Deluxe King ₹3,500/night · 4 free   (live availability, holds the room 10 min)
3 Guest & pay Name, phone, email · Total ₹7,000 + GST · [Pay link] [Cash at hotel]
                                                     [Confirm booking]
```

- **Hold:** uses the planned 10-minute hold so two staff can't sell the same room.
- **Transparency:** the total (with tax) and the cancellation terms are shown before confirming.

### 3.6 Add a hotel (guided, short)

- **Step 1:** basics (name, city, contact). Creates a draft in under a minute (built today).
- **Then the workspace checklist guides:** Rooms & rates → Availability → Policies → Publish, with the ⓘ icon showing what's still missing (built today).
- **"Copy from another hotel"** (rooms, policy, amenities) saves chains a lot of time.

### 3.7 Reports and Settings

- **Reports:** occupancy, revenue (with clear definitions), cancellations and no-shows by date range and hotel, plus CSV export.
- **Settings:** staff and roles (who sees which hotels), taxes, notification templates, audit log ("who changed this price").

## 4. Design rules

- **Pick the hotel once**, globally, and remember it.
- **Status in plain words with the fix next to it**, e.g. "⚠ Missing price → Set price".
- **Side panels for edits**, keeping the list visible, instead of separate pages for every edit.
- **Show money impact before confirming:** cancellation fees, refunds, room-count changes.
- **One look everywhere:** the hotel theme, with the inconsistencies from the UI theme audit fixed (`ANALYSIS.md#ui-theme-consistency-audit`).
- **The same screens serve setup and daily work:** the checklist for new hotels, Overview for live ones.

## 5. Phased roadmap

- **Now (MVP setup, mostly built):** hotels, workspace checklist, rooms, rates, availability, policies, publish.
- **Next:**
  - global hotel switcher;
  - Rooms & rates as one table with health badges and a side panel;
  - Overview tab;
  - UI theme fixes.
- **Sprint 2 (planned in `HISTORY.md`):** **Bookings**: list, calendar grid, booking detail, new-booking flow with holds.
- **Then:** payments and refunds timeline, Guests, Today dashboard with live arrivals and departures.
- **Later:** reports, notifications, amenities and policy details, multi-hotel chain tools.

---

## Appendix A — Room types: current state and problems

- **How admins work with rooms today:**
  - **See a hotel's rooms:** workspace → Rooms tab cards (name, code, room count, capacity, photo count; only action "Manage photos").
  - **Edit room details:** separate **Room types** page (pick hotel → Edit). Leaves the workspace.
  - **Set the price:** workspace Rates tab or the separate **Base rates** page. Price is not shown in the room list.
  - **Open dates / block rooms:** workspace Availability tab or the **Availability** page (pick hotel + room again). The calendar shows 14 nights; blocking is one night at a time.
  - **Retire a room type:** **not possible in the UI.** The `disableRoomType` API exists but no screen calls it, and there is no Enable endpoint.
- **Problems (most important first):**
  1. **One room is split across four places** (details, photos, price, availability); the hotel and room are picked again on every page.
  2. **No monitoring view:** the list shows static setup only, not "not bookable", "missing price", "no open dates" or "free tonight", although the data exists.
  3. **Misleading status:** active room types show an amber badge (the Status component has no "active" style, so it falls back to draft).
  4. **Incomplete lifecycle:** no Disable button, no Enable, no Duplicate.
  5. **Workspace room cards can't be edited.**
  6. **Room-count changes have hidden effects** on already-opened future nights; the form asks for a reason but shows no impact.
  7. **The Room types page adds little:** always starts from a picker, no search/sort/cross-hotel view, summary tiles show raw values ("DRAFT").
  8. **Rooms are hard to tell apart:** no bed types, amenities or view in the UI (Phase C, needs product decisions).
- **Quick wins:** fix the active badge colour · add Edit to workspace room cards · show price and a health badge on each card · add a Disable button.

## Appendix B — Hotel tab: current state and target

- **Today (built):** one long page under "1. Hotel & photos": basics (name, web address, description), contact, location (incl. state, PIN code, time zone), photo grid, one "Save hotel" button with unsaved-change protection.
- **What works:** shared Add/Edit form, India-friendly dropdowns and PIN check, safe saving, clean photo pop-up (several photos, descriptions, cover), status actions in the header with the ⓘ "what's missing" icon.
- **Problems:**
  1. **One long page** with a single Save for details and photos; small edits need a full scroll.
  2. **Missing hotel information:**
     - check-in/check-out times;
     - amenities;
     - house rules (children, pets, smoking, ID);
     - star rating;
     - map location (coordinates are supported by the server but have no input);
     - GST registration.
  3. **No guest preview** of how the hotel will look.
  4. **Status/health only in the header:** no "last updated by", no "published since".
  5. **Hidden rules:**
     - changing the web address of a live hotel breaks guest links without warning;
     - the time zone looks editable until saving fails when future bookings exist.
  6. **Photos lack categories** (exterior, lobby, room, dining, pool) and guidance.
  7. **"Hotel & photos" describes setup order,** not tasks.
- **Target sections** (each saving on its own, with a small section menu):
  - **Overview:** guest preview card, status, health, last updated.
  - **Property details:** name, web address (with a live-hotel warning), description, star rating.
  - **Contact & location:** email, phone, address, map pin, time zone (locked with the reason when bookings exist).
  - **Photos:** categories, cover photo, "at least 5 photos" tip.
  - **Amenities:** multi-select facilities.
  - **Policies:** check-in/out times, house rules (cancellation terms stay in their own step).
  - **Tax & billing:** GSTIN, registered business name.
- **Quick wins:**
  - separate Details and Photos saves with a section menu;
  - live-hotel web-address warning;
  - locked time-zone hint;
  - coordinates / map-pin input.

## Decisions needed from product

- **Global hotel switcher** replacing per-page pickers: approve the navigation change.
- **Overview as the default tab** for published hotels.
- **Option lists** for amenities, house rules, bed types, star rating and check-in/out defaults (proposals exist in `ANALYSIS.md`, form field-type analysis).
- **GST / tax fields** and the GSTIN format (marked "unverified – please confirm").
- **Bookings priority:** confirm Sprint 2 scope (list, calendar grid, detail, staff booking with holds).
