---
description: Run the full Staywise implementation pipeline (plan → backend/frontend → verify → review → docs) for one task, using the role files in .agent/roles/.
---

# /implement-task

Run this for any feature or behaviour change. The input is the task description, for example `/implement-task room-type edit and disable UI`.

You are the **orchestrator**. Don't write application code yourself. Run each stage by reading its role file and acting **strictly** as that role. Each stage starts by reading its inputs from `.agent/work/<task-id>/` and ends by writing its own output file there. If you're using the Agent Manager, you may instead start a separate agent per stage with the prompt shown under that stage.

## Stage 1: Plan
1. Act as `.agent/roles/task-planner.md`.
2. Output: `.agent/work/<task-id>/brief.md`.
3. If the planner hit a **stop condition** (open ADR, scope or conflict), stop the workflow. Show the user the options and wait for a decision.
4. Show the user a 5-line summary of the brief (goal, API contract, parallel safe?) and ask them to confirm before continuing.

> Agent Manager prompt: "Act as .agent/roles/task-planner.md for task: <description>."

## Stage 2: Implement
- If the brief has **Backend work**: act as `.agent/roles/backend-dev.md`. Output: `backend.md`.
- If the brief has **Frontend work**: act as `.agent/roles/frontend-dev.md`. Output: `frontend.md`.
- Order:
  - If the brief says **Parallel safe: yes**, you may start backend-dev and frontend-dev as two agents at the same time in the Agent Manager.
  - Otherwise run backend first, then frontend.
- If either role reports that the API contract must change, go back to Stage 1 to update the brief. Don't let a dev role change it alone.

> Agent Manager prompts: "Act as .agent/roles/backend-dev.md for .agent/work/<task-id>/brief.md." and "Act as .agent/roles/frontend-dev.md for .agent/work/<task-id>/brief.md."

## Stage 3: Verify
1. Act as `.agent/roles/verifier.md`. Output: `verify.md`.
2. If the overall result is **FAIL**, send each failure back to its owner role (Stage 2) with the exact error, then verify again. Allow at most **2 fix loops**; after that, stop and report to the user.

## Stage 4: Review
1. Act as `.agent/roles/domain-reviewer.md`. Output: `review.md`.
2. If the verdict is **CHANGES REQUIRED** with any blocker or major issue, send it to the owner role, then re-run Stage 3 and Stage 4. Allow at most **2 loops**.

## Stage 5: Docs
Act as `.agent/roles/docs-keeper.md`. Output: `docs.md`. **This stage is mandatory.** Never skip it, even for small changes.

## Stage 6: Completion report (orchestrator)
Report to the user, following AGENT.md §9:
- Files and modules changed (from backend.md and frontend.md)
- Behaviour delivered
- Verification results, with PASS / FAIL / NOT RUN per criterion (from verify.md)
- Review verdict and any minor issues still open
- Docs and checklist lines changed (from docs.md)
- Remaining decisions or blockers, and what was **not** verified

Then ask: "Commit these changes?" Don't commit or push without an explicit yes, and don't delete any file without confirmation.
