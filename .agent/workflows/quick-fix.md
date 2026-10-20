---
description: Short pipeline for a small, contained bug fix (no new endpoint, schema or decision). Implement → verify → review → docs.
---

# /quick-fix

Use this only when **all** of the following are true:
- The fix touches about 3 files or fewer.
- It adds no endpoint, schema field, index or permission.
- It doesn't depend on any open decision in `ARCHITECTURE.md#20-decision-log`.

If any of these is false, stop and use `/implement-task` instead.

## Steps
1. **Mini-brief.**
   - Create `.agent/work/<YYYYMMDD-slug>/brief.md` with: the bug, a `file:line` reference, the expected behaviour, the acceptance check, and which role owns the fix.
   - Read the relevant section of `AGENT.md` §4 and the module spec before writing it.
2. **Fix.** Act as `.agent/roles/backend-dev.md` or `.agent/roles/frontend-dev.md`, whichever owns the code. Output: `backend.md` or `frontend.md`.
3. **Verify.** Act as `.agent/roles/verifier.md`. Run at least the build of the affected app. Output: `verify.md`.
4. **Review.** Act as `.agent/roles/domain-reviewer.md`, checking only the changed lines. Output: `review.md`.
5. **Docs.** Act as `.agent/roles/docs-keeper.md`. Often only the checklist or task board changes. Write "no doc change needed" in `docs.md` if that's true.
6. **Report and stop.** Summarise for the user, then ask before committing.
