# Project Agent Rules — Staywise Hotel Platform

## Autonomy and Permission Boundaries
- **Proactive Execution:** Do NOT ask for permission for routine implementation actions. Proactively proceed with creating files, editing files, installing packages, executing builds, running dev servers, running verification scripts, and maintaining documentation and checklists.
- **Explicit Permission Required ONLY For:**
  1. **Deleting files or directories** — Always confirm with the user before performing any file/directory deletion.
  2. **Git Commit / Push** — Always ask for explicit user permission before committing changes (`git commit`) or pushing to remote repositories.

## Engineering Stack & Architectural Standards
- Follow `AGENT.md`, `context.md`, and module specifications in `Documentation/`.
- Technology baseline: NestJS REST API (`/api/v1`), TypeScript, MongoDB with Mongoose and replica-set multi-document transactions, React, Tailwind CSS.
- Server authority: Availability, pricing (in integer minor units), payment, and authorization must remain strictly server-side.
- State machines: Keep hold, booking, payment, and refund statuses strictly decoupled.
