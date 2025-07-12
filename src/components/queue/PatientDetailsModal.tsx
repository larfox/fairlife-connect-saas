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
import { 
  User, 
  AlertTriangle, 
  Heart, 
  FileText, 
  Calendar,
  Activity,
  Save,
  Clock,
  UserCog
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ServiceAssignmentForm } from "./ServiceAssignmentForm";

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
    notes: ""
  });
  const [newComplaint, setNewComplaint] = useState({ text: "", severity: "mild" });
  const [prognosisData, setPrognosisData] = useState({
    diagnosis: "",
    treatment_plan: "",
    follow_up_required: false,
    follow_up_notes: ""
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && patient) {
      fetchPatientData();
    }
  }, [isOpen, patient, eventId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Fetch visit history
      const { data: visits, error: visitsError } = await supabase
        .from("patient_visits")
        .select(`
          *,
          events (name, event_date)
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
        }

        // Fetch basic screening for current visit
        const { data: screeningData, error: screeningError } = await supabase
          .from("basic_screening")
          .select(`
            *,
            nurses (first_name, last_name)
          `)
          .eq("patient_visit_id", currentEventVisit.id)
          .single();

        if (screeningError && screeningError.code !== 'PGRST116') {
          throw screeningError;
        }
        
        setBasicScreening(screeningData);
        
        // Populate screening form if data exists
        if (screeningData) {
          setScreeningData({
            weight: screeningData.weight?.toString() || "",
            height: screeningData.height?.toString() || "",
            blood_sugar: screeningData.blood_sugar?.toString() || "",
            heart_rate: screeningData.heart_rate?.toString() || "",
            oxygen_saturation: (screeningData as any).oxygen_saturation?.toString() || "",
            blood_pressure_systolic: screeningData.blood_pressure_systolic?.toString() || "",
            blood_pressure_diastolic: screeningData.blood_pressure_diastolic?.toString() || "",
            notes: screeningData.notes || ""
          });
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
        notes: screeningData.notes || null
      };

      const { error } = await supabase
        .from("basic_screening")
        .upsert([screeningPayload]);

      if (error) throw error;

      toast({
        title: "Screening saved",
        description: "Patient screening data has been updated.",
      });

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

  const currentBMI = calculateBMI(screeningData.weight, screeningData.height);

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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="screening">Screening</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="prognosis">Prognosis</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
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
                        <Textarea
                          id="screening_notes"
                          placeholder="Additional screening notes..."
                          value={screeningData.notes}
                          onChange={(e) => setScreeningData({...screeningData, notes: e.target.value})}
                        />
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              {currentVisit && (
                <ServiceAssignmentForm 
                  currentVisit={currentVisit}
                  onAssignmentUpdate={fetchPatientData}
                />
              )}
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
                  <div className="space-y-3">
                    {visitHistory.length > 0 ? (
                      visitHistory.map((visit) => (
                        <div key={visit.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{visit.events?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(visit.visit_date).toLocaleDateString()}
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
                      ))
                    ) : (
                      <p className="text-muted-foreground">No previous visits.</p>
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