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
- [ ] Dedicated admin sign-in and session check endpoints
- [ ] Super admin role and protected admin route handling
- [ ] Backend guards for authenticated admin endpoints
- [ ] Permission checks for hotel, inventory, booking, staff, and reporting actions
- [ ] Hotel manager role scoped to explicitly assigned properties in a later phase
- [ ] Staff account creation, suspension, and session revocation
- [ ] Admin login and sensitive action audit events
- [ ] MFA requirement for privileged production accounts
- [ ] Login throttling, lockout policy, and account recovery protections

## 2. Guest Profile & Booking Access

- [ ] View and update guest name, email, and phone details
- [ ] Support guest checkout without requiring account creation
- [ ] Provide secure booking lookup through ownership or expiring access link
- [ ] List bookings belonging to the authenticated guest
- [ ] View booking details, payment status, stay dates, and cancellation terms
- [ ] Protect booking access against reference guessing and unauthorized lookup

## 3. Hotel Management

- [ ] Create hotel schema with name, slug, city, address, coordinates, and time zone
- [ ] Add hotel description, star category, amenities, and contact information
- [ ] Add cancellation, check-in, checkout, and guest policies
- [ ] Admin create, view, edit, disable, archive, and publish hotel operations
- [ ] Validate unique hotel slugs and required property details
- [ ] Add hotel photos, captions, ordering, and primary image selection
- [ ] Add hotel search by city and publication status
- [ ] Prevent disabling or deleting hotels with active confirmed stays without a resolution flow
- [ ] Add hotel manager assignment and property scope in a later phase

## 4. Room Type Management

- [ ] Create room type schema linked to a hotel
- [ ] Add room type name, description, capacity, bed configuration, and amenities
- [ ] Add total sellable room count and base nightly rate
- [ ] Add room type image gallery and primary image selection
- [ ] Admin create, view, edit, enable, and disable room types
- [ ] Validate guest capacity and requested room quantity on the server
- [ ] Prevent reducing room count below already held, blocked, or confirmed inventory
- [ ] Prevent deletion of room types referenced by bookings
- [ ] Store room policy and rate plan references where applicable

## 5. Inventory & Availability Engine

- [ ] Create nightly inventory documents keyed by room type and local stay date
- [ ] Add unique MongoDB index for room type and stay date inventory records
- [ ] Define total, blocked, held, and confirmed room counts per night
- [ ] Enforce `held + confirmed + blocked <= total` for every room type and night
- [ ] Calculate availability across every night from check-in inclusive to checkout exclusive
- [ ] Verify requested guest count fits room type capacity and room quantity
- [x] Create MongoDB replica set configuration for transactional booking operations
- [ ] Claim inventory with conditional atomic updates inside a MongoDB transaction
- [ ] Roll back every nightly claim if any date in a multi-night stay is unavailable
- [ ] Add maintenance date blocks and unblock actions with audit records
- [ ] Add manual inventory adjustment with reason capture and safeguards
- [ ] Build hotel admin availability calendar with available, held, booked, and blocked quantities
- [ ] Add background expiry processing for stale holds with safe retry behavior
- [ ] Add alerting for inventory invariant violations and delayed expiry processing

## 6. Rates, Pricing & Taxes

- [ ] Store all monetary values as integer minor units with explicit ISO currency
- [ ] Create base rate and date-specific rate rule schemas
- [ ] Resolve applicable nightly rates deterministically when rules overlap
- [ ] Calculate room-night subtotal using rate, number of rooms, and stay nights
- [ ] Calculate taxes and fees on the server using configured market rules
- [ ] Validate GST slabs and inclusive or exclusive tax treatment with finance/legal review
- [ ] Return an itemized quote with currency, expiry, taxes, and fees
- [ ] Recalculate price when the guest requests an inventory hold
- [ ] Save immutable per-night price, tax, fee, and policy snapshots on each booking
- [ ] Add weekend and seasonal rate overrides in a later phase

## 7. Guest Search & Hotel Discovery

- [ ] Build destination, check-in, checkout, room count, and guest count search form
- [ ] Validate stay dates, occupancy values, and booking horizon before searching
- [ ] Return hotels with room types available for every night in the requested stay
- [ ] Show stay total, currency, available room quantity, photos, and rating on result cards
- [ ] Add city, price, star rating, amenities, and room type filters
- [ ] Add sorting by price, rating, and relevance where supported
- [ ] Add server-side pagination and bounded result limits
- [ ] Preserve search parameters in the URL for refresh and sharing
- [ ] Build hotel detail page with description, location, amenities, room types, and policies
- [ ] Add loading, empty, unavailable, and error states with retry actions
- [ ] Recheck availability and price when creating a hold because search results can become stale

## 8. Holds & Booking Creation

