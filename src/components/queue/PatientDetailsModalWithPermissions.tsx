import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  AlertTriangle, 
  Heart, 
  FileText, 
  Calendar,
  Activity,
  Save,
  Clock,
  UserCog,
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

interface PatientDetailsModalProps {
  patient: any;
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PatientDetailsModalWithPermissions = ({ patient, eventId, isOpen, onClose }: PatientDetailsModalProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const permissions = useStaffPermissions(user);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  // Permission wrapper component
  const PermissionWrapper = ({ tabName, children }: { tabName: string; children: React.ReactNode }) => {
    if (!permissions.canAccessTab(tabName)) {
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You don't have permission to access this section. Please contact your administrator if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <>{children}</>;
  };

  // Calculate visible tabs for grid layout
  const getVisibleTabs = () => {
    const allTabs = [
      { value: 'overview', label: 'Overview' },
      { value: 'screening', label: 'Screening' },
      { value: 'complaints-prognosis', label: 'Complaints & Prognosis' },
      { value: 'prescriptions', label: 'Prescriptions' },
      { value: 'ecg', label: 'ECG Results' },
      { value: 'optician', label: 'Optician' },
      { value: 'dental', label: 'Dental' },
      { value: 'pap-smears', label: 'PAP Smears' },
      { value: 'back-to-school', label: 'Back to School' },
      { value: 'immunizations', label: 'Immunizations' },
      { value: 'history', label: 'History' }
    ];

    return allTabs.filter(tab => permissions.canAccessTab(tab.value));
  };

  const visibleTabs = getVisibleTabs();
  const gridCols = visibleTabs.length <= 6 ? 'grid-cols-6' : 
                   visibleTabs.length <= 8 ? 'grid-cols-8' : 
                   visibleTabs.length <= 10 ? 'grid-cols-10' : 'grid-cols-11';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {patient.first_name} {patient.last_name}
            <Badge variant="outline">{patient.patient_number}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue={visibleTabs[0]?.value || 'overview'} className="w-full">
            <TabsList className={`grid w-full text-xs h-auto ${gridCols}`}>
              {visibleTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="text-xs px-2 py-1 text-center whitespace-normal"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <PermissionWrapper tabName="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div><strong>Name:</strong> {patient.first_name} {patient.last_name}</div>
                      <div><strong>Patient Number:</strong> {patient.patient_number}</div>
                      {patient.date_of_birth && (
                        <div><strong>Date of Birth:</strong> {new Date(patient.date_of_birth).toLocaleDateString()}</div>
                      )}
                      {patient.phone && (
                        <div><strong>Phone:</strong> {patient.phone}</div>
                      )}
                      {patient.email && (
                        <div><strong>Email:</strong> {patient.email}</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Medical Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {patient.allergies && (
                        <div>
                          <Badge variant="destructive" className="mb-2">Allergies</Badge>
                          <p className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                            {patient.allergies}
                          </p>
                        </div>
                      )}
                      {patient.medical_conditions && (
                        <div>
                          <Badge variant="outline" className="mb-2">Medical Conditions</Badge>
                          <p className="text-sm bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
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
                    </CardContent>
                  </Card>
                </div>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="screening" className="space-y-4">
              <PermissionWrapper tabName="screening">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Basic Screening - "Know Your Numbers"
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Screening data and health measurements will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="complaints-prognosis" className="space-y-4">
              <PermissionWrapper tabName="complaints-prognosis">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Complaints & Prognosis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Patient complaints and medical prognosis will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4">
              <PermissionWrapper tabName="prescriptions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Patient prescriptions will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="ecg" className="space-y-4">
              <PermissionWrapper tabName="ecg">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      ECG Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      ECG results and cardiac assessments will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="optician" className="space-y-4">
              <PermissionWrapper tabName="optician">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Vision Testing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Vision test results and optician assessments will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="dental" className="space-y-4">
              <PermissionWrapper tabName="dental">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smile className="h-5 w-5" />
                      Dental Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Dental assessments and oral health information will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="pap-smears" className="space-y-4">
              <PermissionWrapper tabName="pap-smears">
                <PapSmearTab patientVisitId={patient.id} />
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="back-to-school" className="space-y-4">
              <PermissionWrapper tabName="back-to-school">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Back to School
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Back to school health assessments will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="immunizations" className="space-y-4">
              <PermissionWrapper tabName="immunizations">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Immunizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Immunization records will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <PermissionWrapper tabName="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Patient History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Patient visit history will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </PermissionWrapper>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsModalWithPermissions;