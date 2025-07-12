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
  getFilteredPatients: (serviceGroup: ServiceGroup) => QueueItem[];
}

export function ServiceQueueCard({
  serviceGroup,
  statusFilter,
  onFilterChange,
  onViewDetails,
  onUpdateStatus,
  getFilteredPatients
}: ServiceQueueCardProps) {
  const filteredPatients = getFilteredPatients(serviceGroup);

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
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}