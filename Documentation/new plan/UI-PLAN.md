# UI plan — visual system, components and screen layouts

- **Date:** 2026-10-20
- **Status:** proposal. Follows the shared baseline in [README.md](./README.md) (phases P0–P8, routes, entity and status names, human-in-the-loop convention). If this file and the README disagree, the README wins.
- **Main reader:** a smaller coding model building `apps/admin-web` (P1–P6) and `apps/guest-web` (P5), plus the designer/reviewer who signs off the visuals.
- **Inputs read:**
  - `../ANALYSIS.md` → `#ui-theme-consistency-audit` (reference theme + 77 findings) and `#hotel-module-ux-review`;
  - `apps/admin-web/docs/ui-decisions.md`, `apps/admin-web/docs/components.md`;
  - `../guidelines/frontend-ui.md` (Tailwind v4 rules, admin UI kit);
  - [admin-ux-plan.md](./admin-ux-plan.md) and [reports/Hotel admin UX plan evaluation.md](./reports/Hotel%20admin%20UX%20plan%20evaluation.md);
  - the live code: `src/styles.css`, `src/dashboard.css` (empty stub), `src/components/ui/*`, `src/features/hotels/*`, `src/pages/hotels/*`, `src/layout/*`, `src/App.tsx`.
- **Paths:** code paths are relative to `apps/admin-web/src/` unless they start with `apps/`. Line numbers were checked against the working tree on 2026-10-20; **re-check with a search before editing**, because earlier tasks may move lines.
- **Behaviour, flows and copy** live in [UX-PLAN.md](./UX-PLAN.md). **Tasks and order** live in [MVP-PLAN.md](./MVP-PLAN.md). This file only says how things look and which components build them.

## How to read this file

