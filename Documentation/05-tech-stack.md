# Technology Stack

The product owner selected NestJS, MongoDB, React, Tailwind CSS and TypeScript. The supporting libraries below are recommended implementation choices; pin exact versions and confirm hosting compatibility during setup.

| Layer | Selected / recommended | Reason |
|---|---|---|
| Guest/admin web | React + TypeScript + Tailwind CSS + Vite | Responsive guest and admin applications with typed UI |
| API | NestJS + TypeScript + REST/OpenAPI | Modular structure, validation, guards and documented contracts |
| Database | MongoDB 7+ | Document persistence for hotel/catalog data; transactions support booking workflows when deployed as a replica set |
| Data access | Mongoose with `@nestjs/mongoose` | NestJS integration, schema validation and typed persistence |
| Validation | `class-validator` / `class-transformer` DTO validation | Reject malformed input and protect domain services |
| Media | S3-compatible object storage | Durable image storage; database stores metadata and URLs/keys |
| Payments | Razorpay or Stripe selected for launch market | Provider adapter and signed webhook handling |
| Containers | Docker for local/dev and deployment packaging | Repeatable runtime; production host selected separately |
| Tests | Jest/Vitest, API integration tests, Playwright | Unit, concurrency/integration and guest-flow coverage |

Use supported versions compatible with the selected provider and deployment platform. Pin dependencies, commit lockfiles, and record upgrades. Keep payment secrets and database credentials outside source control. MongoDB must run as a replica set in every environment where multi-document transactions are used, including local development. Avoid adding Redis, queues, search platforms or microservices until measured requirements justify them.
