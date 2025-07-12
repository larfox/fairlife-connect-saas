import { useState, useEffect } from 'react';
import { ServiceGroup } from '@/types/serviceQueue';
import { fetchServiceQueuesData, updateServiceStatusInDB } from '@/services/serviceQueueService';

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
    try {
      await updateServiceStatusInDB(queueItemId, newStatus);
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