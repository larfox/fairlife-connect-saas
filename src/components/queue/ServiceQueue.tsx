import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  User, 
  AlertTriangle,
  Play,
  Square,
  MoreHorizontal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PatientDetailsModal from "./PatientDetailsModal";

interface ServiceQueueProps {
  selectedEvent: any;
  onStatsUpdate: () => void;
  viewMode: 'overview' | 'detailed';
}

interface QueueItem {
  id: string;
  status: string;
  queue_position: number;
  started_at: string | null;
  completed_at: string | null;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
  };
  patient_visit: {
    id: string;
    queue_number: number;
    patient: {
      id: string;
      first_name: string;
      last_name: string;
      patient_number: string;
      allergies: string | null;
      medical_conditions: string | null;
    };
  };
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  nurse?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

const ServiceQueue = ({ selectedEvent, onStatsUpdate, viewMode }: ServiceQueueProps) => {
  const [serviceQueues, setServiceQueues] = useState<{[key: string]: QueueItem[]}>({});
  const [services, setServices] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedEvent) {
      fetchServiceQueues();
      fetchServices();
    }
  }, [selectedEvent]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast({
        title: "Error fetching services",
        description: "Failed to load services.",
        variant: "destructive",
      });
    }
  };

  const fetchServiceQueues = async () => {
    try {
      const { data, error } = await supabase
        .from("service_queue")
        .select(`
          *,
          services (
            id,
            name,
            duration_minutes
          ),
          patient_visits!inner (
            id,
            queue_number,
            event_id,
            patients (
              id,
              first_name,
              last_name,
              patient_number,
              allergies,
              medical_conditions
            )
          ),
          doctors (
            id,
            first_name,
            last_name
          ),
          nurses (
            id,
            first_name,
            last_name
          )
        `)
        .eq("patient_visits.event_id", selectedEvent.id)
        .order("queue_position");

      if (error) throw error;

      // Group by service
      const grouped = (data || []).reduce((acc: {[key: string]: QueueItem[]}, item: any) => {
        const serviceId = item.services.id;
        if (!acc[serviceId]) {
          acc[serviceId] = [];
        }
        acc[serviceId].push({
          id: item.id,
          status: item.status,
          queue_position: item.queue_position,
          started_at: item.started_at,
          completed_at: item.completed_at,
          service: item.services,
          patient_visit: {
            id: item.patient_visits.id,
            queue_number: item.patient_visits.queue_number,
            patient: item.patient_visits.patients
          },
          doctor: item.doctors,
          nurse: item.nurses
        });
        return acc;
      }, {});

      setServiceQueues(grouped);
    } catch (error) {
      toast({
        title: "Error fetching queue data",
        description: "Failed to load service queues.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateServiceStatus = async (queueItemId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("service_queue")
        .update(updateData)
        .eq("id", queueItemId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Service status updated to ${newStatus}.`,
      });

      fetchServiceQueues();
      onStatsUpdate();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update service status.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'waiting': 'outline',
      'in_progress': 'default',
      'completed': 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-medium">Loading queue data...</div>
        </div>
      </div>
    );
  }

  if (viewMode === 'overview') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const queueItems = serviceQueues[service.id] || [];
          const waiting = queueItems.filter(item => item.status === 'waiting').length;
          const inProgress = queueItems.filter(item => item.status === 'in_progress').length;
          const completed = queueItems.filter(item => item.status === 'completed').length;

          return (
            <Card key={service.id} className="hover:shadow-card transition-[var(--transition-smooth)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{service.name}</span>
                  <Badge variant="outline">{queueItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Waiting:</span>
                    <span className="font-medium text-yellow-600">{waiting}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">In Progress:</span>
                    <span className="font-medium text-blue-600">{inProgress}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium text-green-600">{completed}</span>
                  </div>
                  
                  {queueItems.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Current Queue:</h4>
                        <ScrollArea className="h-32">
                          {queueItems
                            .filter(item => item.status !== 'completed')
                            .slice(0, 5)
                            .map((item) => (
                              <div key={item.id} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(item.status)}
                                  <span className="text-sm">
                                    #{item.patient_visit.queue_number} {item.patient_visit.patient.first_name} {item.patient_visit.patient.last_name}
                                  </span>
                                </div>
                                {item.patient_visit.patient.allergies && (
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            ))}
                        </ScrollArea>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={services[0]?.id} className="w-full">
        <TabsList className="grid w-full grid-cols-auto">
          {services.map((service) => (
            <TabsTrigger key={service.id} value={service.id} className="flex-1">
              {service.name}
              <Badge variant="outline" className="ml-2">
                {serviceQueues[service.id]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {services.map((service) => (
          <TabsContent key={service.id} value={service.id} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Waiting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Waiting
                    <Badge variant="outline">
                      {serviceQueues[service.id]?.filter(item => item.status === 'waiting').length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {serviceQueues[service.id]
                        ?.filter(item => item.status === 'waiting')
                        .map((item) => (
                          <div key={item.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">#{item.patient_visit.queue_number}</Badge>
                                <span className="font-medium">
                                  {item.patient_visit.patient.first_name} {item.patient_visit.patient.last_name}
                                </span>
                              </div>
                              {item.patient_visit.patient.allergies && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => updateServiceStatus(item.id, 'in_progress')}
                                className="gap-1"
                              >
                                <Play className="h-3 w-3" />
                                Start
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedPatient(item.patient_visit.patient)}
                                className="gap-1"
                              >
                                <User className="h-3 w-3" />
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* In Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    In Progress
                    <Badge variant="outline">
                      {serviceQueues[service.id]?.filter(item => item.status === 'in_progress').length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {serviceQueues[service.id]
                        ?.filter(item => item.status === 'in_progress')
                        .map((item) => (
                          <div key={item.id} className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="default">#{item.patient_visit.queue_number}</Badge>
                                <span className="font-medium">
                                  {item.patient_visit.patient.first_name} {item.patient_visit.patient.last_name}
                                </span>
                              </div>
                              {item.patient_visit.patient.allergies && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            {item.started_at && (
                              <p className="text-xs text-muted-foreground mb-2">
                                Started: {new Date(item.started_at).toLocaleTimeString()}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                onClick={() => updateServiceStatus(item.id, 'completed')}
                                className="gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Complete
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedPatient(item.patient_visit.patient)}
                                className="gap-1"
                              >
                                <User className="h-3 w-3" />
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Completed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Completed
                    <Badge variant="outline">
                      {serviceQueues[service.id]?.filter(item => item.status === 'completed').length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {serviceQueues[service.id]
                        ?.filter(item => item.status === 'completed')
                        .map((item) => (
                          <div key={item.id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">#{item.patient_visit.queue_number}</Badge>
                                <span className="font-medium">
                                  {item.patient_visit.patient.first_name} {item.patient_visit.patient.last_name}
                                </span>
                              </div>
                              {item.patient_visit.patient.allergies && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            {item.completed_at && (
                              <p className="text-xs text-muted-foreground mb-2">
                                Completed: {new Date(item.completed_at).toLocaleTimeString()}
                              </p>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedPatient(item.patient_visit.patient)}
                              className="gap-1"
                            >
                              <User className="h-3 w-3" />
                              Details
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {selectedPatient && (
        <PatientDetailsModal 
          patient={selectedPatient}
          eventId={selectedEvent.id}
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
};

export default ServiceQueue;