- [ ] Create booking and inventory hold schemas with explicit lifecycle statuses
- [ ] Create 10-minute holds using server-side timestamps and expiry values
- [ ] Add idempotency keys to hold and booking creation requests
- [ ] Bind each hold to a guest account or secure guest checkout session
- [ ] Create a hold only when every requested night has sufficient inventory
- [ ] Return hold reference, expiry countdown, and server-generated price breakdown
- [ ] Release held inventory exactly once when a hold expires or is cancelled
- [ ] Create booking only against an eligible, unexpired hold
- [ ] Generate unique, non-guessable booking references
- [ ] Save guest contact, hotel, room type, occupancy, stay dates, price, and policy snapshots
- [ ] Prevent duplicate booking creation when the client retries a request
- [ ] Handle delayed payment success after hold expiration through a reconciliation state
- [ ] Add booking history records for all state changes

## 9. Payments & Refunds

- [ ] Select payment provider based on launch geography and merchant eligibility
- [ ] Create payment provider adapter behind a shared payment service interface
- [ ] Create payment records with booking, amount, currency, provider reference, and status
- [ ] Create payment intent/order with server-calculated amount only
- [ ] Verify provider webhook signature using the provider's documented method
- [ ] Deduplicate webhook events with unique provider event identifiers
- [ ] Confirm booking only after verified payment success and valid inventory
- [ ] Handle payment pending, success, failure, timeout, duplicate, and out-of-order events
- [ ] Track payment status separately from booking status
- [ ] Calculate cancellation refund from the booking's saved policy snapshot
- [ ] Track refund requested, processing, succeeded, and failed states independently
- [ ] Add payment provider reconciliation for unmatched or late events
- [ ] Never store payment card number or CVV in the platform database

## 10. Booking Lifecycle & Stay Operations

- [ ] Define allowed transitions for pending payment, confirmed, checked-in, checked-out, completed, cancelled, and no-show
- [ ] Reject invalid lifecycle transitions on the backend
- [ ] Admin search bookings by reference, hotel, guest, stay date, and status
- [ ] Display booking details with price breakdown, payment state, guest, and audit timeline
- [ ] Add authorized check-in and check-out actions
- [ ] Add cancellation action with policy calculation and reason capture
- [ ] Add no-show action with property policy handling
- [ ] Add walk-in booking creation with server-side availability and pricing checks
- [ ] Add booking modification with repricing and inventory validation in a later phase
- [ ] Release inventory exactly once after accepted cancellation
- [ ] Record every admin booking action in the audit trail

## 11. Cancellation Policies

- [ ] Define platform defaults for cancellation policy behavior
- [ ] Allow property-specific cancellation rules where approved
- [ ] Snapshot applicable policy and cutoff time on booking confirmation
- [ ] Calculate free cancellation deadline using property time zone
- [ ] Calculate cancellation fee and refund amount on the backend
- [ ] Distinguish booking cancellation from refund completion status
- [ ] Prevent repeated cancellation requests from releasing inventory or refunding twice
- [ ] Show guest cancellation eligibility, fee, and expected refund before confirmation
- [ ] Add admin cancellation override with permission, reason, and audit record

## 12. Guest Accounts, Reviews & Ratings

- [ ] Build guest account profile and booking history pages
- [ ] Allow a review only after an eligible completed stay
- [ ] Prevent duplicate reviews for the same eligible booking
- [ ] Add review rating, title, comment, and submission timestamp
- [ ] Add review moderation queue for admins
- [ ] Approve, reject, or remove reviews with audit records
- [ ] Show approved reviews and rating summaries on hotel detail pages
- [ ] Add review invitation notification after checkout in a later phase

## 13. Admin Dashboard & Reports

- [ ] Show booking counts by status and selected date range
- [ ] Show gross booking value and define its calculation basis
- [ ] Show occupancy as sold room-nights divided by sellable room-nights
- [ ] Show cancellation rate with documented numerator and denominator
- [ ] Show revenue by hotel and date range with documented transaction or stay-date basis
- [ ] Add top hotel and room type summaries
- [ ] Restrict report data to the admin's authorized hotel scope
- [ ] Add export to Excel or PDF in a later phase
- [ ] Add tests for report date boundaries, cancellations, and refunds

## 14. Staff & Audit Management

- [ ] Create staff user, role, permission, and hotel assignment schemas
- [ ] Create and suspend staff accounts with immediate session revocation
- [ ] Add staff search, status filters, role filters, and pagination
- [ ] Enforce super-admin permissions across the platform
- [ ] Enforce hotel-manager access only to assigned hotels when that role ships
- [ ] Audit changes to hotel details, room counts, rates, policies, bookings, and refunds
- [ ] Store actor, action, target, timestamp, result, and reason where relevant
- [ ] Add admin activity history screen with permission checks
- [ ] Prevent users from granting themselves higher privileges

## 15. Notifications & Booking Documents

- [ ] Create booking confirmation email template
- [ ] Create cancellation and refund status email templates
- [ ] Create pre-arrival reminder template
- [ ] Send confirmation only after booking confirmation is persisted
- [ ] Add retryable notification delivery and delivery status tracking
- [ ] Generate receipt or invoice from the immutable booking price snapshot
- [ ] Provide secure guest access to download booking documents
- [ ] Add SMS and WhatsApp delivery in a later phase
- [ ] Avoid including sensitive guest or payment data in notification logs

