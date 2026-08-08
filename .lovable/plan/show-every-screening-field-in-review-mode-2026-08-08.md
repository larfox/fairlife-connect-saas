# Show every screening field in review mode

## The cause

In the Basic Screening view (read-only) mode, each measurement is wrapped in a conditional such as `{basicScreening.cholesterol && (...)}`. Any field left blank at screening time is dropped from the results table and the summary cards entirely, so cholesterol simply disappears from records where it was never entered. In edit mode the inputs are always rendered, which is why it appears there.

## What to change

Render every screening field in review mode regardless of whether a value exists. Blank fields show a muted "Not recorded" instead of the value, with no status colour or badge applied.

Fields covered: height, weight, BMI, blood pressure, heart rate, temperature, blood sugar, cholesterol, oxygen saturation, urine, and notes.

Applies to:
- `src/components/patient/BasicScreeningTab.tsx` — the results table rows and the summary cards grid (the main screening review screen).
- `src/components/queue/PatientDetailsModal.tsx` — the screening summary block.
- `src/components/patient/PatientHistoryModal.tsx` — the Basic Screening tab.

## Technical notes

- Replace `{value && (<Row/>)}` guards with always-rendered rows; the value cell becomes `value != null ? formatted : "Not recorded"`. Use `!= null` rather than truthiness so a legitimate `0` still displays.
- Status helpers (`getCholesterolStatus`, blood pressure interpretation, etc.) are only called when a value is present; otherwise the row keeps neutral styling and an empty status cell.
- Where a screening record does not exist at all for the visit, keep the existing "No basic screening data recorded" empty state.
