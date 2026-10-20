# RBAC and Permissions

<a id="rbac-permissions"></a>
## RBAC and Permission System Specification

- **Implementation rules:** coding rules for auth/RBAC and security live in [../guidelines/backend.md](../guidelines/backend.md); this file states what the module must do.

### 1. Security objective

- **Three-part authorization:** every request must be authorized by **actor status + action permission + resource scope**.
- **Role name is insufficient:** a role name by itself is insufficient.
- **UI is not enforcement:** UI visibility is not enforcement.
- **Model:** this system uses role-based permissions with explicit property scope (RBAC plus resource attributes).

### 2. Principals and scope

- **`SUPER_ADMIN`:** platform-wide scope; may manage properties, staff, bookings, configuration, reports, and delegated roles.
- **`HOTEL_MANAGER`:** later release; scope is the explicit set of assigned hotel IDs and selected permissions. No implicit global access.
- **`GUEST`:** may act on their own profile, eligible booking, and review only.
- **Service identities:** narrowly scoped machine principals for webhooks/jobs; never impersonate a human admin.
- **Team-defined roles:** support team-defined roles rather than hard-coded role branches.
- **Permission keys:** a permission is a stable key such as `hotels.view`, `inventory.adjust`, `bookings.cancel`, or `staff.roles.assign`.

### 3. Permission catalog

- **Catalog ownership:** permissions are code-owned, seeded, versioned, and read-only through the runtime admin UI.
- **Suggested groups (domain → permission keys):**
  - **Hotels:** `hotels.view`, `hotels.create`, `hotels.edit`, `hotels.publish`, `hotels.archive`
  - **Room types:** `room_types.view`, `room_types.create`, `room_types.edit`, `room_types.archive`
  - **Inventory:** `inventory.view`, `inventory.block`, `inventory.adjust`, `inventory.override`
  - **Rates/policies:** `rates.view`, `rates.edit`, `policies.view`, `policies.edit`
  - **Bookings:** `bookings.view`, `bookings.create_walkin`, `bookings.modify`, `bookings.checkin`, `bookings.checkout`, `bookings.cancel`, `bookings.no_show`
  - **Payments:** `payments.view`, `refunds.request`, `refunds.approve`, `refunds.execute`
  - **Guests/reviews:** `guests.view`, `guests.suspend`, `reviews.moderate`
  - **Staff/RBAC:** `staff.view`, `staff.invite`, `staff.suspend`, `roles.view`, `roles.create`, `roles.edit`, `roles.assign`
  - **Reports/audit:** `reports.view`, `reports.export`, `audit_logs.view`, `audit_logs.export`
- **No wildcards:** avoid broad `*` permissions for custom roles.
- **Sensitive permissions:** sensitive permissions (override inventory, approve/execute refund, role assignment, export personal data) should be separately grantable and auditable.

### 4. Persistence model

- **`Permission`:** immutable key, domain, description, sensitivity, version.
- **`Role`:** name, normalizedName, description, system flag, permissionKeys, status, createdBy, updatedAt.
- **`StaffMembership`:** userId, hotelIds (empty only for platform scope), roleIds, status, invitedAt, acceptedAt.
- **`RoleAssignmentEvent`:** actor, target, prior/new role IDs, scope, reason, timestamp.
- **Unique indexes:** permission key, normalized role name (within platform/tenant rule), and membership identity.
- **No embedded definitions:** avoid embedding mutable permission definitions into every user record.
- **Effective permissions:** resolved from active roles and current membership on each request or a short-lived cache with explicit invalidation.

### 5. Authorization pipeline

1. **Authenticate:** authenticate the session and validate audience/status.
2. **Load grants:** load current actor membership and current role grants; do not trust claims alone for high-risk actions.
3. **Permission check:** check the required permission key.
4. **Resolve target:** resolve the target hotel/property from the persisted resource, not an untrusted body field alone.
5. **Scope check:** verify the requested hotel is within actor scope.
6. **Domain constraints:** apply domain constraints (ownership, booking state, inventory invariant, refund amount/policy).
7. **Audit and decide:** record an audit event for sensitive mutation and return the decision.

- **NestJS implementation:** uses `@RequirePermissions('inventory.adjust')`, `PermissionsGuard`, and a scope service.
- **Guards vs services:** guards may reject unauthenticated/permission-missing requests; domain services must still enforce resource-specific ownership and state.

### 6. Role administration rules

- **System roles:** cannot be deleted; their grants change only via versioned seed/migration and reviewed deployment.
- **Delegation limit:** custom roles cannot grant permissions the acting user is not allowed to delegate.
- **No self-grant:** a user cannot assign or grant permissions to themselves.
- **Last super admin:** prevent removal/demotion of the last active super admin without an approved recovery procedure.
- **Prompt effect:** role updates take effect promptly; revoke sessions or refresh authorization context for privilege reductions.
- **Change controls:** role changes require confirmation, reason, before/after diff, and audit entry.
- **Invitations:** invitation acceptance binds to the invited email and single-use token; changing roles requires a new authorized action (see [staff-users.md](./staff-users.md)).

### 7. API contract

- **Permission catalog:** `GET /api/v1/admin/permissions` — catalog, read-only.
- **Roles list/create:** `GET /api/v1/admin/roles` / `POST /api/v1/admin/roles` — list/create custom roles.
- **Role inspect/update:** `GET /api/v1/admin/roles/:id` / `PATCH /api/v1/admin/roles/:id` — inspect/update grants.
- **Staff access read:** `GET /api/v1/admin/staff/:id/access` — effective roles, scope, and permissions.
- **Staff access change:** `PUT /api/v1/admin/staff/:id/access` — change role/scope with reason and optimistic version.
- **Required permissions:** all endpoints require `roles.view`, `roles.create`, `roles.edit`, or `roles.assign` as appropriate and platform-scope authority.
- **No leakage:** responses must not reveal sensitive role assignments to unauthorized managers.
- **Forbidden response:** return `403 FORBIDDEN` for authenticated but unauthorized actors and avoid resource-existence leaks where necessary.

### 8. Required authorization matrix

- **Machine-readable matrix:** maintain a machine-readable test matrix with rows for roles and columns for actions/resources.
- **Minimum checks:**
  - guest cannot call admin APIs;
  - manager A cannot read or mutate hotel B;
  - manager cannot grant roles or issue refunds unless specifically authorized;
  - admin cannot access guest-owned bookings as guest;
  - suspended staff loses access;
  - super admin can administer all properties but actions remain audited.

### 9. Acceptance criteria

- **Declared requirements:** every protected route declares its permission requirement and resource scope.
- **Cross-hotel substitution:** cross-hotel ID substitution is rejected even when the caller has the same action permission.
- **Stale access:** permission changes invalidate stale access promptly.
- **Grant change record:** role grant changes have actor, reason, before/after details and an audit record.
- **Safeguards tested:** last-super-admin and self-elevation safeguards are tested.
- **Seeded catalog:** the permission catalog is seeded idempotently and cannot be modified through normal CRUD.
