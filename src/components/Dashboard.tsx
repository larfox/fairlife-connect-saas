import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  UserCheck,
  CalendarDays,
  ClipboardList,
  Eye,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FoundationManagement from "@/components/FoundationManagement";
import PatientManagement from "@/components/PatientManagement";
import EventsManagement from "@/components/EventsManagement";
import QueueManagement from "@/components/queue/QueueManagement";


interface DashboardProps {
  selectedEventId?: string;
}

const Dashboard = ({ selectedEventId }: DashboardProps) => {
  const [currentView, setCurrentView] = useState<"dashboard" | "foundation" | "patients" | "events" | "queue">("dashboard");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQueueMode, setShowQueueMode] = useState(false);
  const { toast } = useToast();

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

  // Fetch events from database
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          locations!inner(name, address)
        `)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-secondary text-secondary-foreground';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'closed':
        return <X className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleCloseEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'closed' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event marked as closed",
      });

      fetchEvents(); // Refresh the events list
    } catch (error) {
      console.error('Error closing event:', error);
      toast({
        title: "Error",
        description: "Failed to close event",
        variant: "destructive",
      });
    }
  };

  const handleOpenEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'open' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event reopened",
      });

      fetchEvents(); // Refresh the events list
    } catch (error) {
      console.error('Error reopening event:', error);
      toast({
        title: "Error",
        description: "Failed to reopen event",
        variant: "destructive",
      });
    }
  };

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);
    setCurrentView("queue");
  };

  if (currentView === "foundation") {
    return <FoundationManagement onBack={() => setCurrentView("dashboard")} />;
  }

  if (currentView === "patients") {
    return <PatientManagement onBack={() => setCurrentView("dashboard")} selectedEventId={selectedEventId} />;
  }

  if (currentView === "events") {
    return <EventsManagement onBack={() => setCurrentView("dashboard")} />;
  }


  if (currentView === "queue" && selectedEvent) {
    return (
      <QueueManagement 
        selectedEvent={selectedEvent}
        onBack={() => {
          setSelectedEvent(null);
          setCurrentView("dashboard");
        }}
      />
    );
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
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setCurrentView("events")}
              className="gap-2"
            >
              <CalendarDays className="h-5 w-5" />
              Events
            </Button>
            <Button 
              size="lg" 
              onClick={() => {
                const openEvents = events.filter(event => event.status === 'open');
                if (openEvents.length === 0) {
                  toast({
                    title: "No Open Events Available",
                    description: "Please create and open an event first before accessing the queue system.",
                    variant: "destructive",
                  });
                } else {
                  setShowQueueMode(true);
                  document.getElementById('events-table')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="gap-2"
            >
              <ClipboardList className="h-5 w-5" />
              Queue System
            </Button>
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

        {/* Events Table */}
        <Card id="events-table" className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {showQueueMode ? "Open Events - Queue System" : "Events"}
                </CardTitle>
                <CardDescription>
                  {showQueueMode 
                    ? "Select an open event to manage its queue system"
                    : "Manage your health fair events and access queue systems"
                  }
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {showQueueMode && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowQueueMode(false)}
                  >
                    Show All Events
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentView("events")}
                >
                  Create New Event
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading events...</div>
              </div>
            ) : (() => {
              const filteredEvents = showQueueMode ? events.filter(event => event.status === 'open') : events;
              return filteredEvents.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {showQueueMode ? "No open events found" : "No events found"}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setCurrentView("events")}
                    >
                      {showQueueMode ? "Create an Open Event" : "Create Your First Event"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{event.name}</div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                        {(event.start_time || event.end_time) && (
                          <div className="text-sm text-muted-foreground">
                            {event.start_time && event.start_time.slice(0, 5)}
                            {event.start_time && event.end_time && ' - '}
                            {event.end_time && event.end_time.slice(0, 5)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{event.locations.name}</div>
                            {event.locations.address && (
                              <div className="text-sm text-muted-foreground">
                                {event.locations.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(event.status)}>
                          {getStatusIcon(event.status)}
                          <span className="ml-1 capitalize">{event.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEventSelect(event)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Queue
                          </Button>
                          {event.status === 'open' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCloseEvent(event.id)}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                              Close
                            </Button>
                          ) : event.status === 'closed' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEvent(event.id)}
                              className="gap-1"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Reopen
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;