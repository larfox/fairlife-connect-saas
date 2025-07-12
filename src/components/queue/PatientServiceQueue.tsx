import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Clock, Play, CheckCircle } from 'lucide-react';
import PatientDetailsModal from './PatientDetailsModal';

interface PatientServiceQueueProps {
  selectedEvent: any;
  onStatsUpdate: () => void;
}

interface QueueItem {
  id: string;
  status: string;
  queue_position: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  service_id: string;
  patient_visit_id: string;
  doctor_id: string | null;
  nurse_id: string | null;
  service: {
    id: string;
    name: string;
    description: string | null;
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
      phone: string | null;
      email: string | null;
    };
  };
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  nurse?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface ServiceGroup {
  service: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
  };
  patients: QueueItem[];
}

export function PatientServiceQueue({ selectedEvent, onStatsUpdate }: PatientServiceQueueProps) {
  const [serviceQueues, setServiceQueues] = useState<ServiceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  useEffect(() => {
    if (selectedEvent?.id) {
      fetchServiceQueues();
    }
  }, [selectedEvent]);

  const fetchServiceQueues = async () => {
    setLoading(true);
    try {
      const { data: queueData, error } = await supabase
        .from('service_queue')
        .select(`
          *,
          service:services(*),
          patient_visit:patient_visits(
            *,
            patient:patients(*)
          ),
          doctor:doctors(*),
          nurse:nurses(*)
        `)
        .eq('patient_visit.event_id', selectedEvent.id)
        .order('queue_position', { ascending: true });

      if (error) {
        console.error('Error fetching service queues:', error);
        return;
      }

      // Group by service and order services with "Know Your Numbers" first
      const groupedData: { [key: string]: ServiceGroup } = {};
      
      queueData?.forEach((item: QueueItem) => {
        const serviceId = item.service.id;
        if (!groupedData[serviceId]) {
          groupedData[serviceId] = {
            service: item.service,
            patients: []
          };
        }
        groupedData[serviceId].patients.push(item);
      });

      // Convert to array and sort services, with "Know Your Numbers" first
      const sortedServices = Object.values(groupedData).sort((a, b) => {
        const aIsKnowYourNumbers = a.service.name.toLowerCase().includes('know your numbers');
        const bIsKnowYourNumbers = b.service.name.toLowerCase().includes('know your numbers');
        
        if (aIsKnowYourNumbers && !bIsKnowYourNumbers) return -1;
        if (!aIsKnowYourNumbers && bIsKnowYourNumbers) return 1;
        return a.service.name.localeCompare(b.service.name);
      });

      // Sort patients within each service by status and queue position
      sortedServices.forEach(serviceGroup => {
        serviceGroup.patients.sort((a, b) => {
          const statusOrder = { 'waiting': 0, 'in_progress': 1, 'completed': 2 };
          const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
          const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
          
          if (aStatusOrder !== bStatusOrder) {
            return aStatusOrder - bStatusOrder;
          }
          
          return (a.queue_position || 0) - (b.queue_position || 0);
        });
      });

      setServiceQueues(sortedServices);
    } catch (error) {
      console.error('Error:', error);
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
        .from('service_queue')
        .update(updateData)
        .eq('id', queueItemId);

      if (error) {
        console.error('Error updating service status:', error);
        return;
      }

      fetchServiceQueues();
      onStatsUpdate();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: 'secondary',
      in_progress: 'default',
      completed: 'default'
    } as const;

    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80',
      in_progress: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80',
      completed: 'bg-green-100 text-green-800 hover:bg-green-100/80'
    } as const;

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || 'secondary'}
        className={`${colors[status as keyof typeof colors] || ''} capitalize`}
      >
        {getStatusIcon(status)}
        <span className="ml-1">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getNextAvailableAction = (patient: QueueItem) => {
    if (patient.status === 'waiting') {
      return (
        <Button
          size="sm"
          onClick={() => updateServiceStatus(patient.id, 'in_progress')}
          className="ml-2"
        >
          Start Service
        </Button>
      );
    } else if (patient.status === 'in_progress') {
      return (
        <Button
          size="sm"
          onClick={() => updateServiceStatus(patient.id, 'completed')}
          className="ml-2"
          variant="outline"
        >
          Mark Complete
        </Button>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="p-4">Loading patient queues...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Patients are organized by service. "Know Your Numbers" patients are shown first, followed by other services.
      </div>

      {serviceQueues.map((serviceGroup) => (
        <Card key={serviceGroup.service.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{serviceGroup.service.name}</span>
              <Badge variant="outline">
                {serviceGroup.patients.length} patients
              </Badge>
            </CardTitle>
            {serviceGroup.service.description && (
              <p className="text-sm text-muted-foreground">{serviceGroup.service.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {serviceGroup.patients.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No patients in this service queue</p>
            ) : (
              <div className="space-y-3">
                {serviceGroup.patients.map((patient, index) => (
                  <div
                    key={patient.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      index === 0 && patient.status === 'waiting' 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        #{patient.patient_visit.queue_number}
                      </div>
                      <div>
                        <div className="font-medium">
                          {patient.patient_visit.patient.first_name} {patient.patient_visit.patient.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {patient.patient_visit.patient.patient_number}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(patient.status)}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPatient(patient.patient_visit.patient)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      
                      {getNextAvailableAction(patient)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

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
}