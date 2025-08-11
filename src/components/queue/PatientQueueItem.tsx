import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

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

interface PatientQueueItemProps {
  patient: QueueItem;
  index: number;
  onViewDetails: (patient: any) => void;
  onUpdateStatus: (queueItemId: string, newStatus: string) => void;
  onDeleteQueueItem?: (queueItemId: string) => void;
  onDeleteAllQueuesForVisit?: (patientVisitId: string) => void;
  isAdmin?: boolean;
}

export function PatientQueueItem({ 
  patient, 
  index, 
  onViewDetails, 
  onUpdateStatus,
  onDeleteQueueItem,
  onDeleteAllQueuesForVisit,
  isAdmin
}: PatientQueueItemProps) {
  const serviceName = (patient.service?.name || '').toLowerCase().trim();
  const isKYN = serviceName.includes('know your numbers') || serviceName.includes('know-your-numbers') || serviceName.includes('kyn');
  console.debug('PatientQueueItem KYN button gates', { serviceName, isKYN, isAdmin, hasDeleteItem: !!onDeleteQueueItem, queueItemId: patient.id });

  const getServiceProviderName = (patient: QueueItem) => {
    if (patient.doctor) {
      return `Dr. ${patient.doctor.first_name} ${patient.doctor.last_name}`;
    } else if (patient.nurse) {
      return `${patient.nurse.first_name} ${patient.nurse.last_name}`;
    }
    return null;
  };

  const getNextAvailableAction = (patient: QueueItem) => {
    if (patient.status === 'waiting') {
      return (
        <Button
          size="sm"
          onClick={() => onUpdateStatus(patient.id, 'in_progress')}
          className="ml-2"
        >
          Start Service
        </Button>
      );
    } else if (patient.status === 'in_progress') {
      return (
        <Button
          size="sm"
          onClick={() => onUpdateStatus(patient.id, 'completed')}
          className="ml-2"
          variant="outline"
        >
          Mark Complete
        </Button>
      );
    }
    return null;
  };

  const getStatusChangeDropdown = (patient: QueueItem) => {
    const hasDeleteAll = Boolean(isAdmin && onDeleteAllQueuesForVisit);
    console.debug('Status dropdown gates', { isKYN, isAdmin, hasDeleteAll, serviceName, queueItemId: patient.id });
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="ml-1 p-1 h-7 w-7"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 bg-popover text-popover-foreground shadow-md">
          {patient.status !== 'waiting' && (
            <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'waiting')}>
              Change to Waiting
            </DropdownMenuItem>
          )}
          {patient.status !== 'in_progress' && (
            <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'in_progress')}>
              Change to In Progress
            </DropdownMenuItem>
          )}
          {patient.status !== 'completed' && (
            <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'completed')}>
              Change to Completed
            </DropdownMenuItem>
          )}
          {patient.status !== 'unavailable' && (
            <DropdownMenuItem onClick={() => onUpdateStatus(patient.id, 'unavailable')}>
              Change to Unavailable
            </DropdownMenuItem>
          )}

          {/* Admin-only delete options for Know Your Numbers */}
          {isKYN && isAdmin && (
            <>
              {onDeleteQueueItem && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive">
                      Delete from this service
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove from this service?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the patient from the Know Your Numbers service queue only.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          onDeleteQueueItem(patient.id);
                          toast({
                            title: 'Removed from this service',
                            description: 'Patient removed from the Know Your Numbers queue.',
                          });
                        }}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {onDeleteAllQueuesForVisit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive">
                      Delete from all queues
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove from all queues?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove the patient from all service queues for this visit. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          onDeleteAllQueuesForVisit(patient.patient_visit_id);
                          toast({
                            title: 'Removed from all queues',
                            description: 'Patient removed from all service queues for this visit.',
                          });
                        }}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div
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
            {getServiceProviderName(patient) && (
              <span className="ml-2 text-primary">
                • {getServiceProviderName(patient)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <StatusBadge status={patient.status} />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(patient.patient_visit.patient)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Details
        </Button>
        
        {getNextAvailableAction(patient)}
        
        {/* Quick delete for KYN (inline) */}
        {isKYN && isAdmin && onDeleteQueueItem && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="ml-1 p-1 h-7"
                aria-label="Remove from Know Your Numbers"
                title="Remove from Know Your Numbers"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from this service?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the patient from the Know Your Numbers service queue only.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDeleteQueueItem(patient.id);
                    toast({
                      title: 'Removed from this service',
                      description: 'Patient removed from the Know Your Numbers queue.',
                    });
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Status correction dropdown */}
        {getStatusChangeDropdown(patient)}
      </div>
    </div>
  );
}