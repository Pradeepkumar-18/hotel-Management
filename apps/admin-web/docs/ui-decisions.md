# UI Decisions — Staywise Admin Web

## 1. Structure
- **Root**: `apps/admin-web/src/`
- **Components**: `src/components/ui/` — shared primitives (`Button`, `Input`, `Select`, `Textarea`, `Modal`, `DataTable`, `Pagination`, `Status`, `Alert`, `EmptyState`, `Field`, `PageHeading`, `KpiStrip`, `MetricCard`, `LoadingRows`).
- **Features**: `src/features/` — feature drawers and modals (`features/hotels/`, `features/rooms/`).
- **Pages**: `src/pages/` — top-level routed pages (`pages/dashboard/`, `pages/hotels/`, `pages/catalog/`, `pages/auth/`, `pages/error/`). Large pages must decompose into subcomponents (`pages/hotels/components/`, `pages/catalog/views/`).
- **Max file size guideline**: ~200 lines per component file.

## 2. Theme & Design Tokens
- **Font**: DM Sans for body (`--font-sans`), Manrope for headings (`--font-heading`).
- **Brand Colors**:
  - Primary: `#1e6354` (`--color-brand-primary`)
  - Primary Hover: `#164d42` (`--color-brand-hover`)
  - Pale Accent: `#e9f3ee` (`--color-brand-pale`)
  - Dark Header: `#173f36` (`--color-brand-dark`)
  - Lime Accent: `#d6ef9e` (`--color-brand-lime`)
- **Neutral Canvas**: `#f4f6f3` (`--color-canvas`)
- **Card Paper**: `#ffffff` (`--color-paper`)
- **Border Line**: `#e4e9e3` (`--color-line`)

## 3. Density & Controls
- Standard dashboard density: 15px base font, tight compact data rows, 36–42px button/input heights.
- Never use unstyled browser form controls; always use shared `Input`, `Select`, `Textarea`.
- All buttons use unified `<Button>` primitive with built-in async double-click prevention (`isLoading` / `busy`).

## 4. Modals & Dialogs
- `<Modal>` supports `variant="drawer"` (full-height right-side slide-over) and `variant="dialog"` (centered card modal).

## 5. Money
- Staff never type or read raw minor units. Inputs use `MoneyInput` (major units, ₹ prefix); display uses `formatMoney(minor, currency)` (e.g. ₹2,499.00).
- Conversion lives only in `utils/money.ts`; the API still receives integer minor units and the server validates them.
- Default currency is INR; a currency already saved on a record is kept.

## 6. Tabs
- Page-level tabs use the shared `Tabs` component (e.g. hotel workspace); no hand-rolled tab buttons.

## 7. Form controls (2026-10-19)
- Dates use `DatePicker`, checkboxes use `Checkbox`, searchable/long lists use `Combobox`, passwords use `PasswordInput`, audit reasons use `ReasonField`. No native date/checkbox/select/file controls on screen.
- Client limits mirror the API DTO (maxLength, patterns); the server stays the authority and returns per-field errors.
