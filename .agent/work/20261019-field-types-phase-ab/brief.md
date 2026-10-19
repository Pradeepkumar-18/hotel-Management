# Task 20261019-field-types-phase-ab: Form field typing — Phase A + B
Source: Documentation/06-analysis/form-field-type-analysis.md · User chose Phase A + B, wire the Updated filter, defer Phase C (2026-10-19).

## Goal
Every rendered admin form field uses the right control and the same limits as the API; shared controls replace native ones.

## API contract changes (additive / tightened validation)
| Method | Path | Change |
|---|---|---|
| GET | /admin/hotels | `setupStatus` IsIn(COMPLETED, IN_PROGRESS); new `updatedSince` (ISO date) |
| GET | /admin/hotels/cities | New: distinct non-archived cities in scope (`hotels.view`) |
| POST/PATCH | /admin/hotels(/:id) | `address.postalCode` 6-digit PIN when country IN; `countryCode` ISO alpha-2; fee `currency` ISO 4217 |
| POST | /admin/hotels/:id/media | `url` https or /uploads path (legacy absolute /uploads URLs normalised); `isPrimary` boolean |
| POST | /admin/hotels/media/upload | JPEG/PNG/WebP only |
| POST/PATCH | room types | `code` pattern; empty `description` clears it |
| PUT | base rate | `currency` ISO 4217 |

## Out (Phase C)
Reason codes, amenities, beds, check-in/out, star rating, GSTIN, phone E.164, photo limit, date-range block, hotel currency.
