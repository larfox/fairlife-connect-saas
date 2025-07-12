import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserCog, Stethoscope, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceQueueItem {
  id: string;
  service: {
    name: string;
  };
  status: string;
  doctor_id: string | null;
  nurse_id: string | null;
  doctor?: {
    first_name: string;
    last_name: string;
  } | null;
  nurse?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface ServiceAssignmentFormProps {
  currentVisit: any;
  onAssignmentUpdate: () => void;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface Nurse {
  id: string;
  first_name: string;
  last_name: string;
}

export function ServiceAssignmentForm({ currentVisit, onAssignmentUpdate }: ServiceAssignmentFormProps) {
  const [serviceQueueItems, setServiceQueueItems] = useState<ServiceQueueItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (currentVisit) {
      fetchData();
    }
  }, [currentVisit]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch service queue items for this visit
      const { data: queueItems, error: queueError } = await supabase
        .from('service_queue')
        .select(`
          *,
          service:services(name),
          doctor:doctors(first_name, last_name),
          nurse:nurses(first_name, last_name)
        `)
        .eq('patient_visit_id', currentVisit.id);

      if (queueError) throw queueError;

      // Fetch available doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name');

      if (doctorsError) throw doctorsError;

      // Fetch available nurses
      const { data: nursesData, error: nursesError } = await supabase
        .from('nurses')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name');

      if (nursesError) throw nursesError;

      setServiceQueueItems(queueItems || []);
      setDoctors(doctorsData || []);
      setNurses(nursesData || []);
    } catch (error) {
      console.error('Error fetching assignment data:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (queueItemId: string, type: 'doctor' | 'nurse', providerId: string | null) => {
    try {
      const updateData = type === 'doctor' 
        ? { doctor_id: providerId }
        : { nurse_id: providerId };

      const { error } = await supabase
        .from('service_queue')
        .update(updateData)
        .eq('id', queueItemId);

      if (error) throw error;

      toast({
        title: "Assignment updated",
        description: `${type === 'doctor' ? 'Doctor' : 'Nurse'} assignment has been updated.`,
      });

      fetchData();
      onAssignmentUpdate();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Update failed",
        description: "Failed to update assignment.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading assignments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Service Provider Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serviceQueueItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No services assigned to this patient visit.
          </p>
        ) : (
          serviceQueueItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{item.service.name}</h4>
                <Badge variant="outline">{item.status}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Doctor Assignment */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Assigned Doctor
                  </Label>
                  <Select
                    value={item.doctor_id || ''}
                    onValueChange={(value) => updateAssignment(item.id, 'doctor', value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {item.doctor && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Currently: Dr. {item.doctor.first_name} {item.doctor.last_name}
                    </p>
                  )}
                </div>

                {/* Nurse Assignment */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Assigned Nurse
                  </Label>
                  <Select
                    value={item.nurse_id || ''}
                    onValueChange={(value) => updateAssignment(item.id, 'nurse', value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select nurse..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {nurses.map((nurse) => (
                        <SelectItem key={nurse.id} value={nurse.id}>
                          {nurse.first_name} {nurse.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {item.nurse && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Currently: {item.nurse.first_name} {item.nurse.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}