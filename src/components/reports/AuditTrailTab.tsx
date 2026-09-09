import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { auditActionLabel } from "@/lib/audit";
import { format } from "date-fns";

interface AuditLogRow {
  id: string;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

const AuditTrailTab = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [userOptions, setUserOptions] = useState<string[]>([]);
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("staff")
        .select("is_admin")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle();
      setIsAdmin(!!data?.is_admin);
    };
    checkAdmin();
  }, []);

  const buildQuery = () => {
    let query = supabase
      .from("audit_logs")
      .select("id, user_name, user_email, action, entity_type, entity_id, description, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (userFilter !== "all") query = query.eq("user_email", userFilter);
    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (fromDate) query = query.gte("created_at", new Date(`${fromDate}T00:00:00`).toISOString());
    if (toDate) query = query.lte("created_at", new Date(`${toDate}T23:59:59`).toISOString());

    return query;
  };

  const fetchLogs = async (targetPage = page) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { data, error, count } = await buildQuery().range(
        targetPage * PAGE_SIZE,
        targetPage * PAGE_SIZE + PAGE_SIZE - 1
      );
      if (error) throw error;
      setLogs(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error("Error loading audit trail:", error);
      toast({
        title: "Could not load activity",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load filter options once
  useEffect(() => {
    if (!isAdmin) return;
    const loadOptions = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("user_email, action")
        .order("created_at", { ascending: false })
        .limit(1000);
      const users = Array.from(new Set((data || []).map(d => d.user_email).filter(Boolean))) as string[];
      const actions = Array.from(new Set((data || []).map(d => d.action).filter(Boolean)));
      setUserOptions(users);
      setActionOptions(actions);
    };
    loadOptions();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchLogs(0);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, userFilter, actionFilter, fromDate, toDate]);

  const fetchAllFiltered = async (): Promise<AuditLogRow[]> => {
    const all: AuditLogRow[] = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await buildQuery().range(from, from + step - 1);
      if (error) throw error;
      all.push(...((data || []) as AuditLogRow[]));
      if (!data || data.length < step) break;
      from += step;
    }
    return all;
  };

  const handleExport = async () => {
    try {
      const rows = await fetchAllFiltered();
      if (rows.length === 0) {
        toast({ title: "Nothing to export", description: "No activity matches these filters." });
        return;
      }
      const headers = ["Date & Time", "User", "Email", "Action", "Record", "Details"];
      const csv = [
        headers.join(","),
        ...rows.map(r =>
          [
            format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss"),
            r.user_name || "",
            r.user_email || "",
            auditActionLabel(r.action),
            r.entity_type || "",
            r.description || "",
          ]
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit_trail_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handlePrint = async () => {
    try {
      const rows = await fetchAllFiltered();
      const printWindow = window.open("", "_blank", "width=1000,height=700");
      if (!printWindow) return;

      const body = rows
        .map(
          r => `<tr>
            <td>${format(new Date(r.created_at), "yyyy-MM-dd HH:mm")}</td>
            <td>${r.user_name || ""}<br/><span class="muted">${r.user_email || ""}</span></td>
            <td>${auditActionLabel(r.action)}</td>
            <td>${r.entity_type || ""}</td>
            <td>${(r.description || "").replace(/</g, "&lt;")}</td>
          </tr>`
        )
        .join("");

      printWindow.document.write(`<!DOCTYPE html><html><head><title>Audit Trail</title><meta charset="utf-8">
        <style>
          body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:24px;}
          h1{font-size:18px;margin:0 0 4px;}
          .sub{color:#555;margin-bottom:16px;}
          table{width:100%;border-collapse:collapse;}
          th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top;}
          th{background:#f2f2f2;}
          .muted{color:#777;font-size:10px;}
        </style></head><body>
        <h1>Activity Audit Trail</h1>
        <div class="sub">Generated ${format(new Date(), "PPpp")} &middot; ${rows.length} entries</div>
        <table><thead><tr><th>Date &amp; Time</th><th>User</th><th>Action</th><th>Record</th><th>Details</th></tr></thead>
        <tbody>${body}</tbody></table>
        </body></html>`);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    } catch (error) {
      console.error("Print failed:", error);
      toast({ title: "Print failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  if (isAdmin === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>Only administrators can view the activity log.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Activity Audit Trail
            </CardTitle>
            <CardDescription>
              Who did what, with the date and time it happened
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchLogs(page)} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {userOptions.map(u => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actionOptions.map(a => (
                  <SelectItem key={a} value={a}>
                    {auditActionLabel(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date &amp; Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading activity...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No activity recorded for these filters
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.user_name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{log.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.action.includes("deleted") ? "destructive" : "secondary"}>
                        {auditActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.entity_type || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{log.description || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "entry" : "entries"} &middot; page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                fetchLogs(p);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                fetchLogs(p);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditTrailTab;
