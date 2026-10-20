# Testing & DevOps Guidelines

How to test the Staywise platform and how to run it across environments.

- **What is inside:**
  - **[Testing Strategy](#15-testing-strategy)** — unit, database integration, API/authorisation, end-to-end and operations tests.
  - **[DevOps and Operations](#16-devops)** — environments, deployment, observability, reliability and configuration.
- **Related documents:**
  - **Backend rules:** see [backend.md](backend.md).
  - **Deployment behaviour:** see [../modules/deployment-operations.md#deployment-operations](../modules/deployment-operations.md#deployment-operations).

---

<a id="15-testing-strategy"></a>
## Testing Strategy

- **Priority:** Prioritise tests by financial and inventory risk.

### Unit tests

- **What to cover:** date interval boundaries, capacity allocation, per-night rate resolution, tax/discount rounding, cancellation cutoffs, state transitions and idempotency behaviour.

### Database integration tests

- **Last room race:** Two concurrent attempts for the last room: exactly one succeeds.
- **Partial stay:** Multi-night stay where one night is unavailable: no partial inventory is held.
- **Release once:** Expiry/cancellation/retry releases inventory exactly once.
- **Webhook safety:** Duplicate webhook and out-of-order payment events do not double-confirm/refund.
- **Date boundaries:** Date boundaries correctly exclude the checkout night and respect the property time zone.

### API and authorization tests

- **What to validate:** DTO errors, stable status/error codes, guest ownership, hotel-manager scope, super-admin capabilities, audit records and rate limits.

### End-to-end tests

- **Main journey:** Admin configures a hotel → guest searches → creates hold → completes test payment → sees confirmation → admin checks guest in/out.
- **Extra paths:** expiry, payment failure, cancellation/refund, mobile viewport and keyboard paths.

### Operations verification

- **What to test:** migrations from the prior version, backup restore, payment reconciliation, monitoring alerts and rollback.
- **Real database:** Tests should run against a real transactional database engine, not only mocks, for concurrency guarantees.

---

<a id="16-devops"></a>
## DevOps and Operations

- **Behaviour:** see [../modules/deployment-operations.md#deployment-operations](../modules/deployment-operations.md#deployment-operations). This section keeps the engineering rules.

### Environments

- **Isolation:** Keep local, staging and production isolated, with separate databases, gateway credentials, media buckets and secrets.
- **Staging payments:** Staging should use payment test mode.
- **Personal data:** Never copy production personal data into development casually.

### Deployment

- **Sequence:** Build immutable versioned artifacts, apply reviewed backward-compatible database migrations, deploy, run health checks, then shift traffic.
- **Rollback:** Maintain a rollback plan; schema changes may need expand/migrate/contract sequencing.

### Observability

- **Logs:** Structured logs with request/correlation IDs.
- **Metrics:** search latency, hold conflicts/expiry, booking conversion, payment outcomes and refund age.
- **Alerts:** database health, webhook failures, elevated errors and reconciliation backlog.
- **Redaction:** Redact personal and payment data (log redaction also stated in [backend.md#14-security-guidelines](backend.md#14-security-guidelines)).

### Reliability

- **Backups:** Scheduled encrypted backups and tested restore at a defined recovery point/time objective.
- **Reconciliation:** Payment event reconciliation against provider records.
- **Retries:** Durable retry for expiry cleanup and notifications; idempotent consumers.
- **Health endpoints:** A health endpoint for the process and a readiness endpoint for database/dependencies (also stated in [backend.md#core-rules](backend.md#core-rules)).
- **On-call:** Document the on-call owner and runbooks for payment outage, overbooking risk and data restore.

### Configuration

- **Env documentation:** Document environment variables in `.env.example` with no real secrets.
- **Pinning:** Pin runtime and dependencies.
- **Production infrastructure:** Use TLS and managed database/storage in production.
- **Compose caveat:** Do not treat a local Compose file as a production deployment plan.
