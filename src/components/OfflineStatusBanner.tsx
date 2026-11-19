import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { listOutbox, onOutboxChange, removeOutbox, updateOutbox, type OutboxItem } from "@/lib/offline/core";
import { isOffline, syncNow } from "@/lib/offline/install";

const TABLE_LABELS: Record<string, string> = {
  patients: "Patient", patient_visits: "Visit", service_queue: "Service queue", basic_screening: "Screening",
  dental_assessments: "Dental", optician_assessments: "Optician", ecg_results: "ECG", immunizations: "Immunization",
  pap_smear_assessments: "Pap smear", prescriptions: "Prescription", patient_prognosis: "Prognosis",
  patient_complaints: "Complaint", audit_logs: "Activity log", events: "Event",
};
const describe = (i: OutboxItem) =>
  `${TABLE_LABELS[i.table] ?? i.table} ${i.method === "POST" ? "added" : i.method === "DELETE" ? "removed" : "updated"}`;

const OfflineStatusBanner = () => {
  const [offline, setOffline] = useState(isOffline());
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => listOutbox().then(setItems).catch(() => {});
    const net = () => setOffline(isOffline());
    const onSync = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setSyncing(d.state === "start");
      if (d.state === "done") { refresh(); if (d.sent > 0) { setJustSynced(true); setTimeout(() => setJustSynced(false), 4000); } }
    };
    refresh();
    const off = onOutboxChange(refresh);
    window.addEventListener("online", net);
    window.addEventListener("offline", net);
    window.addEventListener("offline-sync", onSync);
    return () => { off(); window.removeEventListener("online", net); window.removeEventListener("offline", net); window.removeEventListener("offline-sync", onSync); };
  }, []);

  const pending = items.filter((i) => i.status === "pending").length;
  const failed = items.filter((i) => i.status === "failed");

  let content: React.ReactNode = null;
  if (offline) {
    content = (<><CloudOff className="h-4 w-4 shrink-0" /><span>Offline – {pending} change{pending === 1 ? "" : "s"} waiting to sync. Keep this page open; don't reload.</span></>);
  } else if (syncing) {
    content = (<><RefreshCw className="h-4 w-4 shrink-0 animate-spin" /><span>Syncing…</span></>);
  } else if (failed.length) {
    content = (<><AlertTriangle className="h-4 w-4 shrink-0" /><span>{failed.length} change{failed.length === 1 ? "" : "s"} could not be saved.</span>
      <Button size="sm" variant="secondary" className="h-7" onClick={() => setOpen(true)}>Review</Button></>);
  } else if (pending) {
    content = (<><RefreshCw className="h-4 w-4 shrink-0" /><span>{pending} change{pending === 1 ? "" : "s"} waiting to sync</span>
      <Button size="sm" variant="secondary" className="h-7" onClick={() => syncNow()}>Sync now</Button></>);
  } else if (justSynced) {
    content = (<><CheckCircle2 className="h-4 w-4 shrink-0" /><span>All changes saved</span></>);
  }

  return (
    <>
      {content && (
        <div role="status" className={`sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-2 px-3 py-2 text-sm font-medium ${offline || failed.length ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
          {content}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changes that could not be saved</DialogTitle>
            <DialogDescription>Retry sends the change again. Discard throws it away for good.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {failed.map((i) => (
              <div key={i.id} className="rounded-md border p-3 space-y-2">
                <div className="font-medium">{describe(i)} <span className="text-muted-foreground font-normal">· {new Date(i.createdAt).toLocaleString()}</span></div>
                {i.error && <div className="text-xs text-muted-foreground break-words">{i.error}</div>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={async () => { await updateOutbox({ ...i, status: "pending", error: undefined }); syncNow(); }}>Retry</Button>
                  <Button size="sm" variant="destructive" onClick={() => removeOutbox(i.id)}>Discard</Button>
                </div>
              </div>
            ))}
            {!failed.length && <p className="text-sm text-muted-foreground">Nothing to review.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default OfflineStatusBanner;
