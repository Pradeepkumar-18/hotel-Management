# Deployment and Operations

<a id="deployment-operations"></a>
## Deployment and Operations Module Specification

- **Implementation rules:** DevOps coding and pipeline rules live in [../guidelines/testing-devops.md](../guidelines/testing-devops.md); this file states what the module must do.

### Environment topology

- **Isolation:** isolate local, test, staging, and production configuration, MongoDB clusters, credentials, payment accounts, email domains, and media buckets.
- **Replica set:** a MongoDB replica set is required wherever multi-document booking transactions run.
- **Staging data:** staging uses provider sandbox mode and synthetic guest data.

### Configuration and secrets

- **Boot validation:** validate required environment variables at boot.
- **Secrets store:** keep database credentials, session keys, OAuth secrets, payment keys, webhook secrets, and storage credentials in a managed secrets store.
- **Rotation:** rotate secrets and define emergency revocation.
- **Example file:** `.env.example` contains names and safe placeholders only.

### Release process

- **Release steps:**
  - build versioned immutable API and web artifacts;
  - run static checks and critical integration tests;
  - deploy backward-compatible database/index changes;
  - verify readiness and smoke booking flow;
  - progressively route traffic;
  - retain rollback artifacts.
- **Incompatible schema changes:** use expand-migrate-contract.
- **Destructive migrations:** never run destructive index/data migrations without backup and a reviewed plan.

### MongoDB operations

- **Production cluster:** production replica set/managed cluster with authentication, TLS, network restrictions, least-privilege DB users, and monitored storage/connection limits.
- **Consistency settings:** define write concern/read concern appropriate to booking consistency; document failover and transaction retry behavior.
- **Backups:** back up with encryption and point-in-time capability appropriate to RPO; regularly test restore.
- **Monitoring:** monitor replica lag, transaction aborts, lock/conflict rates, slow queries, index usage, disk, and connection pool saturation.

### Observability and incident response

- **Logs:** structured logs with correlation IDs and redaction.
- **Metrics:** search latency, hold conflicts/expiry lag, bookings, payment/refund outcomes, webhook age, and invariant violations.
- **Alerts:** alert on overbooking invariant violation, captured payment without booking, repeated webhook failures, backup failure, and database availability.
- **Runbooks:** maintain runbooks for payment outage, late payment, inventory inconsistency, data restore, and security incident.

### Recovery objectives

- **Numeric targets:** set and approve numeric RPO/RTO before launch.
- **Roles in an incident:** define who can declare an incident, who communicates with guests/properties, and how booking/payment reconciliation is performed after restore.
- **Verified backups:** a backup is not considered verified until restore and reconciliation have been rehearsed.

### Acceptance criteria

- **Rehearsals:** clean deployment and rollback rehearsals succeed in staging.
- **Restore consistency:** MongoDB restore produces application-consistent bookings and inventory.
- **On-call:** alert routes and on-call ownership are tested.
- **Runbook content:** payment and inventory runbooks include reconciliation steps and an escalation owner.
