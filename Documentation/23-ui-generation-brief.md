# Hotel Platform UI Generation Brief

Use this document as the product and screen specification when generating the first complete UI for the hotel platform. The working product name is **Staywise**; treat it as replaceable branding.

## 1. Product experience

Build a trustworthy hotel booking experience for guests and an efficient operations console for hotel staff. Guests need confidence in availability, total price, cancellation terms, and payment status. Staff need clear hotel scope, safe inventory controls, and traceable booking actions.

This is a real booking product, not a generic travel landing page or admin template. Prioritize readable information, clear decisions, and complete realistic states over decorative effects.

## 2. Visual direction

- Create a calm, editorial hospitality visual system: warm white/soft stone surfaces, deep ink text, one restrained forest/teal accent, and a warm secondary highlight used sparingly.
- Use a distinctive but highly readable sans-serif for interface text and an optional restrained display face for major guest-facing headlines; define the font choices as design tokens.
- Use generous whitespace, clear typographic hierarchy, consistent spacing, thin borders, subtle radii, and minimal shadows.
- Use real hotel photography with intentional crops and consistent aspect ratios; avoid repeated placeholder gradients, random stock collage, emoji icons, or unrelated illustrations.
- Keep icons from one consistent icon library; do not mix icon styles.
- Make the interface feel premium, practical, and credible rather than luxury-themed by default. Do not rely on gold, black backgrounds, glassmorphism, oversized pill controls, or excessive animations.
- Use a responsive layout designed from mobile upward for guest flows and desktop-first density for admin operations, with full mobile support for key admin tasks.

## 3. Design and implementation constraints

- Use React, TypeScript, and Tailwind CSS. Build reusable components and design tokens rather than page-specific one-off styling.
- Use semantic HTML, accessible labels, keyboard navigation, visible focus, sufficient contrast, and reduced-motion support.
- Use realistic fictional hotels, room types, prices, policies, guest names, booking references, and operational data; never use lorem ipsum.
- Keep dates as hotel-local stay dates. Always label currency and distinguish nightly price from full-stay total.
- The UI may show quote estimates, but must never imply availability or payment success is final before the server confirms it.
- Every page with data must include loading, empty, error, and success states. Forms must show inline validation, submitting state, and recoverable server errors.
- Do not add unsupported features such as AI chat, loyalty points, maps with live data, channel manager sync, or invented payment provider behavior.

## 4. Information architecture

### Guest website navigation

Header: logo, destination/search entry point, help link, sign-in/account menu. Footer: customer support, terms, privacy, cancellation information, and contact links. Search criteria remain visible or easy to edit on results and hotel detail pages.

Guest routes:

- `/` — destination and stay search home
- `/search` — filtered hotel results
- `/hotels/:slug` — hotel detail and available room types
- `/checkout/:holdId` — guest details, policy acceptance, and payment step
- `/booking/:reference/confirmation` — booking result and next steps
- `/account` — guest profile and booking history
- `/account/bookings/:reference` — booking detail, cancel eligibility, and receipt
- `/auth/sign-in`, `/auth/register`, `/auth/forgot-password` — account flows

### Admin console navigation

Persistent sidebar: Overview, Hotels, Room Types, Availability & Rates, Bookings, Guests, Reviews, Reports, Staff & Roles, Audit Log. Only show permitted actions, while assuming the API independently enforces every permission.

Admin routes:

- `/admin/login` — staff sign-in
- `/admin` — operational overview
- `/admin/hotels` and `/admin/hotels/:id` — hotel directory and hotel workspace
- `/admin/room-types` — room type catalog
- `/admin/inventory` — availability calendar and blocks
- `/admin/rates` — base and date-specific pricing
- `/admin/bookings` and `/admin/bookings/:id` — booking operations
- `/admin/guests` and `/admin/guests/:id` — guest lookup and booking history
- `/admin/reviews` — moderation queue
- `/admin/reports` — metrics and reports
- `/admin/staff`, `/admin/roles` — staff and access management
- `/admin/audit-log` — searchable activity history

## 5. Guest pages and content requirements

### Home/search page

Hero contains a concise booking-focused heading and a prominent search form with destination, check-in, checkout, rooms, adults, and children if supported. Include an editorial destination/hotel feature area, a small trust/support strip, and a clear explanation of what the displayed price includes. Do not let marketing content push the search form below the first viewport on mobile.

