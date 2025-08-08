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
  town_name: string;
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
  const [duplicatePatient, setDuplicatePatient] = useState<any>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState<string>('');
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
    town_name: "",
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

  const checkDuplicatePatient = async () => {
    try {
      const { data: existingPatients, error } = await supabase
        .from("patients")
        .select("*")
        .ilike("first_name", patientData.first_name.trim())
        .ilike("last_name", patientData.last_name.trim())
        .eq("is_active", true);

      if (error) throw error;

      if (existingPatients && existingPatients.length > 0) {
        setDuplicatePatient(existingPatients[0]);
        setShowDuplicateDialog(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking for duplicate patient:", error);
      return false;
    }
  };

  const handleCustomTownSubmit = async (townName: string) => {
    if (!townName.trim() || !patientData.parish_id) return;

    try {
      // Check if town already exists
      const { data: existingTown, error: checkError } = await supabase
        .from("towns")
        .select("id")
        .eq("name", townName.trim())
        .eq("parish_id", patientData.parish_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingTown) {
        // Town exists, update selection
        updatePatientData("town_id", existingTown.id);
        updatePatientData("town_name", "");
        return;
      }

      // Create new town
      const { data: newTown, error: insertError } = await supabase
        .from("towns")
        .insert([{
          name: townName.trim(),
          parish_id: patientData.parish_id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update selection to new town
      updatePatientData("town_id", newTown.id);
      updatePatientData("town_name", "");

      toast({
        title: "Town added",
        description: `${townName} has been added to the system.`,
      });
    } catch (error) {
      console.error("Error adding custom town:", error);
      toast({
        title: "Error",
        description: "Failed to add custom town. Please try again.",
        variant: "destructive",
      });
    }
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

    // Check for duplicate patient only if not in update mode
    if (!isUpdateMode) {
      const isDuplicate = await checkDuplicatePatient();
      if (isDuplicate) {
        return;
      }
    }

    setLoading(true);
    try {
      // Handle custom town if present
      if (patientData.town_name && !patientData.town_id && patientData.parish_id) {
        await handleCustomTownSubmit(patientData.town_name);
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      let patient;
      
      if (isUpdateMode && existingPatientId) {
        // Update existing patient record
        const { data: updatedPatient, error: updateError } = await supabase
          .from("patients")
          .update({
            ...patientData,
            parish_id: patientData.parish_id || null,
            town_id: patientData.town_id || null,
            town_name: null, // Always clear custom town name after processing
          })
          .eq("id", existingPatientId)
          .select()
          .single();

        if (updateError) throw updateError;
        patient = updatedPatient;
      } else {
        // Create new patient record
        const { data: newPatient, error: patientError } = await supabase
          .from("patients")
          .insert([{
            ...patientData,
            parish_id: patientData.parish_id || null,
            town_id: patientData.town_id || null,
            town_name: null, // Always clear custom town name after processing
            event_id: selectedEvent.id
          }])
          .select()
          .single();

        if (patientError) throw patientError;
        patient = newPatient;
      }

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
        title: isUpdateMode ? "Patient updated and registered successfully" : "Patient registered successfully",
        description: `${patient.first_name} ${patient.last_name} has been assigned queue number ${nextQueueNumber}.`,
      });

      // Reset form
      setPatientData(initialPatientData);
      setSelectedServices([knowYourNumbersServiceId]); // Keep "Know Your Numbers" selected
      setIsUpdateMode(false);
      setExistingPatientId('');
      setDuplicatePatient(null);
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

  const handleUpdateExistingPatient = () => {
    if (duplicatePatient) {
      // Pre-populate form with existing patient data
      setPatientData({
        first_name: duplicatePatient.first_name || "",
        last_name: duplicatePatient.last_name || "",
        date_of_birth: duplicatePatient.date_of_birth || "",
        gender: duplicatePatient.gender || "",
        phone: duplicatePatient.phone || "",
        email: duplicatePatient.email || "",
        parish_id: duplicatePatient.parish_id || "",
        town_id: duplicatePatient.town_id || "",
        town_name: duplicatePatient.town_name || "",
        emergency_contact_name: duplicatePatient.emergency_contact_name || "",
        emergency_contact_phone: duplicatePatient.emergency_contact_phone || "",
        medical_conditions: duplicatePatient.medical_conditions || "",
        allergies: duplicatePatient.allergies || "",
        medications: duplicatePatient.medications || "",
        insurance_provider: duplicatePatient.insurance_provider || "",
        insurance_number: duplicatePatient.insurance_number || ""
      });
      setExistingPatientId(duplicatePatient.id);
      setIsUpdateMode(true);
    }
    setShowDuplicateDialog(false);
  };

  const handleContinueRegistration = async () => {
    setShowDuplicateDialog(false);
    setDuplicatePatient(null);
    
    setLoading(true);
    try {
      // Handle custom town if present
      if (patientData.town_name && !patientData.town_id && patientData.parish_id) {
        await handleCustomTownSubmit(patientData.town_name);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert([{
          ...patientData,
          parish_id: patientData.parish_id || null,
          town_id: patientData.town_id || null,
          town_name: null,
          event_id: selectedEvent.id
        }])
        .select()
        .single();

      if (patientError) throw patientError;

      // Continue with visit and queue creation...
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

      // Prepare service queue entries
      const serviceQueueEntries = [
        {
          patient_visit_id: visit.id,
          service_id: knowYourNumbersService.id,
          queue_position: 1,
          status: 'waiting'
        }
      ];

      if (selectedServices.length > 0) {
        const otherServiceEntries = selectedServices
          .filter(serviceId => serviceId !== knowYourNumbersService.id)
          .map((serviceId, index) => ({
            patient_visit_id: visit.id,
            service_id: serviceId,
            queue_position: index + 2,
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
      setSelectedServices([knowYourNumbersServiceId]);
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
    duplicatePatient,
    showDuplicateDialog,
    isUpdateMode,
    updatePatientData,
    handleServiceToggle,
    handleRegisterPatient,
    handleUpdateExistingPatient,
    handleContinueRegistration,
    setShowDuplicateDialog
  };
};