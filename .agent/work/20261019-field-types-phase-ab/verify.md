# Verify: 20261019-field-types-phase-ab
| Check | Result | Evidence |
|---|---|---|
| API build + jest | PASS | 4 suites / 10 tests |
| Admin tsc -b + vite build | PASS | 0 errors |
| DTO unit checks (class-validator) | PASS | PIN ok/bad, GB postcode ok, XX country rejected, legacy upload URL normalised, http external rejected, isPrimary string rejected, DLX-K ok / "DLX K!" rejected, inr ok / ABC rejected, setupStatus FOO rejected |
| Live API (local, no data saved) | PASS | GET cities 200; default list 7; updatedSince 24h → 1; setupStatus=FOO 400; bad PIN 400 field `address.postalCode`; country XX 400; http media 400; bad room code 400 field `code` |
| Browser UI | NOT RUN | manual checks listed in the completion report |
Data note: one local DRAFT hotel has PIN "7127171" and will need a valid PIN on next save.
