# Authentication

<a id="authentication"></a>
## Authentication Module Specification

- **Implementation rules:** coding rules for implementing auth and security live in [../guidelines/backend.md](../guidelines/backend.md); this file states what the module must do.

### 1. Purpose and boundaries

- **Identity and session only:** authentication establishes the actor identity and session.
- **No permissions granted:** it does not grant hotel or booking permissions; authorization is specified in [rbac.md](./rbac.md).
- **Supported identities:** guest checkout identity, registered guests, and staff identities.
- **Separate portals:** staff and guest portals use distinct audience/session policies even if they share identity infrastructure.

### 2. Supported initial flows

#### Staff login

1. **Input:** accept normalized email and password over HTTPS.
2. **Throttle first:** apply IP and account-based throttling before expensive verification; return a generic failure that does not reveal whether the email exists.
3. **Account checks:** verify the account is active, not locked, and the password hash matches.
4. **MFA challenge:** if MFA is enabled/required, issue a short-lived pre-auth challenge that cannot access application APIs.
5. **On success:** rotate session credentials, record session metadata and audit successful/failed administrative login without storing secrets.
6. **Response:** return minimal identity and permissions needed for UI rendering; APIs still enforce permissions per request.

#### Guest login and registration

- **Registration:** normalizes email and phone and creates a guest identity with verified/unverified contact state.
- **Email uniqueness:** enforced by a normalized unique index; the registration response must not enable account enumeration.
- **Accountless checkout:** a guest can complete checkout without an account; a booking access mechanism is separate from login credentials (see [guest-accounts.md](./guest-accounts.md)).
- **Google/OTP later:** Google/OTP authentication is a later adapter-based extension and must not auto-link an existing account solely because an unverified provider email matches.

#### Password recovery

- **Uniform response:** always return the same public response whether an account exists.
- **Token generation:** generate a cryptographically random single-use token; store only a keyed/hash representation and expiry.
- **Delivery and expiry:** send the token through the verified channel; expire after a short configured period (default 60 minutes).
- **On successful reset:** atomically consume the token, update the password hash, revoke all sessions, and notify the account owner.
- **Authenticated password change:** requires the current password or an equivalent recent-authentication challenge.

### 3. Session design

- **Selected design:** server-managed opaque sessions.
  - Issue a random high-entropy session token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie; persist only a cryptographic hash of the token.
  - Do not use browser-stored JWTs or add a second token model.
  - Use CSRF tokens plus strict Origin checks for state-changing cookie-authenticated requests.
  - Guest and staff sessions use distinct cookie names/audiences and authorization contexts.
- **Session record:** id, userId, audience (`GUEST` or `STAFF`), tokenHash, createdAt, lastSeenAt, expiresAt, revokedAt, revokeReason, IP prefix or privacy-safe representation, userAgent summary, MFA-authenticated timestamp.
  - Avoid indefinite raw IP retention.
- **Staff session defaults:** 30-minute idle timeout and 12-hour absolute lifetime; require MFA for privileged production accounts.
- **Guest session defaults:** 30-day idle timeout and 90-day absolute lifetime.
- **Central configuration:** configure values centrally and shorten them if risk review requires.
- **Rotation triggers:** session rotation occurs after login, MFA completion, password change, privilege change, and suspected compromise.
- **Logout:** logout revokes the current session server-side and clears the cookie; logout-all revokes every active session for that identity.
- **Forced revocation:** suspended users, password reset, staff role changes, and compromised sessions revoke affected sessions.
- **No refresh loops:** a CSRF or session expiry response must not trigger infinite client refresh loops.

### 4. Password and credential policy

- **Hashing algorithm:** use Argon2id with reviewed memory/time parameters, or bcrypt with an approved work factor if deployment constraints require it.
- **Never reversible, never logged:** never encrypt passwords reversibly or log credentials, reset tokens, OTPs, cookies, or authorization headers.
- **Strength controls:** enforce a sensible minimum length, compromised-password screening where available, and rate limits; avoid arbitrary composition rules as the only strength control.
- **Rehash on upgrade:** rehash on successful login when parameters are upgraded.
- **MFA TOTP secrets:** store encrypted with a managed key; show the setup secret once and require a valid code before enabling.
- **Recovery codes:** random, single-use, stored hashed, and regenerated only after reauthentication.

### 5. API contract

- **Guest register:** `POST /api/v1/auth/guest/register`
- **Guest login:** `POST /api/v1/auth/guest/login`
- **Staff login:** `POST /api/v1/auth/staff/login`
- **MFA verify:** `POST /api/v1/auth/mfa/verify`
- **Logout:** `POST /api/v1/auth/logout`
- **Logout all:** `POST /api/v1/auth/logout-all`
- **Current identity:** `GET /api/v1/auth/me`
- **Forgot password:** `POST /api/v1/auth/password/forgot`
- **Reset password:** `POST /api/v1/auth/password/reset`
- **Change password:** `POST /api/v1/auth/password/change`
- **Session management (where enabled):** `GET /api/v1/auth/sessions` and `DELETE /api/v1/auth/sessions/:id`.
- **Generic error codes:** auth responses use generic errors (`AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_UNAVAILABLE`, `AUTH_MFA_REQUIRED`, `AUTH_SESSION_EXPIRED`, `AUTH_RATE_LIMITED`).
- **Never returned:** password hashes, token hashes, MFA secrets, or internal lockout details.

### 6. Data and indexes

- **User:** stores normalized identity, passwordHash, accountType, status, emailVerifiedAt, phoneVerifiedAt, failedLoginCount, lockUntil, createdAt, updatedAt.
- **Session:** stores only tokenHash and metadata.
- **PasswordReset:** stores tokenHash, userId, expiresAt, consumedAt.
- **MFA:** stores encrypted secret and hashed recovery codes.
- **Indexes:**
  - unique normalized email for applicable account types;
  - session tokenHash unique;
  - `(userId, revokedAt, expiresAt)` for session listing;
  - reset tokenHash unique and expiry cleanup TTL as housekeeping only (application must still check expiry).
- **Shared guest/staff email:** be explicit about whether guest and staff may share an email identity; recommended is one identity with distinct portal roles and separate session audience, not duplicate users.

### 7. Abuse protection and observability

- **Throttles:** apply per-IP and per-identity throttles (initial default: 5 failed attempts per 15 minutes per identity and 20 per hour per IP), then a 15-minute account cooldown after repeated failures.
- **Credential stuffing:** add progressive delay and alerting for distributed credential stuffing.
- **Configurable, no permanent lockout:** keep thresholds configurable and avoid permanent lockout denial-of-service.
- **Audited events:** audit staff sign-ins, MFA changes, password resets, logout-all, and session revocations (see [audit-logging.md](./audit-logging.md)).
- **Logging:** logs contain outcome and correlation ID only, never submitted credential material.

### 8. Acceptance criteria

- **No enumeration:** login errors do not disclose account existence.
- **Browser-tested cookies:** session cookie flags and CSRF defenses are verified in browser tests.
- **Rejected credentials:** expired, revoked, wrong-audience, suspended-user, and reused credentials are rejected.
- **Reset token:** the password reset token is single-use, expires, and revokes sessions.
- **Immediate logout:** logout and logout-all revoke access immediately at the API layer.
- **MFA gate:** an MFA challenge cannot access ordinary API routes before successful verification.
- **Rate limits and recovery:** rate limits and recovery flows are tested without exposing account enumeration.
