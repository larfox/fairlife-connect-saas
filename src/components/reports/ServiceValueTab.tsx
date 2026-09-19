import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Printer, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Row = {
  service_id: string;
  service_name: string;
  location_name: string;
};

const currency = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ServiceValueTab = () => {
  const { toast } = useToast();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});

  const fetchData = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Select a date range",
        description: "Please choose both a start and end date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const pageSize = 1000;
      let page = 0;
      const rows: Row[] = [];

      while (true) {
        const { data, error } = await supabase
          .from("service_queue")
          .select(
            `service_id,
             services!inner ( id, name ),
             patient_visits!inner ( visit_date, events ( locations ( name ) ) )`
          )
          .gte("patient_visits.visit_date", fromDate)
          .lte("patient_visits.visit_date", toDate)
          .range(page * pageSize, page * pageSize + pageSize - 1);

        if (error) throw error;
        const batch = data || [];

        batch.forEach((item: any) => {
          rows.push({
            service_id: item.service_id,
            service_name: item.services?.name || "Unknown Service",
            location_name:
              item.patient_visits?.events?.locations?.name || "Unknown Location",
          });
        });

        if (batch.length < pageSize) break;
        page += 1;
      }

      const serviceMap = new Map<string, string>();
      const locationSet = new Set<string>();
      const matrix: Record<string, Record<string, number>> = {};

      rows.forEach((r) => {
        serviceMap.set(r.service_id, r.service_name);
        locationSet.add(r.location_name);
        matrix[r.location_name] = matrix[r.location_name] || {};
        matrix[r.location_name][r.service_id] =
          (matrix[r.location_name][r.service_id] || 0) + 1;
      });

      setServices(
        Array.from(serviceMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setLocations(Array.from(locationSet).sort((a, b) => a.localeCompare(b)));
      setCounts(matrix);
      setGenerated(true);

      if (rows.length === 0) {
        toast({
          title: "No records found",
          description: "No services were recorded in that date range.",
        });
      }
    } catch (error: any) {
      console.error("Error building service value report:", error);
      toast({
        title: "Could not build the report",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const countFor = (location: string, serviceId: string) =>
    counts[location]?.[serviceId] || 0;
  const priceFor = (serviceId: string) => prices[serviceId] || 0;

  const serviceTotalCount = (serviceId: string) =>
    locations.reduce((sum, loc) => sum + countFor(loc, serviceId), 0);
  const locationTotalCount = (location: string) =>
    services.reduce((sum, s) => sum + countFor(location, s.id), 0);
  const locationTotalValue = (location: string) =>
    services.reduce((sum, s) => sum + countFor(location, s.id) * priceFor(s.id), 0);
  const grandCount = locations.reduce((sum, loc) => sum + locationTotalCount(loc), 0);
  const grandValue = locations.reduce((sum, loc) => sum + locationTotalValue(loc), 0);

  const handleExport = () => {
    const header = [
      "Location",
      ...services.map((s) => `${s.name} (Count)`),
      ...services.map((s) => `${s.name} (Value)`),
      "Total Services",
      "Total Value",
    ];
    const priceRow = [
      "Price per service",
      ...services.map(() => ""),
      ...services.map((s) => priceFor(s.id).toFixed(2)),
      "",
      "",
    ];
    const body = locations.map((loc) => [
      loc,
      ...services.map((s) => String(countFor(loc, s.id))),
      ...services.map((s) => (countFor(loc, s.id) * priceFor(s.id)).toFixed(2)),
      String(locationTotalCount(loc)),
      locationTotalValue(loc).toFixed(2),
    ]);
    const totals = [
      "TOTAL",
      ...services.map((s) => String(serviceTotalCount(s.id))),
      ...services.map((s) => (serviceTotalCount(s.id) * priceFor(s.id)).toFixed(2)),
      String(grandCount),
      grandValue.toFixed(2),
    ];

    const csv = [
      [`Services by Location — ${fromDate} to ${toDate}`],
      [],
      header,
      priceRow,
      ...body,
      totals,
    ]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `services-by-location-${fromDate}-to-${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to print this report.",
        variant: "destructive",
      });
      return;
    }

    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const head = services
      .map(
        (s) =>
          `<th>${esc(s.name)}<br/><span class="price">${currency(priceFor(s.id))}</span></th>`
      )
      .join("");

    const body = locations
      .map(
        (loc) => `<tr>
          <td class="loc">${esc(loc)}</td>
          ${services
            .map(
              (s) =>
                `<td>${countFor(loc, s.id)}<br/><span class="val">${currency(
                  countFor(loc, s.id) * priceFor(s.id)
                )}</span></td>`
            )
            .join("")}
          <td class="total">${locationTotalCount(loc)}<br/><span class="val">${currency(
            locationTotalValue(loc)
          )}</span></td>
        </tr>`
      )
      .join("");

    const totals = `<tr class="grand">
      <td class="loc">TOTAL</td>
      ${services
        .map(
          (s) =>
            `<td>${serviceTotalCount(s.id)}<br/><span class="val">${currency(
              serviceTotalCount(s.id) * priceFor(s.id)
            )}</span></td>`
        )
        .join("")}
      <td class="total">${grandCount}<br/><span class="val">${currency(grandValue)}</span></td>
    </tr>`;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Services by Location</title>
      <meta charset="utf-8">
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
        h1{font-size:20px;margin:0 0 4px}
        p.range{margin:0 0 16px;color:#555;font-size:13px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #999;padding:6px;text-align:center}
        th{background:#f1f1f1}
        td.loc{text-align:left;font-weight:600}
        .price{font-weight:400;color:#555;font-size:11px}
        .val{color:#555;font-size:11px}
        tr.grand td{background:#f1f1f1;font-weight:700}
        td.total{font-weight:700}
        @page{size:landscape}
      </style></head><body>
      <h1>Services Rendered by Location</h1>
      <p class="range">${esc(fromDate)} to ${esc(toDate)}</p>
      <table><thead><tr><th>Location</th>${head}<th>Total</th></tr></thead>
      <tbody>${body}${totals}</tbody></table>
      </body></html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Services by Location &amp; Value
        </CardTitle>
        <CardDescription>
          Services across the top, locations down the side. Enter a price per service to value
          the services rendered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="value-from">From</Label>
            <Input
              id="value-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value-to">To</Label>
            <Input
              id="value-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-44"
            />
          </div>
          <Button onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Generate Report"}
          </Button>
          {generated && locations.length > 0 && (
            <>
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </>
          )}
        </div>

        {generated && locations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No services were recorded in the selected date range.
          </p>
        )}

        {generated && locations.length > 0 && (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 font-medium sticky left-0 bg-muted">Location</th>
                  {services.map((s) => (
                    <th key={s.id} className="p-2 font-medium text-center min-w-[130px]">
                      <div>{s.name}</div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={prices[s.id] ?? ""}
                        onChange={(e) =>
                          setPrices((prev) => ({
                            ...prev,
                            [s.id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="h-8 mt-1 text-center"
                      />
                    </th>
                  ))}
                  <th className="p-2 font-medium text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc} className="border-t">
                    <td className="p-2 font-medium sticky left-0 bg-background">{loc}</td>
                    {services.map((s) => (
                      <td key={s.id} className="p-2 text-center">
                        <div>{countFor(loc, s.id)}</div>
                        <div className="text-xs text-muted-foreground">
                          {currency(countFor(loc, s.id) * priceFor(s.id))}
                        </div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-semibold">
                      <div>{locationTotalCount(loc)}</div>
                      <div className="text-xs text-muted-foreground">
                        {currency(locationTotalValue(loc))}
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-muted font-semibold">
                  <td className="p-2 sticky left-0 bg-muted">TOTAL</td>
                  {services.map((s) => (
                    <td key={s.id} className="p-2 text-center">
                      <div>{serviceTotalCount(s.id)}</div>
                      <div className="text-xs text-muted-foreground">
                        {currency(serviceTotalCount(s.id) * priceFor(s.id))}
                      </div>
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <div>{grandCount}</div>
                    <div className="text-xs text-muted-foreground">{currency(grandValue)}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceValueTab;
