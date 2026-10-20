# OTA Extranet and Vacation-Rental Platform Patterns: Property Onboarding, Content, Rooms/Rates/Availability

Research date: 2026-10-20. Source caveat: official partner help centres (Booking.com Partner Hub, Expedia Partner Central help, InGo-MMT/Connect help, Airbnb Help Center) often block fetches or require login. Many findings therefore come from developer docs, official Partner Hub pages that could be fetched, and channel-manager/PMS help centres. Each finding says which kind of source it comes from. Vendor blog claims (SmartOrder, Guesty blog, Axis Rooms) are labelled as secondary.

Plan under evaluation:
- A short "add hotel" step, then a 5-step setup checklist (hotel & photos, room types, rates, availability, cancellation) that gates Publish.
- An Overview tab for live properties.
- A Rooms & rates table with health badges (Bookable / Missing price / No open dates / Disabled).
- Content sections: details, contact & location with map pin, photos with categories, amenities, policies, tax & billing.

## Q1. Onboarding steps, required vs optional content before going live, and completeness scores

### Takeaway
Every major OTA splits work the same way. Registration and go-live gating covers a minimal set: legal/contract, basic property data, rooms, rates, a default cancellation policy, and payout/finance. After that comes a separate, continuous completeness score (Booking.com "Property page score", Agoda/Expedia "Content Score") that is never a gate. It is a 0–100% to-do list of missing items, each with an action. The proposed design (a hard 5-step checklist gating Publish, plus soft health signals afterwards) matches this two-tier pattern closely.

