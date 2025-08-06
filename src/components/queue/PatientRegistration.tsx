import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { PatientBasicInfoForm } from "./forms/PatientBasicInfoForm";
import { PatientMedicalInfoForm } from "./forms/PatientMedicalInfoForm";
import { ServiceSelectionForm } from "./forms/ServiceSelectionForm";
import { usePatientRegistration } from "@/hooks/usePatientRegistration";
import AutocompletePatientSearch from "./AutocompletePatientSearch";
import { DuplicatePatientDialog } from "./DuplicatePatientDialog";

interface PatientRegistrationProps {
  selectedEvent: any;
  onRegistrationComplete: () => void;
}

type Service = Tables<"services">;
type Parish = Tables<"parishes">;

const PatientRegistration = ({ selectedEvent, onRegistrationComplete }: PatientRegistrationProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const { toast } = useToast();

  const {
    patientData,
    selectedServices,
    loading,
    knowYourNumbersServiceId,
    duplicatePatient,
    showDuplicateDialog,
    updatePatientData,
    handleServiceToggle,
    handleRegisterPatient,
    handleUpdateExistingPatient,
    handleContinueRegistration,
    setShowDuplicateDialog
  } = usePatientRegistration(selectedEvent, onRegistrationComplete);

  useEffect(() => {
    fetchServices();
    fetchParishes();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast({
        title: "Error fetching services",
        description: "Failed to load available services.",
        variant: "destructive",
      });
    }
  };

  const fetchParishes = async () => {
    try {
      const { data, error } = await supabase
        .from("parishes")
        .select("*")
        .order("name");

      if (error) throw error;
      setParishes(data || []);
    } catch (error) {
      toast({
        title: "Error fetching parishes",
        description: "Failed to load parishes.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="space-y-6">
      <AutocompletePatientSearch selectedEvent={selectedEvent} />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PatientBasicInfoForm
            patientData={patientData}
            parishes={parishes}
            onChange={updatePatientData}
          />

          <Separator />

          <PatientMedicalInfoForm
            patientData={patientData}
            onChange={updatePatientData}
          />

          <Separator />

          <ServiceSelectionForm
            services={services}
            selectedServices={selectedServices}
            onServiceToggle={handleServiceToggle}
            knowYourNumbersServiceId={knowYourNumbersServiceId}
            patientGender={patientData.gender}
          />

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleRegisterPatient} 
              disabled={loading}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {loading ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DuplicatePatientDialog
        isOpen={showDuplicateDialog}
        duplicatePatient={duplicatePatient}
        onClose={() => setShowDuplicateDialog(false)}
        onUpdateExisting={handleUpdateExistingPatient}
        onContinueRegistration={handleContinueRegistration}
      />
    </div>
  );
};

export default PatientRegistration;