import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BasicScreening {
  id: string;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  blood_sugar: number | null;
  cholesterol: number | null;
  oxygen_saturation: number | null;
  notes: string | null;
  created_at: string;
  screened_by?: {
    first_name: string;
    last_name: string;
    professional_capacity?: string;
  };
}

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  type: 'doctor' | 'nurse' | 'staff';
  specialization?: string;
  certification_level?: string;
  professional_capacity?: string;
}

interface BasicScreeningTabProps {
  patientVisitId: string;
}

const BasicScreeningTab = ({ patientVisitId }: BasicScreeningTabProps) => {
  const [basicScreening, setBasicScreening] = useState<BasicScreening | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [currentDoctor, setCurrentDoctor] = useState<any>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    temperature: "",
    blood_sugar: "",
    cholesterol: "",
    oxygen_saturation: "",
    notes: "",
    height_unit: "cm",
    weight_unit: "kg",
    health_professional: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const initializeComponent = async () => {
      await getCurrentStaff();
      await fetchProfessionals();
      await fetchBasicScreening();
    };
    
    initializeComponent();
  }, [patientVisitId]);

  // Update form data when current staff is loaded and form is being initialized
  useEffect(() => {
    console.log("UseEffect triggered - currentStaff:", currentStaff, "isEditing:", isEditing, "health_professional:", formData.health_professional);
    if (currentStaff && isEditing && (!formData.health_professional || formData.health_professional === "")) {
      console.log("Setting default health professional to:", currentStaff.id);
      setFormData(prev => ({
        ...prev,
        health_professional: currentStaff.id
      }));
    }
  }, [currentStaff, isEditing, formData.health_professional]);

  const getCurrentStaff = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user);
      if (user) {
        // Try staff table first
        let { data: staffData } = await supabase
          .from("staff")
          .select("id, first_name, last_name, professional_capacity")
          .eq("user_id", user.id)
          .maybeSingle();
        
        // If not found in staff, try to find by email in staff table
        if (!staffData && user.email) {
          const { data: staffByEmail } = await supabase
            .from("staff")
            .select("id, first_name, last_name, professional_capacity")
            .eq("email", user.email)
            .maybeSingle();
          staffData = staffByEmail;
        }
        
        console.log("Staff data found:", staffData);
        setCurrentStaff(staffData);
      }
    } catch (error) {
      console.error("Error getting current staff:", error);
    }
  };


  const fetchProfessionals = async () => {
    try {
      // Fetch all staff, doctors, and nurses
      const [staffResponse, doctorsResponse, nursesResponse] = await Promise.all([
        supabase.from("staff").select("*").eq("is_active", true),
        supabase.from("doctors").select("*").eq("is_active", true),
        supabase.from("nurses").select("*").eq("is_active", true)
      ]);

      const allProfessionals: Professional[] = [];
      
      // Add staff members
      if (staffResponse.data) {
        staffResponse.data.forEach(staff => {
          allProfessionals.push({
            id: staff.id,
            first_name: staff.first_name,
            last_name: staff.last_name,
            type: 'staff',
            professional_capacity: staff.professional_capacity
          });
        });
      }
      
      // Add doctors
      if (doctorsResponse.data) {
        doctorsResponse.data.forEach(doctor => {
          allProfessionals.push({
            id: doctor.id,
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            type: 'doctor',
            specialization: doctor.specialization
          });
        });
      }
      
      // Add nurses
      if (nursesResponse.data) {
        nursesResponse.data.forEach(nurse => {
          allProfessionals.push({
            id: nurse.id,
            first_name: nurse.first_name,
            last_name: nurse.last_name,
            type: 'nurse',
            certification_level: nurse.certification_level
          });
        });
      }
      
      setProfessionals(allProfessionals);
    } catch (error) {
      console.error("Error fetching professionals:", error);
    }
  };

  const fetchBasicScreening = async () => {
    try {
      const { data: screeningData, error: screeningError } = await supabase
        .from("basic_screening")
        .select(`
          *,
          staff:screened_by (
            first_name,
            last_name,
            professional_capacity
          )
        `)
        .eq("patient_visit_id", patientVisitId)
        .single();

      if (screeningError && screeningError.code !== 'PGRST116') {
        throw screeningError;
      }

      const transformedScreeningData = screeningData ? {
        ...screeningData,
        screened_by: screeningData.staff
      } : null;
      
      // If no screening data exists, set editing mode to true
      if (!transformedScreeningData) {
        setIsEditing(true);
        // Set default health professional to current staff when creating new screening
        setFormData(prev => ({
          ...prev,
          health_professional: currentStaff?.id || ""
        }));
      } else {
        // Populate form data with existing values
        setFormData({
          height: transformedScreeningData.height?.toString() || "",
          weight: transformedScreeningData.weight?.toString() || "",
          blood_pressure_systolic: transformedScreeningData.blood_pressure_systolic?.toString() || "",
          blood_pressure_diastolic: transformedScreeningData.blood_pressure_diastolic?.toString() || "",
          heart_rate: transformedScreeningData.heart_rate?.toString() || "",
          temperature: transformedScreeningData.temperature?.toString() || "",
          blood_sugar: transformedScreeningData.blood_sugar?.toString() || "",
          cholesterol: transformedScreeningData.cholesterol?.toString() || "",
          oxygen_saturation: transformedScreeningData.oxygen_saturation?.toString() || "",
          notes: transformedScreeningData.notes || "",
          height_unit: "cm",
          weight_unit: "kg",
          health_professional: currentStaff?.id || ""
        });
      }
      
      setBasicScreening(transformedScreeningData);
    } catch (error) {
      console.error("Error fetching basic screening:", error);
      toast({
        title: "Error",
        description: "Failed to fetch basic screening data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertHeightToCm = (value: number, unit: string): number => {
    if (unit === "ft") {
      return value * 30.48; // feet to cm
    }
    return value; // already in cm
  };

  const convertWeightToKg = (value: number, unit: string): number => {
    if (unit === "lbs") {
      return value * 0.453592; // pounds to kg
    }
    return value; // already in kg
  };

  const calculateBMI = (height: number, weight: number): number => {
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    }
    return 0;
  };

  const getBloodPressureInterpretation = (systolic: number, diastolic: number): string => {
    if (systolic < 120 && diastolic < 80) {
      return "Normal blood pressure";
    } else if (systolic < 130 && diastolic < 80) {
      return "Elevated blood pressure";
    } else if (systolic < 140 || diastolic < 90) {
      return "Stage 1 Hypertension";
    } else if (systolic < 180 || diastolic < 120) {
      return "Stage 2 Hypertension";
    } else {
      return "Hypertensive Crisis - Seek immediate medical attention";
    }
  };

  const validateInput = (field: string, value: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return true; // Allow empty/invalid numbers to be handled later
    
    // Set reasonable limits for each field to prevent database overflow
    const limits = {
      height: { min: 0, max: 300 }, // cm or converted to cm
      weight: { min: 0, max: 1000 }, // kg or converted to kg
      blood_pressure_systolic: { min: 0, max: 300 }, // mmHg
      blood_pressure_diastolic: { min: 0, max: 200 }, // mmHg
      heart_rate: { min: 0, max: 300 }, // bpm
      temperature: { min: 0, max: 50 }, // °C
      blood_sugar: { min: 0, max: 1000 }, // mg/dL
      cholesterol: { min: 0, max: 1000 }, // mg/dL
      oxygen_saturation: { min: 0, max: 100 } // %
    };
    
    const limit = limits[field as keyof typeof limits];
    if (limit && (numValue < limit.min || numValue > limit.max)) {
      toast({
        title: "Invalid Value",
        description: `${field.replace('_', ' ')} must be between ${limit.min} and ${limit.max}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    // Only update if validation passes for numeric fields
    if (field.includes('_unit') || field === 'notes' || field === 'health_professional' || validateInput(field, value)) {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      console.log("=== SAVING SCREENING DATA ===");
      console.log("Form data:", formData);
      
      // Use current staff as screened_by
      let screenedById = currentStaff?.id || null;
      
      // Validate all numeric inputs before saving
      const numericFields = ['height', 'weight', 'blood_pressure_systolic', 'blood_pressure_diastolic', 
                            'heart_rate', 'temperature', 'blood_sugar', 'cholesterol', 'oxygen_saturation'];
      
      for (const field of numericFields) {
        const value = formData[field as keyof typeof formData];
        if (value && !validateInput(field, value)) {
          return; // Stop if validation fails
        }
      }
      
      // Convert units to standard units (cm and kg)
      const heightValue = formData.height ? parseFloat(formData.height) : null;
      const weightValue = formData.weight ? parseFloat(formData.weight) : null;
      
      const height = heightValue ? convertHeightToCm(heightValue, formData.height_unit) : null;
      const weight = weightValue ? convertWeightToKg(weightValue, formData.weight_unit) : null;
      const bmi = height && weight ? calculateBMI(height, weight) : null;
      
      // Generate blood pressure interpretation
      const systolic = formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null;
      const diastolic = formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null;
      let notes = formData.notes || "";
      
      if (systolic && diastolic) {
        const bpInterpretation = getBloodPressureInterpretation(systolic, diastolic);
        notes = notes ? `${notes}\n\nBlood Pressure: ${bpInterpretation}` : `Blood Pressure: ${bpInterpretation}`;
      }
      
      const screeningData = {
        patient_visit_id: patientVisitId,
        height,
        weight,
        bmi,
        blood_pressure_systolic: systolic,
        blood_pressure_diastolic: diastolic,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        blood_sugar: formData.blood_sugar ? parseInt(formData.blood_sugar) : null,
        cholesterol: formData.cholesterol ? parseInt(formData.cholesterol) : null,
        oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
        notes: notes || null,
        screened_by: screenedById
      };

      console.log("Processed screening data:", screeningData);

      if (basicScreening) {
        // Update existing record
        console.log("Updating existing screening record:", basicScreening.id);
        const { error } = await supabase
          .from("basic_screening")
          .update(screeningData)
          .eq("id", basicScreening.id);
        
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
      } else {
        // Create new record
        console.log("Creating new screening record");
        const { error } = await supabase
          .from("basic_screening")
          .insert(screeningData);
        
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "Basic screening data saved successfully",
      });

      setIsEditing(false);
      fetchBasicScreening();
    } catch (error: any) {
      console.error("Error saving basic screening:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      let errorMessage = "Failed to save basic screening data";
      if (error.message?.includes("numeric field overflow")) {
        errorMessage = "One or more values are too large. Please check your entries and try again.";
      } else if (error.message?.includes("foreign key constraint")) {
        errorMessage = "Invalid staff member selected. Please contact administrator.";
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
      
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (basicScreening) {
      // Reset form to current data
      setFormData({
        height: basicScreening.height?.toString() || "",
        weight: basicScreening.weight?.toString() || "",
        blood_pressure_systolic: basicScreening.blood_pressure_systolic?.toString() || "",
        blood_pressure_diastolic: basicScreening.blood_pressure_diastolic?.toString() || "",
        heart_rate: basicScreening.heart_rate?.toString() || "",
        temperature: basicScreening.temperature?.toString() || "",
        blood_sugar: basicScreening.blood_sugar?.toString() || "",
        cholesterol: basicScreening.cholesterol?.toString() || "",
        oxygen_saturation: basicScreening.oxygen_saturation?.toString() || "",
        notes: basicScreening.notes || "",
        height_unit: "cm",
        weight_unit: "kg",
        health_professional: currentStaff?.id || ""
      });
    } else {
      // Clear form for new entry
      setFormData({
        height: "",
        weight: "",
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        heart_rate: "",
        temperature: "",
        blood_sugar: "",
        cholesterol: "",
        oxygen_saturation: "",
        notes: "",
        height_unit: "cm",
        weight_unit: "kg",
        health_professional: currentStaff?.id || ""
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading screening data...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Basic Health Screening
          </CardTitle>
          {!isEditing && basicScreening && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <div className="flex gap-2">
                  <Input
                    id="height"
                    type="number"
                    placeholder="Enter height"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    min="0"
                    max="300"
                    className="flex-1"
                  />
                  <Select value={formData.height_unit} onValueChange={(value) => handleInputChange("height_unit", value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter weight"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    min="0"
                    max="1000"
                    className="flex-1"
                  />
                  <Select value={formData.weight_unit} onValueChange={(value) => handleInputChange("weight_unit", value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="systolic">Blood Pressure - Systolic (mmHg)</Label>
                <Input
                  id="systolic"
                  type="number"
                  placeholder="Systolic pressure"
                  value={formData.blood_pressure_systolic}
                  onChange={(e) => handleInputChange("blood_pressure_systolic", e.target.value)}
                  min="0"
                  max="300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolic">Blood Pressure - Diastolic (mmHg)</Label>
                <Input
                  id="diastolic"
                  type="number"
                  placeholder="Diastolic pressure"
                  value={formData.blood_pressure_diastolic}
                  onChange={(e) => handleInputChange("blood_pressure_diastolic", e.target.value)}
                  min="0"
                  max="200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                <Input
                  id="heart_rate"
                  type="number"
                  placeholder="Beats per minute"
                  value={formData.heart_rate}
                  onChange={(e) => handleInputChange("heart_rate", e.target.value)}
                  min="0"
                  max="300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="Body temperature"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange("temperature", e.target.value)}
                  min="0"
                  max="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blood_sugar">Blood Sugar (mg/dL)</Label>
                <Input
                  id="blood_sugar"
                  type="number"
                  placeholder="Blood sugar level"
                  value={formData.blood_sugar}
                  onChange={(e) => handleInputChange("blood_sugar", e.target.value)}
                  min="0"
                  max="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cholesterol">Cholesterol (mg/dL)</Label>
                <Input
                  id="cholesterol"
                  type="number"
                  placeholder="Cholesterol level"
                  value={formData.cholesterol}
                  onChange={(e) => handleInputChange("cholesterol", e.target.value)}
                  min="0"
                  max="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxygen_saturation">Oxygen Saturation (%)</Label>
                <Input
                  id="oxygen_saturation"
                  type="number"
                  placeholder="Oxygen saturation percentage"
                  value={formData.oxygen_saturation}
                  onChange={(e) => handleInputChange("oxygen_saturation", e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            {/* Blood Pressure Interpretation */}
            {formData.blood_pressure_systolic && formData.blood_pressure_diastolic && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Blood Pressure Interpretation: {getBloodPressureInterpretation(
                    parseInt(formData.blood_pressure_systolic), 
                    parseInt(formData.blood_pressure_diastolic)
                  )}
                </p>
              </div>
            )}
            
            {/* Health Professional Field */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="health_professional">Health Professional</Label>
                <div className="text-xs text-muted-foreground mb-2">Debug: formData.health_professional = "{formData.health_professional}", currentStaff.id = "{currentStaff?.id}"</div>
                <Select value={formData.health_professional} onValueChange={(value) => handleInputChange("health_professional", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select health professional" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentStaff && (
                      <SelectItem value={currentStaff.id}>
                        {currentStaff.first_name} {currentStaff.last_name} (Current User)
                      </SelectItem>
                    )}
                    {professionals.filter(p => p.type === 'staff' && p.id !== currentStaff?.id).map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.first_name} {professional.last_name}
                        {professional.professional_capacity && ` (${professional.professional_capacity})`}
                      </SelectItem>
                    ))}
                    {professionals.filter(p => p.type === 'doctor').map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        Dr. {professional.first_name} {professional.last_name}
                        {professional.specialization && ` (${professional.specialization})`}
                      </SelectItem>
                    ))}
                    {professionals.filter(p => p.type === 'nurse').map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.first_name} {professional.last_name} (Nurse)
                        {professional.certification_level && ` - ${professional.certification_level}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or observations"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>
            
            {formData.height && formData.weight && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Calculated BMI: {calculateBMI(
                    convertHeightToCm(parseFloat(formData.height), formData.height_unit), 
                    convertWeightToKg(parseFloat(formData.weight), formData.weight_unit)
                  )}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : basicScreening ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basicScreening.height && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">Height</Badge>
                <p className="text-sm font-medium">{basicScreening.height} cm</p>
              </div>
            )}
            {basicScreening.weight && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">Weight</Badge>
                <p className="text-sm font-medium">{basicScreening.weight} kg</p>
              </div>
            )}
            {basicScreening.bmi && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">BMI</Badge>
                <p className="text-sm font-medium">{basicScreening.bmi}</p>
              </div>
            )}
            {(basicScreening.blood_pressure_systolic && basicScreening.blood_pressure_diastolic) && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">Blood Pressure</Badge>
                <p className="text-sm font-medium">{basicScreening.blood_pressure_systolic}/{basicScreening.blood_pressure_diastolic} mmHg</p>
              </div>
            )}
            {basicScreening.heart_rate && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">Heart Rate</Badge>
                <p className="text-sm font-medium">{basicScreening.heart_rate} bpm</p>
              </div>
            )}
            {basicScreening.temperature && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">Temperature</Badge>
                <p className="text-sm font-medium">{basicScreening.temperature}°C</p>
              </div>
            )}
            {basicScreening.blood_sugar && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">Blood Sugar</Badge>
                <p className="text-sm font-medium">{basicScreening.blood_sugar} mg/dL</p>
              </div>
            )}
            {basicScreening.cholesterol && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">Cholesterol</Badge>
                <p className="text-sm font-medium">{basicScreening.cholesterol} mg/dL</p>
              </div>
            )}
            {basicScreening.oxygen_saturation && (
              <div className="space-y-1">
                <Badge variant="outline" className="mb-2">Oxygen Saturation</Badge>
                <p className="text-sm font-medium">{basicScreening.oxygen_saturation}%</p>
              </div>
            )}
            {basicScreening.notes && (
              <div className="space-y-1 md:col-span-2">
                <Badge variant="outline" className="mb-2">Notes</Badge>
                <p className="text-sm bg-muted p-3 rounded whitespace-pre-line">{basicScreening.notes}</p>
              </div>
            )}
            {basicScreening.screened_by && (
              <div className="space-y-1 md:col-span-2">
                <Badge variant="outline" className="mb-2">Screened by</Badge>
                <p className="text-sm font-medium">
                  {basicScreening.screened_by.first_name} {basicScreening.screened_by.last_name}
                  {basicScreening.screened_by.professional_capacity && (
                    <span className="text-muted-foreground ml-2">
                      ({basicScreening.screened_by.professional_capacity})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No basic screening data recorded for this visit</p>
            <Button onClick={() => setIsEditing(true)}>
              <Heart className="h-4 w-4 mr-2" />
              Start Screening
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BasicScreeningTab;