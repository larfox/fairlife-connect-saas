import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, MapPin, Clock, Plus, Pencil, Users, Stethoscope, HeartHandshake, ChevronDown, ChevronRight, UserPlus, Activity, RotateCcw } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Event = Tables<"events"> & {
  locations: { name: string; address: string | null } | null;
  event_doctors?: (Tables<"event_doctors"> & { doctors: Tables<"doctors"> })[];
  event_nurses?: (Tables<"event_nurses"> & { nurses: Tables<"nurses"> })[];
  event_services?: (Tables<"event_services"> & { services: Tables<"services"> })[];
};

interface EventCardProps {
  event: Event;
  showReopenButton: boolean;
  onReopen: (eventId: string) => void;
  onEdit: (event: Event) => void;
  expandedEvents: Set<string>;
  onToggleExpansion: (eventId: string) => void;
  onAddResource: (eventId: string, type: 'doctor' | 'nurse' | 'service', resourceId: string) => void;
  onRemoveResource: (eventId: string, type: 'doctor' | 'nurse' | 'service', resourceId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  doctors: Tables<"doctors">[];
  nurses: Tables<"nurses">[];
  services: Tables<"services">[];
}

export const EventCard = ({
  event,
  showReopenButton,
  onReopen,
  onEdit,
  expandedEvents,
  onToggleExpansion,
  onAddResource,
  onRemoveResource,
  getStatusBadge,
  doctors,
  nurses,
  services
}: EventCardProps) => {
  return (
    <Card className="hover:shadow-card transition-[var(--transition-smooth)]">
      <CardContent className="p-6">
        {/* Event Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="bg-gradient-primary/10 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">{event.name}</h3>
              <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {format(new Date(event.event_date), "MMM dd, yyyy")}
                  {event.start_time && ` • ${event.start_time}`}
                  {event.end_time && ` - ${event.end_time}`}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {event.locations?.name}
                </div>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusBadge(event.status)}
            {showReopenButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReopen(event.id)}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reopen
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(event)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Resource Summary */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              <span>{event.event_doctors?.length || 0} Doctors</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4" />
              <span>{event.event_nurses?.length || 0} Nurses</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>{event.event_services?.length || 0} Services</span>
            </div>
          </div>
          
          <Collapsible 
            open={expandedEvents.has(event.id)} 
            onOpenChange={() => onToggleExpansion(event.id)}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {expandedEvents.has(event.id) ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Hide Resources
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Manage Resources
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <div className="border-t pt-4">
                <Tabs defaultValue="doctors" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="doctors" className="gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Doctors
                    </TabsTrigger>
                    <TabsTrigger value="nurses" className="gap-2">
                      <HeartHandshake className="h-4 w-4" />
                      Nurses
                    </TabsTrigger>
                    <TabsTrigger value="services" className="gap-2">
                      <Activity className="h-4 w-4" />
                      Services
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Doctors Tab */}
                  <TabsContent value="doctors" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Assigned Doctors</h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Doctor
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Doctor to Event</DialogTitle>
                            <DialogDescription>
                              Select a doctor to assign to this event.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Select Doctor</Label>
                              <Select onValueChange={(doctorId) => {
                                onAddResource(event.id, 'doctor', doctorId);
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {doctors.filter(doctor => 
                                    !event.event_doctors?.some(ed => ed.doctors.id === doctor.id)
                                  ).map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                      Dr. {doctor.first_name} {doctor.last_name}
                                      {doctor.specialization && ` - ${doctor.specialization}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="space-y-2">
                      {event.event_doctors?.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No doctors assigned yet.</p>
                      ) : (
                        event.event_doctors?.map((eventDoctor) => (
                          <div key={eventDoctor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">
                                Dr. {eventDoctor.doctors.first_name} {eventDoctor.doctors.last_name}
                              </p>
                              {eventDoctor.doctors.specialization && (
                                <p className="text-sm text-muted-foreground">{eventDoctor.doctors.specialization}</p>
                              )}
                              <Badge variant="outline" className="mt-1">
                                {eventDoctor.role}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveResource(event.id, 'doctor', eventDoctor.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Nurses Tab */}
                  <TabsContent value="nurses" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Assigned Nurses</h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Nurse
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Nurse to Event</DialogTitle>
                            <DialogDescription>
                              Select a nurse to assign to this event.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Select Nurse</Label>
                              <Select onValueChange={(nurseId) => {
                                onAddResource(event.id, 'nurse', nurseId);
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a nurse" />
                                </SelectTrigger>
                                <SelectContent>
                                  {nurses.filter(nurse => 
                                    !event.event_nurses?.some(en => en.nurses.id === nurse.id)
                                  ).map((nurse) => (
                                    <SelectItem key={nurse.id} value={nurse.id}>
                                      {nurse.first_name} {nurse.last_name}
                                      {nurse.certification_level && ` - ${nurse.certification_level}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="space-y-2">
                      {event.event_nurses?.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No nurses assigned yet.</p>
                      ) : (
                        event.event_nurses?.map((eventNurse) => (
                          <div key={eventNurse.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">
                                {eventNurse.nurses.first_name} {eventNurse.nurses.last_name}
                              </p>
                              {eventNurse.nurses.certification_level && (
                                <p className="text-sm text-muted-foreground">{eventNurse.nurses.certification_level}</p>
                              )}
                              <Badge variant="outline" className="mt-1">
                                {eventNurse.role}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveResource(event.id, 'nurse', eventNurse.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Services Tab */}
                  <TabsContent value="services" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Assigned Services</h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Service
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Service to Event</DialogTitle>
                            <DialogDescription>
                              Select a service to include in this event.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Select Service</Label>
                              <Select onValueChange={(serviceId) => {
                                onAddResource(event.id, 'service', serviceId);
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a service" />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.filter(service => 
                                    !event.event_services?.some(es => es.services.id === service.id)
                                  ).map((service) => (
                                    <SelectItem key={service.id} value={service.id}>
                                      {service.name}
                                      {service.duration_minutes && ` (${service.duration_minutes} min)`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="space-y-2">
                      {event.event_services?.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No services assigned yet.</p>
                      ) : (
                        event.event_services?.map((eventService) => (
                          <div key={eventService.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{eventService.services.name}</p>
                              {eventService.services.description && (
                                <p className="text-sm text-muted-foreground">{eventService.services.description}</p>
                              )}
                              {eventService.services.duration_minutes && (
                                <Badge variant="outline" className="mt-1">
                                  {eventService.services.duration_minutes} minutes
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveResource(event.id, 'service', eventService.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};