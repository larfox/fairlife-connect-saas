## Goal

Refine the per-event **Location Summary** report so it:
1. Shows only the **totals** of the demographics (not the full age-band breakdown).
2. Displays the **services section rotated** — service names become column headers with a single row of patient counts, instead of a tall two-column list.

Applies consistently to the on-screen view, the print output, and the CSV export.

## What changes

### Demographics — totals only
- **On-screen (`Reports.tsx`, `location-summary` tab):** Remove the per-age-band table rows. Keep the summary cards (Total Patients, Male, Female, Avg. Age) and show a single compact totals table/row with Male, Female, Other/Unspecified, and Total. The age-band matrix is dropped from display.
- **Print (`PrintableDemographicReport.tsx`):** Render only the totals row (Male / Female / Other / Total) instead of iterating every age band. The summary box stays.
- **CSV (`exportLocationSummaryCSV`):** Emit only the totals line per event for demographics instead of one line per age band.

### Services — rotated (transposed) layout
- **On-screen:** Replace the tall "Service | Patients" table with a horizontal table: one header row of service names and one data row of their patient counts (horizontally scrollable). Keep the "No service data" fallback.
- **Print (`PrintableDemographicReport.tsx`):** Render the services table transposed — service names as `<th>` columns, counts in a single row beneath.
- **CSV:** Write services as one header row of service names followed by one row of counts per event.

Note: the underlying `rows` (age bands) data will still be computed but simply not rendered, so no data logic changes are required. Optionally the age-band computation can stay untouched to minimize risk.

## Files
- `src/components/Reports.tsx` — update the `location-summary` `TabsContent` (demographics table → totals only; services table → rotated) and adjust `exportLocationSummaryCSV`.
- `src/components/PrintableDemographicReport.tsx` — render totals-only demographics and a transposed services table.

No database or data-fetching changes.