# Backend: 20261019-field-types-phase-ab
- dto/hotel.dto.ts: IsPostalCodeForCountry (IN), IsISO31661Alpha2, IsISO4217CurrencyCode (fee), media url Transform + Matches, IsBoolean isPrimary, setupStatus IsIn, updatedSince IsDateString.
- dto/room-type.dto.ts: ROOM_CODE Matches (create/update). pricing/dto/base-rate.dto.ts: IsISO4217CurrencyCode.
- hotel.service.ts: updatedSince filter; listCities(). hotels.controller.ts: GET cities; upload mimetype jpeg/png/webp.
- room-type.service.ts: empty description → $unset.
- Build PASS; jest 4 suites / 10 tests PASS.
