import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  parish_id: string;
  town_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string;
  allergies: string;
  medications: string;
  insurance_provider: string;
  insurance_number: string;
}

export const usePatientRegistration = (selectedEvent: any, onRegistrationComplete: () => void) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initialPatientData: PatientData = {
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    email: "",
    parish_id: "",
    town_id: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    allergies: "",
    medications: "",
    insurance_provider: "",
    insurance_number: ""
  };

  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const updatePatientData = (field: string, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleRegisterPatient = async () => {
    if (!patientData.first_name || !patientData.last_name) {
      toast({
        title: "Missing information",
        description: "Please provide at least first and last name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert([{
          ...patientData,
          parish_id: patientData.parish_id || null,
          town_id: patientData.town_id || null,
          event_id: selectedEvent.id
        }])
        .select()
        .single();

      if (patientError) throw patientError;

      // Get next queue number
      const { data: existingVisits, error: visitsError } = await supabase
        .from("patient_visits")
        .select("queue_number")
        .eq("event_id", selectedEvent.id)
        .order("queue_number", { ascending: false })
        .limit(1);

      if (visitsError) throw visitsError;

      const nextQueueNumber = (existingVisits?.[0]?.queue_number || 0) + 1;

      // Create patient visit record
      const { data: visit, error: visitError } = await supabase
        .from("patient_visits")
        .insert([{
          patient_id: patient.id,
          event_id: selectedEvent.id,
          queue_number: nextQueueNumber,
          status: 'checked_in'
        }])
        .select()
        .single();

      if (visitError) throw visitError;

      // Add selected services to queue
      if (selectedServices.length > 0) {
        const serviceQueueEntries = selectedServices.map((serviceId, index) => ({
          patient_visit_id: visit.id,
          service_id: serviceId,
          queue_position: index + 1,
          status: 'waiting'
        }));

        const { error: serviceError } = await supabase
          .from("service_queue")
          .insert(serviceQueueEntries);

        if (serviceError) throw serviceError;
      }

      toast({
        title: "Patient registered successfully",
        description: `${patient.first_name} ${patient.last_name} has been assigned queue number ${nextQueueNumber}.`,
      });

      // Reset form
      setPatientData(initialPatientData);
      setSelectedServices([]);
      onRegistrationComplete();

    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    patientData,
    selectedServices,
    loading,
    updatePatientData,
    handleServiceToggle,
    handleRegisterPatient
  };
};