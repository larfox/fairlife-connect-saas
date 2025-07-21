import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Edit, Save, X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BackToSchoolAssessment {
  id: string;
  patient_visit_id: string;
  medical_clearance: string | null;
  vaccination_status: string | null;
  health_conditions_notes: string | null;
  physical_activity_restrictions: string | null;
  medication_notes: string | null;
  follow_up_required: boolean;
  assessment_notes: string | null;
  assessed_by: string | null;
  created_at: string;
  updated_at: string;
  assessor?: {
    first_name: string;
    last_name: string;
    professional_capacity?: string;
  };
}

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  type: 'doctor' | 'nurse' | 'staff';
  specialization?: string;
  certification_level?: string;
  professional_capacity?: string;
}

interface BackToSchoolTabProps {
  patientVisitId: string;
}

const BackToSchoolTab = ({ patientVisitId }: BackToSchoolTabProps) => {
  const [assessment, setAssessment] = useState<BackToSchoolAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [formData, setFormData] = useState({
    medical_clearance: "",
    vaccination_status: "",
    health_conditions_notes: "",
    physical_activity_restrictions: "",
    medication_notes: "",
    follow_up_required: false,
    assessment_notes: "",
    assessed_by: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const initializeComponent = async () => {
      await getCurrentStaff();
      await fetchProfessionals();
      await fetchAssessment();
    };
    
    initializeComponent();
  }, [patientVisitId]);

  useEffect(() => {
    if (currentStaff && isEditing && (!formData.assessed_by || formData.assessed_by === "")) {
      setFormData(prev => ({
        ...prev,
        assessed_by: currentStaff.id
      }));
    }
  }, [currentStaff, isEditing, formData.assessed_by]);

  const getCurrentStaff = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data: staffData } = await supabase
          .from("staff")
          .select("id, first_name, last_name, professional_capacity")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (!staffData && user.email) {
          const { data: staffByEmail } = await supabase
            .from("staff")
            .select("id, first_name, last_name, professional_capacity")
            .eq("email", user.email)
            .maybeSingle();
          staffData = staffByEmail;
        }
        
        setCurrentStaff(staffData);
      }
    } catch (error) {
      console.error("Error getting current staff:", error);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const [staffResponse, doctorsResponse, nursesResponse] = await Promise.all([
        supabase.from("staff").select("*").eq("is_active", true),
        supabase.from("doctors").select("*").eq("is_active", true),
        supabase.from("nurses").select("*").eq("is_active", true)
      ]);

      const allProfessionals: Professional[] = [];
      
      if (staffResponse.data) {
        staffResponse.data.forEach(staff => {
          allProfessionals.push({
            id: staff.id,
            first_name: staff.first_name,
            last_name: staff.last_name,
            type: 'staff',
            professional_capacity: staff.professional_capacity
          });
        });
      }
      
      if (doctorsResponse.data) {
        doctorsResponse.data.forEach(doctor => {
          allProfessionals.push({
            id: doctor.id,
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            type: 'doctor',
            specialization: doctor.specialization
          });
        });
      }
      
      if (nursesResponse.data) {
        nursesResponse.data.forEach(nurse => {
          allProfessionals.push({
            id: nurse.id,
            first_name: nurse.first_name,
            last_name: nurse.last_name,
            type: 'nurse',
            certification_level: nurse.certification_level
          });
        });
      }
      
      setProfessionals(allProfessionals);
    } catch (error) {
      console.error("Error fetching professionals:", error);
    }
  };

  const fetchAssessment = async () => {
    try {
      // First, check if we have a back_to_school_assessments table
      // If not, we'll create the assessment data inline
      
      // For now, let's create a placeholder assessment structure
      // This would typically fetch from a back_to_school_assessments table
      setAssessment(null);
      setIsEditing(true); // Start in editing mode since there's no existing data
      
      if (currentStaff) {
        setFormData(prev => ({
          ...prev,
          assessed_by: currentStaff.id
        }));
      }
    } catch (error) {
      console.error("Error fetching back to school assessment:", error);
      toast({
        title: "Error",
        description: "Failed to fetch back to school assessment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Since we don't have a back_to_school_assessments table yet,
      // we'll save this information in the assessment_notes of the basic screening
      // or create a more comprehensive solution
      
      const assessmentSummary = `
BACK TO SCHOOL ASSESSMENT:

Medical Clearance: ${formData.medical_clearance || 'Not specified'}
Vaccination Status: ${formData.vaccination_status || 'Not specified'}
Health Conditions: ${formData.health_conditions_notes || 'None noted'}
Physical Activity Restrictions: ${formData.physical_activity_restrictions || 'None noted'}
Medication Notes: ${formData.medication_notes || 'None noted'}
Follow-up Required: ${formData.follow_up_required ? 'Yes' : 'No'}
Additional Notes: ${formData.assessment_notes || 'None'}
Assessed by: ${professionals.find(p => p.id === formData.assessed_by)?.first_name || ''} ${professionals.find(p => p.id === formData.assessed_by)?.last_name || ''}
Assessment Date: ${new Date().toLocaleDateString()}
      `.trim();

      // For now, we'll create/update a service record for "Back to School"
      const { data: serviceData } = await supabase
        .from('services')
        .select('id')
        .ilike('name', '%back to school%')
        .single();

      if (serviceData) {
        // Check if there's already a service queue entry
        const { data: existingQueue } = await supabase
          .from('service_queue')
          .select('id')
          .eq('patient_visit_id', patientVisitId)
          .eq('service_id', serviceData.id)
          .maybeSingle();

        if (existingQueue) {
          // Update existing queue entry
          await supabase
            .from('service_queue')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              doctor_id: formData.assessed_by
            })
            .eq('id', existingQueue.id);
        } else {
          // Create new queue entry
          await supabase
            .from('service_queue')
            .insert({
              patient_visit_id: patientVisitId,
              service_id: serviceData.id,
              status: 'completed',
              completed_at: new Date().toISOString(),
              doctor_id: formData.assessed_by
            });
        }
      }

      // Store detailed assessment in patient_complaints as a back to school summary
      await supabase
        .from('patient_complaints')
        .insert({
          patient_visit_id: patientVisitId,
          complaint_text: assessmentSummary,
          severity: 'mild',
          assigned_professional_id: formData.assessed_by
        });

      toast({
        title: "Success",
        description: "Back to School assessment saved successfully",
      });

      setIsEditing(false);
      
      // Create a mock assessment object for display
      setAssessment({
        id: 'temp-' + Date.now(),
        patient_visit_id: patientVisitId,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assessor: professionals.find(p => p.id === formData.assessed_by)
      } as BackToSchoolAssessment);

    } catch (error: any) {
      console.error("Error saving back to school assessment:", error);
      
      toast({
        title: "Save Error",
        description: "Failed to save back to school assessment",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (assessment) {
      setFormData({
        medical_clearance: assessment.medical_clearance || "",
        vaccination_status: assessment.vaccination_status || "",
        health_conditions_notes: assessment.health_conditions_notes || "",
        physical_activity_restrictions: assessment.physical_activity_restrictions || "",
        medication_notes: assessment.medication_notes || "",
        follow_up_required: assessment.follow_up_required || false,
        assessment_notes: assessment.assessment_notes || "",
        assessed_by: assessment.assessed_by || currentStaff?.id || ""
      });
    } else {
      setFormData({
        medical_clearance: "",
        vaccination_status: "",
        health_conditions_notes: "",
        physical_activity_restrictions: "",
        medication_notes: "",
        follow_up_required: false,
        assessment_notes: "",
        assessed_by: currentStaff?.id || ""
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading back to school assessment...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Back to School Assessment
          </CardTitle>
          {!isEditing && assessment && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medical_clearance">Medical Clearance for School</Label>
                <Select value={formData.medical_clearance} onValueChange={(value) => handleInputChange('medical_clearance', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clearance status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleared">Cleared for all activities</SelectItem>
                    <SelectItem value="cleared_with_restrictions">Cleared with restrictions</SelectItem>
                    <SelectItem value="pending_evaluation">Pending further evaluation</SelectItem>
                    <SelectItem value="not_cleared">Not cleared</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vaccination_status">Vaccination Status</Label>
                <Select value={formData.vaccination_status} onValueChange={(value) => handleInputChange('vaccination_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vaccination status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up_to_date">Up to date</SelectItem>
                    <SelectItem value="needs_vaccines">Needs additional vaccines</SelectItem>
                    <SelectItem value="medical_exemption">Medical exemption</SelectItem>
                    <SelectItem value="unknown">Unknown/Need records</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="health_conditions_notes">Health Conditions & Notes</Label>
              <Textarea
                id="health_conditions_notes"
                value={formData.health_conditions_notes}
                onChange={(e) => handleInputChange('health_conditions_notes', e.target.value)}
                placeholder="Document any chronic conditions, allergies, or health concerns relevant to school..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="physical_activity_restrictions">Physical Activity Restrictions</Label>
              <Textarea
                id="physical_activity_restrictions"
                value={formData.physical_activity_restrictions}
                onChange={(e) => handleInputChange('physical_activity_restrictions', e.target.value)}
                placeholder="Note any restrictions for PE, sports, or other physical activities..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="medication_notes">Medication Notes</Label>
              <Textarea
                id="medication_notes"
                value={formData.medication_notes}
                onChange={(e) => handleInputChange('medication_notes', e.target.value)}
                placeholder="List medications to be administered at school, including dosage and timing..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="follow_up_required"
                checked={formData.follow_up_required}
                onChange={(e) => handleInputChange('follow_up_required', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="follow_up_required">Follow-up appointment required</Label>
            </div>

            <div>
              <Label htmlFor="assessment_notes">Additional Assessment Notes</Label>
              <Textarea
                id="assessment_notes"
                value={formData.assessment_notes}
                onChange={(e) => handleInputChange('assessment_notes', e.target.value)}
                placeholder="Any additional health information the school should be aware of..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="assessed_by">Assessed By</Label>
              <Select value={formData.assessed_by} onValueChange={(value) => handleInputChange('assessed_by', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessing professional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      {professional.first_name} {professional.last_name} 
                      {professional.type === 'doctor' && professional.specialization && ` (${professional.specialization})`}
                      {professional.type === 'nurse' && professional.certification_level && ` (${professional.certification_level})`}
                      {professional.type === 'staff' && professional.professional_capacity && ` (${professional.professional_capacity})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Assessment"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {assessment ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Badge variant="outline" className="mb-2">Medical Clearance</Badge>
                    <p className="text-sm">
                      {assessment.medical_clearance ? 
                        assessment.medical_clearance.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Vaccination Status</Badge>
                    <p className="text-sm">
                      {assessment.vaccination_status ? 
                        assessment.vaccination_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                        : 'Not specified'}
                    </p>
                  </div>
                </div>

                {assessment.health_conditions_notes && (
                  <div>
                    <Badge variant="outline" className="mb-2">Health Conditions</Badge>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">
                      {assessment.health_conditions_notes}
                    </p>
                  </div>
                )}

                {assessment.physical_activity_restrictions && (
                  <div>
                    <Badge variant="outline" className="mb-2">Physical Activity Restrictions</Badge>
                    <p className="text-sm bg-orange-50 dark:bg-orange-950 p-2 rounded">
                      {assessment.physical_activity_restrictions}
                    </p>
                  </div>
                )}

                {assessment.medication_notes && (
                  <div>
                    <Badge variant="outline" className="mb-2">Medication Notes</Badge>
                    <p className="text-sm bg-purple-50 dark:bg-purple-950 p-2 rounded">
                      {assessment.medication_notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={assessment.follow_up_required ? "destructive" : "secondary"} className="mb-2">
                    Follow-up Required: {assessment.follow_up_required ? "Yes" : "No"}
                  </Badge>
                </div>

                {assessment.assessment_notes && (
                  <div>
                    <Badge variant="outline" className="mb-2">Additional Notes</Badge>
                    <p className="text-sm bg-gray-50 dark:bg-gray-950 p-2 rounded">
                      {assessment.assessment_notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Assessed on {new Date(assessment.created_at).toLocaleDateString()}
                    {assessment.assessor && ` by ${assessment.assessor.first_name} ${assessment.assessor.last_name}`}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No back to school assessment recorded yet.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsEditing(true)}
                >
                  Start Assessment
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackToSchoolTab;