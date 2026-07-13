import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, FileText, Download, Printer, Users, Activity, BarChart3, PieChart, ArrowLeft, Upload, Database, UserCheck, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInYears } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PrintableReport } from "@/components/PrintableReport";
import { PrintableDemographicReport, DemographicRow, DemographicSummary, ServiceSummaryRow } from "@/components/PrintableDemographicReport";
import { Checkbox } from "@/components/ui/checkbox";
import { createRoot } from "react-dom/client";

interface ReportsProps {
  onBack: () => void;
}

type Event = Tables<"events"> & {
  locations: { name: string; address: string | null } | null;
};

type PatientWithDetails = Tables<"patients"> & {
  parish: { name: string } | null;
  town: { name: string } | null;
  patient_visits: (Tables<"patient_visits"> & {
    event: Event | null;
  })[];
};

type ServiceReport = {
  service_name: string;
  patient_count: number;
  patients: PatientWithDetails[];
  showAll?: boolean;
};

type LocationReport = {
  location_name: string;
  event_date: string;
  patient_count: number;
  patients: PatientWithDetails[];
};

type ParishReport = {
  parish_name: string;
  patient_count: number;
  patients: PatientWithDetails[];
  showAll?: boolean;
};

type RegistrationReport = {
  patient_number: string;
  patient_name: string;
  patient_id: string;
  phone?: string;
  email?: string;
  parish?: string;
  services: string[];
  serviceMap: { [serviceName: string]: boolean }; // For checkmark display
};

type RegistrationReportData = {
  patients: RegistrationReport[];
  availableServices: string[];
};

type DemographicReportData = {
  rows: DemographicRow[];
  summary: DemographicSummary;
  scopeName: string;
};

type EventSummary = {
  eventId: string;
  eventName: string;
  locationName: string;
  eventDate: string;
  rows: DemographicRow[];
  summary: DemographicSummary;
  serviceRows: ServiceSummaryRow[];
};

const AGE_BANDS = [
  { label: "0-9", min: 0, max: 9 },
  { label: "10-19", min: 10, max: 19 },
  { label: "20-29", min: 20, max: 29 },
  { label: "30-39", min: 30, max: 39 },
  { label: "40-49", min: 40, max: 49 },
  { label: "50-59", min: 50, max: 59 },
  { label: "60-69", min: 60, max: 69 },
  { label: "70-79", min: 70, max: 79 },
  { label: "80+", min: 80, max: 200 },
];

