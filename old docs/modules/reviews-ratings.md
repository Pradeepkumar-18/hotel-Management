# Reviews and Ratings Specification

## Eligibility and data

Review belongs to hotel and booking (optionally room type); author must be a guest tied to a completed eligible stay. Store rating 1–5 integer, title/comment, submittedAt, moderation status (`PENDING`, `APPROVED`, `REJECTED`, `REMOVED`), moderation actor/reason, and verified-stay flag derived from booking eligibility.

## Rules

- One review per eligible booking/property unless product explicitly supports per-room reviews.
- Booking must be `COMPLETED`; checkout alone is insufficient if operations require closure.
- Validate rating range, text length, content policy, and no prohibited markup/scripts.
- Only approved reviews are public. Edits after approval return to pending moderation.
- Admin moderation does not alter booking eligibility or rating history without audit.
- Aggregate ratings use documented calculation and update safely; moderation status controls inclusion.

## API

Guest `POST /api/v1/bookings/:reference/reviews`, `GET /api/v1/hotels/:slug/reviews`; admin `GET /admin/reviews`, `POST /admin/reviews/:id/approve|reject|remove` with reason and permission.

## Acceptance criteria

- Non-guest, non-completed, duplicate, or out-of-range submissions are rejected.
- Pending/rejected reviews are never returned publicly.
- Approval/removal updates aggregates consistently and is auditable.
