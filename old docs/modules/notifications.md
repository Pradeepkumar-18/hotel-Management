# Notifications Module Specification

## Purpose

Deliver transactional messages without making email/SMS availability a prerequisite for booking correctness. Notifications are emitted from durable domain events after the booking/payment state change commits.

## Event triggers

Booking confirmed, cancellation accepted, refund status changed, pre-arrival reminder due, invitation created/resend, password reset requested, review invitation due. Each event has a stable event ID and template version.

## Data and delivery

NotificationAttempt stores eventId, recipient reference, channel, template, status, attempts, nextAttemptAt, provider message ID, safe error code, sentAt. Unique `(eventId, channel, recipient)` prevents accidental duplicates. Prefer outbox + worker for durable delivery; if no queue initially, persistent retry polling is required.

## Rules

- Render from minimal data snapshots; links use expiring secure tokens and do not expose guest data in URL query strings.
- Templates are versioned, localized only when locale support is enabled, and previewable in admin tooling.
- Retry transient errors with bounded exponential backoff and dead-letter/alert after configured attempts; do not retry permanent invalid-recipient errors forever.
- Respect consent and local communication rules for non-transactional messages. Transactional vs marketing messages are separate.
- Do not log full message body or sensitive contact details.

## Acceptance criteria

- Event retries do not send duplicate messages beyond provider-supported idempotency.
- Notification outage does not roll back booking or payment state.
- Delivery failure is visible to operations with safe diagnostics and retry path.