Search form behavior: checkout must follow check-in; guests/rooms must be positive; date selection uses local calendar dates. Show field-level validation and retain entered criteria after submission.

### Search results page

Show a compact editable search summary, result count, sort control, filter panel/drawer, active filter chips, and hotel result cards. Each card includes property image, name, city/neighborhood, rating/review count, key amenities, matching room type, cancellation summary, full-stay price, per-night context, taxes/fees inclusion, and availability note. Include pagination or accessible load-more behavior, skeleton cards, no-results suggestions, and retryable error state.

Filters: price range, property rating, amenities, and room type. Filters must be removable individually and all at once. Search results are indicative; make it clear that availability and rate are confirmed when a hold is created.

### Hotel detail page

Above the fold: breadcrumb, property name/location, rating and review link, photo gallery, and a stay-summary bar with editable dates/guests. Sections: overview, amenities, location/address, check-in/out, cancellation policies, room types, reviews, and help/contact. Room type cards show capacity, bed setup, included amenities, nightly rate, stay total, taxes/fees, refundable terms, and available quantity language. Selecting a room type advances to a server-validated hold flow.

### Checkout page

Use a clear step layout: stay/room summary, guest contact details, policy acceptance, price breakdown, and payment choice when enabled. Show hold expiration countdown without panic language. Display field validation, refreshed quote/price-change confirmation, hold-expired recovery path, payment pending/failure state, and a disabled submitting button during requests. Never show “confirmed” until confirmation is returned by the API.

### Confirmation page

Show clear booking status, unique reference, hotel, stay dates, guest/room summary, payment state, cancellation terms, price summary, contact/support information, and receipt action. Distinguish confirmed, payment pending, and manual review states visually and in text.

### Sign-in, registration, recovery

Build focused forms with email, password, password visibility control, validation, password reset request and success states. Do not claim Google/OTP login is available unless implemented. Give safe generic recovery confirmation that does not reveal account existence.

### Guest account and booking detail

Account overview includes profile/contact, upcoming and past stays, clear status badges, and sign-out. Booking detail shows saved booking snapshot, property-local dates, payment/refund state, receipt download, and cancellation action only when allowed. Cancellation preview explains the fee and expected refund before final confirmation.

## 6. Admin pages and content requirements

### Admin login

Minimal staff sign-in with email/password, show/hide control, validation, generic auth error, lockout/rate-limit message, MFA challenge state, and support contact. Do not expose guest login controls in the admin portal.

### Operations overview

Header includes date range and selected hotel scope. Cards show arrivals today, departures today, confirmed room-nights/occupancy, pending payment/review exceptions, and cancellations/refunds requiring attention. Add upcoming arrivals table and operational alerts. Every metric has definition context, loading/empty/error states, and a link to filtered records; do not invent revenue figures without a selected date basis.

### Hotel directory and hotel workspace

Directory includes search, city/status filters, property table/cards, and create hotel action. Hotel detail workspace uses tabs for Overview, Content & Photos, Policies, Room Types, and Activity. Create/edit forms validate required name, address, city, country, timezone, contact, and slug; publish requires all required content and at least one valid room type/inventory setup. Suspension/archive requires a clear consequence confirmation and preserves future booking operations.

### Room type catalog and editor

Table shows hotel, room name, occupancy, total rooms, base rate, status, and actions. Editor captures name, description, adult/child capacity, beds, amenities, images, room count, and currency/rate. Validate positive integer capacity/count, supported occupancy, non-negative rates, and inventory commitments before reducing room count.

### Availability calendar

Provide hotel and room type selectors, date range navigation, legend, and per-night counts for total, available, held, confirmed, and blocked. Selecting a date opens a detail panel with bookings/blocks and audited actions. Maintenance block flow captures date range, quantity, reason, and confirmation; reject any edit that violates existing holds/bookings. Distinguish property-local dates and present mobile alternative (date list) rather than a compressed unreadable grid.

### Rates editor

Show base rate plus date-specific rule table/calendar. Rule form captures effective dates, amount, currency, priority, and restrictions. Preview affected dates and price impact before save. Reject invalid date ranges, negative amounts, unsupported currencies, and ambiguous overlapping rules. Clearly warn that confirmed bookings retain their original price snapshot.

### Booking directory and booking detail

