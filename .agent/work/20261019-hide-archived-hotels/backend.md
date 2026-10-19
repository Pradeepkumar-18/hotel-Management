# Backend Report: 20261019-hide-archived-hotels
- File: `apps/api/src/modules/hotels/hotel.service.ts` `list()`.
- Status conditions are now an `$and`: explicit `status` or `{ $ne: ARCHIVED }`, plus the `setupStatus` condition (previously `setupStatus` overwrote `status`).
- Contract unchanged (same query params and response). Metrics endpoint unchanged.
- Build: `npm --workspace=apps/api run build` PASS.
