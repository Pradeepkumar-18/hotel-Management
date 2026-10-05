# Developer Quickstart

This guide becomes executable after the application repository and environment are created. The commands below are illustrative; replace them with the actual scripts when the stack is finalized.

## Prerequisites

- Supported Node.js LTS and package manager.
- Docker Desktop or access to a MongoDB development replica set.
- Payment-provider sandbox account only when Phase 2 begins.

## Setup outline

1. Clone the repository and install dependencies from the root (`npm install`).
2. Copy `.env.example` to a local environment file and set database URL, app origins and random development secrets.
3. Start MongoDB locally in replica-set mode or through the provided Compose configuration; transactions used by booking flows require replica-set mode.
4. Apply migrations and optional seed data.
5. Start the API with `npm run start:api` and the admin UI with `npm run start:admin` (Vite at `http://localhost:5173`). Add that origin to `CORS_ORIGINS`; `.env.example` includes it.
6. Open API docs and verify health/readiness. Sign in with a seeded non-production admin account if available.

For the initial local staff account, set `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (12–128 characters), and `MONGODB_URI` in the current shell, then run `npm.cmd --workspace=apps/api run seed:super-admin` once. This creates a super-admin with the catalog permissions. The seed command refuses to overwrite an existing account. Keep the credentials private and do not use this bootstrap path for production.

The current staff sign-in endpoints are `POST /api/v1/auth/staff/login`, `GET /api/v1/auth/me`, and `POST /api/v1/auth/logout` or `/logout-all`. Production sign-in remains disabled until MFA is implemented. Session and failed-login throttling are currently process-local; deploy behind shared rate limiting before operating multiple API instances.

The first admin UI scope covers hotel setup, room types, explicit cancellation terms, base rates, nightly inventory setup/calendar, and publication. Booking operations, staff management, reports, and guest pages await their APIs. Base rates are nightly amounts, not tax-inclusive stay quotes; guest checkout remains blocked on approved tax and cancellation behavior.

Build the applications with `npm run build:api` and `npm run build:admin`.

Never commit `.env` files or use production credentials locally. Before contributing, read [task board](./19-task-board.md), [business rules](./12-business-rules.md), and [AI agent rules](./21-ai-agent-rules.md).