const Reports = ({ onBack }: ReportsProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Tables<"locations">[]>([]);
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [parishes, setParishes] = useState<Tables<"parishes">[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedParish, setSelectedParish] = useState<string>("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>("all");

  // Demographic report state
  const [demographicScope, setDemographicScope] = useState<"event" | "location">("event");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [demographicReport, setDemographicReport] = useState<DemographicReportData | null>(null);

  // Location summary report state (multi-event)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [locationSummaryReport, setLocationSummaryReport] = useState<EventSummary[] | null>(null);

  // Report data
  const [locationReport, setLocationReport] = useState<LocationReport[]>([]);
  const [serviceReport, setServiceReport] = useState<ServiceReport[]>([]);
  const [parishReport, setParishReport] = useState<ParishReport[]>([]);
  const [registrationReport, setRegistrationReport] = useState<RegistrationReportData>({ patients: [], availableServices: [] });
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Import/Export state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [eventsResponse, servicesResponse, parishesResponse, locationsResponse] = await Promise.all([
        supabase.from("events").select("*, locations(name, address)").eq("is_active", true),
        supabase.from("services").select("*").eq("is_active", true),
        supabase.from("parishes").select("*"),
        supabase.from("locations").select("*").eq("is_active", true).order("name")
      ]);

      if (eventsResponse.data) setEvents(eventsResponse.data);
      if (servicesResponse.data) setServices(servicesResponse.data);
      if (parishesResponse.data) setParishes(parishesResponse.data);
      if (locationsResponse.data) setLocations(locationsResponse.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const generateDemographicReport = async () => {
    if (demographicScope === "event" && !selectedEvent) {
      toast({ title: "Please select an event", variant: "destructive" });
      return;
    }
    if (demographicScope === "location" && !selectedLocation) {
      toast({ title: "Please select a location", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let eventIds: string[] = [];
      let scopeName = "";

      if (demographicScope === "event") {
        eventIds = [selectedEvent];
        const ev = events.find(e => e.id === selectedEvent);
        scopeName = ev ? `Event: ${ev.name} - ${ev.locations?.name ?? ""}` : "Selected Event";
      } else {
        const locEvents = events.filter(e => e.location_id === selectedLocation);
        eventIds = locEvents.map(e => e.id);
        const loc = locations.find(l => l.id === selectedLocation);
        scopeName = loc ? `Location: ${loc.name}` : "Selected Location";
        if (eventIds.length === 0) {
          setDemographicReport({
            rows: AGE_BANDS.map(b => ({ band: b.label, male: 0, female: 0, other: 0, total: 0 })),
            summary: { totalPatients: 0, totalMale: 0, totalFemale: 0, totalOther: 0, averageAge: null },
            scopeName,
          });
          toast({ title: "No events found for this location" });
          return;
        }
      }

      const { data: visits, error } = await supabase
        .from("patient_visits")
        .select(`patient:patients(id, date_of_birth, gender)`)
        .in("event_id", eventIds);

      if (error) throw error;

      // De-duplicate patients by id
      const patientMap = new Map<string, { date_of_birth: string | null; gender: string | null }>();
      visits?.forEach((v: any) => {
        const p = v.patient;
        if (p && !patientMap.has(p.id)) {
          patientMap.set(p.id, { date_of_birth: p.date_of_birth, gender: p.gender });
        }
      });

      // Build matrix
      const bandIndex = (age: number) =>
        AGE_BANDS.findIndex(b => age >= b.min && age <= b.max);

      const counts = AGE_BANDS.map(() => ({ male: 0, female: 0, other: 0 }));
      const unknown = { male: 0, female: 0, other: 0 };
      let totalMale = 0, totalFemale = 0, totalOther = 0;
      let ageSum = 0, ageCount = 0;

      const sexBucket = (gender: string | null): "male" | "female" | "other" => {
        const g = (gender || "").toLowerCase();
        if (g === "male" || g === "m") return "male";
        if (g === "female" || g === "f") return "female";
        return "other";
      };

      patientMap.forEach(({ date_of_birth, gender }) => {
        const bucket = sexBucket(gender);
        if (bucket === "male") totalMale++;
        else if (bucket === "female") totalFemale++;
        else totalOther++;

        if (date_of_birth) {
          const age = differenceInYears(new Date(), new Date(date_of_birth));
          ageSum += age;
          ageCount++;
          const idx = bandIndex(age);
          if (idx >= 0) counts[idx][bucket]++;
          else unknown[bucket]++;
        } else {
          unknown[bucket]++;
        }
      });

      const rows: DemographicRow[] = AGE_BANDS.map((b, i) => ({
        band: b.label,
        male: counts[i].male,
        female: counts[i].female,
        other: counts[i].other,
        total: counts[i].male + counts[i].female + counts[i].other,
      }));

      const unknownTotal = unknown.male + unknown.female + unknown.other;
      if (unknownTotal > 0) {
        rows.push({
          band: "Unknown",
          male: unknown.male,
          female: unknown.female,
          other: unknown.other,
          total: unknownTotal,
        });
      }

      const totalPatients = patientMap.size;
      const summary: DemographicSummary = {
        totalPatients,
        totalMale,
        totalFemale,
        totalOther,
        averageAge: ageCount > 0 ? ageSum / ageCount : null,
      };

      setDemographicReport({ rows, summary, scopeName });

      toast({
        title: "Demographic report generated",
        description: `Analyzed ${totalPatients} patients.`,
      });
    } catch (error) {
      console.error("Error generating demographic report:", error);
      toast({ title: "Error generating report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exportDemographicCSV = () => {
    if (!demographicReport) return;
    const data = [
      ...demographicReport.rows.map(r => ({
        age_band: r.band,
        male: r.male,
        female: r.female,
        other_unspecified: r.other,
        total: r.total,
      })),
      {
        age_band: "Total",
        male: demographicReport.summary.totalMale,
        female: demographicReport.summary.totalFemale,
        other_unspecified: demographicReport.summary.totalOther,
        total: demographicReport.summary.totalPatients,
      },
    ];
    exportToCSV(data, "demographic_report");
  };

  const printDemographicReport = () => {
    if (!demographicReport) {
      toast({ title: "No data to print", description: "Please generate a report first.", variant: "destructive" });
      return;
    }
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      toast({ title: "Print failed", description: "Please allow popups and try again.", variant: "destructive" });
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Age & Sex Demographic Report</title><meta charset="utf-8"></head><body><div id="print-root"></div></body></html>`);
    printWindow.document.close();
    const printContainer = printWindow.document.getElementById("print-root");
    if (!printContainer) return;
    const root = createRoot(printContainer);
    root.render(
      <PrintableDemographicReport
        title="Age & Sex Demographic Report"
        subtitle="Patient Demographic Breakdown"
        scopeName={demographicReport.scopeName}
        rows={demographicReport.rows}
        summary={demographicReport.summary}
      />
    );
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 100);
    }, 1000);
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const generateLocationSummaryReport = async () => {
    if (selectedEventIds.length === 0) {
      toast({ title: "Please select at least one event", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Demographics: fetch patient visits (with event) for selected events
      const { data: visits, error: visitsError } = await supabase
        .from("patient_visits")
        .select(`event_id, patient:patients(id, date_of_birth, gender)`)
        .in("event_id", selectedEventIds);

      if (visitsError) throw visitsError;

      // Services: unique patients per service, per event
      const { data: queueData, error: queueError } = await supabase
        .from("service_queue")
        .select(`service:services(name), patient_visit:patient_visits!inner(event_id, patient_id)`)
        .in("patient_visit.event_id", selectedEventIds);

      if (queueError) throw queueError;

      const bandIndex = (age: number) => AGE_BANDS.findIndex((b) => age >= b.min && age <= b.max);
      const sexBucket = (gender: string | null): "male" | "female" | "other" => {
        const g = (gender || "").toLowerCase();
        if (g === "male" || g === "m") return "male";
        if (g === "female" || g === "f") return "female";
        return "other";
      };

      // Group patients per event (de-duplicated within each event)
      const patientsByEvent = new Map<string, Map<string, { date_of_birth: string | null; gender: string | null }>>();
      visits?.forEach((v: any) => {
        const eventId = v.event_id;
        const p = v.patient;
        if (!eventId || !p) return;
        if (!patientsByEvent.has(eventId)) patientsByEvent.set(eventId, new Map());
        const map = patientsByEvent.get(eventId)!;
        if (!map.has(p.id)) map.set(p.id, { date_of_birth: p.date_of_birth, gender: p.gender });
      });

      // Group services per event (unique patients per service)
      const servicesByEvent = new Map<string, Map<string, Set<string>>>();
      queueData?.forEach((item: any) => {
        const eventId = item.patient_visit?.event_id;
        const patientId = item.patient_visit?.patient_id;
        const serviceName = item.service?.name || "Unknown Service";
        if (!eventId || !patientId) return;
        if (!servicesByEvent.has(eventId)) servicesByEvent.set(eventId, new Map());
        const svcMap = servicesByEvent.get(eventId)!;
        if (!svcMap.has(serviceName)) svcMap.set(serviceName, new Set());
        svcMap.get(serviceName)!.add(patientId);
      });

      const summaries: EventSummary[] = selectedEventIds.map((eventId) => {
        const event = events.find((e) => e.id === eventId);
        const patientMap = patientsByEvent.get(eventId) ?? new Map();

        const counts = AGE_BANDS.map(() => ({ male: 0, female: 0, other: 0 }));
        const unknown = { male: 0, female: 0, other: 0 };
        let totalMale = 0, totalFemale = 0, totalOther = 0;
        let ageSum = 0, ageCount = 0;

        patientMap.forEach(({ date_of_birth, gender }) => {
          const bucket = sexBucket(gender);
          if (bucket === "male") totalMale++;
          else if (bucket === "female") totalFemale++;
          else totalOther++;

          if (date_of_birth) {
            const age = differenceInYears(new Date(), new Date(date_of_birth));
            ageSum += age;
            ageCount++;
            const idx = bandIndex(age);
            if (idx >= 0) counts[idx][bucket]++;
            else unknown[bucket]++;
          } else {
            unknown[bucket]++;
          }
        });

        const rows: DemographicRow[] = AGE_BANDS.map((b, i) => ({
          band: b.label,
          male: counts[i].male,
          female: counts[i].female,
          other: counts[i].other,
          total: counts[i].male + counts[i].female + counts[i].other,
        }));

        const unknownTotal = unknown.male + unknown.female + unknown.other;
        if (unknownTotal > 0) {
          rows.push({ band: "Unknown", male: unknown.male, female: unknown.female, other: unknown.other, total: unknownTotal });
        }

        const summary: DemographicSummary = {
          totalPatients: patientMap.size,
          totalMale,
          totalFemale,
          totalOther,
          averageAge: ageCount > 0 ? ageSum / ageCount : null,
        };

        const svcMap = servicesByEvent.get(eventId) ?? new Map<string, Set<string>>();
        const serviceRows: ServiceSummaryRow[] = Array.from(svcMap.entries())
          .map(([service_name, ids]) => ({ service_name, patient_count: ids.size }))
          .sort((a, b) => b.patient_count - a.patient_count);

        return {
          eventId,
          eventName: event?.name ?? "Unknown Event",
          locationName: event?.locations?.name ?? "",
          eventDate: event?.event_date ?? "",
          rows,
          summary,
          serviceRows,
        };
      });

      setLocationSummaryReport(summaries);

      const totalPatients = summaries.reduce((sum, s) => sum + s.summary.totalPatients, 0);
      toast({
        title: "Location summary generated",
        description: `Summarized ${totalPatients} patient records across ${summaries.length} event(s).`,
      });
    } catch (error) {
      console.error("Error generating location summary report:", error);
      toast({ title: "Error generating report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exportLocationSummaryCSV = () => {
    if (!locationSummaryReport || locationSummaryReport.length === 0) return;
    const data: Record<string, string | number>[] = [];
    locationSummaryReport.forEach((ev) => {
      const eventLabel = `${ev.eventName}${ev.eventDate ? ` (${format(new Date(ev.eventDate), "MMM dd, yyyy")})` : ""}`;
      data.push({ event: eventLabel, section: "Demographics", label: "Age Band", male: "Male", female: "Female", other: "Other/Unspecified", total: "Total" });
      ev.rows.forEach((r) => {
        data.push({ event: eventLabel, section: "Demographics", label: r.band, male: r.male, female: r.female, other: r.other, total: r.total });
      });
      data.push({
        event: eventLabel,
        section: "Demographics",
        label: "Total",
        male: ev.summary.totalMale,
        female: ev.summary.totalFemale,
        other: ev.summary.totalOther,
        total: ev.summary.totalPatients,
      });
      data.push({ event: eventLabel, section: "Services", label: "Service", male: "", female: "", other: "", total: "Patients" });
      ev.serviceRows.forEach((s) => {
        data.push({ event: eventLabel, section: "Services", label: s.service_name, male: "", female: "", other: "", total: s.patient_count });
      });
    });
    exportToCSV(data, "location_summary_report");
  };

  const printLocationSummaryReport = () => {
    if (!locationSummaryReport || locationSummaryReport.length === 0) {
      toast({ title: "No data to print", description: "Please generate a report first.", variant: "destructive" });
      return;
    }
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      toast({ title: "Print failed", description: "Please allow popups and try again.", variant: "destructive" });
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Location Summary Report</title><meta charset="utf-8"><style>.print-event-section{page-break-after:always;}.print-event-section:last-child{page-break-after:auto;}</style></head><body><div id="print-root"></div></body></html>`);
    printWindow.document.close();
    const printContainer = printWindow.document.getElementById("print-root");
    if (!printContainer) return;
    const root = createRoot(printContainer);
    root.render(
      <>
        {locationSummaryReport.map((ev) => (
          <div key={ev.eventId} className="print-event-section">
            <PrintableDemographicReport
              title="Event Summary Report"
              subtitle="Age Demographics & Health Fair Services"
              scopeName={ev.eventName}
              eventsLabel={`${ev.locationName}${ev.eventDate ? ` — ${format(new Date(ev.eventDate), "MMMM dd, yyyy")}` : ""}`}
              rows={ev.rows}
              summary={ev.summary}
              serviceRows={ev.serviceRows}
            />
          </div>
        ))}
      </>
    );
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 100);
    }, 1000);
  };






  const generateLocationReport = async () => {
    if (!selectedEvent) {
      toast({
        title: "Please select an event",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First get patient visits for the selected event
      const { data: patientVisits, error: visitsError } = await supabase
        .from("patient_visits")
        .select(`
          *,
          patient:patients(
            *,
            parish:parishes(name),
            town:towns(name)
          ),
          event:events(
            *,
            locations(name, address)
          )
        `)
        .eq("event_id", selectedEvent);

      if (visitsError) throw visitsError;

      // Extract unique patients from the visits
      const patients = patientVisits?.map(visit => ({
        ...visit.patient,
        patient_visits: [{
          ...visit,
          event: visit.event
        }]
      })) || [];

      const event = events.find(e => e.id === selectedEvent);
      const report: LocationReport = {
        location_name: event?.locations?.name || "Unknown Location",
        event_date: event?.event_date || "",
        patient_count: patients?.length || 0,
        patients: patients || []
      };

      setLocationReport([report]);
      
      toast({
        title: "Location report generated",
        description: `Found ${patients?.length || 0} patients for this event.`,
      });
    } catch (error) {
      console.error("Error generating location report:", error);
      toast({
        title: "Error generating report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateServiceReport = async () => {
    if (!selectedEvent) {
      toast({
        title: "Please select an event",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: serviceQueueData, error } = await supabase
        .from("service_queue")
        .select(`
          *,
          service:services(name),
          patient_visit:patient_visits!inner(
            *,
            patient:patients(
              *,
              parish:parishes(name),
              town:towns(name)
            )
          )
        `)
        .eq("patient_visit.event_id", selectedEvent)
        .not("patient_visit", "is", null);

      if (error) throw error;

      // Group by service
      const serviceGroups: { [key: string]: ServiceReport } = {};
      
      serviceQueueData?.forEach(item => {
        const serviceName = item.service?.name || "Unknown Service";
        if (!serviceGroups[serviceName]) {
          serviceGroups[serviceName] = {
            service_name: serviceName,
            patient_count: 0,
            patients: []
          };
        }
        serviceGroups[serviceName].patients.push(item.patient_visit.patient as PatientWithDetails);
        serviceGroups[serviceName].patient_count++;
      });

      setServiceReport(Object.values(serviceGroups));
      
      toast({
        title: "Service report generated",
        description: `Generated report for ${Object.keys(serviceGroups).length} services.`,
      });
    } catch (error) {
      console.error("Error generating service report:", error);
      toast({
        title: "Error generating report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateParishReport = async () => {
    if (!selectedEvent) {
      toast({
        title: "Please select an event",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First get patient visits for the selected event
      const { data: patientVisits, error } = await supabase
        .from("patient_visits")
        .select(`
          *,
          patient:patients!inner(
            *,
            parish:parishes(name),
            town:towns(name)
          ),
          event:events(
            *,
            locations(name, address)
          )
        `)
        .eq("event_id", selectedEvent)
        .not("patient.parish_id", "is", null);

      if (error) throw error;

      // Group by parish
      const parishGroups: { [key: string]: ParishReport } = {};
      
      patientVisits?.forEach(visit => {
        const patient = visit.patient;
        const parishName = patient.parish?.name || "Unknown Parish";
        if (!parishGroups[parishName]) {
          parishGroups[parishName] = {
            parish_name: parishName,
            patient_count: 0,
            patients: []
          };
        }
        // Avoid duplicates by checking if patient already exists
        const existingPatient = parishGroups[parishName].patients.find(p => p.id === patient.id);
        if (!existingPatient) {
          parishGroups[parishName].patients.push({
            ...patient,
            patient_visits: [visit]
          } as PatientWithDetails);
          parishGroups[parishName].patient_count++;
        }
      });

      setParishReport(Object.values(parishGroups));
      
      toast({
        title: "Parish report generated",
        description: `Generated report for ${Object.keys(parishGroups).length} parishes.`,
      });
    } catch (error) {
      console.error("Error generating parish report:", error);
      toast({
        title: "Error generating report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRegistrationReport = async () => {
    if (!selectedEvent) {
      toast({
        title: "Please select an event",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First get all services for this event
      const { data: eventServices, error: servicesError } = await supabase
        .from("event_services")
        .select("service:services(name)")
        .eq("event_id", selectedEvent);

      if (servicesError) throw servicesError;

      const availableServices = eventServices?.map(es => es.service?.name).filter(Boolean) || [];

      // Get registration data
      const { data: registrationData, error } = await supabase
        .from("patient_visits")
        .select(`
          *,
          patient:patients(
            *,
            parish:parishes(name)
          ),
          service_queue(
            service:services(name)
          )
        `)
        .eq("event_id", selectedEvent);

      if (error) throw error;

      // Process the data to group services by patient
      const registrationMap: { [key: string]: RegistrationReport } = {};
      
      registrationData?.forEach(visit => {
        const patient = visit.patient;
        const patientKey = patient.id;
        
        if (!registrationMap[patientKey]) {
          // Initialize serviceMap with all services set to false
          const serviceMap: { [serviceName: string]: boolean } = {};
          availableServices.forEach(service => {
            serviceMap[service] = false;
          });

          registrationMap[patientKey] = {
            patient_id: patient.id,
            patient_number: patient.patient_number || '',
            patient_name: `${patient.first_name} ${patient.last_name}`,
            phone: patient.phone || '',
            email: patient.email || '',
            parish: patient.parish?.name || '',
            services: [],
            serviceMap: serviceMap
          };
        }
        
        // Add services from service_queue
        visit.service_queue?.forEach((queueItem: any) => {
          const serviceName = queueItem.service?.name;
          if (serviceName) {
            if (!registrationMap[patientKey].services.includes(serviceName)) {
              registrationMap[patientKey].services.push(serviceName);
            }
            registrationMap[patientKey].serviceMap[serviceName] = true;
          }
        });
      });

      const reportData: RegistrationReportData = {
        patients: Object.values(registrationMap),
        availableServices: availableServices
      };
      
      setRegistrationReport(reportData);
      
      toast({
        title: "Registration report generated",
        description: `Found ${reportData.patients.length} registered patients.`,
      });
    } catch (error) {
      console.error("Error generating registration report:", error);
      toast({
        title: "Error generating report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get service counts and filtered data
  const getServiceCounts = () => {
    if (!registrationReport.patients.length) return {};
    
    const counts: { [serviceName: string]: number } = {};
    counts['all'] = registrationReport.patients.length;
    
    registrationReport.availableServices.forEach(service => {
      counts[service] = registrationReport.patients.filter(patient => 
        patient.serviceMap[service]
      ).length;
    });
    
    return counts;
  };

  const getFilteredPatients = () => {
    if (selectedServiceFilter === 'all') {
      return registrationReport.patients;
    }
    
    return registrationReport.patients.filter(patient => 
      patient.serviceMap[selectedServiceFilter]
    );
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => `"${row[header] || ""}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const printReport = (reportType: string) => {
    let reportData: { section_name: string; patient_count: number; patients: any[] }[] = [];
    let title = "";
    let subtitle = "";
    let eventInfo = events.find(e => e.id === selectedEvent);
    
    switch (reportType) {
      case "location":
        if (locationReport.length > 0) {
          title = "Patient Report by Location";
          subtitle = "Health Fair Patient Attendance Report";
          reportData = locationReport.map(report => ({
            section_name: report.location_name,
            patient_count: report.patient_count,
            patients: report.patients
          }));
        }
        break;
      case "service":
        if (serviceReport.length > 0) {
          title = "Patient Report by Service";
          subtitle = "Service Utilization Report";
          reportData = serviceReport.map(service => ({
            section_name: service.service_name,
            patient_count: service.patient_count,
            patients: service.patients
          }));
        }
        break;
      case "parish":
        if (parishReport.length > 0) {
          title = "Patient Report by Parish";
          subtitle = "Geographic Distribution Report";
          reportData = parishReport.map(parish => ({
            section_name: parish.parish_name,
            patient_count: parish.patient_count,
            patients: parish.patients
          }));
        }
        break;
      case "registration":
        if (registrationReport.patients.length > 0) {
          const filteredPatients = getFilteredPatients();
          title = selectedServiceFilter === 'all' 
            ? "Patient Registration Report" 
            : `Patient Registration Report - ${selectedServiceFilter}`;
          subtitle = selectedServiceFilter === 'all' 
            ? "Service Registration Details" 
            : `Patients Registered for ${selectedServiceFilter}`;
          reportData = [{
            section_name: selectedServiceFilter === 'all' 
              ? "Patient Registrations" 
              : `${selectedServiceFilter} Registrations`,
            patient_count: filteredPatients.length,
            patients: filteredPatients.map(reg => ({
              ...reg,
              first_name: reg.patient_name.split(' ')[0],
              last_name: reg.patient_name.split(' ').slice(1).join(' '),
              patient_number: reg.patient_number,
              parish: { name: reg.parish },
              phone: reg.phone,
              email: reg.email,
              services: reg.services,
              availableServices: registrationReport.availableServices,
              serviceMap: reg.serviceMap
            }))
          }];
        }
        break;
    }

    if (reportData.length === 0) {
      toast({
        title: "No data to print",
        description: "Please generate a report first.",
        variant: "destructive",
      });
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Print failed",
        description: "Please allow popups and try again.",
        variant: "destructive",
      });
      return;
    }

    // Set up the print window document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Create a container for the React component
    const printContainer = printWindow.document.getElementById('print-root');
    if (!printContainer) return;

    // Render the printable component
    const root = createRoot(printContainer);
    const printElement = (
      <PrintableReport
        title={title}
        subtitle={subtitle}
        data={reportData}
        eventName={eventInfo?.name}
        locationName={eventInfo?.locations?.name}
        eventDate={eventInfo?.event_date}
      />
    );

    root.render(printElement);

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 100);
    }, 1000);
  };

  // Export functions
  const exportAllPatients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("patients")
        .select(`
          *,
          parish:parishes(name),
          town:towns(name),
          patient_visits(
            *,
            event:events(name, event_date, locations(name))
          )
        `);

      if (selectedEvent && selectedEvent !== "all") {
        query = query.eq("patient_visits.event_id", selectedEvent);
      }

      const { data: patients, error } = await query;

      if (error) throw error;

      if (!patients || patients.length === 0) {
        toast({
          title: "No patients found",
          description: "No patient data available for export.",
          variant: "destructive",
        });
        return;
      }

      const exportData = patients.map(patient => ({
        patient_number: patient.patient_number,
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        parish: patient.parish?.name,
        town: patient.town?.name,
        medical_conditions: patient.medical_conditions,
        allergies: patient.allergies,
        medications: patient.medications,
        insurance_provider: patient.insurance_provider,
        insurance_number: patient.insurance_number,
        emergency_contact_name: patient.emergency_contact_name,
        emergency_contact_phone: patient.emergency_contact_phone,
        created_at: patient.created_at
      }));

      if (exportFormat === 'csv') {
        exportToCSV(exportData, 'all_patients');
      } else {
        exportToJSON(exportData, 'all_patients');
      }

      toast({
        title: "Export successful",
        description: `Exported ${exportData.length} patients.`,
      });
    } catch (error) {
      console.error("Error exporting patients:", error);
      toast({
        title: "Export failed",
        description: "Failed to export patient data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPatientVisits = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("patient_visits")
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number, phone),
          event:events(name, event_date, locations(name))
        `);

      if (selectedEvent && selectedEvent !== "all") {
        query = query.eq("event_id", selectedEvent);
      }

      const { data: visits, error } = await query;

      if (error) throw error;

      if (!visits || visits.length === 0) {
        toast({
          title: "No visits found",
          description: "No patient visit data available for export.",
          variant: "destructive",
        });
        return;
      }

      const exportData = visits.map(visit => ({
        visit_id: visit.id,
        patient_name: `${visit.patient?.first_name} ${visit.patient?.last_name}`,
        patient_number: visit.patient?.patient_number,
        patient_phone: visit.patient?.phone,
        event_name: visit.event?.name,
        event_date: visit.event?.event_date,
        location: visit.event?.locations?.name,
        visit_date: visit.visit_date,
        queue_number: visit.queue_number,
        status: visit.status,
        basic_screening_completed: visit.basic_screening_completed,
        created_at: visit.created_at
      }));

      if (exportFormat === 'csv') {
        exportToCSV(exportData, 'patient_visits');
      } else {
        exportToJSON(exportData, 'patient_visits');
      }

      toast({
        title: "Export successful",
        description: `Exported ${exportData.length} patient visits.`,
      });
    } catch (error) {
      console.error("Error exporting patient visits:", error);
      toast({
        title: "Export failed",
        description: "Failed to export patient visit data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportServiceQueues = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("service_queue")
        .select(`
          *,
          service:services(name),
          patient_visit:patient_visits(
            patient:patients(first_name, last_name, patient_number),
            event:events(name, event_date)
          )
        `);

      if (selectedEvent && selectedEvent !== "all") {
        query = query.eq("patient_visit.event_id", selectedEvent);
      }

      const { data: serviceQueues, error } = await query;

      if (error) throw error;

      if (!serviceQueues || serviceQueues.length === 0) {
        toast({
          title: "No service records found",
          description: "No service queue data available for export.",
          variant: "destructive",
        });
        return;
      }

      const exportData = serviceQueues.map(queue => ({
        queue_id: queue.id,
        service_name: queue.service?.name,
        patient_name: `${queue.patient_visit?.patient?.first_name} ${queue.patient_visit?.patient?.last_name}`,
        patient_number: queue.patient_visit?.patient?.patient_number,
        event_name: queue.patient_visit?.event?.name,
        event_date: queue.patient_visit?.event?.event_date,
        status: queue.status,
        queue_position: queue.queue_position,
        started_at: queue.started_at,
        completed_at: queue.completed_at,
        created_at: queue.created_at
      }));

      if (exportFormat === 'csv') {
        exportToCSV(exportData, 'service_queues');
      } else {
        exportToJSON(exportData, 'service_queues');
      }

      toast({
        title: "Export successful",
        description: `Exported ${exportData.length} service records.`,
      });
    } catch (error) {
      console.error("Error exporting service queues:", error);
      toast({
        title: "Export failed",
        description: "Failed to export service queue data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.json`;
    link.click();
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    const templateData = [{
      first_name: "John",
      last_name: "Doe",
      gender: "Male",
      town_name: "Downtown Kingston", // Use actual town name
      parish_name: "Kingston" // Use actual parish name
    }];

    if (format === 'csv') {
      exportToCSV(templateData, 'patient_import_template');
    } else {
      exportToJSON(templateData, 'patient_import_template');
    }

    toast({
      title: "Template downloaded",
      description: `${format.toUpperCase()} template file has been downloaded. Use town_name and parish_name fields.`,
    });
  };

  const importPatients = async () => {
    if (!importFile) return;

    setLoading(true);
    try {
      const fileContent = await importFile.text();
      let importData: any[] = [];

      if (importFile.name.endsWith('.csv')) {
        // Parse CSV
        const lines = fileContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            importData.push(row);
          }
        }
      } else {
        // Parse JSON
        importData = JSON.parse(fileContent);
      }

      if (!Array.isArray(importData) || importData.length === 0) {
        toast({
          title: "Invalid file format",
          description: "File must contain an array of patient records.",
          variant: "destructive",
        });
        return;
      }

      // Validate required fields
      const requiredFields = ['first_name', 'last_name'];
      const validRecords = importData.filter(record => 
        requiredFields.every(field => record[field] && record[field].trim())
      );

      if (validRecords.length === 0) {
        toast({
          title: "No valid records found",
          description: "All records must have first_name and last_name.",
          variant: "destructive",
        });
        return;
      }

      // Get parishes and towns for name lookup
      const { data: parishes } = await supabase.from('parishes').select('id, name');
      const { data: towns } = await supabase.from('towns').select('id, name');

      // Process records and convert names to IDs
      const processedRecords = validRecords.map(record => {
        let town_id = null;
        let parish_id = null;

        // Convert town name to ID
        if (record.town_name && towns) {
          const town = towns.find(t => t.name.toLowerCase() === record.town_name.toLowerCase());
          town_id = town?.id || null;
        }

        // Convert parish name to ID  
        if (record.parish_name && parishes) {
          const parish = parishes.find(p => p.name.toLowerCase() === record.parish_name.toLowerCase());
          parish_id = parish?.id || null;
        }

        return {
          first_name: record.first_name?.trim(),
          last_name: record.last_name?.trim(),
          gender: record.gender || null,
          town_id,
          parish_id
        };
      });

      // Insert patients
      const { data: insertedPatients, error } = await supabase
        .from("patients")
        .insert(processedRecords);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Successfully imported ${validRecords.length} patients. ${importData.length - validRecords.length} records were skipped due to missing required fields.`,
      });

      setImportFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error importing patients:", error);
      toast({
        title: "Import failed",
        description: "Failed to import patient data. Please check file format and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Generate and export patient reports</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="location" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="location" className="gap-2">
            <MapPin className="h-4 w-4" />
            Location Reports
          </TabsTrigger>
          <TabsTrigger value="service" className="gap-2">
            <Activity className="h-4 w-4" />
            Service Reports
          </TabsTrigger>
          <TabsTrigger value="parish" className="gap-2">
            <Users className="h-4 w-4" />
            Parish Reports
          </TabsTrigger>
          <TabsTrigger value="demographics" className="gap-2">
            <PieChart className="h-4 w-4" />
            Demographics
          </TabsTrigger>
          <TabsTrigger value="location-summary" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Location Summary
          </TabsTrigger>
          <TabsTrigger value="registration" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Registration Reports
          </TabsTrigger>
          <TabsTrigger value="import-export" className="gap-2">
            <Database className="h-4 w-4" />
            Import/Export
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Location Reports */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Patient Reports by Location & Date
              </CardTitle>
              <CardDescription>
                Generate reports for patients by health fair location and specific date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {event.locations?.name} ({format(new Date(event.event_date), "MMM dd, yyyy")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={generateLocationReport} disabled={loading} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
              </div>

              {locationReport.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Location Report Results</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportToCSV(
                          locationReport[0].patients.map(p => ({
                            name: `${p.first_name} ${p.last_name}`,
                            patient_number: p.patient_number,
                            phone: p.phone,
                            email: p.email,
                            parish: p.parish?.name,
                            town: p.town?.name
                          })),
                          "location_report"
                        )}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => printReport("location")} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>

                  {locationReport.map((report, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{report.location_name}</CardTitle>
                        <CardDescription>
                          {format(new Date(report.event_date), "MMMM dd, yyyy")} • {report.patient_count} patients
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {report.patients.map((patient) => (
                            <div key={patient.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {patient.patient_number} • {patient.parish?.name}, {patient.town?.name}
                                </p>
                              </div>
                              <Badge variant="outline">{patient.phone}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Reports */}
        <TabsContent value="service">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Patient Reports by Service
              </CardTitle>
              <CardDescription>
                View patient distribution across different services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {event.locations?.name} ({format(new Date(event.event_date), "MMM dd, yyyy")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateServiceReport} disabled={loading} className="gap-2">
                <FileText className="h-4 w-4" />
                Generate Service Report
              </Button>

              {serviceReport.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Service Report Results</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportToCSV(
                          serviceReport.flatMap(service => 
                            service.patients.map(p => ({
                              service: service.service_name,
                              name: `${p.first_name} ${p.last_name}`,
                              patient_number: p.patient_number,
                              phone: p.phone,
                              parish: p.parish?.name,
                              town: p.town?.name
                            }))
                          ),
                          "service_report"
                        )}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => printReport("service")} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {serviceReport.map((service, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle>{service.service_name}</CardTitle>
                          <CardDescription>{service.patient_count} patients</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {service.patients.slice(0, 5).map((patient) => (
                              <div key={patient.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                                <div>
                                  <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                                  <p className="text-sm text-muted-foreground">
                                    {patient.patient_number} • {patient.parish?.name}
                                  </p>
                                </div>
                                <Badge variant="outline">{patient.phone || "No phone"}</Badge>
                              </div>
                            ))}
                            {service.patients.length > 5 && (
                              <button 
                                className="text-sm text-primary hover:underline cursor-pointer w-full text-center py-1"
                                onClick={() => {
                                  // Show all patients by replacing the slice with full array temporarily
                                  const updatedReport = [...serviceReport];
                                  updatedReport[index] = {
                                    ...service,
                                    showAll: true
                                  };
                                  setServiceReport(updatedReport);
                                }}
                              >
                                ... and {service.patients.length - 5} more patients (click to view all {service.patient_count})
                              </button>
                            )}
                            {service.showAll && service.patients.slice(5).map((patient) => (
                              <div key={patient.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                                <div>
                                  <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                                  <p className="text-sm text-muted-foreground">
                                    {patient.patient_number} • {patient.parish?.name}
                                  </p>
                                </div>
                                <Badge variant="outline">{patient.phone || "No phone"}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parish Reports */}
        <TabsContent value="parish">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patient Reports by Parish & Town
              </CardTitle>
              <CardDescription>
                Analyze patient distribution by geographic location for specific health fair events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {event.locations?.name} ({format(new Date(event.event_date), "MMM dd, yyyy")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateParishReport} disabled={loading} className="gap-2">
                <FileText className="h-4 w-4" />
                Generate Parish Report
              </Button>

              {parishReport.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Parish Report Results</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportToCSV(
                          parishReport.flatMap(parish => 
                            parish.patients.map(p => ({
                              parish: parish.parish_name,
                              name: `${p.first_name} ${p.last_name}`,
                              patient_number: p.patient_number,
                              phone: p.phone,
                              town: p.town?.name
                            }))
                          ),
                          "parish_report"
                        )}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => printReport("parish")} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {parishReport.map((parish, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle>{parish.parish_name}</CardTitle>
                          <CardDescription>{parish.patient_count} patients</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {parish.patients.slice(0, 5).map((patient) => (
                              <div key={patient.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                                <span className="text-sm text-muted-foreground">{patient.town?.name}</span>
                              </div>
                            ))}
                            {parish.patients.length > 5 && (
                              <button 
                                className="text-sm text-primary hover:underline cursor-pointer w-full text-center py-1"
                                onClick={() => {
                                  // Show all patients by replacing the slice with full array temporarily
                                  const updatedReport = [...parishReport];
                                  updatedReport[index] = {
                                    ...parish,
                                    showAll: true
                                  };
                                  setParishReport(updatedReport);
                                }}
                              >
                                ... and {parish.patients.length - 5} more patients (click to view all {parish.patient_count})
                              </button>
                            )}
                            {parish.showAll && parish.patients.slice(5).map((patient) => (
                              <div key={patient.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                                <span className="text-sm text-muted-foreground">{patient.town?.name}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Reports */}
        <TabsContent value="registration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Patient Registration Reports
              </CardTitle>
              <CardDescription>
                View patient registration details and their selected services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {event.locations?.name} ({format(new Date(event.event_date), "MMM dd, yyyy")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateRegistrationReport} disabled={loading} className="gap-2">
                <FileText className="h-4 w-4" />
                Generate Registration Report
              </Button>

              {registrationReport.patients.length > 0 && (
                <div className="space-y-4">
                  {/* Service Filter Section */}
                  <Card className="bg-muted/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="h-4 w-4" />
                        Filter by Service
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Filter by Service</Label>
                        <Select value={selectedServiceFilter} onValueChange={setSelectedServiceFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Services" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Services ({getServiceCounts()['all']} patients)</SelectItem>
                            {registrationReport.availableServices.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service} ({getServiceCounts()[service]} patients)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Service Count Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                          <p className="text-2xl font-bold text-primary">{getServiceCounts()['all']}</p>
                        </div>
                        {registrationReport.availableServices.map((service) => (
                          <div key={service} className="bg-white p-3 rounded-lg border">
                            <p className="text-sm font-medium text-muted-foreground truncate" title={service}>
                              {service}
                            </p>
                            <p className="text-2xl font-bold text-blue-600">{getServiceCounts()[service]}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Registration Report Results 
                      {selectedServiceFilter !== 'all' && (
                        <span className="text-base font-normal text-muted-foreground ml-2">
                          (Filtered by: {selectedServiceFilter})
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const filteredPatients = getFilteredPatients();
                          exportToCSV(
                            filteredPatients.map(reg => {
                              const exportData: any = {
                                patient_number: reg.patient_number,
                                patient_name: reg.patient_name,
                                phone: reg.phone,
                                email: reg.email,
                                parish: reg.parish
                              };
                              // Add service columns
                              registrationReport.availableServices.forEach(service => {
                                exportData[service] = reg.serviceMap[service] ? 'Yes' : 'No';
                              });
                              return exportData;
                            }),
                            selectedServiceFilter === 'all' ? "registration_report" : `registration_report_${selectedServiceFilter.toLowerCase().replace(/\s+/g, '_')}`
                          );
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV ({getFilteredPatients().length})
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => printReport("registration")} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print ({getFilteredPatients().length})
                      </Button>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Registration Summary</CardTitle>
                      <CardDescription>
                        {getFilteredPatients().length} patients 
                        {selectedServiceFilter !== 'all' && ` registered for ${selectedServiceFilter}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Patient #</th>
                              <th className="text-left p-3 font-medium">Name</th>
                              <th className="text-left p-3 font-medium">Contact</th>
                              <th className="text-left p-3 font-medium">Parish</th>
                              {registrationReport.availableServices.map(service => (
                                <th key={service} className="text-center p-3 font-medium text-xs">{service}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredPatients().map((registration, index) => (
                              <tr key={registration.patient_id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                                <td className="p-3 font-mono text-sm">{registration.patient_number}</td>
                                <td className="p-3 font-medium">{registration.patient_name}</td>
                                <td className="p-3 text-sm">
                                  <div>
                                    {registration.phone && <div>{registration.phone}</div>}
                                    {registration.email && <div className="text-muted-foreground">{registration.email}</div>}
                                  </div>
                                </td>
                                <td className="p-3 text-sm">{registration.parish}</td>
                                {registrationReport.availableServices.map(service => (
                                  <td key={service} className="p-3 text-center">
                                    {registration.serviceMap[service] ? (
                                      <span className="text-green-600 font-bold text-lg">✓</span>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Reports */}
        <TabsContent value="demographics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Age & Sex Demographics
              </CardTitle>
              <CardDescription>
                Patient breakdown by 10-year age bands and sex, filtered by event or location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Select value={demographicScope} onValueChange={(v) => setDemographicScope(v as "event" | "location")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">By Event</SelectItem>
                      <SelectItem value="location">By Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {demographicScope === "event" ? (
                  <div className="space-y-2">
                    <Label>Select Event</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} - {event.locations?.name} ({format(new Date(event.event_date), "MMM dd, yyyy")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Select Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button onClick={generateDemographicReport} disabled={loading} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
              </div>

              {demographicReport && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{demographicReport.scopeName}</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportDemographicCSV} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={printDemographicReport} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Patients</p>
                        <p className="text-2xl font-bold">{demographicReport.summary.totalPatients}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Male</p>
                        <p className="text-2xl font-bold">{demographicReport.summary.totalMale}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Female</p>
                        <p className="text-2xl font-bold">{demographicReport.summary.totalFemale}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Avg. Age</p>
                        <p className="text-2xl font-bold">
                          {demographicReport.summary.averageAge !== null
                            ? demographicReport.summary.averageAge.toFixed(1)
                            : "N/A"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Age Band</th>
                          <th className="text-center p-3 font-medium">Male</th>
                          <th className="text-center p-3 font-medium">Female</th>
                          <th className="text-center p-3 font-medium">Other/Unspecified</th>
                          <th className="text-center p-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demographicReport.rows.map((row) => (
                          <tr key={row.band} className="border-t">
                            <td className="p-3 font-medium">{row.band}</td>
                            <td className="text-center p-3">{row.male}</td>
                            <td className="text-center p-3">{row.female}</td>
                            <td className="text-center p-3">{row.other}</td>
                            <td className="text-center p-3">{row.total}</td>
                          </tr>
                        ))}
                        <tr className="border-t bg-muted/30 font-semibold">
                          <td className="p-3">Total</td>
                          <td className="text-center p-3">{demographicReport.summary.totalMale}</td>
                          <td className="text-center p-3">{demographicReport.summary.totalFemale}</td>
                          <td className="text-center p-3">{demographicReport.summary.totalOther}</td>
                          <td className="text-center p-3">{demographicReport.summary.totalPatients}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Summary Tab */}
        <TabsContent value="location-summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Location Summary
              </CardTitle>
              <CardDescription>
                Age demographics and health fair services summary across one or more selected events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Events</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEventIds(events.map((e) => e.id))}
                    >
                      Select all
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEventIds([])}>
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
                  {events.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">No events available.</p>
                  )}
                  {events.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedEventIds.includes(event.id)}
                        onCheckedChange={() => toggleEventSelection(event.id)}
                      />
                      <span className="text-sm">
                        {event.name} - {event.locations?.name}{" "}
                        <span className="text-muted-foreground">
                          ({format(new Date(event.event_date), "MMM dd, yyyy")})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedEventIds.length} event(s) selected
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={generateLocationSummaryReport} disabled={loading} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
              </div>

              {locationSummaryReport && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{locationSummaryReport.eventsLabel}</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportLocationSummaryCSV} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={printLocationSummaryReport} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Patients</p>
                        <p className="text-2xl font-bold">{locationSummaryReport.summary.totalPatients}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Male</p>
                        <p className="text-2xl font-bold">{locationSummaryReport.summary.totalMale}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Female</p>
                        <p className="text-2xl font-bold">{locationSummaryReport.summary.totalFemale}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Avg. Age</p>
                        <p className="text-2xl font-bold">
                          {locationSummaryReport.summary.averageAge !== null
                            ? locationSummaryReport.summary.averageAge.toFixed(1)
                            : "N/A"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold mb-2">Age & Sex Demographics</h4>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Age Band</th>
                            <th className="text-center p-3 font-medium">Male</th>
                            <th className="text-center p-3 font-medium">Female</th>
                            <th className="text-center p-3 font-medium">Other/Unspecified</th>
                            <th className="text-center p-3 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {locationSummaryReport.rows.map((row) => (
                            <tr key={row.band} className="border-t">
                              <td className="p-3 font-medium">{row.band}</td>
                              <td className="text-center p-3">{row.male}</td>
                              <td className="text-center p-3">{row.female}</td>
                              <td className="text-center p-3">{row.other}</td>
                              <td className="text-center p-3">{row.total}</td>
                            </tr>
                          ))}
                          <tr className="border-t bg-muted/30 font-semibold">
                            <td className="p-3">Total</td>
                            <td className="text-center p-3">{locationSummaryReport.summary.totalMale}</td>
                            <td className="text-center p-3">{locationSummaryReport.summary.totalFemale}</td>
                            <td className="text-center p-3">{locationSummaryReport.summary.totalOther}</td>
                            <td className="text-center p-3">{locationSummaryReport.summary.totalPatients}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold mb-2">Health Fair Services Summary</h4>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Service</th>
                            <th className="text-center p-3 font-medium">Patients</th>
                          </tr>
                        </thead>
                        <tbody>
                          {locationSummaryReport.serviceRows.length === 0 && (
                            <tr className="border-t">
                              <td className="p-3 text-muted-foreground" colSpan={2}>
                                No service data for the selected events.
                              </td>
                            </tr>
                          )}
                          {locationSummaryReport.serviceRows.map((row) => (
                            <tr key={row.service_name} className="border-t">
                              <td className="p-3 font-medium">{row.service_name}</td>
                              <td className="text-center p-3">{row.patient_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>





        {/* Import/Export Tab */}
        <TabsContent value="import-export">
          <div className="grid gap-6">
            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Patient Data
                </CardTitle>
                <CardDescription>
                  Download all patient information and related data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV Format</SelectItem>
                        <SelectItem value="json">JSON Format</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Event (Optional)</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger>
                        <SelectValue placeholder="All events or select specific" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} - {format(new Date(event.event_date), "MMM dd, yyyy")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => exportAllPatients()} 
                    disabled={loading} 
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export All Patients
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => exportPatientVisits()} 
                    disabled={loading} 
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Patient Visits
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => exportServiceQueues()} 
                    disabled={loading} 
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Service Records
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Patient Data
                </CardTitle>
                <CardDescription>
                  Upload patient information from CSV or JSON files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select File</Label>
                    <Input
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: CSV, JSON. File should contain patient information with columns: first_name, last_name, phone, email, parish_id, etc.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Template Download</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadTemplate('csv')}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        CSV Template
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadTemplate('json')}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        JSON Template
                      </Button>
                    </div>
                  </div>

                  {importFile && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">Selected File:</p>
                      <p className="text-sm text-muted-foreground">{importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)</p>
                    </div>
                  )}

                  <Button 
                    onClick={() => importPatients()} 
                    disabled={!importFile || loading} 
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import Patients
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  Visual analytics and charts for patient data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {parishReport.reduce((sum, parish) => sum + parish.patient_count, 0)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{serviceReport.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Parishes Served</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{parishReport.length}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">
                    Generate service or parish reports to see detailed analytics and charts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;