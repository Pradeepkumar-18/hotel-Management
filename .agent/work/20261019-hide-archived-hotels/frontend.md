# Frontend Report: 20261019-hide-archived-hotels
- `pages/hotels/components/HotelFiltersBar.tsx`: default option renamed "All (excluding archived)"; "Archived" option unchanged and now the only way to list archived hotels.
- `pages/hotels/HotelsPage.tsx`: Active total = published + draft + suspended (from metrics).
- `pages/hotels/components/HotelSummaryCards.tsx`: "Total Hotels" → "Active Hotels"; Archived card detail points to the filter.
- Side effect (intended): `HotelRoomPicker` (room types / rates / inventory) and dashboard recent hotels no longer list archived hotels.
- Build: `npm run build:admin` PASS.
- Manual check: open `/admin/hotels` → no Archived rows; Status = Archived → only archived rows; Active Hotels card excludes archived.
