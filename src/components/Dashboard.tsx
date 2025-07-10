import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  MapPin, 
  BarChart3, 
  Plus, 
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building,
  UserCheck
} from "lucide-react";
import FoundationManagement from "@/components/FoundationManagement";
import PatientManagement from "@/components/PatientManagement";
import { CreateEventModal } from "@/components/CreateEventModal";

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "foundation" | "patients">("dashboard");

  // Mock data for demonstration
  const stats = [
    {
      title: "Total Events",
      value: "12",
      change: "+3 this month",
      trend: "up",
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "Total Attendees",
      value: "2,847",
      change: "+12% vs last month",
      trend: "up",
      icon: Users,
      color: "text-secondary"
    },
    {
      title: "Active Vendors",
      value: "67",
      change: "+5 new vendors",
      trend: "up",
      icon: MapPin,
      color: "text-accent"
    },
    {
      title: "Revenue",
      value: "$24,500",
      change: "+18% growth",
      trend: "up",
      icon: BarChart3,
      color: "text-primary"
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      name: "Corporate Wellness Fair 2024",
      date: "March 15, 2024",
      location: "Convention Center A",
      attendees: 450,
      status: "confirmed",
      vendors: 25
    },
    {
      id: 2,
      name: "Community Health Screening",
      date: "March 22, 2024",
      location: "City Park Pavilion",
      attendees: 200,
      status: "planning",
      vendors: 15
    },
    {
      id: 3,
      name: "Senior Health & Wellness Expo",
      date: "April 5, 2024",
      location: "Senior Center Main Hall",
      attendees: 180,
      status: "confirmed",
      vendors: 18
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-secondary text-secondary-foreground';
      case 'planning':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'planning':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (currentView === "foundation") {
    return <FoundationManagement onBack={() => setCurrentView("dashboard")} />;
  }

  if (currentView === "patients") {
    return <PatientManagement onBack={() => setCurrentView("dashboard")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your health fairs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setCurrentView("foundation")}
              className="gap-2"
            >
              <Building className="h-5 w-5" />
              Foundation Setup
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setCurrentView("patients")}
              className="gap-2"
            >
              <UserCheck className="h-5 w-5" />
              Patient Management
            </Button>
            <CreateEventModal />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="shadow-card hover:shadow-medical transition-[var(--transition-smooth)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                      <div className="flex items-center mt-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-secondary mr-1" />
                        <span className="text-secondary font-medium">
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg bg-gradient-primary/10 ${stat.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upcoming Events */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Upcoming Events</CardTitle>
                <CardDescription>
                  Manage and monitor your scheduled health fairs
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-card transition-[var(--transition-smooth)] hover:border-primary/20"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-primary/10 p-2 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{event.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {event.date}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <p className="font-medium text-foreground">{event.attendees} attendees</p>
                      <p className="text-muted-foreground">{event.vendors} vendors</p>
                    </div>
                    <Badge className={getStatusColor(event.status)}>
                      {getStatusIcon(event.status)}
                      <span className="ml-1 capitalize">{event.status}</span>
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;