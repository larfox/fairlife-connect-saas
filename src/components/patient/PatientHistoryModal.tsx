import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  MapPin, 
  Activity, 
  Heart, 
  Eye, 
  Pill, 
  Syringe, 
  Stethoscope,
  FileText,
  User
} from "lucide-react";
import PapSmearTab from "./PapSmearTab";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  medications: string | null;
}

interface PatientVisit {
  id: string;
  visit_date: string;
  status: string;
  queue_number: number;
  basic_screening_completed: boolean;
  event: {
    id: string;
    name: string;
    event_date: string;
    location: {
      name: string;
    };
  };
  patient: Patient;
}

interface ServiceRecord {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  service: {
    name: string;
    description: string | null;
  };
  doctor?: {
    first_name: string;
    last_name: string;
  };
  nurse?: {
    first_name: string;
    last_name: string;
  };
}

interface BasicScreening {
  id: string;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  blood_sugar: number | null;
  cholesterol: number | null;
  oxygen_saturation: number | null;
  notes: string | null;
  created_at: string;
  screened_by?: {
    first_name: string;
    last_name: string;
  };
}

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientVisit: PatientVisit;
}

const PatientHistoryModal = ({ isOpen, onClose, patientVisit }: PatientHistoryModalProps) => {
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [basicScreening, setBasicScreening] = useState<BasicScreening | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDetailedHistory = async () => {
    if (!patientVisit) return;

    try {
      // Fetch service records
      const { data: serviceData, error: serviceError } = await supabase
        .from("service_queue")
        .select(`
          *,
          services (
            name,
            description
          ),
          doctors (
            first_name,
            last_name
          ),
          nurses (
            first_name,
            last_name
          )
        `)
        .eq("patient_visit_id", patientVisit.id)
        .order("created_at", { ascending: false });

      if (serviceError) throw serviceError;

      // Fetch basic screening data
      const { data: screeningData, error: screeningError } = await supabase
        .from("basic_screening")
        .select(`
          *,
          staff (
            first_name,
            last_name
          )
        `)
        .eq("patient_visit_id", patientVisit.id)
        .single();

      if (screeningError && screeningError.code !== 'PGRST116') {
        console.error("Error fetching screening:", screeningError);
      }

      // Transform service data to match interface
      const transformedServiceData: ServiceRecord[] = (serviceData || []).map(record => ({
        id: record.id,
        status: record.status,
        created_at: record.created_at,
        completed_at: record.completed_at,
        service: record.services,
        doctor: record.doctors,
        nurse: record.nurses
      }));

      setServiceRecords(transformedServiceData);
      // Transform screening data to match interface
      const transformedScreeningData = screeningData ? {
        ...screeningData,
        screened_by: screeningData.staff
      } : null;
      
      setBasicScreening(transformedScreeningData);
    } catch (error) {
      console.error("Error fetching detailed history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch detailed patient history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patientVisit) {
      setLoading(true);
      fetchDetailedHistory();
    }
  }, [isOpen, patientVisit]);

  if (!patientVisit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>
              Patient History - {patientVisit.patient.first_name} {patientVisit.patient.last_name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient & Visit Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Patient Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span> {patientVisit.patient.first_name} {patientVisit.patient.last_name}
                </div>
                {patientVisit.patient.date_of_birth && (
                  <div>
                    <span className="font-medium">Date of Birth:</span> {format(new Date(patientVisit.patient.date_of_birth), "MMM dd, yyyy")}
                  </div>
                )}
                {patientVisit.patient.gender && (
                  <div>
                    <span className="font-medium">Gender:</span> {patientVisit.patient.gender}
                  </div>
                )}
                {patientVisit.patient.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {patientVisit.patient.phone}
                  </div>
                )}
                {patientVisit.patient.email && (
                  <div>
                    <span className="font-medium">Email:</span> {patientVisit.patient.email}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Visit Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Event:</span> {patientVisit.event.name}
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span className="font-medium">Location:</span> {patientVisit.event.location.name}
                </div>
                <div>
                  <span className="font-medium">Visit Date:</span> {format(new Date(patientVisit.visit_date), "MMM dd, yyyy")}
                </div>
                <div>
                  <span className="font-medium">Queue Number:</span> #{patientVisit.queue_number}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={patientVisit.status === "completed" ? "default" : "secondary"}>
                    {patientVisit.status?.replace('_', ' ').toUpperCase() || "CHECKED IN"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="screening">Basic Screening</TabsTrigger>
              <TabsTrigger value="pap-smears">PAP Smears</TabsTrigger>
              <TabsTrigger value="medical">Medical Info</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Services Received</span>
                  </CardTitle>
                  <CardDescription>
                    Services assigned and completed during this visit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading services...</div>
                  ) : serviceRecords.length > 0 ? (
                    <div className="space-y-3">
                      {serviceRecords.map((service) => (
                        <div key={service.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{service.service.name}</h4>
                            <Badge variant={service.status === "completed" ? "default" : "secondary"}>
                              {service.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          {service.service.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {service.service.description}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Started: {format(new Date(service.created_at), "MMM dd, yyyy 'at' h:mm a")}</div>
                            {service.completed_at && (
                              <div>Completed: {format(new Date(service.completed_at), "MMM dd, yyyy 'at' h:mm a")}</div>
                            )}
                            {service.doctor && (
                              <div>Doctor: {service.doctor.first_name} {service.doctor.last_name}</div>
                            )}
                            {service.nurse && (
                              <div>Nurse: {service.nurse.first_name} {service.nurse.last_name}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No services recorded for this visit
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="screening" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Basic Health Screening</span>
                  </CardTitle>
                  <CardDescription>
                    Vital signs and basic health measurements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading screening data...</div>
                  ) : basicScreening ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {basicScreening.height && (
                        <div className="space-y-1">
                          <span className="font-medium">Height:</span>
                          <p>{basicScreening.height} cm</p>
                        </div>
                      )}
                      {basicScreening.weight && (
                        <div className="space-y-1">
                          <span className="font-medium">Weight:</span>
                          <p>{basicScreening.weight} kg</p>
                        </div>
                      )}
                      {basicScreening.bmi && (
                        <div className="space-y-1">
                          <span className="font-medium">BMI:</span>
                          <p>{basicScreening.bmi}</p>
                        </div>
                      )}
                      {(basicScreening.blood_pressure_systolic && basicScreening.blood_pressure_diastolic) && (
                        <div className="space-y-1">
                          <span className="font-medium">Blood Pressure:</span>
                          <p>{basicScreening.blood_pressure_systolic}/{basicScreening.blood_pressure_diastolic} mmHg</p>
                        </div>
                      )}
                      {basicScreening.heart_rate && (
                        <div className="space-y-1">
                          <span className="font-medium">Heart Rate:</span>
                          <p>{basicScreening.heart_rate} bpm</p>
                        </div>
                      )}
                      {basicScreening.temperature && (
                        <div className="space-y-1">
                          <span className="font-medium">Temperature:</span>
                          <p>{basicScreening.temperature}°C</p>
                        </div>
                      )}
                      {basicScreening.blood_sugar && (
                        <div className="space-y-1">
                          <span className="font-medium">Blood Sugar:</span>
                          <p>{basicScreening.blood_sugar} mg/dL</p>
                        </div>
                      )}
                      {basicScreening.cholesterol && (
                        <div className="space-y-1">
                          <span className="font-medium">Cholesterol:</span>
                          <p>{basicScreening.cholesterol} mg/dL</p>
                        </div>
                      )}
                      {basicScreening.oxygen_saturation && (
                        <div className="space-y-1">
                          <span className="font-medium">Oxygen Saturation:</span>
                          <p>{basicScreening.oxygen_saturation}%</p>
                        </div>
                      )}
                      {basicScreening.notes && (
                        <div className="space-y-1 md:col-span-2">
                          <span className="font-medium">Notes:</span>
                          <p className="text-sm">{basicScreening.notes}</p>
                        </div>
                      )}
                      {basicScreening.screened_by && (
                        <div className="space-y-1 md:col-span-2">
                          <span className="font-medium">Screened by:</span>
                          <p>{basicScreening.screened_by.first_name} {basicScreening.screened_by.last_name}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No basic screening data recorded for this visit
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pap-smears" className="space-y-4">
              <PapSmearTab patientVisitId={patientVisit.id} />
            </TabsContent>

            <TabsContent value="medical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Stethoscope className="h-4 w-4" />
                    <span>Medical Information</span>
                  </CardTitle>
                  <CardDescription>
                    Patient's medical history and current conditions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patientVisit.patient.medical_conditions && (
                    <div>
                      <h4 className="font-medium mb-2">Medical Conditions:</h4>
                      <p className="text-sm bg-muted p-3 rounded">{patientVisit.patient.medical_conditions}</p>
                    </div>
                  )}
                  {patientVisit.patient.allergies && (
                    <div>
                      <h4 className="font-medium mb-2">Allergies:</h4>
                      <p className="text-sm bg-muted p-3 rounded">{patientVisit.patient.allergies}</p>
                    </div>
                  )}
                  {patientVisit.patient.medications && (
                    <div>
                      <h4 className="font-medium mb-2">Current Medications:</h4>
                      <p className="text-sm bg-muted p-3 rounded">{patientVisit.patient.medications}</p>
                    </div>
                  )}
                  {(!patientVisit.patient.medical_conditions && !patientVisit.patient.allergies && !patientVisit.patient.medications) && (
                    <div className="text-center py-4 text-muted-foreground">
                      No medical information recorded
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Visit Timeline</span>
                  </CardTitle>
                  <CardDescription>
                    Chronological order of events during this visit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading timeline...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Visit Check-in */}
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Patient Check-in</p>
                          <p className="text-sm text-muted-foreground">
                            Queue #{patientVisit.queue_number} - {format(new Date(patientVisit.visit_date), "h:mm a")}
                          </p>
                        </div>
                      </div>

                      {/* Basic Screening */}
                      {basicScreening && (
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium">Basic Health Screening</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(basicScreening.created_at), "h:mm a")}
                              {basicScreening.screened_by && ` - ${basicScreening.screened_by.first_name} ${basicScreening.screened_by.last_name}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Service Records */}
                      {serviceRecords.map((service) => (
                        <div key={service.id} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${service.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <div>
                            <p className="font-medium">{service.service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Started: {format(new Date(service.created_at), "h:mm a")}
                              {service.completed_at && ` | Completed: ${format(new Date(service.completed_at), "h:mm a")}`}
                            </p>
                          </div>
                        </div>
                      ))}

                      {(serviceRecords.length === 0 && !basicScreening) && (
                        <div className="text-center py-4 text-muted-foreground">
                          No timeline events recorded for this visit
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientHistoryModal;