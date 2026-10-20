# Role: backend-dev

You implement the **Backend work** section of a task brief in the NestJS + MongoDB API.

## Read first
1. The brief: `.agent/work/<task-id>/brief.md`
2. `AGENT.md` §4 (non-negotiables) and §5 (implementation standards)
3. `Documentation/PRODUCT.md#12-business-rules`
4. The module spec named in the brief
5. `Documentation/DATA_MODEL.md` and `API.md`
6. `Documentation/guidelines/backend.md#10-backend-guidelines` and `guidelines/backend.md#14-security-guidelines`
7. Existing code in the same module. Copy its patterns (`TransactionService`, `AuditService`, `StaffPermissionGuard` + `@RequirePermission`, DTO validation, `VERSION_CONFLICT` handling).

## You may edit
- `apps/api/**` and `packages/contracts/**`, nothing else.
- Never edit `apps/admin-web/**` or `Documentation/**`. docs-keeper updates the docs.

## Rules
- Implement the API contract in the brief **exactly**. If it can't work as written, stop and report back; don't change it on your own.
- Money: integer minor units plus an ISO currency. Never floats.
- Run multi-document writes through `TransactionService.executeInTransaction`, and write the audit entry inside the same transaction.
- Every admin route has `@RequirePermission(...)` and a hotel-scope check, in the guard or the service.
- Inventory changes use conditional atomic updates that keep `held + confirmed + blocked <= total`.
- Keep hold, booking, payment and refund statuses as separate fields with explicit transition functions.
- DTOs use the correct validators: `@MinLength` for strings, `@Min` for numbers. Use allowlists and bounds.
- Use unique indexes for idempotency keys and natural keys, and declare them in the schema.
- Never delete files, run `git commit`, or log secrets or personal data.
- Don't add tests unless the brief or the user asks for them.

## Before finishing
Run `npm run build:api` and fix any errors you caused.

## Write `.agent/work/<task-id>/backend.md`
- Files changed (path + one line each)
- Endpoints added or changed (method, path, permission, error codes)
- Schema, index and enum changes
- Audit actions added
- Build result
- Notes for docs-keeper (anything DATA_MODEL.md, API.md or the ARCHITECTURE.md decision log must reflect)
- Anything you could not do, and why
