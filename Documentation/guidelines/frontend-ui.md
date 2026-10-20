# Frontend & UI Guidelines

This is the single home for frontend and UI rules on the Staywise Hotel Platform: how to build and style screens, and how they must look and behave.

- **What is inside:**
  - **[Frontend Guidelines & Tailwind CSS Architecture](#09-frontend-guidelines)** — Tailwind CSS v4 setup, the theme colour tokens, folder layout, the one-component-per-file rule, typography/button sizes and the async/accessibility rules every screen must follow.
  - **[UI and UX Guidelines](#13-ui-ux-guidelines)** — short guest, admin and accessibility experience rules.
  - **[Hotel Platform UI Generation Brief](#23-ui-generation-brief)** — the full product and screen specification: visual direction, guest and admin routes, what each page must contain, shared components, required interaction states, copy rules, the ready-to-use UI generation prompt and the UI review checklist.
  - **[Admin UI Kit — Reusable Components and Conditions](#admin-ui-kit)** — every reusable admin component, its required behaviour and conditions, the validation contract, suggested folders and the component acceptance checklist.
- **Related documents:**
  - **Product rules:** see [../PRODUCT.md#12-business-rules](../PRODUCT.md#12-business-rules).
  - **API contract:** see [../API.md#08-api-specification](../API.md#08-api-specification).
  - **Backend rules:** see [backend.md](backend.md).
  - **Module behaviour:** see [../modules/index.md](../modules/index.md).

---

<a id="09-frontend-guidelines"></a>
## Frontend Guidelines & Tailwind CSS Architecture

- **Purpose:** This section sets the frontend architecture standards, component design guidelines, styling framework and code organisation rules for the Staywise Hotel Platform.

### 1. Primary Styling Framework: Tailwind CSS v4

- **Required framework:** All web applications (`apps/admin-web`, `apps/guest-web`) MUST use **Tailwind CSS v4**, integrated via `@tailwindcss/vite`.

#### Core Styling Rules

- **Utility-first styling:** All layout, spacing, typography, colours, borders, shadows, flexbox/grid alignments, transitions, and hover/focus/active states MUST be built with **Tailwind CSS utility classes**.
- **No ad-hoc inline styles:** Avoid inline `style={{ ... }}` blocks, except when calculating dynamic pixel transforms or custom dynamic coordinates.
- **Design system theme tokens:** Tailwind utilities use the Staywise platform palette configured in `@theme`:
  - **Dark Forest Green (Sidebar & Brand):** `#173f36` (main), `#12362f` (deep), `#102f2a` (darkest).
  - **Lime Accent (Logo & Nav Highlights):** `#d6ef9e` (main), `#c8e887` (hover).
  - **Deep Forest Primary (Buttons & Actions):** `#1e6354` (primary), `#164d42` (hover), `#e9f3ee` (pale background).
  - **Warm Canvas & Paper:** `#f4f6f3` (canvas background), `#ffffff` (card paper).
  - **Ink & Sage Typography:** `#20322d` (dark ink), `#73827b` (muted ink), `#92b3a3` (sidebar sage), `#e4e9e3` (hairline borders).

### 2. Directory & Code Organization

- **Structure name:** All web applications follow a **Feature-Driven Atomic Component Structure**.
- **Reference tree (verbatim):**

```text
apps/<app-name>/src/
├── components/                  # Reusable UI primitives & common widgets
│   ├── common/                  # Generic UI utilities (Tailwind styled)
│   │   ├── AsyncButton.tsx
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   └── ui/                      # Visual design system primitives (Tailwind styled)
│       ├── Alert.tsx
│       ├── Button.tsx           # Standardized button primitive (sm, md, lg variants)
│       ├── EmptyState.tsx
│       ├── Field.tsx
│       ├── KpiStrip.tsx
│       ├── LoadingRows.tsx
│       ├── MetricCard.tsx
│       ├── Modal.tsx
│       ├── PageHeading.tsx
│       ├── Status.tsx
│       └── index.ts
├── features/                    # Domain-scoped features & complex workflows
│   ├── auth/                    # LoginForm.tsx, ProfileDropdown.tsx
│   ├── hotels/                  # HotelCreateModal.tsx, HotelWorkspace.tsx
│   ├── rooms/                   # RoomCreateModal.tsx
│   ├── rates/                   # BaseRateCard.tsx
│   └── availability/            # AvailabilityCalendar.tsx
├── layout/                      # Application shell layout
│   ├── AppLayout.tsx            # Main shell wrapper (#f4f6f3 canvas background)
│   ├── Sidebar.tsx              # Dark forest green sidebar with lime accents
│   └── Topbar.tsx               # Topbar header & user menu
├── pages/                       # Page-level view targets (routed pages)
│   ├── auth/LoginPage.tsx
│   ├── dashboard/DashboardPage.tsx
│   ├── hotels/HotelsPage.tsx
│   ├── catalog/CatalogPage.tsx
│   └── error/AccessPage.tsx
├── routes/                      # Router & authorization guards
│   ├── AppRoutes.tsx
│   ├── PermissionRoute.tsx
│   └── route-config.ts
├── services/                    # API client services & DTO transformers
│   └── api.ts
├── utils/                       # Pure utility functions & formatters
│   └── helpers.ts
├── styles.css                   # Tailwind CSS v4 entry point & @theme tokens
├── App.tsx                      # Clean root application entry point
└── main.tsx                     # DOM entry point
```

- **Note:** The admin UI kit proposes a different, suggested folder grouping for `apps/admin-web/src/` (`actions/`, `data-display/`, `feedback/`, `forms/`, `layout/`, `overlays/`); see [Suggested component folders](#8-suggested-component-folders). Both are kept as written in their sources.

### 3. Mandatory Component Rules: 1 Component = 1 File

- **Single responsibility files:** Every reusable component MUST live in its own `.tsx` file named after the component (e.g. `Button.tsx`, `MetricCard.tsx`, `Modal.tsx`, `Alert.tsx`).
- **Clean re-exports:** Each component folder (`components/ui/`, `components/common/`) MUST include an `index.ts` re-export file (`import { Alert, Button, Modal, Status } from '@/components/ui'`).
- **Strict type contracts:** Every component MUST export a dedicated TypeScript interface for its props.

### 4. Typography, Icon & Spacing Standards

- **Base root scale:** `:root` font size is `15px` (`body font-size: 0.95rem`) for better legibility on high-DPI displays.
- **Proportional button sizes:**
  - **`sm`:** `text-xs font-semibold py-1.5 px-3.5 min-h-[36px]` with a `16px` icon.
  - **`md`:** `text-sm font-semibold py-2.5 px-4.5 min-h-[42px]` with an `18px` icon.
  - **`lg`:** `text-base font-semibold py-3 px-6 min-h-[48px]` with a `20px` icon.
- **Margin & DevTools cleanliness:**
  - **Nav lists:** Avoid `space-y-*` on navigation item lists; use a flexbox container `flex flex-col gap-1` instead.
  - **Nav links:** Navigation links (`NavItem`) use `m-0` (`margin: 0px`) so no unexpected yellow margin boxes appear in browser inspector tooltips.

### 5. Operational & Accessibility Invariants

- **URL state synchronization:** Search and filter states MUST be serialisable in the URL query string.
- **Indicative search & quote validation:** Treat search results as quotes; inventory is revalidated on the server when holds are requested.
- **Explicit async state machine:** Every data-driven screen explicitly handles `initial`, `loading`, `success / empty`, and `error`.
- **Duplicate submission guarding:** Submit buttons are disabled while requests are in flight (`busy` state), using Tailwind disabled states (`disabled:opacity-50 disabled:cursor-not-allowed`).
- **Accessibility:** Form controls have visible focus rings (`focus:ring-2 focus:ring-[#1e6354] focus:outline-none`), keyboard trap management in modals (`Escape` key), and `role="alert" / role="status"` announcements.

---

<a id="13-ui-ux-guidelines"></a>
## UI and UX Guidelines

### Guest experience

- **Search focus:** Put destination, dates, guests and rooms at the centre of search; preserve choices when navigating.
- **Price clarity:** Show the total stay price and what is included early; distinguish the per-night rate from the total.
- **Before commitment:** Show room capacity, bed/configuration, cancellation terms and taxes before the guest commits.
- **Imagery:** Use real property imagery with useful alt text; avoid implying amenities or availability that are unverified.
- **Checkout summary:** On checkout, summarise dates, room count, guest count, policies and hold expiry before payment.
- **Confirmation wording:** Confirmation must clearly distinguish "booking confirmed" from "payment pending".

### Admin experience

- **Guided setup:** Organise property setup as a guided sequence: property → room types → inventory/rates → publish.
- **Calendar views:** Calendars distinguish available, held, booked and blocked quantities and show the date/time zone.
- **Risky actions:** Destructive or financial actions show their impact, require confirmation and capture a reason.
- **Lists:** Lists provide filters, pagination, empty/loading/error states and keyboard-accessible controls.

### Accessibility and responsive design

- **Target:** WCAG 2.2 AA where practical.
- **Support required:** Keyboard-only usage, screen-reader labels, visible focus, sufficient contrast, reduced motion, responsive tables and touch-friendly controls.
- **Dates and errors:** Validate date inputs and announce errors near the relevant field.

---

<a id="23-ui-generation-brief"></a>
## Hotel Platform UI Generation Brief

- **How to use:** Use this brief as the product and screen specification when generating the first complete UI for the hotel platform.
- **Branding:** The working product name is **Staywise**; treat it as replaceable branding.

### 1. Product experience

- **Goal:** Build a trustworthy hotel booking experience for guests and an efficient operations console for hotel staff.
  - **Guests need:** confidence in availability, total price, cancellation terms and payment status.
  - **Staff need:** clear hotel scope, safe inventory controls and traceable booking actions.
- **Positioning:** This is a real booking product, not a generic travel landing page or admin template. Prioritise readable information, clear decisions and complete realistic states over decorative effects.

### 2. Visual direction

- **Mood:** A calm, editorial hospitality visual system: warm white/soft stone surfaces, deep ink text, one restrained forest/teal accent, and a warm secondary highlight used sparingly.
- **Fonts:** A distinctive but highly readable sans-serif for interface text, and an optional restrained display face for major guest-facing headlines; define the font choices as design tokens.
- **Layout feel:** Generous whitespace, clear typographic hierarchy, consistent spacing, thin borders, subtle radii and minimal shadows.
- **Photography:** Real hotel photography with intentional crops and consistent aspect ratios; avoid repeated placeholder gradients, random stock collage, emoji icons or unrelated illustrations.
- **Icons:** Use one consistent icon library; do not mix icon styles.
- **Tone:** Premium, practical and credible rather than luxury-themed by default. Do not rely on gold, black backgrounds, glassmorphism, oversized pill controls or excessive animations.
- **Responsiveness:** Guest flows are designed mobile-first; admin operations are desktop-first in density, with full mobile support for key admin tasks.

### 3. Design and implementation constraints

- **Stack:** React, TypeScript and Tailwind CSS. Build reusable components and design tokens rather than page-specific one-off styling.
- **Accessibility:** Semantic HTML, accessible labels, keyboard navigation, visible focus, sufficient contrast and reduced-motion support.
- **Sample data:** Use realistic fictional hotels, room types, prices, policies, guest names, booking references and operational data; never use lorem ipsum.
- **Dates and money:** Keep dates as hotel-local stay dates. Always label currency and distinguish nightly price from full-stay total.
- **Truthfulness:** The UI may show quote estimates, but must never imply availability or payment success is final before the server confirms it.
- **States:** Every page with data must include loading, empty, error and success states. Forms must show inline validation, a submitting state and recoverable server errors.
- **Out of scope:** Do not add unsupported features such as AI chat, loyalty points, maps with live data, channel manager sync, or invented payment provider behaviour.

### 4. Information architecture

#### Guest website navigation

- **Header:** logo, destination/search entry point, help link, sign-in/account menu.
- **Footer:** customer support, terms, privacy, cancellation information and contact links.
- **Search criteria:** remain visible or easy to edit on results and hotel detail pages.
- **Guest routes:**
  - **`/`:** destination and stay search home.
  - **`/search`:** filtered hotel results.
  - **`/hotels/:slug`:** hotel detail and available room types.
  - **`/checkout/:holdId`:** guest details, policy acceptance and payment step.
  - **`/booking/:reference/confirmation`:** booking result and next steps.
  - **`/account`:** guest profile and booking history.
  - **`/account/bookings/:reference`:** booking detail, cancel eligibility and receipt.
  - **`/auth/sign-in`, `/auth/register`, `/auth/forgot-password`:** account flows.

#### Admin console navigation

- **Persistent sidebar:** Overview, Hotels, Room Types, Availability & Rates, Bookings, Guests, Reviews, Reports, Staff & Roles, Audit Log.
- **Permissions:** Only show permitted actions, while assuming the API independently enforces every permission.
- **Admin routes:**
  - **`/admin/login`:** staff sign-in.
  - **`/admin`:** operational overview.
  - **`/admin/hotels` and `/admin/hotels/:id`:** hotel directory and hotel workspace.
  - **`/admin/room-types`:** room type catalog.
  - **`/admin/inventory`:** availability calendar and blocks.
  - **`/admin/rates`:** base and date-specific pricing.
  - **`/admin/bookings` and `/admin/bookings/:id`:** booking operations.
  - **`/admin/guests` and `/admin/guests/:id`:** guest lookup and booking history.
  - **`/admin/reviews`:** moderation queue.
  - **`/admin/reports`:** metrics and reports.
  - **`/admin/staff`, `/admin/roles`:** staff and access management.
  - **`/admin/audit-log`:** searchable activity history.

### 5. Guest pages and content requirements

#### Home/search page

- **Hero:** A concise booking-focused heading and a prominent search form with destination, check-in, checkout, rooms, adults, and children if supported.
- **Other content:** An editorial destination/hotel feature area, a small trust/support strip, and a clear explanation of what the displayed price includes.
- **Mobile rule:** Do not let marketing content push the search form below the first viewport on mobile.
- **Search form behaviour:** Checkout must follow check-in; guests/rooms must be positive; date selection uses local calendar dates. Show field-level validation and keep entered criteria after submission.

#### Search results page

- **Page parts:** A compact editable search summary, result count, sort control, filter panel/drawer, active filter chips, and hotel result cards.
- **Each card includes:** property image, name, city/neighbourhood, rating/review count, key amenities, matching room type, cancellation summary, full-stay price, per-night context, taxes/fees inclusion and availability note.
- **Loading and paging:** Pagination or accessible load-more behaviour, skeleton cards, no-results suggestions and a retryable error state.
- **Filters:** price range, property rating, amenities and room type. Filters must be removable one at a time and all at once.
- **Indicative results:** Search results are indicative; make it clear that availability and rate are confirmed when a hold is created.

#### Hotel detail page

- **Above the fold:** breadcrumb, property name/location, rating and review link, photo gallery, and a stay-summary bar with editable dates/guests.
- **Sections:** overview, amenities, location/address, check-in/out, cancellation policies, room types, reviews and help/contact.
- **Room type cards:** capacity, bed setup, included amenities, nightly rate, stay total, taxes/fees, refundable terms and available-quantity language.
- **Next step:** Selecting a room type advances to a server-validated hold flow.

#### Checkout page

- **Step layout:** stay/room summary, guest contact details, policy acceptance, price breakdown, and payment choice when enabled.
- **Hold countdown:** Show the hold expiration countdown without panic language.
- **States shown:** field validation, refreshed quote/price-change confirmation, hold-expired recovery path, payment pending/failure state, and a disabled submitting button during requests.
- **Confirmation rule:** Never show "confirmed" until confirmation is returned by the API.

#### Confirmation page

- **Content:** clear booking status, unique reference, hotel, stay dates, guest/room summary, payment state, cancellation terms, price summary, contact/support information and receipt action.
- **Status distinction:** Distinguish confirmed, payment pending and manual review states visually and in text.

#### Sign-in, registration, recovery

- **Forms:** Focused forms with email, password, password visibility control, validation, password reset request and success states.
- **No false claims:** Do not claim Google/OTP login is available unless implemented.
- **Safe recovery:** Give a safe generic recovery confirmation that does not reveal whether an account exists.

#### Guest account and booking detail

- **Account overview:** profile/contact, upcoming and past stays, clear status badges and sign-out.
- **Booking detail:** saved booking snapshot, property-local dates, payment/refund state, receipt download, and a cancellation action only when allowed.
- **Cancellation preview:** Explains the fee and expected refund before final confirmation.

### 6. Admin pages and content requirements

#### Admin login

- **Content:** Minimal staff sign-in with email/password, show/hide control, validation, generic auth error, lockout/rate-limit message, MFA challenge state and support contact.
- **Separation:** Do not expose guest login controls in the admin portal.

#### Operations overview

- **Header:** date range and selected hotel scope.
- **Cards:** arrivals today, departures today, confirmed room-nights/occupancy, pending payment/review exceptions, and cancellations/refunds needing attention.
- **Extras:** an upcoming arrivals table and operational alerts.
- **Metric rules:** Every metric has definition context, loading/empty/error states and a link to filtered records; do not invent revenue figures without a selected date basis.

#### Hotel directory and hotel workspace

- **Directory:** search, city/status filters, property table/cards and a create hotel action.
- **Workspace tabs:** Overview, Content & Photos, Policies, Room Types and Activity.
- **Form validation:** Create/edit forms validate required name, address, city, country, timezone, contact and slug.
- **Publish rule:** Publish requires all required content and at least one valid room type/inventory setup.
- **Suspend/archive:** Requires a clear consequence confirmation and preserves future booking operations.

#### Room type catalog and editor

- **Table columns:** hotel, room name, occupancy, total rooms, base rate, status and actions.
- **Editor fields:** name, description, adult/child capacity, beds, amenities, images, room count and currency/rate.
- **Validation:** positive integer capacity/count, supported occupancy, non-negative rates, and inventory commitments checked before reducing room count.

#### Availability calendar

- **Controls:** hotel and room type selectors, date range navigation and a legend.
- **Per-night counts:** total, available, held, confirmed and blocked.
- **Date detail:** Selecting a date opens a detail panel with bookings/blocks and audited actions.
- **Maintenance block flow:** Captures date range, quantity, reason and confirmation; reject any edit that violates existing holds/bookings.
- **Dates and mobile:** Distinguish property-local dates and offer a mobile alternative (date list) rather than a compressed unreadable grid.

#### Rates editor

- **Layout:** base rate plus a date-specific rule table/calendar.
- **Rule form:** effective dates, amount, currency, priority and restrictions.
- **Preview:** Preview affected dates and price impact before save.
- **Rejections:** invalid date ranges, negative amounts, unsupported currencies and ambiguous overlapping rules.
- **Warning:** Clearly warn that confirmed bookings keep their original price snapshot.

#### Booking directory and booking detail

- **Directory:** search by reference/guest, hotel selector, stay-date range, booking/payment/refund status filters, pagination, and export only if authorised.
- **Detail:** guest/contact, hotel/room type, stay dates, price/policy snapshot, separate booking/payment/refund timelines, notes and audit trail.
- **Actions:** check-in, checkout, cancel, no-show and walk-in are status- and permission-aware, require confirmation and a reason where required, and show API errors inline.

#### Guest directory and guest detail

- **Search:** by guest name/email/phone, with masked contact details where practical.
- **Detail:** profile status, booking history, aggregate metrics with definitions and audit-relevant actions.
- **Suspend/reactivate:** Requires permission, reason and confirmation; do not display secrets or full payment data.

#### Reviews moderation

- **Queue:** tabs for pending/approved/rejected, hotel/rating/date filters, review text, stay verification indicator and property context.
- **Actions:** Approve/reject/remove require permission; rejection/removal can capture a reason.
- **Visibility:** Public visibility status is explicit.

#### Reports

- **Filters:** hotel scope, date range, date basis and currency.
- **Definitions:** Show definitions beside revenue, occupancy, cancellation and refund metrics.
- **Charts:** Have accessible summaries and tabular data alternatives.
- **Export:** Export controls appear only to authorised users; use an async export status state for large files.

#### Staff and roles

- **Staff list:** name/email, status, roles, hotel scope, last activity and actions.
- **Invitation drawer:** validates email, role and allowed hotel scope.
- **Role editor:** groups permission keys by domain, shows sensitive permissions distinctly, offers a before/after diff, and prevents self-elevation or removing the last super admin.
- **Security note:** Do not rely on hiding a permission control for security.

#### Audit log

- **Search:** by actor, action, hotel, resource, result and date range.
- **Rows:** timestamp, actor, action, target, outcome and reason.
- **Detail drawer:** a redacted before/after diff and correlation ID.
- **Export and data:** Export is permission-gated and audited. Never render secrets or excessive guest data.

### 7. Shared reusable UI components

- **Component set to build:** `Button`, `TextInput`, `TextArea`, `NumberInput`, `CurrencyInput`, `Select/Combobox`, `DatePicker`, `DateRangePicker`, `Checkbox`, `RadioGroup`, `Switch`, `FileUpload`, `FormField`, `DataTable`, `Pagination`, `FilterBar`, `StatusBadge`, `MetricCard`, `InlineAlert`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Dialog`, `ConfirmDialog`, `Drawer`, `Tabs`, `Breadcrumbs`, `PageHeader`, `AdminLayout`, `HotelSelector`, `StayDateRangeField`, `OccupancyInput`, `AvailabilityCalendar`, `RateEditor` and `BookingStatusTimeline`.
  - **Detailed behaviour:** Each of these is specified in the [Admin UI Kit](#admin-ui-kit).
- **Per-component requirements:** typed props, keyboard support, visible focus, loading/disabled/error states as appropriate, and documented validation boundaries.
- **Validation authority:** UI validation improves usability; the backend remains authoritative for access, availability, price, policy and persisted state.

### 8. Required interaction states

- **States to design for every data-driven screen (where relevant):** first load, refresh load, populated, empty, filtered-empty, validation error, unauthorized, not found, API/server error, offline/retry, submitting, success, conflict (inventory changed), expired hold, stale price, and permission-denied action.
- **Long operations:** Do not use a generic spinner as the only response to a long-running operation.

### 9. Copy and data rules

- **Copy style:** Concise, human-readable copy that explains next steps and consequences.
- **Sample market:** Use believable synthetic example properties in India only if the launch market remains India; mark all values as sample content.
- **Tax/payment copy:** Never hardcode authoritative tax or payment behaviour in UI copy before business approval.
- **Amounts:** Format amounts with currency code/symbol and never label a nightly amount as the stay total.
- **Dates:** Use property-local dates and clearly show timezone in admin scheduling views.
- **Status and errors:** Use text labels alongside status colours and give precise form error messages.

### 10. Ready-to-use UI generation prompt

- **How to use:** Copy the prompt below into the UI generator. Attach or paste this brief and the project context documents as references.

```text
Act as a senior product designer and frontend engineer. Generate a complete, coherent, production-quality UI for the Staywise hotel booking and operations platform described in the attached Hotel Platform UI Generation Brief and project context. Follow those requirements exactly; do not invent conflicting product behavior.

TECH STACK
- React, TypeScript, and Tailwind CSS.
- Build reusable typed components and shared design tokens; keep guest and admin route areas distinct.
- Use semantic HTML and accessible interaction patterns.

DESIGN DIRECTION
- Create a calm, editorial hospitality visual system with warm white/stone surfaces, deep ink text, a restrained forest/teal accent, and a small warm highlight.
- Use a deliberate typographic scale, generous but controlled spacing, consistent borders/radii, and minimal shadows.
- Use consistent, high-quality hotel photography and one icon family. Avoid emoji, random stock collages, generic gradients, glassmorphism, excessive pills, and template-dashboard styling.
- Optimize guest flows mobile-first and admin data density for desktop while keeping critical admin actions usable on mobile.

SCOPE
- Implement every guest page, admin page, route, reusable component, interaction, validation rule, and state listed in the attached brief.
- Include realistic synthetic hotels, room types, rates, booking references, policies, and operations data; do not use lorem ipsum.
- Show loading, empty, filtered-empty, error, unauthorized, submitting, success, conflict, expired-hold, and stale-price states where applicable.
- Search results are indicative. Show that availability and pricing are revalidated when a hold is requested. Never claim payment or booking is confirmed before an explicit successful server state.
- Keep booking, payment, and refund statuses distinct. Show total stay price separately from nightly rate and label currency/tax inclusion.
- Guest date ranges use hotel-local stay dates. Admin calendar and rate tools clearly identify property timezone.
- Use reusable components specified in the brief. Forms show inline errors, accessible labels, and recoverable server errors.
- Frontend validation is for usability only; do not present it as a replacement for server-side authorization or business rules.

QUALITY BAR
- Make every screen feel like part of one intentionally designed product, with consistent navigation, spacing, colors, typography, table/form patterns, and status semantics.
- Establish a strong visual hierarchy and ensure each page has a clear primary task.
- Avoid overcrowding: prioritize the essential information and place secondary details in tabs, drawers, or progressive disclosure.
- Ensure keyboard navigation, visible focus, screen-reader labels, sufficient contrast, reduced-motion support, and responsive behavior.
- Use working navigation and meaningful interactions; controls must not be decorative dead ends. Where a real backend is unavailable, use clearly isolated mock data and simulated states without implying live payment or inventory.
- Do not omit complex admin pages such as inventory calendar, role editor, booking details, reports, or audit log merely to make the prototype smaller.

DELIVERABLE
Produce the complete UI with a reusable component system, guest and admin route structures, realistic sample data, responsive layouts, and the interaction states above. Before finishing, review every route against the attached screen list and correct any visual inconsistency, missing state, inaccessible control, or unsupported product claim.
```

### 11. UI review checklist

- [ ] **Routes:** All guest and admin routes listed above exist and navigate coherently.
- [ ] **Mobile journey:** Main guest booking journey works from search through booking result on mobile.
- [ ] **Price clarity:** Room rate and full-stay total are never visually confused.
- [ ] **Truthful states:** Search, hold, payment and cancellation states are visually distinct and truthful.
- [ ] **Admin scope:** Admin hotel scope and permission-sensitive actions are visible and understandable.
- [ ] **Calendar safety:** Availability calendar explains quantities and prevents unsafe-looking edits.
- [ ] **Form states:** Every form has required, invalid, submitting and server-error states.
- [ ] **Table states:** Every table/page has loading, empty, error and pagination/filter behaviour.
- [ ] **Shared components:** Shared components use consistent styling and accessible keyboard behaviour.
- [ ] **No false claims:** No unsupported features or unapproved tax/payment claims appear in the UI.

---

<a id="admin-ui-kit"></a>
## Admin UI Kit — Reusable Components and Conditions

### Purpose

- **What it defines:** The reusable interface components for the hotel platform admin app.
- **Principle:** Build shared components once, keep domain-specific rules in feature forms/services, and make validation and access checks consistent across screens.

### Component standards

- **Stack and independence:** Use React, TypeScript and Tailwind CSS; keep shared UI components independent of hotel API/domain models where practical.
- **Interaction basics:** Every interactive component supports keyboard use, visible focus, an accessible name, and a disabled/busy state when applicable.
- **Form control props:** Form controls expose `value`, `onChange`, `name`, `id`, `disabled`, `required`, `error` and `helpText` as appropriate.
- **Validation display:** Validation appears beside the relevant field, explains how to fix the problem, and is announced to assistive technology.
- **Validation timing:** Validate immediately for format/range errors and on submit for required fields; server validation remains authoritative.
- **Responsibility split:** Reusable UI components render validation and state; feature forms own the actual business rules and API calls.
- **No colour-only meaning:** Never use colour alone to communicate status, validation, availability or permission.

### 1. Application shell and navigation

#### `AdminLayout`

- **Layout:** Provides sidebar, header, page content region, responsive layout and current-user menu.
- **Scope:** Shows the active hotel/property scope for scoped managers.
- **Session states:** Handles session loading, unauthenticated redirect and access-denied state.

#### `AdminSidebar` and `AdminNavItem`

- **Permission-driven:** Render navigation items from the user's effective permissions.
- **Navigation:** Highlight the current route and support keyboard navigation and mobile collapse.
- **Not security:** Hiding a menu item is only a UI convenience; API routes must still enforce permission.

#### `PageHeader`

- **Content:** Title, optional description, breadcrumbs, scope label, and primary/secondary actions.
- **Pending actions:** Disables actions while the related operation is pending and provides accessible button labels.

#### `Breadcrumbs`

- **Hierarchy:** Shows the current hierarchy with links for prior levels and plain text for the current page.
- **Semantics:** Uses semantic navigation markup and identifies the current page accessibly.

### 2. Feedback and loading components

#### `Button`

- **Variants and sizes:** primary, secondary, danger, quiet and link variants, with small/medium/large sizes (Tailwind classes for `sm`/`md`/`lg` are in [Typography, Icon & Spacing Standards](#4-typography-icon--spacing-standards)).
- **Options:** `isLoading`, `disabled`, `type`, icon and accessible label.
- **Loading safety:** Loading state prevents repeated clicks and announces progress; destructive actions should not be triggered by accidental form submission.

#### `ToastProvider` and `Toast`

- **Message types:** success, error, warning and informational, with optional action and dismiss control.
- **Announcement:** Announces messages with an appropriate live region and does not rely on colour alone.
- **Limit:** Do not use a toast as the only place for persistent payment, refund or validation errors.

#### `InlineAlert`

- **Use:** Shows persistent page- or form-level information, warnings and errors.
- **Options:** title, description, severity, optional link/action, and dismissibility where safe.

#### `Spinner`, `Skeleton`, and `PageLoader`

- **Coverage:** Consistent loading indicators for buttons, content blocks, tables, calendars and route transitions.
- **Layout stability:** Preserve the approximate final layout to reduce page movement, and announce longer blocking loads.

#### `EmptyState` and `ErrorState`

- **Explain and act:** Explain why no records are shown and provide a relevant next action or retry option.
- **Permission-aware:** Avoid suggesting a create action when the user lacks permission to create.

### 3. Form building blocks

#### `FormField`

- **Wraps:** label, required marker, help text, control, character count and validation message.
- **Wiring:** Connects labels and errors to the control with `htmlFor`, `aria-describedby` and `aria-invalid`.
- **Required marker:** Required state must be conveyed in text or accessible metadata, not only with an asterisk.

#### `TextInput` and `TextArea`

- **Support:** input type, max length, autocomplete, read-only, disabled, required and error states.
- **Normalisation:** Trim/normalise input where appropriate before submission; do not silently change text while the user is typing.
- **Max length:** Enforce maximum length in the UI and again on the API.

#### `NumberInput` and `CurrencyInput`

- **Support:** minimum, maximum, step, precision display and locale-aware formatting.
- **Rejections:** empty, non-finite, negative and out-of-range values, according to the feature rule.
- **Money:** Currency input shows the currency clearly and stores/sends integer minor units; do not use floating-point arithmetic for money.

#### `Select` and `Combobox`

- **Support:** single or multiple values, search, clear, loading, empty, disabled and error states.
- **Keyboard:** Combobox options must be keyboard navigable and announce result counts and selection.
- **Submit check:** Validate that selected IDs are still available and authorised when submitting.

#### `DatePicker` and `DateRangePicker`

- **Support:** minimum/maximum dates, disabled dates, clear, keyboard navigation and timezone/date hints.
- **Date-only safety:** Hotel stay dates use the property's local calendar; never silently convert a date-only value through the browser timezone.
- **Ordering and timezone:** Check-in must precede checkout; rate and inventory calendars must show the applicable property timezone.

#### `Checkbox`, `RadioGroup`, and `Switch`

- **Which to use:** checkbox for independent options, radio for one-of-many choices, switch for immediate on/off settings.
- **Labels and state:** Use a visible text label and expose checked/disabled/error state accessibly.
- **Confirmation:** Confirm consequential publication, access or inventory changes where required.

#### `FileUpload` and `ImageUploader`

- **Features:** drag/drop and file-picker selection, preview, reorder, primary image, alt text and removal.
- **Validation (client and server):** extension, actual MIME/content, file size, image dimensions and upload count.
- **Feedback:** Show upload progress and retryable errors; reject unsupported files with actionable messages.
- **MIME trust:** Never trust the browser-provided MIME type as the only validation.

### 4. Data display components

#### `DataTable`

- **Support:** typed columns, server-side pagination, sorting, row selection where needed, loading, empty and error states.
- **Server authority:** Sort keys and page limits are allowlisted by the API; do not assume client sorting is authoritative.
- **Row actions:** Permission-aware, keyboard accessible and visually separated from row navigation.
- **Narrow screens:** Provide responsive alternatives rather than clipping essential actions.

#### `Pagination`

- **Support:** current page, page size, total count, first/previous/next/last controls and configurable page sizes.
- **Clamping:** Clamp page and page size to valid values, and reset to page one when filters materially change.
- **Announcement:** Announce updated result ranges to assistive technology.

#### `FilterBar` and `SearchInput`

- **Support:** debounced text search, filters, clear-all, active filter chips, and URL synchronisation where appropriate (URL state rule also stated in [09-frontend-guidelines](#5-operational--accessibility-invariants)).
- **Debounce limit:** Debounce only read queries; never debounce financial or inventory mutations.
- **Serialisation:** Validate filter ranges and serialise only supported query parameters.

#### `StatusBadge`

- **Mapping:** Maps a known status enum to a consistent label, icon/tone and accessible text.
- **Unknown values:** Use a neutral fallback and should be logged for investigation.
- **No colour-only:** Do not use colour as the only status indicator.

#### `CurrencyAmount` and `DateTimeDisplay`

- **Currency formatting:** Use explicit currency and locale settings; show the currency code when ambiguity is possible.
- **Time formatting:** Format timestamps in the relevant property timezone and distinguish local stay dates from UTC event times.
- **No maths in display:** Never calculate totals inside display components; render server-calculated amounts.

#### `MetricCard` and `ChartCard`

- **Support:** title, value, unit, date range, comparison context, loading, empty and error states.
- **Charts:** Include text summaries or accessible data tables for charts; do not show trends through colour alone.
- **Scope and definitions:** Respect the viewer's hotel scope and use documented report definitions.

### 5. Overlay and navigation components

#### `Dialog` and `ConfirmDialog`

- **Support:** title, description, primary/secondary actions, focus trap, Escape behaviour and focus return.
- **Effect description:** Destructive, refund, cancellation and inventory-changing confirmations describe the effect before execution.
- **Not authorisation:** Confirmation dialogs do not replace server authorisation or business validation.

#### `Drawer`

- **Support:** left/right placement, size variants, title, close action, scrollable content and footer actions.
- **Focus:** Trap focus while open, close with Escape when safe, and return focus to the trigger.
- **Unsaved data:** Warn before discarding unsaved form changes; keep entered data when a recoverable API error occurs.

#### `Tabs`

- **Accessibility:** Keyboard navigation and accessible tab/panel relationships.
- **Unsaved edits:** Preserve unsaved edits when switching tabs, or warn before discarding them.

#### `DropdownMenu`

- **Support:** keyboard selection, disabled items, separators and accessible trigger naming.
- **Permissions:** Hide or disable actions according to permissions, while the server remains the enforcement point.

### 6. Hotel-domain reusable components

#### `HotelSelector`

- **Search:** Search hotels available to the current user and show the active hotel scope.
- **Who sees what:** Super admins may select any hotel; hotel managers only see assigned hotels.
- **Backend check:** Revalidate selected hotel authorisation on the backend for every request.

#### `StayDateRangeField`

- **Capture:** Check-in and checkout dates with property timezone and date-only semantics.
- **Rules:** Requires checkout after check-in and applies configured booking-window and maximum-stay rules.
- **Unavailable dates:** Show validation for unavailable dates only after an authoritative availability query.

#### `OccupancyInput`

- **Capture:** room count, adults, and children/ages if the product supports them.
- **Rules:** Requires positive room and guest counts; room-type capacity rules are enforced on the server.
- **Allocation clarity:** Prevents ambiguous guest allocation by showing how guests map to requested rooms.

#### `AvailabilityCalendar`

- **Counts:** Displays per-night total, blocked, held, confirmed and available room counts.
- **Presentation:** Uses property local dates, accessible text labels, and a legend that does not depend on colour.
- **Safety:** Prevents a manual total reduction that would violate held, confirmed or blocked inventory.
- **Saving:** Shows a pending save state and requires a reason for manual adjustments.
- **Page-level spec:** see [Availability calendar](#availability-calendar) in the brief.

#### `RateEditor`

- **Support:** base and date-specific nightly rates with currency and effective date range.
- **Validation:** non-negative valid amounts, date range ordering, currency consistency and rule overlap policy.
- **Bulk changes:** Previews affected dates and requires explicit save confirmation for bulk rate changes.
- **Page-level spec:** see [Rates editor](#rates-editor) in the brief.

#### `BookingStatusTimeline`

- **Tracks:** Displays booking and payment timelines as separate state tracks.
- **Event detail:** Shows event time, actor/source and useful status descriptions.
- **Server history only:** Uses server event history and cannot allow arbitrary client-side status changes.

#### `PolicyEditor`

- **Edits:** check-in/out times, cancellation deadlines, fee rules and guest conditions.
- **Validation:** time formats, cutoff ranges, non-negative fees and required policy text.
- **Change warning:** Warns that policy changes apply to future bookings unless an explicit migration/override workflow exists.

### 7. Reusable component validation contract

- **Sequence:** Every form component and feature form follows these steps in order:
  1. **Input validation:** required value, type, length, format and range are checked before submission.
  2. **Cross-field validation:** dependent values such as check-in/checkout or min/max rate are checked together.
  3. **Server validation:** the API validates permissions, current inventory, current policy and persisted state again.
  4. **Error mapping:** known API error codes map to the relevant field or form-level alert; unknown errors get a safe generic message and request ID.
  5. **Success feedback:** show confirmation only after the server reports a persisted success state.
- **No security in the frontend:** Never rely on frontend validation for security or data integrity.
- **Schema location:** Keep validation schemas close to feature forms and share them only where client/server compatibility is reliable.

### 8. Suggested component folders

- **Suggested tree (verbatim):**

```text
apps/admin-web/src/
  app/                         # router, providers, permission-aware layout
  components/
    actions/                   # Button, DropdownMenu, ConfirmDialog
    data-display/              # DataTable, Pagination, StatusBadge, MetricCard
    feedback/                  # Toast, InlineAlert, EmptyState, Skeleton
    forms/                     # FormField, inputs, Select, DatePicker, FileUpload
    layout/                    # AdminLayout, Sidebar, PageHeader, Breadcrumbs
    overlays/                  # Dialog, Drawer, Tabs
  features/
    hotels/                    # HotelSelector, HotelForm, hotel-specific rules
    room-types/                # RoomTypeForm, capacity controls
    inventory/                 # AvailabilityCalendar, inventory adjustments
    rates/                     # RateEditor and rate validation
    bookings/                  # BookingStatusTimeline, booking actions
    reports/                   # report filters, charts and tables
```

- **Placement rule:** Generic components belong in `components/`; components with hotel-specific rules belong in `features/`.
- **Composition:** Feature forms compose shared controls instead of duplicating their behaviour.
- **Note:** This differs from the mandated tree in [Directory & Code Organization](#2-directory--code-organization); both are kept as in their sources.

### 9. Component acceptance checklist

- [ ] **Single responsibility:** Component has a clear single responsibility and typed public props.
- [ ] **States:** Component supports loading, disabled, error, empty and success states where relevant.
- [ ] **Form accessibility:** Form controls have labels, help text, accessible errors and keyboard support.
- [ ] **Validation coverage:** Validation covers required, type, format, length, range and dependent-field conditions as applicable.
- [ ] **No business rules:** Component does not own API business rules or trust client-provided authorisation.
- [ ] **Responsive:** Component handles responsive layouts and avoids clipping essential actions.
- [ ] **Consistency:** Component uses consistent visual tokens and status semantics.
- [ ] **Documented:** Component is documented with a short usage example and edge cases.
- [ ] **Proven reuse:** Shared component is verified in at least two feature contexts before broad reuse.
