import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

type Parish = Tables<"parishes">;

interface PatientBasicInfoFormProps {
  patientData: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    email: string;
    parish_id: string;
  };
  parishes: Parish[];
  onChange: (field: string, value: string) => void;
}

export const PatientBasicInfoForm = ({ patientData, parishes, onChange }: PatientBasicInfoFormProps) => {
  return (
    <>
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={patientData.first_name}
            onChange={(e) => onChange('first_name', e.target.value)}
            placeholder="Enter first name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={patientData.last_name}
            onChange={(e) => onChange('last_name', e.target.value)}
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
            onChange={(e) => onChange('date_of_birth', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={patientData.gender} onValueChange={(value) => onChange('gender', value)}>
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
            onChange={(e) => onChange('phone', e.target.value)}
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
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="Enter email address"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parish">Parish</Label>
          <Select value={patientData.parish_id} onValueChange={(value) => onChange('parish_id', value)}>
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
    </>
  );
};