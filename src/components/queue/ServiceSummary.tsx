import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceStats {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  totalRegistered: number;
  waiting: number;
  inProgress: number;
  completed: number;
}

interface ServiceSummaryProps {
  selectedEvent: any;
  onStatsUpdate: () => void;
}

export function ServiceSummary({ selectedEvent, onStatsUpdate }: ServiceSummaryProps) {
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedEvent?.id) {
      fetchServiceStats();
    }
  }, [selectedEvent]);

  const fetchServiceStats = async () => {
    try {
      setLoading(true);

      // Fetch all service queue data for this event
      const { data: queueData, error } = await supabase
        .from('service_queue')
        .select(`
          *,
          service:services(*),
          patient_visit:patient_visits!inner(
            event_id
          )
        `)
        .eq('patient_visit.event_id', selectedEvent.id);

      if (error) throw error;

      // Group data by service and calculate stats
      const serviceStatsMap: { [key: string]: ServiceStats } = {};

      queueData?.forEach((item: any) => {
        const serviceId = item.service.id;
        
        if (!serviceStatsMap[serviceId]) {
          serviceStatsMap[serviceId] = {
            id: item.service.id,
            name: item.service.name,
            description: item.service.description,
            duration_minutes: item.service.duration_minutes,
            totalRegistered: 0,
            waiting: 0,
            inProgress: 0,
            completed: 0,
          };
        }

        serviceStatsMap[serviceId].totalRegistered++;
        
        switch (item.status) {
          case 'waiting':
            serviceStatsMap[serviceId].waiting++;
            break;
          case 'in_progress':
            serviceStatsMap[serviceId].inProgress++;
            break;
          case 'completed':
            serviceStatsMap[serviceId].completed++;
            break;
        }
      });

      // Sort services with "Know Your Numbers" first
      const sortedStats = Object.values(serviceStatsMap).sort((a, b) => {
        const aIsKnowYourNumbers = a.name.toLowerCase().includes('know your numbers');
        const bIsKnowYourNumbers = b.name.toLowerCase().includes('know your numbers');
        
        if (aIsKnowYourNumbers && !bIsKnowYourNumbers) return -1;
        if (!aIsKnowYourNumbers && bIsKnowYourNumbers) return 1;
        return a.name.localeCompare(b.name);
      });

      setServiceStats(sortedStats);
    } catch (error) {
      console.error('Error fetching service stats:', error);
      toast({
        title: "Error",
        description: "Failed to load service statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-medium">Loading service statistics...</div>
        </div>
      </div>
    );
  }

  if (serviceStats.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Service Data</h3>
          <p className="text-muted-foreground">
            No patients have been registered for services at this event yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-card transition-[var(--transition-smooth)]">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-primary/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{serviceStats.reduce((acc, service) => acc + service.totalRegistered, 0)}</p>
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
                <p className="text-2xl font-bold text-foreground">{serviceStats.reduce((acc, service) => acc + service.waiting, 0)}</p>
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
                <p className="text-2xl font-bold text-foreground">{serviceStats.reduce((acc, service) => acc + service.inProgress, 0)}</p>
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
                <p className="text-2xl font-bold text-foreground">{serviceStats.reduce((acc, service) => acc + service.completed, 0)}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Service Queue Summary</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Waiting</TableHead>
                <TableHead className="text-center">In Progress</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceStats.map((service) => {
                const progressPercentage = service.totalRegistered > 0 
                  ? Math.round((service.completed / service.totalRegistered) * 100)
                  : 0;

                return (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">
                        {service.duration_minutes} min
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-700">
                          {service.totalRegistered}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-700">
                          {service.waiting}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold text-orange-700">
                          {service.inProgress}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-700">
                          {service.completed}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground min-w-[2.5rem]">
                          {progressPercentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}