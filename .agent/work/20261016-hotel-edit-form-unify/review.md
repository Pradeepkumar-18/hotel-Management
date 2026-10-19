# Review 20261016-hotel-edit-form-unify
Verdict: APPROVE

| Severity | File:line | Issue | Failure scenario | Owner |
|---|---|---|---|---|
| None | - | None | - | - |

## Checklist results
- [x] **Server authority:** No client-side price, tax, or status calculations.
- [x] **Authorization:** Uses existing permission-guarded routes and endpoints (`hotels.edit` and `hotels.create`).
- [x] **Inventory:** N/A (property metadata).
- [x] **Transactions:** Server-side transaction handling preserved.
- [x] **Money:** N/A (property metadata).
- [x] **State machines:** Unchanged; status transitions remain strictly on server.
- [x] **Validation:** Name min length 2, country code length 2, standard email format.
- [x] **Idempotency and optimistic versioning:** `version` passed to `PATCH /api/v1/admin/hotels/:id`; 409 conflict handled cleanly.
- [x] **No secrets or personal data:** Clean form field handling.
- [x] **Contract:** Matches `brief.md` API contract.
- [x] **Frontend:** Reused design primitives (`Button`, `Field`, `Input`, `Textarea`, `Alert`, `PageHeading`, `Status`), follows Rules of Hooks, clean component boundaries.
- [x] **Scope:** Frontend-dev edited only files within `apps/admin-web`.