Directory has search by reference/guest, hotel selector, stay-date range, booking/payment/refund status filters, pagination, and export only if authorized. Detail includes guest/contact, hotel/room type, stay dates, price/policy snapshot, separate booking/payment/refund timelines, notes, and audit trail. Actions (check-in, checkout, cancel, no-show, walk-in) are status- and permission-aware, require confirmation and reason where required, and show API errors inline.

### Guest directory and guest detail

Search by guest name/email/phone with masked contact details where practical. Detail shows profile status, booking history, aggregate metrics with definitions, and audit-relevant actions. Suspend/reactivate requires permission, reason, and confirmation; do not display secrets or full payment data.

### Reviews moderation

Queue tabs for pending/approved/rejected, hotel/rating/date filters, review text, stay verification indicator, and property context. Approve/reject/remove actions require permission; rejection/removal can capture reason. Public visibility status is explicit.

### Reports

Filters include hotel scope, date range, date basis, and currency. Show definitions beside revenue, occupancy, cancellation, and refund metrics. Charts have accessible summaries and tabular data alternatives. Export controls appear only to authorized users; use an async export status state for large files.

### Staff and roles

Staff list includes name/email, status, roles, hotel scope, last activity, and actions. Invitation drawer validates email, role, and allowed hotel scope. Role editor groups permission keys by domain, shows sensitive permissions distinctly, offers a before/after diff, and prevents self-elevation or removing the last super admin. Do not rely on hiding a permission control for security.

### Audit log

Search by actor, action, hotel, resource, result, and date range. Rows show timestamp, actor, action, target, outcome, and reason; detail drawer shows a redacted before/after diff and correlation ID. Export is permission-gated and audited. Never render secrets or excessive guest data.

## 7. Shared reusable UI components

Build a coherent system of `Button`, `TextInput`, `TextArea`, `NumberInput`, `CurrencyInput`, `Select/Combobox`, `DatePicker`, `DateRangePicker`, `Checkbox`, `RadioGroup`, `Switch`, `FileUpload`, `FormField`, `DataTable`, `Pagination`, `FilterBar`, `StatusBadge`, `MetricCard`, `InlineAlert`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Dialog`, `ConfirmDialog`, `Drawer`, `Tabs`, `Breadcrumbs`, `PageHeader`, `AdminLayout`, `HotelSelector`, `StayDateRangeField`, `OccupancyInput`, `AvailabilityCalendar`, `RateEditor`, and `BookingStatusTimeline`.

Each reusable component needs typed props, keyboard support, visible focus, loading/disabled/error states as appropriate, and documented validation boundaries. UI validation improves usability; backend remains authoritative for access, availability, price, policy, and persisted state.

## 8. Required interaction states

For every data-driven screen design: first load, refresh load, populated, empty, filtered-empty, validation error, unauthorized, not found, API/server error, offline/retry, submitting, success, conflict (inventory changed), expired hold, stale price, and permission-denied action where relevant. Do not use a generic spinner as the only response to a long-running operation.

## 9. Copy and data rules

- Use concise human-readable copy; explain next steps and consequences.
- Use believable synthetic example properties in India only if the launch market remains India; mark all values as sample content.
- Never hardcode authoritative tax or payment behavior in UI copy before business approval.
- Format amounts with currency code/symbol and never label a nightly amount as the stay total.
- Use property-local dates and clearly show timezone in admin scheduling views.
- Use textual labels alongside status colors and provide precise form error messages.

## 10. Ready-to-use UI generation prompt

Copy the prompt below into the UI generator. Attach or paste this brief and the project context documents as references.

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

## 11. UI review checklist

- [ ] All guest and admin routes listed above exist and navigate coherently.
- [ ] Main guest booking journey works from search through booking result on mobile.
- [ ] Room rate and full-stay total are never visually confused.
- [ ] Search, hold, payment, and cancellation states are visually distinct and truthful.
- [ ] Admin hotel scope and permission-sensitive actions are visible and understandable.
- [ ] Availability calendar explains quantities and prevents unsafe-looking edits.
- [ ] Every form has required, invalid, submitting, and server-error states.
- [ ] Every table/page has loading, empty, error, and pagination/filter behavior.
- [ ] Shared components use consistent styling and accessible keyboard behavior.
- [ ] No unsupported features or unapproved tax/payment claims appear in the UI.
