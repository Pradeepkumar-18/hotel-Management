# Audit Logging Specification

## Purpose

Provide trustworthy history for security, operations, booking disputes, and inventory/payment investigations. Audit records are append-only from normal application paths and separate from diagnostic logs.

## Events to record

Staff login/MFA/session changes; invitations, roles and scope changes; hotel publish/suspend/policy edits; room count, rate, block and inventory adjustments; booking creation and state changes; cancellation overrides; payment/refund actions; guest suspension; review moderation; report exports and sensitive data access where legally/operationally required.

## Event schema

`eventId`, UTC timestamp, actor type/id, effective role/permission, action key, resource type/id, hotel scope, outcome, reason, correlation/request ID, before/after safe diff, source channel, and redacted metadata. Do not store passwords, tokens, full payment payload, or unnecessary guest data. Use immutable identifiers and versioned event schema.

## Write guarantees

For critical mutations, audit/outbox record should commit with the business transaction or use a durable outbox. A failed audit write must not silently permit high-risk operation. Define fail-closed behavior for refunds, access changes, and inventory override.

## Access and retention

Viewing/exporting audit data requires separate permission. Filter by actor, action, resource, hotel, and time with bounded pagination. Retention and immutability requirements are market/legal decisions; restrict deletion to controlled retention jobs with evidence.

## Acceptance criteria

- Sensitive mutations have actor, reason where required, and before/after representation.
- Audit history cannot be modified by ordinary admin APIs.
- Secrets and protected personal data are redacted.
- Unauthorized cross-hotel audit queries are denied.
