import React, { useState, useEffect } from 'react';
import { useServiceQueue } from '@/hooks/useServiceQueue';
import { ServiceQueueCard } from './ServiceQueueCard';
import PatientDetailsModal from './PatientDetailsModalWithPermissions';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useStaffPermissions, clearPermissionsCache } from '@/hooks/useStaffPermissions';

interface PatientServiceQueueProps {
  selectedEvent: any;
  onStatsUpdate: () => void;
}

export function PatientServiceQueue({ selectedEvent, onStatsUpdate }: PatientServiceQueueProps) {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Ensure fresh permissions on load to reflect latest admin status
        clearPermissionsCache(user.email);
      }
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const { isAdmin } = useStaffPermissions(currentUser);
  
  const {
    serviceQueues,
    loading,
    statusFilters,
    updateServiceStatus,
    deleteQueueItem,
    deleteAllQueueItemsForVisit,
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
          onDeleteAllQueuesForVisit={deleteAllQueueItemsForVisit}
          isAdmin={isAdmin}
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