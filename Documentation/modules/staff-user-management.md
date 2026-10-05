# Staff User Management Specification

## Scope

Manage internal users, invitations, memberships, role assignments, suspension, and access history. Authentication behavior is in [authentication.md](./authentication.md); grants and scope rules are in [rbac-permissions.md](./rbac-permissions.md).

## Lifecycle

`INVITED → ACTIVE → SUSPENDED` with `REVOKED` invitation terminal state and optional soft-deleted account state. Expired invitation is derived from `expiresAt <= now` and persisted when observed; scheduled cleanup is housekeeping, not security enforcement.

## Invitation flow

1. Authorized staff enters email, role IDs, and property scope.
2. API verifies inviter can delegate every permission and scope requested.
3. Create random single-use token; persist only hash, intended normalized email, roles/scope, inviter, expiry, status.
4. Send invite link through notification adapter; never return token except in controlled development mode.
5. Acceptance verifies token, expiry, email binding, and unused state; set password/MFA policy and activate membership atomically.
6. Reissue rotates token and invalidates previous token; revoke blocks acceptance immediately.

## Operations

- Search staff by name/email/status/role/property with pagination and allowlisted sorting.
- View profile, assigned roles/scope, invite history, active sessions, and auditable activity.
- Suspension immediately blocks new API requests and revokes sessions.
- Soft deletion preserves audit references and prevents identity reuse until retention rules permit purge.
- Role/scope change requires permission, reason, version check, confirmation, audit event, and authorization refresh.
- Never allow the final active super admin to suspend/demote/delete themselves without recovery protocol.

## Data fields and indexes

Staff membership includes userId, roleIds, hotelIds or explicit global scope, status, invitedBy, acceptedAt, version. Invitation includes tokenHash unique, normalizedEmail, roleIds, hotelIds, expiresAt, status, consumedAt. Index email, status, hotel membership, invitation token hash, and expiry. Avoid storing raw invitation tokens.

## API surfaces

`GET/POST /api/v1/admin/staff`; `GET/PATCH /admin/staff/:id`; `POST /admin/staff/:id/suspend`; `POST /admin/staff/:id/reactivate`; `PUT /admin/staff/:id/access`; `GET/POST /admin/invitations`; `POST /admin/invitations/:id/resend`; `POST /admin/invitations/:id/revoke`; public `POST /api/v1/auth/staff/accept-invitation`. Apply RBAC permissions and hotel scope to every route.

## Acceptance criteria

- Invitations are single-use, email-bound, expiring, revocable, and stored hashed.
- Suspended staff access is revoked immediately, including existing sessions.
- Managers cannot manage staff outside their assigned properties or delegate excessive access.
- Search/list endpoints are paginated and redact secrets.
- Role, scope, suspension, invitation and session actions are audited.
