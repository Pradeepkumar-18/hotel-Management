# Component Inventory — Staywise Admin Web

All components live in `src/components/ui/` and are re-exported via `src/components/ui/index.ts`.

| Component | File | Props & Variants | Description |
| :--- | :--- | :--- | :--- |
| **`Button`** | `Button.tsx` | `variant`: `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'`<br>`size`: `'sm' \| 'md' \| 'lg'`<br>`isLoading`, `busy`, `loadingLabel`<br>`leftIcon`, `rightIcon`<br>`onClick`: supports `() => Promise<void>` with double-click locking | Unified button primitive for all actions. Replaces legacy `AsyncButton`. |
| **`Input`** | `Input.tsx` | `size`: `'sm' \| 'md' \| 'lg'`<br>`isError`, `leftIcon`, `rightIcon`<br>standard HTML input attributes | Custom form input with brand focus rings and icon slots. |
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
