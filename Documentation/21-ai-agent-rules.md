# Contributor and AI Agent Rules

1. Read context, MVP scope, business rules and current task before changing code.
2. Do not expand MVP scope without updating requirements and decision log.
3. Do not claim inventory is reserved until the transactional hold succeeds.
4. Never trust client price, role, availability, booking ownership or payment success.
5. Keep payment, inventory and booking transitions idempotent and auditable.
6. Keep controllers thin and domain rules in backend services.
7. Do not put secrets or real guest/payment data in code, logs, fixtures or documentation.
8. Update API and data docs when contracts change; note migrations and rollout implications.
9. Do not mark tasks complete without stated acceptance evidence.
10. Do not introduce microservices, AI, queues, caches or channel integrations without a recorded need and decision.
11. Call out assumptions, unresolved tax/payment/legal questions and failure paths.
12. Changes to inventory or payments require review of concurrency, retry and compensation behavior.
