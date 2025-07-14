import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, UserPlus, Activity, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PatientRegistration from "./PatientRegistration";
import ServiceQueue from "./ServiceQueue";
import { PatientServiceQueue } from "./PatientServiceQueue";
import { ServiceSummary } from "./ServiceSummary";
import ServicePatientSearch from "./ServicePatientSearch";

interface QueueManagementProps {
  selectedEvent: any;
  onBack: () => void;
}

const QueueManagement = ({ selectedEvent, onBack }: QueueManagementProps) => {
  const [activeTab, setActiveTab] = useState("registration");
  const [queueStats, setQueueStats] = useState({
    totalPatients: 0,
    waiting: 0,
    inProgress: 0,
    completed: 0
  });
  const [services, setServices] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedEvent) {
      fetchQueueStats();
      fetchServices();
    }
  }, [selectedEvent]);

  // Update active tab when services are loaded to default to first service if coming from search
  useEffect(() => {
    if (services.length > 0 && activeTab === "search") {
      setActiveTab(`search-${services[0].id}`);
    }
  }, [services]);

  const fetchServices = async () => {
    try {
      console.log("=== FETCHING SERVICES DEBUG ===");
      console.log("Selected event:", selectedEvent);
      console.log("Event ID:", selectedEvent?.id);
      console.log("Event name:", selectedEvent?.name);
      
      if (!selectedEvent?.id) {
        console.log("No event selected, cannot fetch services");
        setServices([]);
        return;
      }
      
      // First, let's try a simple query to see what services exist for this event
      const { data: eventServicesData, error: eventServicesError } = await supabase
        .from("event_services")
        .select("*")
        .eq("event_id", selectedEvent.id);
        
      console.log("Event services raw data:", eventServicesData);
      console.log("Event services error:", eventServicesError);
      
      if (eventServicesError) {
        console.error("Error fetching event services:", eventServicesError);
        throw eventServicesError;
      }
      
      if (!eventServicesData || eventServicesData.length === 0) {
        console.log("No services found for this event, falling back to all services");
        // Fallback: fetch all active services if no event-specific services
        const { data: allServices, error: allServicesError } = await supabase
          .from("services")
          .select("*")
          .eq("is_active", true)
          .order("name");
          
        if (allServicesError) throw allServicesError;
        
        const sortedServices = (allServices || []).sort((a, b) => {
          if (a.name.toLowerCase().includes('know your numbers')) return -1;
          if (b.name.toLowerCase().includes('know your numbers')) return 1;
          return a.name.localeCompare(b.name);
        });
        
        console.log("Using all services as fallback:", sortedServices);
        setServices(sortedServices);
        return;
      }
      
      // Now fetch the actual service details
      const serviceIds = eventServicesData.map(es => es.service_id);
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .in("id", serviceIds)
        .eq("is_active", true);
        
      console.log("Services data:", servicesData);
      console.log("Services error:", servicesError);
      
      if (servicesError) throw servicesError;
      
      // Sort services to put "Know Your Numbers" first
      const sortedServices = (servicesData || []).sort((a, b) => {
        if (a.name.toLowerCase().includes('know your numbers')) return -1;
        if (b.name.toLowerCase().includes('know your numbers')) return 1;
        return a.name.localeCompare(b.name);
      });
      
      console.log("Final sorted services:", sortedServices);
      setServices(sortedServices);
      
    } catch (error) {
      console.error("Error in fetchServices:", error);
      toast({
        title: "Error fetching services",
        description: "Failed to load services for this event.",
        variant: "destructive",
      });
    }
  };

  const fetchQueueStats = async () => {
    try {
      // Get total patients in queue for this event
      const { data: visits, error: visitsError } = await supabase
        .from("patient_visits")
        .select("*")
        .eq("event_id", selectedEvent.id);

      if (visitsError) throw visitsError;

      // Get service queue stats
      const { data: serviceQueue, error: queueError } = await supabase
        .from("service_queue")
        .select(`
          *,
          patient_visits!inner(event_id)
        `)
        .eq("patient_visits.event_id", selectedEvent.id);

      if (queueError) throw queueError;

      const waiting = serviceQueue?.filter(q => q.status === 'waiting').length || 0;
      const inProgress = serviceQueue?.filter(q => q.status === 'in_progress').length || 0;
      const completed = serviceQueue?.filter(q => q.status === 'completed').length || 0;

      setQueueStats({
        totalPatients: visits?.length || 0,
        waiting,
        inProgress,
        completed
      });
    } catch (error) {
      toast({
        title: "Error fetching queue stats",
        description: "Failed to load queue statistics.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Queue Management</h1>
              <p className="text-muted-foreground mt-1">
                {selectedEvent?.name} - Queue System
              </p>
            </div>
          </div>
        </div>


        {/* Main Queue Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(services.length + 2, 6)}, minmax(0, 1fr))` }}>
            <TabsTrigger value="registration" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Registration
            </TabsTrigger>
            {services.map((service) => (
              <TabsTrigger key={service.id} value={`search-${service.id}`} className="gap-2">
                <Search className="h-4 w-4" />
                {service.name}
              </TabsTrigger>
            ))}
            <TabsTrigger value="services" className="gap-2">
              <Activity className="h-4 w-4" />
              Service Queues
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="space-y-6 mt-6">
            <PatientRegistration 
              selectedEvent={selectedEvent} 
              onRegistrationComplete={fetchQueueStats}
            />
          </TabsContent>

          {services.map((service) => (
            <TabsContent key={service.id} value={`search-${service.id}`} className="space-y-6 mt-6">
              <ServicePatientSearch 
                selectedEvent={selectedEvent} 
                serviceId={service.id}
                serviceName={service.name}
              />
            </TabsContent>
          ))}

          <TabsContent value="services" className="space-y-6 mt-6">
            <ServiceSummary 
              selectedEvent={selectedEvent} 
              onStatsUpdate={fetchQueueStats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QueueManagement;