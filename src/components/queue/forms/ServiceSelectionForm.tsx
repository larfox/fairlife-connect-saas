import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface ServiceSelectionFormProps {
  services: Service[];
  selectedServices: string[];
  onServiceToggle: (serviceId: string) => void;
}

export const ServiceSelectionForm = ({ services, selectedServices, onServiceToggle }: ServiceSelectionFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" />
        Select Services
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map((service) => (
          <div key={service.id} className="flex items-center space-x-2">
            <Checkbox
              id={service.id}
              checked={selectedServices.includes(service.id)}
              onCheckedChange={() => onServiceToggle(service.id)}
            />
            <Label htmlFor={service.id} className="flex-1 cursor-pointer">
              <div>
                <p className="font-medium">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                )}
                {service.duration_minutes && (
                  <Badge variant="outline" className="mt-1">
                    {service.duration_minutes} min
                  </Badge>
                )}
              </div>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};