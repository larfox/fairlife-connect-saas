# Works on any device + full offline use at health fairs

## What you'll get
- **Fits any screen:** phones, tablets and laptops each get a layout that suits them. Tabs scroll sideways on small screens, tables turn into cards or scroll, pop-up forms fill the screen on phones, and buttons are big enough to tap.
- **Installable:** staff can add the app to a phone, tablet or computer home screen. It opens like a normal app with the bus-and-stethoscope icon.
- **Works without internet (published app only):**
  - The app opens even with no connection.
  - Patients, events, services and queues that were loaded while online stay available.
  - Staff can register patients, record screenings, other assessments, prescriptions and prognosis, and move patients through the service queue.
  - New work is saved on the device. It is sent to the server automatically, in order, once the connection returns.
- **Clear status:** a banner shows "Offline – X changes waiting to sync", then "Syncing…", then "All changes saved". If a change can't be sent, it is listed with Retry and Discard options.

## Limits to know
- Staff must sign in while online at least once on each device before going offline.
- Offline mode only works in the published app, not in the editor preview.
- Reports, the Audit Trail, staff and foundation setup, and deleting records stay online-only. They need complete, up-to-date data.
- Two devices offline at once can each register people. Patient numbers (P000123) are given out by the server, so offline registrations show "Pending number" until they sync.
- If two devices edit the same record offline, the last one to sync wins.
- Data stored on the device is cleared on sign-out. A shared device won't keep patient details.

## Steps
1. **Device layouts:** go through the header, dashboard, events, patient registration, queue, patient tabs, reports and the pop-up forms, and fix how each looks on phone, tablet and desktop.
2. **Install and offline start:** add the app icon and install details, plus a safe background helper that keeps the app files on the device. It never runs in the editor preview.
3. **On-device copy of the data:** keep a local copy of events, locations, services, staff permissions and the selected event's patients, visits and queue. Refresh it whenever the app is online.
4. **Save-now, sync-later:** route every patient, visit, screening, assessment and queue change through one place. Online, it saves straight to the server. Offline, it saves on the device, updates the screen right away and queues the change.
5. **Sync:** when the connection returns, send queued changes in order. New patients and visits get temporary ids that are swapped for the real ones, so linked screenings and queue entries stay attached. The audit log entries are sent too.
6. **Status banner and failed-change list.**
7. **Testing:** automated tests for the queue order, the id swap and retry. A browser check at phone and desktop sizes, plus a simulated offline registration, then reconnect and confirm the data reached the server.

## Technical details
- Use `vite-plugin-pwa` (generateSW, autoUpdate, `injectRegister: null`, `devOptions.enabled: false`) with a single guarded registration wrapper. It refuses to register in dev, inside iframes, on Lovable preview hosts and with `?sw=off`, and unregisters stale workers there. Navigation uses NetworkFirst, hashed assets use CacheFirst, and `/~oauth` is excluded.
- Store data in IndexedDB via `dexie`: tables for cached entities plus an `outbox` (op, table, payload, temp-id map, attempts, error).
- Use a data layer (`src/lib/offline/`) wrapping the Supabase calls in the patient and queue flows (`usePatientRegistration`, `serviceQueueService`, the patient tabs, `PatientsManager`, the queue components). Reads fall back to the IndexedDB cache when offline. Writes go through the outbox.
- Use client-generated UUIDs for new rows so the id swap is mostly a no-op. Only `patient_number` and `queue_number` are server-assigned and get backfilled after sync.
- Keep the existing in-memory auth workaround (bug #39394). A minimal session marker is held so an offline reload stays signed in until the token expires. The session is never refreshed offline.
