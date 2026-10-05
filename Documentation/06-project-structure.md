# Suggested Project Structure

```text
hotel-platform/
  apps/
    api/                         # NestJS modular REST API
    guest-web/                   # Guest search and booking
    admin-web/                   # Operations console
  packages/
    contracts/                   # Shared API types/schemas where practical
    ui/                          # Shared visual primitives
  infra/                         # Compose, deployment templates, migrations ops
  docs/                          # This documentation set
```

API modules should group domain code rather than technical layers alone:

```text
apps/api/src/modules/availability/
  availability.module.ts
  availability.controller.ts
  availability.service.ts
  inventory.repository.ts
  dto/
  entities/
  policies/
```

Keep payment-provider code behind an adapter; keep controllers thin. Store migrations and seed data with the API. Separate public guest routes from admin routes and enforce authorization on the server. Frontends organize by feature (`search`, `hotel`, `checkout`, `bookings`, `hotels-admin`, `inventory-admin`) with shared layout/components kept small.

Do not share database entities directly with the browser. Share stable API contracts or generate clients from OpenAPI. Never put secrets or authorization decisions in frontend code.
