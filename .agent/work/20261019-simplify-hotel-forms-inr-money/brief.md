# Task 20261019-simplify-hotel-forms-inr-money: Simplify Add/Edit Hotel UI and enter money in rupees
Phase / gate: Phase 1 / Gate B5 · Module spec: Documentation/modules/hotel-management.md, Documentation/modules/pricing-tax.md, Documentation/modules/cancellation-policies.md · Checklist lines: 22 §Hotel Management, §Pricing

## Goal
Staff can add and edit a hotel through a shorter, friendlier UI without losing any existing step (create draft → details → photos → rooms → cancellation policy → publish / suspend / reactivate / archive). Every money input (base nightly rate, fixed cancellation / no-show fee) asks for an amount in rupees (₹, decimals allowed) and the UI converts it to integer minor units (paise) before calling the API. Money shown back to staff is formatted as currency (e.g. `₹1,500.00`), never raw minor units.

## Scope
- In:
  - `HotelCreateForm` and the General tab of `HotelWorkspace` share one fields component (`HotelDetailsFields`) so the two forms look and validate the same.
  - Slug auto-fills from the property name until the user edits it.
  - Time zone and country become dropdowns (India / `Asia/Kolkata` first; an existing unlisted value stays selectable).
  - Create form gains the optional contact phone (already on edit).
  - Create form warns (toast) when the hotel was created but the photos failed to save, instead of failing silently.
  - `HotelWorkspace`: use the shared `Tabs` component (removes hand-rolled tab buttons and raw colours), drop the duplicate inner header (page heading already shows name/city/timezone), friendlier tab labels, one "Back to hotels" action.
  - Archived hotel: read-only banner and disabled form controls in the workspace.
  - New shared `MoneyInput` (₹ prefix, rupee entry, submits minor units via a hidden input) and `utils/money.ts` (`toMinorUnits`, `fromMinorUnits`, `formatMoney`, per-currency fraction digits via `Intl`).
  - Use `MoneyInput` in the policy `FeeField` (currency defaults to existing value, else `INR`, no longer typed by hand) and in `BaseRatesView` (amount in rupees; "Current rate" shown formatted). `RatesPage.handleSaveRate` validates the converted integer.
- Out:
  - Backend, DTO, schema changes. Server keeps integer minor units and stays authoritative.
  - Deleting unused legacy components (`HotelForm.tsx`, `HotelCreateModal.tsx`, `HotelMediaModal.tsx`, `workspace/*`) — needs separate user approval.
  - Custom `DatePicker` (effective date stays the existing date input).
  - Server-side archived-edit guard (separate backend task).

## API contract (fixed — dev agents must not change it without returning here)
| Method | Path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `POST` | `/admin/hotels` | `hotels.create` | `CreateHotelDto` (unchanged) | `Hotel` | 400 `VALIDATION_FAILED`, 409 `DUPLICATE_HOTEL_SLUG`, 422 |
| `PATCH` | `/admin/hotels/:id` | `hotels.edit` | `UpdateHotelDto` (unchanged; `cancellationPolicy.*.amountMinorUnits` integer) | `Hotel` | 400, 409 `VERSION_CONFLICT`, 409 `HOTEL_TIMEZONE_HAS_FUTURE_BOOKINGS`, 422 |
| `POST` | `/admin/hotels/:id/media` | `hotels.edit` | `SetHotelMediaDto` (unchanged) | `Hotel` | 400, 409 `CONCURRENCY_CONFLICT` |
| `PUT/POST` | base rate endpoint used by `setBaseRate` (unchanged) | `rates.edit` | `{ amountMinorUnits: integer, currency, reason, version? }` | rate | 400, 409 |

## Data / schema / index changes
None.

