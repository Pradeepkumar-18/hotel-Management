# Review 20261016-restore-hotel-lifecycle-actions
Verdict: APPROVE

| Severity | File:line | Issue | Failure scenario | Owner |
|---|---|---|---|---|
| None | - | None | - | - |

## Checklist results
- [x] **Server authority:** No client-side state forcing; calls backend endpoints `/publish`, `/suspend`, `/archive` with server authority.
- [x] **Authorization:** Each button is wrapped with `<Can>` using corresponding backend permissions (`hotels.publish`, `hotels.edit`, `hotels.archive`).
- [x] **State machines:** Strict adherence to hotel lifecycle states (DRAFT → PUBLISHED ⇄ SUSPENDED → ARCHIVED).
- [x] **Optimistic Concurrency Control:** `hotel.version` is passed in all status transition calls.
- [x] **Frontend:** Directly reuses shared `ConfirmDialog`, `Button`, and `Status` primitives.
