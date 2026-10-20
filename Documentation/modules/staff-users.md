# Staff User Management

<a id="staff-user-management"></a>
## Staff User Management Specification

### Scope

- **What the module covers:** manage internal users, invitations, memberships, role assignments, suspension, and access history.
- **Related specs:** authentication behavior is in [authentication.md](./authentication.md); grants and scope rules are in [rbac.md](./rbac.md).

### Lifecycle

- **States:** `INVITED → ACTIVE → SUSPENDED`, with `REVOKED` as the invitation terminal state and an optional soft-deleted account state.
- **Expired invitations:** expiry is derived from `expiresAt <= now` and persisted when observed; scheduled cleanup is housekeeping, not security enforcement.

### Invitation flow

1. **Request:** authorized staff enters email, role IDs, and property scope.
2. **Delegation check:** the API verifies the inviter can delegate every permission and scope requested.
3. **Token creation:** create a random single-use token; persist only the hash, intended normalized email, roles/scope, inviter, expiry, status.
4. **Delivery:** send the invite link through the notification adapter (see [notifications.md](./notifications.md)); never return the token except in controlled development mode.
5. **Acceptance:** verifies token, expiry, email binding, and unused state; set password/MFA policy and activate the membership atomically.
6. **Reissue/revoke:** reissue rotates the token and invalidates the previous token; revoke blocks acceptance immediately.

### Operations

- **Search:** search staff by name/email/status/role/property with pagination and allowlisted sorting.
- **Detail view:** view profile, assigned roles/scope, invite history, active sessions, and auditable activity.
- **Suspension:** immediately blocks new API requests and revokes sessions.
- **Soft deletion:** preserves audit references and prevents identity reuse until retention rules permit purge.
- **Role/scope change:** requires permission, reason, version check, confirmation, audit event, and authorization refresh.
- **Final super admin:** never allow the final active super admin to suspend/demote/delete themselves without a recovery protocol.

### Data fields and indexes

- **Staff membership:** userId, roleIds, hotelIds or explicit global scope, status, invitedBy, acceptedAt, version.
- **Invitation:** tokenHash unique, normalizedEmail, roleIds, hotelIds, expiresAt, status, consumedAt.
- **Indexes:** email, status, hotel membership, invitation token hash, and expiry.
- **No raw tokens:** avoid storing raw invitation tokens.

### API surfaces

- **Staff list/create:** `GET/POST /api/v1/admin/staff`.
- **Staff read/update:** `GET/PATCH /admin/staff/:id`.
- **Suspend:** `POST /admin/staff/:id/suspend`.
- **Reactivate:** `POST /admin/staff/:id/reactivate`.
- **Access change:** `PUT /admin/staff/:id/access`.
- **Invitations list/create:** `GET/POST /admin/invitations`.
- **Resend invitation:** `POST /admin/invitations/:id/resend`.
- **Revoke invitation:** `POST /admin/invitations/:id/revoke`.
- **Public acceptance:** `POST /api/v1/auth/staff/accept-invitation`.
- **Authorization:** apply RBAC permissions and hotel scope to every route.

### Acceptance criteria

- **Invitation properties:** invitations are single-use, email-bound, expiring, revocable, and stored hashed.
- **Immediate suspension:** suspended staff access is revoked immediately, including existing sessions.
- **Manager limits:** managers cannot manage staff outside their assigned properties or delegate excessive access.
- **Lists:** search/list endpoints are paginated and redact secrets.
- **Audit coverage:** role, scope, suspension, invitation and session actions are audited.
