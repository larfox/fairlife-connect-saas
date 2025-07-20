import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { User as SupabaseUser } from "@supabase/supabase-js";

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
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getCurrentUser();
  }, []);

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {patient.first_name} {patient.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
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
                  
                  <div>
                    <Badge variant="outline" className="mb-2">Address</Badge>
                    <p className="text-sm">{patient.address || 'Not provided'}</p>
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

            {permissions.canAccessTab('overview') && (
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
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsModalWithPermissions;