import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserCog, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { ServiceSelectionForm } from "./forms/ServiceSelectionForm";
import { Combobox } from "@/components/ui/combobox";

type Parish = Tables<"parishes">;
type Town = Tables<"towns">;
type Service = Tables<"services">;

interface PatientEditModalProps {
  patient: any;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated: () => void;
  selectedEvent: any;
}

interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  parish_id: string;
  town_id: string;
  town_name: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string;
  allergies: string;
  medications: string;
  insurance_provider: string;
  insurance_number: string;
}

export const PatientEditModal = ({ patient, isOpen, onClose, onPatientUpdated, selectedEvent }: PatientEditModalProps) => {
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    email: "",
    parish_id: "",
    town_id: "",
    town_name: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    allergies: "",
    medications: "",
    insurance_provider: "",
    insurance_number: ""
  });
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customTownName, setCustomTownName] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [knowYourNumbersServiceId, setKnowYourNumbersServiceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && patient) {
      setFormData({
        first_name: patient.first_name || "",
        last_name: patient.last_name || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
        phone: patient.phone || "",
        email: patient.email || "",
        parish_id: patient.parish_id || "",
        town_id: patient.town_id || "",
        town_name: patient.town_name || "",
        emergency_contact_name: patient.emergency_contact_name || "",
        emergency_contact_phone: patient.emergency_contact_phone || "",
        medical_conditions: patient.medical_conditions || "",
        allergies: patient.allergies || "",
        medications: patient.medications || "",
        insurance_provider: patient.insurance_provider || "",
        insurance_number: patient.insurance_number || ""
      });
      fetchParishes();
      fetchServices();
      fetchPatientServices();
    }
  }, [isOpen, patient]);

  useEffect(() => {
    if (formData.parish_id) {
      fetchTowns(formData.parish_id);
    }
  }, [formData.parish_id]);

  const fetchParishes = async () => {
    try {
      const { data, error } = await supabase
        .from("parishes")
        .select("*")
        .order("name");

      if (error) throw error;
      setParishes(data || []);
    } catch (error) {
      console.error("Error fetching parishes:", error);
    }
  };

  const fetchTowns = async (parishId: string) => {
    try {
      const { data, error } = await supabase
        .from("towns")
        .select("*")
        .eq("parish_id", parishId)
        .order("name");

      if (error) throw error;
      setTowns(data || []);
    } catch (error) {
      console.error("Error fetching towns:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setServices(data || []);

      // Find "Know Your Numbers" service
      const kynService = data?.find(service => 
        service.name.toLowerCase().includes("know your numbers")
      );
      if (kynService) {
        setKnowYourNumbersServiceId(kynService.id);
        
        // Auto-select "Know Your Numbers" if not already selected
        setSelectedServices(prev => {
          if (!prev.includes(kynService.id)) {
            return [...prev, kynService.id];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchPatientServices = async () => {
    if (!patient?.id || !selectedEvent?.id) return;

    try {
      // Get patient visit for this event
      const { data: visitData, error: visitError } = await supabase
        .from("patient_visits")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("event_id", selectedEvent.id)
        .single();

      if (visitError || !visitData) return;

      // Get service queue entries for this patient visit
      const { data: queueData, error: queueError } = await supabase
        .from("service_queue")
        .select("service_id")
        .eq("patient_visit_id", visitData.id);

      if (queueError) throw queueError;

      const serviceIds = queueData?.map(item => item.service_id) || [];
      
      // Always ensure "Know Your Numbers" is selected if we have that service ID
      const updatedServiceIds = [...serviceIds];
      if (knowYourNumbersServiceId && !updatedServiceIds.includes(knowYourNumbersServiceId)) {
        updatedServiceIds.push(knowYourNumbersServiceId);
      }
      
      setSelectedServices(updatedServiceIds);
    } catch (error) {
      console.error("Error fetching patient services:", error);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    // Don't allow toggling of "Know Your Numbers" service
    if (serviceId === knowYourNumbersServiceId) return;

    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name) {
      toast({
        title: "Missing information",
        description: "Please provide at least first and last name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Updating patient with data:", formData);
      console.log("Patient ID:", patient.id);
      
      const updateData = {
        ...formData,
        parish_id: formData.parish_id || null,
        town_id: formData.town_id || null,
        date_of_birth: formData.date_of_birth || null,
      };
      
      console.log("Update data being sent:", updateData);
      
      const { error } = await supabase
        .from("patients")
        .update(updateData)
        .eq("id", patient.id);

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log("Patient update successful");

      // Update service selections if patient has a visit for this event
      const { data: visitData, error: visitError } = await supabase
        .from("patient_visits")
        .select("id")
        .eq("patient_id", patient.id)
        .eq("event_id", selectedEvent.id)
        .single();

      if (visitData && !visitError) {
        // Check if patient has completed "Know Your Numbers" before deleting
        const { data: kynStatus } = await supabase
          .from("service_queue")
          .select("status")
          .eq("patient_visit_id", visitData.id)
          .eq("service_id", knowYourNumbersServiceId)
          .maybeSingle();
          
        const kynCompleted = kynStatus?.status === 'completed';

        // Delete existing service queue entries
        const { error: deleteError } = await supabase
          .from("service_queue")
          .delete()
          .eq("patient_visit_id", visitData.id);

        if (deleteError) throw deleteError;

        // Add new service queue entries
        // First, always add "Know Your Numbers" service
        const queueEntriesToAdd = [];
        
        if (knowYourNumbersServiceId) {
          queueEntriesToAdd.push({
            patient_visit_id: visitData.id,
            service_id: knowYourNumbersServiceId,
            status: kynCompleted ? 'completed' : 'waiting'
          });
        }
        
        // Add other services only if "Know Your Numbers" is completed or not required
        if (kynCompleted || !knowYourNumbersServiceId) {
          selectedServices.forEach(serviceId => {
            if (serviceId !== knowYourNumbersServiceId) {
              queueEntriesToAdd.push({
                patient_visit_id: visitData.id,
                service_id: serviceId,
                status: 'waiting'
              });
            }
          });
        }

        if (queueEntriesToAdd.length > 0) {
          const { error: insertError } = await supabase
            .from("service_queue")
            .insert(queueEntriesToAdd
            );

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Patient updated",
        description: "Patient information has been successfully updated.",
      });

      onPatientUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Update failed",
        description: "Failed to update patient information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Edit Patient Information
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => updateFormData("first_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => updateFormData("last_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => updateFormData("date_of_birth", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="(876) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="patient@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parish">Parish</Label>
                  <Select value={formData.parish_id} onValueChange={(value) => updateFormData("parish_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parish" />
                    </SelectTrigger>
                    <SelectContent>
                      {parishes.map((parish) => (
                        <SelectItem key={parish.id} value={parish.id}>
                          {parish.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="town">Town/Community</Label>
                  <Combobox
                    options={towns.map(town => ({ value: town.id, label: town.name }))}
                    value={formData.town_id || formData.town_name}
                    onValueChange={(value) => {
                      // Check if it's an existing town ID or a custom town name
                      const existingTown = towns.find(town => town.id === value);
                      if (existingTown) {
                        updateFormData("town_id", value);
                        updateFormData("town_name", "");
                      } else {
                        updateFormData("town_id", "");
                        updateFormData("town_name", value);
                      }
                    }}
                    placeholder="Select or type town/community"
                    searchPlaceholder="Search towns or type custom..."
                    disabled={!formData.parish_id}
                    allowCustom={true}
                    customLabel="Add custom town"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => updateFormData("emergency_contact_name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => updateFormData("emergency_contact_phone", e.target.value)}
                    placeholder="(876) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => updateFormData("medical_conditions", e.target.value)}
                  placeholder="List any known medical conditions..."
                />
              </div>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => updateFormData("allergies", e.target.value)}
                  placeholder="List any known allergies..."
                />
              </div>
              <div>
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => updateFormData("medications", e.target.value)}
                  placeholder="List current medications..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insurance_provider">Insurance Provider</Label>
                  <Input
                    id="insurance_provider"
                    value={formData.insurance_provider}
                    onChange={(e) => updateFormData("insurance_provider", e.target.value)}
                    placeholder="Insurance company name"
                  />
                </div>
                <div>
                  <Label htmlFor="insurance_number">Insurance Number</Label>
                  <Input
                    id="insurance_number"
                    value={formData.insurance_number}
                    onChange={(e) => updateFormData("insurance_number", e.target.value)}
                    placeholder="Policy or member number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Services</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceSelectionForm
                services={services}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceToggle}
                knowYourNumbersServiceId={knowYourNumbersServiceId}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};