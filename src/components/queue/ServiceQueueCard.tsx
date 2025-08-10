import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceStatusFilter } from './ServiceStatusFilter';
import { PatientQueueItem } from './PatientQueueItem';

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

interface ServiceQueueCardProps {
  serviceGroup: ServiceGroup;
  statusFilter: string;
  onFilterChange: (serviceId: string, status: string) => void;
  onViewDetails: (patient: any) => void;
  onUpdateStatus: (queueItemId: string, newStatus: string) => void;
  onDeleteQueueItem: (queueItemId: string) => void;
  onDeleteAllQueuesForVisit: (patientVisitId: string) => void;
  isAdmin: boolean;
  getFilteredPatients: (serviceGroup: ServiceGroup) => QueueItem[];
}

export function ServiceQueueCard({
  serviceGroup,
  statusFilter,
  onFilterChange,
  onViewDetails,
  onUpdateStatus,
  onDeleteQueueItem,
  onDeleteAllQueuesForVisit,
  isAdmin,
  getFilteredPatients
}: ServiceQueueCardProps) {
  const filteredPatients = getFilteredPatients(serviceGroup);
  
  // Calculate service summary statistics
  const totalRegistered = serviceGroup.patients.length;
  const waitingCount = serviceGroup.patients.filter(p => p.status === 'waiting').length;
  const inProgressCount = serviceGroup.patients.filter(p => p.status === 'in_progress').length;
  const completedCount = serviceGroup.patients.filter(p => p.status === 'completed').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{serviceGroup.service.name}</span>
          <ServiceStatusFilter
            serviceId={serviceGroup.service.id}
            currentFilter={statusFilter}
            patientCount={filteredPatients.length}
            onFilterChange={onFilterChange}
          />
        </CardTitle>
        {serviceGroup.service.description && (
          <p className="text-sm text-muted-foreground">{serviceGroup.service.description}</p>
        )}
        
        {/* Service Summary */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
            <div className="font-semibold text-blue-700 dark:text-blue-300">{totalRegistered}</div>
            <div className="text-blue-600 dark:text-blue-400">Total</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
            <div className="font-semibold text-yellow-700 dark:text-yellow-300">{waitingCount}</div>
            <div className="text-yellow-600 dark:text-yellow-400">Waiting</div>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
            <div className="font-semibold text-orange-700 dark:text-orange-300">{inProgressCount}</div>
            <div className="text-orange-600 dark:text-orange-400">In Progress</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
            <div className="font-semibold text-green-700 dark:text-green-300">{completedCount}</div>
            <div className="text-green-600 dark:text-green-400">Completed</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPatients.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No patients in this service queue</p>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((patient, index) => (
              <PatientQueueItem
                key={patient.id}
                patient={patient}
                index={index}
                onViewDetails={onViewDetails}
                onUpdateStatus={onUpdateStatus}
                onDeleteQueueItem={onDeleteQueueItem}
                onDeleteAllQueuesForVisit={onDeleteAllQueuesForVisit}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}