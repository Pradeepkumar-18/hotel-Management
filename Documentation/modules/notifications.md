# Notifications

<a id="notifications"></a>
## Notifications Module Specification

### Purpose

- **Booking correctness first:** deliver transactional messages without making email/SMS availability a prerequisite for booking correctness.
- **Event-driven emission:** notifications are emitted from durable domain events after the booking/payment state change commits.

### Event triggers

- **Trigger events:**
  - booking confirmed;
  - cancellation accepted;
  - refund status changed;
  - pre-arrival reminder due;
  - invitation created/resend;
  - password reset requested;
  - review invitation due.
- **Event identity:** each event has a stable event ID and template version.

### Data and delivery

- **NotificationAttempt record:** stores eventId, recipient reference, channel, template, status, attempts, nextAttemptAt, provider message ID, safe error code, sentAt.
- **Duplicate prevention:** unique `(eventId, channel, recipient)` prevents accidental duplicates.
- **Durable delivery:** prefer outbox + worker for durable delivery; if there is no queue initially, persistent retry polling is required.

### Rules

- **Minimal rendering data:** render from minimal data snapshots; links use expiring secure tokens and do not expose guest data in URL query strings.
- **Templates:** templates are versioned, localized only when locale support is enabled, and previewable in admin tooling.
- **Retries:** retry transient errors with bounded exponential backoff and dead-letter/alert after configured attempts; do not retry permanent invalid-recipient errors forever.
- **Consent:** respect consent and local communication rules for non-transactional messages. Transactional vs marketing messages are separate.
- **Logging:** do not log full message body or sensitive contact details.

### Acceptance criteria

- **No duplicates on retry:** event retries do not send duplicate messages beyond provider-supported idempotency.
- **Outage isolation:** a notification outage does not roll back booking or payment state.
- **Operational visibility:** delivery failure is visible to operations with safe diagnostics and a retry path.
