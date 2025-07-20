import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { User as SupabaseUser } from "@supabase/supabase-js";
import PapSmearTab from "../patient/PapSmearTab";

interface PatientDetailsModalProps {
  patient: any;
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PatientDetailsModalWithPermissions = ({ patient, eventId, isOpen, onClose }: PatientDetailsModalProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
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
    notes: "",
    performed_by: ""
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
  
  // Optician assessment state
  const [opticianAssessments, setOpticianAssessments] = useState<any[]>([]);
  const [newOpticianAssessment, setNewOpticianAssessment] = useState({
    vision_test_results: "",
    eye_pressure: "",
    prescription_details: "",
    assessment_notes: "",
    optician_id: ""
  });

  // Dental assessment state
  const [dentalAssessments, setDentalAssessments] = useState<any[]>([]);
  const [newDentalAssessment, setNewDentalAssessment] = useState({
    teeth_condition: "",
    gum_health: "",
    recommendations: "",
    assessment_notes: "",
    dental_professional_id: ""
  });
  
  // Back to school assessment state
  const [backToSchoolAssessments, setBackToSchoolAssessments] = useState<any[]>([]);
  const [newBackToSchoolAssessment, setNewBackToSchoolAssessment] = useState({
    height: "",
    weight: "",
    bmi: "",
    vision_screening: "",
    hearing_screening: "",
    general_health_status: "",
    notes: "",
    examining_professional_id: ""
  });
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { 
    userRole, 
    canViewTab, 
    canEditTab, 
    canAddData,
    canViewData,
    checkTabAccess,
    checkDataAccess,
    formatTabName,
    getTabPermissions,
    isStaff,
    isDoctor,
    isNurse,
    hasEditAccess,
    hasViewAccess,
    getSpecificPermissions,
    hasPermission,
    hasAnyPermission
  } = useStaffPermissions();

  const fetchPatientData = async () => {
    if (!currentVisit?.id) return;

    try {
      // Fetch all the data for the current visit
      const [
        complaintsResult,
        prognosisResult,
        basicScreeningResult,
        prescriptionsResult,
        ecgResult,
        immunizationsResult,
        opticianResult,
        dentalResult,
        backToSchoolResult
      ] = await Promise.all([
        supabase.from('patient_complaints').select('*').eq('patient_visit_id', currentVisit.id),
        supabase.from('patient_prognosis').select('*').eq('patient_visit_id', currentVisit.id).single(),
        supabase.from('basic_screening').select('*').eq('patient_visit_id', currentVisit.id).single(),
        supabase.from('patient_prescriptions').select('*').eq('patient_visit_id', currentVisit.id),
        supabase.from('ecg_results').select('*').eq('patient_visit_id', currentVisit.id),
        supabase.from('immunizations').select('*').eq('patient_visit_id', currentVisit.id),
        supabase.from('optician_assessments').select('*').eq('patient_visit_id', currentVisit.id),
        supabase.from('dental_assessments').select('*').eq('patient_visit_id', currentVisit.id),
        supabase.from('back_to_school_assessments').select('*').eq('patient_visit_id', currentVisit.id)
      ]);

      if (complaintsResult.data) setComplaints(complaintsResult.data);
      if (prognosisResult.data) setPrognosis(prognosisResult.data);
      if (basicScreeningResult.data) {
        setBasicScreening(basicScreeningResult.data);
        setScreeningData({
          weight: basicScreeningResult.data.weight || "",
          height: basicScreeningResult.data.height || "",
          blood_sugar: basicScreeningResult.data.blood_sugar || "",
          heart_rate: basicScreeningResult.data.heart_rate || "",
          oxygen_saturation: basicScreeningResult.data.oxygen_saturation || "",
          blood_pressure_systolic: basicScreeningResult.data.blood_pressure_systolic || "",
          blood_pressure_diastolic: basicScreeningResult.data.blood_pressure_diastolic || "",
          cholesterol: basicScreeningResult.data.cholesterol || "",
          notes: basicScreeningResult.data.notes || ""
        });
      }
      if (prescriptionsResult.data) setPrescriptions(prescriptionsResult.data);
      if (ecgResult.data) setEcgResults(ecgResult.data);
      if (immunizationsResult.data) setImmunizations(immunizationsResult.data);
      if (opticianResult.data) setOpticianAssessments(opticianResult.data);
      if (dentalResult.data) setDentalAssessments(dentalResult.data);
      if (backToSchoolResult.data) setBackToSchoolAssessments(backToSchoolResult.data);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchVisitHistory = async () => {
      if (!patient?.id) return;

      try {
        const { data: visits, error } = await supabase
          .from('patient_visits')
          .select(`
            *,
            events(name, event_date),
            service_queue(
              *,
              services(name),
              doctors(first_name, last_name),
              nurses(first_name, last_name)
            )
          `)
          .eq('patient_id', patient.id)
          .order('visit_date', { ascending: false });

        if (error) throw error;

        setVisitHistory(visits || []);
        
        // Find current visit for this event
        const currentEventVisit = visits?.find(visit => visit.event_id === eventId);
        setCurrentVisit(currentEventVisit);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching visit history:', error);
        setLoading(false);
      }
    };

    fetchVisitHistory();
  }, [patient?.id, eventId]);

  useEffect(() => {
    if (currentVisit) {
      fetchPatientData();
    }
  }, [currentVisit]);

  const PermissionWrapper = ({ children, tabName }: { children: React.ReactNode; tabName: string }) => {
    if (!canViewTab(tabName)) {
      return (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">You don't have permission to view this section.</p>
        </div>
      );
    }
    return <>{children}</>;
  };

  // Helper functions for data operations

  const saveScreeningData = async () => {
    if (!currentVisit?.id) return;

    try {
      const screeningRecord = {
        patient_visit_id: currentVisit.id,
        weight: screeningData.weight || null,
        height: screeningData.height || null,
        blood_sugar: screeningData.blood_sugar || null,
        heart_rate: screeningData.heart_rate || null,
        oxygen_saturation: screeningData.oxygen_saturation || null,
        blood_pressure_systolic: screeningData.blood_pressure_systolic || null,
        blood_pressure_diastolic: screeningData.blood_pressure_diastolic || null,
        cholesterol: screeningData.cholesterol || null,
        notes: screeningData.notes || null,
        performed_by: user?.id
      };

      if (basicScreening) {
        const { error } = await supabase
          .from('basic_screening')
          .update(screeningRecord)
          .eq('id', basicScreening.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('basic_screening')
          .insert([screeningRecord]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Screening data saved successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error saving screening data:', error);
      toast({
        title: "Error",
        description: "Failed to save screening data",
        variant: "destructive"
      });
    }
  };

  const addComplaint = async () => {
    if (!newComplaint.text.trim() || !currentVisit?.id) return;

    try {
      const { error } = await supabase
        .from('patient_complaints')
        .insert([{
          patient_visit_id: currentVisit.id,
          complaint_text: newComplaint.text,
          severity: newComplaint.severity,
          reported_by: user?.id
        }]);

      if (error) throw error;

      setNewComplaint({ text: "", severity: "mild" });
      toast({
        title: "Success",
        description: "Complaint added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding complaint:', error);
      toast({
        title: "Error",
        description: "Failed to add complaint",
        variant: "destructive"
      });
    }
  };

  const savePrognosis = async () => {
    if (!currentVisit?.id) return;

    try {
      const prognosisRecord = {
        patient_visit_id: currentVisit.id,
        diagnosis: prognosisData.diagnosis,
        treatment_plan: prognosisData.treatment_plan,
        follow_up_required: prognosisData.follow_up_required,
        follow_up_notes: prognosisData.follow_up_notes,
        assessed_by: user?.id
      };

      if (prognosis) {
        const { error } = await supabase
          .from('patient_prognosis')
          .update(prognosisRecord)
          .eq('id', prognosis.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('patient_prognosis')
          .insert([prognosisRecord]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Prognosis saved successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error saving prognosis:', error);
      toast({
        title: "Error",
        description: "Failed to save prognosis",
        variant: "destructive"
      });
    }
  };

  const addPrescription = async () => {
    if (!newPrescription.medication.trim() || !currentVisit?.id) return;

    try {
      const { error } = await supabase
        .from('patient_prescriptions')
        .insert([{
          patient_visit_id: currentVisit.id,
          medication: newPrescription.medication,
          dosage: newPrescription.dosage,
          frequency: newPrescription.frequency,
          duration: newPrescription.duration,
          instructions: newPrescription.instructions,
          prescribed_by: user?.id
        }]);

      if (error) throw error;

      setNewPrescription({
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      });
      
      toast({
        title: "Success",
        description: "Prescription added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding prescription:', error);
      toast({
        title: "Error",
        description: "Failed to add prescription",
        variant: "destructive"
      });
    }
  };

  const addEcgResult = async () => {
    if (!newEcgResult.result.trim() || !currentVisit?.id) return;

    try {
      const { error } = await supabase
        .from('ecg_results')
        .insert([{
          patient_visit_id: currentVisit.id,
          result: newEcgResult.result,
          interpretation: newEcgResult.interpretation,
          notes: newEcgResult.notes,
          performed_by: user?.id
        }]);

      if (error) throw error;

      setNewEcgResult({
        result: "",
        interpretation: "",
        notes: "",
        performed_by: ""
      });
      
      toast({
        title: "Success",
        description: "ECG result added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding ECG result:', error);
      toast({
        title: "Error",
        description: "Failed to add ECG result",
        variant: "destructive"
      });
    }
  };

  const addImmunization = async () => {
    if (!newImmunization.vaccine_name.trim() || !currentVisit?.id) return;

    try {
      const { error } = await supabase
        .from('immunizations')
        .insert([{
          patient_visit_id: currentVisit.id,
          vaccine_name: newImmunization.vaccine_name,
          dose_number: newImmunization.dose_number,
          vaccine_date: newImmunization.vaccine_date,
          lot_number: newImmunization.lot_number,
          expiration_date: newImmunization.expiration_date,
          site_of_injection: newImmunization.site_of_injection,
          notes: newImmunization.notes,
          administered_by: user?.id
        }]);

      if (error) throw error;

      setNewImmunization({
        vaccine_name: "",
        dose_number: "",
        vaccine_date: "",
        lot_number: "",
        expiration_date: "",
        site_of_injection: "",
        notes: ""
      });
      
      toast({
        title: "Success",
        description: "Immunization added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding immunization:', error);
      toast({
        title: "Error",
        description: "Failed to add immunization",
        variant: "destructive"
      });
    }
  };

  const addOpticianAssessment = async () => {
    if (!currentVisit?.id) return;

    try {
      const { error } = await supabase
        .from('optician_assessments')
        .insert([{
          patient_visit_id: currentVisit.id,
          vision_test_results: newOpticianAssessment.vision_test_results,
          eye_pressure: newOpticianAssessment.eye_pressure,
          prescription_details: newOpticianAssessment.prescription_details,
          assessment_notes: newOpticianAssessment.assessment_notes,
          optician_id: user?.id
        }]);

      if (error) throw error;

      setNewOpticianAssessment({
        vision_test_results: "",
        eye_pressure: "",
        prescription_details: "",
        assessment_notes: "",
        optician_id: ""
      });
      
      toast({
        title: "Success",
        description: "Optician assessment added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding optician assessment:', error);
      toast({
        title: "Error",
        description: "Failed to add optician assessment",
        variant: "destructive"
      });
    }
  };

  const addDentalAssessment = async () => {
    if (!currentVisit?.id) return;

    try {
      const { error } = await supabase
        .from('dental_assessments')
        .insert([{
          patient_visit_id: currentVisit.id,
          teeth_condition: newDentalAssessment.teeth_condition,
          gum_health: newDentalAssessment.gum_health,
          recommendations: newDentalAssessment.recommendations,
          assessment_notes: newDentalAssessment.assessment_notes,
          dental_professional_id: user?.id
        }]);

      if (error) throw error;

      setNewDentalAssessment({
        teeth_condition: "",
        gum_health: "",
        recommendations: "",
        assessment_notes: "",
        dental_professional_id: ""
      });
      
      toast({
        title: "Success",
        description: "Dental assessment added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding dental assessment:', error);
      toast({
        title: "Error",
        description: "Failed to add dental assessment",
        variant: "destructive"
      });
    }
  };

  const addBackToSchoolAssessment = async () => {
    if (!currentVisit?.id) return;

    try {
      const { error } = await supabase
        .from('back_to_school_assessments')
        .insert([{
          patient_visit_id: currentVisit.id,
          height: newBackToSchoolAssessment.height,
          weight: newBackToSchoolAssessment.weight,
          bmi: newBackToSchoolAssessment.bmi,
          vision_screening: newBackToSchoolAssessment.vision_screening,
          hearing_screening: newBackToSchoolAssessment.hearing_screening,
          general_health_status: newBackToSchoolAssessment.general_health_status,
          notes: newBackToSchoolAssessment.notes,
          examining_professional_id: user?.id
        }]);

      if (error) throw error;

      setNewBackToSchoolAssessment({
        height: "",
        weight: "",
        bmi: "",
        vision_screening: "",
        hearing_screening: "",
        general_health_status: "",
        notes: "",
        examining_professional_id: ""
      });
      
      toast({
        title: "Success",
        description: "Back to school assessment added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding back to school assessment:', error);
      toast({
        title: "Error",
        description: "Failed to add back to school assessment",
        variant: "destructive"
      });
    }
  };

  const getVisibleTabs = () => {
    const allTabs = [
      { value: "overview", label: "Overview" },
      { value: "screening", label: "Know Your Numbers" },
      { value: "complaints-prognosis", label: "Complaints & Prognosis" },
      { value: "prescriptions", label: "Prescriptions" },
      { value: "ecg", label: "ECG Results" },
      { value: "optician", label: "Optician Assessment" },
      { value: "dental", label: "Dental Assessment" },
      { value: "pap-smears", label: "Pap Smears" },
      { value: "back-to-school", label: "Back to School" },
      { value: "immunizations", label: "Immunizations" },
      { value: "history", label: "Visit History" }
    ];

    return allTabs.filter(tab => canViewTab(tab.value));
  };

  const visibleTabs = getVisibleTabs();
  const gridCols = visibleTabs.length <= 6 ? 'grid-cols-6' :
                   visibleTabs.length <= 8 ? 'grid-cols-8' :
                   visibleTabs.length <= 10 ? 'grid-cols-10' : 'grid-cols-11';

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {patient.first_name} {patient.last_name}
          </DialogTitle>
          <DialogDescription>
            Patient details and medical records for {patient.first_name} {patient.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={`grid ${gridCols} mb-4 h-auto`}>
                {visibleTabs.map(tab => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="text-xs px-2 py-1 text-center whitespace-normal"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <PermissionWrapper tabName="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Patient Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Badge variant="outline" className="mb-2">Full Name</Badge>
                            <p className="text-sm font-medium">{patient.first_name} {patient.last_name}</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-2">Date of Birth</Badge>
                            <p className="text-sm">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-2">Gender</Badge>
                            <p className="text-sm">{patient.gender || 'Not specified'}</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-2">Phone</Badge>
                            <p className="text-sm">{patient.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Badge variant="outline" className="mb-2">Address</Badge>
                          <p className="text-sm">{patient.address || 'Not provided'}</p>
                        </div>
                        
                        {patient.emergency_contact && (
                          <div>
                            <Badge variant="outline" className="mb-2">Emergency Contact</Badge>
                            <p className="text-sm">{patient.emergency_contact}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Medical Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {patient.allergies && (
                          <div>
                            <Badge variant="destructive" className="mb-2">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Allergies
                            </Badge>
                            <p className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                              {patient.allergies}
                            </p>
                          </div>
                        )}
                        
                        {patient.medical_history && (
                          <div>
                            <Badge variant="outline" className="mb-2">Medical History</Badge>
                            <p className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">
                              {patient.medical_history}
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
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="screening" className="mt-0">
                <PermissionWrapper tabName="screening">
                  <Card>
                    <CardHeader>
                      <CardTitle>Know Your Numbers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            value={screeningData.weight}
                            onChange={e => setScreeningData({ ...screeningData, weight: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={screeningData.height}
                            onChange={e => setScreeningData({ ...screeningData, height: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="blood_sugar">Blood Sugar (mg/dL)</Label>
                          <Input
                            id="blood_sugar"
                            type="number"
                            value={screeningData.blood_sugar}
                            onChange={e => setScreeningData({ ...screeningData, blood_sugar: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                          <Input
                            id="heart_rate"
                            type="number"
                            value={screeningData.heart_rate}
                            onChange={e => setScreeningData({ ...screeningData, heart_rate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="oxygen_saturation">Oxygen Saturation (%)</Label>
                          <Input
                            id="oxygen_saturation"
                            type="number"
                            value={screeningData.oxygen_saturation}
                            onChange={e => setScreeningData({ ...screeningData, oxygen_saturation: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="blood_pressure_systolic">Blood Pressure Systolic (mmHg)</Label>
                          <Input
                            id="blood_pressure_systolic"
                            type="number"
                            value={screeningData.blood_pressure_systolic}
                            onChange={e => setScreeningData({ ...screeningData, blood_pressure_systolic: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="blood_pressure_diastolic">Blood Pressure Diastolic (mmHg)</Label>
                          <Input
                            id="blood_pressure_diastolic"
                            type="number"
                            value={screeningData.blood_pressure_diastolic}
                            onChange={e => setScreeningData({ ...screeningData, blood_pressure_diastolic: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cholesterol">Cholesterol (mg/dL)</Label>
                          <Input
                            id="cholesterol"
                            type="number"
                            value={screeningData.cholesterol}
                            onChange={e => setScreeningData({ ...screeningData, cholesterol: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={screeningData.notes}
                            onChange={e => setScreeningData({ ...screeningData, notes: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button onClick={saveScreeningData} disabled={!hasEditAccess("screening")}>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="complaints-prognosis" className="mt-0">
                <PermissionWrapper tabName="complaints-prognosis">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Complaints</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {complaints.map(complaint => (
                            <div key={complaint.id} className="border rounded p-2">
                              <p className="font-semibold">{complaint.complaint_text}</p>
                              <p className="text-xs text-muted-foreground">Severity: {complaint.severity}</p>
                            </div>
                          ))}
                        </div>
                        {hasAddData("complaints-prognosis") && (
                          <div className="mt-4 space-y-2">
                            <Textarea
                              placeholder="Add new complaint"
                              value={newComplaint.text}
                              onChange={e => setNewComplaint({ ...newComplaint, text: e.target.value })}
                            />
                            <Select
                              value={newComplaint.severity}
                              onValueChange={value => setNewComplaint({ ...newComplaint, severity: value })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mild">Mild</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button onClick={addComplaint} disabled={!newComplaint.text.trim()}>
                              Add Complaint
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Prognosis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="diagnosis">Diagnosis</Label>
                            <Textarea
                              id="diagnosis"
                              value={prognosisData.diagnosis}
                              onChange={e => setPrognosisData({ ...prognosisData, diagnosis: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="treatment_plan">Treatment Plan</Label>
                            <Textarea
                              id="treatment_plan"
                              value={prognosisData.treatment_plan}
                              onChange={e => setPrognosisData({ ...prognosisData, treatment_plan: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="follow_up_required"
                              checked={prognosisData.follow_up_required}
                              onChange={e => setPrognosisData({ ...prognosisData, follow_up_required: e.target.checked })}
                            />
                            <Label htmlFor="follow_up_required">Follow-up Required</Label>
                          </div>
                          {prognosisData.follow_up_required && (
                            <div>
                              <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
                              <Textarea
                                id="follow_up_notes"
                                value={prognosisData.follow_up_notes}
                                onChange={e => setPrognosisData({ ...prognosisData, follow_up_notes: e.target.value })}
                              />
                            </div>
                          )}
                          <div className="flex justify-end">
                            <Button onClick={savePrognosis} disabled={!hasEditAccess("complaints-prognosis")}>
                              Save Prognosis
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="prescriptions" className="mt-0">
                <PermissionWrapper tabName="prescriptions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prescriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {prescriptions.map(prescription => (
                          <div key={prescription.id} className="border rounded p-2">
                            <p className="font-semibold">{prescription.medication}</p>
                            <p className="text-xs text-muted-foreground">
                              Dosage: {prescription.dosage}, Frequency: {prescription.frequency}, Duration: {prescription.duration}
                            </p>
                            <p className="text-xs text-muted-foreground">Instructions: {prescription.instructions}</p>
                          </div>
                        ))}
                      </div>
                      {hasAddData("prescriptions") && (
                        <div className="mt-4 space-y-2">
                          <Input
                            placeholder="Medication"
                            value={newPrescription.medication}
                            onChange={e => setNewPrescription({ ...newPrescription, medication: e.target.value })}
                          />
                          <Input
                            placeholder="Dosage"
                            value={newPrescription.dosage}
                            onChange={e => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                          />
                          <Input
                            placeholder="Frequency"
                            value={newPrescription.frequency}
                            onChange={e => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                          />
                          <Input
                            placeholder="Duration"
                            value={newPrescription.duration}
                            onChange={e => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                          />
                          <Textarea
                            placeholder="Instructions"
                            value={newPrescription.instructions}
                            onChange={e => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                          />
                          <Button onClick={addPrescription} disabled={!newPrescription.medication.trim()}>
                            Add Prescription
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="ecg" className="mt-0">
                <PermissionWrapper tabName="ecg">
                  <Card>
                    <CardHeader>
                      <CardTitle>ECG Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {ecgResults.map(ecg => (
                          <div key={ecg.id} className="border rounded p-2">
                            <p className="font-semibold">{ecg.result}</p>
                            <p className="text-xs text-muted-foreground">Interpretation: {ecg.interpretation}</p>
                            <p className="text-xs text-muted-foreground">Notes: {ecg.notes}</p>
                          </div>
                        ))}
                      </div>
                      {hasAddData("ecg") && (
                        <div className="mt-4 space-y-2">
                          <Textarea
                            placeholder="Result"
                            value={newEcgResult.result}
                            onChange={e => setNewEcgResult({ ...newEcgResult, result: e.target.value })}
                          />
                          <Textarea
                            placeholder="Interpretation"
                            value={newEcgResult.interpretation}
                            onChange={e => setNewEcgResult({ ...newEcgResult, interpretation: e.target.value })}
                          />
                          <Textarea
                            placeholder="Notes"
                            value={newEcgResult.notes}
                            onChange={e => setNewEcgResult({ ...newEcgResult, notes: e.target.value })}
                          />
                          <Button onClick={addEcgResult} disabled={!newEcgResult.result.trim()}>
                            Add ECG Result
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="optician" className="mt-0">
                <PermissionWrapper tabName="optician">
                  <Card>
                    <CardHeader>
                      <CardTitle>Optician Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {opticianAssessments.map(assessment => (
                          <div key={assessment.id} className="border rounded p-2">
                            <p className="font-semibold">Vision Test Results: {assessment.vision_test_results}</p>
                            <p className="text-xs text-muted-foreground">Eye Pressure: {assessment.eye_pressure}</p>
                            <p className="text-xs text-muted-foreground">Prescription Details: {assessment.prescription_details}</p>
                            <p className="text-xs text-muted-foreground">Notes: {assessment.assessment_notes}</p>
                          </div>
                        ))}
                      </div>
                      {hasAddData("optician") && (
                        <div className="mt-4 space-y-2">
                          <Textarea
                            placeholder="Vision Test Results"
                            value={newOpticianAssessment.vision_test_results}
                            onChange={e => setNewOpticianAssessment({ ...newOpticianAssessment, vision_test_results: e.target.value })}
                          />
                          <Input
                            placeholder="Eye Pressure"
                            value={newOpticianAssessment.eye_pressure}
                            onChange={e => setNewOpticianAssessment({ ...newOpticianAssessment, eye_pressure: e.target.value })}
                          />
                          <Textarea
                            placeholder="Prescription Details"
                            value={newOpticianAssessment.prescription_details}
                            onChange={e => setNewOpticianAssessment({ ...newOpticianAssessment, prescription_details: e.target.value })}
                          />
                          <Textarea
                            placeholder="Assessment Notes"
                            value={newOpticianAssessment.assessment_notes}
                            onChange={e => setNewOpticianAssessment({ ...newOpticianAssessment, assessment_notes: e.target.value })}
                          />
                          <Button onClick={addOpticianAssessment}>
                            Add Optician Assessment
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="dental" className="mt-0">
                <PermissionWrapper tabName="dental">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dental Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {dentalAssessments.map(assessment => (
                          <div key={assessment.id} className="border rounded p-2">
                            <p className="font-semibold">Teeth Condition: {assessment.teeth_condition}</p>
                            <p className="text-xs text-muted-foreground">Gum Health: {assessment.gum_health}</p>
                            <p className="text-xs text-muted-foreground">Recommendations: {assessment.recommendations}</p>
                            <p className="text-xs text-muted-foreground">Notes: {assessment.assessment_notes}</p>
                          </div>
                        ))}
                      </div>
                      {hasAddData("dental") && (
                        <div className="mt-4 space-y-2">
                          <Textarea
                            placeholder="Teeth Condition"
                            value={newDentalAssessment.teeth_condition}
                            onChange={e => setNewDentalAssessment({ ...newDentalAssessment, teeth_condition: e.target.value })}
                          />
                          <Textarea
                            placeholder="Gum Health"
                            value={newDentalAssessment.gum_health}
                            onChange={e => setNewDentalAssessment({ ...newDentalAssessment, gum_health: e.target.value })}
                          />
                          <Textarea
                            placeholder="Recommendations"
                            value={newDentalAssessment.recommendations}
                            onChange={e => setNewDentalAssessment({ ...newDentalAssessment, recommendations: e.target.value })}
                          />
                          <Textarea
                            placeholder="Assessment Notes"
                            value={newDentalAssessment.assessment_notes}
                            onChange={e => setNewDentalAssessment({ ...newDentalAssessment, assessment_notes: e.target.value })}
                          />
                          <Button onClick={addDentalAssessment}>
                            Add Dental Assessment
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="pap-smears" className="mt-0">
                <PermissionWrapper tabName="pap-smears">
                  <PapSmearTab patient={patient} currentVisit={currentVisit} />
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="back-to-school" className="mt-0">
                <PermissionWrapper tabName="back-to-school">
                  <Card>
                    <CardHeader>
                      <CardTitle>Back to School Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {backToSchoolAssessments.map(assessment => (
                          <div key={assessment.id} className="border rounded p-2">
                            <p>Height: {assessment.height}</p>
                            <p>Weight: {assessment.weight}</p>
                            <p>BMI: {assessment.bmi}</p>
                            <p>Vision Screening: {assessment.vision_screening}</p>
                            <p>Hearing Screening: {assessment.hearing_screening}</p>
                            <p>General Health Status: {assessment.general_health_status}</p>
                            <p>Notes: {assessment.notes}</p>
                          </div>
                        ))}
                      </div>
                      {hasAddData("back-to-school") && (
                        <div className="mt-4 space-y-2">
                          <Input
                            placeholder="Height"
                            value={newBackToSchoolAssessment.height}
                            onChange={e => setNewBackToSchoolAssessment({ ...newBackToSchoolAssessment, height: e.target.value })}
                          />
                          <Input
                            placeholder="Weight"
                            value={newBackToSchoolAssessment.weight}
                            onChange={e => setNewBackToSchoolAssessment({ ...newBackToSchoolAssessment, weight: e.target.value })}
                          />
                          <Input
                            placeholder="BMI"
                            value={newBackToSchoolAssessment.bmi}
                            onChange={e => setNewBackToSchoolAssessment({ ...newBackToSchoolAssessment, bmi: e.target.value })}
                          />
                          <Input
                            placeholder="Vision Screening"
                            value={newBackToSchoolAssessment.vision_screening}
                            onChange={e => setNewBackToSchoolAssessment({ ...newBackToSchoolAssessment, vision_screening: e.target.value })}
                          />
                          <Input
                            placeholder="Hearing Screening"
                            value={newBackToSchoolAssessment.hearing_screening}
                            onChange={e => setNewBackToSchoolAssessment({ ...newBackToSchoolAssessment, hearing_screening: e.target.value })}
                          />
                          <Textarea
                            placeholder="General Health Status"
                            value={newBackToSchoolAssessment.general_health_status}
                            onChange={e => setNewBackToSchoolAssessment({ ...newBackToSchoolAssessment, general_health_status: e.target.value })}
                          />
                          <Textarea
                            placeholder="Notes"
                            value={newBackToSchoolAssessment.notes}
                            onChange={e => setNewBackToSchoolAssessment({ ...newBackToSchoolAssessment, notes: e.target.value })}
                          />
                          <Button onClick={addBackToSchoolAssessment}>
                            Add Back to School Assessment
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="immunizations" className="mt-0">
                <PermissionWrapper tabName="immunizations">
                  <Card>
                    <CardHeader>
                      <CardTitle>Immunizations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {immunizations.map(immunization => (
                          <div key={immunization.id} className="border rounded p-2">
                            <p className="font-semibold">{immunization.vaccine_name}</p>
                            <p>Dose Number: {immunization.dose_number}</p>
                            <p>Vaccine Date: {immunization.vaccine_date}</p>
                            <p>Lot Number: {immunization.lot_number}</p>
                            <p>Expiration Date: {immunization.expiration_date}</p>
                            <p>Site of Injection: {immunization.site_of_injection}</p>
                            <p>Notes: {immunization.notes}</p>
                          </div>
                        ))}
                      </div>
                      {hasAddData("immunizations") && (
                        <div className="mt-4 space-y-2">
                          <Input
                            placeholder="Vaccine Name"
                            value={newImmunization.vaccine_name}
                            onChange={e => setNewImmunization({ ...newImmunization, vaccine_name: e.target.value })}
                          />
                          <Input
                            placeholder="Dose Number"
                            value={newImmunization.dose_number}
                            onChange={e => setNewImmunization({ ...newImmunization, dose_number: e.target.value })}
                          />
                          <Input
                            placeholder="Vaccine Date"
                            type="date"
                            value={newImmunization.vaccine_date}
                            onChange={e => setNewImmunization({ ...newImmunization, vaccine_date: e.target.value })}
                          />
                          <Input
                            placeholder="Lot Number"
                            value={newImmunization.lot_number}
                            onChange={e => setNewImmunization({ ...newImmunization, lot_number: e.target.value })}
                          />
                          <Input
                            placeholder="Expiration Date"
                            type="date"
                            value={newImmunization.expiration_date}
                            onChange={e => setNewImmunization({ ...newImmunization, expiration_date: e.target.value })}
                          />
                          <Input
                            placeholder="Site of Injection"
                            value={newImmunization.site_of_injection}
                            onChange={e => setNewImmunization({ ...newImmunization, site_of_injection: e.target.value })}
                          />
                          <Textarea
                            placeholder="Notes"
                            value={newImmunization.notes}
                            onChange={e => setNewImmunization({ ...newImmunization, notes: e.target.value })}
                          />
                          <Button onClick={addImmunization} disabled={!newImmunization.vaccine_name.trim()}>
                            Add Immunization
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <PermissionWrapper tabName="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Visit History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {visitHistory.length === 0 && <p>No visit history available.</p>}
                        {visitHistory.map(visit => (
                          <div key={visit.id} className="border rounded p-2">
                            <p className="font-semibold">{visit.events?.name || "Event"}</p>
                            <p>Date: {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : "N/A"}</p>
                            <p>Service: {visit.service_queue?.services?.name || "N/A"}</p>
                            <p>Doctor: {visit.service_queue?.doctors ? `${visit.service_queue.doctors.first_name} ${visit.service_queue.doctors.last_name}` : "N/A"}</p>
                            <p>Nurse: {visit.service_queue?.nurses ? `${visit.service_queue.nurses.first_name} ${visit.service_queue.nurses.last_name}` : "N/A"}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </PermissionWrapper>
              </TabsContent>
              
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsModalWithPermissions;
