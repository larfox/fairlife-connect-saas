import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  AlertTriangle, 
  Heart, 
  FileText, 
  Calendar,
  Activity,
  Save,
  Clock,
  UserCog,
  Pill,
  Zap,
  Eye,
  Smile,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";



interface PatientDetailsModalProps {
  patient: any;
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PatientDetailsModal = ({ patient, eventId, isOpen, onClose }: PatientDetailsModalProps) => {
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [currentVisit, setCurrentVisit] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [prognosis, setPrognosis] = useState<any>(null);
  const [basicScreening, setBasicScreening] = useState<any>(null);
  const [screeningData, setScreeningData] = useState({
    weight: "",
    height: "",
    blood_sugar: "",
    heart_rate: "",
    oxygen_saturation: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    cholesterol: "",
    notes: ""
  });
  const [newComplaint, setNewComplaint] = useState({ text: "", severity: "mild" });
  const [prognosisData, setPrognosisData] = useState({
    diagnosis: "",
    treatment_plan: "",
    follow_up_required: false,
    follow_up_notes: ""
  });
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [newPrescription, setNewPrescription] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
  });
  const [ecgResults, setEcgResults] = useState<any[]>([]);
  const [newEcgResult, setNewEcgResult] = useState({
    result: "",
    interpretation: "",
    notes: ""
  });
  const [immunizations, setImmunizations] = useState<any[]>([]);
  const [newImmunization, setNewImmunization] = useState({
    vaccine_name: "",
    dose_number: "",
    vaccine_date: "",
    lot_number: "",
    expiration_date: "",
    site_of_injection: "",
    notes: ""
  });
  
  // Health professionals and assignments
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [availableNurses, setAvailableNurses] = useState<any[]>([]);
  const [healthProfessionalAssignments, setHealthProfessionalAssignments] = useState({
    screening_nurse: "",
    complaints_professional: "",
    prognosis_doctor: "",
    prescriptions_doctor: "",
    ecg_doctor: "",
    optician: "",
    dental_professional: "",
    immunizations_administrator: ""
  });
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && patient) {
      fetchAvailableHealthProfessionals();
      fetchPatientData();
    }
  }, [isOpen, patient, eventId]);

  // Reset screening data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setScreeningData({
        weight: "",
        height: "",
        blood_sugar: "",
        heart_rate: "",
        oxygen_saturation: "",
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        cholesterol: "",
        notes: ""
      });
    }
  }, [isOpen]);

  const fetchAvailableHealthProfessionals = async () => {
    try {
      console.log("Fetching health professionals for eventId:", eventId);
      
      // Fetch doctors assigned to this event
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('event_doctors')
        .select(`
          doctors!inner(
            id,
            first_name,
            last_name,
            is_active
          )
        `)
        .eq('event_id', eventId)
        .eq('doctors.is_active', true);

      console.log("Doctors data:", doctorsData, "Error:", doctorsError);

      if (doctorsError) throw doctorsError;

      // Fetch nurses assigned to this event
      const { data: nursesData, error: nursesError } = await supabase
        .from('event_nurses')
        .select(`
          nurses!inner(
            id,
            first_name,
            last_name,
            is_active
          )
        `)
        .eq('event_id', eventId)
        .eq('nurses.is_active', true);

      console.log("Nurses data:", nursesData, "Error:", nursesError);

      if (nursesError) throw nursesError;

      // Extract doctors and nurses from the relationship data
      const assignedDoctors = doctorsData?.map(ed => ed.doctors).filter(Boolean) || [];
      const assignedNurses = nursesData?.map(en => en.nurses).filter(Boolean) || [];
      
      console.log("Assigned doctors:", assignedDoctors);
      console.log("Assigned nurses:", assignedNurses);
      
      setAvailableDoctors(assignedDoctors);
      setAvailableNurses(assignedNurses);
    } catch (error) {
      console.error("Error fetching health professionals:", error);
    }
  };

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Fetch visit history with service details
      const { data: visits, error: visitsError } = await supabase
        .from("patient_visits")
        .select(`
          *,
          events (name, event_date),
          service_queue (
            *,
            services (name),
            doctors (first_name, last_name),
            nurses (first_name, last_name)
          ),
          basic_screening (
            bmi,
            blood_pressure_systolic,
            blood_pressure_diastolic,
            notes
          ),
          patient_complaints (
            complaint_text,
            severity
          ),
          patient_prognosis (
            diagnosis,
            treatment_plan,
            doctors (first_name, last_name)
          )
        `)
        .eq("patient_id", patient.id)
        .order("visit_date", { ascending: false });

      if (visitsError) throw visitsError;
      setVisitHistory(visits || []);

      // Find current visit for this event
      const currentEventVisit = visits?.find(visit => visit.event_id === eventId);
      setCurrentVisit(currentEventVisit);

      if (currentEventVisit) {
        // Fetch complaints for current visit
        const { data: complaintsData, error: complaintsError } = await supabase
          .from("patient_complaints")
          .select("*")
          .eq("patient_visit_id", currentEventVisit.id)
          .order("created_at", { ascending: false });

        if (complaintsError) throw complaintsError;
        setComplaints(complaintsData || []);

        // Fetch prognosis for current visit
        const { data: prognosisData, error: prognosisError } = await supabase
          .from("patient_prognosis")
          .select(`
            *,
            doctors (first_name, last_name)
          `)
          .eq("patient_visit_id", currentEventVisit.id)
          .single();

        if (prognosisError && prognosisError.code !== 'PGRST116') {
          throw prognosisError;
        }
        
        if (prognosisData) {
          setPrognosis(prognosisData);
          setPrognosisData({
            diagnosis: prognosisData.diagnosis || "",
            treatment_plan: prognosisData.treatment_plan || "",
            follow_up_required: prognosisData.follow_up_required || false,
            follow_up_notes: prognosisData.follow_up_notes || ""
          });
          
          // Update health professional assignments
          setHealthProfessionalAssignments(prev => ({
            ...prev,
            prognosis_doctor: prognosisData.doctor_id || ""
          }));
        }

        // Fetch basic screening for current visit (get the latest one)
        const { data: screeningData, error: screeningError } = await supabase
          .from("basic_screening")
          .select(`
            *,
            nurses (first_name, last_name)
          `)
          .eq("patient_visit_id", currentEventVisit.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (screeningError) {
          throw screeningError;
        }
        
        setBasicScreening(screeningData);
        
        // Update health professional assignments for screening
        if (screeningData?.screened_by) {
          setHealthProfessionalAssignments(prev => ({
            ...prev,
            screening_nurse: screeningData.screened_by
          }));
        }
        
        // Populate screening form if data exists
        if (screeningData) {
          // Extract user notes from saved notes (remove auto-generated parts)
          let userNotes = screeningData.notes || "";
          if (userNotes.includes("Additional Notes: ")) {
            userNotes = userNotes.split("Additional Notes: ")[1] || "";
          } else if (userNotes.includes(".") && (userNotes.includes("Blood Pressure:") || userNotes.includes("BMI:"))) {
            // If notes only contain auto-generated content, clear them for editing
            userNotes = "";
          }
          
          setScreeningData({
            weight: screeningData.weight?.toString() || "",
            height: screeningData.height?.toString() || "",
            blood_sugar: screeningData.blood_sugar?.toString() || "",
            heart_rate: screeningData.heart_rate?.toString() || "",
            oxygen_saturation: (screeningData as any).oxygen_saturation?.toString() || "",
            blood_pressure_systolic: screeningData.blood_pressure_systolic?.toString() || "",
            blood_pressure_diastolic: screeningData.blood_pressure_diastolic?.toString() || "",
            cholesterol: (screeningData as any).cholesterol?.toString() || "",
            notes: userNotes
          });
        }

        // Fetch immunizations for current visit
        const { data: immunizationsData, error: immunizationsError } = await supabase
          .from("immunizations")
          .select(`
            *,
            doctors (first_name, last_name)
          `)
          .eq("patient_visit_id", currentEventVisit.id)
          .order("created_at", { ascending: false });

        if (immunizationsError) {
          console.error("Error fetching immunizations:", immunizationsError);
        } else {
          setImmunizations(immunizationsData || []);
        }

        // Fetch ECG results for current visit
        const { data: ecgData, error: ecgError } = await supabase
          .from("ecg_results")
          .select(`
            *,
            doctors (first_name, last_name)
          `)
          .eq("patient_visit_id", currentEventVisit.id)
          .order("created_at", { ascending: false });

        if (ecgError) {
          console.error("Error fetching ECG results:", ecgError);
        } else {
          setEcgResults(ecgData || []);
        }

        // Fetch prescriptions for current visit
        const { data: prescriptionsData, error: prescriptionsError } = await supabase
          .from("prescriptions")
          .select(`
            *,
            doctors (first_name, last_name)
          `)
          .eq("patient_visit_id", currentEventVisit.id)
          .order("created_at", { ascending: false });

        if (prescriptionsError) {
          console.error("Error fetching prescriptions:", prescriptionsError);
        } else {
          setPrescriptions(prescriptionsData || []);
        }
      }

    } catch (error) {
      toast({
        title: "Error loading patient data",
        description: "Failed to load patient information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveComplaint = async () => {
    if (!newComplaint.text.trim() || !currentVisit) return;

    try {
      const { error } = await supabase
        .from("patient_complaints")
        .insert([{
          patient_visit_id: currentVisit.id,
          complaint_text: newComplaint.text,
          severity: newComplaint.severity
        }]);

      if (error) throw error;

      toast({
        title: "Complaint saved",
        description: "Patient complaint has been recorded.",
      });

      setNewComplaint({ text: "", severity: "mild" });
      fetchPatientData();
    } catch (error) {
      console.error("Error saving complaint:", error);
      toast({
        title: "Save failed",
        description: `Failed to save complaint: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  const saveScreening = async () => {
    if (!currentVisit) return;

    try {
      const bmi = calculateBMI(screeningData.weight, screeningData.height);
      const autoNotes = generateAutoNotes();
      
      // Combine user notes with automatic assessment
      let finalNotes = screeningData.notes || "";
      if (autoNotes) {
        finalNotes = finalNotes 
          ? `${autoNotes}\n\nAdditional Notes: ${finalNotes}`
          : autoNotes;
      }
      
      const screeningPayload = {
        patient_visit_id: currentVisit.id,
        weight: screeningData.weight ? parseFloat(screeningData.weight) : null,
        height: screeningData.height ? parseFloat(screeningData.height) : null,
        bmi: bmi,
        blood_sugar: screeningData.blood_sugar ? parseInt(screeningData.blood_sugar) : null,
        heart_rate: screeningData.heart_rate ? parseInt(screeningData.heart_rate) : null,
        oxygen_saturation: screeningData.oxygen_saturation ? parseInt(screeningData.oxygen_saturation) : null,
        blood_pressure_systolic: screeningData.blood_pressure_systolic ? parseInt(screeningData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: screeningData.blood_pressure_diastolic ? parseInt(screeningData.blood_pressure_diastolic) : null,
        cholesterol: screeningData.cholesterol ? parseInt(screeningData.cholesterol) : null,
        notes: finalNotes || null
      };

      // Delete existing screening records for this visit to prevent duplicates
      await supabase
        .from("basic_screening")
        .delete()
        .eq("patient_visit_id", currentVisit.id);

      // Insert the new screening record
      const { error } = await supabase
        .from("basic_screening")
        .insert([screeningPayload]);

      if (error) throw error;

      // Send email summary if patient has an email
      if (patient.email) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-screening-summary', {
            body: {
              patientEmail: patient.email,
              patientName: `${patient.first_name} ${patient.last_name}`,
              screeningData: {
                weight: screeningPayload.weight,
                height: screeningPayload.height,
                bmi: screeningPayload.bmi,
                blood_pressure_systolic: screeningPayload.blood_pressure_systolic,
                blood_pressure_diastolic: screeningPayload.blood_pressure_diastolic,
                heart_rate: screeningPayload.heart_rate,
                temperature: null, // Not in current form but included in email template
                oxygen_saturation: screeningPayload.oxygen_saturation,
                blood_sugar: screeningPayload.blood_sugar,
                notes: finalNotes
              },
              eventName: currentVisit.events?.name
            }
          });

          if (emailError) {
            console.error("Error sending email:", emailError);
            toast({
              title: "Warning",
              description: "Screening data saved but email could not be sent",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Success",
              description: "Screening data saved and email summary sent to patient",
            });
          }
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          toast({
            title: "Warning", 
            description: "Screening data saved but email could not be sent",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Screening saved",
          description: "Patient screening data has been updated.",
        });
      }

      fetchPatientData();
    } catch (error) {
      console.error("Error saving screening data:", error);
      toast({
        title: "Save failed",
        description: `Failed to save screening data: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  const savePrognosis = async () => {
    if (!currentVisit) return;

    try {
      const { error } = await supabase
        .from("patient_prognosis")
        .upsert([{
          patient_visit_id: currentVisit.id,
          diagnosis: prognosisData.diagnosis,
          treatment_plan: prognosisData.treatment_plan,
          follow_up_required: prognosisData.follow_up_required,
          follow_up_notes: prognosisData.follow_up_notes
        }]);

      if (error) throw error;

      toast({
        title: "Prognosis saved",
        description: "Patient prognosis has been updated.",
      });

      fetchPatientData();
    } catch (error) {
      console.error("Error saving prognosis:", error);
      toast({
        title: "Save failed",
        description: `Failed to save prognosis: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  const saveImmunization = async () => {
    if (!newImmunization.vaccine_name.trim() || !currentVisit) return;

    try {
      const immunizationData = {
        patient_visit_id: currentVisit.id,
        vaccine_name: newImmunization.vaccine_name,
        dose_number: newImmunization.dose_number ? parseInt(newImmunization.dose_number) : null,
        vaccine_date: newImmunization.vaccine_date || null,
        lot_number: newImmunization.lot_number || null,
        expiration_date: newImmunization.expiration_date || null,
        site_of_injection: newImmunization.site_of_injection || null,
        notes: newImmunization.notes || null,
        administered_by: healthProfessionalAssignments.immunizations_administrator || null
      };

      const { error } = await supabase
        .from("immunizations")
        .insert([immunizationData]);

      if (error) throw error;

      toast({
        title: "Immunization recorded",
        description: "Immunization has been successfully recorded.",
      });

      setNewImmunization({
        vaccine_name: "",
        dose_number: "",
        vaccine_date: "",
        lot_number: "",
        expiration_date: "",
        site_of_injection: "",
        notes: ""
      });

      fetchPatientData();
    } catch (error) {
      console.error("Error saving immunization:", error);
      toast({
        title: "Save failed",
        description: `Failed to save immunization: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate BMI from weight (lbs) and height (ft)
  const calculateBMI = (weightLbs: string, heightFt: string) => {
    if (!weightLbs || !heightFt) return null;
    const weight = parseFloat(weightLbs);
    const height = parseFloat(heightFt);
    if (weight <= 0 || height <= 0) return null;
    
    // Convert pounds to kg and feet to meters
    const weightKg = weight / 2.205;
    const heightM = height * 0.3048;
    
    // BMI = weight(kg) / height(m)^2
    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
  };

  // Determine blood pressure status
  const getBloodPressureStatus = (systolic: string, diastolic: string) => {
    if (!systolic || !diastolic) return "";
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    
    if (sys < 90 || dia < 60) return "Blood Pressure: Low";
    if (sys >= 180 || dia >= 120) return "Blood Pressure: High (Crisis)";
    if (sys >= 140 || dia >= 90) return "Blood Pressure: High";
    if (sys >= 130 || dia >= 80) return "Blood Pressure: Elevated";
    return "Blood Pressure: In Range";
  };

  // Determine BMI status
  const getBMIStatus = (bmi: number | null) => {
    if (!bmi) return "";
    
    if (bmi < 18.5) return "BMI: Underweight";
    if (bmi >= 30) return "BMI: Obese";
    if (bmi >= 25) return "BMI: Overweight";
    return "BMI: Normal Weight";
  };

  // Generate automatic notes based on readings
  const generateAutoNotes = () => {
    const bpStatus = getBloodPressureStatus(screeningData.blood_pressure_systolic, screeningData.blood_pressure_diastolic);
    const bmiStatus = getBMIStatus(currentBMI);
    
    const autoNotes = [bpStatus, bmiStatus].filter(note => note).join(". ");
    return autoNotes ? autoNotes + "." : "";
  };

  const currentBMI = calculateBMI(screeningData.weight, screeningData.height);

  // Update health professional assignment
  const updateHealthProfessionalAssignment = async (field: string, professionalId: string) => {
    if (!currentVisit) return;

    try {
      let updateQuery;
      let tableName;
      
      switch (field) {
        case 'screening_nurse':
          updateQuery = supabase
            .from('basic_screening')
            .update({ screened_by: professionalId || null })
            .eq('patient_visit_id', currentVisit.id);
          break;
        case 'prognosis_doctor':
          updateQuery = supabase
            .from('patient_prognosis')
            .update({ doctor_id: professionalId || null })
            .eq('patient_visit_id', currentVisit.id);
          break;
        case 'complaints_professional':
          // For complaints, we'll update the latest complaint
          const { data: latestComplaint } = await supabase
            .from('patient_complaints')
            .select('id')
            .eq('patient_visit_id', currentVisit.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (latestComplaint && latestComplaint.length > 0) {
            updateQuery = supabase
              .from('patient_complaints')
              .update({ assigned_professional_id: professionalId || null })
              .eq('id', latestComplaint[0].id);
          }
          break;
        default:
          // For new tables, we'll implement upsert logic later
          setHealthProfessionalAssignments(prev => ({
            ...prev,
            [field]: professionalId
          }));
          toast({
            title: "Assignment updated",
            description: "Health professional assignment has been updated.",
          });
          return;
      }
      
      if (updateQuery) {
        const { error } = await updateQuery;
        if (error) throw error;
      }

      setHealthProfessionalAssignments(prev => ({
        ...prev,
        [field]: professionalId
      }));

      toast({
        title: "Assignment updated",
        description: "Health professional assignment has been updated.",
      });

    } catch (error) {
      console.error("Error updating health professional assignment:", error);
      toast({
        title: "Update failed",
        description: "Failed to update health professional assignment.",
        variant: "destructive",
      });
    }
  };

  // Health Professional Selector Component
  const HealthProfessionalSelector = ({ 
    field, 
    label, 
    type = 'doctor' 
  }: { 
    field: string; 
    label: string; 
    type?: 'doctor' | 'nurse' | 'both' 
  }) => {
    const professionals = type === 'nurse' 
      ? availableNurses 
      : type === 'doctor' 
        ? availableDoctors 
        : [...availableDoctors, ...availableNurses];
    
    const currentValue = healthProfessionalAssignments[field as keyof typeof healthProfessionalAssignments] || '';
    
    return (
      <div className="mt-4 pt-3 border-t">
        <Label className="text-sm font-medium text-muted-foreground">{label}:</Label>
        <Select
          value={currentValue}
          onValueChange={(value) => updateHealthProfessionalAssignment(field, value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select professional..." />
          </SelectTrigger>
          <SelectContent>
            {type === 'nurse' && availableNurses.map((nurse) => (
              <SelectItem key={nurse.id} value={nurse.id}>
                {nurse.first_name} {nurse.last_name} (Nurse)
              </SelectItem>
            ))}
            {type === 'doctor' && availableDoctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                Dr. {doctor.first_name} {doctor.last_name}
              </SelectItem>
            ))}
            {type === 'both' && [
              ...availableNurses.map((nurse) => (
                <SelectItem key={`nurse-${nurse.id}`} value={nurse.id}>
                  {nurse.first_name} {nurse.last_name} (Nurse)
                </SelectItem>
              )),
              ...availableDoctors.map((doctor) => (
                <SelectItem key={`doctor-${doctor.id}`} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                </SelectItem>
              ))
            ]}
          </SelectContent>
        </Select>
      </div>
    );
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-lg font-medium">Loading patient data...</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {patient.first_name} {patient.last_name}
            <Badge variant="outline">{patient.patient_number}</Badge>
            {currentVisit && (
              <Badge variant="default">Queue #{currentVisit.queue_number}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="screening">Screening</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="prognosis">Prognosis</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="ecg">ECG Results</TabsTrigger>
              <TabsTrigger value="optician">Optician</TabsTrigger>
              <TabsTrigger value="dental">Dental</TabsTrigger>
              <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Name:</strong> {patient.first_name} {patient.last_name}
                    </div>
                    <div>
                      <strong>Patient Number:</strong> {patient.patient_number}
                    </div>
                    {patient.date_of_birth && (
                      <div>
                        <strong>Date of Birth:</strong> {new Date(patient.date_of_birth).toLocaleDateString()}
                      </div>
                    )}
                    {patient.phone && (
                      <div>
                        <strong>Phone:</strong> {patient.phone}
                      </div>
                    )}
                    {patient.email && (
                      <div>
                        <strong>Email:</strong> {patient.email}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Medical Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {patient.allergies && (
                      <div>
                        <Badge variant="destructive" className="mb-2">Allergies</Badge>
                        <p className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                          {patient.allergies}
                        </p>
                      </div>
                    )}
                    {patient.medical_conditions && (
                      <div>
                        <Badge variant="outline" className="mb-2">Medical Conditions</Badge>
                        <p className="text-sm bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
                          {patient.medical_conditions}
                        </p>
                      </div>
                    )}
                    {patient.medications && (
                      <div>
                        <Badge variant="outline" className="mb-2">Current Medications</Badge>
                        <p className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">
                          {patient.medications}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="screening" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Basic Screening - "Know Your Numbers"
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentVisit && (
                    <div className="space-y-4">
                      {/* Patient Age Display */}
                      {patient.date_of_birth && (
                        <div className="p-3 bg-muted rounded-lg">
                          <Label className="text-sm font-medium">Patient Age</Label>
                          <p className="text-lg font-semibold">{calculateAge(patient.date_of_birth)} years old</p>
                          <p className="text-sm text-muted-foreground">
                            Born: {new Date(patient.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Screening Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="weight">Weight (lbs)</Label>
                          <Input
                            id="weight"
                            type="number"
                            placeholder="Enter weight in pounds"
                            value={screeningData.weight}
                            onChange={(e) => setScreeningData({...screeningData, weight: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="height">Height (ft)</Label>
                          <Input
                            id="height"
                            type="number"
                            step="0.1"
                            placeholder="Enter height in feet"
                            value={screeningData.height}
                            onChange={(e) => setScreeningData({...screeningData, height: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="blood_sugar">GMR (Blood Sugar Reading)</Label>
                          <Input
                            id="blood_sugar"
                            type="number"
                            placeholder="Enter blood sugar reading"
                            value={screeningData.blood_sugar}
                            onChange={(e) => setScreeningData({...screeningData, blood_sugar: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="heart_rate">Pulse (bpm)</Label>
                          <Input
                            id="heart_rate"
                            type="number"
                            placeholder="Enter pulse rate"
                            value={screeningData.heart_rate}
                            onChange={(e) => setScreeningData({...screeningData, heart_rate: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="oxygen_saturation">Oxygen (%)</Label>
                          <Input
                            id="oxygen_saturation"
                            type="number"
                            placeholder="Enter oxygen saturation"
                            value={screeningData.oxygen_saturation}
                            onChange={(e) => setScreeningData({...screeningData, oxygen_saturation: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="blood_pressure">Blood Pressure</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Systolic"
                              value={screeningData.blood_pressure_systolic}
                              onChange={(e) => setScreeningData({...screeningData, blood_pressure_systolic: e.target.value})}
                            />
                            <span className="self-center">/</span>
                            <Input
                              type="number"
                              placeholder="Diastolic"
                              value={screeningData.blood_pressure_diastolic}
                              onChange={(e) => setScreeningData({...screeningData, blood_pressure_diastolic: e.target.value})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="cholesterol">Cholesterol (mg/dL)</Label>
                          <Input
                            id="cholesterol"
                            type="number"
                            placeholder="Enter cholesterol level"
                            value={screeningData.cholesterol}
                            onChange={(e) => setScreeningData({...screeningData, cholesterol: e.target.value})}
                          />
                        </div>

                        {/* BMI Display */}
                        <div>
                          <Label>BMI (Calculated)</Label>
                          <div className="p-2 bg-muted rounded border">
                            {currentBMI ? (
                              <span className="text-lg font-semibold">{currentBMI}</span>
                            ) : (
                              <span className="text-muted-foreground">Enter weight and height</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="screening_notes">Notes</Label>
                        <div className="space-y-2">
                          {/* Auto-generated comments */}
                          {generateAutoNotes() && (
                            <div className="p-2 bg-blue-50 dark:bg-blue-950 border rounded text-sm">
                              <span className="font-medium">Automatic Assessment: </span>
                              {generateAutoNotes()}
                            </div>
                          )}
                          <Textarea
                            id="screening_notes"
                            placeholder="Additional screening notes..."
                            value={screeningData.notes}
                            onChange={(e) => setScreeningData({...screeningData, notes: e.target.value})}
                          />
                        </div>
                      </div>

                      <Button onClick={saveScreening} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Screening Data
                      </Button>

                       {/* Display Current Screening if Available */}
                      {basicScreening && (
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-3">Current Screening Results</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {basicScreening.weight && (
                              <div>
                                <span className="font-medium">Weight:</span> {basicScreening.weight} lbs
                              </div>
                            )}
                            {basicScreening.height && (
                              <div>
                                <span className="font-medium">Height:</span> {basicScreening.height} ft
                              </div>
                            )}
                            {basicScreening.blood_sugar && (
                              <div>
                                <span className="font-medium">GMR:</span> {basicScreening.blood_sugar}
                              </div>
                            )}
                            {basicScreening.heart_rate && (
                              <div>
                                <span className="font-medium">Pulse:</span> {basicScreening.heart_rate} bpm
                              </div>
                            )}
                            {(basicScreening as any).oxygen_saturation && (
                              <div>
                                <span className="font-medium">Oxygen:</span> {(basicScreening as any).oxygen_saturation}%
                              </div>
                            )}
                            {basicScreening.blood_pressure_systolic && (
                              <div>
                                <span className="font-medium">BP:</span> {basicScreening.blood_pressure_systolic}/{basicScreening.blood_pressure_diastolic}
                              </div>
                             )}
                             {basicScreening.bmi && (
                               <div>
                                 <span className="font-medium">BMI:</span> {basicScreening.bmi}
                               </div>
                             )}
                             {(basicScreening as any).cholesterol && (
                               <div>
                                 <span className="font-medium">Cholesterol:</span> {(basicScreening as any).cholesterol} mg/dL
                               </div>
                             )}
                           </div>
                          {basicScreening.notes && (
                            <div className="mt-3">
                              <span className="font-medium">Notes:</span> {basicScreening.notes}
                            </div>
                          )}
                          {basicScreening.nurses && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Screened by: {basicScreening.nurses.first_name} {basicScreening.nurses.last_name}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Health Professional Selector */}
                      <HealthProfessionalSelector 
                        field="screening_nurse" 
                        label="Screening Nurse" 
                        type="nurse" 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="complaints" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Patient Complaints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentVisit && (
                    <div className="space-y-3">
                      <Label>Add New Complaint</Label>
                      <Textarea
                        placeholder="Describe the patient's complaint..."
                        value={newComplaint.text}
                        onChange={(e) => setNewComplaint({...newComplaint, text: e.target.value})}
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label>Severity:</Label>
                          <select 
                            value={newComplaint.severity}
                            onChange={(e) => setNewComplaint({...newComplaint, severity: e.target.value})}
                            className="border rounded px-2 py-1"
                          >
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                          </select>
                        </div>
                        <Button onClick={saveComplaint} className="gap-2">
                          <Save className="h-4 w-4" />
                          Save Complaint
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Previous Complaints</h4>
                    {complaints.length > 0 ? (
                      complaints.map((complaint) => (
                        <div key={complaint.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{complaint.severity}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(complaint.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p>{complaint.complaint_text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No complaints recorded.</p>
                    )}
                  </div>
                  
                  {/* Health Professional Selector */}
                  <HealthProfessionalSelector 
                    field="complaints_professional" 
                    label="Assigned Health Professional" 
                    type="both" 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prognosis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Medical Prognosis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentVisit && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="diagnosis">Diagnosis</Label>
                        <Textarea
                          id="diagnosis"
                          placeholder="Enter diagnosis..."
                          value={prognosisData.diagnosis}
                          onChange={(e) => setPrognosisData({...prognosisData, diagnosis: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="treatment_plan">Treatment Plan</Label>
                        <Textarea
                          id="treatment_plan"
                          placeholder="Enter treatment plan..."
                          value={prognosisData.treatment_plan}
                          onChange={(e) => setPrognosisData({...prognosisData, treatment_plan: e.target.value})}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="follow_up_required"
                          checked={prognosisData.follow_up_required}
                          onChange={(e) => setPrognosisData({...prognosisData, follow_up_required: e.target.checked})}
                        />
                        <Label htmlFor="follow_up_required">Follow-up required</Label>
                      </div>

                      {prognosisData.follow_up_required && (
                        <div>
                          <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
                          <Textarea
                            id="follow_up_notes"
                            placeholder="Enter follow-up instructions..."
                            value={prognosisData.follow_up_notes}
                            onChange={(e) => setPrognosisData({...prognosisData, follow_up_notes: e.target.value})}
                          />
                        </div>
                      )}

                      <Button onClick={savePrognosis} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Prognosis
                      </Button>
                    </div>
                  )}
                  
                   {/* Health Professional Selector */}
                   <HealthProfessionalSelector 
                     field="prognosis_doctor" 
                     label="Assigned Doctor" 
                     type="doctor" 
                   />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentVisit && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="medication">Medication</Label>
                          <Input
                            id="medication"
                            placeholder="Medication name"
                            value={newPrescription.medication}
                            onChange={(e) => setNewPrescription({...newPrescription, medication: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dosage">Dosage</Label>
                          <Input
                            id="dosage"
                            placeholder="e.g., 500mg"
                            value={newPrescription.dosage}
                            onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="frequency">Frequency</Label>
                          <Input
                            id="frequency"
                            placeholder="e.g., Twice daily"
                            value={newPrescription.frequency}
                            onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="duration">Duration</Label>
                          <Input
                            id="duration"
                            placeholder="e.g., 7 days"
                            value={newPrescription.duration}
                            onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Special instructions..."
                          value={newPrescription.instructions}
                          onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                        />
                      </div>
                      <Button className="gap-2">
                        <Save className="h-4 w-4" />
                        Add Prescription
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Current Prescriptions</h4>
                    {prescriptions.length > 0 ? (
                      prescriptions.map((prescription, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{prescription.medication}</span>
                            <Badge variant="outline">{prescription.dosage}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {prescription.frequency} for {prescription.duration}
                          </p>
                          {prescription.instructions && (
                            <p className="text-sm mt-1">{prescription.instructions}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No prescriptions recorded.</p>
                    )}
                  </div>
                  
                   {/* Health Professional Selector */}
                   <HealthProfessionalSelector 
                     field="prescriptions_doctor" 
                     label="Prescribing Doctor" 
                     type="doctor" 
                   />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ecg" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    ECG Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentVisit && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ecg_result">ECG Result</Label>
                        <Input
                          id="ecg_result"
                          placeholder="e.g., Normal sinus rhythm"
                          value={newEcgResult.result}
                          onChange={(e) => setNewEcgResult({...newEcgResult, result: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="interpretation">Interpretation</Label>
                        <Textarea
                          id="interpretation"
                          placeholder="Clinical interpretation..."
                          value={newEcgResult.interpretation}
                          onChange={(e) => setNewEcgResult({...newEcgResult, interpretation: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ecg_notes">Notes</Label>
                        <Textarea
                          id="ecg_notes"
                          placeholder="Additional notes..."
                          value={newEcgResult.notes}
                          onChange={(e) => setNewEcgResult({...newEcgResult, notes: e.target.value})}
                        />
                      </div>
                      <Button className="gap-2">
                        <Save className="h-4 w-4" />
                        Save ECG Result
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Previous ECG Results</h4>
                    {ecgResults.length > 0 ? (
                      ecgResults.map((ecg, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{ecg.result}</span>
                            <Badge variant="outline">ECG</Badge>
                          </div>
                          {ecg.interpretation && (
                            <p className="text-sm mb-2">{ecg.interpretation}</p>
                          )}
                          {ecg.notes && (
                            <p className="text-sm text-muted-foreground">{ecg.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No ECG results recorded.</p>
                    )}
                  </div>
                  
                   {/* Health Professional Selector */}
                   <HealthProfessionalSelector 
                     field="ecg_doctor" 
                     label="ECG Performing Doctor" 
                     type="doctor" 
                   />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optician" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Optician Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentVisit && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="vision_test">Vision Test Results</Label>
                        <Textarea
                          id="vision_test"
                          placeholder="Enter vision test results (e.g., 20/20, 20/40)..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="eye_pressure">Eye Pressure (mmHg)</Label>
                        <Input
                          id="eye_pressure"
                          type="number"
                          placeholder="Enter eye pressure reading"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prescription_needed">Prescription</Label>
                        <Textarea
                          id="prescription_needed"
                          placeholder="Enter prescription details if needed..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="optician_notes">Optician Notes</Label>
                        <Textarea
                          id="optician_notes"
                          placeholder="Additional assessment notes..."
                          rows={3}
                        />
                      </div>
                      <Button className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Optician Assessment
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Previous Assessments</h4>
                    <p className="text-muted-foreground">No previous optician assessments recorded.</p>
                  </div>
                  
                   {/* Health Professional Selector */}
                   <HealthProfessionalSelector 
                     field="optician" 
                     label="Assigned Optician" 
                     type="doctor" 
                   />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dental" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    Dental Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentVisit && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="oral_health">Oral Health Assessment</Label>
                        <Textarea
                          id="oral_health"
                          placeholder="Overall oral health condition..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="teeth_condition">Teeth Condition</Label>
                        <Textarea
                          id="teeth_condition"
                          placeholder="Condition of teeth, cavities, etc..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gum_health">Gum Health</Label>
                        <Textarea
                          id="gum_health"
                          placeholder="Gum condition and health assessment..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dental_recommendations">Recommendations</Label>
                        <Textarea
                          id="dental_recommendations"
                          placeholder="Treatment recommendations, referrals, etc..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dental_notes">Dental Notes</Label>
                        <Textarea
                          id="dental_notes"
                          placeholder="Additional dental assessment notes..."
                          rows={3}
                        />
                      </div>
                      <Button className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Dental Assessment
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Previous Assessments</h4>
                    <p className="text-muted-foreground">No previous dental assessments recorded.</p>
                  </div>
                  
                   {/* Health Professional Selector */}
                   <HealthProfessionalSelector 
                     field="dental_professional" 
                     label="Assigned Dental Professional" 
                     type="doctor" 
                   />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="immunizations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Immunizations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentVisit && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vaccine_name">Vaccine Name *</Label>
                          <Input
                            id="vaccine_name"
                            placeholder="Enter vaccine name"
                            value={newImmunization.vaccine_name}
                            onChange={(e) => setNewImmunization({...newImmunization, vaccine_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dose_number">Dose Number</Label>
                          <Input
                            id="dose_number"
                            type="number"
                            placeholder="Enter dose number"
                            value={newImmunization.dose_number}
                            onChange={(e) => setNewImmunization({...newImmunization, dose_number: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vaccine_date">Vaccine Date</Label>
                          <Input
                            id="vaccine_date"
                            type="date"
                            value={newImmunization.vaccine_date}
                            onChange={(e) => setNewImmunization({...newImmunization, vaccine_date: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lot_number">Lot Number</Label>
                          <Input
                            id="lot_number"
                            placeholder="Enter lot number"
                            value={newImmunization.lot_number}
                            onChange={(e) => setNewImmunization({...newImmunization, lot_number: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expiration_date">Expiration Date</Label>
                          <Input
                            id="expiration_date"
                            type="date"
                            value={newImmunization.expiration_date}
                            onChange={(e) => setNewImmunization({...newImmunization, expiration_date: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="site_of_injection">Site of Injection</Label>
                          <Input
                            id="site_of_injection"
                            placeholder="e.g., Left arm, Right thigh"
                            value={newImmunization.site_of_injection}
                            onChange={(e) => setNewImmunization({...newImmunization, site_of_injection: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="immunization_notes">Notes</Label>
                        <Textarea
                          id="immunization_notes"
                          placeholder="Additional notes about the immunization..."
                          value={newImmunization.notes}
                          onChange={(e) => setNewImmunization({...newImmunization, notes: e.target.value})}
                        />
                      </div>

                      <Button onClick={saveImmunization} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Immunization
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Previous Immunizations</h4>
                    {immunizations.length > 0 ? (
                      immunizations.map((immunization, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{immunization.vaccine_name}</span>
                            <Badge variant="outline">
                              {immunization.vaccine_date ? new Date(immunization.vaccine_date).toLocaleDateString() : 'No date'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {immunization.dose_number && (
                              <p>Dose: {immunization.dose_number}</p>
                            )}
                            {immunization.lot_number && (
                              <p>Lot: {immunization.lot_number}</p>
                            )}
                            {immunization.site_of_injection && (
                              <p>Site: {immunization.site_of_injection}</p>
                            )}
                            {immunization.notes && (
                              <p className="mt-2">{immunization.notes}</p>
                            )}
                            {immunization.doctors && (
                              <p className="text-xs mt-2">
                                Administered by: Dr. {immunization.doctors.first_name} {immunization.doctors.last_name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No immunizations recorded.</p>
                    )}
                  </div>
                  
                  {/* Health Professional Selector */}
                  <HealthProfessionalSelector 
                    field="immunizations_administrator" 
                    label="Administered By" 
                    type="doctor" 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Visit History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {visitHistory.length > 0 ? (
                      visitHistory.map((visit) => (
                        <div key={visit.id} className="border rounded-lg overflow-hidden">
                          {/* Visit Header */}
                          <div className="bg-muted/50 p-4 border-b">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-lg">{visit.events?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Health Fair Date: {visit.events?.event_date ? new Date(visit.events.event_date).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Visit Date: {new Date(visit.visit_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">Queue #{visit.queue_number}</Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Status: {visit.status}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Visit Details */}
                          <div className="p-4 space-y-4">
                            {/* Services Received */}
                            {visit.service_queue && visit.service_queue.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Services Received:</h4>
                                <div className="space-y-2">
                                  {visit.service_queue.map((service) => (
                                    <div key={service.id} className="bg-muted/30 p-2 rounded text-sm">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{service.services?.name}</span>
                                        <Badge variant={service.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                          {service.status}
                                        </Badge>
                                      </div>
                                      {service.doctors && (
                                        <p className="text-muted-foreground mt-1">
                                          Doctor: Dr. {service.doctors.first_name} {service.doctors.last_name}
                                        </p>
                                      )}
                                      {service.nurses && (
                                        <p className="text-muted-foreground">
                                          Nurse: {service.nurses.first_name} {service.nurses.last_name}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Basic Screening */}
                            {visit.basic_screening && visit.basic_screening.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Screening Results:</h4>
                                {visit.basic_screening.map((screening, index) => (
                                  <div key={index} className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      {screening.bmi && (
                                        <p>BMI: {screening.bmi}</p>
                                      )}
                                      {screening.blood_pressure_systolic && screening.blood_pressure_diastolic && (
                                        <p>BP: {screening.blood_pressure_systolic}/{screening.blood_pressure_diastolic}</p>
                                      )}
                                    </div>
                                    {screening.notes && (
                                      <p className="text-muted-foreground mt-1">{screening.notes}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Complaints */}
                            {visit.patient_complaints && visit.patient_complaints.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Complaints:</h4>
                                <div className="space-y-1">
                                  {visit.patient_complaints.map((complaint, index) => (
                                    <div key={index} className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded text-sm">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={complaint.severity === 'severe' ? 'destructive' : 'outline'} className="text-xs">
                                          {complaint.severity}
                                        </Badge>
                                        <span>{complaint.complaint_text}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Diagnosis */}
                            {visit.patient_prognosis && visit.patient_prognosis.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Diagnosis & Treatment:</h4>
                                {visit.patient_prognosis.map((prognosis, index) => (
                                  <div key={index} className="bg-green-50 dark:bg-green-950 p-2 rounded text-sm">
                                    {prognosis.diagnosis && (
                                      <p><strong>Diagnosis:</strong> {prognosis.diagnosis}</p>
                                    )}
                                    {prognosis.treatment_plan && (
                                      <p><strong>Treatment:</strong> {prognosis.treatment_plan}</p>
                                    )}
                                    {prognosis.doctors && (
                                      <p className="text-muted-foreground mt-1">
                                        Diagnosed by: Dr. {prognosis.doctors.first_name} {prognosis.doctors.last_name}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No previous visits found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsModal;