import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Parish = Tables<"parishes">;
type Town = Tables<"towns">;

interface PatientBasicInfoFormProps {
  patientData: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    email: string;
    parish_id: string;
    town_id: string;
    town_name: string;
  };
  parishes: Parish[];
  onChange: (field: string, value: string) => void;
}

export const PatientBasicInfoForm = ({ patientData, parishes, onChange }: PatientBasicInfoFormProps) => {
  const [towns, setTowns] = useState<Town[]>([]);
  const [showCustomTownInput, setShowCustomTownInput] = useState(false);

  useEffect(() => {
    if (patientData.parish_id) {
      fetchTowns(patientData.parish_id);
    } else {
      setTowns([]);
      onChange('town_id', '');
      onChange('town_name', '');
    }
  }, [patientData.parish_id]);

  const fetchTowns = async (parishId: string) => {
    try {
      const { data, error } = await supabase
        .from("towns")
        .select("*")
        .eq("parish_id", parishId)
        .order("name");

      if (error) throw error;
      setTowns(data || []);
    } catch (error) {
      console.error("Error fetching towns:", error);
    }
  };

  const handleParishChange = (value: string) => {
    onChange('parish_id', value);
    onChange('town_id', '');
    onChange('town_name', '');
    setShowCustomTownInput(false);
  };

  const handleTownChange = (value: string) => {
    if (value === "add_custom") {
      setShowCustomTownInput(true);
      onChange('town_id', '');
    } else {
      onChange('town_id', value);
      onChange('town_name', '');
      setShowCustomTownInput(false);
    }
  };

  const handleCustomTownChange = (value: string) => {
    onChange('town_name', value);
    if (value) {
      onChange('town_id', '');
    }
  };

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
          <Select value={patientData.parish_id} onValueChange={handleParishChange}>
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

      {/* Town Selection */}
      {patientData.parish_id && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="town">Town</Label>
            {!showCustomTownInput ? (
              <div className="flex gap-2">
                <Select value={patientData.town_id} onValueChange={handleTownChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select town" />
                  </SelectTrigger>
                  <SelectContent>
                    {towns.map((town) => (
                      <SelectItem key={town.id} value={town.id}>
                        {town.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add_custom">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add custom town
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={patientData.town_name}
                  onChange={(e) => handleCustomTownChange(e.target.value)}
                  placeholder="Enter custom town name"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomTownInput(false);
                    onChange('town_name', '');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};