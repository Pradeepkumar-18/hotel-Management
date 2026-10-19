# Task 20261019-hide-archived-hotels: Hide archived hotels from the hotel list unless filtered
Phase / gate: Phase 1 / Gate B5 · Module spec: Documentation/modules/hotel-management.md · Checklist lines: 22 §3 Hotel Management

## Goal
`/admin/hotels` no longer shows archived hotels by default. They appear only when the Status filter is set to "Archived". The same default applies everywhere `GET /admin/hotels` is used (room/rate hotel picker, dashboard recent hotels), so archived properties are not offered for new setup work.

## Scope
- In: backend default status filter in `HotelService.list`; correct combination of `status` and `setupStatus` filters (today `setupStatus` overwrites `status`); frontend filter label, "Total" card counting active hotels only, Archived card opens the archived filter.
- Out: metrics endpoint shape (unchanged), direct `GET /admin/hotels/:id` (archived hotels still open by link), public search (already published-only).

## API contract (fixed)
| Method | Path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `GET` | `/admin/hotels` | `hotels.view` | query `status?` (`DRAFT\|PUBLISHED\|SUSPENDED\|ARCHIVED`), `city?`, `search?`, `setupStatus?` (`COMPLETED\|IN_PROGRESS`), `limit`, `offset` | `{ items, total, limit, offset }` | 400 |

Behaviour change: when `status` is omitted, results exclude `ARCHIVED`. `status=ARCHIVED` returns only archived hotels. `setupStatus` is ANDed with the status condition.

## Data / schema / index changes
None.

## Business rules
- hotel-management.md: archive does not delete; archived hotels stay readable (still reachable via `/admin/hotels/:id` and the Archived filter).
- Hotel scope for non-super-admins unchanged.

## Security & audit
Unchanged (`hotels.view`, hotel scope filter).

## Backend work
`apps/api/src/modules/hotels/hotel.service.ts` `list()`: build `$and` of status conditions — explicit status or `{ $ne: ARCHIVED }`, plus setupStatus condition.

## Frontend work
- `HotelFiltersBar`: "All statuses" → "All (excluding archived)".
- `HotelsPage`/`HotelSummaryCards`: Total = published + draft + suspended from metrics; Archived card click sets status filter to `ARCHIVED`.

## Acceptance criteria
1. `GET /admin/hotels` without `status` returns no archived hotels; `total` excludes them.
2. `GET /admin/hotels?status=ARCHIVED` returns only archived hotels.
3. `setupStatus=IN_PROGRESS` without status returns draft + suspended only; with `status=ARCHIVED` returns archived.
4. Hotels page default view hides archived; choosing "Archived" in the filter (or clicking the Archived card) shows them.
5. API and admin builds pass; API tests stay green.

## Verification plan
- `npm --workspace=apps/api run build`, `npm --workspace=apps/api run test`, `npm run build:admin`.

## Docs to update
- `Documentation/02-architecture/08-api-specification.md` (GET /admin/hotels default), `Documentation/07-guides/27-admin-web-end-to-end-navigation-guide.md`, `Documentation/modules/hotel-management.md`, checklist 22.

## Parallel safe?
Yes.
