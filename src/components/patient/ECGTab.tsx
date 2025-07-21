import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  Plus, 
  Save,
  Trash2,
  User,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ECGTabProps {
  patientVisitId: string;
}

const ECGTab = ({ patientVisitId }: ECGTabProps) => {
  const [ecgResults, setEcgResults] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [ecgForm, setEcgForm] = useState({
    result: "",
    interpretation: "",
    notes: "",
    performed_by: ""
  });

  useEffect(() => {
    fetchData();
  }, [patientVisitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch ECG results
      const { data: ecgData, error: ecgError } = await supabase
        .from("ecg_results")
        .select("*")
        .eq("patient_visit_id", patientVisitId)
        .order("created_at", { ascending: false });

      if (ecgError) throw ecgError;

      // Fetch staff for dropdown (doctors and nurses who can perform ECG)
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, first_name, last_name, professional_capacity")
        .eq("is_active", true)
        .in("professional_capacity", ["doctor", "nurse", "registration_technician"]);

      if (staffError) throw staffError;

      setEcgResults(ecgData || []);
      setStaff(staffData || []);
    } catch (error) {
      console.error("Error fetching ECG data:", error);
      toast({
        title: "Error",
        description: "Failed to load ECG results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddECG = async () => {
    if (!ecgForm.result.trim()) return;

    try {
      setSaving(true);
      // Convert performed_by to null if empty string to avoid foreign key constraint
      const insertData = {
        ...ecgForm,
        patient_visit_id: patientVisitId,
        performed_by: ecgForm.performed_by || null
      };
      
      const { error } = await supabase
        .from("ecg_results")
        .insert(insertData);

      if (error) throw error;

      setEcgForm({
        result: "",
        interpretation: "",
        notes: "",
        performed_by: ""
      });
      
      await fetchData();
      toast({
        title: "Success",
        description: "ECG result added successfully.",
      });
    } catch (error) {
      console.error("Error adding ECG result:", error);
      toast({
        title: "Error",
        description: "Failed to add ECG result.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteECG = async (ecgId: string) => {
    try {
      const { error } = await supabase
        .from("ecg_results")
        .delete()
        .eq("id", ecgId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Success",
        description: "ECG result deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting ECG result:", error);
      toast({
        title: "Error",
        description: "Failed to delete ECG result.",
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
          <div className="text-lg font-medium">Loading ECG results...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New ECG Result */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New ECG Result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="result">ECG Result *</Label>
              <Select value={ecgForm.result} onValueChange={(value) => setEcgForm(prev => ({ ...prev, result: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ECG result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Abnormal">Abnormal</SelectItem>
                  <SelectItem value="Borderline">Borderline</SelectItem>
                  <SelectItem value="Inconclusive">Inconclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interpretation">Interpretation</Label>
              <Textarea
                id="interpretation"
                placeholder="Enter clinical interpretation of the ECG"
                value={ecgForm.interpretation}
                onChange={(e) => setEcgForm(prev => ({ ...prev, interpretation: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional observations or notes"
                value={ecgForm.notes}
                onChange={(e) => setEcgForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Performed By</Label>
              <Select 
                value={ecgForm.performed_by} 
                onValueChange={(value) => setEcgForm(prev => ({ ...prev, performed_by: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
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
              onClick={handleAddECG} 
              disabled={saving || !ecgForm.result}
            >
              <Save className="h-4 w-4 mr-2" />
              Add ECG Result
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing ECG Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            ECG Results History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ecgResults.length > 0 ? (
            <div className="space-y-4">
              {ecgResults.map((ecg) => {
                const staffMember = getStaffMember(ecg.performed_by);
                return (
                  <div key={ecg.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={ecg.result === 'Normal' ? 'default' : 
                                    ecg.result === 'Abnormal' ? 'destructive' : 'secondary'}
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            {ecg.result}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(ecg.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteECG(ecg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {ecg.interpretation && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Interpretation:</p>
                        <p className="text-sm bg-muted p-2 rounded">{ecg.interpretation}</p>
                      </div>
                    )}

                    {ecg.notes && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm bg-muted p-2 rounded">{ecg.notes}</p>
                      </div>
                    )}

                    {staffMember && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {staffMember.first_name} {staffMember.last_name} ({staffMember.professional_capacity})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No ECG results recorded for this visit
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ECGTab;
