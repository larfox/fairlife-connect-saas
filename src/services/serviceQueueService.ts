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
  
  console.log('=== KNOW YOUR NUMBERS FILTERING DEBUG ===');
  console.log('Know Your Numbers data:', knowYourNumbersData);
  
  knowYourNumbersData.forEach((item: any) => {
    console.log(`KYN Item - Patient: ${item.patient_visit?.patient?.first_name} ${item.patient_visit?.patient?.last_name}, Status: ${item.status}, Visit ID: ${item.patient_visit_id}`);
    if (item.status === 'completed') {
      completedKnowYourNumbersPatients.add(item.patient_visit_id);
    }
  });

  console.log('Completed KYN patients (visit IDs):', Array.from(completedKnowYourNumbersPatients));

  // Group by service and filter patients based on screening requirements
  const groupedData: { [key: string]: ServiceGroup } = {};
  
  queueData.forEach((item: QueueItem) => {
    const serviceId = item.service.id;
    const isKnowYourNumbers = item.service.name.toLowerCase().includes('know your numbers');
    const patientName = `${item.patient_visit.patient.first_name} ${item.patient_visit.patient.last_name}`;
    
    // Create service group if it doesn't exist
    if (!groupedData[serviceId]) {
      groupedData[serviceId] = {
        service: item.service,
        patients: []
      };
    }
    
    // For "Know Your Numbers" services, add all patients
    if (isKnowYourNumbers) {
      console.log(`Adding ${patientName} to KYN service: ${item.service.name}`);
      groupedData[serviceId].patients.push(item);
    } else {
      // For other services, only add patients who have completed "Know Your Numbers"
      const hasCompletedKnowYourNumbers = completedKnowYourNumbersPatients.has(item.patient_visit_id);
      
      console.log(`Checking ${patientName} for service ${item.service.name}: Visit ID ${item.patient_visit_id}, Has completed KYN: ${hasCompletedKnowYourNumbers}`);
      
      if (hasCompletedKnowYourNumbers) {
        console.log(`✓ Adding ${patientName} to ${item.service.name} (completed KYN)`);
        groupedData[serviceId].patients.push(item);
      } else {
        console.log(`✗ Excluding ${patientName} from ${item.service.name} (no KYN completion)`);
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
      const statusOrder = { 'waiting': 0, 'in_progress': 1, 'unavailable': 2, 'completed': 3 };
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
  console.log('=== START updateServiceStatusInDB ===');
  console.log('Queue Item ID:', queueItemId);
  console.log('New Status:', newStatus);
  
  // First, get the current queue item to find the patient_visit_id
  const { data: currentItem, error: fetchError } = await supabase
    .from('service_queue')
    .select('patient_visit_id, service_id')
    .eq('id', queueItemId)
    .single();

  if (fetchError) {
    console.error('Error fetching current queue item:', fetchError);
    throw fetchError;
  }

  console.log('Current item:', currentItem);

  const updateData: any = { status: newStatus };
  
  if (newStatus === 'in_progress') {
    updateData.started_at = new Date().toISOString();
  } else if (newStatus === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  console.log('Update data for main item:', updateData);

  // Update the main queue item
  const { error } = await supabase
    .from('service_queue')
    .update(updateData)
    .eq('id', queueItemId);

  if (error) {
    console.error('Error updating service status:', error);
    throw error;
  }

  console.log('Main item updated successfully');

  // Handle cross-service status updates
  if (newStatus === 'in_progress') {
    console.log('=== CROSS-SERVICE UPDATE: Setting others to unavailable ===');
    console.log('Patient visit ID:', currentItem.patient_visit_id);
    console.log('Excluding service ID:', currentItem.service_id);
    
    // When a patient starts a service, mark them as unavailable in other waiting services
    const { data: updatedRows, error: unavailableError } = await supabase
      .from('service_queue')
      .update({ status: 'unavailable' })
      .eq('patient_visit_id', currentItem.patient_visit_id)
      .neq('service_id', currentItem.service_id)
      .eq('status', 'waiting')
      .select();

    if (unavailableError) {
      console.error('Error updating other services to unavailable:', unavailableError);
    } else {
      console.log('Successfully updated', updatedRows?.length || 0, 'services to unavailable');
      console.log('Updated rows:', updatedRows);
    }
  } else if (newStatus === 'completed') {
    console.log('=== CROSS-SERVICE UPDATE: Setting others back to waiting ===');
    console.log('Patient visit ID:', currentItem.patient_visit_id);
    console.log('Excluding service ID:', currentItem.service_id);
    
    // When a patient completes a service, mark them as waiting in other unavailable services
    const { data: updatedRows, error: waitingError } = await supabase
      .from('service_queue')
      .update({ status: 'waiting' })
      .eq('patient_visit_id', currentItem.patient_visit_id)
      .neq('service_id', currentItem.service_id)
      .eq('status', 'unavailable')
      .select();

    if (waitingError) {
      console.error('Error updating other services back to waiting:', waitingError);
    } else {
      console.log('Successfully updated', updatedRows?.length || 0, 'services back to waiting');
      console.log('Updated rows:', updatedRows);
    }
  }
  
  console.log('=== END updateServiceStatusInDB ===');
};