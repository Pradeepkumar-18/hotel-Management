# Frontend Implementation Report: Task 20261019-simplify-hotel-forms-inr-money

## 1. Files
- New: `src/utils/money.ts`, `src/components/ui/MoneyInput.tsx` (exported from `components/ui/index.ts`), `src/features/hotels/HotelDetailsFields.tsx`, `src/features/hotels/hotel-options.ts`, `src/features/hotels/CancellationPolicyFields.tsx`, `src/features/hotels/HotelRoomsList.tsx`
- Changed: `features/hotels/HotelCreateForm.tsx`, `features/hotels/HotelWorkspace.tsx` (802 → 324 lines), `pages/hotels/HotelCreatePage.tsx`, `pages/hotels/HotelEditPage.tsx`, `pages/catalog/views/BaseRatesView.tsx`, `pages/catalog/RatesPage.tsx`
- Docs: `apps/admin-web/docs/components.md`, `apps/admin-web/docs/ui-decisions.md` (§5 Money, §6 Tabs)

## 2. Routes / endpoints
Routes unchanged (`/admin/hotels/new`, `/admin/hotels/:id/edit`, `/admin/rates`). Endpoints consumed unchanged: `POST /admin/hotels`, `PATCH /admin/hotels/:id`, `POST /admin/hotels/:id/media`, publish/suspend/archive, base-rate `PUT`. Payload shapes identical; money still integer minor units.

## 3. Shared components (approved by user 2026-10-19)
- `MoneyInput`: rupee entry with ₹ prefix, per-currency decimal pattern, hidden input submits minor units.
- `HotelDetailsFields` + `readHotelDetails`: one fields block for create and edit; slug auto-fill; country/time-zone `Select`; phone on create.
- Workspace now uses the existing shared `Tabs`, `Alert`, `EmptyState` instead of hand-rolled markup and raw hex colours.

## 4. Behaviour
- Create: photo save failure after create now shows an error toast instead of failing silently.
- Edit: single page header with "Back to hotels"; Publish/Reactivate merged into one status-aware button; publish problems in `Alert`; archived hotels show a read-only banner and disabled fieldsets, save buttons hidden.
- Policy: fixed fee typed in rupees; currency = saved policy currency, else INR (hidden field, no free typing).
- Rates: price per night typed in rupees; current rate shown as `₹2,499.00 per night, before tax`; currency is a dropdown (INR default) only until locked.

## 5. Build
`npm run build:admin` → PASS (tsc + vite, 0 errors).

## 6. Manual checks for verifier
1. `/admin/hotels/new`: type a name → web address fills; country/time zone dropdowns default India / IST; create → lands on edit page.
2. Edit page: tabs Details / Photos (count) / Rooms (count) / Cancellation policy; `?tab=` deep link works.
3. Policy: Fixed amount `1500.50` → request body `amountMinorUnits: 150050, currency: "INR"`; reload shows `1500.50`.
4. Rates: `2499` → `amountMinorUnits: 249900`; `10.555` blocked by the browser validation message.
5. Archived hotel: banner shown, inputs disabled, no save buttons.

## 7. Not done
- `HotelWorkspace.tsx` is 324 lines (guideline ~200); further split of the header/actions is possible.
- Effective date still uses the native date input (no shared DatePicker exists).
- Legacy unused files left in place (deletion needs approval).
