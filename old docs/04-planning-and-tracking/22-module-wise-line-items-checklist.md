# Hotel Management Platform — Module-Wise Line Items Checklist

**Status convention:** `[ ]` not started, `[x]` verified complete. Keep each checklist entry to one line and mark it complete only after its acceptance criteria are implemented and verified.

## 1. Authentication & Authorization

### Guest Authentication
- [ ] Guest registration with name, email, phone, and password
- [ ] Email format, password strength, and duplicate account validation
- [ ] Password visibility toggle and accessible password guidance
- [ ] Guest login and logout with secure session handling
- [ ] Current authenticated guest endpoint (`GET /api/v1/auth/me`)
- [ ] Client authentication state initialization on app load and refresh
- [ ] Protected guest routes and return-to-page redirect after login
- [ ] Password reset request and expiring single-use reset token flow
- [ ] Authenticated password change with current password verification
- [ ] Email verification and resend verification flow if required by launch policy
- [ ] Google or OTP sign-in only after the core booking flow is stable

### Admin Authentication and Roles
- [x] Dedicated admin sign-in and session check endpoints
- [x] Super admin role and protected admin route handling
- [x] Backend guards for authenticated admin endpoints
- [ ] Permission checks for hotel, inventory, booking, staff, and reporting actions
- [ ] Hotel manager role scoped to explicitly assigned properties in a later phase
- [ ] Staff account creation, suspension, and session revocation
- [x] Admin login and sensitive action audit events
- [ ] MFA requirement for privileged production accounts
- [ ] Login throttling, lockout policy, account recovery protections

## 2. Guest Profile & Booking Access

- [ ] View and update guest name, email, and phone details
- [ ] Support guest checkout without requiring account creation
- [ ] Provide secure booking lookup through ownership or expiring access link
- [ ] List bookings belonging to the authenticated guest
- [ ] View booking details, payment status, stay dates, and cancellation terms
- [ ] Protect booking access against reference guessing and unauthorized lookup

## 3. Hotel Management

- [x] Create hotel schema with name, slug, city, address, coordinates, and time zone
- [x] Add hotel description, address, contact information, creative unified command center workspace (`apps/admin-web/src/features/hotels/HotelWorkspace.tsx`) with 1 smart primary action, `···` menu, floating save bar, room creation, cancellation policies, and pre-publish readiness gates (evidence: .agent/work/20261016-restore-hotel-workspace-flow/verify.md)
- [ ] Add cancellation, check-in, checkout, and guest policies
- [x] Admin property directory UI, workspace drawer, and publication readiness checks
- [x] Validate unique hotel slugs and required property details
- [x] Workspace setup checklist driven by server readiness (5 steps incl. Availability), real list setup progress, unsaved-change protection (evidence: .agent/work/20261020-ux-top4-fixes/verify.md)
- [x] Form field typing Phase A+B: India PIN, ISO country/currency, https/`/uploads` media URLs, JPEG/PNG/WebP uploads, room code pattern, clearable room description, conditional room-count reason, cities + updatedSince list filters; shared Checkbox/DatePicker/Combobox/PasswordInput/ReasonField (evidence: .agent/work/20261019-field-types-phase-ab/verify.md)
- [x] Hotel form keeps address line 2 and state/region on edit (state dropdown for India); inventory block/unblock reason validation fixed (`@MinLength(3)`) (evidence: Documentation/06-analysis/form-field-type-analysis.md, Status update)
- [x] Simplified Add/Edit hotel UI: one shared fields block (`HotelDetailsFields`) with slug auto-fill and country/time-zone dropdowns, workspace on shared `Tabs` (Details, Photos, Rooms, Cancellation policy), archived read-only banner; all money inputs (base rate, fixed cancellation/no-show fee) typed in rupees via shared `MoneyInput` and sent as integer minor units (evidence: .agent/work/20261019-simplify-hotel-forms-inr-money/verify.md)
- [x] Implement `POST /admin/hotels/:id/media` photo upload API with primary image selection, gallery ordering, dedicated upload popup dialog, centered photo details modal for caption editing/cover selection, and reusable `ConfirmDialog` for photo deletions with popup bypass (evidence: .agent/work/20261016-delete-confirmation-dialog/verify.md)
- [x] Implement Mongoose text index and backend query multi-filters (`search`, `city`, `setupStatus`) on `GET /admin/hotels`
- [x] Hide archived hotels from `GET /admin/hotels` and the hotel list unless `status=ARCHIVED` is requested; fix `setupStatus` overriding `status` (evidence: .agent/work/20261019-hide-archived-hotels/verify.md)
- [x] Implement `PATCH /admin/hotels/bulk-status` endpoint for multi-select floating action bar status updates
- [ ] Implement `POST /admin/hotels/import` and `GET /admin/hotels/export` for bulk CSV property directory operations (Phase 4 planned)
- [ ] Prevent disabling or deleting hotels with active confirmed stays without a resolution flow
- [ ] Add hotel manager assignment and property scope in a later phase
