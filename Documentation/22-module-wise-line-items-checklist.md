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
- [ ] Add hotel description, star category, amenities, and contact information
- [ ] Add cancellation, check-in, checkout, and guest policies
- [x] Admin property directory UI, workspace drawer, and publication readiness checks
- [x] Validate unique hotel slugs and required property details
- [ ] Implement `POST /admin/hotels/:id/media` photo upload API with primary image selection and gallery ordering (Phase 2 planned)
- [ ] Implement Mongoose text index and backend query multi-filters (`search`, `city`, `setupStatus`) on `GET /admin/hotels` (Phase 2 planned)
- [ ] Implement `PATCH /admin/hotels/bulk-status` endpoint for multi-select row status updates (Phase 2 planned)
- [ ] Implement `POST /admin/hotels/import` and `GET /admin/hotels/export` for bulk CSV property directory operations (Phase 4 planned)
- [ ] Prevent disabling or deleting hotels with active confirmed stays without a resolution flow
- [ ] Add hotel manager assignment and property scope in a later phase
