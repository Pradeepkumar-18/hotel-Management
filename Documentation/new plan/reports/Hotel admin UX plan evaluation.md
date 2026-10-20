# Staywise admin plan passes, with five fixes

- **Date:** 2026-10-20
- **Evaluates:** [admin-ux-plan.md](../admin-ux-plan.md)
- **Research notes:** `research_notes/Hotel admin UX plan evaluation/`. These cover hotel management systems (PMS), booking-site partner portals (OTA extranets) and vacation-rental platforms, UX research, and India and MVP fit.

## Verdict

- **The plan is a good idea.** Its main structure matches how leading products work:
  - Cloudbeds, Mews and OPERA Cloud all open on a "Today" dashboard.
  - Booking.com, Expedia, Agoda and MakeMyTrip only let a property publish after a short list of required items, and encourage richer content afterwards.
  - Every major PMS has a property switcher in the top bar and a room-by-date grid.
  - The staff booking flow follows Mews almost step for step.
- **Five places need fixing.** Each matters more because Staywise is India-first and bookings aren't built yet.
  1. **A Rooms & rates table can't replace a room type × date grid.** Daily rate and availability work needs date-range bulk edits and date blocking. Indian owners already get this on their phones from MakeMyTrip Connect.
  2. **"All hotels" combined with "every page follows the switcher"** leaves it unclear which hotel a change applies to.
  3. **A visible 10-minute countdown is rare in PMS products.** It needs accessibility (WCAG) timing safeguards and a longer hold for payment links.
  4. **"Total + GST" treats tax as one fixed rate.** Since 22 Sep 2025, room GST is 5% or 18% depending on each night's actual price.
  5. **The roadmap is missing an audit trail, a content-completeness score and manual date blocking.** Without a channel manager, blocking dates by hand is the only protection against overbooking.
- **Does a global hotel switcher help?** Yes, if:
  - "All hotels" is a separate read-only portfolio view;
  - every edit screen has exactly one hotel;
  - the hotel is part of the page address (URL);
  - it's hidden for single-property owners.
- **Best order:**
  1. the inventory grid and date blocking;
  2. holds and pay-at-hotel staff bookings;
  3. the bookings list and detail;
  4. payments and GST invoices;
  5. the Today dashboard's arrival numbers last.

---

## 1. The main structure matches PMS and OTA practice

### "Today" home
- **Every PMS reviewed has one:**
  - **Cloudbeds:** the Dashboard is the first screen after login. It counts arrivals and departures per room and highlights how many are still to check in or out ([Cloudbeds](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/115000400634)).
  - **Mews:** 9 sections, including tasks, reservations with **remaining and missed counts**, and a **7-day occupancy** view. Coloured summaries click through to the matching list ([Mews](https://help.mews.com/s/article/your-dashboard)).
  - **OPERA Cloud:** configurable tiles such as Arrivals, Departures, In House, Room Summary and To Do List ([Oracle](https://docs.oracle.com/en/industries/hospitality/opera-cloud/22.3/ocsuh/t_managing_dashboard_tiles.htm)).
- **Research:** NN/g calls this an **operational** dashboard: time-sensitive, readable at a glance, meant to prompt action rather than exploration ([NN/g](https://www.nngroup.com/articles/dashboards-preattentive/)).
- **Fit:** the plan's mock-up has 4 numbers, a "Needs attention" list that links to fixes and a 14-day strip. That fits this description.
- **Changes that would match the best examples:**
  - make each number clickable through to a filtered list;
  - show "remaining" next to each total;
  - rank the attention list by severity (Carbon's High / Medium / Low model) ([Carbon](https://carbondesignsystem.com/patterns/status-indicator-pattern/));
  - use a **fixed layout**, not OPERA-style configurable tiles, which suit large hotels better than small independents.

### New vs live properties, and the setup checklist
- **Evidence for treating new and live properties differently:**
  - MakeMyTrip's Connect app shows newly onboarded properties a home screen of "key tasks to make your property guest-ready" ([App Store](https://apps.apple.com/us/app/-/id1019426231)).
  - Booking.com keeps a listing unpublished until the owner publishes, signs the agreement and sets up finance details ([Hospitable](https://help.hospitable.com/en/articles/11593986-creating-a-booking-com-listing-on-hospitable)).
- **Every OTA uses two levels of checks:**
  - **A hard gate:** what makes a property legally and commercially bookable (rooms, a rate, a default cancellation policy, finance details).
  - **A soft 0–100% score:** covers content richness and never blocks publishing.
    - Booking.com's Property page score lists each metric as done or not done, with an `action` and an `area_average_score` for comparing with nearby properties ([Booking.com](https://developers.booking.com/connectivity/docs/property-scores-api/property-scores)).
    - Agoda weights property photos at 45% and room photos at 25% ([Agoda Partner Hub](https://www.partnerhub.agoda.com/how-to-improve-your-content-score)).
- **The plan's 5-step checklist is the hard gate. There's no soft score yet.**
- **An in-app checklist is an advantage:** major PMS vendors run onboarding through a coach instead ([Cloudbeds](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360041220954-Onboarding-Everything-you-need-to-know)), so for self-serve Indian independents Staywise's checklist sets it apart.
- **Checklist rules from the UK government's task-list pattern, which is based on user research** ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)):
  - keep "Completed" visually quiet;
  - show "Cannot start yet" without a link for steps that depend on others;
  - keep the number of statuses small.

### Staff booking flow and booking views
- **Mews' flow has 3 screens:**
  1. dates;
  2. availability per room type, with the cheapest rate highlighted and price overrides only for permitted staff;
  3. status and confirm ([Mews](https://help.mews.com/s/article/create-a-reservation)).
- **The list plus calendar** is standard.
- **List with a side panel** is the plan's best-supported pattern. For viewing and editing one record, NN/g recommends a side panel that doesn't cover the table, so the rest of the table stays visible ([NN/g](https://www.nngroup.com/articles/data-tables/)).
- **Weak evidence: there's little academic research on PMS usability.**
  - One small 2026 study found users struggled most with reservations (54%), guest data entry (46%) and menu navigation (42%) ([SENTRI](https://ejournal.nusantaraglobal.ac.id/index.php/sentri/article/download/6545/4829/35229)).
  - A vendor survey reports 4 months to 3 years before front-desk staff feel confident ([Cloudbeds](https://cloudbeds.com/articles/pms-user-experience)).
  - **Takeaway:** test the booking flow and the grid hardest.

---

## 2. A global hotel switcher helps, with four conditions

- **Yes, a single global hotel switcher helps admins.** It replaces the hotel picker repeated on the Room types, Base rates and Availability pages.
- **What products do:**
  - **Cloudbeds:** switcher at the top left with name search; opens properties in the same tab or a new one ([Cloudbeds](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/1260803386269-Organizations-Everything-you-need-to-know)).
  - **Mews:** a "Select service" choice that lasts for the session ([Mews](https://help.mews.com/s/article/your-dashboard)).
  - **Shopify:** switching logs you into each store with that store's own permissions ([Shopify](https://help.shopify.com/en/manual/your-account/shopify-admin)).
- **Evidence gap:** no study directly compares a global switcher with per-page pickers. The conditions below come from product behaviour and user complaints.

### Condition 1: "All hotels" is a separate portfolio view, not a filter
- **The problem:** the plan says every page follows the switcher *and* super admins can pick "All hotels". Taken literally, that means a Rooms & rates screen or a New booking button with no single hotel behind it.
- **How others handle it:**
  - **OPERA Cloud:** a separate Hub where every tile is labelled with its property ([Oracle](https://docs.oracle.com/en/industries/hospitality/opera-cloud/22.3/ocsuh/t_managing_dashboard_tiles.htm)).
  - **Stripe Organizations:** organisation-level combined reports, search across accounts and account groups, all separate from work inside a single account ([Stripe](https://docs.stripe.com/get-started/account/orgs)).
- **For Staywise:**
  - "All hotels" offers only views that make sense combined: Today counts labelled by hotel, booking search, and reports.
  - **Every editing screen needs exactly one hotel.** If a user arrives there with "All hotels" selected, ask them to choose one.

### Condition 2: the hotel is part of the URL
- **"Remember it"** should mean remembering a default, not hidden state.
- **Evidence:** Shopify merchants complained when the switcher moved and when Inbox ignored it, and ended up bookmarking per-store URLs ([Shopify Community](https://community.shopify.com/t/how-can-i-switch-between-stores-in-shopify-inbox-quickly/73871/20)).
- **Do:** use routes like `/hotels/:hotelId/rooms`. Then bookmarks, links from the Needs-attention list, and two tabs on two hotels all work, and the switcher just reflects the address.
- **Side effect:** this resolves the plan's overlap between "Properties → hotel workspace" and the global switcher. Entering a workspace sets the switcher.

### Condition 3: permissions are per hotel, and actions name the hotel
- **The switcher lists only hotels** the user can access.
- **Every change is checked on the server** against that hotel.
- **Don't copy Mews here:** giving every portfolio user access to all properties is a limitation ([Mews](https://help.mews.com/s/article/How-to-set-up-your-portfolio-using-Mews-Multi-Property)).
- **Money confirmations name the hotel and the booking.** NN/g says confirmations only work when they state the specific consequence ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/)).

### Condition 4: hide it when there's only one hotel
- **Multi-property struggles:** a vendor-run survey found 45% of Indian hotel chains struggle to manage multiple properties ([Hospitality Technology](https://hospitalitytech.com/learn-top-hotel-tech-challenges-pain-points-and-priorities-indian-hoteliers)).
- **Most Indian independents run one property.** For them, show a static hotel name in the top bar instead of a dropdown with one item.

---

## 3. Rooms & rates needs a date grid as well as the table

### Daily inventory work needs a grid
- **The proposed table** (one row per room type, price, free tonight, health badge) works for setup and monitoring, but not for day-to-day inventory work.
- **What others do:**
  - **Cloudbeds:** single-date rate changes are allowed on the calendar, but allotments, long-range rates and restrictions "can only be updated on the Availability Matrix". That matrix has date-range bulk updates, blocked-date stop-sell, and closed-to-arrival / closed-to-departure ([Cloudbeds](https://myfrontdesk.cloudbeds.com/hc//articles/221693948)).
  - **Booking.com extranet:** range "Bulk edit" for price, minimum stay and closure ([SiteMinder](https://www.siteminder.com/r/trends-advice/hotel-management-tips-ideas/booking-com-extranet/)).
  - **Hostaway and Guesty:** both are built around a multi-calendar with bulk updates. Guesty saves only the fields you changed and supports undo ([Guesty](https://help-lite.guesty.com/hc/en-gb/articles/34810046092957)).
  - **India:** MakeMyTrip's Connect app already lets owners change prices daily or in bulk and block dates from a phone ([App Store](https://apps.apple.com/qa/app/connect-formerly-ingommt/id1019426231)).
- **The gap:** Staywise's calendar shows 14 nights and blocks one night at a time, less than these owners already have.
- **Do:** turn the Availability tab into a **room type × date grid** with:
  - range selection;
  - price, open/close, minimum stay and an advance-booking cut-off;
  - layout that works on a phone.
- **Keep the side panel** for editing a single room type.

### Health badges and change history
- **The health badges go beyond what Hostaway and Guesty document.** They apply the booking sites' "done / not done + action" idea to whether a room can be sold. That's good, with these refinements ([Carbon](https://carbondesignsystem.com/patterns/status-indicator-pattern/); [GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)):
  - keep to about 5–6 visual types;
  - never use colour alone; pair it with a symbol and text;
  - keep "Bookable" visually quiet so problems stand out.
- **Add a "suspicious or zero rate" check.** Cloudbeds documents zero rates pushed by bulk tools as a real problem ([Cloudbeds](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360051141453-Calendar-Changing-rates-and-availability)).
- **Build the audit log now, not under "Later":**
  - a Little Hotelier reviewer complained about having no inventory change history or export ([Hotel Tech Report](https://hoteltechreport.com/reviews/q39wvy3ynwv5));
  - the plan's "who changed this price" goal depends on changes being recorded from the start.
- **"Duplicate" and "Copy from another hotel" should follow Hostaway's rules**, since its bulk copy "completely and irreversibly overwrites" what's there ([Hostaway](https://support.hostaway.com/hc/en-us/articles/4405475748635-Bulk-editing-listings)):
  - choose the fields to copy explicitly;
  - warn before overwriting;
  - test on one target first.

### Content completeness
- **Add a completeness percentage to Overview after publishing**, weighted towards photos.
- **Copy Agoda's photo flow** ([Agoda](https://ycs.agoda.com/content/agoda-content-score-guideline.pdf)):
  - uploads go to a "to be categorised" inbox;
  - each photo gets a hotel-level or room-type category;
  - each room type needs a main photo.
- **Copy Agoda's three-state amenities:** yes / no / not answered.
- **Add child and extra-bed policies** to Policies, next to check-in/out times. Booking sites score them, and they affect pricing by number of guests.
- **Keep the publish gate modest:** about 5 property photos and 1 per room type. Put the 10–24 photo targets in the soft score, not the gate ([Avantio](https://support.avantio.com/en/articles/419305-minimum-requirements-airbnb)).

---

## 4. The booking flow needs a different kind of hold, and GST per night

### Make the visible 10-minute countdown secondary
- **No PMS reviewed shows staff a countdown.** Instead they offer deliberate statuses, not short technical locks:
  - **Mews:** an "Optional" status with a release date that blocks inventory.
  - **Cloudbeds:** a "Courtesy Hold" ([Mews](https://help.mews.com/s/article/create-a-reservation); [Cloudbeds](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/48384262863771-Managing-Reservations-and-Quick-Actions-on-the-New-Calendar)).
- **Keep the 10-minute hold as a server-side guard** against selling the same room twice.
- **Accessibility rules for time limits (WCAG 2.2.1)** ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)):
  - the time limit must be adjustable or extendable;
  - warn at least 20 seconds before it expires;
  - offer a one-click extend that works at least 10 times;
  - return the user exactly where they were;
  - W3C's ticket-hold example also recommends collecting details *before* the timer starts.
- **In practice:**
  - start the hold when a room is chosen in step 2;
  - show "Room held · 9:32" as quiet text that screen readers don't announce every second;
  - if it expires, keep the form filled in and show "Room no longer held — check availability again".
- **Payment links need longer.** Indian payment links go to guests over WhatsApp or SMS and take longer to pay than UPI at the desk. System-design references suggest about 30 minutes for hotel holds ([techinterview.org](https://www.techinterview.org/post/3233460029/design-a-hotel-airbnb-reservation-system/)).
  - Make the hold length depend on the channel.
  - Add an **"Optional, release on [date]"** status as its own state, separate from booking status. This keeps the project's rule that hold, booking, payment and refund statuses stay separate.

### Put the booking flow on its own page
- **Why:** 3 steps "in one panel" is a wizard inside an overlay. Expert guidance says complex multi-step work belongs on a separate page, and wizards shouldn't sit inside pop-ups ([Smashing Magazine](https://www.smashingmagazine.com/2026/03/modal-separate-page-ux-decision-tree/)).
- **Mews** opens New reservation from the menu bar, the Timeline "+" button and Alt+N ([Mews](https://help.mews.com/s/article/your-dashboard)).
- **For Staywise:**
  - give the flow its own page address;
  - start it from a "+" button and global search in the top bar;
  - let staff click an empty grid cell to pre-fill the dates.

### GST is calculated per night, not set once
- **The rule since 22 Sep 2025** ([TaxGuru](https://taxguru.in/?p=1031968); [AxisRooms](https://blog.axisrooms.com/hotel-gst/)):
  - rooms with an actual price up to ₹7,500 per room per day: **5%, without input tax credit**;
  - above ₹7,500: **18%, with input tax credit**;
  - the old "declared tariff" no longer applies.
- **Consequence:** a room type with changing prices can cross the slab on different nights.
- **What the server must do:**
  - classify each night from its final price;
  - store the tax in minor units;
  - save a tax snapshot on the booking.
- **"Total ₹7,000 + GST" becomes an itemised total** calculated on the server.
- **Place of supply is the hotel's location**, so the tax is always central plus state GST (CGST+SGST), even for a corporate guest from another state ([TaxGuru](https://taxguru.in/?p=1042484)).
- **Bookings should capture an optional guest company GSTIN** for business invoices. Rule 46 requires recipient details on the invoice when the guest is GST-registered ([CBIC](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html)).
- **The hotel's Tax & billing section needs:**
  - a GSTIN checked for format, state code and check digit;
  - the legal name;
  - "specified premises" status.
- **When to require GSTIN:** collect it during setup. It should block **invoice generation**, not holds.
- ⚠ **Confirm all tax figures with a tax professional.** The primary notification text wasn't reviewed.

### Payments and refunds
- **Card holds expire too fast for advance bookings:**
  - Razorpay auto-refunds uncaptured payments after up to 5 days;
  - Cashfree releases holds after 7 days ([Razorpay](https://razorpay.com/docs/payments/payments/capture-settings/api/); [Cashfree](https://www.cashfree.com/docs/payments/features/pre-authorisation));
  - so a Western-style "card guarantee, pay at hotel" doesn't fit the usual gap between booking and check-in.
- **MVP payment modes:**
  - pay-at-hotel (recorded offline);
  - full prepayment;
  - partial deposit.
- **The cancel dialog should** ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/); [Razorpay](https://razorpay.com/docs/payments/optimizer/capture-refund-settings/)):
  - show the fee and refund calculated by the server before confirming;
  - name the outcome on the button, for example "Cancel and refund ₹X";
  - say refunds take about 5–7 working days.
- **Why show costs upfront:** hidden costs are the most-cited reason for abandoned checkouts in Baymard's research. Secondary sources disagree on the exact percentage ([Social Intents](https://www.socialintents.com/blog/?p=3951)).

### Booking grid details
- **Drag-and-drop needs a non-drag alternative**, such as an "Assign room" action (WCAG 2.5.7). Booking colours need text or icon labels as well ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)).
- **Copy Mews' and Cloudbeds' guardrails** ([Mews](https://help.mews.com/s/article/timeline); [Cloudbeds](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/219025318-Calendar-Troubleshooting-Drag-and-Drop-Reservations)):
  - dragging can upgrade a guest but not downgrade them;
  - in-house guests can't move to another room type;
  - a confirmation appears when the price changes.
- **Add one-click Today / 7 / 14 / 30-day views.** An eZee user complained that sideways scrolling made extending stays hard ([Capterra](https://capterra.com/p/135751/eZee-Absolute/reviews/)).
- **MVP grid = room type × night (sold / held / free).**
  - The plan's "rooms down the side" grid assumes physical room numbers, but the current model stores room types with a count.
  - This is the **same component as the inventory grid**.
  - Physical-room assignment and an unassigned-bookings panel come later.
- **Keep guest profiles separate from booking snapshots.** eZee users reported that editing a guest changed all their past bookings ([Capterra](https://capterra.com/p/135751/eZee-Absolute/reviews/)).

---

## 5. Build order: inventory first, dashboards last

- **The plan's own roadmap** already puts Bookings in Sprint 2 and the Today dashboard after it, which is right.
- **The changes:** move the inventory grid and the audit log earlier, and split "Today" into a part that can ship now and a part that has to wait.

### Steps
1. **Foundations**
   - **Deliver:**
     - the global switcher (hotel in the URL, hidden for single-hotel users);
     - the Rooms & rates table with badges and side panel;
     - **the room type × date grid with range bulk edit and date blocking**;
     - the audit log;
     - the theme fixes.
   - **Why now:** builds on what exists and matches the MMT Connect baseline. Without a channel manager, blocking dates is the only protection against overbooking ([AxisRooms](https://blog.axisrooms.com/hotel-ota-reconciliation-india/)).
2. **Overview and tax setup**
   - **Deliver:** the Overview tab with sellability alerts and a content-completeness score; Tax & billing (GSTIN) in setup.
   - **Why now:** uses data that already exists. GSTIN doesn't change, so it can be collected early.
3. **Holds and staff booking**
   - **Deliver:**
     - holds (time-limited, a Mongo transaction on nightly inventory, an idempotency key);
     - staff booking on its own page, **pay-at-hotel first**.
   - **Why now:** booking changes must be all-or-nothing and checked against the authoritative inventory ([techinterview.org](https://www.techinterview.org/post/3233473163/lld-booking-reservation-system/)).
4. **Bookings**
   - **Deliver:** the bookings list and detail, cancel and no-show with a fee preview, and a grid view reusing the inventory component.
   - **Why now:** needs booking records. Sharing the grid component reduces the work.
5. **Messages, payments and invoices**
   - **Deliver:**
     - confirmations by SMS, WhatsApp or email;
     - payment links and UPI prepayment, with webhooks and refunds on a separate state machine;
     - per-night GST invoices.
   - **Why now:** depends on settled booking data structures.
6. **Today dashboard**
   - **Deliver:** arrivals, departures and pending payments; later a "foreign guests pending Form-III" item once check-in exists.
   - **Why now:** Form-III must be filed within 24 hours of a foreign guest's arrival ([Morung Express](https://morungexpress.com/dimapur-police-issues-directive-on-foreigners-registration-compliance)).
7. **Reports**
   - **Deliver:** reports with defined metrics and CSV export; the cross-hotel portfolio view.
   - **Why now:** needs real data. Reporting is a common complaint across PMS reviews.

### Notes on the order
- **"Needs attention" can ship in step 2**, labelled as setup health, because its inputs (missing prices, missing dates) already exist.
- **Don't build arrival and occupancy widgets before bookings exist.** They'd show empty or invented numbers, and need rework once the data structures settle. This is reasoning, not something the sources measured.

### Main risks (most serious first)
1. **Overbooking against OTA sales** if date blocking comes late.
2. **Changes to the wrong hotel** if "All hotels" reaches editing screens.
3. **GST errors** if tax is a fixed field.
4. **Abandoned bookings or accessibility failures** if the hold expires silently.
5. **Rework under India's data-protection rules (DPDP)** if ID scans are collected without retention and erasure fields before the main obligations start in about May 2027 ([Storyboard18](https://www.storyboard18.com/amp/digital/breaking-govt-notifies-final-dpdp-rules-sets-staggered-rollout-with-key-obligations-for-data-fiduciaries-84201.htm)).
   - **ID capture belongs at check-in,** not in the booking MVP.

---

## Conclusion

- **The plan is right about what admins need.**
- **Where it falls short:** for Indian independents, the most valuable screen is the **inventory grid**, not the dashboard. Owners already manage prices and blocked dates on MakeMyTrip from their phones.
- **How Staywise earns its place:** match that, then add what the booking sites don't offer:
  - sellability health with one-click fixes;
  - a guided go-live;
  - totals calculated on the server that are GST-correct from the start.
- **Ship the inventory grid first,** and the booking calendar reuses it instead of being a separate build.
- **On the switcher:** "every page follows" and "All hotels" can't both be true without changes that have no clear hotel. The fix:
  - make the hotel part of the URL;
  - keep the portfolio view read-only;
  - hide the switcher for single-property owners.
- **Weakest evidence:** there's no controlled research on switchers, side panels or booking grids in hotel software.
  - **Test the booking flow and grid with real Indian front-desk staff** before Sprint 2 is locked.
