# Frontend Handoff: 20261016-restore-hotel-workspace-flow

## Creative Design Implementation (Option 1: Unified Command Center + Decluttered Header)

### 1. Decluttered Header with Smart Primary Action + `···` Menu
- **Replaced the noisy 7-button cluster** with **only 2 controls** in the top-right:
  - **Only 1 Smart Primary Action**:
    - If `DRAFT`: **"Publish Property"** (with `<UploadCloud size={16} />`). If pre-flight checks are missing, automatically alerts with the itemized checklist.
    - If `SUSPENDED`: **"Reactivate Property"** (with `<PlayCircle size={16} />`).
    - If `PUBLISHED` or `ARCHIVED`: Clean badge display with no redundant publish buttons.
  - **Single `···` (More Actions) Dropdown**:
    - Consolidates secondary/administrative actions:
      - ⏸️ **Suspend Property** (when `PUBLISHED` — triggers confirmation dialog with optional reason).
      - 🗑️ **Archive Property** (danger action — triggers `BulkStatusConfirmModal` requiring typed `"ARCHIVE"`).
  - Breadcrumb: Clean `← Back to hotels` navigation.

### 2. Single-Page Unified Command Center (Option 1)
- Replaced the fragmented 4-tab system with **4 unified, high-density cards** on a single scrollable page:
  - **Card 1: Property Identity & Location**:
    - Name, slug, description, line1, city, postalCode, countryCode, timezone, email, phone.
  - **Card 2: Photo Gallery**:
    - "+ Upload / Add Photo" button opening centered `PhotoUploadPopup`.
    - Photo card grid: large preview, clean caption text, primary cover toggle, click-to-edit popup (`PhotoEditModal`), and delete confirmation (`ConfirmDialog`).
  - **Card 3: Room Categories & Capacity**:
    - Room cards displaying room name, code, capacity, and rate management link.
    - "+ Add Room Category" button opening `RoomCreateModal` directly in place without navigating away.
  - **Card 4: Cancellation & No-Show Policy**:
    - Effective date, free cancellation cutoff hours, after-cutoff fee basis/penalty, no-show fee basis/penalty. Required for Gate B5 publishing.

### 3. Floating "Unsaved Changes" Bar (Shopify / Linear Style)
- Screen stays 100% distraction-free while browsing.
- If any input in Identity or Policy is changed, a sleek floating bar slides into view at the bottom center:
  `⚠️ You have unsaved changes`  `[ Discard ]`  `[ Save Property Changes ]`
- "Discard" resets changes to current hotel data; "Save Property Changes" saves via `updateHotel(hotelId, payload)` with OCC version and toast notification.

### 4. Interactive Pre-Publish Requirement Feedback
- If publishing a draft fails Gate B5, an interactive banner mounts at the top displaying the exact missing requirements (e.g. *"Set explicit cancellation and no-show terms before publication"*, *"Add at least one active room type"*).

## Verification
- `npm run build:admin` exited with code 0.
- `npm run build:api` exited with code 0.