## Business rules & invariants that apply
- Money is stored and sent as integer minor units; server authoritative (AGENTS.md, ADR money rule). UI conversion must be exact: `Math.round(amount * 10^digits)`, reject more decimals than the currency allows, reject negatives.
- Fixed policy fees must use the room-rate currency (hotel-management.md publication gate). Fee currency is carried over from the existing policy or defaults to `INR`; not free-typed.
- Optimistic `version` on every hotel mutation (unchanged).
- ADR-006 (single launch currency) is still Proposed: the UI defaults to INR but conversion stays currency-aware, so no dependency on that decision.

## Security & audit
Unchanged. `Can` gates on `hotels.edit`, `hotels.publish`, `hotels.archive`, `room_types.create`, rates edit stay as they are. Audit actions unchanged (`hotel.create`, `hotel.update`, `hotel.media_update`).

## Backend work (for backend-dev)
None.

## Frontend work (for frontend-dev)
1. `src/utils/money.ts`: `currencyDigits(currency)`, `toMinorUnits(amount, currency)`, `fromMinorUnits(minor, currency)`, `formatMoney(minor, currency)`.
2. `src/components/ui/MoneyInput.tsx` (export from `index.ts`): props `name` (form field that receives minor units), `currency`, `defaultMinorUnits`, `required`, `isError`, `disabled`, `className`, plus input attrs. Shows currency symbol prefix, accepts decimal rupees, writes minor units to a hidden input.
3. `src/features/hotels/HotelDetailsFields.tsx`: identity, contact and location fields with optional `hotel` defaults and `formErrors`; slug auto-fill; timezone/country `Select`; phone.
4. `HotelCreateForm.tsx`: use `HotelDetailsFields`; warn on photo save failure.
5. `HotelWorkspace.tsx`: shared `Tabs`; General tab uses `HotelDetailsFields`; remove inner duplicate header; archived banner + disabled `fieldset`; `FeeField` uses `MoneyInput` and a hidden currency input. Move `FeeField` into its own file to bring the workspace closer to the 200-line guideline.
6. `BaseRatesView.tsx` / `RatesPage.tsx`: `MoneyInput` for amount; formatted current rate; conversion-aware validation.
7. Update `apps/admin-web/docs/components.md` and `ui-decisions.md` (money input rule).

## Acceptance criteria
1. `/admin/hotels/new`: typing a name fills the slug; time zone and country are dropdowns defaulting to `Asia/Kolkata` / `IN`; phone is available; creating sends the same `CreateHotelDto` shape as before and lands on `/admin/hotels/:id/edit`.
2. If photo save fails after create, a warning toast says the hotel was created without photos.
3. `/admin/hotels/:id/edit` shows one header, shared `Tabs` (Details, Photos, Rooms, Cancellation policy), and every previous action (save details, save photos, add room type, save policy, publish, suspend, reactivate, archive) still works.
4. Policy fixed fee: entering `1500.50` sends `amountMinorUnits: 150050` with `currency: "INR"`; reopening shows `1500.50`.
5. Base rate: entering `2499` sends `amountMinorUnits: 249900`; current rate shows `₹2,499.00`; entering `10.555` is rejected client-side.
6. Archived hotel shows the read-only banner and disabled inputs.
7. `npm --workspace=apps/admin-web run build` passes.

## Verification plan
- `npm --workspace=apps/admin-web run build`
- Small node check of `utils/money.ts` conversion (round-trip, decimals rejection) via a scratch script — no new committed tests.

## Docs to update (for docs-keeper)
- `Documentation/07-guides/27-admin-web-end-to-end-navigation-guide.md` (create/edit flow is pages, not modals; rupee entry)
- `Documentation/04-planning-and-tracking/22-module-wise-line-items-checklist.md`
- `Documentation/modules/hotel-management.md` (UI note), `Documentation/modules/pricing-tax.md` (UI enters major units, converts to minor)
- `apps/admin-web/docs/components.md`, `apps/admin-web/docs/ui-decisions.md`

## Parallel safe?
Yes (frontend only).
