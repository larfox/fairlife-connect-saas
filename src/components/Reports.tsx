import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, FileText, Download, Printer, Users, Activity, BarChart3, PieChart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
};

const Reports = ({ onBack }: ReportsProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [parishes, setParishes] = useState<Tables<"parishes">[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedParish, setSelectedParish] = useState<string>("");
  
  // Report data
  const [locationReport, setLocationReport] = useState<LocationReport[]>([]);
  const [serviceReport, setServiceReport] = useState<ServiceReport[]>([]);
  const [parishReport, setParishReport] = useState<ParishReport[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [eventsResponse, servicesResponse, parishesResponse] = await Promise.all([
        supabase.from("events").select("*, locations(name, address)").eq("is_active", true),
        supabase.from("services").select("*").eq("is_active", true),
        supabase.from("parishes").select("*")
      ]);

      if (eventsResponse.data) setEvents(eventsResponse.data);
      if (servicesResponse.data) setServices(servicesResponse.data);
      if (parishesResponse.data) setParishes(parishesResponse.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
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
    setLoading(true);
    try {
      const { data: patients, error } = await supabase
        .from("patients")
        .select(`
          *,
          parish:parishes(name),
          town:towns(name),
          patient_visits(
            *,
            event:events(
              *,
              locations(name, address)
            )
          )
        `)
        .not("parish_id", "is", null);

      if (error) throw error;

      // Group by parish
      const parishGroups: { [key: string]: ParishReport } = {};
      
      patients?.forEach(patient => {
        const parishName = patient.parish?.name || "Unknown Parish";
        if (!parishGroups[parishName]) {
          parishGroups[parishName] = {
            parish_name: parishName,
            patient_count: 0,
            patients: []
          };
        }
        parishGroups[parishName].patients.push(patient as PatientWithDetails);
        parishGroups[parishName].patient_count++;
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
    window.print();
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
        <TabsList className="grid w-full grid-cols-4">
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
                              <div key={patient.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                                <span className="text-sm text-muted-foreground">{patient.parish?.name}</span>
                              </div>
                            ))}
                            {service.patients.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center">
                                ... and {service.patients.length - 5} more patients
                              </p>
                            )}
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
                Analyze patient distribution by geographic location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                              <p className="text-sm text-muted-foreground text-center">
                                ... and {parish.patients.length - 5} more patients
                              </p>
                            )}
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