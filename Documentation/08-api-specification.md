# API Specification

Base path `/api/v1`. Publish OpenAPI in non-production and authorized internal environments. Use ISO-8601 dates for stay dates (`YYYY-MM-DD`) interpreted in the property's time zone; timestamps are UTC ISO-8601.

## Conventions

- JSON request/response, DTO validation, bounded pagination, stable error codes.
- Never accept a client-provided authoritative total or availability result.
- Mutations accept an idempotency key where retries could create money or inventory effects.
- Admin endpoints require server-side permission and property-scope checks.

## Initial & Planned Endpoints

| Method | Path | Purpose | Status / Phase |
|---|---|---|---|
| GET | `/search` | City, dates, occupancy, filters; returns available hotels/room offers | Phase 1 planned |
| GET | `/hotels/:slug` | Published hotel details, room types, policies | Phase 1 baseline |
| POST | `/holds` | Create short-lived inventory hold and quote; idempotent | Phase 1 planned |
| GET | `/holds/:id` | Inspect hold state/expiry for authorized guest session | Phase 1 planned |
| POST | `/bookings` | Create booking against valid hold; payment mode determined server-side | Phase 1 planned |
| GET | `/bookings/:reference` | Secure booking retrieval/guest access | Phase 1 planned |
| POST | `/bookings/:reference/cancel` | Apply policy and initiate cancellation/refund workflow | Phase 2 planned |
| POST | `/payments/webhooks/:provider` | Verify provider signature and process event idempotently | Phase 2 planned |
| POST | `/auth/staff/login` | Authenticate staff and set opaque session/CSRF cookies | **VERIFIED** |
| GET | `/auth/me` | Return current staff identity, roles, permissions, and hotel scope | **VERIFIED** |
| POST | `/auth/logout` / `/auth/logout-all` | Revoke current or all staff sessions | **VERIFIED** |
| GET | `/admin/hotels` | List scoped hotel records with `search`, `status`, `city`, `setupStatus`, `limit`, `offset` | **VERIFIED** |
| POST | `/admin/hotels` | Create a draft property | **VERIFIED** |
| GET/PATCH | `/admin/hotels/:id` | Read or update a property with optimistic versioning | **VERIFIED** |
| POST | `/admin/hotels/:id/publish` | Publish after policy, room, rate, and future inventory checks | **VERIFIED** |
| POST | `/admin/hotels/:id/media` | Upload property photos (`primaryImage`, `heroImage`, `images[]` gallery) | Phase 2 planned |
| POST | `/admin/hotels/import` | Bulk CSV/JSON property import with transactional validation | Phase 4 planned |
| GET | `/admin/hotels/export` | CSV export of property directory and setup status | Phase 4 planned |
| PATCH | `/admin/hotels/bulk-status` | Bulk status updates (`PUBLISHED`, `SUSPENDED`, `ARCHIVED`) for selected rows | Phase 2 planned |
| GET/POST | `/admin/hotels/:hotelId/room-types` | List or create room types | **VERIFIED** |
| GET/PATCH | `/admin/room-types/:id` | Read or update a room type | **VERIFIED** |
| GET/PUT | `/admin/room-types/:roomTypeId/base-rate` | Read or set room type base rate in integer minor units and ISO currency | **VERIFIED** |
| GET | `/admin/room-types/:roomTypeId/inventory?from=YYYY-MM-DD&to=YYYY-MM-DD` | Read nightly inventory for `[from, to)` | **VERIFIED** |
| POST | `/admin/room-types/:roomTypeId/inventory/initialize` | Create missing nightly inventory using total room count | **VERIFIED** |
| POST | `/admin/room-types/:roomTypeId/inventory/:stayDate/block` | Block rooms for one local stay date | **VERIFIED** |
| POST | `/admin/room-types/:roomTypeId/inventory/:stayDate/unblock` | Release blocked rooms for one local stay date | **VERIFIED** |
| GET | `/admin/bookings` | Search/filter bookings | Phase 1 planned |
| POST | `/admin/bookings/:id/transitions` | Authorized lifecycle transition with reason | Phase 1 planned |
| GET | `/admin/reports/revenue` | Scoped report with documented date basis | Phase 3 planned |

## Search response essentials

Return hotel identity, room type, capacity, available quantity, per-night rate breakdown, taxes/fees, total for requested occupancy and dates, currency, policy summary and quote timestamp/expiry. Search is indicative; hold creation revalidates inventory and price.

## Error examples

`400 INVALID_STAY_DATES`, `401 AUTH_REQUIRED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 INVENTORY_UNAVAILABLE`, `409 HOLD_EXPIRED`, `409 IDEMPOTENCY_CONFLICT`, `422 OCCUPANCY_EXCEEDED`, `429 RATE_LIMITED`.

### Catalog administration endpoints

- Hotels: `GET/POST /admin/hotels`, `GET/PATCH /admin/hotels/:id`, `POST /admin/hotels/:id/suspend`, `POST /admin/hotels/:id/archive`, `POST /admin/hotels/:id/media`, and `PATCH /admin/hotels/bulk-status`.
- Room types: `GET/POST /admin/hotels/:hotelId/room-types`, `GET/PATCH /admin/room-types/:id`, and `POST /admin/room-types/:id/disable`.
- Catalog mutations require an active staff session, the matching permission, and hotel scope. Updates include the current integer `version`; stale updates return `409 VERSION_CONFLICT`.
- Hotel and room-type creation produces drafts/active catalog records. Publication is gated on inventory, rates, and policy readiness and is implemented with those dependencies.
- Publication requires an explicit effective cancellation/no-show policy, at least one active sellable room type, one shared base-rate currency, and future inventory with availability for every active room type. Fixed policy fees must match the base-rate currency.
- Base rates are not quotes. Tax treatment and guest-facing totals remain disabled until ADR-007 is decided and a server-side quote flow is implemented.
- `GET /hotels/:slug` exposes published hotel content and active room-type details only.
- Staff passwords use bcrypt. Session tokens are high-entropy opaque values stored only as hashes; authenticated write requests require an allowed `Origin` and matching CSRF cookie/header.
