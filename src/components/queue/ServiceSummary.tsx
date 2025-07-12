import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Service Queue Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceStats.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              {service.description && (
                <p className="text-sm text-muted-foreground">{service.description}</p>
              )}
              <div className="text-xs text-muted-foreground">
                Duration: {service.duration_minutes} minutes
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Registered */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</span>
                </div>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {service.totalRegistered}
                </span>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                  <Clock className="h-4 w-4 mx-auto text-yellow-600 dark:text-yellow-400 mb-1" />
                  <div className="font-semibold text-yellow-700 dark:text-yellow-300">{service.waiting}</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">Waiting</div>
                </div>
                
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                  <AlertCircle className="h-4 w-4 mx-auto text-orange-600 dark:text-orange-400 mb-1" />
                  <div className="font-semibold text-orange-700 dark:text-orange-300">{service.inProgress}</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">In Progress</div>
                </div>
                
                <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                  <CheckCircle className="h-4 w-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                  <div className="font-semibold text-green-700 dark:text-green-300">{service.completed}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Completed</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>
                    {service.totalRegistered > 0 
                      ? Math.round((service.completed / service.totalRegistered) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: service.totalRegistered > 0 
                        ? `${(service.completed / service.totalRegistered) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}