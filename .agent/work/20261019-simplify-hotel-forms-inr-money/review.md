# Domain Review: Task 20261019-simplify-hotel-forms-inr-money

Verdict: **APPROVED** (minor notes)

- Money: client converts major → minor exactly (string arithmetic, `Number.isSafeInteger`); server still validates integer minor units and owns pricing. No client-side price/tax computation. ✔
- Policy fee currency no longer typed: uses saved currency, else INR. For a hotel whose rates are in another currency and has no saved fixed fee, the server's publish check (fee currency must match rate currency) still catches the mismatch. Minor.
- Optimistic `version` sent on every mutation; conflict message unified. ✔
- Archived read-only is UI-only; `HotelService.update` has no status guard (pre-existing gap, separate backend task). Minor.
- ADR-006 (single launch currency) still Proposed; implementation stays currency-aware, INR only as default. ✔
