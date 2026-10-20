# Component Inventory — Staywise Admin Web

All components live in `src/components/ui/` and are re-exported via `src/components/ui/index.ts`.

| Component | File | Props & Variants | Description |
| :--- | :--- | :--- | :--- |
| **`Button`** | `Button.tsx` | `variant`: `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'`<br>`size`: `'sm' \| 'md' \| 'lg'`<br>`isLoading`, `busy`, `loadingLabel`<br>`leftIcon`, `rightIcon`<br>`onClick`: supports `() => Promise<void>` with double-click locking | Unified button primitive for all actions. Replaces legacy `AsyncButton`. |
| **`Input`** | `Input.tsx` | `size`: `'sm' \| 'md' \| 'lg'`<br>`isError`, `leftIcon`, `rightIcon`<br>standard HTML input attributes | Custom form input with brand focus rings and icon slots. |
| **`MoneyInput`** | `MoneyInput.tsx` | `name` (receives integer minor units via hidden input), `currency` (default `INR`), `defaultMinorUnits`, `onMinorUnitsChange`, plus `Input` props (`size`, `isError`, `required`, `disabled`, `className`…) | Amount input in major units with currency symbol prefix (₹). Validates decimals per currency; uses `utils/money.ts`. Used in `BaseRatesView` and `CancellationPolicyFields`. |
| **`Select`** | `Select.tsx` | `size`: `'sm' \| 'md' \| 'lg'`<br>`isError`<br>standard HTML select attributes | Custom styled dropdown with Chevron icon. |
| **`Textarea`**| `Textarea.tsx`| `isError`<br>standard HTML textarea attributes | Custom multiline input with brand focus state. |
| **`Modal`** | `Modal.tsx` | `variant`: `'drawer' \| 'dialog'`<br>`size`: `'small' \| 'medium' \| 'wide' \| 'full'`<br>`title`, `subtitle`, `onClose`, `footer`, `closeOnBackdrop` | Dual-mode dialog primitive (right-side drawer or centered modal). |
| **`DataTable`**| `DataTable.tsx`| `data: T[]`, `columns: Column<T>[]`, `rowKey`, `loading`, `error`, `pagination`, `toolbarHeader`, `selectedRowKeys`, `onRowClick` | Generic data table with automatic skeleton rows, empty states, and pagination. |
| **`Pagination`**| `Pagination.tsx`| `currentPage`, `totalPages`, `totalItems`, `pageSize`, `onPageChange`, `onPageSizeChange` | Standalone or embedded pagination controls. |
| **`Status`** | `Status.tsx` | `variant`: `'pill' \| 'dot'`<br>`status`: `'PUBLISHED' \| 'DRAFT' \| 'SUSPENDED' \| 'ARCHIVED' \| 'NEEDS_SETUP'`<br>`label`, `showDot` | Status indicator supporting pill badge and dot formats. |
| **`Alert`** | `Alert.tsx` | `tone`: `'error' \| 'success' \| 'warning' \| 'info'`<br>`icon`, `onClose` | Inline feedback and error messages. |
| **`EmptyState`**| `EmptyState.tsx`| `icon`, `title`, `copy`, `action`, `compact` | Empty list or search zero-state placeholder. |
| **`Field`** | `Field.tsx` | `label`, `required`, `error`, `hint`, `fullWidth` | Form label and helper/error text wrapper. |
| **`PageHeading`**| `PageHeading.tsx`| `title`, `eyebrow`, `description`, `action` | Top-of-page header with breadcrumbs and action button slot. |
| **`MetricCard`**| `MetricCard.tsx`| `label`, `value`, `icon`, `change`, `changeType`, `subtitle`, `onClick` | Dashboard KPI metric tile. |
| **`KpiStrip`** | `KpiStrip.tsx` | `items: Array<{ label, value, subtext }>` | Horizontal operational metric strip. |
| **`LoadingRows`**| `LoadingRows.tsx`| `rows: number` | Skeleton row placeholders for loading tables. |

## Feature-level shared components

