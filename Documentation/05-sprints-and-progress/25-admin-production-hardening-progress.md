# Admin Platform Production Hardening & Fixes Progress Tracker

> **Document ID:** `DOC-025`  
> **Status:** Completed — Fully Implemented & Verified  
> **Scope:** Admin Platform (Frontend & Backend) Critical and Launch-Blocking Fixes  
> **Rule:** No guest side work. No new test scripts or suites created now (deferred).  

---

## 1. Overview & Action Plan

This document tracks the critical hardening items and fixes identified in the production readiness audit of the Staywise Admin Platform (`apps/api` and `apps/admin-web`). All high-priority security, query performance, and redundant HTTP request issues have been resolved and verified with complete workspace production builds.

---

## 2. Implementation Checklist

### Phase 1: Security & RBAC Scoping Hardening
- [x] **SEC-01: Normalize StaffPermissionGuard Hotel Parameter Scoping**  
  Fixed route parameter inspection in [staff-permission.guard.ts](../../apps/api/src/common/auth/staff-permission.guard.ts) to handle both `request.params.hotelId` and `request.params.id`. Prevents property scoping bypasses on `GET /admin/hotels/:id`, `PATCH :id`, `POST :id/media`, `POST :id/publish`, and `POST :id/suspend`.
- [x] **SEC-02: Eliminate Insecure CORS Dynamic Reflection**  
  In [main.ts](../../apps/api/src/main.ts), eliminated `origin: true` reflection with credentials. Enforced strict explicit origins, fails closed with a fatal startup error in production when `CORS_ORIGINS` is missing, and provides safe local development defaults (`http://localhost:5173`, `http://127.0.0.1:5173`).
- [x] **SEC-03: Consolidate Network & Privacy-Safe IP Utility**  
  Extracted duplicated `privacySafeIp` helper from `auth.service.ts` into a centralized [network.util.ts](../../apps/api/src/common/utils/network.util.ts) utility.

### Phase 2: Database & Query Performance
- [x] **PERF-01: Replace Unindexed `$or` Regex Table Scans**  
  In [hotel.service.ts](../../apps/api/src/modules/hotels/hotel.service.ts), replaced leading-wildcard case-insensitive regex queries with indexed MongoDB `$text` search (`hotel_text_search`), avoiding full-table `COLLSCAN`s during directory filtering.
- [x] **PERF-02: Add Transactional Multi-Day Inventory Range Adjustment API**  
  Added `POST /admin/room-types/:roomTypeId/inventory/batch-adjust` in [inventory.controller.ts](../../apps/api/src/modules/inventory/inventory.controller.ts) and [inventory.service.ts](../../apps/api/src/modules/inventory/inventory.service.ts) to allow blocking or unblocking an entire date range transactionally in a single database transaction.

### Phase 3: Admin Metrics API & Redundant Query Elimination
- [x] **API-01: Dedicated Hotel Status Metrics Endpoint**  
  Added `GET /admin/hotels/metrics` endpoint in [hotels.controller.ts](../../apps/api/src/modules/hotels/hotels.controller.ts) and [hotel.service.ts](../../apps/api/src/modules/hotels/hotel.service.ts) using property-scoped counts (`total`, `published`, `draft`, `suspended`, `archived`).
- [x] **FE-01: Eliminate 5x Redundant HTTP Calls in Dashboard & Hotels Pages**  
  Refactored [DashboardPage.tsx](../../apps/admin-web/src/pages/dashboard/DashboardPage.tsx) and [HotelsPage.tsx](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx) to fetch status counts from the single `/admin/hotels/metrics` endpoint instead of firing 5 simultaneous requests.

### Phase 4: Server-Side Pagination & Filtering in Admin UI
- [x] **FE-02: Full Server-Side Filtering and Pagination on Hotels Page**  
  Refactored [HotelsPage.tsx](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx) to stop hardcoding `limit=100&offset=0` with client-side in-memory filtering. Connected search keywords, status filters, location, and page offset/limit directly to the API query parameters.

### Phase 5: Build & Developer Ergonomics
- [x] **OPS-01: Add Root `test` Script**  
  Added `"test": "npm --workspace=apps/api run test"` alias in root [package.json](../../package.json) so standard `npm test` works cleanly without creating new test files.
- [x] **VERIFY-01: Full Monorepo Build Verification**  
  Executed `npm run build:api` (NestJS production build) and `npm run build:admin` (Vite production bundle); both exited with code 0.

---

## 3. Progress Log

| Date | Task ID | Description | Status |
|---|---|---|---|
| 2026-10-12 | DOC-025 | Progress tracker created and indexed in README.md | Complete |
| 2026-10-12 | SEC-01 | Normalized hotelId / id param handling in StaffPermissionGuard | Complete |
| 2026-10-12 | SEC-02 | Hardened CORS in main.ts, disallowing dynamic origin reflection | Complete |
| 2026-10-12 | SEC-03 | Centralized privacySafeIp in network.util.ts | Complete |
| 2026-10-12 | PERF-01 | Replaced unindexed regex with MongoDB $text search in HotelService | Complete |
| 2026-10-12 | PERF-02 | Implemented POST batch-adjust in inventory service & controller | Complete |
| 2026-10-12 | API-01 | Implemented GET /admin/hotels/metrics aggregation endpoint | Complete |
| 2026-10-12 | FE-01 | Eliminated 5x redundant calls in DashboardPage & HotelsPage | Complete |
| 2026-10-12 | FE-02 | Converted HotelsPage to dynamic server-side filtering & pagination | Complete |
| 2026-10-12 | OPS-01 | Added npm test root alias in package.json | Complete |
| 2026-10-12 | VERIFY-01| Verified clean builds for both apps/api and apps/admin-web | Complete |
