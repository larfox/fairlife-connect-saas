import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    basic_screening_completed: boolean | null;
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

export function useServiceQueue(selectedEvent: any, onStatsUpdate: () => void) {
  const [serviceQueues, setServiceQueues] = useState<ServiceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<{[serviceId: string]: string}>({});

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

      // Get all "Know Your Numbers" queue items for this event to check completion status
      const { data: knowYourNumbersData, error: kynError } = await supabase
        .from('service_queue')
        .select(`
          *,
          service:services(*),
          patient_visit:patient_visits(*)
        `)
        .eq('patient_visit.event_id', selectedEvent.id)
        .ilike('service.name', '%know your numbers%');

      if (kynError) {
        console.error('Error fetching Know Your Numbers data:', kynError);
      }

      // Create a map of patients who have completed "Know Your Numbers"
      const completedKnowYourNumbersPatients = new Set<string>();
      knowYourNumbersData?.forEach((item: any) => {
        if (item.status === 'completed') {
          completedKnowYourNumbersPatients.add(item.patient_visit_id);
        }
      });

      // Group by service and filter patients based on screening requirements
      const groupedData: { [key: string]: ServiceGroup } = {};
      
      queueData?.forEach((item: QueueItem) => {
        const serviceId = item.service.id;
        const isKnowYourNumbers = item.service.name.toLowerCase().includes('know your numbers');
        
        // Create service group if it doesn't exist
        if (!groupedData[serviceId]) {
          groupedData[serviceId] = {
            service: item.service,
            patients: []
          };
        }
        
        // For "Know Your Numbers" services, add all patients
        if (isKnowYourNumbers) {
          groupedData[serviceId].patients.push(item);
        } else {
          // For other services, only add patients who have completed "Know Your Numbers"
          const hasCompletedKnowYourNumbers = completedKnowYourNumbersPatients.has(item.patient_visit_id);
          
          if (hasCompletedKnowYourNumbers) {
            groupedData[serviceId].patients.push(item);
          }
        }
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

  const getFilteredPatients = (serviceGroup: ServiceGroup) => {
    const filter = statusFilters[serviceGroup.service.id];
    if (!filter || filter === 'all') {
      return serviceGroup.patients;
    }
    return serviceGroup.patients.filter(patient => patient.status === filter);
  };

  const handleStatusFilterChange = (serviceId: string, status: string) => {
    setStatusFilters(prev => ({
      ...prev,
      [serviceId]: status
    }));
  };

  return {
    serviceQueues,
    loading,
    statusFilters,
    updateServiceStatus,
    getFilteredPatients,
    handleStatusFilterChange
  };
}