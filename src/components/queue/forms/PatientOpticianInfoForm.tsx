import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, AlertTriangle } from "lucide-react";

interface PatientOpticianInfoFormProps {
  patientData: {
    wears_glasses: boolean;
    wears_contacts: boolean;
    eye_symptoms: string[];
    eye_injury_history: string;
    eye_surgery_history: string;
    family_eye_history: {
      hypertension?: { has: boolean; relationship: string };
      diabetes?: { has: boolean; relationship: string };
      thyroid_disease?: { has: boolean; relationship: string };
      glaucoma?: { has: boolean; relationship: string };
      cataracts?: { has: boolean; relationship: string };
      cancer?: { has: boolean; relationship: string };
      macular_degeneration?: { has: boolean; relationship: string };
      other?: string;
    };
  };
  onChange: (field: string, value: any) => void;
}

const EYE_SYMPTOMS = [
  "Dry Eyes",
  "Eye Pain", 
  "Blurred Vision",
  "Eyelid Crusting",
  "Discharge",
  "Flashes/Floaters",
  "Light Sensitivity",
  "Double Vision",
  "Decreased Vision",
  "Eye Injury",
  "Pterygium",
  "Eye Allergies",
  "Glaucoma",
  "Cataracts",
  "Lazy Eye",
  "Retinal Detachment",
  "Macular Degeneration",
  "Eye Infection",
  "Eye Surgery",
  "Color Deficiency"
];

const FAMILY_CONDITIONS = [
  { key: "hypertension", label: "Hypertension" },
  { key: "diabetes", label: "Diabetes" },
  { key: "thyroid_disease", label: "Thyroid Disease" },
  { key: "glaucoma", label: "Glaucoma" },
  { key: "cataracts", label: "Cataracts" },
  { key: "cancer", label: "Cancer" },
  { key: "macular_degeneration", label: "Macular Degeneration" }
];

export const PatientOpticianInfoForm = ({ patientData, onChange }: PatientOpticianInfoFormProps) => {
  const handleSymptomChange = (symptom: string, checked: boolean) => {
    const currentSymptoms = patientData.eye_symptoms || [];
    let newSymptoms;
    
    if (checked) {
      newSymptoms = [...currentSymptoms, symptom];
    } else {
      newSymptoms = currentSymptoms.filter(s => s !== symptom);
    }
    
    onChange('eye_symptoms', newSymptoms);
  };

  const handleFamilyHistoryChange = (condition: string, field: 'has' | 'relationship', value: boolean | string) => {
    const currentHistory = patientData.family_eye_history || {};
    const existingConditionData = currentHistory[condition as keyof typeof currentHistory] || {};
    const updatedHistory = {
      ...currentHistory,
      [condition]: {
        ...(typeof existingConditionData === 'object' ? existingConditionData : {}),
        [field]: value
      }
    };
    onChange('family_eye_history', updatedHistory);
  };

  const handleOtherFamilyHistory = (value: string) => {
    const currentHistory = patientData.family_eye_history || {};
    onChange('family_eye_history', { ...currentHistory, other: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Eye className="h-5 w-5 text-blue-500" />
        Eye & Vision Information
      </h3>

      {/* Current Eyewear Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Eyewear Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-8">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wears_glasses"
                checked={patientData.wears_glasses}
                onCheckedChange={(checked) => onChange('wears_glasses', checked)}
              />
              <Label htmlFor="wears_glasses">Do you wear glasses?</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wears_contacts"
                checked={patientData.wears_contacts}
                onCheckedChange={(checked) => onChange('wears_contacts', checked)}
              />
              <Label htmlFor="wears_contacts">Do you wear contact lenses?</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eye and Vision History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Eye and Vision History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {EYE_SYMPTOMS.map((symptom) => (
              <div key={symptom} className="flex items-center space-x-2">
                <Checkbox
                  id={`symptom_${symptom}`}
                  checked={patientData.eye_symptoms?.includes(symptom) || false}
                  onCheckedChange={(checked) => handleSymptomChange(symptom, checked as boolean)}
                />
                <Label htmlFor={`symptom_${symptom}`} className="text-xs">
                  {symptom}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eye Injury and Surgery History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eye_injury_history">
              Have you ever had eye injury? Please describe:
            </Label>
            <Textarea
              id="eye_injury_history"
              value={patientData.eye_injury_history || ""}
              onChange={(e) => onChange('eye_injury_history', e.target.value)}
              placeholder="Describe any eye injuries..."
              className="min-h-[60px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="eye_surgery_history">
              Have you ever had eye surgery? Please list eye surgery and dates:
            </Label>
            <Textarea
              id="eye_surgery_history"
              value={patientData.eye_surgery_history || ""}
              onChange={(e) => onChange('eye_surgery_history', e.target.value)}
              placeholder="List surgeries and dates (e.g., Cataract surgery - 2020, LASIK - 2018)..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Family History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            Family History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAMILY_CONDITIONS.map((condition) => {
              const conditionData = patientData.family_eye_history?.[condition.key as keyof typeof patientData.family_eye_history] as { has?: boolean; relationship?: string } | undefined;
              
              return (
                <div key={condition.key} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`family_${condition.key}`}
                      checked={conditionData?.has || false}
                      onCheckedChange={(checked) => 
                        handleFamilyHistoryChange(condition.key, 'has', checked as boolean)
                      }
                    />
                    <Label htmlFor={`family_${condition.key}`} className="text-sm">
                      {condition.label}
                    </Label>
                  </div>
                  {conditionData?.has && (
                    <Input
                      placeholder="Relationship (e.g., Mother, Father, Sister)"
                      value={conditionData?.relationship || ""}
                      onChange={(e) => 
                        handleFamilyHistoryChange(condition.key, 'relationship', e.target.value)
                      }
                      className="text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="other_family_history">
              Other Health Issues (Please Specify):
            </Label>
            <Textarea
              id="other_family_history"
              value={patientData.family_eye_history?.other || ""}
              onChange={(e) => handleOtherFamilyHistory(e.target.value)}
              placeholder="Specify any other family health issues..."
              className="min-h-[60px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};