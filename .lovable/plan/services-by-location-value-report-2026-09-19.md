# Services by Location Value Report

A new report inside the Analytics tab of Reports: a grid with services across the top and locations down the side, filtered by a date range, with an editable price per service so you can put a dollar value on the services rendered.

## What you'll see

- A date range (from / to) at the top. Only visits within that range are counted.
- A price row under the service headings: type a price for each service. Prices are entered on the report each time you run it (nothing is saved to the services list).
- The grid:
  - Each row is a location, each column is a service.
  - Each cell shows the count pulled from the system and, once a price is entered, the value underneath (count x price).
  - A total column per location (total count and total value) and a total row per service.
  - A grand total value in the bottom-right corner.
- Print and Export to CSV buttons, matching the other reports. Both include the date range, the prices used, counts and values.

## Notes

- Locations come from the event each patient visit belongs to, so a location with multiple events over the range is combined into one row.
- Prices typed in are remembered while you stay on the page; reloading clears them.
- Currency is shown as plain formatted numbers with a $ prefix.

## Technical details

- New component `src/components/reports/ServiceValueTab.tsx`, rendered inside the existing `analytics` TabsContent in `src/components/Reports.tsx` (above the current chart area).
- Data: paginated `.range()` fetch of `service_queue` joined to `services (id,name)` and `patient_visits (visit_date, event_id, events (location_id, locations (name)))`; filter `patient_visits.visit_date` between the selected dates. Pagination loop follows the existing pattern in `Reports.tsx` to avoid the 1,000-row cap.
- Counts include all queue rows in range; a status filter is not applied (matches how the other service reports count).
- Prices held in local state `Record<serviceId, number>`; no schema change, no migration.
- Print uses `createRoot` into a print window like the existing printable reports; CSV export reuses the existing blob-download helper in `Reports.tsx`.