### Cited Findings
**Booking.com**
- Registration starts at join.booking.com ("List your property"). It covers property details, amenities, photos, pricing & availability and policies. After that comes KYP (Know Your Partner) verification and a final "make my property live/bookable" action. Source: third-party guide, 2026. — [Axis Rooms](https://www.axisrooms.com/?p=15882)
- Booking.com reviews the completed registration and then emails the partner Extranet access, where rates and availability are set. Partners are advised to use the preview function before going live. — [Little Hotelier](https://www.littlehotelier.com/blog/get-more-bookings/how-list-property-booking-com/)
- A listing created via a channel manager starts unpublished. Guests can't see it until the owner (1) publishes it, (2) signs the partner agreement, and (3) sets up finance details. Some property types (apartments, holiday homes, villas) default to request-to-book. — [Hospitable help centre](https://help.hospitable.com/en/articles/11593986-creating-a-booking-com-listing-on-hospitable)
- Connectivity onboarding sequence (NextPax guide, published 30 July 2026):
  1. Account setup.
  2. Partner/contract setup: legal-entity form, contract sent for signature, "Awaiting signature" status.
  3. Channel settings. Mostly optional, but payout fields become required if Payments by Booking.com is on.
  4. Policy: choose a standard cancellation policy and save it as default. The step "is complete once a default is set".
  5. Promotions (optional).
  6. Rate plans explicitly assigned to Booking.com.
  7. Enable channel and enable properties.
  — [NextPax](https://support.nextpax.com/booking.com-onboarding-partner-guide)
- **Property page score** (official developer docs): a 0–100% "quality of the property content" score. The breakdown returns a `metrics` array where each item has `done: 1|0` and an `action` string, so the response doubles as a to-do list. The API also returns an `area_average_score` for benchmarking against nearby properties. Sample metrics:
  - Upload at least 10 property photos, high-quality photos, a swimming pool photo, an exterior photo, and bathroom photos for active rooms.
  - Bed sizes, room sizes and room amenities for active rooms.
  - Languages spoken, key collection info, surrounding area info, and directions/transport.
  — [Booking.com Connectivity docs – Property scores](https://developers.booking.com/connectivity/docs/property-scores-api/property-scores)
- Third-party guides say listings at 100% page score get "up to 18% more bookings" and that the score is not shown to guests. Not verified against a Booking.com primary source. — [Smoobu](https://support.smoobu.com/hc/en-us/articles/35769354080530-How-do-I-improve-my-Booking-com-Property-page-score); [NextPax](https://support.nextpax.com/booking.com-property-page-scores-advice)

**Expedia Group**
- Partner Central has a **Content Score**: an overall score plus sub-scores for property & room amenities, photo gallery, and guest requirements. It is based on traveller search data and surveys. One source places it under Property Details. A May 2026 vendor article points instead to a Visibility/Performance page, which is unconfirmed. Secondary sources. — [Houst](https://houst.com/blog/expedia-partner-central); [SmartOrder](https://www.smartorder.ai/resources/blog/expedia-ranking-tips-for-hotels/)
- Expedia's official Property API docs: room types and rate plans cannot be added until the property reaches "Onboarding Succeeded" status. Property comes first, then rooms and rates, which validates sequencing "add hotel" before rooms. The Property API is closed to new adopters. — [Expedia Group Developer – Property API](https://developers.expediagroup.com/supply/lodging/docs/property_mgmt_apis/property/getting_started/introduction)
- A vendor blog says Expedia ranking uses a "quality score" that includes listing completeness, cancellation rate and competitiveness. Secondary. — [Guesty blog](https://www.guesty.com/blog/how-to-rank-higher-on-expedia)

**Agoda (YCS)**
- Official Agoda Content Score guideline (PDF, undated): the score is "the overall measure of content health for your property listing". It has four elements: property-level content, room-level content, property & room photos, and child policy. Agoda says "more complete content leads to higher conversion, and fewer customer complaints". — [Agoda Content Score Guideline PDF](https://ycs.agoda.com/content/agoda-content-score-guideline.pdf)
- Partner Hub gives weights: property photos 45%, room photos 25%, property facilities 15%, room facilities 10%, star rating 2%, age policy 3%. Location: YCS → Performance → Analytics → Content Score. The weights page returned 403 to direct fetch, so this comes from the search snippet. — [Agoda Partner Hub – How to improve your content score](https://www.partnerhub.agoda.com/how-to-improve-your-content-score)
- Facilities are tri-state: grey = missing, green tick = yes, red cross = no. Only explicit yes/no counts toward the score; blanks are "incomplete". This is a useful pattern because it distinguishes "not answered" from "not available". — [Agoda guideline PDF](https://ycs.agoda.com/content/agoda-content-score-guideline.pdf)

**Airbnb**
- Pre-publish requirements according to channel managers (they conflict):
  - Avantio: at least 7 photos (min 1024×683), a description of at least 50 characters, at least 5 amenities, a title of 8–50 characters, and at least 30 available days within 12 months. Listings that fail are "automatically rejected".
  - iGMS: publishing needs "all five check marks green" in the listing editor and 7 photos.
  - Other sources say 5 photos.
  — [Avantio](https://support.avantio.com/en/articles/419305-minimum-requirements-airbnb); [iGMS](https://help.igms.com/en/articles/9927715-how-to-create-an-airbnb-listing-on-igms)
- The final step is preview, then "Publish". — [SmartOrder](https://www.smartorder.ai/blog/how-to-list-your-property-on-airbnb/)

**MakeMyTrip / Goibibo (InGo-MMT, now "Connect by MakeMyTrip")**
- The official partner app (formerly InGo-MMT) lets partners list a property, upload photos, add amenities and descriptions, and "manage hotel listing quality and ensure complete registration". A newer home screen for newly onboarded properties offers "key tasks to make your property guest-ready and improve listing quality". This is a new-vs-live home-screen split. — [App Store – Connect by MakeMyTrip](https://apps.apple.com/us/app/-/id1019426231)
- Via channel manager (Rentals United): properties pass a content-quality check against MMT listing requirements, then markup is set and the listing is published. MMT builds the listing within 3 business days. — [Rentals United docs](https://docs.rentalsunited.com/hc/en-gb/articles/36963310990749-Adding-new-listing-to-MakeMyTrip)
- Channel mapping needs a direct MMT contract and an MMT Hotel ID, with a test-connection step. — [Channex](https://docs.channex.io/channel-mapping-guides/mmt)

**OYO**
- The OYO OS / Co-OYO partner apps focus on pricing within a band, inventory blocking and booking modifications. Details are under Q3. No public step-by-step onboarding guide was found.

### Inferences
- Industry practice uses a **hard gate** for things that make a property legally and commercially bookable: contract/finance, rooms, at least one rate, a default cancellation policy, and open inventory. It uses a **soft score** for richness: photo count and types, facilities, languages, local info, child policy. The proposed 5-step gate maps to the hard tier. Consider adding a separate post-publish "content completeness" percentage with per-item actions, modelled on Booking.com's `done`/`action` metrics, instead of putting richness items in the gate.
- Booking.com's NextPax flow treats "cancellation policy set as default" as a discrete completion step. This supports cancellation as its own checklist step.
- Tax/billing/payout is part of go-live gating at Booking.com (finance details, Payments by Booking.com). The plan places tax & billing in content sections rather than the gate. Consider whether payout/tax identity (GSTIN/PAN in India) should gate Publish.
- Agoda's tri-state facility model and Booking.com's `area_average_score` are cheap, high-value ideas for amenities and the Overview tab.

### Gaps
- Booking.com Partner Hub, Expedia Partner Central help and InGo-MMT help pages could not be fetched directly (login or 403). Exact current UI wording and step order for new-property registration are unverified from primary sources.
- No primary source confirms Booking.com's "18% more bookings" figure.
- MakeMyTrip's document requirements (GST, PAN, bank proof) were not found in public sources.
- No public material on Goibibo-specific or OYO onboarding steps.

## Q2. Property content structure: sections, photo categories and minimums, amenities taxonomy, policies

### Takeaway
Content is consistently organised into property-level vs room-level layers: facilities, photos, and child/age policy each exist at both levels. Photo management uses upload → "to be categorised" → assign a category/caption (property-level or a specific room type) → set a main photo per property and per room. Recommended photo counts range from 10 (Booking.com score metric) through 20 (Expedia, secondary) to 24 property photos plus 4 per room type (Agoda). Policies (check-in/out, child/age, extra beds, pets) are scored content, not only legal text.

### Cited Findings
**Agoda content structure** — [Agoda guideline PDF](https://ycs.agoda.com/content/agoda-content-score-guideline.pdf)
- Property-level content has three groups:
  - Hotel Facilities: accessibility, breakfast, fitness, parking, pets, restaurant, security, service, smoking, transportation, Wi-Fi.
  - Sports & Recreation: fitness, spa, pools.
  - Languages Spoken.
- "Useful information" covers airport transfer fee, breakfast fee, and check-in/check-out time.
- Room-level content covers room facilities (balcony, bathroom, climate control, F&B, interconnecting, safety, smoking policy, TV), room view, room size and bed configuration.
- Facilities are edited at YCS → Settings → Content → Facilities.
- Photo minimums: "Every listing has a minimum requirement of 24 photos excluding maps, nearby attractions and nearby transport to receive a full property photos score", plus a minimum of 4 photos per room type.
- Photo rules: minimum 800×600, JPEG/PNG, landscape, colour. Avoid duplicates, people, rates/maps/contact info, logos and montages.
- Photo workflow:
  1. Uploads land in "To be categorized".
  2. The host assigns a category (property-level or room type) and a caption tag.
  3. Captions appear only if the matching facility is ticked, which links facilities to photos.
  4. Call-outs flag missing photo types at property and room level, each with an Add Photo button.
  5. The host sets a main photo for the property and for each room type. "If a main photo is not selected, the system will select one at random."
- Correctly captioned facility photos appear in the guest "What they offer" facilities list on hover.
- Child policy, property level: infant age range, child age range, children stay free on existing bedding, extra-bed required age, minimum guest age, extra-bed price.
- Child policy, room level: baby cot allowed and rate, infants/children allowed, max number, number of extra beds.
- Partner Hub photo guidance: at least 24 property photos, including at least 2 exterior, 2 lobby/entrance, and 2 per key facility (dining, recreation, pool, wellness). Agoda claims "up to 8x" more bookings from adding photos (vendor claim). — [Agoda Partner Hub – Which photos do I need](https://partnerhub.agoda.com/which-photos-do-i-need-for-my-property)

**Booking.com**
- Score metrics imply these content fields: photos (≥10, high quality, exterior, pool, bathroom per active room), per-room bed sizes, room size, room amenities, languages spoken, key collection, surrounding area, and directions/transport. — [Booking.com property scores docs](https://developers.booking.com/connectivity/docs/property-scores-api/property-scores)

**Expedia**
- Recommends at least 4 high-res photos per room, plus the building/surroundings, amenities and entrance photographed individually. Secondary source. — [Houst](https://houst.com/blog/expedia-partner-central)
- Recommends at least 20 photos, with quality over quantity. Secondary source. — [SmartOrder (IT)](https://www.smartorder.ai/resources/it/blog/how-to-list-your-property-on-expedia-and-stand-out-it/)
- Content Score sub-scores: amenities, photo gallery, guest requirements (policies). — [Houst](https://houst.com/blog/expedia-partner-central)

**Airbnb**
- The Listing editor (2023 Winter Release, updated May 2024) has two sections:
  - "Your space": title, description, amenities, with roughly 150 amenities browsable alphabetically, by category or by search.
  - "Arrival guide": check-in method and time, directions, parking, Wi-Fi, house manual, checkout instructions, with guest-view preview.
  — [Airbnb – Introducing the Listings tab](https://www.airbnb.com/resources/hosting-homes/a/introducing-the-listings-tab-638)
- AI photo tour: sorts photos into 19 room/space types. Hosts add room details (bed type, accessibility features), drag to reorder within a room, and preview. — [Airbnb – Introducing the Listings tab](https://www.airbnb.com/resources/hosting-homes/a/introducing-the-listings-tab-638)
- Guidebooks sit under Arrival guide (Listings → listing → Arrival guide → Guidebooks). — [Airbnb Help 249](https://www.airbnb.com/help/article/249)

**Research on photos and conversion**
- Expedia research cited in a 2026 Triptease deck: 63% more bookings for hotels with high-quality vs poor photography. This measures quality, not count. — [Triptease webinar deck 2026](https://www.triptease.com/hubfs/2026/Webinar/Onsite%20storytelling%20that%20converts%20%E2%80%94%20webinar%20deck.pdf)
- TripAdvisor data (older, roughly 2014–2016): properties with at least 1 photo had +225% booking-inquiry likelihood vs none, and those with more than 100 photos had +238%. — [PhocusWire](https://www.phocuswire.com/tripadvisor-shares-top-on-site-engagement-strategies-for-hotels); [Frederic Gonzalo](https://fredericgonzalo.com/en/photos-impact-bookings-more-than-reviews-on-tripadvisor)
- Expedia eye-tracking found "the most important image to include is a room with a view" (older). — [Travel Weekly AU](https://www.travelweekly.com.au/article/rooms-with-views-sell-expedia/)
- Orbitz/Intent Media image A/B tests: the better image gave about 15% CTR uplift 76% of the time (older). — [PhocusWire](https://www.phocuswire.com/How-image-selection-affects-click-through-rates-on-OTA-hotel-listings)

### Inferences
- The plan's "photos with categories" is well aligned. Strongest patterns to copy:
  - property-level vs room-type category plus caption tag;
  - an "uncategorised" inbox;
  - a required cover/main photo per property and per room type;
  - missing-photo-type call-outs.
- For the gate, a modest minimum such as 5 property photos plus 1 per room type is defensible, since Airbnb's practical floor is 5–7. Put a 10/24-photo target in the soft content score instead of the gate.
- Add child/age policy and extra-bed/cot rules to the Policies section. Agoda and Expedia score them, and they matter for occupancy-based pricing.
- Amenities should be a categorised taxonomy with search (Airbnb ~150 amenities; Agoda groups) and split into property-level vs room-level.
- "Arrival info" (check-in method, directions, parking, Wi-Fi) is a distinct content block at Airbnb. The plan's "contact & location with map pin" can host directions and parking.

### Gaps
- No public Booking.com photo-category taxonomy was found. Expedia's photo-category list is not confirmed from primary sources.
- No 2024–2026 independent study isolates photo count vs conversion on hotel OTAs. Most quantitative evidence is older or vendor-reported.
- How platforms structure tax and billing content in the UI (e.g. GST slabs on MMT) was not found.

## Q3. Room types, rate plans and availability calendar management

### Takeaway
All platforms use a calendar/grid with date-range bulk edit. Per room type × rate plan × date you can set price, inventory, open/close, min/max stay, advance-booking and arrival/departure restrictions. Rate plans are derived variants of a base room rate (non-refundable, early booker, mobile). Room types and rates can only be created after the property exists (Expedia).

### Cited Findings
- **Booking.com** (SiteMinder guide): "Bulk edit" lets you select a date range and apply price, minimum stay or room closure once. Clicking a single date cell edits price, min stay or closes the room. Rate plans (Early Booker, Non-refundable, Mobile, Country rates) are created under Rates & Availability → Rate plans. — [SiteMinder](https://www.siteminder.com/r/trends-advice/hotel-management-tips-ideas/booking-com-extranet/)
- Booking.com partner community: clicking a standard rate shows options for base price, occupancy rate, minimum length of stay, and minimum advance reservation. — [Booking.com Partner community](https://partnerhelp.booking.com/hc/de/community/posts/360028681394-Restrict-last-minute-bookings)
- At Booking.com, rate plans must be explicitly assigned to the channel. Plans set to "All channels" don't cover Booking.com in NextPax's mapping. — [NextPax](https://support.nextpax.com/booking.com-onboarding-partner-guide)
- **Expedia**: pricing and availability setup covers currency, room rates, cancellation policies, and min/max stay. Secondary source. Room types and rate plans can only be added after "Onboarding Succeeded" (official). — [Lodgify](https://www.lodgify.com/guides/expedia/partner-central/); [Expedia Developer](https://developers.expediagroup.com/supply/lodging/docs/property_mgmt_apis/property/getting_started/introduction)
- **Airbnb**: the multi-calendar shows availability for all listings in one view. Bulk edits of trip length, length-of-stay discounts, cancellation policy and other details work by selecting listings on the Listings page → Edit. This needs the professional hosting tools opt-in and is desktop only. Host forum reports (anecdotal) say multi-day/multi-listing price edits and rule sets in the multi-calendar have been inconsistent. — [Airbnb Resource Centre – Updating settings and availability](https://www.airbnb.com/resources/hosting-homes/a/updating-settings-and-availability-649); [Airbnb Community](https://community.withairbnb.com/t5/Help/Multi-calendar-changes-1-day-only-price-changes/m-p/1003720)
- **OYO**: Smart Pricing Manager V2 lets partners set rates within ±40% of OYO's suggested rates (up from ±20%) for up to 90 days. Partners can block up to 10% of room inventory without approval. The Co-OYO app shows current/future prices per room category, and staff permissions are owner-defined. — [FTN News](https://ftnnews.com/travel-news/technology/oyo-introduces-new-revenue-management-technology/); [HOTELS mag](https://hotelsmag.com/news/new-oyo-plan-gives-us-owners-more-flexibility/); [App Store – Co-OYO](https://apps.apple.com/us/app/-/id1424149517)

### Inferences
- The plan's separate "rates" and "availability" checklist steps match how platforms split base pricing/rate plans from calendar inventory. In the live UI they converge into one grid (room type × date, with price, inventory, open/closed, min stay). Consider a single calendar grid with date-range bulk edit for live properties. Keep the two separate checklist steps only for first-time setup.
- "No open dates" and "Missing price" badges correspond to real blockers in this model: a closed or zero-inventory calendar, and a rate cell with no price. "Disabled" corresponds to a room closed or deactivated. These badges are a reasonable simplification. No OTA was found exposing exactly these labels; see Q4.
- Minimum viable restrictions to support: min stay and advance-booking cut-off (Booking.com), open/close per date, and probably closed-to-arrival/departure (supported by Guesty, see Q4).

### Gaps
- Official Booking.com help on open/close room status and on CTA/CTD restrictions was not retrieved.
- Agoda YCS and InGo-MMT calendar/bulk-update UI specifics were not found in public sources.

## Q4. Multi-listing management in vacation-rental PMS (Hostaway, Guesty): switchers, bulk actions, listing health

### Takeaway
PMS tools rely on a multi-calendar (all listings × dates) plus bulk operations (template copy, date-range bulk update). Neither Hostaway nor Guesty publicly documents a per-listing "health score". Health signals in this space come from OTA content scores (Booking.com, Agoda, Expedia) and channel-manager pre-publish checks (Rentals United MMT quality check, Avantio Airbnb rejection rules).

### Cited Findings
- **Hostaway bulk copy**: copies chosen fields from a template listing to target listings, found by name, ID or tags. It "completely and irreversibly overwrites previous data in target listings for the selected fields", and Hostaway advises testing on one target first. Only saved values are copied. It can optionally push changes to channels. Admin/owner roles only by default. Limitation: amenities copy only checkmarks, not descriptive text. — [Hostaway – Bulk editing listings](https://support.hostaway.com/hc/en-us/articles/4405475748635-Bulk-editing-listings)
- **Hostaway calendar**: individual and multi-calendar views go up to 2 years ahead, with bulk update of rates and availability across date ranges, percentage price changes and day-of-week filters. — [Hostaway – Calendar FAQs](https://support.hostaway.com/hc/en-us/articles/360015177654-Calendar-FAQs); [Hostaway – Calendar manage dates](https://support.hostaway.com/hc/en-us/articles/6052802939163-Calendar-Manage-dates)
- **Guesty Multi-Calendar bulk actions** (beta in April–May 2026 release notes): drag-select cells across properties and date ranges. A side panel then offers reservations, manual blocks, min-night and rate overrides, and check-in/check-out (arrival/departure) restrictions. Only modified fields are saved, and undo is supported. Mixed-currency selections allow only percentage rate changes. — [Guesty – Bulk actions on Multi-Calendar](https://help-lite.guesty.com/hc/en-gb/articles/34810046092957); [Guesty – New releases 2026](https://help.guesty.com/hc/en-gb/articles/33113206043165-New-releases-2026)
- The Guesty Multi-Calendar has a personalisation panel for listing info, calendar tapes, weekend highlighting and pricing overlays. — [Guesty for Hosts – Multi-Calendar overview](https://help.guestyforhosts.com/hc/en-gb/articles/9350424230429)

### Inferences
- For a multi-hotel admin, the useful patterns are:
  - a portfolio list or switcher with per-property status (Draft / Live / Paused) and a completeness percentage;
  - a cross-property calendar only once operators manage many properties.
- If bulk edit is added, follow Hostaway and Guesty: explicit field selection, a warning about overwrites, "save only modified fields", and undo.
- Per-room health badges (the plan's Bookable / Missing price / No open dates / Disabled) appear to go beyond what Hostaway or Guesty document publicly. They resemble the OTA "metric done/not done + action" pattern applied to sellability rather than content. Each badge should link to the fix action, as Booking.com metrics carry an `action` and Agoda photo call-outs carry "Add Photo".

### Gaps
- No public documentation of a Hostaway or Guesty listing-health score or property switcher UI details.
- The capabilities of Airbnb's listings-tab multi-listing view (e.g. filters by status, "action required" indicators) could not be confirmed from a fetchable official page.

## Q5. Evidence on photo counts, content completeness and conversion; how live vs new properties are presented

### Takeaway
Platform guidance consistently claims that completeness raises conversion, but most figures are platform or vendor claims. Examples: Booking.com up to 18% more bookings at 100% score (third-party relay), Agoda up to 8x more bookings with more photos, and Expedia 63% more bookings with quality photos. Independent, recent evidence is thin. For presentation, MakeMyTrip's Connect app explicitly shows newly onboarded properties a task-oriented home ("key tasks to make your property guest-ready"). This supports a checklist-first view for new properties and an Overview/performance view for live ones.

### Cited Findings
- Booking.com: listings at 100% Property page score get up to 18% more bookings (third-party relay; not shown to guests). — [Smoobu](https://support.smoobu.com/hc/en-us/articles/35769354080530-How-do-I-improve-my-Booking-com-Property-page-score)
- Agoda: "more complete content leads to higher conversion, and fewer customer complaints – which leads to better reviews". Up to 8x more bookings from adding photos (Partner Hub claim). — [Agoda guideline PDF](https://ycs.agoda.com/content/agoda-content-score-guideline.pdf); [Agoda Partner Hub](https://partnerhub.agoda.com/which-photos-do-i-need-for-my-property)
- Expedia: 63% more bookings with high-quality photography (cited in a 2026 Triptease deck). Content Score reportedly affects filtered-search visibility (vendor claim, unverified). — [Triptease](https://www.triptease.com/hubfs/2026/Webinar/Onsite%20storytelling%20that%20converts%20%E2%80%94%20webinar%20deck.pdf); [SmartOrder](https://www.smartorder.ai/resources/blog/expedia-ranking-tips-for-hotels/)
- A vendor-reported Booking.com photo refresh at the Renaissance Amsterdam lifted conversion 13% over 17 days (older, single case). — [eHotelier](https://insights.ehotelier.com/?p=32092)
- New vs live presentation: Connect by MakeMyTrip has a newer home screen for newly onboarded properties with key tasks to become guest-ready and improve listing quality. — [App Store – Connect by MakeMyTrip](https://apps.apple.com/us/app/-/id1019426231)
- Booking.com exposes `area_average_score` next to the property's own score, which benchmarks against nearby properties. — [Booking.com property scores docs](https://developers.booking.com/connectivity/docs/property-scores-api/property-scores)
- At Booking.com, a channel-created listing remains unpublished until publish, contract and finance are complete. This is a clear "draft until gated items done" state. — [Hospitable](https://help.hospitable.com/en/articles/11593986-creating-a-booking-com-listing-on-hospitable)

### Inferences
- The plan's split is supported by the MakeMyTrip home-screen precedent and Booking.com's unpublished-until-complete state:
  - **New property**: checklist-first, Publish gated.
  - **Live property**: Overview tab showing status, sellability health and completeness.
- The live Overview should probably carry:
  1. Sellability alerts: rooms with a missing price, no open dates, or disabled.
  2. A content completeness score with prioritised actions. Weight photos heavily, following Agoda's 45% + 25% photo weighting.
  3. Optionally, a comparison benchmark.
- Treat conversion claims as directional. Avoid quoting specific uplift figures in product copy unless they are attributed.

### Gaps
- No independent 2024–2026 academic or industry study (Skift, PhocusWire, Hotel Tech Report) on extranet UX or content-score impact was found within the search budget.
- No public screenshots or official descriptions of the Booking.com Extranet or Expedia Partner Central home dashboards were found to describe their live-property "overview" layouts in detail.
