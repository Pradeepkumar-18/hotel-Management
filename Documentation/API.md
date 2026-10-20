# API

- **What this file covers**: the REST API contract — conventions, every initial and planned endpoint with status, search response essentials, error examples and catalog administration rules.
- **Source merged**: `02-architecture/08-api-specification.md`.
- **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md#04-architecture), [DATA_MODEL.md](./DATA_MODEL.md#07-database-design), decisions in [ARCHITECTURE.md](./ARCHITECTURE.md#20-decision-log).

<a id="08-api-specification"></a>
## API Specification

- **Base path**: `/api/v1`.
- **OpenAPI**: publish OpenAPI in non-production and authorized internal environments.
- **Stay dates**: ISO-8601 dates (`YYYY-MM-DD`) interpreted in the property's time zone.
- **Timestamps**: UTC ISO-8601.

### Conventions

- **Format and validation**: JSON request/response, DTO validation, bounded pagination, stable error codes.
- **Server authority**: never accept a client-provided authoritative total or availability result.
- **Idempotency**: mutations accept an idempotency key where retries could create money or inventory effects.
- **Admin authorization**: admin endpoints require server-side permission and property-scope checks.

### Initial & Planned Endpoints

#### Guest search and hotel content

- **`GET /search`**: city, dates, occupancy, filters; returns available hotels/room offers. Status: Phase 1 planned.
- **`GET /hotels/:slug`**: published hotel details, room types, policies. Status: Phase 1 baseline.

#### Holds and bookings (guest)

- **`POST /holds`**: create short-lived inventory hold and quote; idempotent. Status: Phase 1 planned.
- **`GET /holds/:id`**: inspect hold state/expiry for authorized guest session. Status: Phase 1 planned.
- **`POST /bookings`**: create booking against valid hold; payment mode determined server-side. Status: Phase 1 planned.
- **`GET /bookings/:reference`**: secure booking retrieval/guest access. Status: Phase 1 planned.
- **`POST /bookings/:reference/cancel`**: apply policy and initiate cancellation/refund workflow. Status: Phase 2 planned.

#### Payments

- **`POST /payments/webhooks/:provider`**: verify provider signature and process event idempotently. Status: Phase 2 planned.

#### Staff authentication

- **`POST /auth/staff/login`**: authenticate staff and set opaque session/CSRF cookies. Status: **VERIFIED**.
- **`GET /auth/me`**: return current staff identity, roles, permissions, and hotel scope. Status: **VERIFIED**.
- **`POST /auth/logout` / `/auth/logout-all`**: revoke current or all staff sessions. Status: **VERIFIED**.

#### Admin hotels

- **`GET /admin/hotels`**: list scoped hotel records with `search`, `status`, `city`, `setupStatus`, `limit`, `offset`. Status: **VERIFIED**.
  - Without `status`, `ARCHIVED` hotels are excluded; `status=ARCHIVED` returns only archived.
  - `setupStatus` (`COMPLETED`/`IN_PROGRESS`) is combined (AND) with the status condition.
  - `updatedSince` (ISO date) returns hotels updated at or after that time.
- **`GET /admin/hotels/:id/readiness`**: publishing checklist `{ ready, done, total, steps[{ key, done, problems }], problems }` using the publish rules. List rows also carry `setup: { done, total, ready }`. Status: **VERIFIED**.
- **`GET /admin/hotels/cities`**: distinct cities of non-archived hotels in the staff member's scope (Location filter). Status: **VERIFIED**.
- **`POST /admin/hotels`**: create a draft property. Status: **VERIFIED**.
- **`GET/PATCH /admin/hotels/:id`**: read or update a property with optimistic versioning. Status: **VERIFIED**.
- **`POST /admin/hotels/:id/publish`**: publish after policy, room, rate, and future inventory checks. Status: **VERIFIED**.
- **`POST /admin/hotels/:id/media`**: upload property photos (`primaryImage`, `heroImage`, `images[]` gallery). Status: Phase 2 planned.
- **`POST /admin/hotels/import`**: bulk CSV/JSON property import with transactional validation. Status: Phase 4 planned.
- **`GET /admin/hotels/export`**: CSV export of property directory and setup status. Status: Phase 4 planned.
- **`PATCH /admin/hotels/bulk-status`**: bulk status updates (`PUBLISHED`, `SUSPENDED`, `ARCHIVED`) for selected rows. Status: Phase 2 planned.

#### Admin room types, rates and inventory

- **`GET/POST /admin/hotels/:hotelId/room-types`**: list or create room types. Status: **VERIFIED**.
- **`GET /admin/room-types/names?search=`**: room category names already used, for name suggestions; permission `room_types.view`; only hotels the staff member can access (all for super admins), excluding archived hotels and disabled room types; one entry per name (case-insensitive) with `hotelCount`, most used first, max 20; `search` ≤ 60 characters. Status: **VERIFIED** (2026-10-20).
- **`GET/PATCH /admin/room-types/:id`**: read or update a room type. Status: **VERIFIED**.
- **`GET/PUT /admin/room-types/:roomTypeId/base-rate`**: read or set room type base rate in integer minor units and ISO currency. Status: **VERIFIED**.
- **`GET /admin/room-types/:roomTypeId/inventory?from=YYYY-MM-DD&to=YYYY-MM-DD`**: read nightly inventory for `[from, to)`. Status: **VERIFIED**.
- **`POST /admin/room-types/:roomTypeId/inventory/initialize`**: create missing nightly inventory using total room count. Status: **VERIFIED**.
- **`POST /admin/room-types/:roomTypeId/inventory/:stayDate/block`**: block rooms for one local stay date. Status: **VERIFIED**.
- **`POST /admin/room-types/:roomTypeId/inventory/:stayDate/unblock`**: release blocked rooms for one local stay date. Status: **VERIFIED**.

#### Admin bookings and reports

- **`GET /admin/bookings`**: search/filter bookings. Status: Phase 1 planned.
- **`POST /admin/bookings/:id/transitions`**: authorized lifecycle transition with reason. Status: Phase 1 planned.
- **`GET /admin/reports/revenue`**: scoped report with documented date basis. Status: Phase 3 planned.

### Search response essentials

- **Returned fields**: hotel identity, room type, capacity, available quantity, per-night rate breakdown, taxes/fees, total for requested occupancy and dates, currency, policy summary and quote timestamp/expiry.
- **Indicative only**: search is indicative; hold creation revalidates inventory and price.

### Error examples

- **`400 INVALID_STAY_DATES`**
- **`401 AUTH_REQUIRED`**
- **`403 FORBIDDEN`**
- **`404 NOT_FOUND`**
- **`409 INVENTORY_UNAVAILABLE`**
- **`409 HOLD_EXPIRED`**
- **`409 IDEMPOTENCY_CONFLICT`**
- **`422 OCCUPANCY_EXCEEDED`**
- **`429 RATE_LIMITED`**

<a id="catalog-administration-endpoints"></a>
#### Catalog administration endpoints

- **Hotels**: `GET/POST /admin/hotels`, `GET/PATCH /admin/hotels/:id`, `POST /admin/hotels/:id/suspend`, `POST /admin/hotels/:id/archive`, `POST /admin/hotels/:id/media`, and `PATCH /admin/hotels/bulk-status`.
- **Room types**: `GET/POST /admin/hotels/:hotelId/room-types`, `GET/PATCH /admin/room-types/:id`, and `POST /admin/room-types/:id/disable`.
- **Mutation requirements**: catalog mutations require an active staff session, the matching permission, and hotel scope. Updates include the current integer `version`; stale updates return `409 VERSION_CONFLICT`.
- **Creation**: hotel and room-type creation produces drafts/active catalog records. Publication is gated on inventory, rates, and policy readiness and is implemented with those dependencies.
- **Publication requirements**: publication requires an explicit effective cancellation/no-show policy, at least one active sellable room type, one shared base-rate currency, and future inventory with availability for every active room type. Fixed policy fees must match the base-rate currency.
- **Base rates are not quotes**: tax treatment and guest-facing totals remain disabled until **ADR-007** is decided and a server-side quote flow is implemented.
- **Public hotel content**: `GET /hotels/:slug` exposes published hotel content and active room-type details only.
- **Credentials and sessions**: staff passwords use bcrypt. Session tokens are high-entropy opaque values stored only as hashes; authenticated write requests require an allowed `Origin` and matching CSRF cookie/header.
