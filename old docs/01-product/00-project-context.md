# Project Context

## Product

**Working name:** Staywise. **Type:** Responsive hotel booking website and hotel operations console backed by a modular API. **Primary value:** Guests can find and book a room with trustworthy date-based availability and transparent pricing; operators can manage inventory and stays without overbooking.

## Users

- **Guest:** searches, books, pays, views/cancels eligible bookings, and reviews completed stays.
- **Super admin:** operates the platform and can manage all properties, staff, bookings and reports.
- **Hotel manager (later release):** manages assigned properties only. Do not imply this role has platform-wide access.

## Product outcome

A guest can search a city and date range, select a suitable room type, complete a booking, receive confirmation, and later complete the stay. Staff can configure hotels and inventory and reliably manage that booking.

## Operating principles

1. The server is authoritative for availability, price, taxes, discounts and booking state.
2. No confirmed booking may exceed inventory for any occupied night.
3. Payment notifications may be duplicated or delayed; processing must be idempotent.
4. Keep the first release a modular monolith. Add infrastructure only for a demonstrated need.
5. Make policy, money and inventory changes traceable.
6. State assumptions explicitly; laws, tax treatment and payment rules require validation for launch markets.

## Initial assumptions to validate

- Start with one country, one currency (INR), one time-zone policy per property, and one language.
- Inventory is pooled by room type, not assigned to physical room numbers.
- A booking consumes inventory for each night from check-in inclusive to checkout exclusive.
- A temporary hold lasts 10 minutes and expires automatically.
- Guest checkout without an account is allowed; an account can be offered after booking.
- Online payment gateway and GST treatment are selected and reviewed before payment launch.

## Success measures

Track search-to-booking conversion, payment success rate, booking errors, overbooking incidents (target zero), cancellation/refund time, property onboarding time, and support contacts per booking. Set numeric targets after baseline discovery.
