# Cholesterol on the screening record: investigation and fix

## What the code currently shows

Confirmed by reading the files:

- The Basic Screening tab (`src/components/patient/BasicScreeningTab.tsx`) already has a Cholesterol (mmol/L) input, a Normal / Borderline High / High status rule, a row in the results table and a results card. This is the tab opened from the queue, patient search and service queue.
- The older `PatientDetailsModal.tsx` and the Patient History modal also render cholesterol.
- Cholesterol is **missing** from the emailed screening summary (`supabase/functions/send-screening-summary/index.ts`) — that email lists blood sugar but never cholesterol, oxygen saturation or urine.
- The Patient History list view (`PatientHistory.tsx`) shows only a screening Completed/Pending badge, no values at all.

So the field exists in the entry form, but not in the summary that gets sent out. I have not yet confirmed what you are looking at on screen, so the first step is to see the live screen.

## Steps

1. Open the running app in a browser session, navigate to a patient record's Basic Screening tab at your current mobile-width viewport, and screenshot it. This confirms whether the field renders, is hidden by permissions, or is pushed off-screen on narrow widths.
2. If the field is not rendering, fix the cause found in step 1 (permission gate, layout, or a stale/duplicated screening component being used on that route).
3. Add Cholesterol to the emailed screening summary, alongside blood sugar, with the same mmol/L unit and status wording used in the app.
4. Report back with the screenshot evidence.

## Technical notes

- Cholesterol is saved with `parseInt`, so a value like 5.4 is stored as 5. If you enter decimals, that is likely why a value looks wrong or blank-ish. Worth changing to `parseFloat` with `step="0.1"` on the input — say the word and I will include it.
- The `basic_screening.cholesterol` column already exists in the database; no migration is needed.
