import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pill, 
  Plus, 
  Save,
  Trash2,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionsTabProps {
  patientVisitId: string;
}

const PrescriptionsTab = ({ patientVisitId }: PrescriptionsTabProps) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    prescribed_by: ""
  });

  useEffect(() => {
    fetchData();
  }, [patientVisitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from("prescriptions")
        .select(`
          *,
          doctors:prescribed_by (
            id,
            first_name,
            last_name
          )
        `)
        .eq("patient_visit_id", patientVisitId)
        .order("created_at", { ascending: false });

      if (prescriptionsError) throw prescriptionsError;

      // Fetch doctors for dropdown
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("id, first_name, last_name")
        .eq("is_active", true);

      if (doctorsError) throw doctorsError;

      setPrescriptions(prescriptionsData || []);
      setDoctors(doctorsData || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrescription = async () => {
    if (!prescriptionForm.medication.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("prescriptions")
        .insert({
          ...prescriptionForm,
          patient_visit_id: patientVisitId
        });

      if (error) throw error;

      setPrescriptionForm({
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        prescribed_by: ""
      });
      
      await fetchData();
      toast({
        title: "Success",
        description: "Prescription added successfully.",
      });
    } catch (error) {
      console.error("Error adding prescription:", error);
      toast({
        title: "Error",
        description: "Failed to add prescription.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    try {
      const { error } = await supabase
        .from("prescriptions")
        .delete()
        .eq("id", prescriptionId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Success",
        description: "Prescription deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting prescription:", error);
      toast({
        title: "Error",
        description: "Failed to delete prescription.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-medium">Loading prescriptions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Prescription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Prescription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medication">Medication Name *</Label>
              <Input
                id="medication"
                placeholder="Enter medication name"
                value={prescriptionForm.medication}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, medication: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                placeholder="e.g., 500mg"
                value={prescriptionForm.dosage}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, dosage: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                placeholder="e.g., Twice daily"
                value={prescriptionForm.frequency}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, frequency: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 7 days"
                value={prescriptionForm.duration}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, duration: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Prescribed By</Label>
              <Select 
                value={prescriptionForm.prescribed_by} 
                onValueChange={(value) => setPrescriptionForm(prev => ({ ...prev, prescribed_by: value }))}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Additional instructions for the patient"
              value={prescriptionForm.instructions}
              onChange={(e) => setPrescriptionForm(prev => ({ ...prev, instructions: e.target.value }))}
            />
          </div>

          <Button 
            onClick={handleAddPrescription} 
            disabled={saving || !prescriptionForm.medication.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Add Prescription
          </Button>
        </CardContent>
      </Card>

      {/* Existing Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Current Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length > 0 ? (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{prescription.medication}</h4>
                      <div className="flex gap-2 mt-1">
                        {prescription.dosage && (
                          <Badge variant="outline">{prescription.dosage}</Badge>
                        )}
                        {prescription.frequency && (
                          <Badge variant="outline">{prescription.frequency}</Badge>
                        )}
                        {prescription.duration && (
                          <Badge variant="outline">{prescription.duration}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePrescription(prescription.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {prescription.instructions && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-1">Instructions:</p>
                      <p className="text-sm bg-muted p-2 rounded">{prescription.instructions}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {prescription.doctors && (
                        <>
                          <User className="h-3 w-3" />
                          Dr. {prescription.doctors.first_name} {prescription.doctors.last_name}
                        </>
                      )}
                    </div>
                    <span>
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No prescriptions recorded for this visit
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionsTab;
