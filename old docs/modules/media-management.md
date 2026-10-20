# Media Management Specification

## Scope

Manage hotel, room type, and later review-photo media through an abstraction that supports local development and object storage in production.

## Upload rules

- Allow only approved raster formats (JPEG, PNG, WebP initially); reject SVG unless separately sanitized and threat-reviewed.
- Check extension, sniffed content, size, dimensions, and decompression limits on server.
- Strip EXIF/GPS metadata where appropriate; scan uploads according to hosting capability.
- Generate opaque storage keys; never trust client filenames as paths.
- Apply per-file and per-entity count limits; enforce authenticated permission and hotel scope.
- Store metadata (key, MIME, dimensions, size, alt text, sort order, owner, createdAt), not binary content in MongoDB.

## Lifecycle

Upload to temporary/quarantine state, validate, then attach to hotel/room entity. Primary selection and reorder use bounded atomic updates. Deletion marks media pending cleanup; remove object after reference check. Reconciliation job finds orphaned temporary files and stale DB references.

## Delivery and access

Use CDN/public read for approved published imagery or signed URLs where access is private. Admin previews must not leak unpublished assets publicly. Escape alt text and never treat filenames as markup.

## Acceptance criteria

- Malicious extension/content mismatch, oversized image, and unauthorized cross-hotel upload are rejected.
- Failed uploads do not create broken permanent records.
- Deletion does not remove an object still referenced by another entity.
