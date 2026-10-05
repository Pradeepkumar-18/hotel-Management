# Frontend Guidelines

- Build guest and admin experiences as separate route areas with shared accessible primitives.
- Search state (destination, dates, occupancy, filters) should be serializable in the URL so links can be shared and refreshed.
- Treat search results as quotes, not reservations. Refresh/revalidate when the guest requests a hold.
- Checkout displays a server-returned itemized quote and hold countdown. Clearly handle price changes, expiry, payment pending, and retry.
- Model async screens explicitly: initial, loading, success/empty, and error; preserve user input on recoverable errors.
- Disable duplicate submit while a request is in flight, but rely on server idempotency for correctness.
- Use form labels, inline validation, keyboard navigation, focus management, and accessible status announcements.
- Avoid exposing guest personal details in URLs, analytics events, logs, or browser storage.
- Admin actions that alter price, inventory or booking state require clear confirmation and reason where appropriate.
- Use responsive layouts designed for mobile booking, not only desktop dashboards.
