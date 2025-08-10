import React, { useState } from 'react';
import { useServiceQueue } from '@/hooks/useServiceQueue';
import { ServiceQueueCard } from './ServiceQueueCard';
import PatientDetailsModal from './PatientDetailsModalWithPermissions';

interface PatientServiceQueueProps {
  selectedEvent: any;
  onStatsUpdate: () => void;
}

export function PatientServiceQueue({ selectedEvent, onStatsUpdate }: PatientServiceQueueProps) {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const {
    serviceQueues,
    loading,
    statusFilters,
    updateServiceStatus,
    deleteQueueItem,
    getFilteredPatients,
    handleStatusFilterChange
  } = useServiceQueue(selectedEvent, onStatsUpdate);

  if (loading) {
    return <div className="p-4">Loading patient queues...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Patients are organized by service. "Know Your Numbers" patients are shown first, followed by other services.
      </div>

      {serviceQueues.map((serviceGroup) => (
        <ServiceQueueCard
          key={serviceGroup.service.id}
          serviceGroup={serviceGroup}
          statusFilter={statusFilters[serviceGroup.service.id]}
          onFilterChange={handleStatusFilterChange}
          onViewDetails={setSelectedPatient}
          onUpdateStatus={updateServiceStatus}
          onDeleteQueueItem={deleteQueueItem}
          getFilteredPatients={getFilteredPatients}
        />
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