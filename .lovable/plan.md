# Add "Location Summary" Report

Add a new tab to the Reports menu that combines an **age & sex demographic summary** with a **health-fair services summary** (patients per service). Users pick **multiple events** from a checkbox list, then **generate**, **print**, and **export to CSV**.

## What the user will see

- A new **Location Summary** tab (with a `MapPin`/`BarChart3` icon) in the Reports tab bar.
- A scrollable **checkbox list of all events** (name, location, date), with "Select all / Clear" helpers.
- A **Generate Report** button.
- Results, once generated:
  - Header showing which events are included and total unique patients.
  - **Age demographics** section: summary cards (Total, Male, Female, Avg. Age) plus the age-band x sex matrix table (reusing the existing demographic layout).
  - **Services summary** section: a table listing each service with its count of unique patients.
  - **Print** and **Export CSV** buttons.

## How it works

### Event selection
- Reuse the already-fetched `events` list. Track selection in new state `selectedEventIds: string[]`.
- Checkbox list rendered with the existing `Checkbox` UI component; "Select all" / "Clear" toggles.

### Data fetching (combined query for the selected events)
- Query `patient_visits` filtered with `.in("event_id", selectedEventIds)`, selecting `patient:patients(id, date_of_birth, gender)` for demographics.
- Query `service_queue` joined to `patient_visits!inner` filtered by `.in("patient_visit.event_id", selectedEventIds)`, selecting `service:services(name)` and `patient_visit.patient_id` for the services summary.

### Calculation
- **Demographics**: reuse the existing `AGE_BANDS`, `sexBucket`, and matrix-building logic from `generateDemographicReport` (de-duplicate patients by id across all selected events).
- **Services**: group by service name, counting **unique patients** per service (Set of patient ids). Produce rows `{ service_name, patient_count }` sorted by count desc.

### Print
- Reuse the `window.open` + `createRoot` mechanism. Extend `PrintableDemographicReport` to optionally render a services-summary table below the demographic matrix (new optional props `serviceRows` and `eventsLabel`), or add a small dedicated printable section. Title reflects the selected events.

### Export CSV
- Reuse the existing `exportToCSV` helper. Export the demographic matrix rows and a services section (two logical blocks written to one CSV, or a combined row set with a section label column).

## Technical details

Files to change:
- `src/components/Reports.tsx`
  - Add state: `selectedEventIds` (string[]), `locationSummaryReport` (demographic rows/summary + service rows + events label).
  - Add `generateLocationSummaryReport()` running the two queries above and building both sections.
  - Add `exportLocationSummaryCSV()` and `printLocationSummaryReport()` handlers.
  - Add a `location-summary` `TabsTrigger` + `TabsContent`; change `TabsList` grid from `grid-cols-7` to `grid-cols-8` (or wrap/scroll the tab bar on small screens).
  - Import `Checkbox` from `@/components/ui/checkbox`.
- `src/components/PrintableDemographicReport.tsx`
  - Add optional props `serviceRows?: { service_name: string; patient_count: number }[]` and `eventsLabel?: string`; render an extra "Services Summary" table when `serviceRows` is provided.

No database schema changes required — `date_of_birth`, `gender`, `patient_visits`, `service_queue`, and `services` already exist.

Age bands and sex buckets match the existing Demographics tab (`0-9 … 80+`, plus `Unknown`; Male / Female / Other-Unspecified).
