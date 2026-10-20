# Admin UI Kit — Reusable Components and Conditions

## Purpose

This document defines the reusable interface components for the hotel platform admin app. Build shared components once, keep domain-specific rules in feature forms/services, and make validation and access checks consistent across screens.

## Component standards

- Use React, TypeScript, and Tailwind CSS; keep shared UI components independent of hotel API/domain models where practical.
- Every interactive component supports keyboard use, visible focus, an accessible name, and a disabled/busy state when applicable.
- Form controls expose `value`, `onChange`, `name`, `id`, `disabled`, `required`, `error`, and `helpText` as appropriate.
- Validation appears beside the relevant field, explains how to fix the problem, and is announced to assistive technology.
- Validate immediately for format/range errors and on submit for required fields; server validation remains authoritative.
- Reusable UI components render validation and state; feature forms own the actual business rules and API calls.
- Never use color alone to communicate status, validation, availability, or permission.

## 1. Application shell and navigation

### `AdminLayout`
- Provides sidebar, header, page content region, responsive layout, and current-user menu.
- Shows the active hotel/property scope for scoped managers.
- Handles session loading, unauthenticated redirect, and access denied state.

### `AdminSidebar` and `AdminNavItem`
- Render navigation items from the user’s effective permissions.
- Highlight the current route and support keyboard navigation and mobile collapse.
- Hiding a menu item is only a UI convenience; API routes must still enforce permission.

### `PageHeader`
- Provides title, optional description, breadcrumbs, scope label, and primary/secondary actions.
- Disables actions while the related operation is pending and provides accessible button labels.

### `Breadcrumbs`
- Shows the current hierarchy with links for prior levels and plain text for the current page.
- Uses semantic navigation markup and identifies the current page accessibly.

## 2. Feedback and loading components

### `Button`
- Supports primary, secondary, danger, quiet, and link variants with small/medium/large sizes.
- Supports `isLoading`, `disabled`, `type`, icon, and accessible label options.
- Loading state prevents repeated clicks and announces progress; destructive actions should not be triggered by accidental form submission.

### `ToastProvider` and `Toast`
- Supports success, error, warning, and informational messages with optional action and dismiss control.
- Announces messages with an appropriate live region and does not rely on color alone.
- Do not use a toast as the only place for persistent payment, refund, or validation errors.

### `InlineAlert`
- Shows persistent page or form-level information, warnings, and errors.
- Supports title, description, severity, optional link/action, and dismissibility where safe.

### `Spinner`, `Skeleton`, and `PageLoader`
- Provide consistent loading indicators for buttons, content blocks, tables, calendars, and route transitions.
- Preserve approximate final layout to reduce page movement and announce longer blocking loads.

### `EmptyState` and `ErrorState`
- Explain why no records are shown and provide a relevant next action or retry option.
- Avoid suggesting a create action when the user lacks permission to create.

## 3. Form building blocks

### `FormField`
- Wraps label, required marker, help text, control, character count, and validation message.
- Connects labels and errors to the control with `htmlFor`, `aria-describedby`, and `aria-invalid`.
- Required state must be conveyed in text or accessible metadata, not only with an asterisk.

### `TextInput` and `TextArea`
- Support input type, max length, autocomplete, read-only, disabled, required, and error states.
- Trim/normalize input where appropriate before submission; do not silently mutate text while the user is typing.
- Enforce maximum length in the UI and again on the API.

### `NumberInput` and `CurrencyInput`
- Support minimum, maximum, step, precision display, and locale-aware formatting.
- Reject empty, non-finite, negative, and out-of-range values according to the feature rule.
- Currency input displays currency clearly and stores/sends integer minor units; do not use floating-point arithmetic for money.

### `Select` and `Combobox`
- Support single or multiple values, search, clear, loading, empty, disabled, and error states.
- Combobox options must be keyboard navigable and announce result counts and selection.
- Validate that selected IDs are still available and authorized when submitting.

### `DatePicker` and `DateRangePicker`
- Support minimum/maximum dates, disabled dates, clear, keyboard navigation, and timezone/date hints.
- Hotel stay dates use the property’s local calendar; never silently convert a date-only value through the browser timezone.
- Check-in must precede checkout; rate and inventory calendars must show the applicable property timezone.

### `Checkbox`, `RadioGroup`, and `Switch`
- Use checkbox for independent options, radio for one-of-many choices, and switch for immediate on/off settings.
- Use a visible text label and expose checked/disabled/error state accessibly.
- Confirm consequential publication, access, or inventory changes where required.

### `FileUpload` and `ImageUploader`
- Support drag/drop and file-picker selection, preview, reorder, primary image, alt text, and removal.
- Validate extension, actual MIME/content, file size, image dimensions, and upload count on both client and server.
- Show upload progress and retryable errors; reject unsupported files with actionable messages.
- Never trust the browser-provided MIME type as the only validation.

## 4. Data display components

### `DataTable`
- Supports typed columns, server-side pagination, sorting, row selection where needed, loading, empty, and error states.
- Sort keys and page limits are allowlisted by the API; do not assume client sorting is authoritative.
- Row actions are permission-aware, keyboard accessible, and visually separated from row navigation.
- On narrow screens, provide responsive alternatives rather than clipping essential actions.

