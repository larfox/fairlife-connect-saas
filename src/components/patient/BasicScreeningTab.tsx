import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
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
  };
}

interface BasicScreeningTabProps {
  patientVisitId: string;
}

const BasicScreeningTab = ({ patientVisitId }: BasicScreeningTabProps) => {
  const [basicScreening, setBasicScreening] = useState<BasicScreening | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBasicScreening();
  }, [patientVisitId]);

  const fetchBasicScreening = async () => {
    try {
      const { data: screeningData, error: screeningError } = await supabase
        .from("basic_screening")
        .select(`
          *,
          nurses (
            first_name,
            last_name
          )
        `)
        .eq("patient_visit_id", patientVisitId)
        .single();

      if (screeningError && screeningError.code !== 'PGRST116') {
        throw screeningError;
      }

      const transformedScreeningData = screeningData ? {
        ...screeningData,
        screened_by: screeningData.nurses
      } : null;
      
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
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Basic Health Screening
        </CardTitle>
      </CardHeader>
      <CardContent>
        {basicScreening ? (
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
                <p className="text-sm bg-muted p-3 rounded">{basicScreening.notes}</p>
              </div>
            )}
            {basicScreening.screened_by && (
              <div className="space-y-1 md:col-span-2">
                <Badge variant="outline" className="mb-2">Screened by</Badge>
                <p className="text-sm font-medium">{basicScreening.screened_by.first_name} {basicScreening.screened_by.last_name}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No basic screening data recorded for this visit
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BasicScreeningTab;