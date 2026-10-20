# Authentication Module Specification

## 1. Purpose and boundaries

Authentication establishes the actor identity and session. It does not grant hotel or booking permissions; authorization is specified in [rbac-permissions.md](./rbac-permissions.md). Supports guest checkout identity, registered guests, and staff identities. Staff and guest portals use distinct audience/session policies even if they share identity infrastructure.

## 2. Supported initial flows

### Staff login

1. Accept normalized email and password over HTTPS.
2. Apply IP and account-based throttling before expensive verification; return a generic failure that does not reveal whether the email exists.
3. Verify account is active, not locked, and password hash matches.
4. If MFA is enabled/required, issue a short-lived pre-auth challenge that cannot access application APIs.
5. On success, rotate session credentials, record session metadata and audit successful/failed administrative login without storing secrets.
6. Return minimal identity and permissions needed for UI rendering; APIs still enforce permissions per request.

### Guest login and registration

- Registration normalizes email and phone and creates a guest identity with verified/unverified contact state.
- Email uniqueness is enforced by a normalized unique index; registration response must not enable account enumeration.
- Guest can complete checkout without an account; a booking access mechanism is separate from login credentials.
- Google/OTP authentication is a later adapter-based extension and must not auto-link an existing account solely because an unverified provider email matches.

### Password recovery

- Always return the same public response whether an account exists.
- Generate a cryptographically random single-use token; store only a keyed/hash representation and expiry.
- Send the token through the verified channel; expire after a short configured period (default 60 minutes).
- On successful reset, atomically consume token, update password hash, revoke all sessions, and notify account owner.
- Password change while authenticated requires current password or an equivalent recent-authentication challenge.

## 3. Session design

**Selected design:** server-managed opaque sessions. Issue a random high-entropy session token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie; persist only a cryptographic hash of the token. Do not use browser-stored JWTs or add a second token model. Use CSRF tokens plus strict Origin checks for state-changing cookie-authenticated requests. Guest and staff sessions use distinct cookie names/audiences and authorization contexts.

Session record: id, userId, audience (`GUEST` or `STAFF`), tokenHash, createdAt, lastSeenAt, expiresAt, revokedAt, revokeReason, IP prefix or privacy-safe representation, userAgent summary, MFA-authenticated timestamp. Avoid indefinite raw IP retention.

- Staff session defaults: 30-minute idle timeout and 12-hour absolute lifetime; require MFA for privileged production accounts. Guest session defaults: 30-day idle timeout and 90-day absolute lifetime. Configure values centrally and shorten them if risk review requires.
- Session rotation occurs after login, MFA completion, password change, privilege change, and suspected compromise.
- Logout revokes the current session server-side and clears the cookie; logout-all revokes every active session for that identity.
- Suspended users, password reset, staff role changes, and compromised sessions revoke affected sessions.
- A CSRF or session expiry response must not trigger infinite client refresh loops.

## 4. Password and credential policy

- Use Argon2id with reviewed memory/time parameters, or bcrypt with an approved work factor if deployment constraints require it.
- Never encrypt passwords reversibly or log credentials, reset tokens, OTPs, cookies, or authorization headers.
- Enforce a sensible minimum length, compromised-password screening where available, and rate limits; avoid arbitrary composition rules as the only strength control.
- Rehash on successful login when parameters are upgraded.
- Store MFA TOTP secrets encrypted with a managed key; show setup secret once and require a valid code before enabling.
- Recovery codes are random, single-use, stored hashed, and regenerated only after reauthentication.

## 5. API contract

- `POST /api/v1/auth/guest/register`
- `POST /api/v1/auth/guest/login`
- `POST /api/v1/auth/staff/login`
- `POST /api/v1/auth/mfa/verify`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`
- `POST /api/v1/auth/password/change`
- `GET /api/v1/auth/sessions` and `DELETE /api/v1/auth/sessions/:id` for session management where enabled.

Auth responses use generic errors (`AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_UNAVAILABLE`, `AUTH_MFA_REQUIRED`, `AUTH_SESSION_EXPIRED`, `AUTH_RATE_LIMITED`). Never return password hashes, token hashes, MFA secrets, or internal lockout details.

## 6. Data and indexes

User stores normalized identity, passwordHash, accountType, status, emailVerifiedAt, phoneVerifiedAt, failedLoginCount, lockUntil, createdAt, updatedAt. Session stores only tokenHash and metadata. PasswordReset stores tokenHash, userId, expiresAt, consumedAt. MFA stores encrypted secret and hashed recovery codes.

Indexes: unique normalized email for applicable account types; session tokenHash unique; `(userId, revokedAt, expiresAt)` for session listing; reset tokenHash unique and expiry cleanup TTL as housekeeping only (application must still check expiry). Be explicit about whether guest and staff may share an email identity; recommended is one identity with distinct portal roles and separate session audience, not duplicate users.

## 7. Abuse protection and observability

Apply per-IP and per-identity throttles (initial default: 5 failed attempts per 15 minutes per identity and 20 per hour per IP), then a 15-minute account cooldown after repeated failures; add progressive delay and alerting for distributed credential stuffing. Keep thresholds configurable and avoid permanent lockout denial-of-service. Audit staff sign-ins, MFA changes, password resets, logout-all, and session revocations. Logs contain outcome and correlation ID only, never submitted credential material.

## 8. Acceptance criteria

- Login errors do not disclose account existence.
- Session cookie flags and CSRF defenses are verified in browser tests.
- Expired, revoked, wrong-audience, suspended-user, and reused credentials are rejected.
- Password reset token is single-use, expires, and revokes sessions.
- Logout and logout-all revoke access immediately at the API layer.
- MFA challenge cannot access ordinary API routes before successful verification.
- Rate limits and recovery flows are tested without exposing account enumeration.
