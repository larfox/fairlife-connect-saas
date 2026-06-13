# Add Age & Sex Demographic Report

Add a new "Demographics" tab to the Reports menu that breaks patients down by **10-year age bands** and **sex**, with the ability to filter by **event or location**, **print**, and **export to CSV**.

## What the user will see

- A new tab **Demographics** (with a `PieChart` icon) in the Reports tab bar.
- A scope selector: **By Event** or **By Location** (radio/toggle), then a dropdown of events or locations accordingly.
- A **Generate Report** button.
- Results: a table/grid of age bands (0-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80+) as rows, with columns **Male**, **Female**, **Other/Unspecified**, and **Total** — plus a totals row and overall counts (total patients, % male/female, average age).
- **Print** and **Export CSV** buttons matching the styling of the other report tabs.

## How it works

### Data fetching
- Reuse the existing `patient_visits` query pattern. For **By Event**, filter `patient_visits.event_id = selectedEvent`. For **By Location**, fetch events for that location first (or filter visits via `event.location_id`), then gather their patients.
- Select `patients(date_of_birth, gender)` plus name/number for the patient list. De-duplicate patients (a patient may have multiple visits) by patient id, same approach as the parish report.

### Calculation
- Compute age from `date_of_birth` relative to today using `date-fns` (`differenceInYears`). Patients with no DOB go into an "Unknown" age row.
- Normalize `gender` into Male / Female / Other-Unspecified buckets.
- Build a matrix `band x sex -> count`, plus totals and average age.

### Print
- Extend the print flow. The existing `PrintableReport` is patient-list oriented, so the demographic print will use a dedicated lightweight printable layout (a summary matrix table) rendered into the print window — same `window.open` + `createRoot` mechanism already used in `printReport`. Title reflects the selected event or location.

### Export CSV
- Reuse the existing `exportToCSV` helper, passing the demographic matrix rows (one row per age band with Male/Female/Other/Total columns) so the CSV mirrors the on-screen table.

## Technical details

Files to change:
- `src/components/Reports.tsx`
  - Add state: `demographicScope` ('event' | 'location'), `selectedLocation`, `demographicReport` (matrix + summary).
  - Add `locations` state and fetch them in `fetchInitialData` (from `locations` table, active only).
  - Add `generateDemographicReport()` building the age/sex matrix with de-duped patients.
  - Add a `Demographics` `TabsTrigger` + `TabsContent`; change `TabsList` grid from `grid-cols-6` to `grid-cols-7`.
  - Add print + CSV handlers for the demographic data.
- `src/components/PrintableReport.tsx` (or a new small `PrintableDemographicReport.tsx`)
  - Add a printable summary-matrix layout for the demographic report (age bands x sex), since the current component is structured around patient rows. A new dedicated component keeps the existing report printing untouched.

Age bands: `0-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80+`, plus `Unknown` when DOB is missing. Sex columns: `Male, Female, Other/Unspecified`.

No database schema changes are required — `date_of_birth` and `gender` already exist on `patients`.
