# Verification 20261016-restore-hotel-lifecycle-actions

| # | Acceptance criterion | Method | Result (PASS/FAIL/NOT RUN) | Evidence |
|---|---|---|---|---|
| 1 | DRAFT hotel shows "Publish Property" in header toolbar | Code inspection (`HotelEditPage.tsx`) | PASS | Conditional render `{hotel.status === 'DRAFT'}` with `publishHotel` handler and `<Can permission="hotels.publish">` |
| 2 | PUBLISHED hotel shows "Suspend" with `ConfirmDialog` | Code inspection (`HotelEditPage.tsx`) | PASS | Conditional render `{hotel.status === 'PUBLISHED'}` opening `ConfirmDialog` and calling `suspendHotel` |
| 3 | SUSPENDED hotel shows "Reactivate Property" | Code inspection (`HotelEditPage.tsx`) | PASS | Conditional render `{hotel.status === 'SUSPENDED'}` with `publishHotel` handler |
| 4 | Non-archived hotel shows "Archive" with `ConfirmDialog` | Code inspection (`HotelEditPage.tsx`) | PASS | Conditional render `{hotel.status !== 'ARCHIVED'}` opening `ConfirmDialog` and calling `archiveHotel` |
| 5 | `npm run build:admin` compiles cleanly with zero TypeScript/Vite errors | CLI execution | PASS | Exit code 0, 1976 modules transformed, dist built in 3.86s |
| 6 | `npm run build:api` compiles cleanly | CLI execution | PASS | Exit code 0, Nest build completed |

## Command output (trimmed)

```
> @staywise/admin-web@0.1.0 build
> tsc -b; vite build

vite v8.3.2 building client environment for production...
transforming...
✓ 1976 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:   0.31 kB
dist/assets/index-Pf_JLndC.css   74.86 kB │ gzip:  12.47 kB
dist/assets/index-CoAfhcYr.js   413.74 kB │ gzip: 122.01 kB
✓ built in 3.86s
```

```
> @staywise/api@0.1.0 build
> nest build
```

## Failures → owner
None.

## Overall: PASS
