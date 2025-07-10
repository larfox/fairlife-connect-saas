import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ArrowLeft,
  UserCheck
} from "lucide-react";
import PatientsManager from "@/components/patient/PatientsManager";

interface PatientManagementProps {
  onBack?: () => void;
  selectedEventId?: string;
}

const PatientManagement = ({ onBack, selectedEventId }: PatientManagementProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Patient Management</h1>
                <p className="text-muted-foreground">
                  Manage patient records and medical information for your health fair
                </p>
              </div>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Patient Management Content */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary/10 p-2 rounded-lg">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Patient Registry</CardTitle>
                <CardDescription>Comprehensive patient information management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PatientsManager selectedEventId={selectedEventId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientManagement;