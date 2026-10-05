# Backend Guidelines

## Module responsibilities

- Controllers handle HTTP mapping, authentication/authorization metadata, DTO parsing and response codes.
- Services own domain decisions and orchestration.
- Repositories handle persistence; database transactions are explicit and short.
- Provider adapters isolate payments, media and notifications.

## Core rules

- Recompute availability and price on the server at hold/booking time.
- Use integer minor currency units and immutable booking price snapshots.
- Keep external network calls outside database transactions.
- Make webhook processing and booking commands idempotent.
- Use explicit state transition functions; reject invalid transitions.
- Emit audit events for sensitive admin changes with actor, action, target, before/after summary and timestamp.
- Validate and normalize all input. Use parameterized queries and bounded result sizes.
- Never log passwords, tokens, payment secrets, full payment payloads or unnecessary personal data.
- Expose health/readiness checks without revealing infrastructure secrets.

## Transactions

Reservation transaction locks or conditionally updates every stay-night inventory row. If any night lacks quantity, roll back all claims. Persist the hold/booking and per-night price snapshot in the same transaction. Expiry, cancellation and confirmation must each be safe to retry.
