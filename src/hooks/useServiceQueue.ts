import { useState, useEffect } from 'react';
import { ServiceGroup } from '@/types/serviceQueue';
import { fetchServiceQueuesData, updateServiceStatusInDB, deleteQueueItemInDB, deleteAllQueueItemsForVisitInDB } from '@/services/serviceQueueService';

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
      const sortedServices = await fetchServiceQueuesData(selectedEvent.id);
      setServiceQueues(sortedServices);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateServiceStatus = async (queueItemId: string, newStatus: string) => {
    console.log('=== useServiceQueue updateServiceStatus CALLED ===');
    console.log('Queue Item ID:', queueItemId);
    console.log('New Status:', newStatus);
    
    try {
      console.log('Calling updateServiceStatusInDB...');
      await updateServiceStatusInDB(queueItemId, newStatus);
      console.log('updateServiceStatusInDB completed, refreshing data...');
      
      // Always refresh the queue data to show real-time updates
      await fetchServiceQueues();
      onStatsUpdate();
      
      // If this was a "Know Your Numbers" completion, add a small delay 
      // and refresh again to ensure the trigger has time to execute
      if (newStatus === 'completed') {
        setTimeout(async () => {
          console.log('Post-completion refresh to catch trigger updates...');
          await fetchServiceQueues();
          onStatsUpdate();
        }, 1000);
      }
    } catch (error) {
      console.error('Error in updateServiceStatus:', error);
    }
  };

const deleteQueueItem = async (queueItemId: string) => {
  try {
    await deleteQueueItemInDB(queueItemId);
    await fetchServiceQueues();
    onStatsUpdate();
  } catch (error) {
    console.error('Error deleting queue item:', error);
  }
};

const deleteAllQueueItemsForVisit = async (patientVisitId: string) => {
  try {
    await deleteAllQueueItemsForVisitInDB(patientVisitId);
    await fetchServiceQueues();
    onStatsUpdate();
  } catch (error) {
    console.error('Error deleting all queue items for visit:', error);
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
  deleteQueueItem,
  deleteAllQueueItemsForVisit,
  getFilteredPatients,
  handleStatusFilterChange
};
}