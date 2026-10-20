# Backend Guidelines

How to build the Staywise API safely: module responsibilities, core coding rules, transactions, authentication/authorisation coding rules and security rules.

- **What is inside:**
  - **[Backend Guidelines](#10-backend-guidelines)** — layer responsibilities, core server rules and transaction rules.
  - **[Authentication and Authorization](#11-auth-rbac)** — how to implement sign-in, roles and sensitive-action controls.
  - **[Security Guidelines](#14-security-guidelines)** — the platform security checklist.
- **Related documents:**
  - **Architecture and stack:** see [../ARCHITECTURE.md](../ARCHITECTURE.md).
  - **API contract:** see [../API.md#08-api-specification](../API.md#08-api-specification).
  - **Data model:** see [../DATA_MODEL.md#07-database-design](../DATA_MODEL.md#07-database-design).
  - **Testing and operations:** see [testing-devops.md](testing-devops.md).

---

<a id="10-backend-guidelines"></a>
## Backend Guidelines

### Module responsibilities

- **Controllers:** Handle HTTP mapping, authentication/authorisation metadata, DTO parsing and response codes.
- **Services:** Own domain decisions and orchestration.
- **Repositories:** Handle persistence; database transactions are explicit and short.
- **Provider adapters:** Isolate payments, media and notifications.

### Core rules

- **Server-side recompute:** Recompute availability and price on the server at hold/booking time.
- **Money and snapshots:** Use integer minor currency units and immutable booking price snapshots.
- **No network calls in transactions:** Keep external network calls outside database transactions.
- **Idempotency:** Make webhook processing and booking commands idempotent.
- **State transitions:** Use explicit state transition functions; reject invalid transitions.
- **Audit events:** Emit audit events for sensitive admin changes with actor, action, target, before/after summary and timestamp (auditing of sensitive changes also stated in [11-auth-rbac](#sensitive-actions) and [14-security-guidelines](#14-security-guidelines)).
- **Input handling:** Validate and normalise all input. Use parameterised queries and bounded result sizes (parameterised queries also stated in [14-security-guidelines](#14-security-guidelines)).
- **Logging limits:** Never log passwords, tokens, payment secrets, full payment payloads or unnecessary personal data.
- **Health checks:** Expose health/readiness checks without revealing infrastructure secrets (health and readiness endpoints also described in [testing-devops.md#reliability](testing-devops.md#reliability)).

### Transactions

- **Lock every night:** The reservation transaction locks or conditionally updates every stay-night inventory row.
- **All or nothing:** If any night lacks quantity, roll back all claims.
- **Same-transaction persistence:** Persist the hold/booking and the per-night price snapshot in the same transaction.
- **Retry safety:** Expiry, cancellation and confirmation must each be safe to retry.

---

<a id="11-auth-rbac"></a>
## Authentication and Authorization

- **Behaviour:** see [../modules/authentication.md#authentication](../modules/authentication.md#authentication) and [../modules/rbac.md#rbac-permissions](../modules/rbac.md#rbac-permissions). This section keeps the coding rules.

### Authentication

- **Initial method:** Start with email/password and verified email for staff.
- **Password hashing:** Hash passwords with a maintained password-hashing algorithm (Argon2id or bcrypt with reviewed parameters) (also stated in [14-security-guidelines](#14-security-guidelines)).
- **Browser sessions:** Use secure, HttpOnly, SameSite cookies for browser sessions with CSRF defences, or a carefully managed short-lived access/refresh token design (CSRF with cookies also stated in [14-security-guidelines](#14-security-guidelines)).
- **Abuse protection:** Apply login throttling and account recovery protections.
- **Later methods:** OTP/social login can follow after threat review.
- **Guest checkout:** Guests may check out without an account.
- **Booking retrieval:** Must use authenticated ownership or a high-entropy, expiring access mechanism; a guessable booking number alone is not authorisation.

### Roles

- **`SUPER_ADMIN`:** platform-wide administration.
- **`HOTEL_MANAGER`:** only explicitly assigned hotel resources and permitted actions; later phase.
- **`GUEST`:** own profile, bookings and eligible reviews.
- **Enforcement:** Enforce access on every API request. Hiding UI controls is not authorisation. Check both action permission and resource/property scope (also stated in [14-security-guidelines](#14-security-guidelines); UI side in [frontend-ui.md#admin-ui-kit](frontend-ui.md#admin-ui-kit)).

### Sensitive actions

- **Stronger controls for:** staff account changes, refunds, inventory adjustments, policy changes and role assignment.
- **Audit fields:** Audit actor, target, outcome and reason.
- **No self-elevation:** Avoid allowing staff to raise their own privilege.
- **MFA:** Add MFA for administrators before broad production use.

---

<a id="14-security-guidelines"></a>
## Security Guidelines

- **Transport and CORS:** Enforce HTTPS and secure headers in production; restrict CORS to known origins.
- **DTO validation:** Validate DTOs with allowlists, bounds and normalisation. Use parameterised database queries (also stated in [10-backend-guidelines](#core-rules)).
- **Passwords and sessions:** Hash passwords; protect sessions/cookies and implement CSRF defences when using cookies (detail in [11-auth-rbac](#authentication)).
- **Rate limiting:** Rate-limit login, OTP, booking creation, coupon attempts and public retrieval endpoints.
- **Authorisation:** Authorise every resource access; verify guest ownership and hotel scope server-side (also stated in [11-auth-rbac](#roles)).
- **Payment webhooks:** Verify payment webhooks cryptographically using the raw body and provider documentation; deduplicate event IDs.
- **Card and personal data:** Never store card PAN/CVV. Minimise and protect personal data; redact logs and define retention.
- **Secrets:** Keep secrets in a secrets manager/environment configuration; rotate keys and restrict access.
- **Audit:** Audit staff changes to rates, inventory, policies, roles, bookings and refunds (also stated in [10-backend-guidelines](#core-rules) and [11-auth-rbac](#sensitive-actions)).
- **Least privilege and uploads:** Use least privilege for database and storage accounts; restrict upload types, sizes and metadata.
- **Supply chain:** Patch dependencies, scan build artifacts and review security-sensitive changes.
- **Operational readiness:** Define incident response, backup access, restore tests and production access reviews (backup/restore also covered in [testing-devops.md#16-devops](testing-devops.md#16-devops)).
