# Staywise — Hotel Booking Platform Blueprint

This folder is the working product and engineering specification for **Staywise**, a hotel booking and operations platform. “Staywise” is a temporary project name; replace it when branding is decided.

## Start here

1. Follow the [documentation reading and execution order](./EXECUTION-ORDER.md) for the recommended reading path and implementation sequence.
2. Contributors and agents: read [../AGENT.md](../AGENT.md) and [../context.md](../context.md).
3. Read [project context](./00-project-context.md) and [product requirements](./01-product-requirements.md).
4. Agree on [MVP scope](./03-mvp-scope.md) and [business rules](./12-business-rules.md).
5. Use [architecture](./04-architecture.md), [database design](./07-database-design.md), and [API specification](./08-api-specification.md) as implementation contracts.
6. Deliver from [development phases](./18-development-phases.md) and [task board](./19-task-board.md); consult the [module specification index](./modules/README.md).

## Document map

| File | Purpose |
|---|---|
| `00-project-context.md` | Product vision, users, assumptions, principles |
| `01-product-requirements.md` | Functional and non-functional requirements |
| `02-feature-roadmap.md` | Staged capability roadmap |
| `03-mvp-scope.md` | MVP boundaries and exit criteria |
| `04-architecture.md` | System boundaries and booking sequence |
| `05-tech-stack.md` | Selected implementation stack and supporting libraries |
| `06-project-structure.md` | Suggested repository layout |
| `07-database-design.md` | Core entities, inventory and indexes |
| `08-api-specification.md` | API conventions and initial endpoint contracts |
| `09-frontend-guidelines.md` | Frontend state, forms and accessibility |
| `10-backend-guidelines.md` | Backend module and service standards |
| `11-auth-rbac.md` | Authentication and authorization |
| `12-business-rules.md` | Availability, pricing, holds and stay lifecycle |
| `13-ui-ux-guidelines.md` | Guest and admin interaction principles |
| `14-security-guidelines.md` | Security controls and sensitive data handling |
| `15-testing-strategy.md` | Risk-based test plan |
| `16-devops.md` | Environments, deployment and operations |
| `17-ai-features.md` | Optional post-MVP AI ideas and guardrails |
| `18-development-phases.md` | Delivery sequence and milestones |
| `19-task-board.md` | Initial backlog and status tracking |
| `20-decision-log.md` | Assumptions and decisions to validate |
| `21-ai-agent-rules.md` | Contributor and AI-agent working rules |
| `22-module-wise-line-items-checklist.md` | Detailed one-line implementation checklist by hotel platform module |
| `23-ui-generation-brief.md` | Page-by-page UI requirements and copy-ready generation prompt |
| `EXECUTION-ORDER.md` | Recommended reading order and how to use the docs while delivering work |
| [`modules/README.md`](./modules/README.md) | Index and system-wide contracts for detailed module specifications |
| `modules/availability-booking.md` | Deep design for the critical booking module |
| `modules/admin-ui-kit.md` | Admin screen consistency guide |
| `QUICKSTART.md` | Local setup once implementation exists |

## Source of truth

When documents conflict, use this precedence: **approved decision log → business rules → MVP scope → product requirements → implementation notes**. Update related documents when a decision changes. These documents describe a plan, not proof that implementation or production readiness has been achieved.
