# Verify: 20261019-hide-archived-hotels
| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | No status → archived excluded | PASS | Local DB (7 DRAFT, 5 ARCHIVED): new filter returns 7 |
| 2 | status=ARCHIVED → only archived | PASS | returns 5 |
| 3 | setupStatus ANDed with status | PASS | IN_PROGRESS default → 7; IN_PROGRESS+ARCHIVED → 5; COMPLETED+DRAFT → 0 |
| 4 | UI default hides archived; Archived filter shows them | NOT RUN (browser) / PASS (code) | filter sends `status=ARCHIVED`; default omits status |
| 5 | Builds + tests | PASS | api build, admin build, `jest` 4 suites / 10 tests passed |
Overall: PASS.
