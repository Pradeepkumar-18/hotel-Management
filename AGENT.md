# AGENT.md — Hotel Platform Engineering Rules

This file defines required working rules for developers and AI agents contributing to the hotel booking platform described in this documentation folder. Read this file and [`context.md`](./context.md) before planning or changing project artifacts. If implementation source code is in a separate repository, copy/link these instructions into that repository's applicable agent instruction file so tools load them there.

## 1. Product goal

Build a dependable hotel booking and operations platform. The central promise is that guests see an understandable price and can book a room type that remains available for every night of the stay, while staff can safely manage hotels, room inventory, and bookings.

## 2. Approved technology baseline

- API: NestJS, TypeScript, REST under `/api/v1`, OpenAPI documentation.
- Database: MongoDB with Mongoose; run as a replica set wherever transactions are used.
- Web apps: React, TypeScript, Tailwind CSS.
- Booking correctness: MongoDB transactions plus unique indexes, conditional atomic updates, idempotency, and reconciliation.
- Do not reintroduce PostgreSQL, Prisma, TypeORM, Express-only architecture, or a different frontend/backend stack without an explicit approved decision.

## 3. Required reading and document authority

Before implementation, read [`context.md`](./context.md), [`README.md`](./README.md), [`03-mvp-scope.md`](./03-mvp-scope.md), [`12-business-rules.md`](./12-business-rules.md), [`20-decision-log.md`](./20-decision-log.md), and the relevant module specification in [`modules/README.md`](./modules/README.md).

When documents conflict, follow this order and then update the conflicting documents:

1. Explicit latest product-owner instruction or approved decision recorded in `20-decision-log.md`.
2. `AGENT.md` for engineering rules and `context.md` for current project context.
3. `12-business-rules.md` for domain invariants.
4. `03-mvp-scope.md` for release scope.
5. Relevant detailed file in `modules/` for module behavior.
6. `01-product-requirements.md`, architecture/API/database documents, phase plan, and checklist.
7. Existing implementation, which may be stale and must not silently override approved docs.

If a conflict affects data, money, access control, inventory, or API behavior, stop that dependent change, explain the conflict, and resolve it through an explicit decision before proceeding. Continue independent work where safe.

## 4. Non-negotiable domain and security rules

1. **Server authority:** never trust client-supplied availability, price, tax, refund amount, role, hotel scope, booking ownership, or payment success.
2. **No overbooking:** for every room type and local stay date, `held + confirmed + blocked <= total` must remain true under concurrency.
3. **Date semantics:** check-in is included and checkout is excluded; stay dates are interpreted in the property's IANA timezone; event timestamps are UTC.
4. **Atomic range claims:** claim all nights of a stay in a MongoDB transaction or claim none. Use conditional updates and bounded transient-transaction retries.
5. **MongoDB prerequisites:** transactions require replica-set topology; never claim transactional correctness on a standalone MongoDB server.
6. **Separate state machines:** booking, hold, payment, and refund statuses are distinct. Do not overload one status field to represent them all.
7. **Payment safety:** verify gateway signatures, deduplicate provider event IDs, use idempotency keys, and reconcile late/out-of-order results. No payment call occurs inside a database transaction.
8. **Money safety:** store integer minor units plus ISO currency; use server pricing and immutable booking-time price/tax/policy snapshots.
9. **Authentication:** follow `modules/authentication.md`: server-managed opaque sessions, secure HttpOnly cookies, separate guest/staff audiences, CSRF controls, session revocation, and hashed credentials/tokens.
10. **Authorization:** every protected endpoint checks actor status, permission, and resource/property scope on the server. Frontend guards are not security controls.
11. **Least privilege:** a hotel manager can access only explicitly assigned hotels and permitted actions; no ID-based scope bypass.
12. **Data minimization:** never log passwords, tokens, payment secrets/card data, or unnecessary guest personal information.
13. **Audit:** record sensitive staff, permission, hotel, inventory, pricing, booking, payment/refund, and export actions with actor, target, timestamp, outcome, and reason where required.
14. **Historical integrity:** later profile, rate, policy, or tax edits must not rewrite confirmed booking snapshots.

## 5. Implementation standards

- Keep a modular monolith. Each domain module owns its DTOs, controller, service, persistence boundary, policies, and tests as appropriate.
- Controllers handle HTTP, DTO validation, authentication metadata, and status mapping; domain services own business decisions; repositories own database access.
- Validate DTOs with allowlists, bounds, type checks, normalization, and cross-field validation. Revalidate all important conditions in the domain service.
- Use explicit state transition functions; do not permit arbitrary status patching.
- Use unique indexes for idempotency keys, normalized identities, hotel slugs, per-night inventory, booking references, and provider event IDs where applicable.
- Keep database transactions short. Persist durable state before reporting success. Use outbox/inbox patterns when reliable asynchronous work is required.
- Use optimistic versions or conditional updates for concurrent admin edits.
- Keep APIs versioned and update OpenAPI, API docs, DTOs, and consumers together.
- Use configuration for secrets and environment-specific values; never commit real secrets or production personal data.
- Build reusable React components with typed props, accessible labels, keyboard behavior, responsive states, and visible validation. Feature-specific rules belong in feature forms/services.
- Do not add microservices, AI, caching, queues, channel-manager integrations, or extra infrastructure without a measured need and a recorded decision.

## 6. Delivery and checklist rules

- Implement in the order in [`context.md`](./context.md) and [`18-development-phases.md`](./18-development-phases.md); respect dependency gates.
- Use [`22-module-wise-line-items-checklist.md`](./22-module-wise-line-items-checklist.md) as a tracking index, not as proof that a feature is done.
- Mark `[x]` only when the item is implemented, acceptance criteria pass, failure paths are handled, and relevant verification evidence exists. Never infer completion from a plan or code stub.
- Keep each checklist item on one line. If scope changes, update the checklist and the corresponding requirements/module doc.
- Update impacted schemas/indexes, APIs, module specs, security rules, task board, and decision log in the same change.
- Do not add or run tests unless requested by the user or the governing task instructions require them. When verification is requested, prioritize real MongoDB replica-set integration for transaction/concurrency guarantees.
- Do not claim deployment, production readiness, compliance, tax correctness, or successful external payment without evidence.

## 7. Decisions requiring explicit resolution

Do not invent production behavior for open decisions recorded in `20-decision-log.md`, especially launch country, GST/tax calculation and presentation, payment provider/merchant eligibility, cancellation policy defaults, retention requirements, and operational RPO/RTO. Use a safe documented development default only for local scaffolding; keep production behavior disabled until approved.

## 8. Autonomy and Permission Rules

- Do not ask for user permission for standard development actions (e.g., reading files, creating or editing files, installing packages, running builds, or executing non-destructive commands). Proactively proceed with implementation.
- Ask for explicit user permission ONLY before:
  1. Deleting any files or directories.
  2. Executing `git commit` or pushing commits.

## 9. Completion report

At the end of implementation work, report: files/modules changed, observable behavior delivered, verification performed and results, checklist lines changed, remaining decisions/blockers, and operational/security implications. Be precise about what was not verified.
