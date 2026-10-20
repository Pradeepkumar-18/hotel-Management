# DevOps and Operations

## Environments

Keep local, staging and production isolated, with separate databases, gateway credentials, media buckets and secrets. Staging should use payment test mode. Never copy production personal data into development casually.

## Deployment

Build immutable versioned artifacts, apply reviewed backward-compatible database migrations, deploy, run health checks, then shift traffic. Maintain a rollback plan; schema changes may require expand/migrate/contract sequencing.

## Observability

Structured logs with request/correlation IDs; metrics for search latency, hold conflicts/expiry, booking conversion, payment outcomes and refund age; alerts for database health, webhook failures, elevated errors and reconciliation backlog. Redact personal and payment data.

## Reliability

- Scheduled encrypted backups and tested restore at a defined recovery point/time objective.
- Payment event reconciliation against provider records.
- Durable retry for expiry cleanup and notifications; idempotent consumers.
- Health endpoint for process and readiness endpoint for database/dependencies.
- Document on-call owner and runbooks for payment outage, overbooking risk and data restore.

## Configuration

Document environment variables in `.env.example` with no real secrets. Pin runtime and dependencies. Use TLS and managed database/storage in production. Do not treat a local Compose file as a production deployment plan.
