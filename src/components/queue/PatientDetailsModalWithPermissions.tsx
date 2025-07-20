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
        description: "Immunization record added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding immunization:', error);
      toast({
        title: "Error",
        description: "Failed to add immunization record",
        variant: "destructive"
      });
    }
  };

  const addOpticianAssessment = async () => {
    if (!newOpticianAssessment.vision_test_results.trim() || !currentVisit?.id) return;

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
    if (!newDentalAssessment.teeth_condition.trim() || !currentVisit?.id) return;

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
    if (!newBackToSchoolAssessment.height.trim() || !currentVisit?.id) return;

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
        description: "Back to School assessment added successfully"
      });
      
      fetchPatientData();
    } catch (error) {
      console.error('Error adding Back to School assessment:', error);
      toast({
        title: "Error",
        description: "Failed to add Back to School assessment",
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
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500" />
                            Basic Screening - "Know Your Numbers"
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {currentVisit && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <Label>Weight (kg)</Label>
                                  <Input
                                    type="number"
                                    value={screeningData.weight}
                                    onChange={(e) => setScreeningData({...screeningData, weight: e.target.value})}
                                    placeholder="Enter weight"
                                    disabled={!canEditTab('screening')}
                                  />
                                </div>
                                <div>
                                  <Label>Height (cm)</Label>
                                  <Input
                                    type="number"
                                    value={screeningData.height}
                                    onChange={(e) => setScreeningData({...screeningData, height: e.target.value})}
                                    placeholder="Enter height"
                                    disabled={!canEditTab('screening')}
                                  />
                                </div>
                                <div>
                                  <Label>Blood Sugar (mg/dL)</Label>
                                  <Input
                                    type="number"
                                    value={screeningData.blood_sugar}
                                    onChange={(e) => setScreeningData({...screeningData, blood_sugar: e.target.value})}
                                    placeholder="Enter blood sugar"
                                    disabled={!canEditTab('screening')}
                                  />
                                </div>
                                <div>
                                  <Label>Heart Rate (BPM)</Label>
                                  <Input
                                    type="number"
                                    value={screeningData.heart_rate}
                                    onChange={(e) => setScreeningData({...screeningData, heart_rate: e.target.value})}
                                    placeholder="Enter heart rate"
                                    disabled={!canEditTab('screening')}
                                  />
                                </div>
                                <div>
                                  <Label>Oxygen Saturation (%)</Label>
                                  <Input
                                    type="number"
                                    value={screeningData.oxygen_saturation}
                                    onChange={(e) => setScreeningData({...screeningData, oxygen_saturation: e.target.value})}
                                    placeholder="Enter oxygen saturation"
                                    disabled={!canEditTab('screening')}
                                  />
                                </div>
                                <div>
                                  <Label>Cholesterol (mg/dL)</Label>
                                  <Input
                                    type="number"
                                    value={screeningData.cholesterol}
                                    onChange={(e) => setScreeningData({...screeningData, cholesterol: e.target.value})}
                                    placeholder="Enter cholesterol"
                                    disabled={!canEditTab('screening')}
                                  />
                                </div>
                                <div>
                                  <Label>Blood Pressure (Systolic)</Label>
                                  <Input
                                    type="number"
                                    value={screeningData.blood_pressure_systolic}
                                    onChange={(e) => setScreeningData({...screeningData, blood_pressure_systolic: e.target.value})}
                                    placeholder="Enter systolic BP"
                                    disabled={!canEditTab('screening')}
                                  />
                                </div>
                                <div>
                                  <Label>Blood Pressure (Diastolic)</Label>
                                  <Input
                                    type="number"
                                    value={screeningData.blood_pressure_diastolic}
                                    onChange={(e) => setScreeningData({...screeningData, blood_pressure_diastolic: e.target.value})}
                                    placeholder="Enter diastolic BP"
                                    disabled={!canEditTab('screening')}
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <Label>Notes</Label>
                                <Textarea
                                  value={screeningData.notes}
                                  onChange={(e) => setScreeningData({...screeningData, notes: e.target.value})}
                                  placeholder="Additional notes or observations"
                                  disabled={!canEditTab('screening')}
                                />
                              </div>

                              {canEditTab('screening') && (
                                <Button onClick={saveScreeningData} className="flex items-center gap-2">
                                  <Save className="h-4 w-4" />
                                  Save Screening Data
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {basicScreening && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                              <h4 className="font-medium mb-2">Professional Attribution</h4>
                              <p className="text-sm text-muted-foreground">
                                Recorded by professional ID: {basicScreening.performed_by}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Last updated: {new Date(basicScreening.updated_at || basicScreening.created_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </PermissionWrapper>
                  </TabsContent>

                  <TabsContent value="complaints-prognosis" className="mt-0">
                    <PermissionWrapper tabName="complaints-prognosis">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Complaints Section */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-orange-500" />
                              Patient Complaints
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {currentVisit && (
                              <div className="space-y-4">
                                {canEditTab('complaints-prognosis') && (
                                  <div className="space-y-2">
                                    <Label>New Complaint</Label>
                                    <Textarea
                                      value={newComplaint.text}
                                      onChange={(e) => setNewComplaint({...newComplaint, text: e.target.value})}
                                      placeholder="Describe the patient's complaint"
                                    />
                                    <Select
                                      value={newComplaint.severity}
                                      onValueChange={(value) => setNewComplaint({...newComplaint, severity: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="mild">Mild</SelectItem>
                                        <SelectItem value="moderate">Moderate</SelectItem>
                                        <SelectItem value="severe">Severe</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button onClick={addComplaint} className="flex items-center gap-2">
                                      <Save className="h-4 w-4" />
                                      Add Complaint
                                    </Button>
                                  </div>
                                )}
                                
                                <div className="space-y-2">
                                  <h4 className="font-medium">Recorded Complaints</h4>
                                  {complaints.length > 0 ? (
                                    complaints.map((complaint) => (
                                      <div key={complaint.id} className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <Badge variant={
                                            complaint.severity === 'severe' ? 'destructive' :
                                            complaint.severity === 'moderate' ? 'default' : 'secondary'
                                          }>
                                            {complaint.severity}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(complaint.created_at).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-sm">{complaint.complaint_text}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Reported by: {complaint.reported_by}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-muted-foreground text-sm">No complaints recorded</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Prognosis Section */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5 text-green-500" />
                              Prognosis & Treatment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {currentVisit && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Diagnosis</Label>
                                  <Textarea
                                    value={prognosisData.diagnosis}
                                    onChange={(e) => setPrognosisData({...prognosisData, diagnosis: e.target.value})}
                                    placeholder="Enter diagnosis"
                                    disabled={!canEditTab('complaints-prognosis')}
                                  />
                                </div>
                                
                                <div>
                                  <Label>Treatment Plan</Label>
                                  <Textarea
                                    value={prognosisData.treatment_plan}
                                    onChange={(e) => setPrognosisData({...prognosisData, treatment_plan: e.target.value})}
                                    placeholder="Enter treatment plan"
                                    disabled={!canEditTab('complaints-prognosis')}
                                  />
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="followUp"
                                    checked={prognosisData.follow_up_required}
                                    onChange={(e) => setPrognosisData({...prognosisData, follow_up_required: e.target.checked})}
                                    disabled={!canEditTab('complaints-prognosis')}
                                  />
                                  <Label htmlFor="followUp">Follow-up Required</Label>
                                </div>
                                
                                {prognosisData.follow_up_required && (
                                  <div>
                                    <Label>Follow-up Notes</Label>
                                    <Textarea
                                      value={prognosisData.follow_up_notes}
                                      onChange={(e) => setPrognosisData({...prognosisData, follow_up_notes: e.target.value})}
                                      placeholder="Enter follow-up instructions"
                                      disabled={!canEditTab('complaints-prognosis')}
                                    />
                                  </div>
                                )}

                                {canEditTab('complaints-prognosis') && (
                                  <Button onClick={savePrognosis} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Save Prognosis
                                  </Button>
                                )}

                                {prognosis && (
                                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                    <h4 className="font-medium mb-2">Professional Attribution</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Assessed by professional ID: {prognosis.assessed_by}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Last updated: {new Date(prognosis.updated_at || prognosis.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </PermissionWrapper>
                  </TabsContent>

                  <TabsContent value="prescriptions" className="mt-0">
                    <PermissionWrapper tabName="prescriptions">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Pill className="h-5 w-5 text-blue-500" />
                            Prescriptions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {currentVisit && (
                            <div className="space-y-4">
                              {canEditTab('prescriptions') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                  <div className="col-span-full">
                                    <h4 className="font-medium mb-2">Add New Prescription</h4>
                                  </div>
                                  <div>
                                    <Label>Medication</Label>
                                    <Input
                                      value={newPrescription.medication}
                                      onChange={(e) => setNewPrescription({...newPrescription, medication: e.target.value})}
                                      placeholder="Enter medication name"
                                    />
                                  </div>
                                  <div>
                                    <Label>Dosage</Label>
                                    <Input
                                      value={newPrescription.dosage}
                                      onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                                      placeholder="e.g., 500mg"
                                    />
                                  </div>
                                  <div>
                                    <Label>Frequency</Label>
                                    <Input
                                      value={newPrescription.frequency}
                                      onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                                      placeholder="e.g., Twice daily"
                                    />
                                  </div>
                                  <div>
                                    <Label>Duration</Label>
                                    <Input
                                      value={newPrescription.duration}
                                      onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                                      placeholder="e.g., 7 days"
                                    />
                                  </div>
                                  <div className="col-span-full">
                                    <Label>Instructions</Label>
                                    <Textarea
                                      value={newPrescription.instructions}
                                      onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                                      placeholder="Special instructions for the patient"
                                    />
                                  </div>
                                  <Button onClick={addPrescription} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Add Prescription
                                  </Button>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <h4 className="font-medium">Current Prescriptions</h4>
                                {prescriptions.length > 0 ? (
                                  prescriptions.map((prescription) => (
                                    <div key={prescription.id} className="p-4 border rounded-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <div>
                                          <Badge variant="outline" className="mb-1">Medication</Badge>
                                          <p className="font-medium">{prescription.medication}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Dosage</Badge>
                                          <p className="text-sm">{prescription.dosage}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Frequency</Badge>
                                          <p className="text-sm">{prescription.frequency}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Duration</Badge>
                                          <p className="text-sm">{prescription.duration}</p>
                                        </div>
                                      </div>
                                      {prescription.instructions && (
                                        <div className="mt-2">
                                          <Badge variant="outline" className="mb-1">Instructions</Badge>
                                          <p className="text-sm">{prescription.instructions}</p>
                                        </div>
                                      )}
                                      <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Prescribed by: {prescription.prescribed_by}</span>
                                        <span>{new Date(prescription.created_at).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-sm">No prescriptions recorded</p>
                                )}
                              </div>
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
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            ECG Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {currentVisit && (
                            <div className="space-y-4">
                              {canEditTab('ecg') && (
                                <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
                                  <h4 className="font-medium">Add New ECG Result</h4>
                                  <div>
                                    <Label>ECG Result</Label>
                                    <Textarea
                                      value={newEcgResult.result}
                                      onChange={(e) => setNewEcgResult({...newEcgResult, result: e.target.value})}
                                      placeholder="Enter ECG findings"
                                    />
                                  </div>
                                  <div>
                                    <Label>Interpretation</Label>
                                    <Textarea
                                      value={newEcgResult.interpretation}
                                      onChange={(e) => setNewEcgResult({...newEcgResult, interpretation: e.target.value})}
                                      placeholder="Clinical interpretation of results"
                                    />
                                  </div>
                                  <div>
                                    <Label>Additional Notes</Label>
                                    <Textarea
                                      value={newEcgResult.notes}
                                      onChange={(e) => setNewEcgResult({...newEcgResult, notes: e.target.value})}
                                      placeholder="Any additional observations"
                                    />
                                  </div>
                                  <Button onClick={addEcgResult} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Add ECG Result
                                  </Button>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <h4 className="font-medium">Recorded ECG Results</h4>
                                {ecgResults.length > 0 ? (
                                  ecgResults.map((result) => (
                                    <div key={result.id} className="p-4 border rounded-lg">
                                      <div className="space-y-2">
                                        <div>
                                          <Badge variant="outline" className="mb-1">Result</Badge>
                                          <p className="text-sm">{result.result}</p>
                                        </div>
                                        {result.interpretation && (
                                          <div>
                                            <Badge variant="outline" className="mb-1">Interpretation</Badge>
                                            <p className="text-sm">{result.interpretation}</p>
                                          </div>
                                        )}
                                        {result.notes && (
                                          <div>
                                            <Badge variant="outline" className="mb-1">Notes</Badge>
                                            <p className="text-sm">{result.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Performed by: {result.performed_by}</span>
                                        <span>{new Date(result.created_at).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-sm">No ECG results recorded</p>
                                )}
                              </div>
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
                          <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-purple-500" />
                            Optician Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {currentVisit && (
                            <div className="space-y-4">
                              {canEditTab('optician') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                  <div className="col-span-full">
                                    <h4 className="font-medium mb-2">Add New Assessment</h4>
                                  </div>
                                  <div>
                                    <Label>Vision Test Results</Label>
                                    <Textarea
                                      value={newOpticianAssessment.vision_test_results}
                                      onChange={(e) => setNewOpticianAssessment({...newOpticianAssessment, vision_test_results: e.target.value})}
                                      placeholder="Enter vision test results"
                                    />
                                  </div>
                                  <div>
                                    <Label>Eye Pressure</Label>
                                    <Input
                                      value={newOpticianAssessment.eye_pressure}
                                      onChange={(e) => setNewOpticianAssessment({...newOpticianAssessment, eye_pressure: e.target.value})}
                                      placeholder="Eye pressure measurements"
                                    />
                                  </div>
                                  <div className="col-span-full">
                                    <Label>Prescription Details</Label>
                                    <Textarea
                                      value={newOpticianAssessment.prescription_details}
                                      onChange={(e) => setNewOpticianAssessment({...newOpticianAssessment, prescription_details: e.target.value})}
                                      placeholder="Prescription details if needed"
                                    />
                                  </div>
                                  <div className="col-span-full">
                                    <Label>Assessment Notes</Label>
                                    <Textarea
                                      value={newOpticianAssessment.assessment_notes}
                                      onChange={(e) => setNewOpticianAssessment({...newOpticianAssessment, assessment_notes: e.target.value})}
                                      placeholder="Additional assessment notes"
                                    />
                                  </div>
                                  <Button onClick={addOpticianAssessment} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Add Assessment
                                  </Button>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <h4 className="font-medium">Recorded Assessments</h4>
                                {opticianAssessments.length > 0 ? (
                                  opticianAssessments.map((assessment) => (
                                    <div key={assessment.id} className="p-4 border rounded-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <Badge variant="outline" className="mb-1">Vision Test Results</Badge>
                                          <p className="text-sm">{assessment.vision_test_results}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Eye Pressure</Badge>
                                          <p className="text-sm">{assessment.eye_pressure}</p>
                                        </div>
                                        {assessment.prescription_details && (
                                          <div className="col-span-full">
                                            <Badge variant="outline" className="mb-1">Prescription Details</Badge>
                                            <p className="text-sm">{assessment.prescription_details}</p>
                                          </div>
                                        )}
                                        {assessment.assessment_notes && (
                                          <div className="col-span-full">
                                            <Badge variant="outline" className="mb-1">Notes</Badge>
                                            <p className="text-sm">{assessment.assessment_notes}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Assessed by: {assessment.optician_id}</span>
                                        <span>{new Date(assessment.created_at).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-sm">No optician assessments recorded</p>
                                )}
                              </div>
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
                          <CardTitle className="flex items-center gap-2">
                            <Smile className="h-5 w-5 text-green-500" />
                            Dental Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {currentVisit && (
                            <div className="space-y-4">
                              {canEditTab('dental') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                  <div className="col-span-full">
                                    <h4 className="font-medium mb-2">Add New Dental Assessment</h4>
                                  </div>
                                  <div>
                                    <Label>Teeth Condition</Label>
                                    <Textarea
                                      value={newDentalAssessment.teeth_condition}
                                      onChange={(e) => setNewDentalAssessment({...newDentalAssessment, teeth_condition: e.target.value})}
                                      placeholder="Describe teeth condition"
                                    />
                                  </div>
                                  <div>
                                    <Label>Gum Health</Label>
                                    <Textarea
                                      value={newDentalAssessment.gum_health}
                                      onChange={(e) => setNewDentalAssessment({...newDentalAssessment, gum_health: e.target.value})}
                                      placeholder="Describe gum health"
                                    />
                                  </div>
                                  <div className="col-span-full">
                                    <Label>Recommendations</Label>
                                    <Textarea
                                      value={newDentalAssessment.recommendations}
                                      onChange={(e) => setNewDentalAssessment({...newDentalAssessment, recommendations: e.target.value})}
                                      placeholder="Treatment recommendations"
                                    />
                                  </div>
                                  <div className="col-span-full">
                                    <Label>Assessment Notes</Label>
                                    <Textarea
                                      value={newDentalAssessment.assessment_notes}
                                      onChange={(e) => setNewDentalAssessment({...newDentalAssessment, assessment_notes: e.target.value})}
                                      placeholder="Additional notes"
                                    />
                                  </div>
                                  <Button onClick={addDentalAssessment} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Add Assessment
                                  </Button>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <h4 className="font-medium">Recorded Assessments</h4>
                                {dentalAssessments.length > 0 ? (
                                  dentalAssessments.map((assessment) => (
                                    <div key={assessment.id} className="p-4 border rounded-lg">
                                      <div className="space-y-2">
                                        <div>
                                          <Badge variant="outline" className="mb-1">Teeth Condition</Badge>
                                          <p className="text-sm">{assessment.teeth_condition}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Gum Health</Badge>
                                          <p className="text-sm">{assessment.gum_health}</p>
                                        </div>
                                        {assessment.recommendations && (
                                          <div>
                                            <Badge variant="outline" className="mb-1">Recommendations</Badge>
                                            <p className="text-sm">{assessment.recommendations}</p>
                                          </div>
                                        )}
                                        {assessment.assessment_notes && (
                                          <div>
                                            <Badge variant="outline" className="mb-1">Notes</Badge>
                                            <p className="text-sm">{assessment.assessment_notes}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Assessed by: {assessment.dental_professional_id}</span>
                                        <span>{new Date(assessment.created_at).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-sm">No dental assessments recorded</p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </PermissionWrapper>
                  </TabsContent>

                  <TabsContent value="pap-smears" className="mt-0">
                    <PermissionWrapper tabName="pap-smears">
                      {currentVisit && (
                        <PapSmearTab 
                          patientVisitId={currentVisit.id} 
                          canEdit={canEditTab('pap-smears')} 
                        />
                      )}
                    </PermissionWrapper>
                  </TabsContent>

                  <TabsContent value="back-to-school" className="mt-0">
                    <PermissionWrapper tabName="back-to-school">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-indigo-500" />
                            Back to School Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {currentVisit && (
                            <div className="space-y-4">
                              {canEditTab('back-to-school') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                  <div className="col-span-full">
                                    <h4 className="font-medium mb-2">Add New Back to School Assessment</h4>
                                  </div>
                                  <div>
                                    <Label>Height (cm)</Label>
                                    <Input
                                      type="number"
                                      value={newBackToSchoolAssessment.height}
                                      onChange={(e) => setNewBackToSchoolAssessment({...newBackToSchoolAssessment, height: e.target.value})}
                                      placeholder="Enter height"
                                    />
                                  </div>
                                  <div>
                                    <Label>Weight (kg)</Label>
                                    <Input
                                      type="number"
                                      value={newBackToSchoolAssessment.weight}
                                      onChange={(e) => setNewBackToSchoolAssessment({...newBackToSchoolAssessment, weight: e.target.value})}
                                      placeholder="Enter weight"
                                    />
                                  </div>
                                  <div>
                                    <Label>BMI</Label>
                                    <Input
                                      value={newBackToSchoolAssessment.bmi}
                                      onChange={(e) => setNewBackToSchoolAssessment({...newBackToSchoolAssessment, bmi: e.target.value})}
                                      placeholder="Enter BMI"
                                    />
                                  </div>
                                  <div>
                                    <Label>Vision Screening</Label>
                                    <Input
                                      value={newBackToSchoolAssessment.vision_screening}
                                      onChange={(e) => setNewBackToSchoolAssessment({...newBackToSchoolAssessment, vision_screening: e.target.value})}
                                      placeholder="Vision screening results"
                                    />
                                  </div>
                                  <div>
                                    <Label>Hearing Screening</Label>
                                    <Input
                                      value={newBackToSchoolAssessment.hearing_screening}
                                      onChange={(e) => setNewBackToSchoolAssessment({...newBackToSchoolAssessment, hearing_screening: e.target.value})}
                                      placeholder="Hearing screening results"
                                    />
                                  </div>
                                  <div>
                                    <Label>General Health Status</Label>
                                    <Select
                                      value={newBackToSchoolAssessment.general_health_status}
                                      onValueChange={(value) => setNewBackToSchoolAssessment({...newBackToSchoolAssessment, general_health_status: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select health status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="excellent">Excellent</SelectItem>
                                        <SelectItem value="good">Good</SelectItem>
                                        <SelectItem value="fair">Fair</SelectItem>
                                        <SelectItem value="poor">Poor</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-full">
                                    <Label>Notes</Label>
                                    <Textarea
                                      value={newBackToSchoolAssessment.notes}
                                      onChange={(e) => setNewBackToSchoolAssessment({...newBackToSchoolAssessment, notes: e.target.value})}
                                      placeholder="Additional notes"
                                    />
                                  </div>
                                  <Button onClick={addBackToSchoolAssessment} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Add Assessment
                                  </Button>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <h4 className="font-medium">Recorded Assessments</h4>
                                {backToSchoolAssessments.length > 0 ? (
                                  backToSchoolAssessments.map((assessment) => (
                                    <div key={assessment.id} className="p-4 border rounded-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                          <Badge variant="outline" className="mb-1">Height</Badge>
                                          <p className="text-sm">{assessment.height} cm</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Weight</Badge>
                                          <p className="text-sm">{assessment.weight} kg</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">BMI</Badge>
                                          <p className="text-sm">{assessment.bmi}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Vision</Badge>
                                          <p className="text-sm">{assessment.vision_screening}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Hearing</Badge>
                                          <p className="text-sm">{assessment.hearing_screening}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Health Status</Badge>
                                          <Badge variant={
                                            assessment.general_health_status === 'excellent' ? 'default' :
                                            assessment.general_health_status === 'good' ? 'secondary' :
                                            assessment.general_health_status === 'fair' ? 'outline' : 'destructive'
                                          }>
                                            {assessment.general_health_status}
                                          </Badge>
                                        </div>
                                        {assessment.notes && (
                                          <div className="col-span-full">
                                            <Badge variant="outline" className="mb-1">Notes</Badge>
                                            <p className="text-sm">{assessment.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Assessed by: {assessment.examining_professional_id}</span>
                                        <span>{new Date(assessment.created_at).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-sm">No back to school assessments recorded</p>
                                )}
                              </div>
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
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            Immunizations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {currentVisit && (
                            <div className="space-y-4">
                              {canEditTab('immunizations') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                  <div className="col-span-full">
                                    <h4 className="font-medium mb-2">Add New Immunization Record</h4>
                                  </div>
                                  <div>
                                    <Label>Vaccine Name</Label>
                                    <Input
                                      value={newImmunization.vaccine_name}
                                      onChange={(e) => setNewImmunization({...newImmunization, vaccine_name: e.target.value})}
                                      placeholder="Enter vaccine name"
                                    />
                                  </div>
                                  <div>
                                    <Label>Dose Number</Label>
                                    <Input
                                      value={newImmunization.dose_number}
                                      onChange={(e) => setNewImmunization({...newImmunization, dose_number: e.target.value})}
                                      placeholder="e.g., 1st dose, 2nd dose"
                                    />
                                  </div>
                                  <div>
                                    <Label>Vaccine Date</Label>
                                    <Input
                                      type="date"
                                      value={newImmunization.vaccine_date}
                                      onChange={(e) => setNewImmunization({...newImmunization, vaccine_date: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Lot Number</Label>
                                    <Input
                                      value={newImmunization.lot_number}
                                      onChange={(e) => setNewImmunization({...newImmunization, lot_number: e.target.value})}
                                      placeholder="Vaccine lot number"
                                    />
                                  </div>
                                  <div>
                                    <Label>Expiration Date</Label>
                                    <Input
                                      type="date"
                                      value={newImmunization.expiration_date}
                                      onChange={(e) => setNewImmunization({...newImmunization, expiration_date: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Site of Injection</Label>
                                    <Input
                                      value={newImmunization.site_of_injection}
                                      onChange={(e) => setNewImmunization({...newImmunization, site_of_injection: e.target.value})}
                                      placeholder="e.g., Left arm"
                                    />
                                  </div>
                                  <div className="col-span-full">
                                    <Label>Notes</Label>
                                    <Textarea
                                      value={newImmunization.notes}
                                      onChange={(e) => setNewImmunization({...newImmunization, notes: e.target.value})}
                                      placeholder="Additional notes or reactions"
                                    />
                                  </div>
                                  <Button onClick={addImmunization} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Add Immunization
                                  </Button>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <h4 className="font-medium">Immunization Records</h4>
                                {immunizations.length > 0 ? (
                                  immunizations.map((immunization) => (
                                    <div key={immunization.id} className="p-4 border rounded-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                          <Badge variant="outline" className="mb-1">Vaccine</Badge>
                                          <p className="font-medium">{immunization.vaccine_name}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Dose</Badge>
                                          <p className="text-sm">{immunization.dose_number}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Date</Badge>
                                          <p className="text-sm">{new Date(immunization.vaccine_date).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Lot Number</Badge>
                                          <p className="text-sm">{immunization.lot_number}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Expiry</Badge>
                                          <p className="text-sm">{new Date(immunization.expiration_date).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                          <Badge variant="outline" className="mb-1">Site</Badge>
                                          <p className="text-sm">{immunization.site_of_injection}</p>
                                        </div>
                                        {immunization.notes && (
                                          <div className="col-span-full">
                                            <Badge variant="outline" className="mb-1">Notes</Badge>
                                            <p className="text-sm">{immunization.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Administered by: {immunization.administered_by}</span>
                                        <span>{new Date(immunization.created_at).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-sm">No immunization records found</p>
                                )}
                              </div>
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
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            Visit History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {visitHistory.length > 0 ? (
                              visitHistory.map((visit) => (
                                <div key={visit.id} className="border rounded-lg">
                                  {/* Visit Header */}
                                  <div className="bg-muted/30 p-4 rounded-t-lg">
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
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground text-center py-8">No previous visits found.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </PermissionWrapper>
                  </TabsContent>

                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsModalWithPermissions;
