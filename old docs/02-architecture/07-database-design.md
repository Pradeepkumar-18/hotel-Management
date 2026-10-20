# Database Design

Use MongoDB with Mongoose schemas, validation and explicit indexes. Run it as a replica set wherever multi-document transactions are required. Monetary values use integer minor units (paise) plus ISO currency; never binary floating point.

## Core entities

- **User:** id, normalized email/phone, password hash or external identity, status, timestamps.
- **StaffMembership / Role / Permission:** active staff assignment, explicit hotel scope, and code-owned permission grants.
- **StaffSession:** audience, hashed opaque token, last-seen/expiry/revocation timestamps, and privacy-safe client metadata.
- **Role / UserRole:** role assignment; manager scope is represented explicitly by property membership.
- **Hotel:** id, name, slug, address, city, coordinates, time zone, star category, content, policies, publication status.
- **RoomType:** hotel id, name, description, max occupancy, capacity breakdown, total sellable rooms, status.
- **NightInventory:** one document per room type and local stay date; room type id, stay date, total, blocked, held, confirmed counts, version. Unique compound index on `(roomTypeId, stayDate)`.
- **RatePlan / NightlyRate:** room type/rate plan, stay date or effective range, currency, amount, restrictions. Resolve overlapping rules deterministically.
- **InventoryHold:** id, booking/session key, expiry, status, idempotency key.
- **HoldNight:** hold id, room type id, stay date, quantity.
- **Booking:** public reference, guest/contact snapshot, hotel/room type, stay dates, rooms/guests, currency, totals, policy/rate snapshots, status, timestamps.
- **BookingNight:** booking id, stay date, quantity, unit price and tax/fee snapshot.
- **Payment / Refund:** booking id, provider, unique provider reference, amount, currency, status, idempotency key and event timestamps.
- **Coupon, Review, AuditLog, NotificationAttempt:** add as their phases ship.

## Inventory invariant

For each room type and stay date: `held + confirmed + blocked <= total`. Enforce updates with conditional MongoDB `findOneAndUpdate` operations using a capacity predicate, inside a transaction spanning all nights. A range booking writes one inventory claim per night; if any conditional update fails, abort the transaction. Checkout date is excluded. Holds have explicit expiry; a background expiry job is an optimization, while every inventory claim must also ignore/reap expired holds safely. MongoDB transactions require a replica set and should use bounded retries for transient transaction conflicts.

## Important constraints/indexes

- Unique hotel slug; unique `(roomTypeId, stayDate)` inventory document.
- Unique booking public reference; unique `(provider, provider_event_id)` payment event.
- Index hotels by publication status/city; bookings by reference, guest, hotel and stay dates/status; holds by status/expiry.
- Avoid storing sensitive card data. Store provider tokens/references only. Use Mongoose schema validation plus database indexes; MongoDB does not provide relational foreign keys, so validate referenced records and handle deletion/archive rules in services.

## Reporting

Define revenue by captured payments or completed stays explicitly. Preserve booking-time prices and taxes so reports/invoices do not change when rates later change. Document local-date boundaries per property.
