# Frontend: 20261019-field-types-phase-ab
- New shared: components/ui/{Checkbox,DatePicker,Combobox,PasswordInput,ReasonField}.tsx; Textarea `showCount`; features/rooms/RoomTypeFields.tsx.
- Changed: HotelDetailsFields, hotel-options (country→time zones, postal rules), CancellationPolicyFields (DatePicker), HotelMediaGalleryManager, HotelWorkspace (suspend reason), BulkStatusConfirmModal (ReasonField), HotelsPage + HotelFiltersBar + hotels.api (cities, updatedSince, clamps, Checkbox), Pagination (Select), RoomTypeForm, RoomCreateModal, BaseRatesView + RatesPage (ReasonField, field errors), InventoryPage (DatePicker), InventoryAdjustModal (ReasonField), HotelRoomPicker (Combobox), LoginPage (Input, PasswordInput), Topbar (Input).
- tsc -b clean; build PASS.
