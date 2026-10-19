# Review: 20261019-field-types-phase-ab
Verdict: APPROVED. Server stays authoritative; client limits mirror DTOs. Validation tightening only affects new writes. Archived hotels excluded from cities. Minor: ISO currency validation means non-ISO codes previously stored would be rejected on next rate save (none in local data).
