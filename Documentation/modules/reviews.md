# Reviews and Ratings

<a id="reviews-ratings"></a>
## Reviews and Ratings Specification

### Eligibility and data

- **Ownership:** a review belongs to a hotel and a booking (optionally a room type).
- **Author eligibility:** the author must be a guest tied to a completed eligible stay.
- **Stored fields:**
  - rating as a 1–5 integer;
  - title/comment;
  - submittedAt;
  - moderation status (`PENDING`, `APPROVED`, `REJECTED`, `REMOVED`);
  - moderation actor/reason;
  - verified-stay flag derived from booking eligibility.

### Rules

- **One review per booking:** one review per eligible booking/property unless the product explicitly supports per-room reviews.
- **Completion required:** the booking must be `COMPLETED`; checkout alone is insufficient if operations require closure.
- **Validation:** validate rating range, text length, content policy, and no prohibited markup/scripts.
- **Public visibility:** only approved reviews are public. Edits after approval return to pending moderation.
- **Moderation side effects:** admin moderation does not alter booking eligibility or rating history without audit.
- **Aggregates:** aggregate ratings use a documented calculation and update safely; moderation status controls inclusion.

### API

- **Guest – submit review:** `POST /api/v1/bookings/:reference/reviews`.
- **Guest/public – list hotel reviews:** `GET /api/v1/hotels/:slug/reviews`.
- **Admin – list reviews:** `GET /admin/reviews`.
- **Admin – moderate:** `POST /admin/reviews/:id/approve|reject|remove` with reason and permission (see `reviews.moderate` in [rbac.md](./rbac.md)).

### Acceptance criteria

- **Rejected submissions:** non-guest, non-completed, duplicate, or out-of-range submissions are rejected.
- **No public leakage:** pending/rejected reviews are never returned publicly.
- **Consistent aggregates:** approval/removal updates aggregates consistently and is auditable.
