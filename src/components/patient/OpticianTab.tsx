import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  Plus, 
  Save,
  Trash2,
  User,
  Glasses
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OpticianTabProps {
  patientVisitId: string;
}

const OpticianTab = ({ patientVisitId }: OpticianTabProps) => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [assessmentForm, setAssessmentForm] = useState({
    vision_test_results: "",
    eye_pressure: "",
    prescription_details: "",
    assessment_notes: "",
    optician_id: ""
  });

  useEffect(() => {
    fetchData();
  }, [patientVisitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch optician assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("optician_assessments")
        .select("*")
        .eq("patient_visit_id", patientVisitId)
        .order("created_at", { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Fetch doctors for dropdown (doctors who can perform eye exams)
      const { data: staffData, error: staffError } = await supabase
        .from("doctors")
        .select("id, first_name, last_name, specialization")
        .eq("is_active", true);

      if (staffError) throw staffError;

      setAssessments(assessmentsData || []);
      setStaff(staffData || []);
    } catch (error) {
      console.error("Error fetching optician data:", error);
      toast({
        title: "Error",
        description: "Failed to load optician assessments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssessment = async () => {
    if (!assessmentForm.vision_test_results.trim()) return;

    try {
      setSaving(true);
      const formData = {
        ...assessmentForm,
        patient_visit_id: patientVisitId,
        eye_pressure: assessmentForm.eye_pressure ? parseFloat(assessmentForm.eye_pressure) : null
      };

      const { error } = await supabase
        .from("optician_assessments")
        .insert(formData);

      if (error) throw error;

      setAssessmentForm({
        vision_test_results: "",
        eye_pressure: "",
        prescription_details: "",
        assessment_notes: "",
        optician_id: ""
      });
      
      await fetchData();
      toast({
        title: "Success",
        description: "Optician assessment added successfully.",
      });
    } catch (error) {
      console.error("Error adding assessment:", error);
      toast({
        title: "Error",
        description: "Failed to add optician assessment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      const { error } = await supabase
        .from("optician_assessments")
        .delete()
        .eq("id", assessmentId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Success",
        description: "Assessment deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to delete assessment.",
        variant: "destructive",
      });
    }
  };

  const getStaffMember = (staffId: string) => {
    return staff.find(s => s.id === staffId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-medium">Loading optician assessments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Optician Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vision-test">Vision Test Results *</Label>
              <Textarea
                id="vision-test"
                placeholder="Enter vision test results (e.g., 20/20, 20/40)"
                value={assessmentForm.vision_test_results}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, vision_test_results: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eye-pressure">Eye Pressure (mmHg)</Label>
              <Input
                id="eye-pressure"
                type="number"
                step="0.1"
                placeholder="e.g., 15.2"
                value={assessmentForm.eye_pressure}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, eye_pressure: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription">Prescription Details</Label>
            <Textarea
              id="prescription"
              placeholder="Enter prescription details (sphere, cylinder, axis, etc.)"
              value={assessmentForm.prescription_details}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, prescription_details: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Assessment Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional observations and recommendations"
              value={assessmentForm.assessment_notes}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, assessment_notes: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Examined By</Label>
            <Select 
              value={assessmentForm.optician_id} 
              onValueChange={(value) => setAssessmentForm(prev => ({ ...prev, optician_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name} {member.specialization ? `(${member.specialization})` : '(Doctor)'}
                  </SelectItem>
                ))}</SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddAssessment} 
            disabled={saving || !assessmentForm.vision_test_results.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Add Assessment
          </Button>
        </CardContent>
      </Card>

      {/* Existing Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Optician Assessment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <div className="space-y-4">
              {assessments.map((assessment) => {
                const staffMember = getStaffMember(assessment.optician_id);
                return (
                  <div key={assessment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            <Glasses className="h-3 w-3 mr-1" />
                            Vision Assessment
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAssessment(assessment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Vision Test Results:</p>
                        <p className="text-sm bg-muted p-2 rounded">{assessment.vision_test_results}</p>
                      </div>

                      {assessment.eye_pressure && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Eye Pressure:</p>
                          <Badge variant="outline">{assessment.eye_pressure} mmHg</Badge>
                        </div>
                      )}

                      {assessment.prescription_details && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Prescription Details:</p>
                          <p className="text-sm bg-muted p-2 rounded">{assessment.prescription_details}</p>
                        </div>
                      )}

                      {assessment.assessment_notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Assessment Notes:</p>
                          <p className="text-sm bg-muted p-2 rounded">{assessment.assessment_notes}</p>
                        </div>
                      )}

                      {staffMember && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {staffMember.first_name} {staffMember.last_name} {staffMember.specialization ? `(${staffMember.specialization})` : '(Doctor)'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No optician assessments recorded for this visit
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpticianTab;
