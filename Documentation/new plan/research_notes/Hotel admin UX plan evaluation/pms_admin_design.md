# How leading hotel PMS products design the staff/admin interface

Research date: 2026-10-20. Main sources: vendor help centres (Cloudbeds, Mews, Oracle OPERA Cloud), plus Capterra and Hotel Tech Report reviews. I found little primary documentation for Little Hotelier and eZee Absolute; the Gaps sections say where. Some Cloudbeds help pages returned HTTP 403 when fetched directly, so those facts come from search-result summaries of the same official pages. They are marked "(via search snippet)".

## 1. Top-level navigation and the operations home ("today" dashboard)

### Takeaway
Every major PMS opens on a "today" dashboard after login. It shows arrivals and departures with how many remain, in-house counts, occupancy, and links to tasks or exceptions. The best examples make each count clickable through to a filtered list. Mews adds a persistent menu bar with keyboard shortcuts for Timeline and New reservation. This strongly supports the proposed "Today" home with a "needs attention" list.

### Cited Findings
- **Cloudbeds:** the Dashboard is the first screen after login and can also be opened from the Main Menu. Arrivals and departures are counted per room: a reservation with 3 rooms counts 3 times. The first number is the day's total and a blue number shows rooms still to check in or out. In-house can be shown as a room count or a guest count, switched from the widget's 3-dot menu. Stayovers and new bookings are separate counts. — [Cloudbeds: Dashboard – Everything you need to know](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/115000400634) (via search snippet)
- **Cloudbeds:** a new PMS dashboard is in limited release and "will be progressively released during 2026". It keeps the arrivals, departures, stayovers and in-house section and adds a date selector. The temporary "Switch to Classic" option is going away. — [Cloudbeds: Get to know your new Dashboard](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/16873372577435-Get-to-know-your-new-Dashboard) (via search snippet)
- **Mews:** the Dashboard is the Mews Operations homepage. It has 9 sections:
  - Tasks: today's upcoming and missed tasks; tasks with future deadlines are hidden
  - Reservations: arrivals and departures, with counts remaining, missed, and online check-ins done
  - Orders
  - Spaces: housekeeping status
  - Customers: profiles that need completing
  - Occupancy: the next 7 days, with links to the availability report, Rate management and the block report
  - Finance & Reports
  - Marketplace
  - Menu bar

  Coloured "donuts" summarise the day and flag items that need action; clicking one opens the related list or report. — [Mews Help: Your dashboard](https://help.mews.com/s/article/your-dashboard)
- **Mews menu bar:** Main menu, Dashboard, global Search, Timeline (Alt+T), New reservation (Alt+N), Reservation overview report (Alt+O), Notifications and Messages with unread counts, chatbot, release notes, profile. A "Select service" dropdown filters the Timeline and reports for the rest of the session. — [Mews Help: Your dashboard](https://help.mews.com/s/article/your-dashboard)
- **Mews exceptions:** missed optional reservations (past their release time) appear on the Dashboard as "Optional reservations missed". This is a concrete "needs attention" pattern. — [Mews Help: Create a long-stay reservation / optional reservations](https://help.mews.com/s/article/Create-a-long-stay-reservation) and [Confirm or cancel optional reservations](https://help.mews.com/s/article/confirm-or-cancel-optional-reservations)
- **OPERA Cloud:** the Home Dashboard is built from configurable tiles that users can add, configure with a gear icon, delete and drag to rearrange. Managing tiles needs the "Edit Dashboard" permission. — [Oracle OPERA Cloud 22.3: Managing Dashboard Tiles](https://docs.oracle.com/en/industries/hospitality/opera-cloud/22.3/ocsuh/t_managing_dashboard_tiles.htm)
- **OPERA Cloud tiles include:**
  - Arrivals: expected today, plus reservations on Queue
  - Departures: expected and actual
  - In House (Occupied)
  - Reservation Activity: arrivals, in-house and departures, plus average check-in time in seconds
  - Room Summary: available, physical, out of order, out of service
  - Room Status
  - Max Available Rooms
  - Daily Projections: occupancy and revenue
  - Reservations and Cancellations Today
  - Room Maintenance: resolved and unresolved
  - To Do List
  - VIP Guests
  - 60 Minutes Activity
  - Task Sheet

  — [Oracle OPERA Cloud 22.3: Managing Dashboard Tiles](https://docs.oracle.com/en/industries/hospitality/opera-cloud/22.3/ocsuh/t_managing_dashboard_tiles.htm)
- **Cloudbeds mobile (iPad) app:** shows arrivals, departures and in-house for today and tomorrow, plus a real-time occupancy meter. — [Apple App Store: Cloudbeds](https://apps.apple.com/us/app/id1671866717) (via search snippet)
- **Little Hotelier:** the product tour presents the central calendar and daily operations as the starting point. — [Little Hotelier product tour](https://www.littlehotelier.com/lh-demo/)

### Inferences
- The proposed "Today" home matches the industry consensus. The most common set of numbers is arrivals (total and remaining), departures (total and remaining), in-house, and occupancy.
- Consider adding:
  - Mews-style "remaining / missed" numbers on each count
  - a room-vs-guest toggle for in-house, as Cloudbeds does
  - a 7-day occupancy strip rather than today only
  - clickable counts that open filtered lists
- The "needs attention" list has precedent in Mews donuts (missed tasks, missed optional reservations, profiles to complete) and in OPERA's Queue and Room Maintenance tiles.
- Mews' menu bar puts global search, the calendar and "New reservation" one click away on every screen, with shortcuts. This is worth copying in the top bar next to the proposed hotel switcher.
- OPERA's fully configurable tiles suit large hotels. For small independents, a fixed, opinionated layout (Cloudbeds, Mews) is simpler.

### Gaps
- I could not get primary documentation of Little Hotelier's or eZee Absolute's dashboard contents. The help centres were not returned by search.
- The full list of sidebar or main-menu items for Cloudbeds and Mews was not documented in a single source I could fetch.

## 2. Reservation calendar / tape chart, and how staff create bookings

### Takeaway
The standard tape chart has room types grouped down the left, each physical room as a row, and dates across the top. Bookings are coloured by status, can be dragged and dropped, and unassigned bookings sit in a dedicated panel or column. Staff booking flows are short:
1. dates and occupancy
2. availability per room type with rates and the cheapest one highlighted
3. guest details, status, and confirm

Explicit time-limited "holds" are rare in staff flows. Instead, vendors use "optional/tentative" reservation statuses with a release date that still take a room out of inventory.

### Cited Findings
- **Mews Timeline layout:** space categories in the left column, one row per space; dorm beds get their own rows. Time runs across the top in hours, days or months. Density can be set to Default, Comfortable or Compact. — [Mews Help: Timeline](https://help.mews.com/s/article/timeline)
- **Mews reservation colours:**
  - orange: urgent, e.g. no-show
  - blue: action needed today
  - dark grey: in-house with nothing due
  - light grey: past or future with nothing due today
  - purple: house use
  - green: online check-in done
  - dashed outline: optional or unconfirmed
  - yellow: out of order

  Housekeeping has its own colours: red out of service, orange dirty, blue clean, green inspected. — [Mews Help: Timeline](https://help.mews.com/s/article/timeline)
- **Mews drag and drop:**
  - Dragging to a higher category upgrades the booking and shows an up-arrow on the block.
  - Downgrades are not allowed by drag.
  - Dropping onto another booking tries to move the displaced booking; if no room fits, it goes to a red "overbooking slot" placeholder.
  - Locked bookings can't be moved.
  - "House use" blocks reserve rooms for internal use.

  — [Mews Help: Timeline](https://help.mews.com/s/article/timeline)
- **Cloudbeds new calendar** (limited pilot, 2026): an availability-aware "Unassigned Reservations" panel. Staff can auto-assign all bookings at once or pick individual guests. If no room is free for the whole stay, it shows a clear error instead of creating an overlap. — [Cloudbeds: Managing Reservations and Quick Actions on the New Calendar](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/48384262863771-Managing-Reservations-and-Quick-Actions-on-the-New-Calendar) (via search snippet); [Getting Started with the New Cloudbeds Calendar](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/48372183498907-Getting-Started-with-the-New-Cloudbeds-Calendar) (via search snippet)
- **Cloudbeds new calendar Quick Actions:** opened from a "+" icon or by clicking an empty cell. Options are New Reservation, Out of Service, and Courtesy Hold. "Unassign" is disabled for in-house guests to avoid displacing them by accident. Calendar settings are saved per user. — [Cloudbeds: Managing Reservations and Quick Actions on the New Calendar](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/48384262863771-Managing-Reservations-and-Quick-Actions-on-the-New-Calendar) (via search snippet)
- **Cloudbeds drag-and-drop rules:** in-house reservations can't be dragged to a different room type. The recommended workaround is to split the remaining nights and drag the split. A price-difference prompt may appear when a booking moves room type. Past stays can't be dragged. — [Cloudbeds: Troubleshoot drag and drop reservations on the calendar](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/219025318-Calendar-Troubleshooting-Drag-and-Drop-Reservations) (via search snippet)
- **Cloudbeds room locks:** a reservation can be locked to its room, but only once it is assigned to one. — [Cloudbeds: Lock/Unlock assignments on the calendar](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360049614594-Calendar-Locking-Unlocking-Assignments) (via search snippet)
- **Other tape charts:**
  - LS Central: unallocated reservations appear in a right-hand column that only shows when there are unallocated arrivals in the visible dates; a header search covers room, room type, guest, email, phone and group number.
  - Hotelogix: staff can draw reservations directly on the chart, and assigning a room is optional.

  — [LS Central: Tape Chart](https://help.lscentral.lsretail.com/Content/LS-Hospitality/LS-Hotels/Tape-Chart.htm); [Hotelogix jump start guide (PDF)](https://www.hotelogix.com/documents/jump_start_guide.pdf) (via search snippet)
- **Mews staff booking flow** (3 screens), started from Timeline "+", the menu bar "+", Alt+N, or Main menu:
  1. Choose service and dates, then Continue. Multi-property accounts can choose a location, and choosing a city shows availability across its properties.
  2. Build the "cart":
     - find or create the guest profile
     - optionally attach booker, travel agent, company, voucher or segment, which can change which rates are offered
     - availability is shown per space category, filterable by feature (e.g. sea view)
     - set number of rooms, adults and children
     - rates are grouped by rate group with the cheapest per category highlighted
     - price override and restriction override each need a permission
     - a grey "+" means a restriction blocks that rate, with a "Restricted" link to it
     - "View policies" shows payment and cancellation terms
     - several reservations can go in one cart
  3. Final details: status (Confirmed / Optional / Inquired), a release date for Optional and Inquired, a confirmation or quotation email, then "Book now".

  — [Mews Help: Create a reservation](https://help.mews.com/s/article/create-a-reservation)
- **Mews optional reservations:** Optional reservations block the room and count against inventory; Inquired ones do not. Settings can remind the guest 24 hours before release or cancel automatically at release. — [Mews Help: Create a reservation](https://help.mews.com/s/article/create-a-reservation); [Mews: Confirm or cancel optional reservations](https://help.mews.com/s/article/confirm-or-cancel-optional-reservations)
- **OPERA Cloud "Look To Book" Sales Screen:** used for future and walk-in bookings. It shows room types and prices for the dates entered and filters by rate category or code, room type, features, or a specific room. An "Include Closed Rates" option and closed-rate override exist. "Quick Book" is a faster alternative that doesn't support negotiated or promotional rates. — [Oracle OPERA Cloud: Booking a Reservation / Look To Book](https://docs.oracle.com/en/industries/hospitality/opera-cloud/24.2/ocsuh/t_booking_reservations_booking_a_reservation.htm); [OPERA Cloud 22.3: Quick Book](https://docs.oracle.com/en/industries/hospitality/opera-cloud/22.3/ocsuh/t_booking_creating_reservations_using_quick_book.htm)
- **Payment and card capture:** the Mews create-reservation article does not cover card capture in the flow. It links out to payment automation and cancellation policy setup instead. — [Mews Help: Create a reservation](https://help.mews.com/s/article/create-a-reservation)

### Inferences
- The proposed "Bookings list + calendar grid" matches the industry. On the grid:
  - group rows by room type
  - colour by status, ideally "action needed today" rather than raw status alone
  - add an unassigned panel or column that offers auto-assign and refuses overlapping assignments
  - offer lock-to-room
  - let staff click an empty cell to start a booking or a block
- The proposed 3-step booking matches Mews closely: dates and occupancy, then availability and rates, then guest and confirm.
- I found no PMS that shows staff a visible countdown on a held room. Mews "Optional + release date" and Cloudbeds "Courtesy Hold" are the nearest equivalents, and both are deliberate statuses, not short technical locks. A 10-minute hold is therefore a sensible backend safeguard against double booking during checkout, but it is unusual as a visible UX feature. If shown, keep it subtle, e.g. "room held for 9:32". Consider also offering a longer, staff-chosen "tentative / optional with release date" status, kept separate from the booking status machine.
- Permission-gated price and restriction overrides (Mews) fit the plan's rule that pricing is decided on the server. An override should be a separate, audited action.
- Rules to copy: drag up but not down (Mews), and no moving in-house guests across room types (Cloudbeds). Both prevent accidental pricing changes.

### Gaps
- I found no primary documentation of eZee Absolute's or Little Hotelier's booking steps or calendar colours.
- Cloudbeds' classic "Add reservation" step sequence was not retrieved.
- Card capture and deposit steps inside staff booking flows were not documented in the pages fetched, for any vendor.

## 3. Room types vs physical rooms, rate plans vs base rates, and inventory editing

### Takeaway
All vendors separate sellable room types or categories (where inventory and rates live) from physical rooms or spaces (which get assigned). Bulk rate and availability editing is a separate, matrix-style screen: a grid of dates and room types with a date-range bulk updater, close-out or stop-sell, and restrictions. Only simple single-date edits happen on the calendar.

### Cited Findings
- **Cloudbeds:** the calendar only allows single-date rate changes plus reservations and blocks. "The amount allotted for sale, rates for long term intervals, restrictions can only be updated on the Availability Matrix." — [Cloudbeds: Change rates and availability on the calendar](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360051141453-Calendar-Changing-rates-and-availability) (via search snippet)
- **Cloudbeds Availability Matrix:**
  - "+Long-Term Interval" updates multiple dates and room types at once and can close inventory in the same step
  - "Accommodation Blocked" closes chosen days for a room type, effectively a stop-sell
  - closed to arrival and closed to departure are available
  - on higher plans, base rates can be raised or lowered by a percentage or an amount

  Base rates apply to all channels, but some OTAs don't support minimum/maximum stay or closed-to-arrival/departure. — [Cloudbeds: Availability Matrix Overview](https://myfrontdesk.cloudbeds.com/hc//articles/221693948); [How to Add or Edit Base Rates](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/222397807) (via search snippet)
- **Cloudbeds pitfall:** a rate of "0" on past dates means an external bulk edit, API call or revenue tool (e.g. PriceLabs) pushed a zero value. — [Cloudbeds: Change rates and availability on the calendar](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360051141453-Calendar-Changing-rates-and-availability) (via search snippet)
- **Mews:** "space categories" (types) are separate from "spaces" (rooms or beds). Availability during booking is shown per category, and a specific space can optionally be chosen. Rates are organised in "rate groups", and restrictions block rates. — [Mews Help: Create a reservation](https://help.mews.com/s/article/create-a-reservation); [Mews Help: Timeline](https://help.mews.com/s/article/timeline)
- **OPERA Cloud:**
  - Room Summary distinguishes available, physical, out-of-order and out-of-service rooms.
  - Room Class can group room types, and dashboard tiles can be set per room class.
  - Booking separates rate codes and categories from room types.

  — [OPERA Cloud 22.3: Managing Dashboard Tiles](https://docs.oracle.com/en/industries/hospitality/opera-cloud/22.3/ocsuh/t_managing_dashboard_tiles.htm); [OPERA Cloud: Look To Book](https://docs.oracle.com/en/industries/hospitality/opera-cloud/24.2/ocsuh/t_booking_reservations_booking_a_reservation.htm)
- **Out of order vs out of service:** Mews and OPERA both treat them as different states. Out of order is removed from sale. Mews describes out of service as "no check-in possible". — [Mews Help: Timeline](https://help.mews.com/s/article/timeline); [OPERA Cloud tiles](https://docs.oracle.com/en/industries/hospitality/opera-cloud/22.3/ocsuh/t_managing_dashboard_tiles.htm)
- **Little Hotelier reviews:**
  - One reviewer praises "agility in bulk updating prices or sales conditions".
  - The same reviewer complains there is no inventory change history and no Excel export of historical inventory.
  - Another reviewer notes that closing dates applies to all connected channels.

  — [Hotel Tech Report: Review of Little Hotelier](https://hoteltechreport.com/reviews/q39wvy3ynwv5); [Hotel Tech Report: Review of Little Hotelier (2)](https://hoteltechreport.com/reviews/z6gxryky3wql) (via search snippet)

### Inferences
- A single "Rooms & rates" table mixing room types and rates is fine for setup and health checks. Day-to-day inventory and rate editing needs a separate matrix view (dates × room types / rate plans) with:
  - a date-range bulk updater
  - stop-sell or close-out
  - minimum-stay, closed-to-arrival and closed-to-departure restrictions

  The proposed side panel suits editing one room type or rate plan. It does not replace a matrix.
- Useful "health badges":
  - no rate loaded for upcoming dates
  - zero or suspicious rates (the Cloudbeds pitfall)
  - no physical rooms attached to a type
  - rooms out of order
  - restrictions not supported by a channel
- An audit trail of rate and inventory changes is a gap users notice (Little Hotelier review). Build it from day one.

### Gaps
- Mews Rate management and OPERA rate grid screens were not fetched in detail.
- I could not retrieve eZee Absolute's rate and inventory screens.

## 4. Multi-property switching and portfolio views

### Takeaway
The dominant pattern is a property switcher at the top-left (Cloudbeds) or in the profile menu (Mews), with search. A separate optional "multi-property" or "hub" mode adds portfolio-level navigation and dashboards. Data stays scoped to one property at a time unless the user is in an explicit portfolio or hub context.

### Cited Findings
- **Cloudbeds switcher:**
  - Staff switch property by clicking the arrow beside the property name at top-left, with search by name.
  - It is available to Organization Owner, Admins and Users, and to anyone registered at 2+ properties under one email.
  - The default opens the property in the same tab; the Organization page can open properties in separate tabs.

  — [Cloudbeds: Organizations – Everything you need to know](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/1260803386269-Organizations-Everything-you-need-to-know) (via search snippet)
- **Cloudbeds Multi-Property view:** an optional mode that only the Organization Owner or a Super Admin can enable. It adds a new navigation menu and property switcher, and it removes the "Switch to Classic" option. — [Cloudbeds: Organizations FAQ](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/4403591508123-Organizations-FAQ) (via search snippet)
- **Mews Multi-Property:**
  - Users open a portfolio by searching for it in the profile menu at top right.
  - "Currently, all users that you add to your Mews Multi-Property account obtain access to all properties."
  - Booking can show availability across properties in a city.

  — [Mews Help: How to set up your portfolio using Mews Multi-Property](https://help.mews.com/s/article/How-to-set-up-your-portfolio-using-Mews-Multi-Property); [Mews Help: Create a reservation](https://help.mews.com/s/article/create-a-reservation)
- **Mews API:** portfolio access tokens span all properties in the portfolio. — [Mews Connector API: Multi-property](https://mews-systems.gitbook.io/connector-api/concepts/multi-property)
- **OPERA Cloud:** multi-property users log in to a "Hub" or a specific property. At a Hub, each dashboard tile is tied to one property, and the property name appears under the tile title. — [OPERA Cloud 22.3: Managing Dashboard Tiles](https://docs.oracle.com/en/industries/hospitality/opera-cloud/22.3/ocsuh/t_managing_dashboard_tiles.htm)

### Inferences
- A global hotel switcher in the top bar is standard and validated. Recommended details:
  - search inside the switcher
  - show the current property name prominently on every screen
  - optionally open a property in a new tab
  - per-property permissions; Mews' all-or-nothing access is a limitation, not a model to copy
- An "All properties" option is best treated as its own portfolio context with aggregated pages, as OPERA Hub does with property-labelled tiles. It should not be a filter on single-property screens, where it creates ambiguity about which property an action applies to.

### Gaps
- I did not find screenshots or documents of a Mews portfolio dashboard's contents, or of eZee's or Little Hotelier's multi-property switching.

## 5. Onboarding and setup of a new property

### Takeaway
Vendors run onboarding mainly as a staged, coach-led process with a pre-kickoff data checklist. In-product steps are minimal: country, time zone and currency, then settings pages. Go-live happens once room types, rates, taxes and channels are configured. I found no evidence of an in-app progress checklist at the major vendors. The proposed in-app setup checklist would therefore be a differentiator for self-serve small hotels, not a copy of existing practice.

### Cited Findings
- **Cloudbeds onboarding stages:** 7 stages, from information gathering before kickoff to adoption and optimisation after go-live. Before kickoff, properties prepare:
  - property details and description
  - room types and occupancy
  - images
  - policies, taxes and fees

  — [Cloudbeds: Onboarding – Everything you need to know](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360041220954-Onboarding-Everything-you-need-to-know) (via search snippet)
- **Cloudbeds setup steps:** first login asks for country, time zone and currency. With the Onboarding Coach, the property sets up accommodation types, base rates, and taxes and fees. Listings must already exist on OTAs before they are connected, because Cloudbeds can't create OTA accounts. Go-live comes once channels are connected and property information is complete. — [Cloudbeds: What to expect during Cloudbeds onboarding](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360041220954-What-to-expect-during-Cloudbeds-onboarding) (via search snippet)
- **Mews:** multi-property setup requires entity mapping keys to be configured first, and users are told to contact their onboarding manager if the portfolio doesn't appear. — [Mews Help: How to set up your portfolio using Mews Multi-Property](https://help.mews.com/s/article/How-to-set-up-your-portfolio-using-Mews-Multi-Property)
- **eZee Absolute reviews:** one Capterra reviewer said "There was no training provided to new version". Multiple reviews say new staff take time to get comfortable. — [Capterra: eZee Absolute reviews](https://capterra.com/p/135751/eZee-Absolute/reviews/)

### Inferences
- The plan's split is consistent with what vendors gather before go-live: new properties get a setup checklist, live properties get an Overview. A sensible order is profile and policies, then room types, physical rooms, rates, taxes and fees, then media, then channels or booking engine, then go-live.
- Gate go-live on required items (rooms with rates, policies, taxes). This mirrors Cloudbeds' go-live criteria.
- For small independent and Indian hotels without an onboarding coach, an in-app checklist fills the role Cloudbeds' coach plays.

### Gaps
- I found no source showing an in-product setup wizard or checklist at Cloudbeds, Mews, Little Hotelier or eZee. This may exist but is undocumented in what I retrieved.
- Little Hotelier's self-onboarding flow was not retrieved.

## 6. User-review feedback on these areas

### Takeaway
Calendars with drag-and-drop are the most praised feature. The most common complaints are about reporting, support, sideways-scrolling calendars that make extending stays hard, and missing change history. Mews leads on ease of use. eZee is praised as easy to learn, but its newer stay view and reporting draw criticism.

### Cited Findings
- **Cloudbeds praise:** Capterra reviewers widely like the calendar, citing easy booking changes and clear views. One reviewer called it the best calendar view they'd used, praising drag-and-drop (2018, older). — [Capterra: Cloudbeds reviews](https://www.capterra.com/p/158839/Cloudbeds/reviews); [Capterra page 7](https://www.capterra.com/p/158839/Cloudbeds/reviews/?page=7)
- **Cloudbeds complaints:** slow, email-only support is the most common complaint. A 2025 reviewer called reports unreliable and the interface cluttered. — [Capterra: Cloudbeds reviews](https://www.capterra.com/p/158839/Cloudbeds/reviews/?page=2%5C)
- **Mews ratings:** Software Advice rates Mews 4.6/5 from 59 reviews, with ease of use 4.7 and support 4.4. — [Software Advice UK: Mews](https://www.softwareadvice.co.uk/software/35479/mews-commander) (via search snippet)
- **Mews awards:** Hotel Tech Report named Mews Best PMS in 2024, 2025 and 2026. This is reported in that search summary and not independently verified. — [Software Advice UK: Mews](https://www.softwareadvice.co.uk/software/35479/mews-commander) (via search snippet)
- **eZee Absolute calendar complaint:** a long-time user said the updated stay view makes making or extending reservations hard because of left-right scrolling, and preferred one-click "Today / 15-day / 30-day" views. The same reviewer reported a Safari folio bug. — [Capterra: eZee Absolute reviews](https://capterra.com/p/135751/eZee-Absolute/reviews/)
- **eZee Absolute other complaints:**
  - confusing reporting with limited customisation
  - OTA cancellations not always showing
  - editing a guest's details changed all their past bookings
  - occasional sync problems and limited housekeeping features

  Reviewers also praise eZee as user-friendly, easy to train on, and backed by 24/7 support. Some reviews date from 2016–2018. — [Capterra: eZee Absolute reviews](https://capterra.com/p/135751/eZee-Absolute/reviews/); [Capterra page 4](https://www.capterra.com/p/135751/eZee-Absolute/reviews/?page=4)
- **Little Hotelier** (Hotel Tech Report, small Spanish villa property, 5–9 rooms): Ease of Use 5/5, called "very manageable, agile, and complete". Complaints: no inventory history or export, booking engine design not customisable enough, and tourist-tax handling. — [Hotel Tech Report: Review of Little Hotelier](https://hoteltechreport.com/reviews/q39wvy3ynwv5)
- **Aggregated review summaries:** recurring cross-vendor complaints include reporting limits, awkward exports, date-range gaps and slow post-go-live support. The source is an AI-generated comparison with low stated confidence, so treat it as directional only. — [rfp.wiki: Mews vs Cloudbeds](https://www.rfp.wiki/vendors/mews-systems/cloudbeds)

### Inferences
- Calendar design choices to take from reviews:
  - one-click date windows ("Today", 7, 14 or 30 days)
  - a sticky room column
  - extending a stay by dragging the block's edge
  - avoiding heavy sideways scrolling, per the eZee complaint
- Guest profiles and reservation snapshots should be decoupled, so that editing a guest doesn't rewrite past bookings (eZee complaint). This fits the plan's principle of decoupled state.
- Small and Indian independents value ease of training and responsive support. A clear "Today" home and guided setup directly address the eZee learning-curve complaints.

### Gaps
- I did not retrieve G2 or Hotel Tech Report usability scores for eZee, Little Hotelier, RMS, Hotelogix or Apaleo.
- India-specific UI conventions (e.g. GST invoicing screens in eZee) were not researched in the time available.
