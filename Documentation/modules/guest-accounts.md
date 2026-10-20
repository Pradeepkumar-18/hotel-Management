# Guest Accounts

<a id="guest-accounts"></a>
## Guest Accounts and Booking Access Specification

### Scope

- **What the module covers:** guest identity, profile, contact verification, account booking history, and secure access to bookings created without an account.
- **Identity is not authorization:** guest identity must not be used as proof of payment or booking authorization by itself.

### Profile model

- **Stored profile fields:** normalized email/phone, display name, verification timestamps, account status, locale preference, created/updated timestamps, and privacy/consent records where required.
- **No payment credentials:** avoid storing payment credentials.
- **Booking snapshots are independent:** booking records retain a contact and policy snapshot so later profile changes do not rewrite historical records.

### Guest checkout binding

- **Minimum contact capture:** guest booking captures the minimum contact fields required for fulfillment and sends a booking access link to a verified/validated channel.
- **Access link properties:** the access link is high entropy, single-purpose, expiring, revocable, and stored hashed.
- **Step-up for risky actions:** for higher-risk actions (cancellation, changing contact or payment), require login or step-up verification.
- **Reference is not a secret:** the booking reference is an identifier, never a secret.
- **Claiming prior bookings:** account creation may claim eligible prior bookings only after verification of the same contact channel and policy checks.

### Guest capabilities

- **Allowed actions:** a guest may
  - view/edit permitted profile fields;
  - view own bookings;
  - request cancellation subject to policy;
  - download own receipt;
  - submit one eligible review after a completed stay.
- **Forbidden actions:** a guest cannot change a completed booking's price/policy snapshot or view another guest's data.

### APIs

- **Profile:** `GET/PATCH /api/v1/guests/me`.
- **Own bookings:** `GET /api/v1/guests/me/bookings`.
- **Booking by reference:** `GET /api/v1/bookings/:reference`.
- **Claim booking access:** `POST /api/v1/booking-access/claim`.
- **Contact verification:** contact verification endpoints.
- **Ownership checks:** apply ownership checks to every booking resource.

### Acceptance criteria

- **Reference guessing:** guessing a booking reference does not grant access.
- **Snapshot immutability:** profile updates do not mutate historical booking snapshots.
- **Access scope:** a guest can access only own or explicitly claimed bookings.
- **Deletion/export:** account deletion/export requests follow documented market retention and legal requirements.
