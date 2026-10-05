# AI Features — Later Considerations

AI is not part of the booking MVP. Availability, quoted price, payment, cancellation eligibility and refunds must remain deterministic domain logic.

Possible later assistive features:

- Search query suggestions and multilingual query understanding.
- Draft hotel descriptions from operator-provided facts, with human review.
- Review theme summaries that link back to original reviews and avoid unsupported claims.
- Support-agent answer drafting from approved policy documents.

Before use, define consent, data handling, evaluation, error reporting and human override. Do not send sensitive guest details to a model without an approved privacy and security review. AI output must never directly change inventory or execute a refund.
