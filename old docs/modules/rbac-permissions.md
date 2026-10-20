# RBAC and Permission System Specification

## 1. Security objective

Every request must be authorized by **actor status + action permission + resource scope**. A role name by itself is insufficient. UI visibility is not enforcement. This system uses role-based permissions with explicit property scope (RBAC plus resource attributes).

## 2. Principals and scope

- `SUPER_ADMIN`: platform-wide scope; may manage properties, staff, bookings, configuration, reports, and delegated roles.
- `HOTEL_MANAGER`: later release; scope is the explicit set of assigned hotel IDs and selected permissions. No implicit global access.
- `GUEST`: may act on their own profile, eligible booking, and review only.
- Service identities: narrowly scoped machine principals for webhooks/jobs; never impersonate a human admin.

Support team-defined roles rather than hard-coded role branches. A permission is a stable key such as `hotels.view`, `inventory.adjust`, `bookings.cancel`, or `staff.roles.assign`.

## 3. Permission catalog

Permissions are code-owned, seeded, versioned, and read-only through runtime admin UI. Suggested groups:

| Domain | Permission keys |
|---|---|
| Hotels | `hotels.view`, `hotels.create`, `hotels.edit`, `hotels.publish`, `hotels.archive` |
| Room types | `room_types.view`, `room_types.create`, `room_types.edit`, `room_types.archive` |
| Inventory | `inventory.view`, `inventory.block`, `inventory.adjust`, `inventory.override` |
| Rates/policies | `rates.view`, `rates.edit`, `policies.view`, `policies.edit` |
| Bookings | `bookings.view`, `bookings.create_walkin`, `bookings.modify`, `bookings.checkin`, `bookings.checkout`, `bookings.cancel`, `bookings.no_show` |
| Payments | `payments.view`, `refunds.request`, `refunds.approve`, `refunds.execute` |
| Guests/reviews | `guests.view`, `guests.suspend`, `reviews.moderate` |
| Staff/RBAC | `staff.view`, `staff.invite`, `staff.suspend`, `roles.view`, `roles.create`, `roles.edit`, `roles.assign` |
| Reports/audit | `reports.view`, `reports.export`, `audit_logs.view`, `audit_logs.export` |

Avoid broad `*` permissions for custom roles. Sensitive permissions (override inventory, approve/execute refund, role assignment, export personal data) should be separately grantable and auditable.

## 4. Persistence model

- `Permission`: immutable key, domain, description, sensitivity, version.
- `Role`: name, normalizedName, description, system flag, permissionKeys, status, createdBy, updatedAt.
- `StaffMembership`: userId, hotelIds (empty only for platform scope), roleIds, status, invitedAt, acceptedAt.
- `RoleAssignmentEvent`: actor, target, prior/new role IDs, scope, reason, timestamp.

Use unique indexes for permission key, normalized role name (within platform/tenant rule), and membership identity. Avoid embedding mutable permission definitions into every user record. Effective permissions are resolved from active roles and current membership on each request or short-lived cache with explicit invalidation.

## 5. Authorization pipeline

1. Authenticate session and validate audience/status.
2. Load current actor membership and current role grants; do not trust claims alone for high-risk actions.
3. Check required permission key.
4. Resolve target hotel/property from the persisted resource, not an untrusted body field alone.
5. Verify requested hotel is within actor scope.
6. Apply domain constraints (ownership, booking state, inventory invariant, refund amount/policy).
7. Record audit event for sensitive mutation and return decision.

NestJS implementation uses `@RequirePermissions('inventory.adjust')`, `PermissionsGuard`, and a scope service. Guards may reject unauthenticated/permission-missing requests; domain services must still enforce resource-specific ownership and state.

## 6. Role administration rules

- System roles cannot be deleted; their grants change only via versioned seed/migration and reviewed deployment.
- Custom roles cannot grant permissions the acting user is not allowed to delegate.
- A user cannot assign or grant permissions to themselves.
- Prevent removal/demotion of the last active super admin without an approved recovery procedure.
- Role updates take effect promptly; revoke sessions or refresh authorization context for privilege reductions.
- Role changes require confirmation, reason, before/after diff, and audit entry.
- Invitation acceptance binds to the invited email and single-use token; changing roles requires a new authorized action.

## 7. API contract

- `GET /api/v1/admin/permissions` — catalog, read-only.
- `GET /api/v1/admin/roles` / `POST /api/v1/admin/roles` — list/create custom roles.
- `GET /api/v1/admin/roles/:id` / `PATCH /api/v1/admin/roles/:id` — inspect/update grants.
- `GET /api/v1/admin/staff/:id/access` — effective roles, scope, and permissions.
- `PUT /api/v1/admin/staff/:id/access` — change role/scope with reason and optimistic version.
- All endpoints require `roles.view`, `roles.create`, `roles.edit`, or `roles.assign` as appropriate and platform-scope authority.

Responses must not reveal sensitive role assignments to unauthorized managers. Return `403 FORBIDDEN` for authenticated but unauthorized actors and avoid resource-existence leaks where necessary.

## 8. Required authorization matrix

Maintain a machine-readable test matrix with rows for roles and columns for actions/resources. Minimum checks: guest cannot call admin APIs; manager A cannot read or mutate hotel B; manager cannot grant roles or issue refunds unless specifically authorized; admin cannot access guest-owned bookings as guest; suspended staff loses access; super admin can administer all properties but actions remain audited.

## 9. Acceptance criteria

- Every protected route declares its permission requirement and resource scope.
- Cross-hotel ID substitution is rejected even when the caller has the same action permission.
- Permission changes invalidate stale access promptly.
- Role grant changes have actor, reason, before/after details and audit record.
- Last-super-admin and self-elevation safeguards are tested.
- Permission catalog is seeded idempotently and cannot be modified through normal CRUD.
