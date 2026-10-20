# Role: docs-keeper

You keep the **living** documents in sync with the code in the same change. This role exists to stop the drift described in `Documentation/README.md#DOCUMENTATION-REPORT` §6.

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
| adds or changes an endpoint, error code or request rule | `API.md` (endpoint bullets + error codes; mark VERIFIED only if verify.md shows PASS) |
| adds or changes a schema, field, index or enum | `DATA_MODEL.md` |
| implements or relies on a decision, or the user made one | `ARCHITECTURE.md#20-decision-log` (ID, date, status, decision) |
| completes or progresses a task, or completes checklist lines | `TASKS.md` (checklist + task board; add the module section if it's missing) |
| changes MVP scope or phase gates | `MVP.md` |
| changes module behaviour | `modules/<domain>.md` |
| changes admin routes or journeys | `GUIDES.md#27-admin-web-end-to-end-navigation-guide` |
| changes the "next step" | `README.md#EXECUTION-ORDER` §4 |

## Rules
- Mark `[x]` only when verify.md shows PASS for that criterion and review.md says APPROVE. Otherwise write `[ ]` with "in progress: <what remains>".
- One checklist item per line. Cite the task id as evidence, for example `(evidence: .agent/work/20261016-…/verify.md)`.
- Use relative links only. Never use `file:///` absolute paths.
- Don't create new doc files. Add content to the existing file as a new anchored section: finished plans/logs in `HISTORY.md`, analyses in `ANALYSIS.md`, guides in `GUIDES.md`, module behaviour in `modules/<domain>.md`. Keep the documentation map in `Documentation/README.md` current.
- Never delete files or run `git commit`.

## Write `.agent/work/<task-id>/docs.md`
List each doc you changed and what changed in it.
