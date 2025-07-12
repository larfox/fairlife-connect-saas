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

interface QueueManagementProps {
  selectedEvent: any;
  onBack: () => void;
}

const QueueManagement = ({ selectedEvent, onBack }: QueueManagementProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [queueStats, setQueueStats] = useState({
    totalPatients: 0,
    waiting: 0,
    inProgress: 0,
    completed: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (selectedEvent) {
      fetchQueueStats();
    }
  }, [selectedEvent]);

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

        {/* Queue Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-card transition-[var(--transition-smooth)]">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-primary/10 p-3 rounded-lg">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{queueStats.totalPatients}</p>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card transition-[var(--transition-smooth)]">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-500/10 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{queueStats.waiting}</p>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card transition-[var(--transition-smooth)]">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{queueStats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card transition-[var(--transition-smooth)]">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{queueStats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Queue Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="registration" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Registration
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search Patients
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Activity className="h-4 w-4" />
              Service Queues
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <ServiceQueue 
              selectedEvent={selectedEvent} 
              onStatsUpdate={fetchQueueStats}
              viewMode="overview"
            />
          </TabsContent>

          <TabsContent value="registration" className="space-y-6 mt-6">
            <PatientRegistration 
              selectedEvent={selectedEvent} 
              onRegistrationComplete={fetchQueueStats}
            />
          </TabsContent>

          <TabsContent value="search" className="space-y-6 mt-6">
            <PatientServiceQueue 
              selectedEvent={selectedEvent} 
              onStatsUpdate={fetchQueueStats}
            />
          </TabsContent>

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