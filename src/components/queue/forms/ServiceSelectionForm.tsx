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
  knowYourNumbersServiceId?: string;
  patientGender?: string;
}

export const ServiceSelectionForm = ({ services, selectedServices, onServiceToggle, knowYourNumbersServiceId, patientGender }: ServiceSelectionFormProps) => {
  // Filter out PAP smear services for non-female patients
  const getFilteredServices = () => {
    return services.filter(service => {
      const isPapSmear = service.name.toLowerCase().includes('pap') || service.name.toLowerCase().includes('smear');
      if (isPapSmear && patientGender !== 'female') {
        return false;
      }
      return true;
    });
  };

  const filteredServices = getFilteredServices();
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" />
        Select Services
      </h3>
      
      <div className="text-sm text-muted-foreground mb-4">
        "Know Your Numbers" is automatically included for all patients. Select additional services as needed.
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredServices.map((service) => {
          const isKnowYourNumbers = service.id === knowYourNumbersServiceId;
          const isRequired = isKnowYourNumbers;
          
          return (
            <div key={service.id} className={`flex items-center space-x-2 ${isRequired ? 'opacity-75' : ''}`}>
              <Checkbox
                id={service.id}
                checked={selectedServices.includes(service.id)}
                onCheckedChange={() => onServiceToggle(service.id)}
                disabled={isRequired}
              />
              <Label htmlFor={service.id} className={`flex-1 ${isRequired ? 'cursor-default' : 'cursor-pointer'}`}>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {service.name}
                    {isRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </p>
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
          );
        })}
      </div>
    </div>
  );
};