### `Pagination`
- Supports current page, page size, total count, first/previous/next/last controls, and configurable page sizes.
- Clamp page and page size to valid values and reset to page one when filters materially change.
- Announce updated result ranges to assistive technology.

### `FilterBar` and `SearchInput`
- Support debounced text search, filters, clear-all, active filter chips, and URL synchronization where appropriate.
- Debounce only read queries; never debounce financial or inventory mutations.
- Validate filter ranges and serialize only supported query parameters.

### `StatusBadge`
- Maps a known status enum to consistent label, icon/tone, and accessible text.
- Unknown status values use a neutral fallback and should be logged for investigation.
- Do not use color as the only status indicator.

### `CurrencyAmount` and `DateTimeDisplay`
- Format using explicit currency and locale settings; display currency code when ambiguity is possible.
- Format timestamps in the relevant property timezone and distinguish local stay dates from UTC event times.
- Never calculate totals inside display components; render server-calculated amounts.

### `MetricCard` and `ChartCard`
- Support title, value, unit, date range, comparison context, loading, empty, and error states.
- Include text summaries or accessible data tables for charts; do not communicate trends through color alone.
- Respect the viewer’s hotel scope and use documented report definitions.

## 5. Overlay and navigation components

### `Dialog` and `ConfirmDialog`
- Support title, description, primary/secondary actions, focus trap, Escape behavior, and focus return.
- Destructive, refund, cancellation, and inventory-changing confirmations describe the effect before execution.
- Confirmation dialogs do not replace server authorization or business validation.

### `Drawer`
- Support left/right placement, size variants, title, close action, scrollable content, and footer actions.
- Trap focus while open, close with Escape when safe, and return focus to the trigger.
- Warn before discarding unsaved form changes; preserve entered data when a recoverable API error occurs.

### `Tabs`
- Provide keyboard navigation and accessible tab/panel relationships.
- Preserve unsaved edits when switching tabs or warn before discarding them.

### `DropdownMenu`
- Support keyboard selection, disabled items, separators, and accessible trigger naming.
- Hide or disable actions according to permissions, while the server remains the enforcement point.

## 6. Hotel-domain reusable components

### `HotelSelector`
- Search hotels available to the current user and show the active hotel scope.
- Super admins may select any hotel; hotel managers only see assigned hotels.
- Revalidate selected hotel authorization on the backend for every request.

### `StayDateRangeField`
- Captures check-in and checkout dates with property timezone and date-only semantics.
- Requires checkout after check-in and applies configured booking-window and maximum-stay rules.
- Shows validation for unavailable dates only after an authoritative availability query.

### `OccupancyInput`
- Captures room count, adults, and children/ages if the product supports them.
- Requires positive room and guest counts and enforces room-type capacity rules on the server.
- Prevents ambiguous guest allocation by showing how guests map to requested rooms.

### `AvailabilityCalendar`
- Displays per-night total, blocked, held, confirmed, and available room counts.
- Uses property local dates, accessible textual labels, and a legend that does not depend on color.
- Prevents a manual total reduction that would violate held, confirmed, or blocked inventory.
- Shows pending save state and requires a reason for manual adjustments.

### `RateEditor`
- Supports base and date-specific nightly rates with currency and effective date range.
- Validates non-negative valid amounts, date range ordering, currency consistency, and rule overlap policy.
- Previews affected dates and requires explicit save confirmation for bulk rate changes.

### `BookingStatusTimeline`
- Displays booking and payment timelines as separate state tracks.
- Shows event time, actor/source, and useful status descriptions.
- Uses server event history and cannot allow arbitrary client-side status changes.

### `PolicyEditor`
- Edits check-in/out times, cancellation deadlines, fee rules, and guest conditions.
- Validates time formats, cutoff ranges, non-negative fees, and required policy text.
- Warns that policy changes apply to future bookings unless an explicit migration/override workflow exists.

## 7. Reusable component validation contract

Every form component and feature form follows this sequence:

1. **Input validation:** required value, type, length, format, and range are checked before submission.
2. **Cross-field validation:** dependent values such as check-in/checkout or min/max rate are checked together.
3. **Server validation:** API validates permissions, current inventory, current policy, and persisted state again.
4. **Error mapping:** known API error codes map to the relevant field or form-level alert; unknown errors receive a safe generic message and request ID.
5. **Success feedback:** show confirmation only after the server reports a persisted success state.

Never rely on frontend validation for security or data integrity. Keep validation schemas close to feature forms and share them only where client/server compatibility is reliable.

## 8. Suggested component folders

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

Generic components belong in `components/`; components with hotel-specific rules belong in `features/`. Feature forms compose shared controls instead of duplicating their behavior.

## 9. Component acceptance checklist

- [ ] Component has a clear single responsibility and typed public props.
- [ ] Component supports loading, disabled, error, empty, and success states where relevant.
- [ ] Form controls have labels, help text, accessible errors, and keyboard support.
- [ ] Validation covers required, type, format, length, range, and dependent-field conditions as applicable.
- [ ] Component does not own API business rules or trust client-provided authorization.
- [ ] Component handles responsive layouts and avoids clipping essential actions.
- [ ] Component uses consistent visual tokens and status semantics.
- [ ] Component is documented with a short usage example and edge cases.
- [ ] Shared component is verified in at least two feature contexts before broad reuse.
