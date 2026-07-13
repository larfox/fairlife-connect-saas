## Goal

Change the **Location Summary** report so that instead of pooling all selected events into one combined total, it produces a **separate summary per event** — each showing that event's own age demographics and services usage. Multi-event selection, print, and CSV export are kept.

## What changes

### On-screen (Reports.tsx, `location-summary` tab)
- Keep the checkbox list of events + Generate button.
- After generating, render **one section per selected event**, each containing:
  - Event header (name, location, date, total unique patients for that event).
  - Age & sex demographic matrix table (same layout as today) scoped to that event.
  - Services summary table (unique patients per service) scoped to that event.
- Remove the single combined/pooled totals view.

### Data (`generateLocationSummaryReport`)
- Query patient visits and service_queue as today, but **group by `event_id`** instead of merging into one map.
- For each selected event, run the existing demographic + services calculation logic against only that event's patients, producing a per-event result object:
  - `{ eventId, eventName, locationName, eventDate, rows, summary, serviceRows }`.
- Store results as an array: `locationSummaryReport: EventSummary[]`.
- To get `event_id` for demographics, change the visits query select to include `event_id` (it already includes `patient` details).

### Print (`printLocationSummaryReport` + PrintableDemographicReport)
- Render one `PrintableDemographicReport` block per event (each with its own `scopeName`/`eventsLabel` = the event name, its `rows`, `summary`, and `serviceRows`), stacked in the print window with page breaks between events.

### CSV (`exportLocationSummaryCSV`)
- Emit rows grouped per event, adding an `event` column (event name) so each event's demographics and services rows are clearly attributed. One CSV, sections repeated per event.

## Files
- `src/components/Reports.tsx` — restructure state type, `generateLocationSummaryReport`, `exportLocationSummaryCSV`, `printLocationSummaryReport`, and the `location-summary` `TabsContent` to iterate per event.
- `src/components/PrintableDemographicReport.tsx` — no structural change needed (reused once per event); optionally add a page-break style for stacking.

No database schema changes.
