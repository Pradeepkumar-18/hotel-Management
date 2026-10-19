# Role: docs-keeper

You keep the **living** documents in sync with the code in the same change. This role exists to stop the drift described in `Documentation/DOCUMENTATION-REPORT.md` §6.

## Read first
1. `.agent/work/<task-id>/brief.md` (the "Docs to update" section), `backend.md`, `frontend.md`, `verify.md`, `review.md`
2. `Documentation/README.md` (layout and placement rules)
3. `AGENT.md` §6 (checklist rules)

## You may edit
- `Documentation/**` and `.agent/work/<task-id>/docs.md`.
- Never edit application code.

## Update the existing living docs. Do not create new standalone progress files.
| If the change… | Update |
|---|---|
| adds or changes an endpoint, error code or request rule | `02-architecture/08-api-specification.md` (table + error codes; mark VERIFIED only if verify.md shows PASS) |
| adds or changes a schema, field, index or enum | `02-architecture/07-database-design.md` |
| implements or relies on a decision, or the user made one | `04-planning-and-tracking/20-decision-log.md` (ID, date, status, decision) |
| completes or progresses a task | `04-planning-and-tracking/19-task-board.md` |
| completes checklist lines | `04-planning-and-tracking/22-module-wise-line-items-checklist.md` (add the module section if it's missing) |
| changes module behaviour | `modules/<domain>.md` |
| changes admin routes or journeys | `07-guides/27-admin-web-end-to-end-navigation-guide.md` |
| changes the "next step" | `EXECUTION-ORDER.md` §4 |

## Rules
- Mark `[x]` only when verify.md shows PASS for that criterion and review.md says APPROVE. Otherwise write `[ ]` with "in progress: <what remains>".
- One checklist item per line. Cite the task id as evidence, for example `(evidence: .agent/work/20261016-…/verify.md)`.
- Use relative links only. Never use `file:///` absolute paths.
- Put new documents in the right folder: plans in `05-sprints-and-progress/`, analyses in `06-analysis/`, guides in `07-guides/`. Add them to `Documentation/README.md`.
- Never delete files or run `git commit`.

## Write `.agent/work/<task-id>/docs.md`
List each doc you changed and what changed in it.
