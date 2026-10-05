# Hotel Management Specification

## Aggregate and lifecycle

Hotel owns public property content, location, timezone, policies, amenities, photos, and publication status. Suggested states: `DRAFT`, `PUBLISHED`, `SUSPENDED`, `ARCHIVED`. Only published hotels appear in guest search. Suspension immediately prevents new holds while preserving existing bookings for operations.

## Fields

Required: stable ID, unique slug, display name, address, city, country, IANA timezone, contact channel, status, created/updated metadata. Optional: coordinates, star classification, description, amenities, check-in/out local times, policy references, media references, tax registration/configuration appropriate to market. Validate coordinates and supported timezone identifiers.

## Rules

- Hotel timezone is set before publication and cannot be changed while future bookings exist without an explicit migration plan.
- Changing location, policy, tax configuration, or publication state is audited.
- Archive/disable does not cascade-delete room types or historical bookings.
- Editing policies affects future quotes only; confirmed bookings use their policy snapshot.
- Super admin can operate globally; manager actions require hotel scope and permission.
- Publication is gated on an explicit effective cancellation/no-show policy, at least one active room type with positive sellable capacity, a base rate per active room type with one shared currency, and at least one future available inventory night per active room type. Fixed policy fees must match that currency.

## APIs

Public `GET /api/v1/hotels/:slug`; admin `GET/POST /api/v1/admin/hotels`, `GET/PATCH /admin/hotels/:id`, `POST /admin/hotels/:id/publish`, `POST /admin/hotels/:id/suspend`, `POST /admin/hotels/:id/archive`. Mutations use DTO validation and optimistic version checks for concurrent admin edits.

## Acceptance criteria

- Draft/suspended/archived properties never appear in public search.
- Publishing requires required content, active room type, sellable inventory and valid policies.
- Existing bookings remain readable and manageable after suspension/archive.
- Cross-property manager access is denied and recorded where appropriate.
