# Media

<a id="media-management"></a>
## Media Management Specification

### Scope

- **Scope:** Manage hotel, room type, and later review-photo media through an abstraction that supports local development and object storage in production.

### Upload rules

- **Formats:** Allow only approved raster formats (JPEG, PNG, WebP initially); reject SVG unless separately sanitized and threat-reviewed.
- **Server checks:** Check extension, sniffed content, size, dimensions, and decompression limits on server.
- **Metadata stripping and scanning:** Strip EXIF/GPS metadata where appropriate; scan uploads according to hosting capability.
- **Storage keys:** Generate opaque storage keys; never trust client filenames as paths.
- **Limits and authorization:** Apply per-file and per-entity count limits; enforce authenticated permission and hotel scope (see [rbac.md](./rbac.md)).
- **Stored metadata:** Store metadata (key, MIME, dimensions, size, alt text, sort order, owner, createdAt), not binary content in MongoDB.

### Lifecycle

- **Quarantine first:** Upload to temporary/quarantine state, validate, then attach to hotel/room entity.
- **Primary and reorder:** Primary selection and reorder use bounded atomic updates.
- **Deletion:** Deletion marks media pending cleanup; remove object after reference check.
- **Reconciliation:** Reconciliation job finds orphaned temporary files and stale DB references.

### Delivery and access

- **Delivery:** Use CDN/public read for approved published imagery or signed URLs where access is private.
- **Unpublished assets:** Admin previews must not leak unpublished assets publicly.
- **Escaping:** Escape alt text and never treat filenames as markup (see [../guidelines/backend.md](../guidelines/backend.md)).

### Acceptance criteria

- **Rejections:** Malicious extension/content mismatch, oversized image, and unauthorized cross-hotel upload are rejected.
- **Failed uploads:** Failed uploads do not create broken permanent records.
- **Shared references:** Deletion does not remove an object still referenced by another entity.
