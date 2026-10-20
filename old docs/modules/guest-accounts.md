# Guest Accounts and Booking Access Specification

## Scope

Guest identity, profile, contact verification, account booking history, and secure access to bookings created without an account. Guest identity must not be used as proof of payment or booking authorization by itself.

## Profile model

Store normalized email/phone, display name, verification timestamps, account status, locale preference, created/updated timestamps, and privacy/consent records where required. Avoid storing payment credentials. Booking records retain a contact and policy snapshot so later profile changes do not rewrite historical records.

## Guest checkout binding

- Guest booking captures minimum contact fields required for fulfillment and sends a booking access link to a verified/validated channel.
- Access link is high entropy, single-purpose, expiring, revocable, and stored hashed.
- For higher-risk actions (cancellation, changing contact or payment), require login or step-up verification.
- Booking reference is an identifier, never a secret.
- Account creation may claim eligible prior bookings only after verification of the same contact channel and policy checks.

## Guest capabilities

View/edit permitted profile fields; view own bookings; request cancellation subject to policy; download own receipt; submit one eligible review after completed stay. Guest cannot change a completed booking’s price/policy snapshot or view another guest’s data.

## APIs

`GET/PATCH /api/v1/guests/me`; `GET /api/v1/guests/me/bookings`; `GET /api/v1/bookings/:reference`; `POST /api/v1/booking-access/claim`; contact verification endpoints. Apply ownership checks to every booking resource.

## Acceptance criteria

- Guessing a booking reference does not grant access.
- Profile updates do not mutate historical booking snapshots.
- Guest can access only own or explicitly claimed bookings.
- Account deletion/export requests follow documented market retention and legal requirements.
