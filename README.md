# Staywise — Enterprise Hotel Booking & Operations Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Replica_Set-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: UNLICENSED](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

> **Staywise** is a high-reliability, concurrency-safe hotel booking engine and property operations platform. Built as a TypeScript modular monolith, it enforces strict server-side authority, zero-overbooking invariants across multi-night stays, and end-to-end auditability.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Core Invariants & Domain Rules](#core-invariants--domain-rules)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Environment Setup](#installation--environment-setup)
  - [Database Initialization (Replica Set)](#database-initialization-replica-set)
  - [Bootstrapping Super Admin](#bootstrapping-super-admin)
  - [Running the Applications](#running-the-applications)
- [Available Scripts](#available-scripts)
- [API & Documentation](#api--documentation)
- [Environment Variables](#environment-variables)
- [Documentation Index](#documentation-index)
- [Security & Compliance](#security--compliance)
- [License](#license)

---

## Overview

The primary engineering challenge of any hotel booking engine is **guaranteeing room availability across consecutive dates under high concurrency**. Staywise resolves this through MongoDB multi-document ACID transactions, discrete per-night inventory records, and atomic range-locking.

### Key Capabilities

- **Guest Reservation Engine:**
  - Fast, indicative live hotel and room-type search.
  - Multi-night atomic inventory hold acquisition (10-minute hold window).
  - Explicit rate resolution snapshotting base price, tax, and cancellation terms.
  - Decoupled state machines for Holds, Bookings, Payments, and Refunds.
- **Operations & Management Console:**
  - Multi-property management (hotel profiles, star ratings, amenities, policies, media).
  - Room type configuration (occupancy limits, bed arrangements, amenities).
  - Nightly inventory grid with bulk updates, stop-sells, and maintenance blocks.
  - Base rate schedules in integer minor units with local property currency support.
- **Enterprise Access & Governance:**
  - Role-Based Access Control (RBAC) with hotel/property scoping.
  - Server-managed opaque HttpOnly session cookies with CSRF defense.
  - Structured audit trail for sensitive administrative and financial actions.

---

## System Architecture

Staywise is structured as a **modular monolith** with clear domain boundaries, shared type contracts, and separated client applications.

```
                              ┌────────────────────────────────────────┐
                              │            Clients / UIs               │
                              ├────────────────────┬───────────────────┤
                              │   Admin Web App    │    Guest Site     │
                              │ (React 19 + Vite)  │   (Next/React)    │
                              └─────────┬──────────┴─────────┬─────────┘
                                        │                    │
                               HttpOnly Session      HttpOnly Session
                               + Anti-CSRF Token     + Anti-CSRF Token
                                        │                    │
                                        ▼                    ▼
                              ┌────────────────────────────────────────┐
                              │        NestJS REST API (/api/v1)       │
                              ├────────────────────────────────────────┤
                              │ ├─ Health & Observability              │
                              │ ├─ Auth & RBAC (Opaque Sessions)       │
                              │ ├─ Audit Logging Engine                │
                              │ ├─ Hotels & Room Types Catalog         │
                              │ ├─ Inventory & Atomic Hold Engine      │
                              │ └─ Pricing & Rate Resolution           │
                              └───────────────────┬────────────────────┘
                                                  │
                                     ACID Multi-Document
                                         Transactions
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │     MongoDB 7.0+ (Replica Set: rs0)   │
                              ├────────────────────────────────────────┤
                              │ • hotels         • room_types          │
                              │ • inventories    • holds               │
                              │ • bookings       • audit_logs          │
                              │ • users / staff  • sessions            │
                              └────────────────────────────────────────┘
```

---

## Repository Structure

The workspace is organized as an `npm` monorepo:

```
staywise-platform/
├── apps/
│   ├── api/                      # Backend REST API (NestJS 11, Mongoose, Swagger)
│   │   ├── src/
│   │   │   ├── common/           # Database modules, session guards, filters, interceptors
│   │   │   ├── config/           # Type-safe environment validation
│   │   │   ├── modules/
│   │   │   │   ├── audit/        # Structured administrative audit logging
│   │   │   │   ├── auth/         # Session authentication, RBAC, bootstrap seeding
│   │   │   │   ├── health/       # Liveness/readiness probes & system diagnostics
│   │   │   │   ├── hotels/       # Property catalog, amenities, and policies
│   │   │   │   ├── inventory/    # Nightly inventory, atomic claims, hold expiry
│   │   │   │   └── pricing/      # Rate plans, currency formatting, quotes
│   │   │   ├── main.ts           # API entry point, Helmet, CORS, Swagger setup
│   │   │   └── verify-foundation.ts # Replica-set transaction verification script
│   │   └── package.json
│   └── admin-web/                # Operations Dashboard (React 19, Vite, Tailwind CSS)
│       ├── src/
│       │   ├── api.ts            # Typed client API wrapper with CSRF interceptors
│       │   ├── App.tsx           # Router, state management, and view components
│       │   ├── styles.css        # Modern design system & token definitions
│       │   └── main.tsx          # Client bootstrap
│       └── package.json
├── packages/
│   └── contracts/                # Shared TypeScript contracts, DTOs, and enums
│       ├── src/
│       └── package.json
├── Documentation/                # Architectural Decision Records (ADRs) & Specs
│   ├── 00-project-context.md     # Vision, stakeholders, and success criteria
│   ├── 04-architecture.md        # Deep architectural design and data flow
│   ├── 07-database-design.md     # Schema designs, collections, indexes
│   ├── 08-api-specification.md   # Endpoint contracts & error envelope format
│   ├── 12-business-rules.md      # Domain invariants and calculation rules
│   ├── EXECUTION-ORDER.md        # Implementation order and dependency gates
│   └── modules/                  # Specialized module specifications
├── .env.example                  # Environment configuration template
├── AGENT.md                      # Mandatory engineering standards and constraints
├── context.md                    # Core system context & operational phases
├── package.json                  # Root monorepo workspace configuration
└── README.md                     # Repository documentation
```

---

## Core Invariants & Domain Rules

Staywise strictly enforces the following non-negotiable engineering principles:

1. **Zero-Overbooking Invariant:**
   For every room type and local property stay date:
   $$\text{held} + \text{confirmed} + \text{blocked} \le \text{total}$$
2. **Date Range Semantics:**
   Stays are evaluated as half-open intervals: `[checkIn, checkOut)` in the property's local IANA timezone. The checkout date is never an occupied night.
3. **Atomic Multi-Night Claims:**
   Hold acquisition claims inventory for *all* nights within a single MongoDB replica-set transaction. If any night lacks inventory, the entire transaction aborts.
4. **All Financial Figures in Integer Minor Units:**
   Prices, taxes, fees, and discounts are stored and calculated strictly as integers (e.g., $100.50 \rightarrow 10050$ cents/paisa) alongside an explicit ISO-4217 currency code. Floating-point currency math is prohibited.
5. **Decoupled State Machines:**
   Hold, Booking, Payment, and Refund statuses maintain independent lifecycles. Payment status never directly writes booking confirmation without transactional inventory validation.
6. **Immutable Booking Snapshots:**
   Confirmed reservations store a point-in-time snapshot of the rate, guest details, applied taxes, and cancellation terms. Future catalog updates will not alter historical booking records.
7. **Strict Server-Side Authority:**
   All authorization, pricing, availability checks, and property scopes are validated exclusively by backend services. Client-side UI state is never trusted.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Runtime** | [Node.js](https://nodejs.org/) (LTS >= 20), [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Backend Framework** | [NestJS 11](https://nestjs.com/), [Express](https://expressjs.com/), [Swagger / OpenAPI](https://swagger.io/) |
| **Database & ODM** | [MongoDB 7.0+](https://www.mongodb.com/) (Replica Set Topology), [Mongoose 8](https://mongoosejs.com/) |
| **Security & Auth** | [Helmet](https://helmetjs.github.io/), `cookie-parser`, `bcryptjs`, HttpOnly opaque sessions, CSRF cookies |
| **Admin Frontend** | [React 19](https://react.dev/), [Vite 6](https://vitejs.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Testing & Tooling** | [Jest 30](https://jestjs.io/), [ts-node](https://typestrong.org/ts-node/), `mongodb-memory-server` |

---

## Getting Started

### Prerequisites

- **Node.js** (v20.x LTS or higher)
- **npm** (v10.x or higher)
- **MongoDB** running with **Replica Set topology** enabled (transactions fail on standalone instances)

---

### Installation & Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "Hotel Management Testing"
   ```

2. **Install all workspace dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure appropriate development credentials (see [Environment Variables](#environment-variables)).

---

### Database Initialization (Replica Set)

Staywise requires a MongoDB replica set for multi-document ACID transactions.

**Option A — Using an existing local MongoDB daemon:**
Ensure MongoDB was started with `--replSet rs0`. In `mongosh`:
```javascript
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "127.0.0.1:27017" }]
})
```

**Option B — Run the foundation verification script:**
The project includes a built-in verification script using `mongodb-memory-server` to validate replica set transactions:
```bash
npm --workspace=apps/api run verify:foundation
```

---

### Bootstrapping Super Admin

To create the initial administrator account, set the environment variables and run the seed script:

```bash
# Windows (PowerShell)
$env:BOOTSTRAP_ADMIN_EMAIL="admin@staywise.local"
$env:BOOTSTRAP_ADMIN_PASSWORD="YourSecurePassword123!"
npm --workspace=apps/api run seed:super-admin

# Linux / macOS
BOOTSTRAP_ADMIN_EMAIL="admin@staywise.local" \
BOOTSTRAP_ADMIN_PASSWORD="YourSecurePassword123!" \
npm --workspace=apps/api run seed:super-admin
```

> [!NOTE]
> The bootstrap script will refuse to overwrite an existing account with the same email.

---

### Running the Applications

#### 1. Start the API Service
```bash
npm run start:api
```
- API Base URL: `http://localhost:3000/api/v1`
- Interactive OpenAPI / Swagger Docs: `http://localhost:3000/api/docs`
- Health Endpoint: `http://localhost:3000/api/v1/health`

#### 2. Start the Admin Web Console
In a separate terminal:
```bash
npm run start:admin
```
- Admin Console: `http://localhost:5173`

Sign in with your bootstrapped administrator credentials to manage hotels, room types, rates, and nightly availability.

---

## Available Scripts

All primary tasks can be executed from the root workspace:

| Script | Command | Purpose |
|---|---|---|
| `start:api` | `npm run start:api` | Starts the NestJS API in watch / dev mode |
| `start:admin` | `npm run start:admin` | Starts the Admin Web Vite development server |
| `build:api` | `npm run build:api` | Compiles the NestJS API to `apps/api/dist` |
| `build:admin` | `npm run build:admin` | Type-checks and bundles the React Admin app |
| `test:api` | `npm run test:api` | Runs API unit tests with Jest |
| `verify:foundation` | `npm --workspace=apps/api run verify:foundation` | Tests MongoDB replica set multi-document ACID transactions |
| `seed:super-admin` | `npm --workspace=apps/api run seed:super-admin` | Creates initial administrative user |

---

## API & Documentation

The API adheres to RESTful conventions versioned under `/api/v1`.

### Interactive Swagger UI
When the API is running, access Swagger documentation at:
```
http://localhost:3000/api/docs
```

### Core API Modules
- **`GET /api/v1/health`** — Liveness, readiness, and MongoDB replica set status.
- **`POST /api/v1/auth/staff/login`** — Staff authentication with secure cookie emission.
- **`GET /api/v1/auth/me`** — Inspect authenticated user profile, roles, and permissions.
- **`POST /api/v1/auth/logout`** — Invalidate current session and clear cookie state.
- **`GET /api/v1/hotels`** — Paginated list of hotels with filter parameters.
- **`POST /api/v1/hotels`** — Create new property profile (requires `hotels.create`).
- **`GET /api/v1/hotels/:hotelId/room-types`** — Room types configured for a hotel.
- **`GET /api/v1/hotels/:hotelId/inventory`** — Nightly room availability and status calendar.
- **`POST /api/v1/hotels/:hotelId/inventory/bulk`** — Bulk inventory adjustments and date initialization.
- **`GET /api/v1/hotels/:hotelId/rates`** — Base rate plan schedules.

### Standard Response Envelope
All non-error responses follow a standardized payload structure:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-07T09:00:00.000Z"
  }
}
```

---

## Environment Variables

Configure these settings in your `.env` file:

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `3000` | Port for the NestJS API server |
| `NODE_ENV` | `development` | Node environment (`development`, `production`, `test`) |
| `API_PREFIX` | `/api/v1` | Global route prefix for REST endpoints |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated list of allowed origins |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/staywise_dev?replicaSet=rs0` | Connection string targeting a replica set |
| `SESSION_SECRET` | `dev-secret-...` | High-entropy string used for cookie signature |
| `STAFF_SESSION_COOKIE_NAME` | `staywise_staff_sid` | Cookie name for staff sessions |
| `STAFF_CSRF_COOKIE_NAME` | `staywise_staff_csrf` | Cookie name for staff CSRF verification |
| `GUEST_SESSION_COOKIE_NAME` | `staywise_guest_sid` | Cookie name for guest sessions |
| `STAFF_SESSION_MAX_AGE_SECONDS` | `43200` | Maximum lifetime for staff session (12 hours) |
| `STAFF_SESSION_IDLE_SECONDS` | `1800` | Idle timeout for staff session (30 minutes) |
| `DEFAULT_CURRENCY` | `INR` | Default ISO-4217 currency code |
| `DEFAULT_TIMEZONE` | `Asia/Kolkata` | Default IANA timezone for stay midnight boundaries |
| `HOLD_EXPIRY_MINUTES` | `10` | TTL duration for provisional multi-night inventory holds |
| `PAYMENT_PROVIDER` | `offline` | Active payment provider adapter (`offline`, `stripe`, etc.) |

---

## Documentation Index

The [`Documentation/`](./Documentation/) folder houses the comprehensive architectural, business, and operational blueprints:

- **[Execution Order](./Documentation/EXECUTION-ORDER.md)** — Recommended reading order and phased delivery milestones.
- **[Engineering Rules (`AGENT.md`)](./AGENT.md)** — Mandatory standards for human engineers and AI agents.
- **[System Context (`context.md`)](./context.md)** — Core domain problem statement and architecture map.
- **[Product Requirements](./Documentation/01-product-requirements.md)** — Functional specifications for guests and administrators.
- **[Architecture Blueprint](./Documentation/04-architecture.md)** — Service topology, boundaries, and booking sequences.
- **[Database Design](./Documentation/07-database-design.md)** — Data model, indexing strategies, and inventory schema.
- **[API Specification](./Documentation/08-api-specification.md)** — Error codes, headers, and request envelopes.
- **[Business Rules](./Documentation/12-business-rules.md)** — Formal availability equations, rate calculations, and stay rules.
- **[Security Guidelines](./Documentation/14-security-guidelines.md)** — Threat models, data minimization, and session policies.
- **[Module Specifications](./Documentation/modules/README.md)** — Deep designs for Inventory, Auth, Pricing, Bookings, and UI Kit.

---

## Security & Compliance

- **Opaque Session Tokens:** No sensitive claims or user IDs are stored client-side. Sessions map to database records with server-enforced idle timeouts.
- **Double Submit CSRF:** All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require a matching `x-csrf-token` header synchronized with the CSRF cookie.
- **Least Privilege Access:** Staff access is verified per-hotel. A manager assigned to Property A cannot read or modify resources belonging to Property B.
- **Audit Trails:** Sensitive changes to catalogs, pricing, holds, and bookings are logged immutably with actor, timestamp, and context.
- **Zero Cardholder Data:** Credit card and payment instruments are never received, processed, or persisted on application servers.

---

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited. See [package.json](./package.json) for details.
