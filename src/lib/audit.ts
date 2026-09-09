import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "sign_in"
  | "sign_out"
  | "patient_created"
  | "patient_updated"
  | "patient_visit_deleted"
  | "screening_saved"
  | "service_status_changed"
  | "event_created"
  | "event_updated";

interface AuditEntry {
  action: AuditAction | string;
  entityType?: string;
  entityId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
}

const nameCache = new Map<string, string>();

const resolveName = async (email?: string | null): Promise<string | null> => {
  if (!email) return null;
  if (nameCache.has(email)) return nameCache.get(email)!;
  try {
    const { data } = await supabase
      .from("staff")
      .select("first_name, last_name")
      .eq("email", email)
      .maybeSingle();
    const name = data ? `${data.first_name} ${data.last_name}`.trim() : email;
    nameCache.set(email, name);
    return name;
  } catch {
    return email;
  }
};

/**
 * Records an activity entry in the audit trail.
 * Never throws — failures are logged to the console only.
 */
export const logAudit = async (entry: AuditEntry): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const userName = await resolveName(user.email);

    const { error } = await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: userName,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      description: entry.description ?? null,
      metadata: (entry.metadata ?? {}) as never,
    });

    if (error) console.error("[audit] failed to record entry:", error.message);
  } catch (error) {
    console.error("[audit] unexpected error:", error);
  }
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  sign_in: "Signed in",
  sign_out: "Signed out",
  patient_created: "Patient registered",
  patient_updated: "Patient updated",
  patient_visit_deleted: "Event record deleted",
  screening_saved: "Screening saved",
  service_status_changed: "Service status changed",
  event_created: "Event created",
  event_updated: "Event updated",
};

export const auditActionLabel = (action: string) =>
  AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
