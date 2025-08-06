import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, Phone, Mail } from "lucide-react";

interface DuplicatePatientDialogProps {
  isOpen: boolean;
  duplicatePatient: any;
  onClose: () => void;
  onUpdateExisting: () => void;
  onContinueRegistration: () => void;
}

export const DuplicatePatientDialog = ({
  isOpen,
  duplicatePatient,
  onClose,
  onUpdateExisting,
  onContinueRegistration
}: DuplicatePatientDialogProps) => {
  if (!duplicatePatient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Duplicate Patient Found
          </DialogTitle>
          <DialogDescription>
            A patient with the same name already exists in the system.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {duplicatePatient.first_name} {duplicatePatient.last_name}
                </span>
              </div>
              
              {duplicatePatient.date_of_birth && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Born: {new Date(duplicatePatient.date_of_birth).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {duplicatePatient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {duplicatePatient.phone}
                  </span>
                </div>
              )}
              
              {duplicatePatient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {duplicatePatient.email}
                  </span>
                </div>
              )}

              {duplicatePatient.patient_number && (
                <div className="text-xs text-muted-foreground">
                  Patient #: {duplicatePatient.patient_number}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button onClick={onUpdateExisting} className="w-full">
            Update Existing Record
          </Button>
          <Button 
            variant="outline" 
            onClick={onContinueRegistration}
            className="w-full"
          >
            Register as New Patient Anyway
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};