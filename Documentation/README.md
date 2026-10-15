# Staywise — Hotel Booking Platform Blueprint

This folder is the working product and engineering specification for **Staywise**, a hotel booking and operations platform. “Staywise” is a temporary project name; replace it when branding is decided.

## Start here

1. **New to these docs?** Read the [documentation report](./DOCUMENTATION-REPORT.md). It explains how the docs are organised, how AI agents use them, what is built today and what comes next.
2. Contributors and agents: read [../AGENT.md](../AGENT.md) and [../context.md](../context.md).
3. Follow the [reading and execution order](./EXECUTION-ORDER.md) for every work session.
4. Agree on [MVP scope](./01-product/03-mvp-scope.md) and [business rules](./01-product/12-business-rules.md).
5. Use [architecture](./02-architecture/04-architecture.md), [database design](./02-architecture/07-database-design.md) and the [API specification](./02-architecture/08-api-specification.md) as implementation contracts.
6. Deliver from the [development phases](./04-planning-and-tracking/18-development-phases.md) and the [task board](./04-planning-and-tracking/19-task-board.md), and consult the [module specification index](./modules/README.md).

## Folder layout

```
Documentation/
├── README.md                  ← this index
├── DOCUMENTATION-REPORT.md    ← how the docs and the agent work together; current status
├── EXECUTION-ORDER.md         ← per-session reading order and per-task procedure
├── 01-product/                ← WHAT we build and the rules it must obey
├── 02-architecture/           ← technical contracts (architecture, stack, DB, API)
├── 03-guidelines/             ← HOW to build (frontend, backend, security, UI, testing, devops)
├── 04-planning-and-tracking/  ← phases, task board, decision log, checklist
├── 05-sprints-and-progress/   ← sprint plans and completed work logs
├── 06-analysis/               ← business analyses of implemented modules
├── 07-guides/                 ← how-to guides (local setup, admin-web navigation)
├── modules/                   ← detailed spec per domain module
└── assets/                    ← UI reference images and draw.io file
```

The original file numbers (`00`–`27`) are kept, so references like "doc 08" still work.

## Document map

### Entry points (this folder)
| File | Purpose |
|---|---|
| `DOCUMENTATION-REPORT.md` | How agents use the docs, which docs are active, implementation status and the future path |
| `EXECUTION-ORDER.md` | Reading order before each session and the procedure for each task |

### `01-product/` — product definition
| File | Purpose |
|---|---|
| `00-project-context.md` | Vision, users, assumptions, success measures |
| `01-product-requirements.md` | Functional and non-functional requirements |
| `02-feature-roadmap.md` | Staged capability roadmap |
| `03-mvp-scope.md` | MVP boundaries and exit criteria |
| `12-business-rules.md` | Domain invariants: availability, pricing, holds, stay lifecycle |
| `17-ai-features.md` | Optional post-MVP AI ideas and guardrails |

### `02-architecture/` — technical contracts
| File | Purpose |
|---|---|
| `04-architecture.md` | System boundaries and booking sequence |
| `05-tech-stack.md` | Selected stack and supporting libraries |
| `06-project-structure.md` | Suggested repository layout (original proposal; see the report for drift) |
| `07-database-design.md` | Core entities, inventory and indexes |
| `08-api-specification.md` | API conventions and endpoint contracts |

### `03-guidelines/` — engineering and UI standards
| File | Purpose |
|---|---|
| `09-frontend-guidelines.md` | Frontend structure, Tailwind v4, component rules |
| `10-backend-guidelines.md` | Backend module and service standards |
| `11-auth-rbac.md` | Authentication and authorization overview (details in `modules/authentication.md` and `modules/rbac-permissions.md`) |
| `13-ui-ux-guidelines.md` | Guest and admin interaction principles |
| `14-security-guidelines.md` | Security controls and sensitive data handling |
| `15-testing-strategy.md` | Risk-based test plan |
| `16-devops.md` | Environments, deployment and operations |
| `21-ai-agent-rules.md` | **Superseded** by `../AGENT.md`; kept for history |
| `23-ui-generation-brief.md` | Page-by-page UI requirements and a generation prompt |

### `04-planning-and-tracking/` — delivery control
| File | Purpose |
|---|---|
| `18-development-phases.md` | Delivery sequence and milestones |
| `19-task-board.md` | Sprint task status (requires evidence) |
| `20-decision-log.md` | ADRs: decided, proposed and open |
| `22-module-wise-line-items-checklist.md` | One-line implementation checklist by module |

### `05-sprints-and-progress/` — plans and work logs
| File | Purpose |
|---|---|
| `24-sprint-2-availability-and-booking-plan.md` | Sprint 2 blueprint (holds, bookings, guest auth): **not yet implemented** |
| `25-admin-production-hardening-progress.md` | Admin security/performance hardening log (completed) |
| `fullstack-analysis-and-fix-plan.md` | Audit analysis and fix plan B1–B10 / F1–F12 (historical reasoning) |
| `26-fullstack-fix-plan-progress.md` | Completion log for that fix plan (21/22 done; B7 tests deferred) |

### `06-analysis/` — business analyses (2026-10-13)
| File | Purpose |
|---|---|
| `hotel-business-analysis.md` | Hotel module: traceability, gaps, edge cases, open questions |
| `room-types-business-analysis.md` | Room-type module analysis |
| `pricing-business-analysis.md` | Pricing / base-rate module analysis |

### `07-guides/` — how-to
| File | Purpose |
|---|---|
| `QUICKSTART.md` | Local setup and super-admin bootstrap |
| `27-admin-web-end-to-end-navigation-guide.md` | Admin web routes, RBAC matrix, user journeys, known problems |

### `modules/` — detailed module specs
See [`modules/README.md`](./modules/README.md). It covers authentication, RBAC, staff, guest accounts, hotels, room types, availability/booking, pricing/tax, search, booking lifecycle, payments/refunds, cancellation, reviews, notifications, media, reports, audit, deployment and the admin UI kit.

### Outside this folder
| Path | Purpose |
|---|---|
| `../AGENT.md` | Authoritative engineering rules for humans and AI agents |
| `../AGENTS.md`, `../GEMINI.md` | Short auto-loaded entry files (Claude Code / Codex, Gemini) that point to AGENT.md |
| `../context.md` | Agent context: product, invariants, phases and gates |
| `../apps/admin-web/docs/` | ui-architect project memory: `ui-decisions.md`, `components.md` |
| `../.agent/skills/ui-architect/` | The UI skill the agent uses for frontend work |

## Source of truth

When documents conflict, follow the order in [AGENT.md §3](../AGENT.md):
**latest product-owner instruction / approved ADR → AGENT.md + context.md → business rules (12) → MVP scope (03) → module specs → requirements, architecture, API, DB, phases, checklist → existing code.**

Update related documents when a decision changes. These documents describe a plan, not proof that implementation or production readiness has been achieved.
