# Deployment and Operations Module Specification

## Environment topology

Isolate local, test, staging, and production configuration, MongoDB clusters, credentials, payment accounts, email domains, and media buckets. MongoDB replica set is required wherever multi-document booking transactions run. Staging uses provider sandbox mode and synthetic guest data.

## Configuration and secrets

Validate required environment variables at boot. Keep database credentials, session keys, OAuth secrets, payment keys, webhook secrets, and storage credentials in a managed secrets store. Rotate secrets and define emergency revocation. `.env.example` contains names and safe placeholders only.

## Release process

Build versioned immutable API and web artifacts; run static checks and critical integration tests; deploy backward-compatible database/index changes; verify readiness and smoke booking flow; progressively route traffic; retain rollback artifacts. Use expand-migrate-contract for incompatible schema changes. Never run destructive index/data migrations without backup and reviewed plan.

## MongoDB operations

- Production replica set/managed cluster with authentication, TLS, network restrictions, least-privilege DB users, and monitored storage/connection limits.
- Define write concern/read concern appropriate to booking consistency; document failover and transaction retry behavior.
- Back up with encryption and point-in-time capability appropriate to RPO; regularly test restore.
- Monitor replica lag, transaction aborts, lock/conflict rates, slow queries, index usage, disk, and connection pool saturation.

## Observability and incident response

Structured logs with correlation IDs and redaction; metrics for search latency, hold conflicts/expiry lag, bookings, payment/refund outcomes, webhook age, and invariant violations. Alert on overbooking invariant violation, captured payment without booking, repeated webhook failures, backup failure, and database availability. Maintain runbooks for payment outage, late payment, inventory inconsistency, data restore, and security incident.

## Recovery objectives

Set and approve numeric RPO/RTO before launch. Define who can declare incident, who communicates with guests/properties, and how booking/payment reconciliation is performed after restore. A backup is not considered verified until restore and reconciliation have been rehearsed.

## Acceptance criteria

- Clean deployment and rollback rehearsals succeed in staging.
- MongoDB restore produces application-consistent bookings and inventory.
- Alert routes and on-call ownership are tested.
- Payment and inventory runbooks include reconciliation steps and escalation owner.
