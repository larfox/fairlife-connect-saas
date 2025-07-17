import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Stethoscope, 
  Heart, 
  Shield,
  Building,
  UserCheck,
  ArrowLeft,
  Users
} from "lucide-react";
import LocationsManager from "@/components/foundation/LocationsManager";
import ServicesManager from "@/components/foundation/ServicesManager";
import DoctorsManager from "@/components/foundation/DoctorsManager";
import NursesManager from "@/components/foundation/NursesManager";
import StaffManager from "@/components/foundation/StaffManager";

interface FoundationManagementProps {
  onBack?: () => void;
}

const FoundationManagement = ({ onBack }: FoundationManagementProps) => {
  const [activeTab, setActiveTab] = useState("locations");

  const tabs = [
    {
      id: "locations",
      label: "Locations",
      icon: MapPin,
      description: "Manage health fair venues and locations",
      component: LocationsManager
    },
    {
      id: "services",
      label: "Services",
      icon: Heart,
      description: "Configure available health services",
      component: ServicesManager
    },
    {
      id: "doctors",
      label: "Doctors",
      icon: Stethoscope,
      description: "Manage healthcare provider profiles",
      component: DoctorsManager
    },
    {
      id: "nurses",
      label: "Nurses",
      icon: Shield,
      description: "Manage nursing staff profiles",
      component: NursesManager
    },
    {
      id: "admin",
      label: "Admin",
      icon: UserCheck,
      description: "Manage administrative permissions and roles",
      component: StaffManager
    },
    {
      id: "security",
      label: "Security",
      icon: Users,
      description: "Manage staff access and security permissions",
      component: StaffManager
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Foundation Management</h1>
                <p className="text-muted-foreground">
                  Configure the core entities for your health fair system
                </p>
              </div>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl mx-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-primary/10 p-2 rounded-lg">
                        <tab.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{tab.label} Management</CardTitle>
                        <CardDescription>{tab.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Component />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default FoundationManagement;