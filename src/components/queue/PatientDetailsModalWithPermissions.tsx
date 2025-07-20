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
import { User as SupabaseUser } from "@supabase/supabase-js";
import PapSmearTab from "../patient/PapSmearTab";
import BasicScreeningTab from "../patient/BasicScreeningTab";
import ServiceRecordsTab from "../patient/ServiceRecordsTab";

interface PatientDetailsModalProps {
  patient: any;
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PatientDetailsModalWithPermissions = ({ patient, eventId, isOpen, onClose }: PatientDetailsModalProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentVisit, setCurrentVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const permissions = useStaffPermissions(user);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

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
                    <Badge variant="outline" className="mb-2">Gender</Badge>
                    <p className="text-sm">{patient.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Phone</Badge>
                    <p className="text-sm">{patient.phone || 'Not provided'}</p>
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
      id: "complaints",
      label: "Complaints",
      icon: FileText,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Patient Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Patient complaints functionality will be implemented here
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "prognosis",
      label: "Prognosis",
      icon: Activity,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Patient Prognosis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Patient prognosis functionality will be implemented here
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "prescriptions",
      label: "Prescriptions",
      icon: Pill,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Prescriptions functionality will be implemented here
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "ecg",
      label: "ECG",
      icon: Zap,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              ECG Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              ECG results functionality will be implemented here
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "optician",
      label: "Optician",
      icon: Eye,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Optician Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Optician assessment functionality will be implemented here
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "dental",
      label: "Dental",
      icon: Smile,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Dental Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Dental assessment functionality will be implemented here
            </div>
          </CardContent>
        </Card>
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
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {patient.first_name} {patient.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="basic-info" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-10 w-full shrink-0">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-1 text-xs"
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
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
                  <ScrollArea className="h-full">
                    <div className="space-y-4 p-1">
                      {tab.component}
                      
                      {/* Permission Status for overview tab */}
                      {tab.id === "basic-info" && permissions.canAccessTab('overview') && (
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