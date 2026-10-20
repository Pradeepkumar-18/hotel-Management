# Hotels

<a id="hotel-management"></a>
## Hotel Management Specification

### Aggregate and lifecycle

- **Ownership:** Hotel owns public property content, location, timezone, policies, amenities, photos, and publication status.
- **Suggested states:** `DRAFT`, `PUBLISHED`, `SUSPENDED`, `ARCHIVED`.
- **Search visibility:** Only published hotels appear in guest search (see [guest-search.md](./guest-search.md)).
- **Suspension:** Suspension immediately prevents new holds while preserving existing bookings for operations.

### Fields

- **Required fields:** stable ID, unique slug, display name, address, city, country, IANA timezone, contact channel, status, created/updated metadata.
- **Optional fields:** coordinates, star classification, description, amenities, check-in/out local times, policy references, media references, tax registration/configuration appropriate to market.
- **Validation:** Validate coordinates and supported timezone identifiers.

### Rules

- **Timezone lock:** Hotel timezone is set before publication and cannot be changed while future bookings exist without an explicit migration plan.
- **Audited changes:** Changing location, policy, tax configuration, or publication state is audited (see [audit-logging.md](./audit-logging.md)).
- **No cascade delete:** Archive/disable does not cascade-delete room types or historical bookings.
- **Policy edits:** Editing policies affects future quotes only; confirmed bookings use their policy snapshot (see [cancellation-policies.md](./cancellation-policies.md)).
- **Scope:** Super admin can operate globally; manager actions require hotel scope and permission (see [rbac.md](./rbac.md)).
- **Publication gate:** Publication is gated on:
  - an explicit effective cancellation/no-show policy;
  - at least one active room type with positive sellable capacity;
  - a base rate per active room type with one shared currency;
  - at least one future available inventory night per active room type.
  - Fixed policy fees must match that currency.

### Admin UI

- **Shared fields block:** `/admin/hotels/new` (create draft) and `/admin/hotels/:id/edit` (workspace with Details, Photos, Rooms, Cancellation policy tabs) share one fields block for identity, contact and location.
- **Fixed fees input:** Fixed cancellation/no-show fees are typed in rupees and sent as minor units in the policy currency (saved currency, else INR).
- **Archived filtering:** The admin hotel list (and the hotel pickers that use it) hides archived hotels unless the Archived status filter is chosen.
- **Archived read-only:** Archived hotels open read-only in the workspace (UI only; a server-side guard is a separate task).
- **UI coding rules:** See [../guidelines/frontend-ui.md](../guidelines/frontend-ui.md).

### APIs

- **Public:** `GET /api/v1/hotels/:slug`.
- **Admin:**
  - `GET/POST /api/v1/admin/hotels`
  - `GET/PATCH /admin/hotels/:id`
  - `POST /admin/hotels/:id/publish`
  - `POST /admin/hotels/:id/suspend`
  - `POST /admin/hotels/:id/archive`
- **Mutation safety:** Mutations use DTO validation and optimistic version checks for concurrent admin edits.
- **Full contract:** See [../API.md](../API.md).

### Acceptance criteria

- **Search exclusion:** Draft/suspended/archived properties never appear in public search.
- **Publish requirements:** Publishing requires required content, active room type, sellable inventory and valid policies.
- **Post-suspension operations:** Existing bookings remain readable and manageable after suspension/archive.
- **Cross-property access:** Cross-property manager access is denied and recorded where appropriate.
