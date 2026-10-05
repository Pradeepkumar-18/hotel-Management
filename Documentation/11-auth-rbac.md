# Authentication and Authorization

## Authentication

Start with email/password and verified email for staff. Hash passwords using a maintained password-hashing algorithm (Argon2id or bcrypt with reviewed parameters). Use secure, HttpOnly, SameSite cookies for browser sessions with CSRF defenses, or a carefully managed short-lived access/refresh token design. Apply login throttling and account recovery protections. OTP/social login can follow after threat review.

Guests may check out without an account. Booking retrieval must use authenticated ownership or a high-entropy, expiring access mechanism; a guessable booking number alone is not authorization.

## Roles

- **SUPER_ADMIN:** platform-wide administration.
- **HOTEL_MANAGER:** only explicitly assigned hotel resources and permitted actions; later phase.
- **GUEST:** own profile, bookings and eligible reviews.

Enforce access on every API request. Hiding UI controls is not authorization. Check both action permission and resource/property scope.

## Sensitive actions

Require stronger controls for staff account changes, refunds, inventory adjustments, policy changes and role assignment. Audit actor, target, outcome and reason. Avoid allowing staff to elevate their own privilege. Add MFA for administrators before broad production use.
