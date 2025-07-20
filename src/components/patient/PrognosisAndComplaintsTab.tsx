import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  AlertTriangle, 
  Activity, 
  FileText, 
  Plus, 
  Save,
  Trash2,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PrognosisAndComplaintsTabProps {
  patientVisitId: string;
}

const PrognosisAndComplaintsTab = ({ patientVisitId }: PrognosisAndComplaintsTabProps) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [prognosis, setPrognosis] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form states
  const [newComplaint, setNewComplaint] = useState("");
  const [complaintSeverity, setComplaintSeverity] = useState("mild");
  const [prognosisForm, setPrognosisForm] = useState({
    diagnosis: "",
    treatment_plan: "",
    follow_up_required: false,
    follow_up_notes: "",
    doctor_id: ""
  });

  useEffect(() => {
    fetchData();
  }, [patientVisitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from("patient_complaints")
        .select("*")
        .eq("patient_visit_id", patientVisitId)
        .order("created_at", { ascending: false });

      if (complaintsError) throw complaintsError;

      // Fetch prognosis
      const { data: prognosisData, error: prognosisError } = await supabase
        .from("patient_prognosis")
        .select("*")
        .eq("patient_visit_id", patientVisitId)
        .maybeSingle();

      if (prognosisError && prognosisError.code !== 'PGRST116') throw prognosisError;

      // Fetch doctors for dropdown
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("id, first_name, last_name")
        .eq("is_active", true);

      if (doctorsError) throw doctorsError;

      setComplaints(complaintsData || []);
      setPrognosis(prognosisData);
      setDoctors(doctorsData || []);

      if (prognosisData) {
        setPrognosisForm({
          diagnosis: prognosisData.diagnosis || "",
          treatment_plan: prognosisData.treatment_plan || "",
          follow_up_required: prognosisData.follow_up_required || false,
          follow_up_notes: prognosisData.follow_up_notes || "",
          doctor_id: prognosisData.doctor_id || ""
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load patient data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComplaint = async () => {
    if (!newComplaint.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("patient_complaints")
        .insert({
          patient_visit_id: patientVisitId,
          complaint_text: newComplaint,
          severity: complaintSeverity
        });

      if (error) throw error;

      setNewComplaint("");
      setComplaintSeverity("mild");
      await fetchData();
      
      toast({
        title: "Success",
        description: "Complaint added successfully.",
      });
    } catch (error) {
      console.error("Error adding complaint:", error);
      toast({
        title: "Error",
        description: "Failed to add complaint.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    try {
      const { error } = await supabase
        .from("patient_complaints")
        .delete()
        .eq("id", complaintId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Success",
        description: "Complaint deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting complaint:", error);
      toast({
        title: "Error",
        description: "Failed to delete complaint.",
        variant: "destructive",
      });
    }
  };

  const handleSavePrognosis = async () => {
    try {
      setSaving(true);
      
      if (prognosis) {
        // Update existing prognosis
        const { error } = await supabase
          .from("patient_prognosis")
          .update(prognosisForm)
          .eq("id", prognosis.id);

        if (error) throw error;
      } else {
        // Create new prognosis
        const { error } = await supabase
          .from("patient_prognosis")
          .insert({
            ...prognosisForm,
            patient_visit_id: patientVisitId
          });

        if (error) throw error;
      }

      await fetchData();
      toast({
        title: "Success",
        description: "Prognosis saved successfully.",
      });
    } catch (error) {
      console.error("Error saving prognosis:", error);
      toast({
        title: "Error",
        description: "Failed to save prognosis.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Complaints Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Patient Complaints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new complaint */}
          <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="new-complaint">New Complaint</Label>
              <Textarea
                id="new-complaint"
                placeholder="Enter patient complaint..."
                value={newComplaint}
                onChange={(e) => setNewComplaint(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={complaintSeverity} onValueChange={setComplaintSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddComplaint} disabled={saving || !newComplaint.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Complaint
                </Button>
              </div>
            </div>
          </div>

          {/* List of complaints */}
          <div className="space-y-3">
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
                <div key={complaint.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant={complaint.severity === 'severe' ? 'destructive' : 
                                complaint.severity === 'moderate' ? 'default' : 'secondary'}
                      >
                        {complaint.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{complaint.complaint_text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComplaint(complaint.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No complaints recorded
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Patient Prognosis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Patient Prognosis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                placeholder="Enter diagnosis..."
                value={prognosisForm.diagnosis}
                onChange={(e) => setPrognosisForm(prev => ({ ...prev, diagnosis: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment-plan">Treatment Plan</Label>
              <Textarea
                id="treatment-plan"
                placeholder="Enter treatment plan..."
                value={prognosisForm.treatment_plan}
                onChange={(e) => setPrognosisForm(prev => ({ ...prev, treatment_plan: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Attending Doctor</Label>
                <Select 
                  value={prognosisForm.doctor_id} 
                  onValueChange={(value) => setPrognosisForm(prev => ({ ...prev, doctor_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="follow-up-required"
                  checked={prognosisForm.follow_up_required}
                  onCheckedChange={(checked) => setPrognosisForm(prev => ({ ...prev, follow_up_required: checked }))}
                />
                <Label htmlFor="follow-up-required">Follow-up Required</Label>
              </div>
            </div>

            {prognosisForm.follow_up_required && (
              <div className="space-y-2">
                <Label htmlFor="follow-up-notes">Follow-up Notes</Label>
                <Textarea
                  id="follow-up-notes"
                  placeholder="Enter follow-up instructions..."
                  value={prognosisForm.follow_up_notes}
                  onChange={(e) => setPrognosisForm(prev => ({ ...prev, follow_up_notes: e.target.value }))}
                />
              </div>
            )}

            <Button onClick={handleSavePrognosis} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {prognosis ? "Update Prognosis" : "Save Prognosis"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrognosisAndComplaintsTab;