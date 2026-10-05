# API Specification

Base path `/api/v1`. Publish OpenAPI in non-production and authorized internal environments. Use ISO-8601 dates for stay dates (`YYYY-MM-DD`) interpreted in the property's time zone; timestamps are UTC ISO-8601.

## Conventions

- JSON request/response, DTO validation, bounded pagination, stable error codes.
- Never accept a client-provided authoritative total or availability result.
- Mutations accept an idempotency key where retries could create money or inventory effects.
- Admin endpoints require server-side permission and property-scope checks.

## Initial endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/search` | City, dates, occupancy, filters; returns available hotels/room offers |
| GET | `/hotels/:slug` | Published hotel details, room types, policies |
| POST | `/holds` | Create short-lived inventory hold and quote; idempotent |
| GET | `/holds/:id` | Inspect hold state/expiry for authorized guest session |
| POST | `/bookings` | Create booking against valid hold; payment mode determined server-side |
| GET | `/bookings/:reference` | Secure booking retrieval/guest access |
| POST | `/bookings/:reference/cancel` | Apply policy and initiate cancellation/refund workflow |
| POST | `/payments/webhooks/:provider` | Verify provider signature and process event idempotently |
| POST | `/auth/staff/login` | Authenticate staff and set opaque session/CSRF cookies |
| GET | `/auth/me` | Return current staff identity, roles, permissions, and hotel scope |
| POST | `/auth/logout` / `/auth/logout-all` | Revoke current or all staff sessions |
| GET | `/admin/hotels` | List scoped hotel records |
| POST | `/admin/hotels` | Create a draft property |
| GET/PATCH | `/admin/hotels/:id` | Read or update a property with optimistic version |
| POST | `/admin/hotels/:id/publish` | Publish after policy, room, rate, and future inventory checks |
| GET/POST | `/admin/hotels/:hotelId/room-types` | List or create room types |
| GET/PATCH | `/admin/room-types/:id` | Read or update a room type |
| GET/PUT | `/admin/room-types/:roomTypeId/base-rate` | Read or set the room type base nightly amount in integer minor units and ISO currency |
| GET/POST/PATCH | `/admin/hotels` | Hotel operations |
| GET/POST/PATCH | `/admin/hotels/:id/room-types` | Room type setup |
| GET | `/admin/room-types/:roomTypeId/inventory?from=YYYY-MM-DD&to=YYYY-MM-DD` | Read nightly inventory for `[from, to)` |
| POST | `/admin/room-types/:roomTypeId/inventory/initialize` | Create missing nightly inventory using the room type total |
| POST | `/admin/room-types/:roomTypeId/inventory/:stayDate/block` | Block rooms for one local stay date |
| POST | `/admin/room-types/:roomTypeId/inventory/:stayDate/unblock` | Release blocked rooms for one local stay date |
| GET | `/admin/bookings` | Search/filter bookings |
| POST | `/admin/bookings/:id/transitions` | Authorized lifecycle transition with reason |
| GET | `/admin/reports/revenue` | Scoped report with documented date basis |

## Search response essentials

Return hotel identity, room type, capacity, available quantity, per-night rate breakdown, taxes/fees, total for requested occupancy and dates, currency, policy summary and quote timestamp/expiry. Search is indicative; hold creation revalidates inventory and price.

## Error examples

`400 INVALID_STAY_DATES`, `401 AUTH_REQUIRED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 INVENTORY_UNAVAILABLE`, `409 HOLD_EXPIRED`, `409 IDEMPOTENCY_CONFLICT`, `422 OCCUPANCY_EXCEEDED`, `429 RATE_LIMITED`.

### Catalog administration endpoints

- Hotels: `GET/POST /admin/hotels`, `GET/PATCH /admin/hotels/:id`, `POST /admin/hotels/:id/suspend`, and `POST /admin/hotels/:id/archive`.
- Room types: `GET/POST /admin/hotels/:hotelId/room-types`, `GET/PATCH /admin/room-types/:id`, and `POST /admin/room-types/:id/disable`.
- Catalog mutations require an active staff session, the matching permission, and hotel scope. Updates include the current integer `version`; stale updates return `409 VERSION_CONFLICT`.
- Hotel and room-type creation produces drafts/active catalog records. Publication is gated on inventory, rates, and policy readiness and is implemented with those dependencies.
- Publication requires an explicit effective cancellation/no-show policy, at least one active sellable room type, one shared base-rate currency, and future inventory with availability for every active room type. Fixed policy fees must match the base-rate currency.
- Base rates are not quotes. Tax treatment and guest-facing totals remain disabled until ADR-007 is decided and a server-side quote flow is implemented.
- `GET /hotels/:slug` exposes published hotel content and active room-type details only.
- Staff passwords use bcrypt. Session tokens are high-entropy opaque values stored only as hashes; authenticated write requests require an allowed `Origin` and matching CSRF cookie/header.
