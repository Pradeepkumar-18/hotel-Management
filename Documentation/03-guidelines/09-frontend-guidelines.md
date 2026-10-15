# Frontend Guidelines & Tailwind CSS Architecture

This document establishes the frontend architectural standards, component design guidelines, styling framework, and code organization rules for the Staywise Hotel Platform.

---

## 1. Primary Styling Framework: Tailwind CSS v4

All web applications (`apps/admin-web`, `apps/guest-web`) MUST use **Tailwind CSS v4** integrated via `@tailwindcss/vite`.

### Core Styling Rules:
1. **Utility-First Styling**: All layout, spacing, typography, colors, borders, shadows, flexbox/grid alignments, transitions, and hover/focus/active states MUST be constructed using **Tailwind CSS utility classes**.
2. **No Ad-Hoc Inline Styles**: Avoid inline `style={{ ... }}` blocks unless calculating dynamic pixel transforms or custom dynamic coordinates.
3. **Design System Theme Tokens**: Tailwind utilities reference the established Staywise platform palette configured in `@theme`:
   - **Dark Forest Green (Sidebar & Brand)**: `#173f36` (main), `#12362f` (deep), `#102f2a` (darkest)
   - **Lime Accent (Logo & Nav Highlights)**: `#d6ef9e` (main), `#c8e887` (hover)
   - **Deep Forest Primary (Buttons & Actions)**: `#1e6354` (primary), `#164d42` (hover), `#e9f3ee` (pale background)
   - **Warm Canvas & Paper**: `#f4f6f3` (canvas background), `#ffffff` (card paper)
   - **Ink & Sage Typography**: `#20322d` (dark ink), `#73827b` (muted ink), `#92b3a3` (sidebar sage), `#e4e9e3` (hairline borders)

---

## 2. Directory & Code Organization

All web applications adhere to a **Feature-Driven Atomic Component Structure**.

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

---

## 3. Mandatory Component Rules: 1 Component = 1 File

1. **Single Responsibility Files**: Every reusable component MUST reside in its own dedicated `.tsx` file named after the component (e.g., `Button.tsx`, `MetricCard.tsx`, `Modal.tsx`, `Alert.tsx`).
2. **Clean Re-exports**: Each component folder (`components/ui/`, `components/common/`) MUST include an `index.ts` re-export file (`import { Alert, Button, Modal, Status } from '@/components/ui'`).
3. **Strict Type Contracts**: Every component MUST export a dedicated TypeScript interface for its props.

---

## 4. Typography, Icon & Spacing Standards

1. **Base Root Scale**: `:root` font size is set to `15px` (`body font-size: 0.95rem`) for enhanced legibility on high-DPI displays.
2. **Proportional Button Sizes**:
   - `sm`: `text-xs font-semibold py-1.5 px-3.5 min-h-[36px]` with `16px` icon.
   - `md`: `text-sm font-semibold py-2.5 px-4.5 min-h-[42px]` with `18px` icon.
   - `lg`: `text-base font-semibold py-3 px-6 min-h-[48px]` with `20px` icon.
3. **Margin & DevTools Cleanliness**:
   - Avoid `space-y-*` on navigation item lists; use flexbox container `flex flex-col gap-1` instead.
   - Navigation links (`NavItem`) use `m-0` (`margin: 0px`) so no unexpected yellow margin boxes appear in browser inspector tooltips.

---

## 5. Operational & Accessibility Invariants

1. **URL State Synchronization**: Search and filter states MUST be serializable in the URL query string.
2. **Indicative Search & Quote Validation**: Treat search results as quotes, revalidating inventory on the server when holds are requested.
3. **Explicit Async State Machine**: Every data-driven screen explicitly handles `initial`, `loading`, `success / empty`, and `error`.
4. **Duplicate Submission Guarding**: Submit buttons are disabled while requests are in flight (`busy` state) with Tailwind disabled states (`disabled:opacity-50 disabled:cursor-not-allowed`).
5. **Accessibility**: Form controls feature visible focus rings (`focus:ring-2 focus:ring-[#1e6354] focus:outline-none`), keyboard trap management in modals (`Escape` key), and `role="alert" / role="status"` announcements.
