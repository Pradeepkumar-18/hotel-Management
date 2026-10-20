# Form Field Type Analysis: Admin Web

**Platform:** Staywise Hotel Operations Platform (`apps/api` & `apps/admin-web`)  
**Module:** All staff-facing forms in the admin UI  
**Author:** Pair Programming Agent  
**Date:** October 19, 2026  
**Scope:** Every form field rendered by a routed admin page (see `apps/admin-web/src/routes/AppRoutes.tsx`) and the components those pages import. For each field: current UI control, matching backend DTO / schema validation, mismatches, and a recommended input type.

**Method:** Started from `AppRoutes.tsx` and followed imports to every rendered form. Read each field's JSX and the code that turns the form into an API payload. Matched each field to its DTO in `apps/api/src/modules/**/dto/*.ts`, its Mongoose schema, and any service-level checks. Then compared against `Documentation/modules/*.md`, `Documentation/01-product/12-business-rules.md` and `apps/admin-web/docs/ui-decisions.md`. Everything below comes from reading the code; nothing was run. Line numbers are from the working tree on 2026-10-19 (branch `feat-update`, with uncommitted changes).

---

## Summary

| Metric | Count |
|---|---|
| Rendered form fields reviewed | 62 (57 table rows; some rows cover a pair of identical fields), across 10 screens |
| Missing fields (in the backend or spec, not in the UI) | 10 rows |
| Rows with no change needed | 13 |
| Recommended changes, **High** | 10 |
| Recommended changes, **Medium** | 25 |
| Recommended changes, **Low** | 19 |
| **Total recommended changes** | **54** |

The priority counts are per table row in sections 1 to 10, including the missing-field rows.

### Top recommendations

