import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface PatientMedicalInfoFormProps {
  patientData: {
    allergies: string;
    medical_conditions: string;
    medications: string;
  };
  onChange: (field: string, value: string) => void;
}

export const PatientMedicalInfoForm = ({ patientData, onChange }: PatientMedicalInfoFormProps) => {
  return (
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
          onChange={(e) => onChange('allergies', e.target.value)}
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
            onChange={(e) => onChange('medical_conditions', e.target.value)}
            placeholder="List current medical conditions"
            className="min-h-[80px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="medications">Current Medications</Label>
          <Textarea
            id="medications"
            value={patientData.medications}
            onChange={(e) => onChange('medications', e.target.value)}
            placeholder="List current medications"
            className="min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
};