| Component | File | Props | Description |
| :--- | :--- | :--- | :--- |
| **`HotelDetailsFields`** | `features/hotels/HotelDetailsFields.tsx` | `hotel?`, `formErrors`; helper `readHotelDetails(formData)` | Basics / Contact / Location fields shared by Add hotel and Edit hotel. Slug auto-fills from the name; country and time zone are dropdowns (`hotel-options.ts`). |
| **`CancellationPolicyFields`** | `features/hotels/CancellationPolicyFields.tsx` | `hotel`, `formErrors`; helper `readCancellationPolicy(formData)` | Policy date, free-cancellation hours and two fee rules (fixed fee via `MoneyInput`). |
| **`HotelRoomsList`** | `features/hotels/HotelRoomsList.tsx` | `rooms` | Room-type cards for the workspace Rooms tab, `EmptyState` when empty. |

## Utilities
- `utils/money.ts`: `currencyDigits`, `currencySymbol`, `amountPattern`, `toMinorUnits`, `fromMinorUnits`, `formatMoney` (en-IN grouping).

## Added 2026-10-19 (form field typing)

| Component | File | Props | Description |
| :--- | :--- | :--- | :--- |
| **`Checkbox`** | `components/ui/Checkbox.tsx` | `checked`, `indeterminate`, `label`, `onChange`, input attrs | Styled checkbox over a real hidden input. |
| **`DatePicker`** | `components/ui/DatePicker.tsx` | `name`, `value`/`defaultValue`, `onChange(iso)`, `min`, `max`, `today`, `required`, `isError` | Calendar popover, submits YYYY-MM-DD, no native date input. |
| **`Combobox`** | `components/ui/Combobox.tsx` | `options`, `value`, `onChange`, `onSearch` (server search), `loading`, `selectedLabel`, `size`, `allowCustom` (free text + suggestions), `name`, `required`, `minLength`, `maxLength`, `isError` | Searchable single select, ARIA combobox, keyboard support. With `allowCustom` the box keeps typed text and options are suggestions (used for room category name). |
| **`PasswordInput`** | `components/ui/PasswordInput.tsx` | `Input` props | Password with show/hide toggle. |
| **`ReasonField`** | `components/ui/ReasonField.tsx` | `label`, `required`, `hint`, `error`, textarea props | Audit reason, 3–500 chars with counter. |
| `Textarea` (extended) | `components/ui/Textarea.tsx` | new `showCount` | Character counter when `maxLength` is set. |
| **`RoomTypeFields`** | `features/rooms/RoomTypeFields.tsx` | `room?`, `formErrors`, `onTotalChange`, `compact`; `readRoomTypeFields` | Shared by the room-type page and quick-add modal. |

## Added 2026-10-20
| Component | File | Props | Description |
| :--- | :--- | :--- | :--- |
| **`HotelSetupChecklist`** | `features/hotels/HotelSetupChecklist.tsx` | `readiness`, `activeTab`, `onSelect`, `counts` | Five numbered setup steps that are also the workspace tabs; ticks come from `GET /admin/hotels/:id/readiness`. |
| **`HotelAvailabilityTab`** | `features/inventory/HotelAvailabilityTab.tsx` | `hotel`, `rooms`, `readOnly`, `onChanged` | Open dates for sale per room type; links to the calendar. |
| **`PhotoModal`** | `features/hotels/PhotoModal.tsx` | `photo?`, `firstPhoto`, `onSave`, `onDelete?`, `onClose` | Add/edit photo pop-up: upload from device or https link, description (≤200), cover tick, Save. Upload happens on Save. |
| `HotelMediaGalleryManager` (changed 2026-10-20) | `features/hotels/HotelMediaGalleryManager.tsx` | unchanged (`media`, `onChange`, `disabled`) | Now a photo grid only: tiles + "Add photo"; click a tile to edit in `PhotoModal`. Used by Add hotel, workspace, room photos. |
| `Modal` (changed 2026-10-20) | `components/ui/Modal.tsx` | unchanged | Escape closes only the top-most modal when modals are stacked. |
| `DataTable` (extended 2026-10-20) | `components/ui/DataTable.tsx` | new optional `renderBody(rows)` | Replaces the table rows with a custom layout (e.g. cards) while keeping toolbar, loading, empty state and pagination. |
| **`HotelCardGrid`** | `pages/hotels/components/HotelCardGrid.tsx` | `hotels`, `selectedIds`, `onToggleSelect`, `onOpen` | Card view of the hotels list (photo, status, location, setup progress, Manage, select for bulk actions). |
| **`HotelSetupProgress`** | `pages/hotels/components/HotelSetupProgress.tsx` | `setup` | "N of 5 steps done" / "Ready to publish" bar, shared by the list and card views. |