1. **Inventory block/unblock always fails on the server (High).** `InventoryAdjustmentDto.reason` and `BatchInventoryAdjustmentDto.reason` use `@Min(3)` ([inventory.dto.ts:11](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L11), [:19](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L19)). `@Min` is a number check: class-validator's `min()` returns `typeof num === 'number' && …`. So a string reason fails every time. Replace it with `@MinLength(3)`. Please confirm with one live request.
2. **Editing hotel details wipes `address.line2` and `address.region` (High).** The form never renders these two fields, and `readHotelDetails` sends an `address` object without them ([HotelDetailsFields.tsx:184-189](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L184-L189)). `update()` then replaces the whole address ([hotel.service.ts:333](../../apps/api/src/modules/hotels/hotel.service.ts#L333)). Add the fields, using a State `Select` for India.
3. **Use reason codes instead of free-text reasons (High/Medium).** Six audit flows take free text or a hard-coded string: bulk status, archive, suspend, room-count change, rate change, and inventory block. Bulk status even saves `"Bulk ARCHIVED operation"` when the box is left empty. Add a shared `ReasonField` (a required reason-code `Select` plus an optional note, max 500) and a backend `reasonCode` enum.
4. **Constrain the room type code (High).** It is free text today, uppercased only by CSS in one form and not at all in `RoomCreateModal`. The backend accepts any 1–32 characters. Add a pattern such as `^[A-Z0-9]+(-[A-Z0-9]+)*$` (proposal) in both the UI and the DTO, and force uppercase as the user types.
5. **Room type "reason" must be conditionally required (High).** The UI marks it optional and has no length limits. The server rejects a room-count change without a reason ([room-type.service.ts:71](../../apps/api/src/modules/hotels/room-type.service.ts#L71)), and the DTO requires 3–500 characters.
6. **Validate the postal code and image URL (High).** Postal code is free text up to 80 characters; India PIN codes are 6 digits. The media URL is accepted by the backend as any string of 5 or more characters ([hotel.dto.ts:83](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L83)).
7. **Add the missing typed fields.** Bed configuration (a repeater with a bed-type `Select` and a quantity), amenities (`MultiSelect`) for hotels and room types, and the check-in/check-out `TimePicker` from the spec.
8. **Build the missing shared controls.** `DatePicker`, `Checkbox`/`Switch`, `MultiSelect`, `Combobox` and `PhoneInput`. Several screens currently use native `<input>`, `<select>` and checkbox elements, which `ui-decisions.md` §3 forbids.

### Priority legend

| Priority | Meaning |
|---|---|
| **High** | Data integrity or a backend mismatch: data is lost or cannot be cleared, the request always fails, free text sits where an identifier or format applies, or an audit trail is degraded. |
| **Medium** | UX or consistency: a missing client-side constraint that the server catches, a free-text field that should be a fixed list, a project UI rule broken, or a feature field missing. |
| **Low** | Polish: native control styling, hints, small label fixes, dead options. |
| OK | No change needed. |

---

## 1. Hotel create / edit: Details (`HotelDetailsFields`)

Rendered by `HotelCreateForm` (route `/admin/hotels/new`) and in the `HotelWorkspace` "Details" tab (`/admin/hotels/:id/edit`). Submitted through `readHotelDetails` ([HotelDetailsFields.tsx:177-195](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L177-L195)).

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Property name | `name` | `Input` text, required, 2–140 ([:31](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L31)) | string 2–140 ([hotel.dto.ts:56](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L56)) | Matches | Keep | OK |
| Web address | `slug` | `Input` text, live sanitising, 2–160 ([:49-63](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L49-L63)) | string 2–160, no pattern ([hotel.dto.ts:57](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L57)); normalised server-side ([hotel.policies.ts:11](../../apps/api/src/modules/hotels/hotel.policies.ts#L11)) | Leading/trailing `-` possible while typing; DTO has no pattern | `Input` with `pattern="^[a-z0-9]+(-[a-z0-9]+)*$"` and a `/` prefix adornment; DTO `@Matches` | Low |
| Description | `description` | `Textarea`, max 5000 ([:67](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L67)) | string ≤5000 ([hotel.dto.ts:61](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L61)) | Matches; no visible counter | `Textarea` with character counter | Low |
| Email | `contact.email` | `Input type=email`, required ([:80-87](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L80-L87)) | optional `IsEmail` ≤254 ([hotel.dto.ts:51](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L51)); service requires email **or** phone ([hotel.service.ts:232](../../apps/api/src/modules/hotels/hotel.service.ts#L232)) | Required in UI only; no `maxLength` 254 | Keep `type=email`, add `maxLength={254}`; product to decide whether email is mandatory and align the DTO | Medium |
| Phone | `contact.phone` | `Input type=tel` + pattern ([:91-99](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L91-L99)) | regex `^\+?[0-9().\-\s]{7,32}$` ([hotel.dto.ts:52](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L52)); stored as typed ([hotel.schema.ts:41](../../apps/api/src/modules/hotels/schemas/hotel.schema.ts#L41)) | Free format; the same number can be stored many ways | `PhoneInput`: dial-code `Select` (default +91) plus national digits; server normalises to E.164 | Medium |
| Street address | `address.line1` | `Input` text, required, ≤240 ([:105](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L105)) | string 1–240 ([hotel.dto.ts:42](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L42)) | Matches | Keep | OK |
| City | `address.city` | `Input` text, required, ≤120 ([:116](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L116)) | string 1–120 ([hotel.dto.ts:44](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L44)) | Free text; list filter groups by exact string, so "Bengaluru" and "Bangalore" split | `Combobox` (free text with suggestions from existing cities) | Medium |
| Postal code | `address.postalCode` | `Input` text, required, ≤80 ([:127](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L127)) | string 1–80, no pattern ([hotel.dto.ts:46](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L46)) | Any text accepted; default country is IN (6-digit PIN) | `Input inputMode=numeric` with a pattern chosen by country (IN: `^[1-9][0-9]{5}$`); same rule in DTO/service | High |
| Country | `address.countryCode` | `Select`, 13 options + saved value ([:138-147](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L138-L147)) | `^[A-Za-z]{2}$` only ([hotel.dto.ts:47](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L47)) | Backend accepts codes that don't exist (e.g. `XX`) | Keep `Select` (`Combobox` if the list grows); DTO `@IsISO31661Alpha2()` | Medium |
| Time zone | `timezone` | `Select`, 15 IANA options ([:151-160](../../apps/admin-web/src/features/hotels/HotelDetailsFields.tsx#L151-L160)) | string ≤100 + IANA check ([hotel.policies.ts:99](../../apps/api/src/modules/hotels/hotel.policies.ts#L99)); locked when future bookings exist ([hotel.service.ts:308](../../apps/api/src/modules/hotels/hotel.service.ts#L308)) | Not filtered by country (IN + `America/New_York` allowed); not shown as locked in the UI | Filter options by country, auto-pick for single-zone countries, disable with a hint when locked | Low |

**Missing fields** (in the DTO or spec, absent from the form):

| Field | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Address line 2 | `address.line2` | Not rendered | optional ≤240 ([hotel.dto.ts:43](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L43)) | Edit sends `address` without it, and the server replaces the whole address ([hotel.service.ts:333](../../apps/api/src/modules/hotels/hotel.service.ts#L333)), so any saved value is wiped | `Input` text ≤240 (or send the saved value back) | High |
| State / region | `address.region` | Not rendered | optional ≤120 ([hotel.dto.ts:45](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L45)) | Same wipe on edit as line 2 | `Select` of Indian states/UTs when country = IN, otherwise `Input` | High |
| Amenities | `amenities` | Not rendered | `string[]`, each ≤80, no list ([hotel.dto.ts:62](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L62)) | Spec lists amenities ([hotel-management.md:9](../modules/hotel-management.md#L9)); no fixed list exists | `MultiSelect` from a fixed list; DTO `@IsIn(list, {each:true})` | Medium |
| Latitude / longitude | `latitude`, `longitude` | Not rendered | `IsLatitude` / `IsLongitude` ([hotel.dto.ts:64-65](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L64-L65)) | Optional; nothing can enter them | Two `Input type=number step=any` (−90..90, −180..180) or a map picker | Low |
| Check-in / check-out time | (new) | Not modelled | none | Spec optional field ([hotel-management.md:9](../modules/hotel-management.md#L9)); cancellation cutoff needs check-in time | `TimePicker` (HH:mm, 24 h) | Medium |
| Star classification | (new) | Not modelled | none | Spec optional field ([hotel-management.md:9](../modules/hotel-management.md#L9)) | `Select` 1–5 + "Unrated" | Low |
| Tax registration (GSTIN) | (new) | Not modelled | none | Spec: "tax registration appropriate to market" ([hotel-management.md:9](../modules/hotel-management.md#L9)) | `Input` uppercase, 15 chars, pattern (see §11) | Low |

---

## 2. Hotel edit: Cancellation policy (`CancellationPolicyFields`)

Rendered in the `HotelWorkspace` "Cancellation policy" tab. Submitted through `readCancellationPolicy` ([CancellationPolicyFields.tsx:116-139](../../apps/admin-web/src/features/hotels/CancellationPolicyFields.tsx#L116-L139)).

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Applies from | `cancellationPolicy.effectiveFrom` | `Input type=date` (native picker), required ([:26-32](../../apps/admin-web/src/features/hotels/CancellationPolicyFields.tsx#L26-L32)) | `YYYY-MM-DD` + real-date check ([hotel.dto.ts:35](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L35), [hotel.policies.ts:76-79](../../apps/api/src/modules/hotels/hotel.policies.ts#L76-L79)) | Native control varies by browser; a future date blocks publishing ([hotel-publish.checks.ts:49](../../apps/api/src/modules/hotels/hotel-publish.checks.ts#L49)) with no warning | Shared `DatePicker`; warn when the date is after today | Low |
| Free cancellation until | `…freeCancellationHoursBeforeCheckIn` | `Input type=number` 0–8760, step 1 ([:41-52](../../apps/admin-web/src/features/hotels/CancellationPolicyFields.tsx#L41-L52)) | int 0–8760 ([hotel.dto.ts:36](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L36)) | Matches; staff think in days | Keep the number, or add a unit `Select` (hours/days) / presets 24, 48, 72, 168 h | Low |
| Fee for late cancellation / no-show: basis | `…afterCutoff.basis`, `…noShow.basis` | `Select`, 4 options ([:77-82](../../apps/admin-web/src/features/hotels/CancellationPolicyFields.tsx#L77-L82)) | `IsEnum(CancellationFeeBasis)` ([hotel.dto.ts:25](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L25)) | Matches | Keep | OK |
| … amount | `…afterCutoff.amountMinorUnits`, `…noShow.amountMinorUnits` | `MoneyInput` (rupees to minor units) ([:86-92](../../apps/admin-web/src/features/hotels/CancellationPolicyFields.tsx#L86-L92)) | int 0–9e12 ([hotel.dto.ts:27](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L27)) | Matches money rule | Keep | OK |
| … currency | `…afterCutoff.currency`, `…noShow.currency` | hidden input: saved currency, else INR ([:20](../../apps/admin-web/src/features/hotels/CancellationPolicyFields.tsx#L20), [:93](../../apps/admin-web/src/features/hotels/CancellationPolicyFields.tsx#L93)) | `^[A-Za-z]{3}$` ([hotel.dto.ts:29](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L29)); must equal base-rate currency at publish ([hotel.policies.ts:87-91](../../apps/api/src/modules/hotels/hotel.policies.ts#L87-L91)) | Defaults to INR even when the hotel's rates are in another currency, so publish fails with `HOTEL_POLICY_CURRENCY_MISMATCH` | Take it from the hotel's rate currency (needs a hotel-level currency); show it read-only | Medium |
| … percentage | `…afterCutoff.percent`, `…noShow.percent` | `Input type=number` 0–100, step 0.01, converted to bps ([:98-109](../../apps/admin-web/src/features/hotels/CancellationPolicyFields.tsx#L98-L109)) | int bps 0–10000 ([hotel.dto.ts:31](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L31)) | Matches | Keep | OK |

---

## 3. Hotel create / edit: Photos (`HotelMediaGalleryManager`)

Rendered in `HotelCreateForm` and the workspace "Photos" tab. Saved via `SetHotelMediaDto`.

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Upload image files | file | hidden native `<input type=file multiple>` with jpeg/png/webp/gif/avif ([:306-317](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L306-L317)); client limit 10 MB ([:60](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L60)) | mimetype regex jpg/png/webp/gif/avif, 10 MB ([hotels.controller.ts:84-87](../../apps/api/src/modules/hotels/hotels.controller.ts#L84-L87)) | Spec allows JPEG/PNG/WebP only and requires content sniffing ([media-management.md:9-10](../modules/media-management.md#L9-L10)) | Shared `FileDropzone` with `accept` jpeg/png/webp; server sniffs content | Medium |
| Image URL | `urlInput` (state) | native `<input type=url>`, styled inline ([:359-376](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L359-L376)); accepts any absolute URL or any `/…` path ([:145-153](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L145-L153)) | string 5–1000, no URL check ([hotel.dto.ts:83](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L83)) | Backend stores any string as an image `src`; `http:` allowed | Shared `Input type=url`, https-only pattern; DTO `@IsUrl({protocols:['https']})` or `^/uploads/` path | High |
| Photo caption (add by URL) | `captionInput` (state) | native `<input type=text>` ([:383-395](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L383-L395)) | optional ≤200 ([hotel.dto.ts:85](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L85)) | No `maxLength`; native control | Shared `Input maxLength={200}` | Medium |
| Set as primary cover | `setAsPrimaryOnAdd` (state) | native checkbox ([:403-408](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L403-L408)) | `isPrimary` optional, no `@IsBoolean` ([hotel.dto.ts:84](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L84)); coerced with `!!` ([hotel.service.ts:129](../../apps/api/src/modules/hotels/hotel.service.ts#L129)) | Native control; any value accepted | Shared `Checkbox` / `Switch`; DTO `@IsBoolean()` | Medium |
| Photo description / caption (per card) | `media[i].caption` | native `<input type=text>` inline on each card ([:500-507](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L500-L507)) | optional ≤200 ([hotel.dto.ts:85](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L85)) | No `maxLength`; native control | Shared `Input maxLength={200}` | Medium |
| Set as thumbnail | `media[i].isPrimary` | button per card ([:519-527](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L519-L527)) | as above | Fine as an action button (only one primary) | Keep | OK |
| Order (left/right) | `media[i].displayOrder` (from index) | chevron buttons ([:534-551](../../apps/admin-web/src/features/hotels/HotelMediaGalleryManager.tsx#L534-L551)) | int ≥0 ([hotel.dto.ts:86](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L86)); array has no max ([hotel.dto.ts:91](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L91)) | Spec requires a per-entity count limit ([media-management.md:13](../modules/media-management.md#L13)) | Keep UI; DTO `@ArrayMaxSize(n)` (n is a product decision) | Medium |

---

## 4. Hotels list: filters and selection (`HotelsPage`, `HotelFiltersBar`, `Pagination`)

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Search | `search` | `Input type=text` ([HotelFiltersBar.tsx:37-43](../../apps/admin-web/src/pages/hotels/components/HotelFiltersBar.tsx#L37-L43)) | string ≤100 ([hotel.dto.ts:105](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L105)) | No `maxLength`; over 100 characters returns a 400 | `Input type=search maxLength={100}` | Low |
| Status | `status` | `Select`, 5 options ([:50-56](../../apps/admin-web/src/pages/hotels/components/HotelFiltersBar.tsx#L50-L56)) | `IsEnum(HotelStatus)` ([hotel.dto.ts:103](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L103)) | Option label "Paused" vs `STATUS_LABEL` "Suspended" ([hotel-status.ts:6](../../apps/admin-web/src/features/hotels/hotel-status.ts#L6)); a bad `?status=` in the URL goes straight to the API | Build options from `STATUS_LABEL`; ignore unknown URL values | Low |
| Location | `city` | `Select` built from the **current page's** hotels ([HotelsPage.tsx:143-149](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx#L143-L149)) | string ≤120 ([hotel.dto.ts:104](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L104)) | Cities on other pages are missing; after you pick a city the list shrinks to that one | `Combobox` fed by a distinct-cities endpoint (or metrics) | Medium |
| Setup | `setupStatus` | `Select` ALL / COMPLETED / IN_PROGRESS ([:73-77](../../apps/admin-web/src/pages/hotels/components/HotelFiltersBar.tsx#L73-L77)) | `IsString` ≤30 ([hotel.dto.ts:106](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L106)); unknown values silently ignored ([hotel.service.ts:80-82](../../apps/api/src/modules/hotels/hotel.service.ts#L80-L82)) | Fixed list in the UI, but the backend has no enum | Keep `Select`; DTO `@IsIn(['COMPLETED','IN_PROGRESS'])` | Low |
| Updated | `timeFilter` | `Select` ANY / TODAY / THIS_WEEK / THIS_MONTH ([:82-87](../../apps/admin-web/src/pages/hotels/components/HotelFiltersBar.tsx#L82-L87)) | none: never sent ([HotelsPage.tsx:30](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx#L30), [:85-93](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx#L85-L93)) | The filter does nothing | Wire it to an `updatedSince` date param (enum or `DatePicker`), or remove it | Medium |
| Select all / select row | `selectedIds` | native checkboxes ([HotelsPage.tsx:209-224](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx#L209-L224)) | `hotelIds` 1–100 ([hotel.dto.ts:95](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L95)) | Native control; header checkbox has no indeterminate state | Shared `Checkbox` with indeterminate state | Low |
| Rows per page | `pageSize` | native `<select>` [10, 25, 50] ([Pagination.tsx:41-51](../../apps/admin-web/src/components/ui/Pagination.tsx#L41-L51)); URL value not clamped ([HotelsPage.tsx:34](../../apps/admin-web/src/pages/hotels/HotelsPage.tsx#L34)) | `limit` 1–100 ([hotel.dto.ts:101](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L101)) | Native control; `?pageSize=500` causes a 400 | Shared `Select size="sm"`; clamp to the options | Low |

---

## 5. Hotel status changes: bulk, archive, suspend (`BulkStatusConfirmModal`, `HotelWorkspace`)

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Type ARCHIVE to confirm | `archiveConfirmation` (state) | `Input` text, must equal `ARCHIVE` ([BulkStatusConfirmModal.tsx:86-92](../../apps/admin-web/src/pages/hotels/components/BulkStatusConfirmModal.tsx#L86-L92)) | none (UI friction only) | Deliberate safety step | Keep | OK |
| Reason for status change | `reason` | `Textarea`, optional, free text ([:101-107](../../apps/admin-web/src/pages/hotels/components/BulkStatusConfirmModal.tsx#L101-L107)) | optional ≤500 ([hotel.dto.ts:97](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L97), [status-change.dto.ts:5](../../apps/api/src/modules/hotels/dto/status-change.dto.ts#L5)) | No `maxLength`; empty becomes `"Bulk <STATUS> operation"` ([:34](../../apps/admin-web/src/pages/hotels/components/BulkStatusConfirmModal.tsx#L34)), so the audit reason carries no information | `ReasonField`: reason-code `Select` (required for Suspend/Archive) + note `Textarea maxLength={500}`; DTO `reasonCode` enum | High |
| Suspend (workspace) | `reason` | no input; hard-coded `'Suspended via workspace'` ([HotelWorkspace.tsx:128](../../apps/admin-web/src/features/hotels/HotelWorkspace.tsx#L128)) | optional ≤500 ([status-change.dto.ts:5](../../apps/api/src/modules/hotels/dto/status-change.dto.ts#L5)) | Staff cannot record why a hotel was suspended | Open the same `ReasonField` modal used for archive | Medium |

---

## 6. Room type create / edit (`RoomTypeForm`)

Rendered by `RoomTypeCreatePage` (`/admin/room-types/new`) and `RoomTypeEditPage` (`/admin/room-types/:id/edit`). Payload built at [RoomTypeForm.tsx:36-70](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L36-L70).

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Room category name | `name` | `Input` text, required ([:100-106](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L100-L106)) | string 2–120 ([room-type.dto.ts:20](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L20)) | No `minLength` / `maxLength` | `Input minLength={2} maxLength={120}` | Medium |
| Room code | `code` | `Input` text, uppercase by CSS only ([:115-122](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L115-L122)); uppercased on submit ([:37](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L37)) | string 1–32, no pattern ([room-type.dto.ts:21](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L21)); schema uppercases ([room-type.schema.ts:32](../../apps/api/src/modules/hotels/schemas/room-type.schema.ts#L32)) | Spaces and symbols accepted in a unique identifier; no `maxLength` | `Input` that uppercases as you type, `maxLength={32}`, `pattern="^[A-Z0-9]+(-[A-Z0-9]+)*$"` (proposal); DTO `@Matches` | High |
| Description | `description` | `Textarea`, no max ([:131-137](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L131-L137)) | optional ≤3000 ([room-type.dto.ts:22](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L22)) | No `maxLength`; on edit an emptied description is left out of the payload ([:55](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L55)), so it **cannot be cleared** | `Textarea maxLength={3000}` with counter; send `''` (or null) when cleared | High |
| Maximum adults | `adults` → `maxAdults` | `Input type=number` 1–30 ([:155-163](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L155-L163)) | int 1–30 ([room-type.dto.ts:23](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L23)) | Matches (form key differs from DTO key, handled by double error lookup) | Keep (optional `NumberStepper`) | OK |
| Maximum children | `children` → `maxChildren` | `Input type=number` 0–30 ([:172-180](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L172-L180)) | int 0–30 ([room-type.dto.ts:24](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L24)) | Matches; child age bands not defined (spec [room-type-management.md:10](../modules/room-type-management.md#L10)) | Keep | OK |
| Total sellable rooms | `total` → `totalRooms` | `Input type=number` 0–10000 ([:189-197](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L189-L197)) | int 0–10000 ([room-type.dto.ts:27](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L27)) | Matches; 0 is allowed but blocks publishing (positive capacity required) | Keep; hint "0 = not sellable" | Low |
| Reason for update (edit only) | `reason` | `Input` text, optional ([:213-217](../../apps/admin-web/src/features/rooms/RoomTypeForm.tsx#L213-L217)) | optional 3–500 ([room-type.dto.ts:32](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L32)); **required** when `totalRooms` changes ([room-type.service.ts:71](../../apps/api/src/modules/hotels/room-type.service.ts#L71)) | Optional in UI, no length limits; the server returns a 422 surprise | `ReasonField`, required when total changes; note 3–500 | High |
| Bed configuration | `beds[]` | Not rendered | `{type: string 1–40, quantity: int 1–20}[]` ([room-type.dto.ts:14-17](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L14-L17), [:25](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L25)) | Spec field ([room-type-management.md:5](../modules/room-type-management.md#L5)); bed `type` is free string server-side | Repeater: bed-type `Select` + quantity `Input type=number` 1–20; DTO `@IsEnum(BedType)` | Medium |
| Amenities | `amenities[]` | Not rendered | `string[]` each ≤80 ([room-type.dto.ts:26](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L26)) | Spec field; no fixed list | `MultiSelect`; DTO `@IsIn(list, {each:true})` | Medium |

---

## 7. Room type quick-add from hotel workspace (`RoomCreateModal`)

Opened from the workspace "Rooms" tab ([HotelWorkspace.tsx:286](../../apps/admin-web/src/features/hotels/HotelWorkspace.tsx#L286)). Payload at [RoomCreateModal.tsx:19-25](../../apps/admin-web/src/features/rooms/RoomCreateModal.tsx#L19-L25).

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Room name | `name` | `Input` text, required ([:43-48](../../apps/admin-web/src/features/rooms/RoomCreateModal.tsx#L43-L48)) | string 2–120 ([room-type.dto.ts:20](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L20)) | No min/max; value not trimmed | Same as §6 (reuse `RoomTypeForm` fields) | Medium |
| Room code | `code` | `Input` text, mono, **no** uppercase ([:51-57](../../apps/admin-web/src/features/rooms/RoomCreateModal.tsx#L51-L57)) | as §6 | Not uppercased or trimmed client-side (server uppercases, [room-type.service.ts:35](../../apps/api/src/modules/hotels/room-type.service.ts#L35)); no pattern or max | Same as §6 | High |
| Adults | `adults` | `Input type=number` 1–30 ([:60-68](../../apps/admin-web/src/features/rooms/RoomCreateModal.tsx#L60-L68)) | int 1–30 | Matches | Keep | OK |
| Children | `children` | `Input type=number` 0–30 ([:71-79](../../apps/admin-web/src/features/rooms/RoomCreateModal.tsx#L71-L79)) | int 0–30 | Matches | Keep | OK |
| Sellable rooms | `total` | `Input type=number` 0–10000 ([:82-90](../../apps/admin-web/src/features/rooms/RoomCreateModal.tsx#L82-L90)) | int 0–10000 | Duplicates `RoomTypeForm`; no description, beds or amenities | Replace modal body with shared room-type fields | Medium |

---

## 8. Base rates (`RatesPage` → `BaseRatesView`)

Route `/admin/rates`. Payload checks at [RatesPage.tsx:79-104](../../apps/admin-web/src/pages/catalog/RatesPage.tsx#L79-L104).

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Price per night | `amountMinorUnits` | `MoneyInput` (₹, sends minor units) ([BaseRatesView.tsx:67-73](../../apps/admin-web/src/pages/catalog/views/BaseRatesView.tsx#L67-L73)) | int 0–9e12 ([base-rate.dto.ts:4](../../apps/api/src/modules/pricing/dto/base-rate.dto.ts#L4)) | Follows the money rule; ₹0 accepted by UI and API | Keep `MoneyInput`; consider min > 0 (product to confirm) | Medium |
| Currency | `currency` | `Select` of 6 hard-coded codes ([:6](../../apps/admin-web/src/pages/catalog/views/BaseRatesView.tsx#L6), [:86-90](../../apps/admin-web/src/pages/catalog/views/BaseRatesView.tsx#L86-L90)), or read-only `Input` + hidden when locked ([:82-83](../../apps/admin-web/src/pages/catalog/views/BaseRatesView.tsx#L82-L83)) | `^[A-Za-z]{3}$` ([base-rate.dto.ts:5](../../apps/api/src/modules/pricing/dto/base-rate.dto.ts#L5)) | Backend accepts codes that don't exist (`ABC`); currency is set per rate, not per hotel | Keep `Select`; DTO `@IsISO4217CurrencyCode()` or `@IsIn(allowed)`; move currency to the hotel | Medium |
| Reason for change | `reason` | `Input` text, required, `minLength=3` ([:94-99](../../apps/admin-web/src/pages/catalog/views/BaseRatesView.tsx#L94-L99)) | string 3–500 ([base-rate.dto.ts:7](../../apps/api/src/modules/pricing/dto/base-rate.dto.ts#L7)) | No `maxLength`; free text; errors only as toasts, field not highlighted | `ReasonField` (rate reason codes + note ≤500); map errors to the field | Medium |

---

## 9. Availability / inventory (`InventoryPage`, `HotelRoomPicker`, `InventoryAdjustModal`)

Route `/admin/inventory`. `HotelRoomPicker` is also used on Rates, Room types and Room type create.

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Property | hotel picker | hand-built dropdown: clickable `div` + native search `<input>` ([HotelRoomPicker.tsx:230-290](../../apps/admin-web/src/pages/catalog/components/HotelRoomPicker.tsx#L230-L290)) | n/a | Not keyboard-operable (no combobox role); native input | Shared `Combobox` (async search) | Medium |
| Room type | room select | `Select` ([:302-318](../../apps/admin-web/src/pages/catalog/components/HotelRoomPicker.tsx#L302-L318)) | n/a | Fine | Keep | OK |
| First stay date | `from` | `Input type=date` (native) ([InventoryPage.tsx:112-116](../../apps/admin-web/src/pages/catalog/InventoryPage.tsx#L112-L116)) | `YYYY-MM-DD` ([inventory.dto.ts:4](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L4)) | Native control; window is fixed at 14 nights | Shared `DatePicker` (with property-local "today") | Low |
| Block / Unblock | `action` | two toggle buttons ([InventoryAdjustModal.tsx:131-166](../../apps/admin-web/src/pages/catalog/components/InventoryAdjustModal.tsx#L131-L166)) | separate endpoints; batch uses `IsIn(['BLOCK','UNBLOCK'])` ([inventory.dto.ts:17](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L17)) | Hand-rolled segmented control | Shared `SegmentedControl` (optional) | Low |
| Quantity | `quantity` | `Input type=number` 1..available/blocked ([:178-186](../../apps/admin-web/src/pages/catalog/components/InventoryAdjustModal.tsx#L178-L186)) | int 1–10000 ([inventory.dto.ts:10](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L10)) | Matches (tighter in UI) | Keep | OK |
| Reason | `reason` | `Textarea`, required, ≥3 checked in JS ([:193-204](../../apps/admin-web/src/pages/catalog/components/InventoryAdjustModal.tsx#L193-L204), [:66](../../apps/admin-web/src/pages/catalog/components/InventoryAdjustModal.tsx#L66)) | `@IsString() @Min(3) @MaxLength(500)` ([inventory.dto.ts:11](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L11)) | **`@Min` on a string always fails**, so every block/unblock is rejected; free text; no `maxLength` | Backend `@MinLength(3)`; UI `ReasonField` (block reason codes + note ≤500) | High |
| Date range (missing) | `from` / `to` | Not rendered; only one night at a time | `BatchInventoryAdjustmentDto` ([inventory.dto.ts:14-20](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L14-L20)); endpoint exists ([inventory.controller.ts:31](../../apps/api/src/modules/inventory/inventory.controller.ts#L31)) | UI brief asks for a date-range maintenance block ([23-ui-generation-brief.md:121](../03-guidelines/23-ui-generation-brief.md#L121)) | `DateRangePicker` + quantity + `ReasonField` | Medium |

---

## 10. Sign-in and global search (`LoginPage`, `Topbar`)

| Field (label) | Form name / key | Current UI type | Backend type & validation | Issue | Recommended type | Priority |
|---|---|---|---|---|---|---|
| Work email | `email` | native `<input type=email>` with inline classes ([LoginPage.tsx:105-113](../../apps/admin-web/src/pages/auth/LoginPage.tsx#L105-L113)) | `IsEmail` ≤254 ([staff-login.dto.ts:4](../../apps/api/src/modules/auth/dto/staff-login.dto.ts#L4)) | Not the shared `Input`; no `maxLength` | Shared `Input type=email maxLength={254}` | Low |
| Password | `password` | native `<input type=password>` ([:117-125](../../apps/admin-web/src/pages/auth/LoginPage.tsx#L117-L125)) | string 12–128 ([staff-login.dto.ts:5](../../apps/api/src/modules/auth/dto/staff-login.dto.ts#L5)) | Not the shared `Input`; no `maxLength`; no show/hide | Shared `PasswordInput` (show/hide), `maxLength={128}` | Low |
| Global search | `searchQuery` | native `<input>` ([Topbar.tsx:74-80](../../apps/admin-web/src/layout/Topbar.tsx#L74-L80)); only routes to hotel search ([:28-32](../../apps/admin-web/src/layout/Topbar.tsx#L28-L32)) | hotel `search` ≤100 ([hotel.dto.ts:105](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L105)) | Placeholder promises bookings/guests; no `maxLength` | Shared `Input type=search maxLength={100}`; placeholder "Search hotels…" until other entities exist | Low |

---

## New shared components needed

`components/ui/` today has `Input`, `Select`, `Textarea`, `MoneyInput`, `Field`, `Modal` and others, but no date, checkbox, multi-value or combobox controls.

| Component | Needed by |
|---|---|
| `DatePicker` / `DateRangePicker` | Policy "Applies from" (§2); inventory "First stay date" and the new block date range (§9); hotels "Updated" filter if it gets custom dates (§4) |
| `TimePicker` (HH:mm) | Hotel check-in / check-out time (§1, new) |
| `Checkbox` (with indeterminate) / `Switch` | Media "Set as primary" (§3); hotel list row and select-all (§4); legacy `PhotoEditModal` if revived |
| `MultiSelect` / `TagInput` | Hotel amenities (§1); room amenities (§6) |
| `Combobox` (searchable, async) | Property picker in `HotelRoomPicker` (§9); City (§1); Location filter (§4); Country / Time zone if the lists grow |
| `PhoneInput` (dial code + number) | Hotel phone (§1) |
| `ReasonField` (reason-code `Select` + note `Textarea` ≤500) | Bulk status / archive / suspend (§5); room-count change (§6); rate change (§8); inventory block/unblock (§9) |
| `BedConfigField` (repeater) | Room type beds (§6, §7) |
| `PasswordInput` | Login (§10) |
| `FileDropzone` (one shared version) | Gallery upload (§3); `ImageUploadDropzone.tsx` exists but nothing imports it, so merge the two |
| `NumberStepper` (optional) | Adults, children, rooms, quantity (§6, §7, §9) |

---

## Backend changes recommended

These are recommendations only; no code was changed.

| # | Change | Location |
|---|---|---|
| B1 | `reason`: replace `@Min(3)` with `@MinLength(3)` (bug: every request fails) | [inventory.dto.ts:11](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L11), [:19](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L19) |
| B2 | Merge a partial `address` with the saved address, or make the client send every address field, so `line2` / `region` are not wiped | [hotel.service.ts:333](../../apps/api/src/modules/hotels/hotel.service.ts#L333) |
| B3 | Room type `code`: add `@Matches(/^[A-Z0-9]+(-[A-Z0-9]+)*$/i)` (proposal) | [room-type.dto.ts:21](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L21), [:34](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L34) |
| B4 | Add an optional `reasonCode` enum next to `reason` on status change, bulk status, room-type update, base rate and inventory DTOs | [status-change.dto.ts:5](../../apps/api/src/modules/hotels/dto/status-change.dto.ts#L5), [hotel.dto.ts:97](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L97), [room-type.dto.ts:32](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L32), [base-rate.dto.ts:7](../../apps/api/src/modules/pricing/dto/base-rate.dto.ts#L7), [inventory.dto.ts:11](../../apps/api/src/modules/inventory/dto/inventory.dto.ts#L11) |
| B5 | `countryCode`: `@IsISO31661Alpha2()` | [hotel.dto.ts:47](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L47) |
| B6 | `currency` (rate and fixed fee): `@IsISO4217CurrencyCode()` or `@IsIn(allowed)`; add a hotel-level currency | [base-rate.dto.ts:5](../../apps/api/src/modules/pricing/dto/base-rate.dto.ts#L5), [hotel.dto.ts:29](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L29) |
| B7 | `postalCode`: country-aware validation (IN: 6 digits) in service | [hotel.dto.ts:46](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L46) |
| B8 | `phone`: normalise to E.164 before storing | [hotel.dto.ts:52](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L52), [hotel.policies.ts:29-31](../../apps/api/src/modules/hotels/hotel.policies.ts#L29-L31) |
| B9 | Media: `url` `@IsUrl({protocols:['https']})` or `/uploads/` match; `isPrimary` `@IsBoolean()`; `media` `@ArrayMaxSize(n)`; upload restricted to jpeg/png/webp with content sniffing | [hotel.dto.ts:83-91](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L83-L91), [hotels.controller.ts:84-87](../../apps/api/src/modules/hotels/hotels.controller.ts#L84-L87) |
| B10 | `amenities` (hotel and room): `@IsIn(AMENITIES, {each:true})`, `@ArrayMaxSize` | [hotel.dto.ts:62](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L62), [room-type.dto.ts:26](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L26) |
| B11 | Bed `type`: `@IsEnum(BedType)`; `beds` `@ArrayMaxSize` | [room-type.dto.ts:15](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L15) |
| B12 | `setupStatus` query: `@IsIn(['COMPLETED','IN_PROGRESS'])` | [hotel.dto.ts:106](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L106) |
| B13 | `slug`: `@Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)` after normalisation (or keep the lenient input and document it) | [hotel.dto.ts:57](../../apps/api/src/modules/hotels/dto/hotel.dto.ts#L57) |
| B14 | Allow clearing optional text (room `description`, hotel `description`) by accepting `''` / null and unsetting | [room-type.dto.ts:35](../../apps/api/src/modules/hotels/dto/room-type.dto.ts#L35) |
| B15 | New fields when product confirms them: `checkInTime` / `checkOutTime` (`^([01]\d|2[0-3]):[0-5]\d$`), `starRating` (int 1–5 or null), `taxRegistration` | Hotel schema / DTO |

---

## Fixed option lists to define

All values marked **proposal** need product confirmation. Lists marked **from code** already exist.

| Field | Proposed values | Status |
|---|---|---|
| Hotel status | `DRAFT`, `PUBLISHED`, `SUSPENDED`, `ARCHIVED` | From code ([hotel.schema.ts:6-11](../../apps/api/src/modules/hotels/schemas/hotel.schema.ts#L6-L11)) |
| Cancellation fee basis | `NO_FEE`, `FULL_STAY`, `FIXED_MINOR_UNITS`, `PERCENTAGE_BPS` | From code ([hotel.schema.ts:58-63](../../apps/api/src/modules/hotels/schemas/hotel.schema.ts#L58-L63)) |
| Setup filter | `COMPLETED`, `IN_PROGRESS` | From code ([hotel.service.ts:80-82](../../apps/api/src/modules/hotels/hotel.service.ts#L80-L82)) |
| Country | IN, LK, NP, BD, MV, AE, SG, TH, JP, GB, FR, US, AU | From code, UI only ([hotel-options.ts:24-38](../../apps/admin-web/src/features/hotels/hotel-options.ts#L24-L38)); confirm the market list |
| Time zone | 15 IANA zones | From code, UI only ([hotel-options.ts:6-22](../../apps/admin-web/src/features/hotels/hotel-options.ts#L6-L22)); proposal: map each country to its zones |
| Rate currency | INR, USD, EUR, GBP, AED, SGD | From code, UI only ([BaseRatesView.tsx:6](../../apps/admin-web/src/pages/catalog/views/BaseRatesView.tsx#L6)); confirm |
| State / region (IN) | Indian states and union territories | Proposal; source list to be confirmed |
| Bed type | `KING`, `QUEEN`, `DOUBLE`, `TWIN`, `SINGLE`, `SOFA_BED`, `BUNK`, `FUTON` | Proposal |
| Room view (no field yet) | `CITY`, `GARDEN`, `POOL`, `SEA`, `MOUNTAIN`, `COURTYARD`, `NONE` | Proposal (field not modelled) |
| Hotel amenities | `FREE_WIFI`, `PARKING`, `POOL`, `GYM`, `SPA`, `RESTAURANT`, `BAR`, `ROOM_SERVICE`, `FRONT_DESK_24H`, `AIRPORT_SHUTTLE`, `LIFT`, `POWER_BACKUP`, `LAUNDRY`, `BUSINESS_CENTRE`, `KIDS_PLAY_AREA`, `PET_FRIENDLY`, `WHEELCHAIR_ACCESSIBLE` | Proposal |
| Room amenities | `AIR_CONDITIONING`, `TV`, `WIFI`, `MINIBAR`, `KETTLE`, `IN_ROOM_SAFE`, `BATHTUB`, `BALCONY`, `WORK_DESK`, `HAIR_DRYER` | Proposal |
| Star rating | 1, 2, 3, 4, 5, Unrated | Proposal |
| Check-in / check-out time | `HH:mm` 24 h; defaults 14:00 / 12:00 | Proposal |
| Hotel status-change reason | `SEASONAL_CLOSURE`, `RENOVATION`, `COMPLIANCE`, `OWNER_REQUEST`, `DUPLICATE_LISTING`, `CONTRACT_ENDED`, `OTHER` | Proposal |
| Room-count change reason | `ROOMS_ADDED`, `ROOMS_REMOVED`, `RENOVATION`, `CORRECTION`, `OTHER` | Proposal |
| Rate change reason | `INITIAL_SETUP`, `SEASONAL`, `DEMAND`, `CONTRACT`, `CORRECTION`, `OTHER` | Proposal |
| Inventory block reason | `MAINTENANCE`, `RENOVATION`, `OUT_OF_ORDER`, `HOUSE_USE`, `GROUP_ALLOTMENT`, `OTHER` | Proposal (spec mentions maintenance blocks: [01-product-requirements.md:33](../01-product/01-product-requirements.md#L33)) |
| Image MIME types | `image/jpeg`, `image/png`, `image/webp` | From spec ([media-management.md:9](../modules/media-management.md#L9)); code also allows gif/avif |

**Formats**

| Format | Pattern | Status |
|---|---|---|
| Hotel slug | `^[a-z0-9]+(-[a-z0-9]+)*$` | Verified against code: this is what `normalizeSlug` produces ([hotel.policies.ts:11-15](../../apps/api/src/modules/hotels/hotel.policies.ts#L11-L15)) |
| Room type code | `^[A-Z0-9]+(-[A-Z0-9]+)*$`, ≤32 | Proposal |
| India PIN code | 6 digits, first digit 1–9: `^[1-9][0-9]{5}$` | Unverified – please confirm against India Post |
| Phone (E.164) | `^\+[1-9][0-9]{1,14}$` (max 15 digits) | Unverified – please confirm against ITU-T E.164 |
| GSTIN | 15 characters: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` | Unverified – please confirm against GSTN rules |
| Currency | ISO 4217 alpha-3 | Standard; backend checks only `[A-Za-z]{3}` today |
| Country | ISO 3166-1 alpha-2 | Standard; backend checks only `[A-Za-z]{2}` today |

---

## Unused / legacy components

These components exist but no routed page reaches them (checked with an import search on 2026-10-19). They were not analysed in depth.

| File | Status | Note |
|---|---|---|
| `features/hotels/HotelForm.tsx` | Not imported | Old combined hotel form |
| `features/hotels/HotelCreateModal.tsx` | Not imported | Replaced by `/admin/hotels/new` |
| `features/hotels/HotelMediaModal.tsx` | Not imported | Replaced by `HotelMediaGalleryManager` |
| `features/hotels/PhotoEditModal.tsx` | Imported only by `HotelForm.tsx` (unused) | Caption `Input` with no `maxLength` 200; native checkbox for primary |
| `features/hotels/PhotoUploadPopup.tsx` | Imported only by `HotelForm.tsx` (unused) | `Input type=url` with no https check; caption with no `maxLength` |
| `features/hotels/workspace/HotelGeneralSection.tsx` | Not imported | Older workspace section |
| `features/hotels/workspace/HotelPolicySection.tsx` | Not imported | Older workspace section |
| `features/hotels/workspace/HotelReadinessWidget.tsx` | Not imported | Older workspace section |
| `features/hotels/workspace/HotelRoomsSection.tsx` | Not imported | Older workspace section |
| `components/ui/ImageUploadDropzone.tsx` | Not imported | Uses a native `<input type=url>`; candidate base for a shared `FileDropzone` |
| `components/ui/ConfirmDialog.tsx` | Imported only by `HotelForm.tsx` (unused) | Not a form field |

Also noted: `disableRoomType` ([rooms.api.ts:28](../../apps/admin-web/src/features/rooms/rooms.api.ts#L28)) has no UI caller, so room-type status cannot be changed from the admin UI. `Field` renders a `<label>` without `htmlFor` ([Field.tsx:25](../../apps/admin-web/src/components/ui/Field.tsx#L25)), so labels are not linked to their inputs for screen readers.

## Status update — 2026-10-19
- **Fixed:** inventory block/unblock `reason` used `@Min(3)` (numeric check), so every text reason was rejected. Now `@MinLength(3)` in `apps/api/src/modules/inventory/dto/inventory.dto.ts` (both DTOs). Verified with class-validator: old rule returned `false` for "Maintenance"; new rule accepts it and rejects reasons under 3 characters.
- **Fixed:** hotel edit no longer drops `address.line2` / `address.region`. `HotelDetailsFields` now has "Address line 2" and "State" (Indian states/UT dropdown when country is India, free text otherwise), and `readHotelDetails` sends both.

## Status update — Phase A + B implemented (2026-10-19)
Scope chosen: Phase A (validation and mismatch fixes, no new data) + Phase B (shared controls). Phase C (new data and option lists) is deferred until product confirms the lists.

**Backend**
- Room type `code`: `@Matches` letters/digits in dash groups (`DLX-K`), ≤32 (create + update).
- Room type description can be cleared (empty string → `$unset`).
- `postalCode`: India requires a 6-digit PIN (`^[1-9][0-9]{5}$`); other countries unchanged.
- `countryCode`: ISO 3166-1 alpha-2. `currency` (base rate, fixed fee): ISO 4217.
- Media `url`: `https://…` or `/uploads/<file>`; legacy `http(s)://<host>/uploads/x` is normalised to `/uploads/x`. `isPrimary`: boolean. Upload: JPEG/PNG/WebP only.
- `setupStatus`: `COMPLETED | IN_PROGRESS`. New `updatedSince` (ISO date) on `GET /admin/hotels`. New `GET /admin/hotels/cities`.
- Not changed: slug DTO stays lenient (server normalises); photo count limit (product decision).

**Frontend**
- New shared controls: `Checkbox` (indeterminate), `DatePicker`, `Combobox`, `PasswordInput`, `ReasonField`; `Textarea` gained `showCount`.
- Hotel details: email ≤254, slug pattern, description counter, PIN code rule for India, time zones filtered by country, time-zone lock hint.
- Policy: `DatePicker` with a future-date heads-up.
- Photos: shared `Input`/`Checkbox`/`Button`; https-only URLs; captions ≤200; JPEG/PNG/WebP.
- Hotels list: status options from `STATUS_LABEL`, unknown URL values ignored, page size clamped, Location `Combobox` from the cities endpoint, Updated filter wired, search ≤100, shared row checkboxes.
- Status changes: `ReasonField` required for Suspend/Archive (no more generic "Bulk X operation"); workspace Suspend asks for a reason.
- Room types: shared `RoomTypeFields` (page + quick-add modal), code uppercased as typed with pattern, name 2–120, description ≤3000 and clearable, reason required only when the room count changes.
- Rates: `ReasonField` with field-level errors. Inventory: `DatePicker`, `ReasonField`. Property picker: `Combobox` (keyboard-accessible).
- Login: shared `Input` + `PasswordInput` (show/hide). Topbar: shared search `Input`, placeholder "Search hotels…".

**Deferred (Phase C / product decisions):** reason-code dropdowns and `reasonCode` enum, amenities (`MultiSelect`), bed configuration, check-in/out (`TimePicker`), star rating, GSTIN, phone E.164 (`PhoneInput`), photo count limit, inventory date-range block, hotel-level currency, lat/long, `FileDropzone` merge, `Field` `htmlFor`.
