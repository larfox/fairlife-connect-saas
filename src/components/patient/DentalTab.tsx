import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Smile, 
  Plus, 
  Save,
  Trash2,
  User,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DentalTabProps {
  patientVisitId: string;
}

const DentalTab = ({ patientVisitId }: DentalTabProps) => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [assessmentForm, setAssessmentForm] = useState({
    oral_health_assessment: "",
    teeth_condition: "",
    gum_health: "",
    assessment_notes: "",
    recommendations: "",
    dental_professional_id: ""
  });

  useEffect(() => {
    fetchData();
  }, [patientVisitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch dental assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("dental_assessments")
        .select("*")
        .eq("patient_visit_id", patientVisitId)
        .order("created_at", { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Fetch staff for dropdown (dentists and doctors who can perform dental exams)
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, first_name, last_name, professional_capacity")
        .eq("is_active", true)
        .in("professional_capacity", ["doctor", "dentist", "dental_technician"]);

      if (staffError) throw staffError;

      setAssessments(assessmentsData || []);
      setStaff(staffData || []);
    } catch (error) {
      console.error("Error fetching dental data:", error);
      toast({
        title: "Error",
        description: "Failed to load dental assessments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssessment = async () => {
    if (!assessmentForm.oral_health_assessment.trim()) return;

    try {
      setSaving(true);
      // Convert dental_professional_id to null if empty string to avoid constraint issues
      const insertData = {
        ...assessmentForm,
        patient_visit_id: patientVisitId,
        dental_professional_id: assessmentForm.dental_professional_id || null
      };
      
      const { error } = await supabase
        .from("dental_assessments")
        .insert(insertData);

      if (error) throw error;

      setAssessmentForm({
        oral_health_assessment: "",
        teeth_condition: "",
        gum_health: "",
        assessment_notes: "",
        recommendations: "",
        dental_professional_id: ""
      });
      
      await fetchData();
      toast({
        title: "Success",
        description: "Dental assessment added successfully.",
      });
    } catch (error) {
      console.error("Error adding assessment:", error);
      toast({
        title: "Error",
        description: "Failed to add dental assessment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      const { error } = await supabase
        .from("dental_assessments")
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
          <div className="text-lg font-medium">Loading dental assessments...</div>
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
            Add New Dental Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oral-health">Overall Oral Health Assessment *</Label>
            <Select 
              value={assessmentForm.oral_health_assessment} 
              onValueChange={(value) => setAssessmentForm(prev => ({ ...prev, oral_health_assessment: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select overall oral health status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
                <SelectItem value="Needs Immediate Attention">Needs Immediate Attention</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teeth-condition">Teeth Condition</Label>
              <Textarea
                id="teeth-condition"
                placeholder="Describe condition of teeth (cavities, missing teeth, etc.)"
                value={assessmentForm.teeth_condition}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, teeth_condition: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gum-health">Gum Health</Label>
              <Textarea
                id="gum-health"
                placeholder="Describe gum condition (gingivitis, bleeding, etc.)"
                value={assessmentForm.gum_health}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, gum_health: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessment-notes">Assessment Notes</Label>
            <Textarea
              id="assessment-notes"
              placeholder="Additional clinical observations and findings"
              value={assessmentForm.assessment_notes}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, assessment_notes: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              placeholder="Treatment recommendations and oral hygiene advice"
              value={assessmentForm.recommendations}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, recommendations: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Examined By</Label>
            <Select 
              value={assessmentForm.dental_professional_id} 
              onValueChange={(value) => setAssessmentForm(prev => ({ ...prev, dental_professional_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dental professional" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name} ({member.professional_capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddAssessment} 
            disabled={saving || !assessmentForm.oral_health_assessment}
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
            <Smile className="h-5 w-5" />
            Dental Assessment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <div className="space-y-4">
              {assessments.map((assessment) => {
                const staffMember = getStaffMember(assessment.dental_professional_id);
                return (
                  <div key={assessment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={assessment.oral_health_assessment === 'Excellent' ? 'default' : 
                                    assessment.oral_health_assessment === 'Good' ? 'secondary' :
                                    assessment.oral_health_assessment === 'Needs Immediate Attention' ? 'destructive' : 'outline'}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {assessment.oral_health_assessment}
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
                      {assessment.teeth_condition && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Teeth Condition:</p>
                          <p className="text-sm bg-muted p-2 rounded">{assessment.teeth_condition}</p>
                        </div>
                      )}

                      {assessment.gum_health && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Gum Health:</p>
                          <p className="text-sm bg-muted p-2 rounded">{assessment.gum_health}</p>
                        </div>
                      )}

                      {assessment.assessment_notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Assessment Notes:</p>
                          <p className="text-sm bg-muted p-2 rounded">{assessment.assessment_notes}</p>
                        </div>
                      )}

                      {assessment.recommendations && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Recommendations:</p>
                          <p className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded border-l-4 border-blue-500">
                            {assessment.recommendations}
                          </p>
                        </div>
                      )}

                      {staffMember && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {staffMember.first_name} {staffMember.last_name} ({staffMember.professional_capacity})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No dental assessments recorded for this visit
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DentalTab;
