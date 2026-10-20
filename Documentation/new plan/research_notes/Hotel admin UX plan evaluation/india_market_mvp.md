# India-first hotel admin: compliance, payments, market and MVP sequencing (as of 20 Oct 2026)

All tax figures: **verify with a tax professional**. Many sources below are secondary (TaxGuru, ClearTax, vendor blogs). The primary CBIC notification texts were not fetched directly.

## GST on hotel accommodation (2025–2026): slabs, valuation basis, GSTIN, invoices, what to capture

### Takeaway
Since 22 Sep 2025 (the GST 2.0 rate rationalisation, 56th GST Council meeting, 3 Sep 2025), accommodation with a value of supply of ₹7,500 or less per unit per day is taxed at **5% without ITC**. Above ₹7,500 the rate is **18% with ITC**. The test uses the **actual transaction value per room per night**; the old "declared tariff" concept no longer applies. Place of supply is the hotel's location, so a hotel's own room supply is CGST+SGST even for B2B guests from other states. The admin needs a per-hotel tax profile (GSTIN, legal name, state, specified-premises flag) and must compute tax per night from the actual price charged.

### Cited Findings
- The 56th GST Council meeting (3 Sep 2025) moved hotel accommodation at or below ₹7,500 per unit per day from 12% with ITC to 5% without ITC, effective 22 Sep 2025 under Notification No. 15/2025-Central Tax (Rate). 18% is retained at ₹7,500 and above. — [TaxGuru](https://taxguru.in/?p=1031968); [A2Z Taxcorp (Lok Sabha reply)](https://a2ztaxcorp.net/lok-sabha-gst-on-hotel-accommodation-up-to-%E2%82%B97500-reduced-to-5-without-itc-to-improve-affordability-and-support-tourism/)
- The GST Council FAQs treat supplies at 5% without ITC like exempt supplies. Mixed-supply hotels must reverse ITC proportionately under Sec 17(2) CGST Act. Hotels where every room is at or below the threshold had to reverse the credit-ledger balance as on 22 Sep 2025, plus a proportionate share of credit on capital goods. — [TaxGuru GST 2.0 hotel implications](https://taxguru.in/goods-and-service-tax/gst-implication-hotel-industry-due-rate-rationalization-gst-2-0-regime.html); [Masters India](https://www.mastersindia.co/blog/gst-changes-hotel-industry-itc/)
- Industry bodies (FHRAI, HAI) object to the "without ITC" structure. In a Lok Sabha reply reported around 20 Jul 2026, the government said no review of the 5% rate is pending before the GST Council and no post-implementation assessment has been made. The rate therefore appears stable as of mid-2026 but is politically contested. — [TaxHeal / FHRAI](https://www.taxheal.com/?p=106728); [A2Z Taxcorp](https://a2ztaxcorp.net/lok-sabha-gst-on-hotel-accommodation-up-to-%E2%82%B97500-reduced-to-5-without-itc-to-improve-affordability-and-support-tourism/)
- Valuation basis: "Declared tariff" was removed, and the threshold now uses the actual selling price (value of supply) per room per night. AxisRooms tells hotel staff not to rely on the declared tariff. — [AxisRooms blog, 19 Sep 2025 (vendor)](https://blog.axisrooms.com/hotel-gst/); consistent with [Outlook Money](https://www.outlookmoney.com/tax/18-gst-for-restaurants-in-hotels-with-rs-7500-plus-tariff-industry-calls-for-rollback-ahead-of-tourist-season)
- Specified premises (from 1 Apr 2025): a hotel is a "specified premises" for a financial year if any unit's value of supply exceeded ₹7,500 per day in the preceding FY, or if it opts in. Restaurants in specified premises charge 18% with ITC; other hotel restaurants charge 5% without ITC. — [Business Today](https://www.businesstoday.in/amp/personal-finance/tax/story/18-gst-hits-hotel-restaurants-where-room-tariff-exceeds-rs-7500-per-day-check-details-470411-2025-04-02); [AxisRooms](https://blog.axisrooms.com/hotel-gst/)
- Opt-in uses Annexure VII (existing registrants) or Annexure VIII (new registrants), with a separate declaration per premises and up to 10 premises per application. It applies from the next FY until opted out via Annexure IX. — [ClearTax](https://cleartax.in/s/gst-specified-premises-hotels-annexure-vii-viii)
- Vendor advice is to invoice room and restaurant separately, because bundling can mix rate rules when the room is at or below ₹7,500. — [AxisRooms](https://blog.axisrooms.com/hotel-gst/)
- Place of supply: under IGST Act Sec 12(3), the place of supply for lodging is the location of the immovable property, which overrides the B2B/B2C rule in Sec 12(2). The guest's GSTIN does not change it, and bill-to/ship-to does not apply. An intra-state hotel therefore charges CGST+SGST. — [TaxGuru](https://taxguru.in/?p=1042484); [GST Council AAR order (Gogte Infrastructure)](https://gstcouncil.gov.in/sites/default/files/AAR/02-gogte_infrasturcture-aar-order.pdf); [GSTGyaan Sec 12 guide](https://gstgyaan.com/guide-on-section-12-of-igst-act)
- GSTIN format (15 characters):
  - Characters 1–2: state code (2011 Census codes 01–38; 97 = other territory; 99 = centre jurisdiction).
  - Characters 3–12: the entity's PAN.
  - Character 13: entity number within the state (1–9, then A–Z).
  - Character 14: "Z" for regular taxpayers. Other values are used for special types such as TDS/TCS.
  - Character 15: check digit, computed with Luhn mod 36.
  - Example: 27ABCDE1234F1Z5 (Maharashtra).
  — [GSTIN-Validator (GitHub)](https://github.com/Devil7-Softwares/GSTIN-Validator); [GSTZen](https://www.gstzen.in/?p=3681); [TaxGuru GSTIN structure](https://taxguru.in/goods-and-service-tax/gstin-goods-and-service-tax-identification-number-structure.html)
- Tax invoice contents (CGST Rule 46):
  - Recipient GSTIN/UIN only if the recipient is registered (clause d).
  - Unregistered recipient with taxable value ₹50,000 or more: name, address, and state name and code are mandatory (clause e). Below ₹50,000, these are recorded only on request (clause f).
  - HSN/SAC code is required (clause g).
  — [CBIC Rule 46](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html)

### Inferences
- Tax cannot be a static per-hotel or per-room-type field. Each night's rate must be classified at quote time from the actual price after discounts: ≤ ₹7,500 → 5%, > ₹7,500 → 18%. A dynamically priced room type can cross the slab on different nights. Store the rate applied per night line in minor units, and snapshot it on the booking.
- Required tax-profile fields per hotel:
  - GSTIN, validated by format, state-code match to the hotel's state, and checksum
  - Legal name and trade name
  - Registered address and state code
  - SAC for accommodation: 996311, under heading 9963 (not confirmed in fetched sources; verify)
  - Specified-premises status per FY
  - Invoice series prefix, which must be sequential per FY
- Guest-side B2B capture is a booking-time field: guest company GSTIN plus legal name. It lets corporate guests claim ITC where eligible, mainly at 18%.
- Because the room-rate slab drives restaurant tax status for the next FY, a "previous-FY max room value" report is useful for compliance.
- A "Tax & billing" section with GSTIN is correctly in scope for an India-first admin. It is a hotel-setup prerequisite for issuing invoices, but not for taking holds.

### Gaps
- Primary text of Notification 15/2025-CT(Rate), and the exact definition of "per unit per day" (extra beds, meal plans in the tariff, and how multi-night discounts are allocated) were not fetched.
- Whether accommodation under ₹1,000 per day remains exempt after Sep 2025 was not confirmed by any fetched source. Verify.
- E-invoicing (IRN) applicability to hotels and its current AATO threshold (believed ₹5 crore) were not confirmed. HSN/SAC digit requirements by turnover were not confirmed.
- OTA (ECO) tax-collection rules for bookings via MMT and others under Sec 9(5) were not researched.

## Other India compliance: guest ID / Form C (now Form-III), local police, DPDP Act and retention

### Takeaway
The Immigration and Foreigners Act, 2025 and its Rules (in force from 1 Sep 2025) replaced Form C with **Form-III**. Hotels must electronically report each foreign guest within 24 hours of arrival and keep arrival/departure records electronically for at least one year. Many districts separately require ID verification and guest registers for Indian guests, sometimes through state police software (e.g., PATHIK in Goa). DPDP Rules were notified in Nov 2025, with most obligations phased in by about May 2027.

### Cited Findings
- Form-III replaced Form 'C' under the Immigration and Foreigners Act, 2025 and Rules, effective 1 Sep 2025. Rule 17(5) requires the keeper to electronically transmit Form-III to the Registration Officer through the designated portal or app. Guest records must be kept electronically for at least one year. — [Morung Express (Dimapur Police directive)](https://morungexpress.com/dimapur-police-issues-directive-on-foreigners-registration-compliance); [NE Now](https://nenow.in/north-east-news/nagaland/nagaland-accommodation-providers-directed-to-report-foreign-arrivals-within-24-hours.html); [Goa govt notice, Dec 2025](https://www.goa.gov.in/wp-content/uploads/2025/12/ONLINE-FILLING-OF.pdf)
- Coverage includes hotels, guest houses, hostels, homestays, dharamshalas, hospitals and others. — [Morung Express](https://morungexpress.com/dimapur-police-issues-directive-on-foreigners-registration-compliance); [india.gov.in Online Form C](https://www.india.gov.in/online-form-c-bureau-immigration)
- Penalty figures conflict: ₹50,000 per unreported guest per a Goa press report, versus ₹1 lakh per case per a Goa government notice. — [Herald Goa](https://www.heraldgoa.in/?p=457029); [Goa govt notice](https://www.goa.gov.in/wp-content/uploads/2025/12/ONLINE-FILLING-OF.pdf)
- Typical Form C attachments are the passport photo page and visa. Airbnb advises filing at check-in and again at check-out, and requires prior FRRO registration of the accommodation. This guidance predates Form-III. — [Airbnb help (India)](https://www.airbnb.co.in/help/article/1641)
- Local orders on Indian guests:
  - North Goa DM (Mar 2025) requires ID verification (EPIC, DL, Aadhaar or passport) and guest forms submitted to the police. South Goa (Jan 2025) requires entry into the PATHIK police software. — [Goa DM order Mar 2025](https://www.goa.gov.in/wp-content/uploads/2025/03/DM-NORTH-ORDERS.pdf); [Goa DM order Jan 2025](https://www.goa.gov.in/wp-content/uploads/2025/01/DM-ORDERS-TENANT.pdf)
  - Jalandhar's police commissioner order requires self-attested photo ID, mobile verification and daily reports. — [Tribune India](https://www.tribuneindia.com/news/jalandhar/operation-sindoor-police-up-surveillance-in-jalandhar)
  - Nagaland Police launched a Hotel Registration App with OTP verification (Sep 2025). — [Morung Express](https://mail.morungexpress.com/nagaland-police-launches-apps-for-tenant-and-hotel-guest-registration)
- DPDP Rules notified Nov 2025, in three phases:
  - Rules 1, 2 and 17–21 (Data Protection Board): immediate.
  - Rule 4 (Consent Managers): about 13 Nov 2026.
  - Rules 3, 5–16, 22 and 23 (notice, security, breach, retention/erasure, etc.): 18 months, about 13–14 May 2027. Sources differ by a day.
  — [Storyboard18](https://www.storyboard18.com/amp/digital/breaking-govt-notifies-final-dpdp-rules-sets-staggered-rollout-with-key-obligations-for-data-fiduciaries-84201.htm); [AMS Shardul](https://www.amsshardul.com/insight/enforcement-of-the-dpdp-act-and-notification-of-the-dpdp-rules/); [Hogan Lovells](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-); [TCSA roadmap](https://www.tcsa.in/resources/dpdp-rules-2025-implementation-roadmap)
- Retention: personal data must be erased when consent is withdrawn or the purpose is no longer served, whichever is earlier, unless another law requires retention. Rule 8 covers erasure of data and logs. Processors and backups are in scope. — [KS&K](https://ksandk.com/data-protection-and-data-privacy/data-retention-deletion-dpdp-act-india/); [Mondaq](https://www.mondaq.com/data-retention-and-deletion-under-the-dpdp-act-how-long-can-businesses-retain-personal-data-in-india/1844062)

### Inferences
- The Form-III 24-hour filing and the 1-year electronic record are a check-in (front-desk) feature, not a booking feature. Booking-stage MVP needs only the guest name, phone/email and nationality. A "foreign guest arrivals pending Form-III" item is a strong candidate for a Today dashboard, but only after check-in exists.
- ID document images (Aadhaar, passport) are high-risk personal data. Capture them at check-in, with purpose-limited retention, and mask Aadhaar numbers. Designing retention fields, consent notice and an erasure path now avoids rework before May 2027. Tax law requires keeping invoices for years, so invoice data has a legal-retention exception, while ID scans may not.
- Local police requirements vary by district. A configurable guest-register export (CSV/print) is more realistic than integrating state police systems.

### Gaps
- No official BoI/Gazette text of the Immigration and Foreigners Rules 2025 was fetched. The exact Form-III fields and check-out filing rule are unconfirmed.
- Aadhaar masking rules (UIDAI) for hotels and any national rule on Indian guest IDs were not researched. No single national rule was found; requirements are district orders.
- The specific DPDP retention period for hospitality data was not found. The Rules' Third Schedule mainly covers large e-commerce, gaming and social platforms (from memory; not verified).

## Payments: UPI, pay-at-hotel, partial prepayment, payment links, refunds, gateway hold/authorisation

### Takeaway
Indian gateways support authorise-then-capture. Razorpay manual capture auto-refunds uncaptured payments after up to 5 days (some docs say 3). Cashfree pre-auth works on cards and UPI, with partial capture and a 7-day automatic release. Neither window covers a typical booking-to-check-in gap, so "pay at hotel with card guarantee" in the Western sense is impractical. India-first designs use full or partial prepayment (UPI/payment link) or a pure pay-at-hotel booking with policy-driven risk. Normal refunds take about 5–7 working days. Regulated UPI failure reversal is T+1.

### Cited Findings
- Razorpay capture can be automatic or manual, configurable per order. Payments left in "authorized" beyond the manual-capture window are auto-refunded. The API docs give a default and maximum window of 7,200 minutes (5 days); some dashboard docs say 3 days. Normal refunds reach customers in 5–7 working days. — [Razorpay capture settings (API)](https://razorpay.com/docs/payments/payments/capture-settings/api/); [Razorpay capture settings](https://razorpay.com/docs/payments/payments/capture-settings/); [Razorpay capture & refund settings](https://razorpay.com/docs/payments/optimizer/capture-refund-settings/)
- Cashfree pre-auth:
  - Supported on Visa/Mastercard cards and UPI.
  - Allows full or partial capture, or void. Each authorisation can be captured or voided only once.
  - Authorisations not captured within 7 days are automatically released.
  - Uses the `/pg/orders/:order_id/authorization` endpoint with action CAPTURE or VOID.
  — [Cashfree pre-authorisation docs](https://www.cashfree.com/docs/payments/features/pre-authorisation); [Cashfree preauth journey](https://www.cashfree.com/docs/api-reference/payments/preauth-journey)
- RBI TAT harmonisation (RBI/2019-20/67, 20 Sep 2019) sets turnaround times and compensation for failed transactions. For UPI, NPCI requires the remitter bank to reverse failed debits within T+1, with compensation after that. For merchant non-fulfilment, the acquirer must raise a credit adjustment within T+4 calendar days. The ₹100/day compensation after T+5 applies to ATM failures. No post-2019 revision appeared in search. — [RBI notification 3074](https://rbi.org.in/commonman/English/scripts/Notification.aspx?Id=3074); [NPCI circular OC-93](https://www.npci.org.in/PDF/npci/imps/circular/2019/IMPS-UPI-I-OC-93-I-FY-19-20-I-Harmonisation-of-Turn-Around-Time(TAT)-and-customer-compensation-for-failed-transaction.pdf)
- Common reasoning in system-design references: payments must be idempotent, using an idempotency key per booking attempt, and a payment failure should release the hold. — [DesignGurus](https://www.designgurus.io/answers/detail/what-to-expect-in-the-booking-com-system-design-interview); [techinterview.org](https://www.techinterview.org/post/3233460029/design-a-hotel-airbnb-reservation-system/)

### Inferences
- A 10-minute staff hold is consistent with gateway behaviour. A UPI collect or intent flow completes within minutes. A payment link sent to a guest by WhatsApp or SMS may take longer, so the hold TTL for "awaiting payment link" may need to be longer (e.g., 30–60 min) or configurable per channel. System-design sources cite about 30 minutes for hotels.
- Payment status must be its own state machine: created / authorised / captured / failed / refunded / partially refunded. It should be separate from booking status. That matches the project's decoupling rule and handles gateway auto-refunds of uncaptured payments arriving as webhooks.
- MVP payment modes:
  1. Pay at hotel: no gateway, so a confirmed booking with balance due, recorded offline (cash/UPI QR/card at desk).
  2. Full prepay.
  3. Partial prepay (deposit percentage or first night), with the balance at the hotel.
  Card pre-auth is a later feature because of the 5–7 day windows.
- Refunds should be shown with an expected timeline of about 5–7 working days, tied to the cancellation policy already built.

### Gaps
- PayU pre-auth and payment-link specifics were not found. Razorpay's UPI manual-capture support is unconfirmed.
- The RBI Payment Aggregator directions on merchant-initiated refunds (refund to the original payment method, timelines) were not fetched.
- UPI Reserve Pay / single-block-multiple-debit (UPI "block" mandates) was not researched. It might enable hotel deposits.

## Indian independent hotel market and tools

### Takeaway
Small Indian hotels typically run an OTA extranet app (MakeMyTrip/Goibibo "Connect", formerly InGo-MMT), a budget PMS (eZee, Hotelogix, StayFlexi and others) and a channel manager (AxisRooms, STAAH, eZee Centrix). OTA commissions are high (about 15–30%). Pain points are multi-property management, timely data, reconciliation and cost. Mobile-first operation and Indian-language support are visible in competitor apps. Hard adoption data is scarce and mostly comes from vendors.

### Cited Findings
- MMT's partner app, Connect (formerly InGo-MMT), lets hotels and homestays list on MakeMyTrip and Goibibo. Owners can update prices daily or in bulk, block or unblock dates, set restrictions, and sync with other OTAs via a calendar that avoids double bookings. — [App Store: Connect (formerly InGoMMT)](https://apps.apple.com/qa/app/connect-formerly-ingommt/id1019426231)
- OYO's in-house property app Krypton supports 12 Indian languages. — [MultiLingual](https://multilingual.com/?p=93899)
- Channel managers marketed to Indian independents:
  - eZee Centrix: budget option, paired with eZee PMS.
  - STAAH: easy onboarding, broad OTA coverage.
  - AxisRooms: India-first, with deep MMT/Goibibo/Agoda/Booking integrations.
  These descriptions come from AxisRooms' own blog and are biased. — [AxisRooms best channel manager India 2026](https://blog.axisrooms.com/best-channel-manager-india/); [AxisRooms eZee Centrix alternatives](https://blog.axisrooms.com/ezee-centrix-alternatives/)
- OTA commissions in India are roughly 15–30% of reservation value, and reconciliation errors grow with volume. — [AxisRooms OTA reconciliation guide](https://blog.axisrooms.com/hotel-ota-reconciliation-india/)
- Hotelogix survey (about 200 Indian hotel companies, six cities; vendor-run):
  - About 32% cite occupancy/revenue as the top challenge, down from 60%.
  - 45% of chains struggle to manage multiple properties.
  - About 23% lack timely access to data.
  - About 64% plan to adopt cloud PMS within a year.
  — [Hospitality Technology](https://hospitalitytech.com/learn-top-hotel-tech-challenges-pain-points-and-priorities-indian-hoteliers)
- Small independents often find technology too costly to integrate, and lean teams need simple tools (Expedia survey, 2019, global). — [Skift](https://skift.com/2019/11/11/how-small-independent-hotels-are-using-tech-to-be-more-competitive/)

### Inferences
- The incumbent extranet already gives owners a mobile rate/inventory calendar. A new admin must at least match "update price / block dates from a phone". A responsive Rooms & rates calendar grid matters more than desktop dashboards.
- The 45% multi-property pain point supports a global hotel switcher, but most small Indian hotels are single-property. The switcher should be lightweight and hidden when the user has only one hotel.
- Without channel-manager integration, direct bookings on this platform risk overbooking against OTA sales. Manual "block dates/close-out" controls are an MVP must.

### Gaps
- No independent market-share data was found for Indian PMS/channel managers. Hotelogix, StayFlexi and OYO OS specifics were not verified, and "MyGate" is a residential-society app, not hotel software (from general knowledge; not sourced).
- No quantitative data on mobile vs desktop use or language preferences among Indian hoteliers.

## MVP sequencing: what must exist before bookings go live, and the risk of dashboards before data

### Takeaway
Before bookings go live, the platform needs:
- authoritative nightly inventory with an atomic decrement (check-and-insert in a single transaction)
- TTL holds with background expiry
- idempotent booking and payment endpoints
- server-side pricing snapshots
- explicit overbooking policy and manual close-outs
- confirmation notifications

Dashboards and reports depend on booking and payment records. Built first, they show empty or fake states and encode unvalidated metrics.

### Cited Findings
- Booking writes need strong consistency, with availability checked and the booking inserted atomically. Count-based inventory can use a conditional update ("decrement if remaining ≥ n") with retry or sold-out on conflict. — [techinterview.org hotel design](https://www.techinterview.org/post/3233460029/design-a-hotel-airbnb-reservation-system/); [techinterview.org LLD booking](https://www.techinterview.org/post/3233473163/lld-booking-reservation-system/)
- Holds: a holds table with expiry, valid holds counted as unavailable, expiry via a background job or TTL. Typical windows are about 10–15 minutes for flights and about 30 for hotels. Payment failure releases the hold. — [techinterview.org](https://www.techinterview.org/post/3233460029/design-a-hotel-airbnb-reservation-system/)
- Search may use a slightly stale index, but booking must go against the authoritative store. — [System Design Space](https://system-design.space/en/chapter/hotel-booking-case/); [DesignGurus](https://www.designgurus.io/answers/detail/what-to-expect-in-the-booking-com-system-design-interview)
- Controlled overbooking is an explicit business decision with limits. Counters, confirmation and cancellation must be designed together, and walk incidents should be logged. — [System Design Space](https://system-design.space/en/chapter/hotel-booking-case/)

### Inferences
- Recommended order for the proposed plan, given what exists today (hotels, room types, base rates, nightly inventory, policies, publish readiness):
  1. Rooms & rates calendar grid with close-outs. This is the inventory truth and India's baseline expectation.
  2. Holds (TTL, Mongo transaction decrementing nightly inventory, idempotency key) plus staff booking creation (pay-at-hotel first).
  3. Bookings list with booking detail and status transitions (cancel per policy, no-show).
  4. Notifications: guest SMS/WhatsApp/email confirmation. India leans on WhatsApp/SMS (inferred; not sourced here).
  5. Payments (payment links/UPI prepay, webhooks, refunds) on a separate state machine.
  6. Tax & billing profile (GSTIN), then GST invoice generation per night slab.
  7. Today dashboard (arrivals, departures, pending payments, pending Form-III).
  8. Reports.
- The tax profile can be captured earlier as part of hotel setup or publish readiness, because GSTIN is static. Invoice generation should wait for bookings and payments.
- Building the Today dashboard before bookings risks empty widgets, invented metrics and rework once real booking/payment schemas settle. Build a minimal shell only, or defer it.
- The booking calendar grid (room types × nights, showing sold/held/available) is the same data structure as the inventory grid. Sharing one component reduces scope.

### Gaps
- No authoritative industry source (e.g., Hotel Tech Report) on the MVP feature order for booking platforms was found. The sequencing above is inference from engineering references and India market findings.
- No source quantifies the risk of dashboards-first. That point is reasoning, not cited evidence.
