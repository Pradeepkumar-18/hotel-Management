# Audit Logging

<a id="audit-logging"></a>
## Audit Logging Specification

### Purpose

- **Trustworthy history:** provide trustworthy history for security, operations, booking disputes, and inventory/payment investigations.
- **Append-only and separate:** audit records are append-only from normal application paths and separate from diagnostic logs.

### Events to record

- **Staff access:** staff login/MFA/session changes.
- **Staff administration:** invitations, roles and scope changes.
- **Hotel changes:** hotel publish/suspend/policy edits.
- **Inventory and rates:** room count, rate, block and inventory adjustments.
- **Bookings:** booking creation and state changes; cancellation overrides.
- **Money:** payment/refund actions.
- **Guests and reviews:** guest suspension; review moderation.
- **Data access:** report exports and sensitive data access where legally/operationally required.

### Event schema

- **Fields:** `eventId`, UTC timestamp, actor type/id, effective role/permission, action key, resource type/id, hotel scope, outcome, reason, correlation/request ID, before/after safe diff, source channel, and redacted metadata.
- **Never stored:** passwords, tokens, full payment payload, or unnecessary guest data.
- **Identifiers and versioning:** use immutable identifiers and a versioned event schema.

### Write guarantees

- **Transactional audit:** for critical mutations, the audit/outbox record should commit with the business transaction or use a durable outbox.
- **No silent bypass:** a failed audit write must not silently permit a high-risk operation.
- **Fail-closed operations:** define fail-closed behavior for refunds, access changes, and inventory override.

### Access and retention

- **Separate permission:** viewing/exporting audit data requires separate permission (`audit_logs.view`, `audit_logs.export` in [rbac.md](./rbac.md)).
- **Filtering:** filter by actor, action, resource, hotel, and time with bounded pagination.
- **Retention decisions:** retention and immutability requirements are market/legal decisions.
- **Controlled deletion:** restrict deletion to controlled retention jobs with evidence.

### Acceptance criteria

- **Sensitive mutations:** have actor, reason where required, and before/after representation.
- **Immutable via APIs:** audit history cannot be modified by ordinary admin APIs.
- **Redaction:** secrets and protected personal data are redacted.
- **Scope enforcement:** unauthorized cross-hotel audit queries are denied.
