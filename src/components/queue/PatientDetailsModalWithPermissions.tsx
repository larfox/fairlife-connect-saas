import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  AlertTriangle, 
  Heart, 
  FileText, 
  Activity,
  Pill,
  Zap,
  Eye,
  Smile,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { useUser } from "@/contexts/UserContext";
import PapSmearTab from "../patient/PapSmearTab";
import BasicScreeningTab from "../patient/BasicScreeningTab";
import ServiceRecordsTab from "../patient/ServiceRecordsTab";
import PrognosisAndComplaintsTab from "../patient/PrognosisAndComplaintsTab";
import PrescriptionsTab from "../patient/PrescriptionsTab";
import ECGTab from "../patient/ECGTab";
import OpticianTab from "../patient/OpticianTab";
import DentalTab from "../patient/DentalTab";
import BackToSchoolTab from "../patient/BackToSchoolTab";

interface PatientDetailsModalProps {
  patient: any;
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PatientDetailsModalWithPermissions = ({ patient, eventId, isOpen, onClose }: PatientDetailsModalProps) => {
  const { user } = useUser();
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentVisit, setCurrentVisit] = useState<any>(null);
  const [patientServices, setPatientServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const permissions = useStaffPermissions(user);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return 'Not provided';
    
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return `${age} years old`;
  };

  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.email) {
        // Fetch user's name from staff table
        const { data: staff } = await supabase
          .from('staff')
          .select('first_name, last_name')
          .eq('email', user.email)
          .single();
        
        if (staff) {
          setCurrentUserName(`${staff.first_name} ${staff.last_name}`);
        } else {
          setCurrentUserName(user.email);
        }
      }
    };
    fetchUserName();
  }, [user]);

  useEffect(() => {
    if (isOpen && patient) {
      fetchCurrentVisit();
    }
  }, [isOpen, patient, eventId]);

  const fetchCurrentVisit = async () => {
    try {
      setLoading(true);
      
      // Find current visit for this event
      const { data: visits, error: visitsError } = await supabase
        .from("patient_visits")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("event_id", eventId)
        .single();

      if (visitsError && visitsError.code !== 'PGRST116') {
        throw visitsError;
      }
      
      setCurrentVisit(visits);

      // Fetch services the patient is enrolled in for this visit
      if (visits) {
        const { data: servicesData, error: servicesError } = await supabase
          .from("service_queue")
          .select(`
            *,
            services!inner(
              id,
              name,
              description
            )
          `)
          .eq("patient_visit_id", visits.id)
          .order("created_at", { ascending: true });

        if (servicesError) {
          console.error("Error fetching patient services:", servicesError);
        } else {
          setPatientServices(servicesData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching current visit:", error);
      toast({
        title: "Error loading patient data",
        description: "Failed to load patient visit information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-lg font-medium">Loading patient data...</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const tabs = [
    {
      id: "basic-info",
      label: "Basic Info",
      icon: User,
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge variant="outline" className="mb-2">Full Name</Badge>
                    <p className="text-sm font-medium">{patient.first_name} {patient.last_name}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Date of Birth</Badge>
                    <p className="text-sm">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Age</Badge>
                    <p className="text-sm font-medium">{calculateAge(patient.date_of_birth)}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Gender</Badge>
                    <p className="text-sm">{patient.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Phone</Badge>
                    <p className="text-sm">{patient.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Patient Number</Badge>
                    <p className="text-sm">{patient.patient_number || 'Not assigned'}</p>
                  </div>
                </div>
                
                {patient.emergency_contact_name && (
                  <div>
                    <Badge variant="outline" className="mb-2">Emergency Contact</Badge>
                    <p className="text-sm">{patient.emergency_contact_name} - {patient.emergency_contact_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.allergies && (
                  <div>
                    <Badge variant="destructive" className="mb-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Allergies
                    </Badge>
                    <p className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                      {patient.allergies}
                    </p>
                  </div>
                )}
                
                {patient.medical_conditions && (
                  <div>
                    <Badge variant="outline" className="mb-2">Medical Conditions</Badge>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">
                      {patient.medical_conditions}
                    </p>
                  </div>
                )}
                
                {patient.medications && (
                  <div>
                    <Badge variant="outline" className="mb-2">Current Medications</Badge>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">
                      {patient.medications}
                    </p>
                  </div>
                )}

                {patient.insurance_provider && (
                  <div>
                    <Badge variant="outline" className="mb-2">Insurance</Badge>
                    <p className="text-sm">{patient.insurance_provider} - {patient.insurance_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Services Card - Full width */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Services Enrolled
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientServices.length > 0 ? (
                <div className="space-y-3">
                  {patientServices.map((serviceItem, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="flex-1">
                        <p className="font-medium">{serviceItem.services.name}</p>
                        {serviceItem.services.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {serviceItem.services.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            serviceItem.status === 'completed' ? 'default' :
                            serviceItem.status === 'in_progress' ? 'secondary' :
                            serviceItem.status === 'waiting' ? 'outline' :
                            'destructive'
                          }
                        >
                          {serviceItem.status === 'in_progress' ? 'In Progress' : 
                           serviceItem.status === 'completed' ? 'Completed' :
                           serviceItem.status === 'waiting' ? 'Waiting' :
                           serviceItem.status === 'unavailable' ? 'Unavailable' :
                           serviceItem.status}
                        </Badge>
                        {serviceItem.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(serviceItem.completed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No services enrolled for this visit</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "screening",
      label: "Screening",
      icon: Heart,
      component: currentVisit ? <BasicScreeningTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    },
    {
      id: "services",
      label: "Services",
      icon: Activity,
      component: currentVisit ? <ServiceRecordsTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    },
    {
      id: "prognosis",
      label: "Prognosis & Complaints",
      icon: Activity,
      component: currentVisit ? <PrognosisAndComplaintsTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    },
    {
      id: "prescriptions",
      label: "Prescriptions",
      icon: Pill,
      component: currentVisit ? <PrescriptionsTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    },
    {
      id: "ecg",
      label: "ECG",
      icon: Zap,
      component: currentVisit ? <ECGTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    },
    {
      id: "optician",
      label: "Optician",
      icon: Eye,
      component: currentVisit ? <OpticianTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    },
    {
      id: "dental",
      label: "Dental",
      icon: Smile,
      component: currentVisit ? <DentalTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    },
    {
      id: "pap-smear",
      label: "PAP Smear",
      icon: Shield,
      component: currentVisit ? <PapSmearTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    },
    {
      id: "back-to-school",
      label: "Back to School",
      icon: FileText,
      component: currentVisit ? <BackToSchoolTab patientVisitId={currentVisit.id} /> : (
        <div className="text-center py-8 text-muted-foreground">
          No visit data available
        </div>
      )
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {patient.first_name} {patient.last_name}
            </DialogTitle>
            {user && currentUserName && (
              <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded text-sm">
                <User className="h-3 w-3" />
                {currentUserName}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="basic-info" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-10 w-full shrink-0">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col items-center gap-1 text-xs whitespace-normal text-center p-2 min-h-[3rem]"
                >
                  <tab.icon className="h-3 w-3 shrink-0" />
                  <span className="leading-tight">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex-1 min-h-0 mt-4">
              {tabs.map((tab) => (
                <TabsContent 
                  key={tab.id} 
                  value={tab.id}
                  className="h-full mt-0 data-[state=active]:block data-[state=inactive]:hidden"
                >
                  {permissions.canAccessTab(tab.id) ? (
                    <ScrollArea className="h-full">
                      <div className="space-y-4 p-1">
                        {tab.component}
                        
                        {/* Permission Status for basic info tab */}
                        {tab.id === "basic-info" && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Permission Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex gap-2">
                                <Badge variant={permissions.isAdmin ? "default" : "secondary"}>
                                  {permissions.isAdmin ? "Admin" : "Staff"}
                                </Badge>
                                <Badge variant={permissions.isActive ? "default" : "destructive"}>
                                  {permissions.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              {permissions.allowedServices.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground">Allowed services:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {permissions.allowedServices.map((service, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {service}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Card className="p-8 text-center">
                        <CardContent className="space-y-4">
                          <div className="text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Access Restricted</h3>
                            <p className="text-sm">
                              You don't have permission to view this tab. Contact your administrator for access.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsModalWithPermissions;