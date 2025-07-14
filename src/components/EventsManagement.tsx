import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, MapPin, Clock, Plus, Pencil, ArrowLeft, Users, Stethoscope, HeartHandshake, ChevronDown, ChevronRight, UserPlus, Activity, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { EventCard } from "./EventCard";

interface EventsManagementProps {
  onBack: () => void;
}

type Event = Tables<"events"> & {
  locations: { name: string; address: string | null } | null;
  event_doctors?: (Tables<"event_doctors"> & { doctors: Tables<"doctors"> })[];
  event_nurses?: (Tables<"event_nurses"> & { nurses: Tables<"nurses"> })[];
  event_services?: (Tables<"event_services"> & { services: Tables<"services"> })[];
};

const EventsManagement = ({ onBack }: EventsManagementProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [openEvents, setOpenEvents] = useState<Event[]>([]);
  const [closedEvents, setClosedEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Tables<"locations">[]>([]);
  const [doctors, setDoctors] = useState<Tables<"doctors">[]>([]);
  const [nurses, setNurses] = useState<Tables<"nurses">[]>([]);
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location_id: "",
    status: "open" as "open" | "pending" | "closed"
  });

  useEffect(() => {
    fetchEvents();
    fetchLocations();
    fetchDoctors();
    fetchNurses();
    fetchServices();
  }, []);

  useEffect(() => {
    // Separate events: only "open" status for open events, "closed" status for closed events
    const openEventsFiltered = events.filter(event => event.status === 'open');
    const closedEventsFiltered = events.filter(event => event.status === 'closed');

    // Apply search filter to both open and closed events
    const applySearchFilter = (eventsList: Event[]) => {
      if (searchTerm) {
        return eventsList.filter(event =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.locations?.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      return eventsList;
    };

    setOpenEvents(applySearchFilter(openEventsFiltered));
    setClosedEvents(applySearchFilter(closedEventsFiltered));
  }, [events, searchTerm]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          locations (
            name,
            address
          ),
          event_doctors (
            id,
            role,
            created_at,
            updated_at,
            doctor_id,
            event_id,
            doctors (
              id,
              first_name,
              last_name,
              specialization,
              created_at,
              updated_at,
              email,
              phone,
              license_number,
              is_active
            )
          ),
          event_nurses (
            id,
            role,
            created_at,
            updated_at,
            nurse_id,
            event_id,
            nurses (
              id,
              first_name,
              last_name,
              certification_level,
              created_at,
              updated_at,
              email,
              phone,
              license_number,
              is_active
            )
          ),
          event_services (
            id,
            created_at,
            updated_at,
            service_id,
            event_id,
            services (
              id,
              name,
              description,
              duration_minutes,
              created_at,
              updated_at,
              is_active
            )
          )
        `)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data as Event[] || []);
    } catch (error) {
      toast({
        title: "Error fetching events",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      toast({
        title: "Error fetching locations",
        description: "Failed to load locations.",
        variant: "destructive",
      });
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("last_name");

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      toast({
        title: "Error fetching doctors",
        description: "Failed to load doctors.",
        variant: "destructive",
      });
    }
  };

  const fetchNurses = async () => {
    try {
      const { data, error } = await supabase
        .from("nurses")
        .select("*")
        .eq("is_active", true)
        .order("last_name");

      if (error) throw error;
      setNurses(data || []);
    } catch (error) {
      toast({
        title: "Error fetching nurses",
        description: "Failed to load nurses.",
        variant: "destructive",
      });
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast({
        title: "Error fetching services",
        description: "Failed to load services.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from("events")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });

      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        description: "",
        event_date: "",
        start_time: "",
        end_time: "",
        location_id: "",
        status: "open"
      });
      fetchEvents();
    } catch (error) {
      toast({
        title: "Error creating event",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!editingEvent) return;

    try {
      const { error } = await supabase
        .from("events")
        .update(formData)
        .eq("id", editingEvent.id);

      if (error) throw error;

      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });

      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      toast({
        title: "Error updating event",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || "",
      event_date: event.event_date,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      location_id: event.location_id,
      status: (event.status as "open" | "pending" | "closed") || "open"
    });
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const addResourceToEvent = async (eventId: string, resourceType: 'doctor' | 'nurse' | 'service', resourceId: string, role?: string) => {
    try {
      console.log(`Adding ${resourceType} ${resourceId} to event ${eventId}`);
      
      if (resourceType === 'doctor') {
        const { data, error } = await supabase
          .from('event_doctors')
          .insert([{ 
            event_id: eventId, 
            doctor_id: resourceId,
            role: role || 'attending'
          }])
          .select();
        
        console.log('Doctor insert result:', data, 'Error:', error);
        if (error) throw error;
      } else if (resourceType === 'nurse') {
        const { data, error } = await supabase
          .from('event_nurses')
          .insert([{ 
            event_id: eventId, 
            nurse_id: resourceId,
            role: role || 'staff'
          }])
          .select();
        
        console.log('Nurse insert result:', data, 'Error:', error);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('event_services')
          .insert([{ 
            event_id: eventId, 
            service_id: resourceId
          }])
          .select();
        
        console.log('Service insert result:', data, 'Error:', error);
        if (error) throw error;
      }

      toast({
        title: "Resource added",
        description: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} has been added to the event.`,
      });

      fetchEvents(); // Refresh the events to show the new resource
    } catch (error) {
      console.error('Error adding resource:', error);
      toast({
        title: "Error adding resource",
        description: `Failed to add ${resourceType} to event. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const removeResourceFromEvent = async (eventId: string, resourceType: 'doctor' | 'nurse' | 'service', resourceRelationId: string) => {
    try {
      const table = resourceType === 'doctor' ? 'event_doctors' : 
                   resourceType === 'nurse' ? 'event_nurses' : 'event_services';

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', resourceRelationId);

      if (error) throw error;

      toast({
        title: "Resource removed",
        description: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} has been removed from the event.`,
      });

      fetchEvents(); // Refresh the events
    } catch (error) {
      toast({
        title: "Error removing resource",
        description: `Failed to remove ${resourceType} from event. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const badgeVariant = 
      status === "open" ? "default" :
      status === "pending" ? "outline" :
      "secondary";
    
    const statusText = 
      status === "open" ? "Open" :
      status === "pending" ? "Pending" :
      status === "closed" ? "Closed" :
      "Unknown";
    
    return (
      <Badge variant={badgeVariant}>
        {statusText}
      </Badge>
    );
  };

  const reopenEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "open" })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Event reopened",
        description: "The event has been reopened successfully.",
      });

      fetchEvents();
    } catch (error) {
      toast({
        title: "Error reopening event",
        description: "Failed to reopen event. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Events Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage all your health fair events
              </p>
            </div>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Create a new health fair event
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Event Name</Label>
                  <Select value={formData.name} onValueChange={(value) => setFormData({...formData, name: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event name from location" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.name}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {location.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter event description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event_date">Event Date</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "open" | "pending" | "closed") => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search events or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Open Events Section */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">Open Events</h2>
            <Badge variant="default" className="text-sm px-3 py-1">
              {openEvents.length}
            </Badge>
          </div>
          
          {openEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No open events found.
                </div>
              </CardContent>
            </Card>
          ) : (
            openEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                showReopenButton={false}
                onReopen={reopenEvent}
                onEdit={openEditModal}
                expandedEvents={expandedEvents}
                onToggleExpansion={toggleEventExpansion}
                onAddResource={addResourceToEvent}
                onRemoveResource={removeResourceFromEvent}
                getStatusBadge={getStatusBadge}
                doctors={doctors}
                nurses={nurses}
                services={services}
              />
            ))
          )}
        </div>

        {/* Closed Events Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">Closed Events</h2>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {closedEvents.length}
            </Badge>
          </div>
          
          {closedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No closed events found.
                </div>
              </CardContent>
            </Card>
          ) : (
            closedEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                showReopenButton={true}
                onReopen={reopenEvent}
                onEdit={openEditModal}
                expandedEvents={expandedEvents}
                onToggleExpansion={toggleEventExpansion}
                onAddResource={addResourceToEvent}
                onRemoveResource={removeResourceFromEvent}
                getStatusBadge={getStatusBadge}
                doctors={doctors}
                nurses={nurses}
                services={services}
              />
            ))
          )}
        </div>

        {/* Edit Event Dialog */}
        <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the event details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto flex-1">
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Event Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter event name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter event description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_event_date">Event Date</Label>
                <Input
                  id="edit_event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_start_time">Start Time</Label>
                  <Input
                    id="edit_start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_end_time">End Time</Label>
                  <Input
                    id="edit_end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_location">Location</Label>
                <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value: "open" | "pending" | "closed") => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EventsManagement;