- **🧑 HUMAN CHECKPOINT** blocks use the README format. The coding model **stops** at each one, shows what it has (a screenshot, a prop list or a token diff), and waits for "approved".
- **Checkpoint IDs** are `UI-CP-nn`. The index is in [§0](#0-checkpoint-index).
- **Phase tags** (`P1`…`P6`) say when a component or screen is first needed.
- **"Shared"** means `src/components/ui/` (generic, re-exported from `components/ui/index.ts`). **"Feature"** means `src/features/<domain>/` (knows hotel/booking rules). **"Layout"** means `src/layout/`.

---

## 0. Checkpoint index

| ID | What the human approves | Section | Phase |
|---|---|---|---|
| UI-CP-01 | Semantic colour tokens (success / warning / danger / info) and the slate → token mapping | [§2.3](#23-proposed-token-changes) | P1 |
| UI-CP-02 | Text tokens: `ink-muted` darkened for AA contrast, `text-2xs`, heading font (Manrope) | [§2.3](#23-proposed-token-changes) | P1 |
| UI-CP-03 | Overlay, focus and closed-cell stripe tokens; canvas value and doc fixes | [§2.3](#23-proposed-token-changes) | P1 |
| UI-CP-04 | Status colour & badge matrix (every status → label, icon, tone) | [§6](#6-status-colour--badge-matrix) | P1 |
| UI-CP-05 | App shell: sidebar groups, top bar layout, search scope, "+ New booking" placement | [§3.1](#31-app-shell) | P1 |
| UI-CP-06 | `HotelSwitcher` props and look | [§4.3](#43-new-components) | P1 |
| UI-CP-07 | `PageCard` + `SectionHeading` (and retiring the two heading styles) | [§4.3](#43-new-components) | P1 |
| UI-CP-08 | `Badge` + `StatusBadge` (and the `Status` deprecation path) | [§4.3](#43-new-components) | P1 |
| UI-CP-09 | `HealthBadge` labels, tones and fix actions | [§4.3](#43-new-components) | P1 |
| UI-CP-10 | `SidePanel` (overlay drawer with tabs) and the drawer-vs-dialog rule | [§4.3](#43-new-components), [§4.4](#44-overlay-rule-drawer-vs-dialog) | P1 |
| UI-CP-11 | Small shared set: `ButtonLink`, `BrandMark`, `StatTile`, `QuickActionCard`, `ProgressBar`, `DropdownMenu` | [§4.3](#43-new-components) | P1 |
| UI-CP-12 | Changes to existing shared components (`Button`, `Status`, `Tabs`, `Modal`, `MetricCard`, `EmptyState`, `Field`) | [§4.2](#42-changes-to-existing-shared-components) | P1 |
| UI-CP-13 | Visual sign-off P1: hotels list, workspace shell, Rooms & rates + side panel, audit log, login, boot | [§5](#5-screen-ui-specs) | P1 |
| UI-CP-14 | `InventoryGrid` props, cell states and desktop look | [§4.3](#43-new-components), [§5.6](#56-inventory-grid--bulk-edit-p2) | P2 |
| UI-CP-15 | Inventory grid phone layout ("agenda" mode) | [§5.6](#56-inventory-grid--bulk-edit-p2) | P2 |
| UI-CP-16 | `BulkEditPanel` fields, preview and warnings (inventory and money) | [§4.3](#43-new-components) | P2 |
| UI-CP-17 | `DateRangePicker` and `GuestCountInput` | [§4.3](#43-new-components) | P2/P4 |
| UI-CP-18 | Visual sign-off P3: Overview, Details, Photos, Policies, Tax & billing, Today | [§5](#5-screen-ui-specs) | P3 |
| UI-CP-19 | `PriceBreakdown` layout and per-night GST wording (tax rule) | [§4.3](#43-new-components) | P4 |
| UI-CP-20 | `HoldIndicator` look and timing behaviour (WCAG 2.2.1) | [§4.3](#43-new-components) | P4 |
| UI-CP-21 | Visual sign-off P4: staff New booking page | [§5.11](#511-new-booking-p4) | P4 |
| UI-CP-22 | Guest web brand direction (Staywise brand vs hotel brand, fonts, imagery) | [§8](#8-guest-web-visual-direction) | P5 |
| UI-CP-23 | Guest web visual sign-off (phone first, then desktop) | [§5.15](#515-guest-web-pages-p5) | P5 |
| UI-CP-24 | `Timeline` (separate booking / payment tracks) | [§4.3](#43-new-components) | P6 |
| UI-CP-25 | Visual sign-off P6: bookings list, booking detail, cancel / no-show dialog with fee | [§5.9](#59-bookings-list-p6), [§5.10](#510-booking-detail-p6) | P6 |
| UI-CP-26 | Accessibility review (keyboard grid, focus, contrast, reduced motion, screen reader) | [§7](#7-iconography-motion-dark-mode), [§10](#10-implementation-rules-for-the-coding-model) | P1, P2, P4, P6 |
| UI-CP-27 | Dark mode stance (not in MVP) | [§7.3](#73-dark-mode) | P1 |
| UI-CP-28 | Deleting dead UI files listed by the audit (file deletion needs approval) | [§9.4](#94-dead-code-needs-deletion-approval) | P1 |

- **Totals:** 28 checkpoints · 21 new components ([§4.3](#43-new-components)) · 14 token proposals ([§2.3](#23-proposed-token-changes)).

---

## 1. Visual principles and the reference theme

### 1.1 Principles

- **Calm operations tool:** white cards on a pale green-grey canvas, one deep-green brand colour for the main action, colour reserved for status. Staff stare at this for hours, so nothing decorative (no gradients on cards, no sparklines with fake data, no rainbow tiles).
- **Status is never colour alone:** every badge has an icon **and** a word (research report §3; `frontend-ui.md` StatusBadge rule). "Healthy / bookable / done" is visually quiet; problems stand out.
- **One way to do each thing:** one page heading, one card container, one section heading, one badge, one button set, one modal footer. The audit found four header patterns and five heading sizes; this plan fixes one of each.
- **Dense but readable:** 15px root, most UI text `text-xs` (11.25px at the 15px root), 36px small controls, 42px page actions. Phone layouts get bigger touch targets (≥ 44px for primary actions).
- **Money is server-computed and shown in rupees:** `formatMoney(minor, currency)` with `tabular-nums`; components never add or multiply money.
- **Sentence case** for titles, buttons, tabs and section headings. CAPS only for eyebrows and table headers.

### 1.2 The reference theme (what "looks like the hotel pages" means)

- **Canvas and width:** `bg-canvas`; content `max-w-[1600px] w-full mx-auto p-4 sm:p-5 lg:p-6` (`layout/AppLayout.tsx:57`); page root `space-y-6` (`pages/hotels/HotelEditPage.tsx:55`, `pages/hotels/HotelsPage.tsx:363`). No per-page `max-w`.
- **Page heading:** `PageHeading` (`components/ui/PageHeading.tsx:20-31`): eyebrow CAPS, `h1 text-2xl md:text-3xl font-bold tracking-tight`, description `text-xs md:text-sm`, action slot bottom-aligned.
- **Container:** `bg-white border border-slate-200/80 rounded-2xl shadow-2xs` with `p-4 sm:p-6 md:p-8` (`features/hotels/HotelWorkspace.tsx:376`) or `p-6 sm:p-8` (`features/hotels/HotelCreateForm.tsx:58`). Lists use `DataTable` (`rounded-2xl shadow-xs`, filters in `toolbarHeader`, `components/ui/DataTable.tsx:59-65`).
- **Inner card:** `p-4 border border-slate-200/90 rounded-xl bg-white shadow-2xs hover:border-slate-300` (`features/hotels/HotelRoomsList.tsx:34`); hotel card `rounded-2xl` with a 16:9 image (`pages/hotels/components/HotelCardGrid.tsx:30-60`).
- **Selected state:** `border-brand-primary ring-2 ring-brand-primary/20` (`HotelCardGrid.tsx:31`, `features/hotels/HotelMediaGalleryManager.tsx:70`).
- **Section heading:** `h3 text-sm font-bold` + `p text-xs` (`HotelWorkspace.tsx:435-442`, local `SectionTitle`); sections divided by `pt-6 border-t border-slate-100`.
- **Form:** `Field` + `Input/Select size="md"` (h-9), grid `grid grid-cols-1 sm:grid-cols-2 gap-5`, footer `pt-6 border-t flex justify-end gap-3`, Cancel `outline`, Save `primary` with `Check` icon and `loadingLabel="Saving…"`, "You have unsaved changes" on the left (`HotelWorkspace.tsx:303-309`).
- **Filters:** small controls with `text-[10px] font-bold uppercase tracking-wider` labels (`pages/hotels/components/HotelFiltersBar.tsx:54-58`); list/cards switch is `Tabs variant="pills" size="sm"` (`HotelFiltersBar.tsx:96-106`).
- **Metrics:** `MetricCard` row `grid … xl:grid-cols-5 gap-3.5`, icon 16px (`pages/hotels/components/HotelSummaryCards.tsx:11-46`).
- **Setup progress:** text + 6px bar (`pages/hotels/components/HotelSetupProgress.tsx:9-20`).
- **Photo tiles:** 4:3, cover chip `bg-brand-dark text-white` with amber star (`HotelMediaGalleryManager.tsx:66-90`); add tile `border-2 border-dashed hover:border-brand-primary hover:bg-brand-pale` (`:113`).
- **Dialog:** `Modal variant="dialog"`, `closeOnBackdrop={false}` for forms, footer Cancel `outline sm` + confirm `primary sm` (`features/hotels/PhotoModal.tsx:125-133`, `:295-320`).
- **Known flaws inside the reference** (fixed in [§9](#9-fix-list-from-the-theme-audit)): hand-built list header and raw-hex "Add a hotel" (`HotelsPage.tsx:365-398`, `:388-395`, `:433-440`); hand-built step tablist (`features/hotels/HotelSetupChecklist.tsx:38-71`); hand-built photo-source toggle (`PhotoModal.tsx:152-171`); `ghost` + rose override for destructive actions (`HotelWorkspace.tsx:241`, `PhotoModal.tsx:303`).

---

## 2. Design tokens

### 2.1 Current tokens (`src/styles.css:4-39`, Tailwind v4 `@theme`)

| Token | Value | Tailwind utilities | Used for today |
|---|---|---|---|
| `--font-sans` | DM Sans | `font-sans` | All text (root also sets it, `:41-50`) |
| `--font-heading` | Manrope | `font-heading` | **Unused** (audit R14) |
| `--color-canvas` | `#eef5f0` | `bg-canvas` | App background |
| `--color-paper` | `#ffffff` | `bg-paper` | Cards, outline button |
| `--color-ink` | `#20322d` | `text-ink` | Body text, table cells |
| `--color-ink-muted` | `#73827b` | `text-ink-muted` | Ghost button, muted copy (4.0:1 on white — below AA for small text) |
| `--color-line` | `#e4e9e3` | `border-line` | Outline button, NotFound card |
| `--color-brand-dark` | `#173f36` | `bg-brand-dark` | Cover chip |
| `--color-brand-deep` | `#12362f` | `bg-brand-deep` | — |
| `--color-brand-darkest` | `#102f2a` | `bg-brand-darkest` | Primary button `:active` |
| `--color-brand-primary` | `#1e6354` | `bg-/text-/border-brand-primary` | Main action, active nav, selection, focus |
| `--color-brand-hover` | `#164d42` | `bg-brand-hover` | Primary hover, secondary text |
| `--color-brand-pale` | `#e9f3ee` | `bg-brand-pale` | Active nav, secondary button, photo placeholders |
| `--color-brand-lime` | `#d6ef9e` | `bg-brand-lime` | — (declared accent) |
| `--color-brand-lime-hover` | `#c8e887` | — | — |
| `--color-brand-sage` | `#92b3a3` | — | — |
| `--color-brand-sage-dark` | `#668276` | — | — |
| `--color-brand-border` | `#c2dcd0` | `border-brand-border` | Secondary button, active nav border |
| `--color-surface-muted` | `#f1f5f1` | `bg-surface-muted` | Ghost hover, table row hover |
| `--color-surface-subtle` | `#fafbf9` | `bg-surface-subtle` | Outline hover |
| `--color-line-subtle` | `#e7ebe7` | `divide-line-subtle` | Table row dividers |
| `--color-ink-deep` | `#33483e` | `text-ink-deep` | Outline button text |
| `--color-ink-light` | `#89958e` | — | — |
| `--color-ink-faint` | `#9aa49d` | — | Scrollbar thumb |
| `--color-danger` | `#e11d48` | `bg-danger` | Danger button |
| `--color-danger-hover` | `#be123c` | `bg-danger-hover` | Danger hover |
| `--color-danger-pale` | `#fff1f2` | `bg-danger-pale` | — |
| `:root` font-size | `15px` | — | All `rem` values are 15px-based (`text-xs` = 11.25px, `p-4` = 15px) |
| `:focus-visible` | 2px `brand-primary` outline, offset 2 | — | Global focus (`:86-89`) |

### 2.2 Gaps

- **G1 · Two neutral families:** 537 `slate-*` classes in `.tsx` files vs a handful of `ink/line/paper/canvas` uses. Slate is cool grey, the tokens are green-grey (audit X1).
- **G2 · No semantic colours:** success / warning / info are raw `emerald/amber/sky` inside `Alert.tsx:12-24`, `Toast.tsx:15-19`, `Status.tsx:48-56`, `EmptyState.tsx:26`, `ConfirmDialog.tsx:80`, `Tabs.tsx:94`; raw hex in `Status.tsx:15-46` (20) and `MetricCard.tsx:25-81` (20) (audit X2, R11).
- **G3 · No status → colour map:** room types fall back to the amber DRAFT pill (`Status.tsx:70`); `features/hotels/hotel-status.ts:10-15` has an unused second map that colours SUSPENDED orange while the pill uses rose.
- **G4 · Contrast:** `ink-muted` (4.0:1), `slate-400` eyebrows and table hints (`PageHeading.tsx:25`, ~2.6:1) are below WCAG AA for small text.
- **G5 · No small-text token:** `text-[10px]` and `text-[11px]` are hand-typed in many files.
- **G6 · No overlay, focus or "closed" pattern token:** backdrops use `bg-slate-900/40` (`Modal.tsx:64`); inventory needs a non-colour "closed" pattern.
- **G7 · Docs disagree with code:** canvas `#f4f6f3` in `ui-decisions.md:18` and `frontend-ui.md` vs `#eef5f0` in `styles.css:8`; `frontend-ui.md` describes a dark-green sidebar, the built sidebar is white (`layout/Sidebar.tsx:28-30`).
- **No gap (document only):** radius, shadow and spacing use Tailwind defaults; [§2.4](#24-scales-radius-shadow-spacing-typography) fixes which steps are allowed.

### 2.3 Proposed token changes

> **🧑 HUMAN CHECKPOINT UI-CP-01 — colour tokens (ui-decisions.md: token changes need approval)**: review the T-01…T-05 diff below in `styles.css` and a screenshot of the hotels list before/after migrating `Alert`, `Status`, `Toast`. Approved = "tokens accepted; neutral mapping accepted"; until then, no shared component switches from raw palettes.

> **🧑 HUMAN CHECKPOINT UI-CP-02 — text tokens**: approve T-06 (`ink-muted` darker), T-07 (`text-2xs`) and T-08 (Manrope on headings). Show a screenshot of `PageHeading` + a table header before/after. Approved = values accepted, or "keep DM Sans for headings" (then delete `--font-heading` from the docs instead).

> **🧑 HUMAN CHECKPOINT UI-CP-03 — overlay, focus, closed pattern, canvas**: approve T-09…T-14. Approved = tokens accepted and `ui-decisions.md` / `frontend-ui.md` corrected to the code values.

- **Naming rule:** each semantic tone uses the existing vocabulary: `<tone>` (solid: icons, dots, fills), `<tone>-ink` (text on pale), `<tone>-pale` (surface), `<tone>-line` (border). Utilities: `text-success-ink bg-success-pale border-success-line`, `text-success` for icons, `bg-success` for dots/bars.
- **Values** are the colours the `Status` pill and `Alert` already render, so migrating is visually neutral.

| # | Token(s) to add / change in `@theme` | Value | Replaces |
|---|---|---|---|
| T-01 | `--color-success` · `-ink` · `-pale` · `-line` | `#059669` · `#047857` · `#ecfdf5` · `#a7f3d0` | `emerald-*` in `Alert`, `Toast`, `Status`, `HotelSetupChecklist`, `HotelSetupProgress` |
| T-02 | `--color-warning` · `-ink` · `-pale` · `-line` | `#d97706` · `#b45309` · `#fffbeb` · `#fde68a` | `amber-*` (needs setup, unsaved, low availability) |
| T-03 | `--color-danger-ink` · `--color-danger-line` (keep `danger`, `danger-hover`, `danger-pale`) | `#be123c` · `#fecdd3` | `rose-*` in `Field`, `Input`, `Select`, `Alert`, `DataTable` error |
| T-04 | `--color-info` · `-ink` · `-pale` · `-line` | `#0284c7` · `#0369a1` · `#f0f9ff` · `#bae6fd` | `sky-*` (held, processing, informational alerts) |
| T-05 | `--color-line-strong` (new) + **neutral mapping rule** (table below) | `#c9d3cc` | `slate-300` input borders |
| T-06 | `--color-ink-muted` **change** | `#73827b` → `#65736c` (4.9:1 on white, 4.6:1 on `canvas`) | `slate-500`, and `slate-400` when used for text |
| T-07 | `--text-2xs` + `--text-2xs--line-height` | `0.7333rem` (= 11px at the 15px root) · `1rem` | `text-[10px]`, `text-[11px]` |
| T-08 | Apply `--font-heading` (no value change) | Manrope 700/800 | `font-heading` on `PageHeading` h1, `Modal` h2, login display |
| T-09 | `--color-overlay` | `rgb(16 47 42 / 0.40)` (brand-darkest at 40%) | `bg-slate-900/40` (`Modal.tsx:64`), `bg-slate-900/30` (`Sidebar.tsx:146`) |
| T-10 | `--color-overlay-light` | `rgb(16 47 42 / 0.12)` | Backdrop behind `SidePanel`, so the list stays readable |
| T-11 | `--color-focus` | `var(--color-brand-primary)` | Hard-coded `ring-brand-primary` / `#1e6354` in focus recipes |
| T-12 | `@utility bg-stripes-closed` (CSS, after `@theme`) | see snippet | Closed (stop-sell) inventory cells — a pattern, not only a colour |
| T-13 | `--color-selection` | `rgb(30 99 84 / 0.10)` | Grid range selection fill (`bg-selection`) |
| T-14 | **Canvas decision** (no code change) | keep `#eef5f0` | Fix `ui-decisions.md:18` and `frontend-ui.md` §1 to `#eef5f0`; record "sidebar is white" |

- **T-12 snippet** (add to `styles.css` after the `@theme` block):

```css
@utility bg-stripes-closed {
  background-color: var(--color-surface-muted);
  background-image: repeating-linear-gradient(135deg, transparent 0 6px, var(--color-line) 6px 7px);
}
```

- **Neutral mapping rule (T-05):** new and touched code uses the right column; untouched files migrate when they are next edited.

| Old (slate) | New token | Note |
|---|---|---|
| `text-slate-900`, `text-slate-800` | `text-ink` | Titles, values |
| `text-slate-700`, `text-slate-600` | `text-ink-deep` | Labels, secondary text |
| `text-slate-500` | `text-ink-muted` | Descriptions, hints (AA after T-06) |
| `text-slate-400` (text) | `text-ink-muted` | Eyebrows, table headers, mono slugs |
| `text-slate-400` (icons only) | `text-ink-light` | Decorative icons, placeholders (`placeholder:text-ink-light`) |
| `bg-slate-50` | `bg-surface-subtle` | Input fill, info panels |
| `bg-slate-100` | `bg-surface-muted` | Hover, chips, pills track |
| `border-slate-100`, `border-slate-200`, `border-slate-200/80`, `/90` | `border-line` | Card and section borders |
| `border-slate-300` | `border-line-strong` | Input borders, dashed empty state |
| `hover:border-slate-300/400` | `hover:border-ink-faint` | Input/card hover |
| `bg-slate-900/40` | `bg-overlay` | Modal backdrop |

### 2.4 Scales (radius, shadow, spacing, typography)

- **Radius** (Tailwind defaults, no new tokens):

| Use | Class |
|---|---|
| Small controls (`size="sm"` input/select/button), cell chips | `rounded-md` |
| Medium controls (`md`), alerts, popover items | `rounded-lg` |
| Inner cards, panels, photo tiles, large controls, popovers, empty states | `rounded-xl` |
| Page cards, `DataTable`, dialogs, hotel cards | `rounded-2xl` |
| Badges, avatars, dots | `rounded-full` |

- **Shadow:**

| Use | Class |
|---|---|
| Cards, inner cards, outline button, pills | `shadow-2xs` |
| `DataTable`, primary/danger button, active step | `shadow-xs` |
| Popovers, dropdown menus, toasts, switcher list | `shadow-lg` |
| Dialogs, drawers, side panels | `shadow-2xl` |
| **Not allowed on cards** | `shadow-sm`, `shadow-md`, `shadow-xl` (fix `AccessPage.tsx:8`, `ErrorBoundary.tsx:53`) |

- **Spacing:**

| Use | Class |
|---|---|
| Page root stack | `space-y-6` |
| Page card padding | `p-4 sm:p-6 lg:p-8` (`PageCard padding="lg"`), `p-4 sm:p-5` (`padding="md"`) |
| Inner card padding | `p-4` (compact `p-3`) |
| Between sections inside a card | `space-y-8` + each later section `pt-6 border-t border-line` |
| Form grid gap | `gap-5` (filters `gap-2.5`) |
| Button groups | `gap-2` (sm), `gap-3` (md) |
| Metric / tile rows | `gap-3.5` |
| Card grids | `gap-4` |
| Heading to content | `mb-4` (section), PageHeading has `mb-5` → **remove** inside `space-y-6` roots (set `mb-0`, see §4.2) |

- **Typography scale** (px at the 15px root in brackets):

| Role | Exact classes |
|---|---|
| Display (login, guest hero) | `font-heading text-3xl lg:text-4xl font-extrabold tracking-tight text-ink` [28–34px] |
| Page title (h1) | `font-heading text-2xl md:text-3xl font-bold tracking-tight text-ink` [22.5–28px] |
| Eyebrow | `text-xs font-bold uppercase tracking-wider text-ink-muted` [11.25px] |
| Page description | `text-xs md:text-sm text-ink-muted leading-relaxed` |
| Dialog / panel title (h2) | `font-heading text-lg font-bold tracking-tight text-ink` [17px] (was `text-xl`, `Modal.tsx:84`) |
| Section heading (h2/h3) | `text-sm font-bold text-ink` + description `text-xs text-ink-muted` |
| Group heading (h4, inside forms) | `text-xs font-bold uppercase tracking-wider text-ink-muted` |
| Card title | `text-sm font-bold text-ink` |
| Body / table cell | `text-xs text-ink` (long copy `text-sm leading-relaxed`) |
| Field label | `text-xs font-semibold text-ink-deep` |
| Hint / error / meta | `text-2xs text-ink-muted` / `text-2xs font-medium text-danger-ink` |
| Table header | `text-2xs font-bold uppercase tracking-wider text-ink-muted` |
| Filter label | `text-2xs font-bold uppercase tracking-wider text-ink-muted` |
| Badge | `text-2xs font-bold` (pill) / `text-xs font-medium` (dot) |
| Metric value | `text-2xl font-extrabold tracking-tight tabular-nums text-ink` |
| Money | add `tabular-nums`; totals `font-bold` |
| Codes, slugs, booking refs | `font-mono text-xs text-ink-muted` (refs in lists `text-ink font-semibold`) |
| Grid cell text | `text-2xs tabular-nums` (price mode value `text-xs font-semibold`) |

---

## 3. Layout system

### 3.1 App shell

> **🧑 HUMAN CHECKPOINT UI-CP-05 — app shell**: approve the sidebar groups, top-bar order, what global search finds, and where "+ New booking" lives. Show a 1440px and a 390px screenshot. Approved = layout accepted (navigation changes are product decisions).

```
┌──────────────┬───────────────────────────────────────────────────────────────────────────┐
│ [■] staywise │ [≡][⇤] [🏨 Bell Hotel ▾]   [🔍 Search bookings, guests, hotels…  ]  [+ New booking] [🔔] [R ▾] │  h-16
│ HOTEL OPS    ├───────────────────────────────────────────────────────────────────────────┤
│──────────────│                                                                           │
│ ◉ Today      │   max-w-[1600px] p-4 sm:p-5 lg:p-6                                        │
│ 📅 Bookings  │   ┌ PageHeading ───────────────────────────────────────────────────────┐  │
│ 🏨 Hotels    │   │ EYEBROW                                                [actions]   │  │
│              │   │ Title                                                              │  │
│ THIS HOTEL   │   │ Description                                                        │  │
│  Overview    │   └────────────────────────────────────────────────────────────────────┘  │
│  Rooms&rates │   ┌ PageCard / DataTable ──────────────────────────────────────────────┐  │
│  Inventory   │   │                                                                    │  │
│  Bookings    │   └────────────────────────────────────────────────────────────────────┘  │
│              │                                                                           │
│ ADMIN        │                                                                           │
│  Audit log   │                                                                           │
│  Staff       │                                                                           │
│──────────────│                                                                           │
│ [?] Need a hand│                                                                         │
└──────────────┴───────────────────────────────────────────────────────────────────────────┘
  w-68 (collapsed w-20)
```

- **Sidebar (`layout/Sidebar.tsx`)** — keep the built white sidebar (`bg-paper border-r border-line shadow-2xs`, `w-68` / `w-20`), the `BrandMark` logo and `NavItem` (active: `bg-brand-pale text-brand-primary border border-brand-border/60`).
  - **Groups (target):**
    - no label: **Today** (`/admin/today`, P3), **Bookings** (`/admin/bookings`, P6), **Hotels** (`/admin/hotels`);
    - **This hotel** (only when the URL has `:hotelId`; label shows the hotel name truncated): Overview, Rooms & rates, Inventory, Bookings (P6) — links to `/admin/hotels/:hotelId/<tab>`;
    - **Admin:** Audit log (`/admin/audit`, P1), Staff (`/admin/settings/staff`, when built). Reports (P8) appears later.
  - **Removed after P2:** "Room types", "Availability", "Base rates" items (routes redirect per README).
  - **Active match:** `NavItem` must treat a link as active when `location.pathname` **starts with** its `to` (today it is exact, `Sidebar.tsx:169`), except Hotels, which is active only on `/admin/hotels` and `/admin/hotels/new`.
  - **Icons:** use the domain icon table in [§7.1](#71-iconography) (Today `CalendarCheck`, Bookings `BookOpen`, Hotels `Building2`, Audit log `History`, Staff `UserCog`), size 20.
  - **Help chip:** `bg-brand-pale text-brand-primary` (was `bg-sky-100/70`, `Sidebar.tsx:115`).
- **Top bar (`layout/Topbar.tsx`)** — `sticky top-0 z-20 h-16 bg-paper/95 backdrop-blur-md border-b border-line shadow-2xs`, horizontal padding **`px-4 sm:px-5 lg:px-6`** (matches content; was `px-6 md:px-8`, `Topbar.tsx:39`).
  - **Order (≥ md):** mobile menu (md:hidden) · collapse toggle · **`HotelSwitcher`** · **`GlobalSearch`** (`flex-1 max-w-xl`) · spacer · **"+ New booking"** (`Button primary sm`, P4+) · notifications · profile.
  - **"+ New booking":** visible from P4 to users with `bookings.create`. With one hotel in context it goes to `/admin/hotels/:hotelId/bookings/new`; with "All hotels" it opens the switcher list first ("Choose a hotel for this booking").
  - **Notifications:** red dot only when `count > 0` (was always on, `Topbar.tsx:94`). Hide the bell until notifications exist (P6).
  - **Avatar:** `bg-brand-pale text-brand-primary` (was raw hex, `Topbar.tsx:108`, `:128`).
  - **Phone (< md):** row = menu · `HotelSwitcher` (`flex-1 min-w-0`, name truncates) · search icon button (opens `GlobalSearch` as a full-width sheet under the bar) · "+" icon button (`aria-label="New booking"`) · avatar.
- **`GlobalSearch` scope:** P1 hotels (today's behaviour); P6 adds bookings by reference, guest name and phone. Results dropdown grouped "Bookings" / "Hotels", max 5 each, "See all results" → `/admin/bookings?search=`.

### 3.2 Page template

- **Every routed page** = `<div className="space-y-6">` → `PageHeading` → optional `Alert`s → content (`PageCard`, `DataTable`, metric row).
- **PageHeading usage rules:**
  - **List pages:** eyebrow = area in CAPS ("PROPERTY DIRECTORY", "BOOKINGS", "AUDIT LOG"); title = plural noun; action = primary create button.
  - **Record pages:** eyebrow = record type ("HOTEL", "BOOKING", "EDIT ROOM TYPE"); title = record name/ref; description = key facts joined by " · "; action = status badge(s) + actions (outline first, primary last).
  - **Never** put the action outside `PageHeading` in a sibling flex row (audit RT1).
- **Hotel workspace pages** (all `/admin/hotels/:hotelId/*`) use `HotelWorkspaceLayout` (feature, P1): the hotel `PageHeading` + `Tabs variant="underline"` with route links, then the tab content. See [§5.2](#52-hotel-workspace-shell-p1).

### 3.3 Containers and section headings

- **Page card:** `PageCard` ([§4.3](#43-new-components)) — the only allowed wrapper for page-level content that is not a `DataTable`.
- **Inner card:** `rounded-xl border border-line bg-paper shadow-2xs p-4` (hover `hover:border-ink-faint` only when clickable).
- **Info panel** (read-only facts inside a form/dialog): `rounded-xl border border-line bg-surface-subtle p-3 text-xs`.
- **Section heading:** `SectionHeading` with `level="section"` (h2/h3 style) or `level="group"` (CAPS form-group style); `actions` slot on the right; optional `step` number for task lists and the New booking page.

### 3.4 Forms

- **Grid:** `grid grid-cols-1 sm:grid-cols-2 gap-5`; long fields use `Field fullWidth`; three short fields (e.g. min stay, cut-off, rooms) use `sm:grid-cols-3`.
- **Field:** `Field label hint error required`; controls default `size="md"` (h-9). Filter bars use `size="sm"` (h-8).
- **Footer:** `<div className="pt-6 border-t border-line flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">` → left: dirty text `text-xs text-warning-ink` ("You have unsaved changes") with `sm:mr-auto`; right: Cancel `outline md` (only when the form can be left), Save `primary md` with `<Check size={16} />`.
- **Read-only / archived:** wrap in `<fieldset disabled>` and show `Alert tone="warning" icon={<Lock size={16} />}` above the card (as `HotelWorkspace.tsx:277-281`).

### 3.5 Breakpoints and phone layouts

- **Breakpoints:** Tailwind defaults — `sm` 640, `md` 768 (sidebar becomes fixed), `lg` 1024, `xl` 1280, `2xl` 1536. Body min width 360px (`styles.css:58`).
- **Test widths for screenshots:** 390 (phone), 768 (tablet), 1440 (desktop).
- **Phone rules:**
  - page gutter `p-4`; `PageHeading` stacks, action buttons go full width (`w-full sm:w-auto`);
  - tables with more than 4 columns switch to card rows below `md` (use `DataTable renderBody` with a `<Feature>MobileList`, as `HotelCardGrid` does);
  - `SidePanel` and `BulkEditPanel` become full-screen sheets;
  - sticky bottom action bar for the New booking page and guest checkout (`fixed inset-x-0 bottom-0 bg-paper border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]`);
  - inventory grid uses **agenda mode** ([§5.6](#56-inventory-grid--bulk-edit-p2)).

---

## 4. Component inventory

### 4.1 Existing shared components (`components/ui/`)

| Component | Key props | Use when | Known fixes (audit ID) |
|---|---|---|---|
| `Button` | `variant` primary/secondary/outline/ghost/danger, `size` sm/md/lg, `isLoading`, `loadingLabel`, `leftIcon`, `rightIcon`, async `onClick` | Every clickable action that is not a link | Add `danger-ghost` (R9); `secondary` hover is `bg-emerald-100` (`Button.tsx:19`) → `hover:bg-brand-border/40`; never override colours/heights via `className` (R3) |
| `Input`, `Select`, `Textarea` | `size`, `isError`, icons, `showCount` | All text/select entry | Slate/rose → tokens (`Input.tsx:36-39`, `Select.tsx:24-27`) (R15) |
| `MoneyInput` | `name`, `currency`, `defaultMinorUnits`, `onMinorUnitsChange` | Any money entry | — |
| `DatePicker`, `Combobox`, `Checkbox`, `PasswordInput`, `ReasonField` | see `docs/components.md` | Dates, searchable lists, ticks, passwords, audit reasons | Arrow-key grid in DatePicker (UX S4) |
| `Field` | `label`, `required`, `error`, `hint`, `fullWidth` | Wrap every control | Link label to control with `useId` + `htmlFor` (UX S1); tokens (`Field.tsx:25-32`) |
| `PageHeading` | `eyebrow`, `title`, `description`, `action` | Top of every page | Tokens + `font-heading`; drop `mb-5` default (use `className="mb-5"` only outside `space-y-6`); accept `title: ReactNode` for a status badge next to the title |
| `DataTable` | `columns`, `rowKey`, `loading`, `error`, `toolbarHeader`, `pagination`, `onRowClick`, `selectedRowKeys`, `renderBody` | Every list | Error row → `Alert tone="error"` inside `p-4` (`DataTable.tsx:66-69`); slate → tokens; add `stickyFirstColumn?: boolean` (P6 bookings) |
| `Pagination` | page/size props | Under lists | — |
| `Tabs` | `items`, `activeId`, `onChange`, `variant` underline/pills, `size` | Page tabs, segmented toggles | Active badge `bg-sky-100` → `bg-brand-pale text-brand-primary` (`Tabs.tsx:94`); add `TabItem.to` (route link) and `TabItem.status` (`'done' \| 'todo' \| 'blocked'`) (R5) |
| `Status` | `status`, `variant` pill/dot | **Deprecated** after `StatusBadge` ships | Until then: add `ACTIVE`/`DISABLED`, neutral fallback instead of DRAFT, `capitalize` pill (RT5, R10) |
| `Alert` | `tone` error/success/warning/info, `icon`, `onClose` | Page/section messages | Tokens; remove default `my-3` (callers own spacing); add optional `title` and `action` slot |
| `EmptyState` | `icon`, `title`, `copy`, `action`, `compact` | Empty lists/sections | Tokens (`EmptyState.tsx:22-26`); add `variant` ([§4.2](#42-changes-to-existing-shared-components)) |
| `MetricCard` | `label`, `value`, `detail`, `icon`, `tone`, `loading` | KPI rows | Remove raw hex + fake sparkline (`MetricCard.tsx:25-81`, `:122-143`); tones → semantic; drop `teal`/`sand` (D6, R11) |
| `Modal` | `variant` drawer/dialog, `size`, `title`, `subtitle`, `footer`, `closeOnBackdrop` | Dialogs (see rule §4.4) | Focus trap + focus return (UX S2); default `closeOnBackdrop` false for forms; title `text-lg font-heading`; backdrop `bg-overlay` |
| `ConfirmDialog` | `title`, `message`, `confirmLabel`, `variant`, `icon`, `isLoading` | Yes/no confirmations only | Default title "Confirm Action" → "Are you sure?" (sentence case, `ConfirmDialog.tsx:23`); icon chip tokens (`:80`). **Rule:** confirm label names the outcome ("Archive hotel", "Discard changes"); money confirmations name the hotel and amount; anything that needs a reason or a fee preview uses a feature dialog built on `Modal`, not `ConfirmDialog` |
| `Loader`, `Spinner`, `LoadingRows`, `Skeleton` | — | Page loading / table loading | `Spinner` uses a CSS class that no longer exists (`Spinner.tsx:4`) → plain classes |
| `Toast` (`useToast`) | `success/error/info` | Transient feedback after a save | Tokens (`Toast.tsx:15-19`) |
| `NotFound`, `ErrorBoundary` | — | 404 / crash | Link button → `ButtonLink` (A1); shadow and sentence case (A5) |
| `KpiStrip`, `ImageUploadDropzone` | — | **Unused** (audit scope) | Candidates for deletion (UI-CP-28) |

- **Feature components that stay and get restyled:** `HotelSetupChecklist` (moves to Overview as a task list, [§5.5](#55-overview-p3)), `HotelMediaGalleryManager`, `PhotoModal`, `PublishBlockersInfo` (amber → warning tokens, `PublishBlockersInfo.tsx:48`), `HotelSetupProgress` (→ `ProgressBar`), `HotelCardGrid`, `HotelFiltersBar`, `HotelSummaryCards`, `HotelDetailsFields`, `CancellationPolicyFields`, `RoomTypeFields`.

### 4.2 Changes to existing shared components

> **🧑 HUMAN CHECKPOINT UI-CP-12 — shared component changes**: each change below alters every screen that uses the component. Show the prop diff and one screenshot per component. Approved = per-component "yes".

- **`Button`:** add `variant="danger-ghost"` → `bg-transparent hover:bg-danger-pale text-danger-ink border-transparent focus-visible:ring-danger`. Replaces `ghost` + rose overrides (`HotelWorkspace.tsx:241`, `PhotoModal.tsx:303`). No `on-dark` variant unless a dark surface appears (none in MVP).
- **`Status`:** until `StatusBadge` replaces it — add `ACTIVE` (success) and `DISABLED` (neutral) to `pillConfig`; unknown status → neutral grey with `CircleHelp`, not DRAFT; add `capitalize` to the pill class (`Status.tsx:74`). After `StatusBadge` ships, `Status` becomes a thin wrapper (`<StatusBadge domain="hotel" …/>`) and is removed when unused.
- **`Tabs`:**
  - `TabItem.to?: string` → renders a `NavLink` with `aria-current="page"` instead of a `button role="tab"` (route tabs for the workspace);
  - `TabItem.status?: 'done' | 'todo' | 'blocked'` → leading icon: `CheckCircle2` 14 `text-success` / dot `w-2 h-2 rounded-full bg-warning` / `Lock` 14 `text-ink-light`;
  - `TabItem.badge` tone prop `badgeTone?: 'neutral' | 'warning'` (issue counts use warning);
  - underline variant scrolls horizontally on phone: wrapper `overflow-x-auto [scrollbar-width:none]`, items `whitespace-nowrap`, no wrap.
- **`Modal`:** focus the first focusable element (or the title) on open, trap Tab, return focus to the trigger on close; `closeOnBackdrop` default **false**; header `p-5`, body `p-5`, footer `p-4 bg-surface-subtle border-t border-line flex justify-end gap-2`; all callers pass buttons via `footer` (R8).
- **`MetricCard`:** remove gradient, sparkline and raw hex. New look: `rounded-xl border border-line bg-paper shadow-2xs px-4 py-3 min-h-[88px]`; icon chip `w-7 h-7 rounded-lg` with `bg-<tone>-pale text-<tone>-ink`; label `text-xs font-bold text-ink-deep`; value per typography table; detail `text-2xs text-ink-muted`. `tone`: `'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'`. Optional `onClick` / `to` makes the whole card a link (`hover:border-ink-faint`).
- **`EmptyState`:** `variant?: 'first-run' | 'no-results' | 'error' | 'not-started'`:

| Variant | Icon chip | Default action | Example |
|---|---|---|---|
| `first-run` (default) | `bg-brand-pale text-brand-primary` | primary create button | "No hotels yet — add your first hotel" |
| `no-results` | `bg-surface-muted text-ink-muted`, `SearchX` | outline "Clear filters" | "No hotels match these filters" (fixes UX L5) |
| `error` | `bg-danger-pale text-danger`, `CloudOff` | outline "Try again" | load failed |
| `not-started` | `bg-surface-muted text-ink-light`, `Lock` | none, copy says what comes first | "Add a room type before setting prices" |

- **`Field`:** generate `id` with `useId()`, pass it to the child via `React.cloneElement` when the child has no `id`; `aria-describedby` → hint/error ids.
- **`Alert`:** add `title?: string` (bold first line) and `action?: ReactNode` (right-aligned, `Button size="sm"`); remove `my-3`.

### 4.3 New components

- **Rule:** every component in this section is a **🧑 HUMAN CHECKPOINT** (ui-architect: approval before creating a shared component). Present the props interface and file path first; build only after "approved".
- **Count:** 21 new components (tables below). Sub-parts listed under a component (e.g. `InventoryGridCell`) live in the same folder and are **not** separately shared.

| # | Component | Location | Phase | Checkpoint |
|---|---|---|---|---|
| 1 | `HotelSwitcher` | `layout/HotelSwitcher.tsx` | P1 | UI-CP-06 |
| 2 | `GlobalSearch` | `layout/GlobalSearch.tsx` | P1 (P6 bookings) | UI-CP-05 |
| 3 | `PageCard` | `components/ui/PageCard.tsx` | P1 | UI-CP-07 |
| 4 | `SectionHeading` | `components/ui/SectionHeading.tsx` | P1 | UI-CP-07 |
| 5 | `Badge` | `components/ui/Badge.tsx` | P1 | UI-CP-08 |
| 6 | `StatusBadge` (+ `status-tones.ts`) | `components/ui/StatusBadge.tsx` | P1 | UI-CP-08 |
| 7 | `HealthBadge` | `features/rooms/HealthBadge.tsx` | P1 | UI-CP-09 |
| 8 | `SidePanel` (+ `useFocusTrap`) | `components/ui/SidePanel.tsx`, `hooks/useFocusTrap.ts` | P1 | UI-CP-10 |
| 9 | `ButtonLink` | `components/ui/ButtonLink.tsx` | P1 | UI-CP-11 |
| 10 | `BrandMark` | `components/ui/BrandMark.tsx` | P1 | UI-CP-11 |
| 11 | `StatTile` | `components/ui/StatTile.tsx` | P1 | UI-CP-11 |
| 12 | `QuickActionCard` | `components/ui/QuickActionCard.tsx` | P1 | UI-CP-11 |
| 13 | `ProgressBar` | `components/ui/ProgressBar.tsx` | P1 | UI-CP-11 |
| 14 | `DropdownMenu` | `components/ui/DropdownMenu.tsx` | P1 | UI-CP-11 |
| 15 | `InventoryGrid` (+ `InventoryGridCell`, `InventoryLegend`, `InventoryAgendaList`) | `features/inventory/grid/` | P2 | UI-CP-14, UI-CP-15 |
| 16 | `BulkEditPanel` | `features/inventory/grid/BulkEditPanel.tsx` | P2 | UI-CP-16 |
| 17 | `DateRangePicker` | `components/ui/DateRangePicker.tsx` | P2 | UI-CP-17 |
| 18 | `GuestCountInput` | `components/ui/GuestCountInput.tsx` | P4 | UI-CP-17 |
| 19 | `PriceBreakdown` | `features/bookings/PriceBreakdown.tsx` | P4 | UI-CP-19 |
| 20 | `HoldIndicator` | `features/bookings/HoldIndicator.tsx` | P4 | UI-CP-20 |
| 21 | `Timeline` | `components/ui/Timeline.tsx` | P6 | UI-CP-24 |

#### 4.3.1 `HotelSwitcher` (layout, P1)

> **🧑 HUMAN CHECKPOINT UI-CP-06 — HotelSwitcher**: approve props and a screenshot of closed, open (search + recent), single-hotel and "All hotels" states. Approved = look and rules match README "Global hotel switcher rules".

```ts
export interface HotelSwitcherOption {
  id: string;
  name: string;
  city?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED';
  thumbnailUrl?: string;
}
export interface HotelSwitcherProps {
  value: string | 'ALL' | null;            // from the URL :hotelId; null = none chosen
  options: HotelSwitcherOption[];          // only hotels the user can access (server list)
  recentIds?: string[];                    // last 3 used, newest first
  allowAll?: boolean;                      // true only on /admin/bookings, /admin/today, /admin/reports
  loading?: boolean;
  onSearch?: (q: string) => void;          // server search when > 20 hotels
  onBeforeChange?: () => Promise<boolean>; // caller asks "Discard unsaved changes?"; false cancels
  onChange: (id: string | 'ALL') => void;  // caller navigates; the switcher never stores state
  className?: string;
}
```

- **Closed:** `Button`-like trigger `h-9 px-3 rounded-lg border border-line bg-paper hover:bg-surface-subtle shadow-2xs inline-flex items-center gap-2 max-w-[260px]`: `Building2` 16 `text-brand-primary` · name `text-xs font-semibold text-ink truncate` · status dot (`StatusBadge variant="dot" hideLabel`) · `ChevronsUpDown` 14 `text-ink-light`. "All hotels" shows `Layers` icon and the text "All hotels".
- **Single hotel** (`options.length === 1`): static `text-xs font-semibold text-ink` name with the `Building2` icon, no button, no chevron.
- **No hotel chosen** (`value === null` on an editing page): trigger text "Choose a hotel" `text-warning-ink` + `AlertCircle`.
- **Open popover:** `absolute mt-2 w-80 rounded-xl border border-line bg-paper shadow-lg p-2 z-40`:
  - `Input size="sm" leftIcon={<Search size={14}/>} placeholder="Search hotels"` (autofocus);
  - group label `text-2xs font-bold uppercase tracking-wider text-ink-muted px-2 pt-2 pb-1` "Recent" (≤ 3), then "All hotels" (`max-h-72 overflow-y-auto`);
  - option row `flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer` — 28px thumbnail `rounded-md bg-brand-pale` (or `Building2` 14) · name `text-xs font-semibold` + city `text-2xs text-ink-muted` · status dot right; active option `bg-surface-muted`; selected `Check` 14 `text-brand-primary`;
  - "All hotels" row first when `allowAll` (`Layers` icon);
  - footer link "View all hotels" `text-xs font-semibold text-brand-primary` → `/admin/hotels`.
- **Keyboard:** ARIA combobox + listbox (reuse the keyboard logic from `Combobox.tsx`; extract a hook if needed rather than copying). Esc closes and returns focus.
- **Archived hotels** appear only when searched, with the neutral "Archived" badge.

#### 4.3.2 `GlobalSearch` (layout, P1)

```ts
export interface GlobalSearchProps {
  scopes: Array<'hotels' | 'bookings'>; // P1: ['hotels']; P6: ['bookings','hotels']
  hotelId?: string;                     // when set, bookings results are limited to this hotel
  className?: string;
}
```

- **Look:** `Input size="md" type="search" leftIcon={<Search size={16}/>}` with placeholder from scopes ("Search hotels…" in P1, "Search bookings, guests, hotels…" in P6); `⌘K`/`Ctrl K` hint chip `text-2xs border border-line rounded px-1` on the right (≥ lg).
- **Results popover:** same shell as the switcher popover, groups "Bookings" (ref `font-mono` · guest · dates · `StatusBadge`) and "Hotels" (name · city); "See all results" at the bottom; debounced 250ms (read query only).

#### 4.3.3 `PageCard` (shared, P1)

> **🧑 HUMAN CHECKPOINT UI-CP-07 — PageCard + SectionHeading**: approve both prop lists and a screenshot of the Details tab using them. Approved = the workspace's local `SectionTitle` and the CAPS group headings are replaced by these.

```ts
export interface PageCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'form';
  padding?: 'none' | 'md' | 'lg';   // none: '' · md: 'p-4 sm:p-5' · lg (default): 'p-4 sm:p-6 lg:p-8'
  header?: React.ReactNode;          // usually <SectionHeading>; rendered above children with mb-5
  footer?: React.ReactNode;          // form footer; rendered with 'mt-6 pt-6 border-t border-line'
  className?: string;                // layout only (grid placement, height)
}
```

- **Classes:** `bg-paper border border-line rounded-2xl shadow-2xs` + padding.
- **Replaces:** `HotelWorkspace.tsx:376`, `HotelCreateForm.tsx:58`, `BaseRatesView.tsx:45` (RA1), Dashboard cards (D5), the availability calendar wrapper (IN1).

#### 4.3.4 `SectionHeading` (shared, P1)

```ts
export interface SectionHeadingProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  level?: 'section' | 'group';   // section: h2 text-sm font-bold text-ink; group: h3 text-xs font-bold uppercase tracking-wider text-ink-muted
  as?: 'h2' | 'h3' | 'h4';       // semantic level; defaults h2 (section) / h3 (group)
  icon?: React.ReactNode;        // 16px, text-ink-muted, before the title
  step?: number;                 // renders a 22px circle 'w-5.5 h-5.5 rounded-full bg-brand-pale text-brand-primary text-2xs font-bold'
  actions?: React.ReactNode;     // right side, Button size="sm"
  divider?: boolean;             // adds 'pb-3 border-b border-line'
  className?: string;
}
```

- **Layout:** `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3`; description `text-xs text-ink-muted mt-0.5`.
- **Replaces:** `SectionTitle` (`HotelWorkspace.tsx:435-442`), `h4` group headings (`HotelDetailsFields.tsx:223`, `HotelCreateForm.tsx:66`), Title Case headings (`HotelDetailPage.tsx:192`, `:223`, `:245`, `:271`, `:314`), `InventoryCalendarView.tsx:32`.

#### 4.3.5 `Badge` and `StatusBadge` (shared, P1)

> **🧑 HUMAN CHECKPOINT UI-CP-08 — Badge + StatusBadge**: approve props, the tone classes, and a screenshot sheet of every status in [§6](#6-status-colour--badge-matrix) (pill and dot). Approved = matrix renders as specified; `Status` callers can migrate.

```ts
export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps {
  tone?: Tone;                    // default 'neutral'
  variant?: 'pill' | 'dot' | 'soft-square';  // soft-square: rounded-md, for codes/categories/counts
  icon?: React.ReactNode;         // 12px; ignored for 'dot'
  children: React.ReactNode;
  className?: string;
}

export type StatusDomain =
  | 'hotel' | 'roomType' | 'health' | 'inventory' | 'hold' | 'booking' | 'payment' | 'refund' | 'setupStep';

export interface StatusBadgeProps {
  domain: StatusDomain;
  status: string;                 // enum value from the API, e.g. 'CONFIRMED'
  variant?: 'pill' | 'dot';       // default 'pill'
  hideLabel?: boolean;            // dot only, keeps an sr-only label
  labelOverride?: string;         // e.g. payment PENDING + PAY_AT_HOTEL → 'Due at hotel' (see §6)
  className?: string;
}
```

- **Tone classes** (single source: `components/ui/status-tones.ts` exports `TONE_CLASSES` and `STATUS_MAP`):

| Tone | Pill | Dot colour | Icon colour |
|---|---|---|---|
| `brand` | `bg-brand-pale text-brand-primary border-brand-border` | `bg-brand-primary` | `text-brand-primary` |
| `success` | `bg-success-pale text-success-ink border-success-line` | `bg-success` | `text-success` |
| `warning` | `bg-warning-pale text-warning-ink border-warning-line` | `bg-warning` | `text-warning` |
| `danger` | `bg-danger-pale text-danger-ink border-danger-line` | `bg-danger` | `text-danger` |
| `info` | `bg-info-pale text-info-ink border-info-line` | `bg-info` | `text-info` |
| `neutral` | `bg-surface-muted text-ink-deep border-line` | `bg-ink-light` | `text-ink-muted` |

- **Pill base:** `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-2xs font-bold whitespace-nowrap`.
- **Dot base:** `inline-flex items-center gap-1.5 text-xs font-medium text-ink-deep` + `w-1.5 h-1.5 rounded-full` dot (no border, no fill — quieter in tables).
- **Unknown status:** neutral tone, `CircleHelp` icon, label = status in sentence case; `console.warn` once in dev (`frontend-ui.md` StatusBadge rule).
- **Replaces:** `Status` (all call sites), hand-built amber "No price configured" boxes (`HotelDetailPage.tsx:402`, `features/rates/HotelRatesTab.tsx:189`), inline status text (`HotelAvailabilityTab.tsx:141-144`), code chips.

#### 4.3.6 `HealthBadge` (feature, P1)

> **🧑 HUMAN CHECKPOINT UI-CP-09 — HealthBadge**: approve labels, tones and fix actions (copy is a product decision). Approved = table below accepted or edited.

```ts
export type RoomHealth = 'BOOKABLE' | 'MISSING_PRICE' | 'NO_OPEN_DATES' | 'ZERO_RATE' | 'SUSPICIOUS_RATE' | 'DISABLED';

export interface HealthBadgeProps {
  health: RoomHealth;              // computed on the server (readiness/health endpoint), never in the UI
  detail?: string;                 // e.g. 'No dates after 30 Nov'
  fix?: { label: string; to?: string; onClick?: () => void }; // rendered as Button/ButtonLink variant="outline" size="sm"
  layout?: 'inline' | 'stacked';   // inline (table cell): badge + fix button in a row; stacked (cards/Overview): badge, detail, fix
  className?: string;
}
```

| Health | Label | Tone | Icon | Default fix |
|---|---|---|---|---|
| `BOOKABLE` | Bookable | `neutral` dot (quiet) | `CheckCircle2` | none |
| `MISSING_PRICE` | Missing price | `warning` pill | `IndianRupee` | "Set price" → side panel Price tab |
| `NO_OPEN_DATES` | No open dates | `warning` pill | `CalendarX2` | "Open dates" → `/inventory?roomType=` |
| `ZERO_RATE` | Price is ₹0 | `danger` pill | `AlertTriangle` | "Fix price" → inventory grid filtered to those dates |
| `SUSPICIOUS_RATE` | Unusual price | `warning` pill | `AlertTriangle` | "Review" → inventory grid |
| `DISABLED` | Disabled | `neutral` pill | `CircleSlash` | "Enable" (with reason dialog) |

#### 4.3.7 `SidePanel` (shared, P1)

> **🧑 HUMAN CHECKPOINT UI-CP-10 — SidePanel**: approve the overlay-drawer choice (list stays visible behind a light backdrop) and the tab header. Alternative is a docked panel that shrinks the table on ≥ xl; it is harder to build and is **not** recommended for MVP. Approved = overlay drawer accepted.

```ts
export interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerExtra?: React.ReactNode;        // e.g. <StatusBadge/> next to the title
  tabs?: TabItem[];                     // shared Tabs items, underline, size md
  activeTab?: string;
  onTabChange?: (id: string) => void;   // caller handles dirty-check before switching
  width?: 'md' | 'lg' | 'xl';           // md max-w-[480px] · lg max-w-[640px] (default) · xl max-w-[800px]
  dirty?: boolean;                      // when true, close asks ConfirmDialog "Discard unsaved changes?"
  footer?: React.ReactNode;             // right-aligned buttons, Button size="sm"
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
}
```

- **Structure:** fixed `inset-y-0 right-0 z-40 w-full {width} bg-paper shadow-2xl border-l border-line flex flex-col`; backdrop `fixed inset-0 bg-overlay-light z-30` (click closes only when not dirty).
  - header `px-5 pt-5 pb-0 border-b border-line`: title `font-heading text-lg font-bold`, subtitle `text-xs text-ink-muted`, close `X` 18 icon button top-right; tabs flush at the bottom of the header (`-mb-px`);
  - body `flex-1 overflow-y-auto p-5`;
  - footer `p-4 border-t border-line bg-surface-subtle flex justify-end gap-2`.
- **Phone:** `w-full` (full screen), header sticky, footer sticky.
- **Motion:** slide in `translate-x-full → translate-x-0`, `duration-200 ease-out`, `motion-reduce:transition-none`.
- **Accessibility:** `role="dialog" aria-modal="true" aria-labelledby`; `useFocusTrap`; Esc closes (asks when dirty); focus returns to the row that opened it.

#### 4.3.8 `ButtonLink` (shared, P1)

> **🧑 HUMAN CHECKPOINT UI-CP-11 — small shared set**: approve the props of `ButtonLink`, `BrandMark`, `StatTile`, `QuickActionCard`, `ProgressBar` and `DropdownMenu` (§4.3.8–4.3.13) together, with one screenshot sheet. Approved = all six accepted or the rejected ones named.

```ts
export interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonProps['variant']; size?: ButtonProps['size'];
  leftIcon?: React.ReactNode; rightIcon?: React.ReactNode; external?: boolean; className?: string;
}
```

- **Rule:** shares the class maps with `Button` — move `variantStyles`/`sizeStyles` from `Button.tsx:17-29` into `components/ui/button-styles.ts` and import in both. Never copy the strings.
- **Replaces:** `AccessPage.tsx:28-33`, `NotFound.tsx:28-34`, all "Fix" links, "View all" links.

#### 4.3.9 `BrandMark` (shared, P1)

```ts
export interface BrandMarkProps { size?: 'sm' | 'md' | 'lg'; tone?: 'brand' | 'on-dark'; withWordmark?: boolean; className?: string; }
```

- **Sizes:** sm `w-8 h-8 rounded-lg` icon 18 · md `w-10 h-10 rounded-xl` icon 22 · lg `w-14 h-14 rounded-2xl` icon 28; icon `Compass`.
- **Tones:** `brand` `bg-brand-primary text-white` (sidebar, boot); `on-dark` `bg-brand-lime text-brand-darkest` (login brand panel).
- **Wordmark:** "staywise" `text-base font-extrabold tracking-tight` + "HOTEL OPERATIONS" `text-2xs font-bold tracking-wider uppercase text-ink-muted` (as `Sidebar.tsx:47-50`).
- **Replaces:** `Sidebar.tsx:43-45`, `LoginPage.tsx:56`, `App.tsx:15-17`.

#### 4.3.10 `StatTile` (shared, P1)

```ts
export interface StatTileProps {
  label: string; value: React.ReactNode; hint?: string;
  tone?: Tone;                // colours the value only: neutral → text-ink; others → text-<tone>-ink
  icon?: React.ReactNode;     // 14px
  size?: 'sm' | 'md';         // sm: value text-base; md: value text-xl
  className?: string;
}
```

- **Look:** `rounded-xl border border-line bg-surface-subtle px-3 py-2.5`; label `text-2xs font-bold uppercase tracking-wider text-ink-muted`; value `font-bold tabular-nums`. Static facts only (no link, no trend).
- **Use:** policy facts on Overview, the counts in inventory dialogs (replaces emerald/orange/blue tiles `InventoryAdjustModal.tsx:110-125`), booking money summary, cancel fee preview.

#### 4.3.11 `QuickActionCard` (shared, P1)

```ts
export interface QuickActionCardProps { title: string; description: string; icon: React.ReactNode; to: string; badge?: React.ReactNode; className?: string; }
```

- **Look:** `Link` styled `group flex items-start gap-3 rounded-xl border border-line bg-paper p-4 shadow-2xs hover:border-brand-border hover:bg-brand-pale/40 transition-colors duration-150`; icon chip `w-9 h-9 rounded-lg bg-brand-pale text-brand-primary` (always brand — no per-card colours); title `text-sm font-bold text-ink`; description `text-xs text-ink-muted`; `ChevronRight` 16 `text-ink-light group-hover:text-brand-primary ml-auto`.
- **Replaces:** the four rainbow cards (`DashboardPage.tsx:190-251`, D4). Used on Today.

#### 4.3.12 `ProgressBar` (shared, P1)

```ts
export interface ProgressBarProps { value: number; max?: number; tone?: 'brand' | 'success' | 'warning'; label?: string; valueText?: string; size?: 'xs' | 'sm'; className?: string; }
```

- **Look:** track `w-full bg-surface-muted rounded-full overflow-hidden` (`h-1.5` xs, `h-2` sm); fill `bg-<tone>` `transition-[width] duration-300 motion-reduce:transition-none`; optional label row `flex justify-between text-xs` (label `font-semibold text-ink-deep`, value `font-bold text-ink-muted`). `role="progressbar"` with `aria-valuenow/min/max` and `aria-valuetext`.
- **Use:** `HotelSetupProgress` (ready → success, otherwise warning; replaces `HotelSetupProgress.tsx:15-19`), Overview completeness score (brand).

#### 4.3.13 `DropdownMenu` (shared, P1)

```ts
export interface DropdownMenuItem { id: string; label: string; icon?: React.ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean; disabledReason?: string; separatorBefore?: boolean; }
export interface DropdownMenuProps { items: DropdownMenuItem[]; triggerLabel: string; trigger?: React.ReactNode; align?: 'start' | 'end'; }
```

- **Trigger default:** `Button variant="outline" size="sm"` with `MoreHorizontal` 16 icon only and `aria-label={triggerLabel}`.
- **Menu:** `min-w-48 rounded-xl border border-line bg-paper shadow-lg p-1.5 z-40`; item `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-ink-deep hover:bg-surface-muted`; danger item `text-danger-ink hover:bg-danger-pale`; disabled `opacity-50` with `title={disabledReason}`; separator `my-1 border-t border-line`.
- **Keyboard:** `role="menu"`, arrow keys, Home/End, Esc returns focus. Hidden items for missing permissions are filtered by the caller (`Can`).

#### 4.3.14 `InventoryGrid` (feature, P2)

> **🧑 HUMAN CHECKPOINT UI-CP-14 — InventoryGrid**: approve props, every cell state (screenshot sheet: open, low, sold out, closed, not set, past, selected, focused, zero-rate warning; in each mode) and the 1440px layout with 14 and 30 days. Approved = legend and cells readable without colour.

```ts
export type GridMode = 'price' | 'availability' | 'restrictions' | 'bookings'; // 'bookings' = P6 calendar

export interface GridRoomRow { roomTypeId: string; name: string; code: string; totalRooms: number; disabled?: boolean; }

export interface GridCellData {               // all values from the server, per room type per date
  date: string;                               // YYYY-MM-DD in hotel time zone
  priceMinor: number | null;                  // DailyRate ?? BaseRate; null = no price
  priceSource: 'DAILY' | 'BASE' | 'NONE';
  total: number | null;                       // null = night not opened (no NightInventory)
  available: number; held: number; booked: number; blocked: number;
  closed: boolean; minStay: number | null; cutoffDays: number | null;
  rateFlag?: 'ZERO' | 'SUSPICIOUS';
}

export interface GridSelection { roomTypeIds: string[]; from: string; to: string; } // inclusive dates

export interface InventoryGridProps {
  rooms: GridRoomRow[];
  dates: string[];                            // visible window (7 / 14 / 30)
  cells: Record<string, GridCellData>;        // key `${roomTypeId}:${date}`
  mode: GridMode;
  currency: string;
  today: string;                              // hotel-local today
  selection: GridSelection | null;
  onSelectionChange: (s: GridSelection | null) => void;
  onOpenBulkEdit: (s: GridSelection) => void; // Enter key, double-click, or toolbar button
  loading?: boolean;
  readOnly?: boolean;                         // no selection; cells still focusable for reading
  lowThreshold?: number;                      // default 2 rooms left → 'low'
}
```

- **Toolbar (above the grid, inside the `PageCard` header):**
  - left: `Tabs variant="pills" size="sm"` mode switch "Price · Availability · Restrictions" (+ "Bookings" in P6);
  - centre: `Button outline sm` `ChevronLeft` / "Today" / `ChevronRight`, `DatePicker` jump, range `Tabs pills sm` "7 · 14 · 30 days";
  - right: `Button primary sm` "Edit selected" (disabled until a selection; shows "Edit 14 nights") .
- **Grid layout:** `overflow-auto max-h-[calc(100vh-280px)] rounded-xl border border-line`, `role="grid" aria-rowcount aria-colcount`, `table-fixed border-separate border-spacing-0`.
  - **Sticky corner + header row** (`sticky top-0 z-20 bg-paper`): each date header `w-16 min-w-16 h-12 px-1 text-center border-b border-line` — weekday `text-2xs font-bold uppercase text-ink-muted`, day `text-sm font-bold text-ink tabular-nums`, month name on the 1st and on the first column `text-2xs text-brand-primary font-bold`; weekend headers `bg-surface-subtle`; today header `text-brand-primary` + `border-b-2 border-brand-primary`. Clicking a date header selects that column for all rooms.
  - **Sticky first column** (`sticky left-0 z-10 bg-paper w-44 min-w-44 border-r border-line px-3`): room name `text-xs font-bold text-ink truncate`, code `text-2xs font-mono text-ink-muted`, total rooms `text-2xs text-ink-muted` ("10 rooms"); disabled room rows `opacity-60` + neutral "Disabled" badge. Clicking the room cell selects the whole row in view.
  - **Body cell** (`InventoryGridCell`, `w-16 h-14 border-b border-r border-line-subtle text-center align-middle cursor-pointer select-none`), `role="gridcell" aria-selected`, `aria-label` = full sentence ("Deluxe King, Tue 21 Oct: ₹3,500, 4 of 10 free, open").
- **Cell content per mode:**

| Mode | Line 1 (`text-xs font-semibold tabular-nums`) | Line 2 (`text-2xs text-ink-muted`) | Corner marks |
|---|---|---|---|
| Price | short price "3,500" (₹ in the column header legend, not each cell); "—" when `NONE` | "base" when `priceSource === 'BASE'`, nothing when `DAILY` (daily overrides render `font-bold text-ink`, base `text-ink-deep`) | `AlertTriangle` 10 `text-warning` top-right on `rateFlag` |
| Availability | "4/10" (available/total) | "1 held" when `held > 0` (`text-info-ink`) | `Lock` 10 when closed |
| Restrictions | "Open" / "Closed" | "Min 2N" · "Cut-off 1d" (each only when set) | — |
| Bookings (P6) | booked count "6 booked" | "4 free" | info dot when `held > 0` |

- **Cell states** (background + text; each state also has a word or icon, never colour alone):

| State | Rule | Classes | Non-colour cue |
|---|---|---|---|
| Open | `total > 0`, `available > lowThreshold`, not closed | `bg-paper hover:bg-surface-subtle` | — |
| Low | `0 < available ≤ lowThreshold` | `bg-warning-pale` | value shows "2/10" and line 2 "Low" in availability mode |
| Sold out | `available === 0`, not closed | `bg-danger-pale text-danger-ink` | "Sold out" text (availability mode) |
| Closed (stop-sell) | `closed === true` | `bg-stripes-closed text-ink-muted` | `Lock` icon + "Closed" |
| Not opened | `total === null` | `bg-surface-subtle text-ink-light` + `border-dashed` | "Not open" (`text-2xs`) |
| Past | `date < today` | `opacity-50 cursor-default`, not selectable | — |
| Selected | inside `selection` | `bg-selection ring-2 ring-inset ring-brand-primary/60` | `aria-selected="true"` |
| Focused | keyboard focus | `focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus` | — |
| Saving | pending write | `animate-pulse motion-reduce:animate-none` | "Saving…" sr-only |

- **Interaction:** click selects one cell; drag or Shift+click extends within the same row; Ctrl/⌘+click on a room cell adds rows; arrows move focus (roving `tabIndex`); Shift+arrows extend; Enter or "Edit selected" opens `BulkEditPanel`; Esc clears. Past dates are skipped.
- **Legend** (`InventoryLegend`, under the grid, `flex flex-wrap gap-4 text-2xs text-ink-muted`): one swatch `w-3.5 h-3.5 rounded border` per state + word; plus "Prices in ₹ per night, before tax" and "All dates in {hotel time zone}".
- **Loading:** grid skeleton (`Skeleton` blocks per cell). **Empty** (no room types): `EmptyState variant="not-started"` "Add a room type to see the grid" with `ButtonLink` to Rooms & rates.

#### 4.3.15 `BulkEditPanel` (feature, P2)

> **🧑 HUMAN CHECKPOINT UI-CP-16 — BulkEditPanel**: inventory and money writes. Approve the fields, the preview line, the zero/suspicious-rate warning, whether a reason is required, and the result display for partial failures. Approved = screenshot of each state accepted and copy confirmed.

```ts
export interface BulkEditChange {
  priceMinor?: number;                     // undefined = leave unchanged
  availability?: 'OPEN' | 'CLOSE';         // undefined = unchanged
  minStay?: number | null;                 // null = clear
  cutoffDays?: number | null;
  weekdays?: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>; // empty = all days
  reason: string;
}
export interface BulkEditPanelProps {
  open: boolean;
  selection: GridSelection;
  roomNames: Record<string, string>;
  currency: string;
  preview?: { nights: number; withBookings: number; rateFlag?: 'ZERO' | 'SUSPICIOUS' }; // from server dry-run
  onPreview: (c: BulkEditChange) => void;  // debounced dry-run call
  onApply: (c: BulkEditChange) => Promise<void>;
  onClose: () => void;
  result?: { applied: number; failed: Array<{ date: string; roomTypeId: string; message: string }> };
}
```

- **Shell:** `SidePanel width="md"` titled "Edit {n} nights", subtitle "Deluxe King · Tue 21 Oct – Mon 3 Nov".
- **Body sections** (`SectionHeading level="group"` each):
  1. **Price per night** — `Checkbox` "Change price" → `MoneyInput`; hint "Before tax. Overrides the base price on these dates."
  2. **Sale status** — `Tabs variant="pills" size="sm"` "Unchanged · Open for sale · Close (stop-sell)".
  3. **Restrictions** — `grid grid-cols-2 gap-5`: `Input type="number"` "Minimum stay (nights)", "Booking cut-off (days before)" each with a "Clear" ghost button.
  4. **Apply on** — seven toggle chips Mon…Sun (`Badge soft-square` styled buttons, `aria-pressed`).
  5. **Reason** — `ReasonField required`.
- **Preview** (sticky above footer, `rounded-xl bg-surface-subtle border border-line p-3 text-xs`): "Changes 14 nights across 1 room type · 2 nights already have bookings (their price does not change)". `rateFlag` → `Alert tone="danger"` "This sets a ₹0 price…" / `tone="warning"` "This price is much lower than usual…".
- **Footer:** Cancel `outline sm`, "Apply to 14 nights" `primary sm` (`isLoading`, `loadingLabel="Applying…"`).
- **Result:** success toast "Updated 14 nights"; partial failure keeps the panel open with `Alert tone="warning"` + list of failed dates.
- **Phone:** full-screen sheet (SidePanel phone behaviour).

#### 4.3.16 `DateRangePicker` (shared, P2; reused P4, P5 design)

> **🧑 HUMAN CHECKPOINT UI-CP-17 — DateRangePicker + GuestCountInput**: approve looks (desktop two-month, phone one-month) and the nights summary. Approved = both accepted.

```ts
export interface DateRangePickerProps {
  from: string | null; to: string | null;                 // YYYY-MM-DD
  onChange: (range: { from: string | null; to: string | null }) => void;
  min?: string; max?: string; today: string;               // hotel-local
  mode?: 'stay' | 'range';   // stay: shows "N nights", to must be after from; range: inclusive dates
  months?: 1 | 2;            // default 2 on ≥ md, 1 on phone
  nameFrom?: string; nameTo?: string;                      // hidden inputs for forms
  isError?: boolean; disabled?: boolean; size?: 'sm' | 'md';
}
```

- **Trigger:** looks like `Input` (`h-9`): `CalendarRange` 16 · "21 Oct – 23 Oct · 2 nights" / placeholder "Check-in – Check-out".
- **Popover:** reuse `DatePicker` day-cell styles; range fill `bg-brand-pale`, endpoints `bg-brand-primary text-white rounded-lg`, today ring `ring-1 ring-brand-primary`; footer "Clear" ghost + "Done" primary sm.

#### 4.3.17 `GuestCountInput` (shared, P4)

```ts
export interface GuestCountInputProps {
  value: { adults: number; children: number; rooms?: number };
  onChange: (v: GuestCountInputProps['value']) => void;
  max?: { adults?: number; children?: number; rooms?: number };
  showRooms?: boolean; size?: 'sm' | 'md';
}
```

- **Trigger:** `Input`-like "2 adults · 1 child"; popover rows label + stepper (`Button outline sm` `Minus`/`Plus` icon-only, value `w-8 text-center text-sm font-bold tabular-nums`, `aria-live="polite"`).

#### 4.3.18 `PriceBreakdown` (feature, P4)

> **🧑 HUMAN CHECKPOINT UI-CP-19 — PriceBreakdown (tax and money rules)**: confirm the GST wording ("GST 5% (CGST 2.5% + SGST 2.5%)"), the slab note, and that every number comes from the server quote. Approved = reviewed with the tax note in README §India rules.

```ts
export interface QuoteNightLine {
  date: string; priceMinor: number;
  gstRateBps: number;          // 500 or 1800
  cgstMinor: number; sgstMinor: number;
}
export interface PriceBreakdownProps {
  currency: string;
  nights: QuoteNightLine[];
  roomCount: number;
  subtotalMinor: number; taxMinor: number; totalMinor: number;  // server totals; never summed in the UI
  payNowMinor?: number; payAtHotelMinor?: number;               // P4: payAtHotel = total
  variant?: 'full' | 'compact';   // compact: summary rows + "Show per-night details" disclosure
  snapshotNote?: string;          // booking detail: "Prices saved when the booking was made"
}
```

- **Layout (full):**

```
Room × 1 · 2 nights
  Tue 21 Oct        ₹3,500.00     GST 5%    ₹175.00
  Wed 22 Oct        ₹8,000.00     GST 18%   ₹1,440.00
────────────────────────────────────────────
Room charges                         ₹11,500.00
GST (CGST + SGST)                     ₹1,615.00
  CGST                                  ₹807.50
  SGST                                  ₹807.50
────────────────────────────────────────────
Total                                ₹13,115.00   ← text-base font-bold
Pay at hotel                         ₹13,115.00   ← Badge info "Pay at hotel"
```

- **Classes:** wrapper `text-xs`; rows `flex justify-between py-1`; money `tabular-nums text-right`; night rows `text-ink-deep`, GST column `text-2xs text-ink-muted`; dividers `border-t border-line my-2`; total row `text-base font-bold text-ink`.
- **Slab note:** when nights have different `gstRateBps`, show `text-2xs text-ink-muted` "GST is 5% for nights up to ₹7,500 and 18% above, per night."
- **Compact:** "Room charges / GST / Total" + `<details>` "Show per-night details" (`text-brand-primary text-xs font-semibold`).
- **Rule:** the component only formats. `formatMoney` for display; no `+`, `*` on money.

#### 4.3.19 `HoldIndicator` (feature, P4; guest variant P5)

> **🧑 HUMAN CHECKPOINT UI-CP-20 — HoldIndicator (concurrency + WCAG 2.2.1)**: test: hold created at room choice; quiet countdown; warning ≥ 20 s before expiry with one-click extend (works ≥ 10 times); on expiry the form stays filled and shows "Room no longer held — check availability again". Approved = human ran the flow with a screen reader and keyboard.

```ts
export interface HoldIndicatorProps {
  status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'RELEASED';
  expiresAt: string;                 // ISO from server; client only displays remaining time
  serverNow: string;                 // to correct clock skew
  onExtend?: () => Promise<void>;    // calls the server; hidden when not allowed
  onRecheck?: () => void;            // after expiry
  warnAtSeconds?: number;            // default 60 (minimum 20)
  variant?: 'staff' | 'guest';
}
```

| State | Look | Announcement |
|---|---|---|
| ACTIVE, > warn | `inline-flex items-center gap-1.5 text-xs text-info-ink` · `Timer` 14 · "Room held · 9:32" (`tabular-nums`) | none per second; `aria-live="polite"` region announces once at start "Room held for 10 minutes" |
| ACTIVE, ≤ warn | `Alert tone="warning"` title "Your hold ends in 0:45" + action `Button secondary sm` "Keep holding" | announced once when entering this state |
| EXPIRED / RELEASED | `Alert tone="info"` "Room no longer held — check availability again" + `Button outline sm` "Check again" | announced once |
| CONVERTED | `StatusBadge domain="hold" status="CONVERTED"` ("Booked") | — |

- **Guest variant:** same states, `text-sm`, placed in the checkout summary card header.
- **Rule:** never block typing; never clear the form on expiry; the timer text uses `motion-reduce` safe updates (text only, no animation).

#### 4.3.20 `Timeline` (shared, P6)

> **🧑 HUMAN CHECKPOINT UI-CP-24 — Timeline**: approve two-track layout (Booking / Payment; Refund appears in P7) and the event row. Approved = screenshot of a booking with ≥ 5 events.

```ts
export interface TimelineEvent {
  id: string; at: string;               // ISO; displayed in hotel time zone with abbreviation
  title: string;                        // "Booking confirmed"
  description?: string;                 // "Pay at hotel · ₹13,115.00"
  actor?: string;                       // "Priya (Manager)" or "Guest web"
  tone?: Tone; icon?: React.ReactNode;  // 14px
}
export interface TimelineProps {
  tracks: Array<{ id: 'booking' | 'payment' | 'refund'; label: string; events: TimelineEvent[] }>;
  timeZone: string;
  layout?: 'tabs' | 'stacked';          // tabs (default ≥ lg in a narrow column): Tabs pills sm per track
  emptyText?: string;
}
```

- **Event row:** `relative pl-7 pb-5 last:pb-0`; vertical line `absolute left-[9px] top-5 bottom-0 w-px bg-line`; node `absolute left-0 top-0.5 w-5 h-5 rounded-full bg-<tone>-pale text-<tone> flex items-center justify-center` with icon 12; title `text-xs font-bold text-ink`; meta `text-2xs text-ink-muted` "21 Oct 2026, 14:05 IST · Priya (Manager)"; description `text-xs text-ink-deep mt-0.5`.
- **Order:** newest first.

### 4.4 Overlay rule (drawer vs dialog)

> **🧑 HUMAN CHECKPOINT UI-CP-10 (same checkpoint) — overlay rule**: approve the table; afterwards every overlay follows it.

| Use | Component | Size |
|---|---|---|
| Yes/no confirmation | `ConfirmDialog` | `small` |
| Confirmation with reason, fee or impact preview (archive, suspend, cancel booking, no-show, disable room type) | feature dialog on `Modal variant="dialog"` | `medium` |
| Short form ≤ 6 fields (photo edit, set price, duplicate room type) | `Modal variant="dialog"` | `medium` / `wide` |
| Editing one record while its list stays visible (room type, bulk edit, audit entry detail) | `SidePanel` | `lg` / `md` |
| Multi-step or long work (new hotel, new booking) | its own page/route | — |
| **Never** | wizard inside a modal; drawer for a 2-button confirmation | — |

---

## 5. Screen UI specs

- **Every screen lists:** route, phase, components, layout, states. "Loading / empty / error" use [§4.2](#42-changes-to-existing-shared-components) `EmptyState` variants, `Loader` (`py-16`) for pages, `LoadingRows` via `DataTable`, `Alert tone="error"` with "Try again".
- **🧑 Visual sign-off** checkpoints per phase are in [§0](#0-checkpoint-index) (UI-CP-13, -18, -21, -23, -25). For each, the coding model provides screenshots at 390 / 768 / 1440 px of the default, loading, empty and error states.

> **🧑 HUMAN CHECKPOINT UI-CP-13 — visual sign-off P1**: screenshots of §5.1, §5.2, §5.7 (table + side panel), §5.12 and §5.14 after the P1 work. Approved = "P1 visuals accepted"; P2 UI work starts only after this.

> **🧑 HUMAN CHECKPOINT UI-CP-18 — visual sign-off P3**: screenshots of §5.3, §5.4, §5.5, §5.8 and §5.13. Approved = "P3 visuals accepted".

> **🧑 HUMAN CHECKPOINT UI-CP-25 — visual sign-off P6 (includes money confirmations)**: screenshots of §5.9 (list + calendar), §5.10 and the cancel / no-show dialog showing a server fee preview. Approved = visuals accepted and the dialog wording names hotel, booking and amount.

### 5.1 Hotels list (`/admin/hotels`, P1 restyle)

```
PageHeading  eyebrow "PROPERTY DIRECTORY" · title "Hotels" · desc "Manage hotels, rooms, prices and availability."
             action: [+ Add a hotel] (Button primary md, Plus 16)
┌ grid xl:grid-cols-5 gap-3.5 ── MetricCard ×5 (tones: brand, success, warning, danger, neutral) ────┐
│ Hotels 12      Published 7      Draft 3      Suspended 1      Archived 1                         │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
HotelBulkActionsBar (when selection > 0)
┌ DataTable rounded-2xl ─────────────────────────────────────────────────────────────────────────┐
│ toolbarHeader: [Search…] STATUS[▾] LOCATION[▾] SETUP[▾] UPDATED[▾]          [List|Cards]       │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ HOTEL                    │ LOCATION        │ STATUS        │ SETUP PROGRESS     │ UPDATED │   │
│ ☐ │ [img] Bell Hotel /bell   │ ⌖ Madurai, IN   │ (✓ Published) │ Ready to publish ▬ │ 20 Oct  │[Manage]│
│ ☐ │ [img] Sea View /sea-view │ ⌖ Kochi, IN     │ (◷ Draft)     │ 3 of 5 steps ▬▬░░  │ 19 Oct  │[Manage]│
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Components:** `PageHeading`, `MetricCard` (labels = `STATUS_LABEL`: "Hotels", "Published", "Draft", "Suspended", "Archived"; no fake "↑ 2 this month" detail — use "Live for guests", "Setup not finished", "Not bookable", "Hidden from list"), `HotelBulkActionsBar`, `DataTable`, `HotelFiltersBar`, `HotelCardGrid`, `StatusBadge domain="hotel"`, `HotelSetupProgress` (on `ProgressBar`), `Button outline sm` "Manage".
- **Thumbnail:** `w-10 h-10 rounded-xl bg-brand-pale text-brand-primary border border-brand-border/60` (was raw hex, `HotelsPage.tsx:270`, `:288`).
- **Remove:** Import button until the feature exists (UX L3); postal-code fallback "626123" (`HotelsPage.tsx:309`) → "—"; date fallback (`:329`) → "—".
- **Empty:** first run → `EmptyState variant="first-run"` "No hotels yet" + "Add a hotel"; filters → `variant="no-results"` + "Clear filters".
- **Phone:** metric row `grid-cols-2` (5th card spans 2); list view switches to cards automatically below `md`.

### 5.2 Hotel workspace shell (`/admin/hotels/:hotelId/*`, P1)

```
PageHeading  eyebrow "HOTEL" · title "Bell Hotel" (+ StatusBadge pill inline after the title)
             desc "Madurai · /bell-hotel · Asia/Kolkata"
             action: [ⓘ 2] PublishBlockersInfo · [Archive] danger-ghost sm · [Suspend] outline sm · [Publish hotel] primary sm
Tabs underline (route links, horizontal scroll on phone):
 Overview │ Details │ Photos ·12 │ Rooms & rates ·3 │ Inventory │ Policies │ Tax & billing │ Bookings (P6)
 ─────────
<tab content: PageCard(s) or DataTable>
```

- **Components:** `HotelWorkspaceLayout` (feature; renders heading + tabs + `<Outlet/>`), `PageHeading`, `StatusBadge`, `PublishBlockersInfo` (warning tokens), `Button`, `Tabs` with `TabItem.to`, `badge` (counts neutral; open issues `badgeTone="warning"` with the issue count from readiness), `TabItem.status` only while the hotel is not published (setup mode).
- **Status actions** (only those valid for the status, as `HotelWorkspace.tsx:237-266`): Publish/Reactivate `primary sm`, Suspend `outline sm` (was `secondary`), Archive `danger-ghost sm`; reasons via the status dialog (`BulkStatusConfirmModal` restyled: `Modal dialog medium`, Cancel `outline sm`).
- **Default tab:** draft → Overview showing the setup task list; published → Overview (README/UX-PLAN decide; route default is `overview`).
- **Archived:** `Alert tone="warning"` with `Lock` under the tabs; forms disabled.
- **Unsaved changes:** switching tab with dirty form → `ConfirmDialog` "Discard unsaved changes?" (`confirmLabel="Discard changes"`, `cancelLabel="Keep editing"`), as today (`HotelWorkspace.tsx:420-430`).

### 5.3 Details tab (`…/details`, P1 move, P3 new fields)

```
PageCard
 SectionHeading "Property details" · "Name, web address and description guests see."
  [Name*][Web address*] [Description (full, showCount)] [Star rating ▾ (P3)]
 ── pt-6 border-t ──
 SectionHeading "Contact" …  [Email][Phone]
 ── SectionHeading "Location" … [Address][City][State ▾][PIN][Country ▾][Time zone ▾ 🔒 locked hint]
     [Latitude][Longitude] [Open in Google Maps ↗] (P3)
 footer: "You have unsaved changes"                      [Save details] primary md
```

- **Components:** `PageCard` (with `footer`), `SectionHeading`, `HotelDetailsFields` (group headings → `SectionHeading level="section"`), `Field`, `Select`, `Combobox`, `Input`.
- **Warnings:** live hotel + web address changed → inline `Alert tone="warning"` under the field "Guests' saved links will stop working"; time zone locked → `Field hint` with `Lock` 12 "Locked because future bookings exist".
- **Amenities** (P3) are a separate `PageCard` on this tab: `SectionHeading` "Amenities" + grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3` of three-state rows (label + `Tabs pills sm` "Yes · No · —"). Option list is a product checkpoint owned by UX-PLAN.

### 5.4 Photos tab (`…/photos`, P1 move, P3 categories)

```
PageCard
 SectionHeading "Property photos" · "At least 5 photos; the cover shows first."   actions: [+ Add photos] secondary sm
 Tabs pills sm: All 12 · To categorise 3 · Exterior · Lobby · Rooms · Dining · Pool · Other   (P3)
 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 → photo tiles (Cover chip, category Badge soft-square)
 footer: [Save photos] primary md
```

- **Components:** `HotelMediaGalleryManager`, `PhotoModal` (source toggle → `Tabs pills sm`, R6; Remove → `danger-ghost`), `Badge`, `Alert tone="info"` tip when < 5 photos.
- **Empty:** the existing dashed "Add your first photo" tile.

### 5.5 Overview (`…/overview`, P3; setup list from P1)

```
┌ grid lg:grid-cols-3 gap-6 ───────────────────────────────────────────────────────────────────────┐
│ PageCard lg:col-span-2                                    │ PageCard (guest preview)              │
│ SectionHeading "Needs attention" (2)                      │  [cover 16:9]                          │
│  ⚠ Missing price   Suite             [Set price]          │  Bell Hotel ★★★★                       │
│  ⚠ No open dates   Deluxe King after 30 Nov [Open dates]  │  Madurai · from ₹3,500/night           │
│  (empty: ✓ "Everything guests need is set")               │  [View as guest ↗] (P5)                │
│ ── SectionHeading "Setup steps" (draft only) ──           ├───────────────────────────────────────┤
│  ① Hotel details  ✓ Done (quiet)                          │ PageCard "Content score" 72%           │
│  ② Room types     ✓ Done                                  │  ProgressBar brand                     │
│  ③ Prices         • To do   [Set prices]                  │  ☐ 5+ property photos (3/5)  [Add]     │
│  ④ Availability   🔒 Cannot start yet (add prices first)  │  ☐ Amenities answered        [Answer]  │
│  ⑤ Cancellation   • To do   [Set terms]                   │  ☑ Check-in/out times                  │
└───────────────────────────────────────────────────────────┴───────────────────────────────────────┘
┌ grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 → StatTile: Check-in 14:00 · Check-out 11:00 · Free cancel 24h · GSTIN set ┐
Footer meta text-2xs text-ink-muted: "Published since 2 Oct 2026 · Last updated 20 Oct, 14:05 by Priya"
```

- **Components:** `PageCard`, `SectionHeading` (`step` for the setup list), `HealthBadge layout="inline"` with fix `ButtonLink outline sm`, `StatusBadge domain="setupStep"`, `ProgressBar`, `StatTile`, `Checkbox` (read-only ticks rendered as icons, not inputs), `ButtonLink`.
- **Setup list (GOV.UK task list):** rows `flex items-center gap-3 py-3 border-b border-line last:border-0`; "Done" is quiet (neutral dot + text); "To do" warning dot + action button; "Cannot start yet" neutral `Lock` with no link. Replaces the top-of-page `HotelSetupChecklist` bar (its data source stays `GET /admin/hotels/:id/readiness`).
- **Severity order:** danger items first, then warning (research §1).

### 5.6 Inventory grid + bulk edit (`…/inventory`, P2)

```
PageHeading (workspace) … Tabs: … │ Inventory │ …
PageCard padding="md"
 header: [Price|Availability|Restrictions]   [‹][Today][›] [📅 21 Oct 2026] [7|14|30 days]     [Edit 14 nights]
 ┌──────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────
 │ Room type    │ TUE  │ WED  │ THU  │ FRI  │ SAT░ │ SUN░ │ MON  │ …     ← sticky header (weekend shaded, today underlined)
 │              │ 21   │ 22   │ 23   │ 24   │ 25   │ 26   │ 27   │
 ├──────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼─────
 │ Deluxe King  │3,500 │3,500 │[4,200│ 4,200│4,200]│3,500 │ ⚠ 0  │       ← [ ] = selected range (bg-selection, ring)
 │ DLX · 10 rms │ base │ base │      │      │      │ base │      │
 ├──────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼─────
 │ Suite        │  —   │  —   │▨🔒   │▨🔒   │  —   │  —   │  —   │       ← ▨ = bg-stripes-closed
 │ STE · 2 rms  │      │      │Closed│Closed│      │      │      │
 └──────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴─────
 Legend: □ Open  ▤ Low  ▥ Sold out  ▨ Closed  ┄ Not open · Prices in ₹ per night, before tax · Dates in Asia/Kolkata
BulkEditPanel (SidePanel md) slides in from the right when "Edit 14 nights" / Enter
```

- **Components:** `PageCard`, `Tabs`, `Button`, `DatePicker`, `InventoryGrid`, `InventoryLegend`, `BulkEditPanel`, `SidePanel`, `MoneyInput`, `ReasonField`, `Alert`.
- **Filters in URL:** `?mode=price&from=2026-10-21&days=14&roomType=` (frontend rule: filters serialisable).
- **Replaces:** `/admin/rates`, `/admin/inventory` pages and the workspace Rates/Availability steps (README P2), and `InventoryAdjustModal` (audit IN6).
- **Phone (agenda mode, < md):**

> **🧑 HUMAN CHECKPOINT UI-CP-15 — inventory on phone**: approve the agenda layout at 390px (owners already do this in MMT Connect). Approved = a human edits a 5-night price on a real phone width without horizontal scrolling.

```
[Room type: Deluxe King ▾]  (Select size md, full width)
[Price|Avail|Rules]  [‹ 21–27 Oct ›]
┌───────────────────────────────────────────┐
│ ☐ Tue 21 Oct        ₹3,500 base   4/10 ✓  │  row h-14, tap = toggle select
│ ☑ Wed 22 Oct        ₹4,200        2/10 Low│
│ ☑ Thu 23 Oct        —   🔒 Closed         │
└───────────────────────────────────────────┘
sticky bottom bar: "2 nights selected"  [Edit] primary md
```

  - `InventoryAgendaList` rows: `flex items-center gap-3 px-4 h-14 border-b border-line`, `Checkbox` (44px hit area via padding), date `text-sm font-semibold`, value per mode, state word (Low / Sold out / Closed / Not open) as `Badge`.
  - Selection mode is the checkbox; range = tap first + long-press last is **not** used (hard to discover).

### 5.7 Rooms & rates (`…/rooms`, P1) + room side panel

```
PageCard padding="none"  (or DataTable)
 toolbarHeader: SectionHeading "Rooms & rates" · "Each room type's price, availability and health."
                [Search rooms] [☐ Show disabled]                                [+ Add room type] secondary sm
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHOTO │ ROOM TYPE         │ GUESTS │ ROOMS │ PRICE/NIGHT │ FREE TONIGHT │ HEALTH                 │ STATUS   │      │
│ [img] │ Deluxe King  DLX  │ 👤 2+1 │ 10    │ ₹3,500.00   │ 4 of 10      │ · Bookable             │ ● Active │[Edit][⋯]│
│ [img] │ Suite        STE  │ 👤 2   │ 2     │ —           │ —            │ ⚠ Missing price [Set price]│ ● Active │[Edit][⋯]│
│ [img] │ Old Twin     TWN  │ 👤 2   │ 4     │ ₹2,000.00   │ —            │ ⊘ Disabled  [Enable]   │ ○ Disabled│[Edit][⋯]│
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Components:** `DataTable` (`onRowClick` opens the panel), `SectionHeading`, `Input sm`, `Checkbox`, `Button`, `HealthBadge layout="inline"`, `StatusBadge domain="roomType" variant="dot"`, `DropdownMenu` (Photos · Price · Open dates · Duplicate · separator · Disable `danger` / Enable), `formatMoney`.
- **Columns:** photo `w-14` (40px `rounded-lg` thumbnail or `BedDouble` 16 on `bg-brand-pale`); name `text-xs font-bold` + code `Badge soft-square neutral font-mono`; guests `Users` 13 + "2+1"; money `align: 'right'` `tabular-nums`; actions `align: 'right'`.
- **Phone:** card list — photo left 56px, name + code, line "₹3,500 · 4 of 10 free", `HealthBadge layout="stacked"`, `[Edit]` full width.
- **Side panel:** `SidePanel width="lg"` title = room name, `headerExtra` = `StatusBadge`, tabs **Details · Photos · Price · Availability**:
  - **Details:** `RoomTypeFields` (grid `sm:grid-cols-2 gap-5`), footer Save `primary sm`; room-count change shows `Alert tone="warning"` impact line ("Opened nights from 21 Oct will change from 10 to 8 rooms; 2 nights have 9 booked") from a server preview.
  - **Photos:** `HotelMediaGalleryManager` (room media).
  - **Price:** base price `MoneyInput` + `ReasonField` (pre-filled "Initial price" when none, UX P7) + link "Change prices for specific dates → Inventory".
  - **Availability:** next 30 days mini summary (`StatTile` ×3: open nights, closed nights, sold-out nights) + `ButtonLink` "Open in inventory grid".
- **Add room type:** same panel with title "New room type" and only the Details tab enabled (others `disabled` until saved).
- **Duplicate:** `Modal dialog medium` "Duplicate room type": name/code fields + `Checkbox` list of what to copy (Details, Photos, Base price) + `Alert tone="info"` "Nothing on other room types is changed".
- **Disable:** feature dialog (reason required) with impact text; confirm `danger sm` "Disable room type".

### 5.8 Policies and Tax & billing (`…/policies`, `…/tax`, P3)

```
Policies — PageCard
 SectionHeading "Check-in and check-out"   [Check-in from ▾ 14:00] [Check-out by ▾ 11:00]
 SectionHeading "Children and extra beds"  [Children allowed (Tabs pills)] [Free under age ▾] [Extra bed ▾][Extra bed price ₹]
 SectionHeading "Cancellation and no-show" CancellationPolicyFields
 SectionHeading "House rules"              [Pets ▾][Smoking ▾][ID required ☐]
 footer [Save policies]

Tax & billing — PageCard
 Alert info: "GST is worked out per night on our server: 5% up to ₹7,500, 18% above. Confirm with your tax adviser."
 SectionHeading "GST registration"
  [GSTIN (font-mono uppercase, 15)] ✓ Format OK · State 33 Tamil Nadu   [Legal name*]
  [State ▾ (auto from GSTIN; mismatch → field error from server)]  [☐ Specified premises] hint
 footer [Save tax details]
```

- **Components:** `PageCard`, `SectionHeading`, `Select` (times in 30-minute steps), `Tabs pills sm`, `MoneyInput`, `CancellationPolicyFields`, `Input` (`className="font-mono uppercase"` is allowed — typography, not colour), `Checkbox`, `Alert`.
- **GSTIN feedback:** client shows format-only hint (`text-2xs text-success-ink` with `Check` 12 / `text-danger-ink`); the server decides (check digit, state match) and returns field errors.
- **Copy and option lists** are product/tax checkpoints in UX-PLAN; this file only fixes the look.

### 5.9 Bookings list (`/admin/bookings` and `…/bookings`, P6)

```
PageHeading eyebrow "BOOKINGS" · title "Bookings" · action [+ New booking] primary md
┌ DataTable ─────────────────────────────────────────────────────────────────────────────────────┐
│ toolbar: [🔍 Name, phone or booking ref] STAY DATES[📅 range] STATUS[▾] PAYMENT[▾] ROOM[▾]  [List|Calendar] │
│ chips: (Confirmed ×) (21–31 Oct ×)  Clear all                                                  │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ REF        │ GUEST              │ STAY             │ ROOM         │ TOTAL      │ BOOKING     │ PAYMENT      │
│ SW-10234   │ R. Kumar           │ 21–23 Oct · 2N   │ Deluxe ×1    │ ₹13,115.00 │ ✓ Confirmed │ ◷ Due at hotel│
│            │ +91 98xxxx1234     │                  │              │            │             │              │
│ SW-10233   │ A. Shah            │ 20–21 Oct · 1N   │ Suite ×1     │  ₹9,975.00 │ ◔ Optional  │ — Not required│
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Components:** `PageHeading`, `DataTable` (`stickyFirstColumn`), `Input sm`, `DateRangePicker size="sm" mode="range"`, `Select sm`, `Tabs pills sm`, `Badge` filter chips (`soft-square` + `X` 12 button), `StatusBadge domain="booking"` and `domain="payment"` in **separate columns** (state machines stay separate), `formatMoney`.
- **Global list (`/admin/bookings`)** adds a HOTEL column after REF; the switcher may show "All hotels" here.
- **Calendar view:** `InventoryGrid mode="bookings"` (read-only counts per room type × night; clicking a cell filters the list to that night).
- **Row click** → booking detail. **Phone:** card rows (ref + status badges top, guest, stay, total right).
- **Empty:** first run "No bookings yet" + "New booking"; filters → no-results.

### 5.10 Booking detail (`…/bookings/:bookingId`, P6)

```
PageHeading eyebrow "BOOKING" · title "SW-10234" · desc "R. Kumar · 21–23 Oct 2026 · Bell Hotel"
            action: [⋯ More] (Resend confirmation, Mark no-show, Cancel booking — danger)  [Check in] primary md (only on arrival day, CONFIRMED)
Badges row: (✓ Confirmed) (◷ Due at hotel)
┌ grid lg:grid-cols-3 gap-6 ───────────────────────────────────────────────────────────────────┐
│ lg:col-span-2 space-y-6                                   │ space-y-6                         │
│ PageCard "Stay"  StatTile×4: Check-in Tue 21 Oct 14:00 ·  │ PageCard "Payment"                │
│   Check-out Thu 23 Oct 11:00 · 2 nights · 2 adults 1 child│  StatusBadge payment              │
│   Room: Deluxe King × 1                                   │  Method: Pay at hotel             │
│ PageCard "Guest"  name · phone · email · company GSTIN    │  Amount due ₹13,115.00            │
│ PageCard "Price"  PriceBreakdown full (snapshotNote)      │ PageCard "History"                │
│ PageCard "Cancellation terms (saved with booking)"        │  Timeline tracks Booking/Payment  │
│   "Free until 20 Oct 14:00 IST, then ₹3,500 fee"          │                                   │
└───────────────────────────────────────────────────────────┴───────────────────────────────────┘
```

- **Components:** `PageHeading`, `StatusBadge` ×2, `DropdownMenu`, `Button`, `PageCard`, `SectionHeading`, `StatTile`, `PriceBreakdown`, `Timeline`, `Badge`.
- **OPTIONAL bookings:** `Alert tone="warning"` under the heading "Tentative — releases on 22 Oct, 18:00 IST unless confirmed" + `Button primary sm` "Confirm booking".
- **Cancel / no-show dialog** (`Modal dialog medium`, feature `CancelBookingDialog`): `StatTile` rows "Cancellation fee ₹3,500.00" / "Guest pays at hotel: ₹0" from the **server preview**; `ReasonField`; confirm `danger sm` labelled with the outcome "Cancel booking · fee ₹3,500"; text names the hotel and booking. Part of UI-CP-25 (money).

### 5.11 New booking (`…/bookings/new`, P4)

> **🧑 HUMAN CHECKPOINT UI-CP-21 — New booking page**: visual sign-off at 1440 and 390 px, including hold warning and hold-expired states. Approved = screenshots accepted and the flow tested once end-to-end on the dev server.

```
PageHeading eyebrow "NEW BOOKING" · title "Bell Hotel" · action [Cancel] outline md
┌ grid lg:grid-cols-[1fr_380px] gap-6 ─────────────────────────────────────────────────────────┐
│ PageCard                                                   │ PageCard sticky top-20 "Summary" │
│ SectionHeading step=1 "Stay"                               │  HoldIndicator "Room held · 9:32"│
│  [📅 21 Oct – 23 Oct · 2 nights] [👤 2 adults · 1 child]   │  Deluxe King × 1                 │
│  [Check availability] secondary md                         │  21–23 Oct · 2 nights            │
│ ── SectionHeading step=2 "Room" ──                         │  PriceBreakdown compact          │
│  ┌ room option card ───────────────────────────────┐       │  Cancellation: free until 20 Oct │
│  │ [img] Deluxe King  👤 up to 3  4 free  ₹3,500/nt │[Choose]│  ───────────────                 │
│  └──────────────────────────────────────────────────┘       │  [Confirm booking] primary lg w-full│
│  (sold out → disabled card, Badge "Sold out")              │  text-2xs "Guest pays at hotel"  │
│ ── SectionHeading step=3 "Guest and payment" ──            │                                  │
│  [Full name*][Phone* +91][Email][Company GSTIN (optional)] │                                  │
│  [Special requests (full)]                                 │                                  │
│  Payment: (●) Pay at hotel   — radio card, only option MVP │                                  │
└────────────────────────────────────────────────────────────┴──────────────────────────────────┘
```

- **Components:** `PageHeading`, `PageCard`, `SectionHeading step`, `DateRangePicker mode="stay"`, `GuestCountInput`, `Button`, room option cards (feature `RoomOptionCard`, local to `features/bookings/`), `Field`, `Input`, `Textarea`, `HoldIndicator`, `PriceBreakdown compact`, `Badge`.
- **Room option card:** `rounded-xl border border-line p-4 flex gap-4`; selected `border-brand-primary ring-2 ring-brand-primary/20`; price `text-sm font-bold tabular-nums` + "per night, before tax" `text-2xs`.
- **Steps 2–3 locked** until the previous step is valid: `SectionHeading` with neutral `Lock` and copy "Choose dates first" (no hidden content jump).
- **Phone:** summary card becomes a sticky bottom bar "₹13,115 total · Details ▴" (opens the summary as a sheet) + "Confirm" `primary md`.
- **Pre-fill:** `?from=&to=&roomType=` from a grid cell click (P6).

### 5.12 Audit log (`/admin/audit`, P1)

```
PageHeading eyebrow "ADMIN" · title "Audit log" · desc "Every change to hotels, rooms, prices and availability."
┌ DataTable ──────────────────────────────────────────────────────────────────────────────────┐
│ toolbar: [📅 range] HOTEL[▾] WHO[▾] AREA[▾] ACTION[▾]                                        │
│ WHEN              │ WHO            │ HOTEL      │ AREA        │ ACTION    │ SUMMARY                     │
│ 20 Oct, 14:05 IST │ (P) priya@…    │ Bell Hotel │ [Rate]      │ [Updated] │ Deluxe King 21–27 Oct ₹3,500 → ₹4,200 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
Row click → SidePanel md "Change details": who/when/reason + before/after table
```

- **Components:** `PageHeading`, `DataTable`, `DateRangePicker sm`, `Select sm`, `Combobox sm` (hotel/user), `Badge soft-square neutral` (area), `Badge` action tones (Created → success, Updated → info, Deleted/Archived → danger, Status change → warning), avatar initial chip `w-6 h-6 rounded-full bg-brand-pale text-brand-primary text-2xs font-bold`, `SidePanel`.
- **Diff table:** `text-xs`, columns Field · Before · After; removed values `bg-danger-pale text-danger-ink line-through`, added `bg-success-pale text-success-ink`; each also prefixed "−"/"+" (non-colour cue).

### 5.13 Today (`/admin/today`, P3 setup health; P8 live)

```
PageHeading eyebrow "TODAY" · title "Tue 20 Oct" · desc "What needs attention across your hotels."  (switcher may be "All hotels")
grid sm:grid-cols-2 xl:grid-cols-4 gap-3.5 → MetricCard (to=filtered list): Live hotels 7 · Need attention 3 · Rooms not bookable 4 · Closed nights (14 days) 9
┌ grid lg:grid-cols-3 gap-6 ───────────────────────────────────────────────────────────────────┐
│ PageCard lg:col-span-2 "Needs attention" grouped by hotel (hotel name SectionHeading level=group)│
│   HealthBadge inline rows with fix ButtonLinks, danger first                                  │
│ PageCard "Shortcuts": QuickActionCard ×3 (Add a hotel · Open inventory · Audit log)           │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Replaces** `/admin/dashboard` (its rainbow cards, hand-built table and header: audit D1–D8). Arrivals/departures panels arrive in P8 and reuse `DataTable`.

### 5.14 Login, boot and access screens (P1 restyle)

- **Login (`pages/auth/LoginPage.tsx`):** `min-h-screen grid lg:grid-cols-2 bg-canvas`.
  - Brand panel (hidden below lg): `bg-gradient-to-br from-brand-darkest via-brand-dark to-brand-deep text-white p-14` (gradient allowed only here and on the guest hero), `BrandMark tone="on-dark" withWordmark`, display headline (typography "Display"), sub-copy `text-brand-sage`. Remove emerald orbs (`LoginPage.tsx:52-53`).
  - Form panel: `bg-paper`, card-less form `max-w-sm w-full`, `PageHeading`-style title "Sign in" (h1), `Field` + `Input size="lg"`, `PasswordInput size="lg"`, `Button size="lg" className="w-full"` (fixes height mismatch L3), errors `Alert tone="error"`.
- **Boot (`App.tsx:12-21`):** `<div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4" role="status" aria-live="polite"><BrandMark size="lg" /><Loader label="Opening Staywise" className="p-0" /></div>`.
- **Access / 404 (`pages/error/AccessPage.tsx`, `NotFound.tsx`):** `PageCard` centred `max-w-md mx-auto text-center`, icon chip `bg-warning-pale text-warning` (403) / `bg-surface-muted text-ink-muted` (404), `ButtonLink primary md` "Go to hotels".

### 5.15 Guest web pages (P5, `apps/guest-web`)

> **🧑 HUMAN CHECKPOINT UI-CP-23 — guest web visual sign-off**: screenshots at 390 px first, then 1440 px, for all five pages and their loading / sold-out / hold-expired states. Approved = accepted after UI-CP-22 brand decision.

- **Search (`/`):**

```
[BrandMark] Staywise                                       (header h-14, bg-paper, border-b)
┌ hero: bg-brand-dark, text-white, py-12 px-4 ───────────────────────────────┐
│ "Find your stay"  (Display)                                                 │
│ ┌ search card bg-paper rounded-2xl p-3 shadow-lg ─────────────────────────┐ │
│ │ [📍 City or hotel        ] [📅 Check-in – Check-out] [👤 2 guests] [Search]│ │  phone: stacked, Search full width h-12
│ └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Results (`/search?city=&from=&to=&adults=`):** list of `HotelResultCard` (`rounded-2xl border border-line bg-paper overflow-hidden`; phone: image 16:9 on top; ≥ md: image `w-64` left): name `font-heading text-lg font-bold`, city + star rating, 2–3 amenity chips, price block right/bottom "from ₹3,500 /night" + "₹7,350 total for 2 nights incl. GST" (`text-2xs text-ink-muted`, server quote), `ButtonLink primary md` "See rooms". Sort/filters in a top bar; phone: "Filters" button opens a sheet. Empty: `EmptyState no-results` "No hotels for these dates" + "Change dates".
- **Hotel page (`/hotels/:slug`):** gallery (phone: swipeable 4:3 with "1/12" counter; desktop: 1 large + 4 small grid `grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden`), name + rating + address, amenities grid, policies summary (`StatTile`: check-in, check-out, free cancellation), room list of `RoomOptionCard` (guest variant: photo, capacity, bed, price per night, total for stay, "Choose" `primary md`; sold out → disabled with `Badge` "Sold out").
- **Booking (`/book/:holdId`):** two columns ≥ lg (`grid lg:grid-cols-[1fr_380px] gap-6`): left `PageCard` guest details form (name, phone with +91, email, special requests, optional company GSTIN behind "Add business details" disclosure); right sticky summary: `HoldIndicator variant="guest"`, hotel thumbnail + dates + room, `PriceBreakdown compact`, cancellation terms, "Confirm booking" `primary lg w-full`, "Pay at the hotel" note. Phone: summary collapses to top accordion + sticky bottom "Confirm · ₹13,115".
- **Confirmation (`/booking/:ref`):** `PageCard max-w-2xl mx-auto text-center`: success chip `w-14 h-14 rounded-full bg-success-pale text-success` `CheckCircle2` 28, title "Booking confirmed", reference `font-mono text-2xl font-bold tracking-wider` with copy button, **separate** line `Badge info` "Payment: pay at hotel" (guideline: distinguish confirmed vs payment pending), stay facts `StatTile` grid, `PriceBreakdown full`, cancellation terms, "Email sent to r…@gmail.com".

---

## 6. Status colour & badge matrix

> **🧑 HUMAN CHECKPOINT UI-CP-04 — status matrix**: approve labels, icons and tones (several are judgement calls: Suspended = danger, Cancelled = neutral, No-show = danger, Optional = warning, Pay at hotel = info). Approved = matrix frozen into `status-tones.ts`; changes after that need a new approval.

- **Icons** are lucide-react, 12px inside pills, 14px elsewhere. **Variant** = default `StatusBadge` variant for lists.

| Domain | Status (API) | Label | Icon | Tone | Default variant |
|---|---|---|---|---|---|
| hotel | `DRAFT` | Draft | `Clock` | warning | pill |
| hotel | `PUBLISHED` | Published | `CheckCircle2` | success | pill |
| hotel | `SUSPENDED` | Suspended | `PauseCircle` | danger | pill |
| hotel | `ARCHIVED` | Archived | `Archive` | neutral | pill |
| roomType | `ACTIVE` | Active | `CheckCircle2` | success | dot |
| roomType | `DISABLED` | Disabled | `CircleSlash` | neutral | dot |
| health | `BOOKABLE` | Bookable | `CheckCircle2` | neutral (quiet) | dot |
| health | `MISSING_PRICE` | Missing price | `IndianRupee` | warning | pill |
| health | `NO_OPEN_DATES` | No open dates | `CalendarX2` | warning | pill |
| health | `ZERO_RATE` | Price is ₹0 | `AlertTriangle` | danger | pill |
| health | `SUSPICIOUS_RATE` | Unusual price | `AlertTriangle` | warning | pill |
| health | `DISABLED` | Disabled | `CircleSlash` | neutral | pill |
| inventory (cell) | open | Open | — | neutral | cell |
| inventory (cell) | low | Low | `TrendingDown` | warning | cell |
| inventory (cell) | sold out | Sold out | `Ban` | danger | cell |
| inventory (cell) | closed (`closed: true`) | Closed | `Lock` | neutral + stripes | cell |
| inventory (cell) | not opened (`total: null`) | Not open | `Minus` | neutral dashed | cell |
| hold | `ACTIVE` | Held | `Timer` | info | pill |
| hold | `CONVERTED` | Booked | `CheckCircle2` | success | pill |
| hold | `EXPIRED` | Expired | `TimerOff` | neutral | pill |
| hold | `RELEASED` | Released | `Unlock` | neutral | pill |
| booking | `OPTIONAL` | Optional | `CircleDashed` | warning | pill |
| booking | `CONFIRMED` | Confirmed | `CheckCircle2` | success | pill |
| booking | `CHECKED_IN` | Checked in | `LogIn` | brand | pill |
| booking | `CHECKED_OUT` | Checked out | `LogOut` | neutral | pill |
| booking | `COMPLETED` | Completed | `CircleCheckBig` | neutral | pill |
| booking | `CANCELLED` | Cancelled | `XCircle` | neutral | pill |
| booking | `NO_SHOW` | No-show | `UserX` | danger | pill |
| payment | `NOT_REQUIRED` | Not required | `Minus` | neutral | pill |
| payment | `PENDING` | Pending (method `PAY_AT_HOTEL` → **"Due at hotel"**) | `Clock` / `Building2` | warning / info | pill |
| payment | `AUTHORIZED` | Authorised | `ShieldCheck` | info | pill |
| payment | `CAPTURED` | Paid | `BadgeCheck` | success | pill |
| payment | `FAILED` | Failed | `XOctagon` | danger | pill |
| payment | `PARTIALLY_REFUNDED` | Part refunded | `RotateCcw` | warning | pill |
| payment | `REFUNDED` | Refunded | `RotateCcw` | neutral | pill |
| refund (P7) | `REQUESTED` | Requested | `Clock` | warning | pill |
| refund (P7) | `PROCESSING` | Processing | `Loader` (static, no spin) | info | pill |
| refund (P7) | `SUCCEEDED` | Refunded | `CheckCircle2` | success | pill |
| refund (P7) | `FAILED` | Failed | `XOctagon` | danger | pill |
| setupStep | `done` | Done | `CheckCircle2` | neutral (quiet) | dot |
| setupStep | `todo` | To do | `CircleDot` | warning | dot |
| setupStep | `blocked` | Cannot start yet | `Lock` | neutral | dot |

- **Rules:**
  - booking, payment and refund badges are **always separate elements** — never one combined badge;
  - "Bookable" and "Done" are quiet on purpose so problems stand out (research §3);
  - labels come from `STATUS_MAP`, never from `humanStatus()` (which lower-cases, `utils/helpers.ts:12`).

---

## 7. Iconography, motion, dark mode

### 7.1 Iconography

- **Library:** `lucide-react` only; default `strokeWidth={2}`; decorative icons `aria-hidden="true"`; icon-only buttons need `aria-label`.
- **Size scale** (only these sizes; fixes audit X5's 17 sizes):

| Size | Use |
|---|---|
| 12 | Inside badges, grid-cell corner marks, dropdown chevrons in pills |
| 14 | `Button size="sm"` icons, inline text icons, table icons, tab icons |
| 16 | `Button size="md"` icons, metric/quick-action chips, input icons, section icons |
| 20 | Nav items, top-bar icon buttons, `Button size="lg"`, compact empty states |
| 28 | Confirmation hero chip, `BrandMark lg` |
| 32 | `EmptyState` icon |

- **Domain icons (one meaning each):**

| Concept | Icon |
|---|---|
| Hotel | `Building2` |
| Room type | `BedDouble` |
| Money / price | `IndianRupee` (never `DollarSign`; fixes `route-config.ts:25`, `RatesPage.tsx:191`, `DashboardPage.tsx:229`) |
| Inventory / dates | `CalendarDays`; range `CalendarRange` |
| Bookings | `BookOpen` (nav), `CalendarCheck` (Today) |
| Guests | `Users` / `User` |
| Audit log | `History` |
| Staff | `UserCog` |
| Tax | `Receipt` |
| Policies | `ScrollText` |
| Photos | `Image` |
| Overview | `LayoutDashboard` |
| Hold | `Timer` |
| Closed / locked | `Lock` |
| Warning | `AlertTriangle` (strong) / `AlertCircle` (soft) |
| Info | `Info` (never a hand-drawn "i", `InventoryCalendarView.tsx:126`) |

### 7.2 Motion

| Use | Duration | Easing | Classes |
|---|---|---|---|
| Hover / colour / border | 150ms | default | `transition-colors duration-150` |
| Drawer, side panel, sidebar collapse, popovers | 200ms | ease-out | `transition-transform duration-200 ease-out` |
| Progress bar width | 300ms | default | `transition-[width] duration-300` |
| Toast in/out | 150ms | ease-out | — |

- **Reduced motion:** every transition/animation adds `motion-reduce:transition-none` / `motion-reduce:animate-none`, except the loading spinner (it signals progress; keep it, `animate-spin`).
- **Not allowed:** bouncing, scaling cards on hover, animated countdowns, cell flash on every save (use the quiet "Saving…" state).

### 7.3 Dark mode

> **🧑 HUMAN CHECKPOINT UI-CP-27 — dark mode**: confirm "no dark mode in MVP". Approved = recorded in `ui-decisions.md`.

- **Stance:** not in MVP (P1–P6). The token work in §2.3 is the prerequisite; once every colour is a token, a dark theme is a `@media (prefers-color-scheme: dark)` override of the same token names. No `dark:` classes are added now.

---

## 8. Guest web visual direction

> **🧑 HUMAN CHECKPOINT UI-CP-22 — guest brand direction**: decide (a) Staywise brand for all hotels vs per-hotel accent colour and logo, (b) Manrope headings + DM Sans body, (c) hero imagery source (hotel cover vs neutral illustration), (d) how tokens are shared. Approved = a one-page moodboard/screenshot of the search page accepted.

- **Tokens:** reuse the admin `@theme` names and values so components look related. Recommended: copy the `@theme` block into `apps/guest-web/src/styles.css` in P5 with a comment "keep in sync with apps/admin-web/src/styles.css"; a shared `packages/ui-tokens` CSS file is better but is a repo-structure change (decide at UI-CP-22).
- **Differences from admin:**
  - root font **16px** (not 15) and body `text-sm`/`text-base`;
  - touch targets ≥ 44px (`Button size="lg"` for primary actions, inputs `h-11`/`h-12`);
  - more white space: page gutter `px-4 sm:px-6`, sections `py-8 sm:py-12`;
  - headings in `font-heading`; prices `font-bold tabular-nums`;
  - brand hero `bg-brand-dark` (or cover photo with a `bg-overlay` scrim) — the only place besides login with a large brand surface.
- **Mobile first:** design and screenshot at 390px first; sticky bottom CTA on hotel and booking pages; filters and summary as bottom sheets.
- **Shared designs, separate code:** `DateRangePicker`, `GuestCountInput`, `PriceBreakdown`, `HoldIndicator`, `StatusBadge` follow the same specs; P5 decides whether to copy or share (no cross-app imports from `apps/admin-web`).
- **Trust cues:** total price incl. GST before the guest commits; cancellation terms beside the Confirm button; real photos with `alt` text; "Pay at the hotel" stated on the room card, the summary and the confirmation.

---

## 9. Fix list from the theme audit

- **Order:** quick wins first (P1, no approval beyond the phase task), then items waiting on a new component, then items waiting on token approval. Audit IDs in brackets.

### 9.1 Quick wins (no new component, no token change)

| # | File:line | Exact change | Audit |
|---|---|---|---|
| Q1 | `pages/catalog/views/RoomTypesView.tsx:48` | `<Status status={room.status} />` → `<Status status={room.status} variant="dot" />` | RT5 |
| Q2 | `pages/hotels/HotelsPage.tsx:388-396` | Replace the `<button>` with `<Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={() => navigate('/admin/hotels/new')}>Add a hotel</Button>` | R2 |
| Q3 | `pages/hotels/HotelsPage.tsx:433-441` | Same replacement for the empty-state action | R2 |
| Q4 | `pages/hotels/HotelsPage.tsx:379-386` | Remove the Import button (dead toast) | R3, UX L3 |
| Q5 | `pages/hotels/HotelsPage.tsx:353` | Remove the `className` override; keep `variant="outline" size="sm"` and `leftIcon={<ExternalLink size={14} />}` | R3 |
| Q6 | `pages/hotels/HotelsPage.tsx:365-398` | Replace the hand-built header with `<PageHeading eyebrow="PROPERTY DIRECTORY" title="Hotels" description="Manage hotels, rooms, prices and availability." action={…Add a hotel…} />` | R1 |
| Q7 | `pages/hotels/HotelsPage.tsx:270`, `:288` | `bg-[#dcfce7] text-[#166534] border-emerald-200/60` → `bg-brand-pale text-brand-primary border-brand-border/60`; icon `text-brand-primary` | R4 |
| Q8 | `pages/hotels/HotelsPage.tsx:309`, `:329` | Fallbacks `'626123'` and `'2026-10-15T14:30:00Z'` → render "—" when missing | UX L4 |
| Q9 | `pages/hotels/components/HotelSummaryCards.tsx:13`, `:15`, `:27`, `:34` | `detail="↑ 2 this month"` → `"Not archived"`; labels "Active Hotels" → "Hotels", "Needs Setup" → "Draft", "Paused" → "Suspended" (match `STATUS_LABEL`); `tone="blue"` stays until MetricCard tones change | UX L2, L6 |
| Q10 | `components/ui/Status.tsx:74` | Add `capitalize` to the pill class list | R10 |
| Q11 | `components/ui/Status.tsx:15-46` | Add `ACTIVE` (copy of `PUBLISHED`) and `DISABLED` (copy of `ARCHIVED`) entries; line `:70` fallback → a neutral config, not `DRAFT` | RT5 |
| Q12 | `App.tsx:14-20` | Replace `boot-screen` / `brand-mark` markup with `<div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4" role="status" aria-live="polite"><span className="w-14 h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center"><Compass size={28} /></span><Loader label="Opening Staywise" className="p-0" /></div>` (swap to `BrandMark` when it exists) | A4 |
| Q13 | `components/ui/Spinner.tsx:4` | Remove the dead `ui-spinner` class; `className="animate-spin text-brand-primary"` | A4 |
| Q14 | `layout/Topbar.tsx:108`, `:128` | `bg-[#dcfce7] text-[#166534]` → `bg-brand-pale text-brand-primary` | S1 |
| Q15 | `layout/Topbar.tsx:57` | `bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200/60` → `bg-brand-pale hover:bg-brand-pale/70 border-brand-border` | S2 |
| Q16 | `layout/Topbar.tsx:94` | Render the red dot only when `notificationCount > 0` (prop; 0 for now) | S4 |
| Q17 | `layout/Topbar.tsx:39` | `px-6 md:px-8` → `px-4 sm:px-5 lg:px-6` | S5 |
| Q18 | `layout/Sidebar.tsx:115` | `bg-sky-100/70` → `bg-brand-pale` | S3 |
| Q19 | `features/hotels/PhotoModal.tsx:152-171` | Replace the hand-built toggle with `<Tabs variant="pills" size="sm" activeId={mode} onChange={(id) => { setMode(id as 'file' \| 'link'); setError(''); }} items={[{ id: 'file', label: 'Upload from device', icon: <Upload size={14} /> }, { id: 'link', label: 'Use a link', icon: <LinkIcon size={14} /> }]} />` | R6 |
| Q20 | `pages/hotels/components/BulkStatusConfirmModal.tsx:114` | Cancel `variant="secondary"` → `"outline"`; move buttons into `Modal footer` | R8 |
| Q21 | `features/rates/HotelRatesTab.tsx:216`, `:266` | Title "Set Base Rate — …" → "Set base price — …"; Cancel `ghost` → `outline` | RA6, X3 |
| Q22 | `pages/catalog/RoomTypesPage.tsx:47-65`, `RoomTypeCreatePage.tsx:32-46`, `RoomTypeEditPage.tsx:62-76` | Pass the button as `PageHeading action`; edit page eyebrow "EDIT ROOM TYPE", title = room name, root `space-y-6` (`RoomTypeEditPage.tsx:61`) | RT1–RT3 |
| Q23 | `pages/catalog/views/RoomTypesView.tsx:87-93`, `:55`, `:58-68` | Empty-state `<button>` → `Button primary` + `Plus`; actions column `align: 'right'`; row action `outline sm` | RT6, RT9, RT10 |
| Q24 | `pages/catalog/views/InventoryCalendarView.tsx:48-65` | Hand-built amber banner → `Alert tone="warning" action={<Button variant="secondary" size="sm">…</Button>}` (use children until `action` exists) | IN3 |
| Q25 | `pages/catalog/components/InventoryAdjustModal.tsx:130-187` | Toggle → `Tabs pills sm`; error box → `Alert tone="error"`; raw `<label>` → `Field`; Title Case → sentence case; Cancel `outline` | IN6 (part) |
| Q26 | `pages/hotels/HotelDetailPage.tsx:112`, `:341-345` | Drop `max-w-6xl mx-auto`; hand-built empty → `EmptyState compact` (only if the page survives P1; see MVP-PLAN route decision) | HD2, HD3 |
| Q27 | `pages/dashboard/DashboardPage.tsx:54-74`, `:146-152`, `:174-176` | Header → `PageHeading`; text buttons → `Button ghost/outline sm` (page is replaced by Today in P3 — only do this if P3 slips) | D1, D3 |
| Q28 | `pages/auth/LoginPage.tsx:5`, `:130`, `:106`, `:119`, `:133` | Import `Button` (not `AsyncButton`); inputs and button both `size="lg"` | L3, L4 |
| Q29 | `pages/catalog/RatesPage.tsx:191`, `routes/route-config.ts:25`, `DashboardPage.tsx:229` | `DollarSign` → `IndianRupee` | RA4 |
| Q30 | `pages/catalog/RatesPage.tsx:171`, `InventoryPage.tsx:123` | Remove `mb-7` | RA5 |
| Q31 | `features/hotels/hotel-status.ts:10-15` | `STATUS_BADGE_STYLE` is unused and contradicts the pill (orange vs rose) — remove the export (code removal inside a file, not a file deletion) | G3 |

### 9.2 Needs a new component

| # | Where | Change | Waits on |
|---|---|---|---|
| N1 | `HotelWorkspace.tsx:435-442`, `HotelDetailsFields.tsx:223`, `HotelCreateForm.tsx:66`, `HotelDetailPage.tsx:192,223,245,271,314`, `InventoryCalendarView.tsx:29-36` | Use `SectionHeading` | `SectionHeading` (R7, HD4, IN1) |
| N2 | `HotelWorkspace.tsx:376`, `HotelCreateForm.tsx:58`, `BaseRatesView.tsx:45`, `DashboardPage.tsx:98,181`, `InventoryCalendarView.tsx` root | Use `PageCard` | `PageCard` (D5, RA1, IN1) |
| N3 | `DashboardPage.tsx:190-251` | Four rainbow cards → `QuickActionCard` ×4 on Today | `QuickActionCard` (D4) |
| N4 | `InventoryAdjustModal.tsx:110-125`, `HotelDetailPage.tsx` policy tiles | Coloured tiles → `StatTile` | `StatTile` (IN6) |
| N5 | `HotelDetailPage.tsx:402`, `HotelRatesTab.tsx:189`, `HotelAvailabilityTab.tsx:141-144`, `RoomTypesView.tsx:21` | Hand-built badges/chips → `Badge` / `HealthBadge` | `Badge`, `HealthBadge` (HD6, RA6, IN7, RT7) |
| N6 | `pages/error/AccessPage.tsx:28-33`, `components/ui/NotFound.tsx:28-34` | Link-as-button → `ButtonLink` | `ButtonLink` (A1) |
| N7 | `HotelWorkspace.tsx:241`, `PhotoModal.tsx:303`, `HotelBulkActionsBar.tsx:55,66` | `ghost`/`danger`/`secondary` recoloured → `danger-ghost` (and plain `outline` on the bar) | `Button` change (R9) |
| N8 | `features/hotels/HotelSetupChecklist.tsx:38-71` | Hand-built tablist → workspace route `Tabs` with `status` + task list on Overview | `Tabs` change (R5, UX W10) |
| N9 | `Sidebar.tsx:43-45`, `LoginPage.tsx:56`, `App.tsx:15-17` | Logo → `BrandMark` | `BrandMark` (L1) |
| N10 | `pages/catalog/components/HotelRoomPicker.tsx` (Room types, Rates, Availability) | Per-page hotel picker → `HotelSwitcher` + hotel routes | `HotelSwitcher` (RT11, research §2) |
| N11 | `pages/hotels/components/HotelSetupProgress.tsx:15-19` | Bar → `ProgressBar` | `ProgressBar` (R12) |
| N12 | `DashboardPage.tsx:113-158` | Hand-built table → `DataTable` (Today) | none (existing `DataTable`) — do with N3 (D2) |

### 9.3 Needs a token change

| # | Where | Change | Waits on |
|---|---|---|---|
| K1 | `components/ui/Alert.tsx:12-24`, `Toast.tsx:15-19`, `EmptyState.tsx:22-26`, `ConfirmDialog.tsx:80`, `Tabs.tsx:94` | Raw emerald/amber/rose/sky → semantic tokens | T-01…T-04 (X2) |
| K2 | `components/ui/Status.tsx:15-56` | Raw hex → `TONE_CLASSES` (then replace with `StatusBadge`) | T-01…T-04 (R11) |
| K3 | `components/ui/MetricCard.tsx:25-81`, `:122-143` | Raw hex gradients/sparkline → token tones (spec §4.2) | T-01…T-04 (R11, D6) |
| K4 | `components/ui/Field.tsx:25-32`, `Input.tsx:36-39`, `Select.tsx:24-27`, `Textarea.tsx` | Slate/rose → `ink-*`, `line-strong`, `danger-*`, `focus` | T-03, T-05, T-11 (R15) |
| K5 | `components/ui/PageHeading.tsx:25-27` | `text-slate-400/900/500` → `text-ink-muted / text-ink / text-ink-muted`; add `font-heading` | T-06, T-08 (R14, G4) |
| K6 | `components/ui/Modal.tsx:64`, `:84`; `Sidebar.tsx:146` | Backdrop → `bg-overlay`; title `text-lg font-heading` | T-08, T-09 |
| K7 | `pages/hotels/components/HotelSetupProgress.tsx:17`, `HotelSetupChecklist.tsx:30,60,62`, `PublishBlockersInfo.tsx:48` | `emerald-600/amber-*` → `success`/`warning` tokens | T-01, T-02 (R12) |
| K8 | `pages/catalog/views/InventoryCalendarView.tsx:39,42,92,101`; `views/BaseRatesView.tsx:49,59-65` | Raw status colours → tokens; rate card off amber → `brand-pale`/neutral | T-01, T-02 (IN2, RA2) — superseded by the P2 grid |
| K9 | `pages/auth/LoginPage.tsx:49-66` | Emerald gradient/orbs → `brand-darkest/dark/deep`, `BrandMark on-dark` | none new (existing brand tokens) + `BrandMark` (L1, L2) |
| K10 | `text-[10px]`, `text-[11px]` everywhere touched | → `text-2xs` | T-07 (G5) |
| K11 | `apps/admin-web/docs/ui-decisions.md:18`, `Documentation/guidelines/frontend-ui.md` §1 | Canvas `#f4f6f3` → `#eef5f0`; sidebar is white | T-14 (R13) |

### 9.4 Dead code (needs deletion approval)

> **🧑 HUMAN CHECKPOINT UI-CP-28 — delete unused UI files** (AGENTS.md: deleting files needs approval): `features/hotels/HotelForm.tsx`, `HotelCreateModal.tsx`, `HotelMediaModal.tsx`, `PhotoEditModal.tsx`, `PhotoUploadPopup.tsx`, `features/hotels/workspace/*` (still holds raw hex: `HotelReadinessWidget.tsx`, `HotelRoomsSection.tsx`), `pages/hotels/components/HotelDetailsModal.tsx`, `components/ui/KpiStrip.tsx`, `components/ui/ImageUploadDropzone.tsx`, `src/dashboard.css`. The coding model first proves each has no importer (`grep -rn "<Name>" apps/admin-web/src`), lists the results, and deletes only after "approved".

---

## 10. Implementation rules for the coding model

- **Tailwind only, tokens only:**
  - no raw hex (`[#…]`), no `style={{ color… }}`; inline `style` only for computed widths/positions (e.g. `ProgressBar` fill width);
  - new and touched code uses tokens from §2 (neutral mapping table); never introduce new `slate-*`, `emerald-*`, `amber-*`, `rose-*`, `sky-*`, `orange-*`, `blue-*`, `teal-*` classes;
  - before `UI-CP-01` is approved, keep the existing palette in untouched files; do not half-migrate a component.
- **`cn` helper:** combine classes with `cn()` from `utils/cn.ts`. It is **not** `tailwind-merge`: a conflicting class passed via `className` does not reliably win. Therefore:
  - `className` passthrough is for **layout only** (margin, width, grid placement, `hidden`/`flex`);
  - never pass colour, height, padding or radius overrides to a shared component — add or use a prop/variant instead (audit R3, R9).
- **Reuse ladder** (stop at the first step that works):
  1. an existing shared component as-is;
  2. the same component with existing props or layout `className`;
  3. **extend** a shared component (new prop/variant) → 🧑 checkpoint UI-CP-12;
  4. **new** shared component → 🧑 checkpoint (§4.3);
  5. a feature-local component in `features/<domain>/` (allowed without approval when used in one feature only).
- **File rules:** one component per file, named after it, exported props interface (`frontend-ui.md` §3); re-export shared components from `components/ui/index.ts`; ~200 lines max per component file — split sub-parts (`InventoryGridCell`, `InventoryLegend`) when over.
- **Copy:** sentence case; CAPS only for eyebrows, table headers, filter labels; button labels name the outcome.
- **Money and status:** money via `MoneyInput` / `formatMoney`, `tabular-nums`, server totals only; status via `StatusBadge` + `STATUS_MAP`, never `humanStatus()` for labels.
- **States:** every data screen renders loading, empty (right `EmptyState` variant), error (`Alert` + "Try again") and read-only.
> **🧑 HUMAN CHECKPOINT UI-CP-26 — accessibility review** (at the end of P1, P2, P4 and P6): keyboard-only pass over the new screens (switcher, side panel, grid, bulk edit, new booking, dialogs), a screen-reader pass (NVDA or VoiceOver) on badges, grid cells and the hold indicator, a contrast check of text tokens, and `prefers-reduced-motion` on. Approved = no blocker found, or blockers logged as tasks.

- **Accessibility minimums** (verified at UI-CP-26):
  - every control labelled (`Field` with `htmlFor`); icon-only buttons have `aria-label`;
  - visible focus using the focus recipes: buttons/links `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1`, inputs `focus:border-focus focus:ring-2 focus:ring-focus/20`, grid cells `focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus`;
  - text contrast ≥ 4.5:1 (use `text-ink-muted` or darker for text; `ink-light`/`ink-faint` only for icons and placeholders);
  - dialogs and side panels trap focus and return it; Esc closes the top-most overlay only;
  - grids: `role="grid"`, roving tabindex, arrow keys; no drag-only actions;
  - colour never the only cue (icon + word);
  - `motion-reduce:` on every transition.
- **Verify after each task:**
  - `cd apps/admin-web && npx tsc -b` (admin web); `npx tsc --noEmit -p apps/api/tsconfig.json` and `npm --workspace=apps/api run test` when API code changed;
  - never run `nest build` while the dev server may be running;
  - search for regressions: `grep -rnE "\[#[0-9a-fA-F]{3,6}\]" apps/admin-web/src --include=*.tsx` must not grow; `grep -rn "<button" <touched files>` only for icon/menu buttons.
- **Visual sign-off with screenshots:**
  - at each 🧑 visual checkpoint, start the app (`npm run dev` in `apps/admin-web`, or the workspace dev runner) and capture 390 / 768 / 1440 px screenshots of default, loading, empty, error and (where relevant) read-only states;
  - if the coding model has no browser tool, it lists the exact URLs and states for the human to capture;
  - attach a short "what changed" list per screenshot; wait for "approved" before the next phase.
- **Docs:** after each approved component or token change, update `apps/admin-web/docs/components.md` and `ui-decisions.md` (new tokens, overlay rule, status matrix, icon scale). Never commit, push or delete files without human approval (AGENTS.md).
