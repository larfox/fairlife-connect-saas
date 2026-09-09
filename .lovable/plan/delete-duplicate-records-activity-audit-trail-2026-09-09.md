# Delete duplicate records + activity audit trail

## What you get

1. A **Delete** button on the Edit Patient screen, visible only to admins, that removes a person's records for the currently selected event (their queue entry, screening results and service records for that event). The person stays on file for other events.
2. A new **Audit Trail** tab in Reports showing who did what, with date and time, filterable by person, action and date range, plus print and CSV export.

## Delete flow

- Button sits at the bottom of the Edit Patient window, styled as a destructive action, separated from Save.
- Clicking it opens a confirmation dialog naming the person and the event, and stating exactly what will be removed. Confirmation requires a second click.
- Removal covers, for that event only: the service queue entries, screening and assessment records tied to that visit, and the visit itself.
- Non-admins never see the button.
- The deletion is written to the audit trail with the person's name, patient number, event and a snapshot of what was removed.

## Audit trail

- Records: sign-in and sign-out, patient created / edited / deleted, visit deleted, screening saved or changed, service status changes, event created / edited.
- Each row stores: who (name and email from staff record), action, what record, a short description, and the timestamp.
- Reports gets an "Audit Trail" tab with a table (Date/Time, User, Action, Record, Details), filters for user, action type and date range, paging for large volumes, and the same print and export buttons used by the other reports.
- Only admins can see the Audit Trail tab; entries can never be edited or deleted from the app.

## Technical notes

- New `public.audit_logs` table: `id`, `user_id` (auth user), `user_email`, `user_name`, `action` (text), `entity_type`, `entity_id`, `description`, `metadata` (jsonb), `created_at`. GRANTs: `SELECT, INSERT` to `authenticated`, `ALL` to `service_role`. RLS on: insert allowed for any authenticated user where `user_id = auth.uid()`; select restricted to admins via an `is_admin` check against `public.staff`; no update or delete policies. Index on `created_at desc` and on `user_id`.
- Add a security-definer helper `public.is_admin(_user_id uuid)` reading `public.staff.is_admin`, used by the select policy and by the frontend admin gate (frontend continues to use the existing `useStaffPermissions` hook).
- New `src/lib/audit.ts` exporting `logAudit({ action, entityType, entityId, description, metadata })` that resolves the current user and staff name, then inserts a row. Failures are logged to console only and never block the user action.
- Call `logAudit` from: `AuthModal` (sign-in), `Header` (sign-out), `usePatientRegistration` (create), `PatientEditModal` (update, delete), `BasicScreeningTab` (screening save), `serviceQueueService` (status change), `CreateEventModal` / `EventsManagement` (event create/edit).
- Delete implementation in `PatientEditModal`: look up the visit for `patient.id` + `selectedEvent.id`, then delete child rows keyed on `patient_visit_id` (`service_queue`, `basic_screening`, `dental_assessments`, `optician_assessments`, `ecg_results`, `immunizations`, `pap_smear_assessments`, `prescriptions`, `patient_prognosis`, `patient_complaints`) before deleting the `patient_visits` row. Wrapped in a single async handler with an `AlertDialog` confirmation.
- Reports: new `audit` tab in `src/components/Reports.tsx` with its own fetch (paginated via `.range()` to avoid the 1000-row cap), filter state, CSV export following the existing export helpers, and a printable view rendered through the existing `createRoot` print pattern.
