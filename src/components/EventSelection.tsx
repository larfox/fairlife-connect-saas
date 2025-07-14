import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location_name: string;
  address: string;
}

interface EventSelectionProps {
  onEventSelect: (event: any) => void;
  onBack: () => void;
}

const EventSelection = ({ onEventSelect, onBack }: EventSelectionProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveEvents();
  }, []);

  const fetchActiveEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          description,
          event_date,
          start_time,
          end_time,
          locations!inner(
            name,
            address
          ),
          event_doctors(id),
          event_nurses(id),
          event_services(id)
        `)
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Show all active events, regardless of staff assignment
      const availableEvents = data || [];

      const formattedEvents = availableEvents?.map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        location_name: event.locations.name,
        address: event.locations.address
      })) || [];

      setEvents(formattedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error loading events",
        description: "Could not load available health fairs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = () => {
    if (selectedEventId) {
      const selectedEvent = events.find(event => event.id === selectedEventId);
      if (selectedEvent) {
        onEventSelect(selectedEvent);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading available health fairs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Select a Health Fair Event
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose which health fair event you'd like to manage the queue for.
            </p>
          </div>

          {events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Active Health Fairs
                </h3>
                <p className="text-muted-foreground">
                  There are currently no upcoming health fair events available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 mb-8">
                {events.map((event) => (
                  <Card 
                    key={event.id}
                    className={`cursor-pointer transition-[var(--transition-smooth)] hover:shadow-medical ${
                      selectedEventId === event.id 
                        ? 'ring-2 ring-primary shadow-medical' 
                        : 'shadow-card hover:border-primary/20'
                    }`}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2 flex items-center gap-3">
                            {event.name}
                            {selectedEventId === event.id && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </CardTitle>
                          <CardDescription className="text-base">
                            {event.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {formatDate(event.event_date)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <div>
                            <div className="font-medium">{event.location_name}</div>
                            <div className="text-muted-foreground">{event.address}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleSelectEvent}
                  disabled={!selectedEventId}
                  className="px-8"
                >
                  Continue to Queue System
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventSelection;