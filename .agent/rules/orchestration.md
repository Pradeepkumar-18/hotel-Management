---
trigger: always_on
description: Staywise multi-agent orchestration rules
---

# Orchestration rules (always on)

- For any **feature or behaviour change**, run the `/implement-task` workflow (`.agent/workflows/implement-task.md`). For a small, contained bug fix, run `/quick-fix`. Only questions, explanations and pure documentation edits may skip both.
- Act as the role files in `.agent/roles/` exactly. Each role edits only the paths it is allowed to:

  | Role | May edit |
  |---|---|
  | task-planner | `brief.md` only |
  | backend-dev | `apps/api`, `packages/contracts` |
  | frontend-dev | `apps/admin-web` |
  | verifier / domain-reviewer | their report file only |
  | docs-keeper | `Documentation/` |

- Agents hand off only through files in `.agent/work/<task-id>/`: `brief.md`, `backend.md`, `frontend.md`, `verify.md`, `review.md`, `docs.md`.
- The API contract in `brief.md` is fixed. Only the planner may change it.
- Never skip the docs-keeper stage. Update the existing living docs (API.md, DATA_MODEL.md, ARCHITECTURE.md decision log, TASKS.md, MVP.md, modules/<domain>.md); don't create new standalone progress files.
- Stop and ask the user when a task depends on an open or proposed ADR that affects money, tax, inventory, access, retention or the API.
- Permissions are unchanged from `AGENTS.md` / `GEMINI.md`: ask before deleting any file or directory, and before any `git commit` or push.
