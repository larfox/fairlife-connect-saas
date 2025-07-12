import { useState, useEffect } from "react";
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
  const [knowYourNumbersServiceId, setKnowYourNumbersServiceId] = useState<string>('');
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

  // Auto-select "Know Your Numbers" when services are available
  const initializeServices = async () => {
    try {
      const { data: knowYourNumbersService, error } = await supabase
        .from("services")
        .select("id")
        .ilike("name", "%know your numbers%")
        .single();

      if (!error && knowYourNumbersService) {
        setKnowYourNumbersServiceId(knowYourNumbersService.id);
        setSelectedServices([knowYourNumbersService.id]);
      }
    } catch (error) {
      console.error('Error fetching Know Your Numbers service:', error);
    }
  };

  // Initialize services on mount
  useEffect(() => {
    initializeServices();
  }, []);

  const updatePatientData = (field: string, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    // Prevent deselecting "Know Your Numbers"
    if (serviceId === knowYourNumbersServiceId) {
      return;
    }
    
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

      // Get "Know Your Numbers" service ID
      const { data: knowYourNumbersService, error: serviceError } = await supabase
        .from("services")
        .select("id")
        .ilike("name", "%know your numbers%")
        .single();

      if (serviceError) throw serviceError;

      // Prepare service queue entries - always start with "Know Your Numbers"
      const serviceQueueEntries = [
        {
          patient_visit_id: visit.id,
          service_id: knowYourNumbersService.id,
          queue_position: 1,
          status: 'waiting'
        }
      ];

      // Add other selected services after "Know Your Numbers"
      if (selectedServices.length > 0) {
        const otherServiceEntries = selectedServices
          .filter(serviceId => serviceId !== knowYourNumbersService.id) // Avoid duplicates
          .map((serviceId, index) => ({
            patient_visit_id: visit.id,
            service_id: serviceId,
            queue_position: index + 2, // Start from position 2 since "Know Your Numbers" is position 1
            status: 'waiting'
          }));
        
        serviceQueueEntries.push(...otherServiceEntries);
      }

      const { error: queueError } = await supabase
        .from("service_queue")
        .insert(serviceQueueEntries);

      if (queueError) throw queueError;

      toast({
        title: "Patient registered successfully",
        description: `${patient.first_name} ${patient.last_name} has been assigned queue number ${nextQueueNumber}.`,
      });

      // Reset form
      setPatientData(initialPatientData);
      setSelectedServices([knowYourNumbersServiceId]); // Keep "Know Your Numbers" selected
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
    knowYourNumbersServiceId,
    updatePatientData,
    handleServiceToggle,
    handleRegisterPatient
  };
};