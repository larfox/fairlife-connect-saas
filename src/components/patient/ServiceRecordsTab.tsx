import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ServiceRecord {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  service: {
    name: string;
    description: string | null;
  };
  doctor?: {
    first_name: string;
    last_name: string;
  };
  nurse?: {
    first_name: string;
    last_name: string;
  };
}

interface ServiceRecordsTabProps {
  patientVisitId: string;
}

const ServiceRecordsTab = ({ patientVisitId }: ServiceRecordsTabProps) => {
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceRecords();
  }, [patientVisitId]);

  const fetchServiceRecords = async () => {
    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from("service_queue")
        .select(`
          *,
          services (
            name,
            description
          ),
          doctors (
            first_name,
            last_name
          ),
          nurses (
            first_name,
            last_name
          )
        `)
        .eq("patient_visit_id", patientVisitId)
        .order("created_at", { ascending: false });

      if (serviceError) throw serviceError;

      const transformedServiceData: ServiceRecord[] = (serviceData || []).map(record => ({
        id: record.id,
        status: record.status,
        created_at: record.created_at,
        completed_at: record.completed_at,
        service: record.services,
        doctor: record.doctors,
        nurse: record.nurses
      }));

      setServiceRecords(transformedServiceData);
    } catch (error) {
      console.error("Error fetching service records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch service records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading service records...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Services Received
        </CardTitle>
      </CardHeader>
      <CardContent>
        {serviceRecords.length > 0 ? (
          <div className="space-y-3">
            {serviceRecords.map((service) => (
              <div key={service.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{service.service.name}</h4>
                  <Badge variant={service.status === "completed" ? "default" : "secondary"}>
                    {service.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                {service.service.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {service.service.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Started: {format(new Date(service.created_at), "MMM dd, yyyy 'at' h:mm a")}</div>
                  {service.completed_at && (
                    <div>Completed: {format(new Date(service.completed_at), "MMM dd, yyyy 'at' h:mm a")}</div>
                  )}
                  {service.doctor && (
                    <div>Doctor: {service.doctor.first_name} {service.doctor.last_name}</div>
                  )}
                  {service.nurse && (
                    <div>Nurse: {service.nurse.first_name} {service.nurse.last_name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No services recorded for this visit
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceRecordsTab;