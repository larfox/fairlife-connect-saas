import { supabase } from '@/integrations/supabase/client';
import { QueueItem, ServiceGroup } from '@/types/serviceQueue';

export const fetchServiceQueuesData = async (eventId: string): Promise<ServiceGroup[]> => {
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
    .eq('patient_visit.event_id', eventId)
    .order('queue_position', { ascending: true });

  if (error) {
    console.error('Error fetching service queues:', error);
    throw error;
  }

  // Get all "Know Your Numbers" queue items for this event to check completion status
  const { data: knowYourNumbersData, error: kynError } = await supabase
    .from('service_queue')
    .select(`
      *,
      service:services(*),
      patient_visit:patient_visits(*)
    `)
    .eq('patient_visit.event_id', eventId)
    .ilike('service.name', '%know your numbers%');

  if (kynError) {
    console.error('Error fetching Know Your Numbers data:', kynError);
  }

  return processServiceQueueData(queueData || [], knowYourNumbersData || []);
};

const processServiceQueueData = (queueData: any[], knowYourNumbersData: any[]): ServiceGroup[] => {
  // Create a map of patients who have completed "Know Your Numbers"
  const completedKnowYourNumbersPatients = new Set<string>();
  knowYourNumbersData.forEach((item: any) => {
    if (item.status === 'completed') {
      completedKnowYourNumbersPatients.add(item.patient_visit_id);
    }
  });

  // Group by service and filter patients based on screening requirements
  const groupedData: { [key: string]: ServiceGroup } = {};
  
  queueData.forEach((item: QueueItem) => {
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

  return sortServiceGroups(Object.values(groupedData));
};

const sortServiceGroups = (serviceGroups: ServiceGroup[]): ServiceGroup[] => {
  // Convert to array and sort services, with "Know Your Numbers" first
  const sortedServices = serviceGroups.sort((a, b) => {
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

  return sortedServices;
};

export const updateServiceStatusInDB = async (queueItemId: string, newStatus: string): Promise<void> => {
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
    throw error;
  }
};