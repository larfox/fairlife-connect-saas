import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, User, Plus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

interface PatientRegistrationProps {
  selectedEvent: any;
  onRegistrationComplete: () => void;
}

type Service = Tables<"services">;
type Parish = Tables<"parishes">;
type Town = Tables<"towns">;

const PatientRegistration = ({ selectedEvent, onRegistrationComplete }: PatientRegistrationProps) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const { toast } = useToast();

  const [patientData, setPatientData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    email: "",
    parish_id: "",
    town_id: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    allergies: "",
    medications: "",
    insurance_provider: "",
    insurance_number: ""
  });

  useEffect(() => {
    fetchServices();
    fetchParishes();
    fetchTowns();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast({
        title: "Error fetching services",
        description: "Failed to load available services.",
        variant: "destructive",
      });
    }
  };

  const fetchParishes = async () => {
    try {
      const { data, error } = await supabase
        .from("parishes")
        .select("*")
        .order("name");

      if (error) throw error;
      setParishes(data || []);
    } catch (error) {
      toast({
        title: "Error fetching parishes",
        description: "Failed to load parishes.",
        variant: "destructive",
      });
    }
  };

  const fetchTowns = async () => {
    try {
      const { data, error } = await supabase
        .from("towns")
        .select("*")
        .order("name");

      if (error) throw error;
      setTowns(data || []);
    } catch (error) {
      toast({
        title: "Error fetching towns",
        description: "Failed to load towns.",
        variant: "destructive",
      });
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleRegisterPatient = async () => {
    if (!patientData.first_name || !patientData.last_name) {
      toast({
        title: "Missing information",
        description: "Please provide at least first and last name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert([{
          ...patientData,
          event_id: selectedEvent.id
        }])
        .select()
        .single();

      if (patientError) throw patientError;

      // Get next queue number
      const { data: existingVisits, error: visitsError } = await supabase
        .from("patient_visits")
        .select("queue_number")
        .eq("event_id", selectedEvent.id)
        .order("queue_number", { ascending: false })
        .limit(1);

      if (visitsError) throw visitsError;

      const nextQueueNumber = (existingVisits?.[0]?.queue_number || 0) + 1;

      // Create patient visit record
      const { data: visit, error: visitError } = await supabase
        .from("patient_visits")
        .insert([{
          patient_id: patient.id,
          event_id: selectedEvent.id,
          queue_number: nextQueueNumber,
          status: 'checked_in'
        }])
        .select()
        .single();

      if (visitError) throw visitError;

      // Add selected services to queue
      if (selectedServices.length > 0) {
        const serviceQueueEntries = selectedServices.map((serviceId, index) => ({
          patient_visit_id: visit.id,
          service_id: serviceId,
          queue_position: index + 1,
          status: 'waiting'
        }));

        const { error: serviceError } = await supabase
          .from("service_queue")
          .insert(serviceQueueEntries);

        if (serviceError) throw serviceError;
      }

      toast({
        title: "Patient registered successfully",
        description: `${patient.first_name} ${patient.last_name} has been assigned queue number ${nextQueueNumber}.`,
      });

      // Reset form
      setPatientData({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "",
        phone: "",
        email: "",
        parish_id: "",
        town_id: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        medical_conditions: "",
        allergies: "",
        medications: "",
        insurance_provider: "",
        insurance_number: ""
      });
      setSelectedServices([]);
      onRegistrationComplete();

    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={patientData.first_name}
                onChange={(e) => setPatientData({...patientData, first_name: e.target.value})}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={patientData.last_name}
                onChange={(e) => setPatientData({...patientData, last_name: e.target.value})}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={patientData.date_of_birth}
                onChange={(e) => setPatientData({...patientData, date_of_birth: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={patientData.gender} onValueChange={(value) => setPatientData({...patientData, gender: value})}>
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
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={patientData.phone}
                onChange={(e) => setPatientData({...patientData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={patientData.email}
                onChange={(e) => setPatientData({...patientData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parish">Parish</Label>
              <Select value={patientData.parish_id} onValueChange={(value) => setPatientData({...patientData, parish_id: value})}>
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
          </div>

          <Separator />

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Medical Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={patientData.allergies}
                onChange={(e) => setPatientData({...patientData, allergies: e.target.value})}
                placeholder="List any known allergies"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <Textarea
                  id="medical_conditions"
                  value={patientData.medical_conditions}
                  onChange={(e) => setPatientData({...patientData, medical_conditions: e.target.value})}
                  placeholder="List current medical conditions"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  value={patientData.medications}
                  onChange={(e) => setPatientData({...patientData, medications: e.target.value})}
                  placeholder="List current medications"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Select Services
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                      {service.duration_minutes && (
                        <Badge variant="outline" className="mt-1">
                          {service.duration_minutes} min
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleRegisterPatient} 
              disabled={loading}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {loading ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientRegistration;