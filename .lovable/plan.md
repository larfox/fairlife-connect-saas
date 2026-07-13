# Fix incorrect Location Summary service counts

## Problem
In the per-event Location Summary, the rotated services counts are wrong. For Shrewsbury Baptist the report shows `know your numbers 3`, `General Consultation 3`, `HIV 2`, `Paps 1`, but the actual data is `know your numbers 46`, `General Consultation 46`, `HIV 2`, `Paps 1`.

The transposition/display logic is correct. The real cause is data truncation: `generateLocationSummaryReport` in `src/components/Reports.tsx` runs

```text
supabase.from("service_queue").select(...).in("patient_visit.event_id", selectedEventIds)
```

Supabase (PostgREST) returns at most 1000 rows per request by default. The project has 1835 `service_queue` rows, so the result is capped at 1000 and rows are dropped arbitrarily. Large services (know your numbers, General Consultation) lose most of their rows, while tiny services (HIV=2, Paps=1) happen to remain — matching exactly the symptom reported.

The demographics query on `patient_visits` has the same latent risk once visit counts exceed 1000.

## Fix
Fetch all matching rows instead of the first 1000, then run the existing grouping/counting logic unchanged.

- In `src/components/Reports.tsx`, `generateLocationSummaryReport`:
  - Replace the single `service_queue` select with a paginated fetch that loops using `.range(from, from + PAGE - 1)` (page size 1000) until fewer than a full page is returned, concatenating results into one `queueData` array.
  - Apply the same paginated fetch to the `patient_visits` demographics query so it is also complete.
- Keep all downstream grouping, unique-patient `Set` counting, sorting, on-screen rendering, print (`PrintableDemographicReport`), and CSV export exactly as-is — they operate on the assembled arrays and already produce correct results once the data is complete.

## Technical detail
Add a small async pagination helper inside the function (or a local loop per query), e.g. repeatedly call the query builder with `.range()` and break when the returned batch length is less than the page size. This guarantees complete data regardless of how many events are selected or how many total rows exist.

## Files
- `src/components/Reports.tsx` — paginate the `service_queue` and `patient_visits` queries in `generateLocationSummaryReport`.

No database, schema, or data-fetching-shape changes; no changes to display/print/CSV logic.