## 16. Hotel & Room Media Management

- [ ] Add NestJS multipart upload handling for hotel and room images
- [ ] Validate image MIME type and actual file content
- [ ] Enforce configurable file size and image dimension limits
- [ ] Store development uploads locally outside source-controlled files
- [ ] Add storage abstraction for later S3-compatible object storage
- [ ] Save image metadata and storage key in MongoDB
- [ ] Support image alt text, ordering, and primary-image selection
- [ ] Delete orphaned media safely when records are archived or removed
- [ ] Restrict upload and deletion actions to authorized staff

## 17. Database Schemas, Indexes & Seeders

- [ ] Create strict Mongoose schemas for users, hotels, room types, inventory, holds, bookings, payments, refunds, reviews, and audit logs
- [ ] Add unique and compound indexes for hotel slugs, nightly inventory, booking references, and provider events
- [ ] Configure MongoDB replica set for local development and transaction-capable environments
- [ ] Add schema validation and migration/index rollout process
- [ ] Seed a non-production super-admin account securely
- [ ] Seed sample hotels, room types, rates, and nightly inventory for development
- [ ] Seed demo bookings and payment states for admin UI development
- [ ] Ensure seed scripts are idempotent and never contain production data

## 18. Frontend UI Shell & Feedback

- [ ] Build responsive guest and admin application shells with React, TypeScript, and Tailwind CSS
- [ ] Add accessible toast notifications for success, warning, and error states
- [ ] Add confirmation dialogs for destructive, financial, and inventory-changing actions
- [ ] Add reusable drawer, modal, form field, table, and status badge components
- [ ] Add mobile navigation and responsive admin layouts
- [ ] Add breadcrumb navigation for admin detail pages
- [ ] Add scoped loading indicators that preserve stable navigation layout
- [ ] Add skeleton loaders for search results, hotel details, calendars, and tables
- [ ] Add loading states and duplicate-submit protection to forms
- [ ] Add empty states with clear next actions
- [ ] Meet keyboard navigation, visible focus, label, and screen-reader status requirements

## 19. API, Security & System Foundations

- [ ] Build NestJS modular architecture with controllers, services, schemas, and DTOs
- [ ] Publish OpenAPI documentation for versioned REST endpoints
- [ ] Add global DTO validation and safe transformation settings
- [ ] Add consistent API success and error response formats
- [ ] Configure MongoDB connection through `@nestjs/mongoose` and environment variables
- [ ] Add readiness and liveness health endpoints
- [ ] Configure Helmet security headers and production HTTPS
- [ ] Restrict CORS to approved guest and admin origins
- [ ] Add rate limiting to authentication, booking, and sensitive endpoints
- [ ] Configure secure HttpOnly cookie and CSRF handling if cookie sessions are used
- [ ] Add request IDs and redact guest and payment data from logs
- [ ] Add Docker Compose for MongoDB replica set, NestJS API, and React applications

## 20. Testing & Release Readiness

- [ ] Unit test stay-date boundaries, occupancy, pricing, tax rounding, and cancellation rules
- [ ] Integration test simultaneous booking attempts for the final available room
- [ ] Integration test all-or-nothing reservation across multiple stay nights
- [ ] Test checkout date exclusion and property time-zone boundaries
- [ ] Test duplicate booking requests and duplicate payment webhooks
- [ ] Test payment success received after hold expiry
- [ ] Test guest ownership and admin property-scope authorization
- [ ] End-to-end test hotel setup, guest search, booking, and admin check-in/check-out
- [ ] Test responsive guest booking flow and accessible admin controls
- [ ] Test backup restoration, database index rollout, and deployment rollback
- [ ] Complete security and operational readiness review before public launch

## 21. Deployment, Monitoring & Operations

- [ ] Create isolated development, staging, and production configurations
- [ ] Use separate databases, gateway credentials, and media storage per environment
- [ ] Add structured logs with correlation IDs and sensitive-data redaction
- [ ] Monitor search latency, booking conversion, hold expiry, payment outcomes, and refunds
- [ ] Alert on inventory invariant violations, webhook failures, and reconciliation backlog
- [ ] Configure encrypted automated MongoDB backups
- [ ] Document restore point and recovery time objectives
- [ ] Rehearse restore and production rollback procedures
- [ ] Create support runbooks for payment outage, late payment, booking conflict, and refund delay
- [ ] Define production on-call owner and escalation process

## 22. Later-Phase Growth Features

- [ ] Add hotel manager portal with strict property-scoped authorization
- [ ] Add seasonal pricing and room-level rate restrictions
- [ ] Add coupon creation, validation, limits, and redemption records
- [ ] Add multiple currencies and localized guest experiences
- [ ] Add Excel and PDF report exports
- [ ] Integrate channel managers after partner contracts and sync rules are defined
- [ ] Add analytics and caching only after measured scale requirements
- [ ] Evaluate AI only for assistive features that cannot change availability, price, payment, or refund decisions
