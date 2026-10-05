# Security Guidelines

- Enforce HTTPS and secure headers in production; restrict CORS to known origins.
- Validate DTOs with allowlists, bounds and normalization. Use parameterized database queries.
- Hash passwords; protect sessions/cookies and implement CSRF defenses when using cookies.
- Rate-limit login, OTP, booking creation, coupon attempts and public retrieval endpoints.
- Authorize every resource access; verify guest ownership and hotel scope server-side.
- Verify payment webhooks cryptographically using raw body and provider documentation; deduplicate event IDs.
- Never store card PAN/CVV. Minimize and protect personal data; redact logs and define retention.
- Keep secrets in a secrets manager/environment configuration; rotate keys and restrict access.
- Audit staff changes to rates, inventory, policies, roles, bookings and refunds.
- Use least privilege for database and storage accounts; restrict upload types, sizes and metadata.
- Patch dependencies, scan build artifacts and review security-sensitive changes.
- Define incident response, backup access, restore tests and production access reviews.
