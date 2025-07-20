
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Trash2, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PapSmearAssessment {
  id: string;
  assessment_date: string;
  comments: string | null;
  findings: string | null;
  recommendations: string | null;
  performed_by_doctor_id: string | null;
  performed_by_nurse_id: string | null;
  created_at: string;
  doctor?: {
    first_name: string;
    last_name: string;
  };
  nurse?: {
    first_name: string;
    last_name: string;
  };
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface Nurse {
  id: string;
  first_name: string;
  last_name: string;
}

interface PapSmearTabProps {
  patientVisitId: string;
  eventDate?: string;
}

const PapSmearTab = ({ patientVisitId, eventDate }: PapSmearTabProps) => {
  const [assessments, setAssessments] = useState<PapSmearAssessment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    comments: "",
    findings: "",
    recommendations: "",
    date: eventDate ? new Date(eventDate) : new Date(),
    performed_by_doctor_id: "",
    performed_by_nurse_id: "",
  });
  const { toast } = useToast();

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("pap_smear_assessments")
        .select(`
          *,
          doctors!fk_pap_smear_doctor (
            first_name,
            last_name
          ),
          nurses!fk_pap_smear_nurse (
            first_name,
            last_name
          )
        `)
        .eq("patient_visit_id", patientVisitId)
        .order("assessment_date", { ascending: false });

      if (error) throw error;

      const transformedData: PapSmearAssessment[] = (data || []).map(record => ({
        ...record,
        doctor: record.doctors,
        nurse: record.nurses
      }));

      setAssessments(transformedData);
    } catch (error) {
      console.error("Error fetching PAP smear assessments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch PAP smear assessments",
        variant: "destructive",
      });
    }
  };

  const fetchHealthProfessionals = async () => {
    try {
      const [doctorsResponse, nursesResponse] = await Promise.all([
        supabase.from("doctors").select("id, first_name, last_name").eq("is_active", true),
        supabase.from("nurses").select("id, first_name, last_name").eq("is_active", true)
      ]);

      if (doctorsResponse.error) throw doctorsResponse.error;
      if (nursesResponse.error) throw nursesResponse.error;

      setDoctors(doctorsResponse.data || []);
      setNurses(nursesResponse.data || []);
    } catch (error) {
      console.error("Error fetching health professionals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch health professionals",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAssessments(), fetchHealthProfessionals()]);
      setLoading(false);
    };
    
    loadData();
  }, [patientVisitId]);

  const resetForm = () => {
    setFormData({
      comments: "",
      findings: "",
      recommendations: "",
      date: eventDate ? new Date(eventDate) : new Date(),
      performed_by_doctor_id: "",
      performed_by_nurse_id: "",
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing assessment
        const { error } = await supabase
          .from("pap_smear_assessments")
          .update({
            comments: formData.comments || null,
            findings: formData.findings || null,
            recommendations: formData.recommendations || null,
            assessment_date: formData.date.toISOString(),
            performed_by_doctor_id: formData.performed_by_doctor_id || null,
            performed_by_nurse_id: formData.performed_by_nurse_id || null,
          })
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "PAP smear assessment updated successfully",
        });
      } else {
        // Create new assessment
        const { error } = await supabase
          .from("pap_smear_assessments")
          .insert({
            patient_visit_id: patientVisitId,
            comments: formData.comments || null,
            findings: formData.findings || null,
            recommendations: formData.recommendations || null,
            assessment_date: formData.date.toISOString(),
            performed_by_doctor_id: formData.performed_by_doctor_id || null,
            performed_by_nurse_id: formData.performed_by_nurse_id || null,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "PAP smear assessment created successfully",
        });
      }

      resetForm();
      fetchAssessments();
    } catch (error) {
      console.error("Error saving PAP smear assessment:", error);
      toast({
        title: "Error",
        description: "Failed to save PAP smear assessment",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (assessment: PapSmearAssessment) => {
    setFormData({
      comments: assessment.comments || "",
      findings: assessment.findings || "",
      recommendations: assessment.recommendations || "",
      date: new Date(assessment.assessment_date),
      performed_by_doctor_id: assessment.performed_by_doctor_id || "",
      performed_by_nurse_id: assessment.performed_by_nurse_id || "",
    });
    setEditingId(assessment.id);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pap_smear_assessments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "PAP smear assessment deleted successfully",
      });

      fetchAssessments();
    } catch (error) {
      console.error("Error deleting PAP smear assessment:", error);
      toast({
        title: "Error",
        description: "Failed to delete PAP smear assessment",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading PAP smear assessments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>PAP Smear Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Assessment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor">Performing Doctor</Label>
              <Select
                value={formData.performed_by_doctor_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, performed_by_doctor_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nurse">Performing Nurse</Label>
              <Select
                value={formData.performed_by_nurse_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, performed_by_nurse_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nurse" />
                </SelectTrigger>
                <SelectContent>
                  {nurses.map((nurse) => (
                    <SelectItem key={nurse.id} value={nurse.id}>
                      {nurse.first_name} {nurse.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="findings">Findings</Label>
            <Textarea
              id="findings"
              placeholder="Enter clinical findings..."
              value={formData.findings}
              onChange={(e) =>
                setFormData({ ...formData, findings: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              placeholder="Enter recommendations and follow-up instructions..."
              value={formData.recommendations}
              onChange={(e) =>
                setFormData({ ...formData, recommendations: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments</Label>
            <Textarea
              id="comments"
              placeholder="Enter additional comments..."
              value={formData.comments}
              onChange={(e) =>
                setFormData({ ...formData, comments: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Save"} Assessment
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {assessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Assessments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">PAP Smear Assessment</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {format(new Date(assessment.assessment_date), "MMM dd, yyyy")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(assessment)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(assessment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {assessment.doctor && (
                    <div>
                      <span className="font-medium">Doctor:</span> {assessment.doctor.first_name} {assessment.doctor.last_name}
                    </div>
                  )}
                  {assessment.nurse && (
                    <div>
                      <span className="font-medium">Nurse:</span> {assessment.nurse.first_name} {assessment.nurse.last_name}
                    </div>
                  )}
                  {assessment.findings && (
                    <div>
                      <span className="font-medium">Findings:</span>
                      <p className="text-muted-foreground mt-1">{assessment.findings}</p>
                    </div>
                  )}
                  {assessment.recommendations && (
                    <div>
                      <span className="font-medium">Recommendations:</span>
                      <p className="text-muted-foreground mt-1">{assessment.recommendations}</p>
                    </div>
                  )}
                  {assessment.comments && (
                    <div>
                      <span className="font-medium">Comments:</span>
                      <p className="text-muted-foreground mt-1">{assessment.comments}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Recorded: {format(new Date(assessment.created_at), "MMM dd, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PapSmearTab;
