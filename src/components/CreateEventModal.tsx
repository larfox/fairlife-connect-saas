import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, MapPin, Users, Stethoscope, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
  address: string;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
}

interface Nurse {
  id: string;
  first_name: string;
  last_name: string;
  certification_level: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
}

export function CreateEventModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location_id: "",
    selectedDoctors: [] as string[],
    selectedNurses: [] as string[],
    selectedServices: [] as string[]
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [locationsResult, doctorsResult, nursesResult, servicesResult] = await Promise.all([
        supabase.from("locations").select("id, name, address").eq("is_active", true),
        supabase.from("doctors").select("id, first_name, last_name, specialization").eq("is_active", true),
        supabase.from("nurses").select("id, first_name, last_name, certification_level").eq("is_active", true),
        supabase.from("services").select("id, name, description").eq("is_active", true)
      ]);

      setLocations(locationsResult.data || []);
      setDoctors(doctorsResult.data || []);
      setNurses(nursesResult.data || []);
      setServices(servicesResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          name: formData.name,
          description: formData.description,
          event_date: formData.event_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location_id: formData.location_id
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Link selected doctors
      if (formData.selectedDoctors.length > 0) {
        const eventDoctors = formData.selectedDoctors.map(doctorId => ({
          event_id: event.id,
          doctor_id: doctorId
        }));
        const { error: doctorsError } = await supabase
          .from("event_doctors")
          .insert(eventDoctors);
        if (doctorsError) throw doctorsError;
      }

      // Link selected nurses
      if (formData.selectedNurses.length > 0) {
        const eventNurses = formData.selectedNurses.map(nurseId => ({
          event_id: event.id,
          nurse_id: nurseId
        }));
        const { error: nursesError } = await supabase
          .from("event_nurses")
          .insert(eventNurses);
        if (nursesError) throw nursesError;
      }

      // Link selected services
      if (formData.selectedServices.length > 0) {
        const eventServices = formData.selectedServices.map(serviceId => ({
          event_id: event.id,
          service_id: serviceId
        }));
        const { error: servicesError } = await supabase
          .from("event_services")
          .insert(eventServices);
        if (servicesError) throw servicesError;
      }

      toast({
        title: "Success",
        description: "Event created successfully"
      });

      // Reset form and close modal
      setFormData({
        name: "",
        description: "",
        event_date: "",
        start_time: "",
        end_time: "",
        location_id: "",
        selectedDoctors: [],
        selectedNurses: [],
        selectedServices: []
      });
      setOpen(false);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelection = (staffId: string, type: 'doctors' | 'nurses' | 'services') => {
    const key = type === 'doctors' ? 'selectedDoctors' : 
                type === 'nurses' ? 'selectedNurses' : 'selectedServices';
    
    setFormData(prev => ({
      ...prev,
      [key]: prev[key as keyof typeof prev].includes(staffId)
        ? (prev[key as keyof typeof prev] as string[]).filter(id => id !== staffId)
        : [...(prev[key as keyof typeof prev] as string[]), staffId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="medical" size="lg">
          <Calendar className="h-5 w-5" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 m-4 max-w-none max-h-none overflow-y-auto z-[100] bg-background border shadow-lg rounded-lg">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl mb-6">
              <Calendar className="h-5 w-5" />
              Create New Health Fair Event
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Event Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event Name</Label>
                <Select 
                  value={formData.name} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event name from location" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[110] max-h-[200px] overflow-y-auto">
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.name} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {location.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-details">Location Details</Label>
                <Select 
                  value={formData.location_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[110] max-h-[200px] overflow-y-auto">
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{location.name}</div>
                            <div className="text-sm text-muted-foreground">{location.address}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Event description and details..."
              rows={3}
            />
          </div>

          {/* Staff Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Doctors */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Assign Doctors
              </Label>
               <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-background">
                {doctors.map(doctor => (
                  <div key={doctor.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.selectedDoctors.includes(doctor.id)}
                      onCheckedChange={() => handleStaffSelection(doctor.id, 'doctors')}
                    />
                    <div className="text-sm">
                      <div className="font-medium">{doctor.first_name} {doctor.last_name}</div>
                      <div className="text-muted-foreground">{doctor.specialization}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nurses */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Assign Nurses
              </Label>
               <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-background">
                {nurses.map(nurse => (
                  <div key={nurse.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.selectedNurses.includes(nurse.id)}
                      onCheckedChange={() => handleStaffSelection(nurse.id, 'nurses')}
                    />
                    <div className="text-sm">
                      <div className="font-medium">{nurse.first_name} {nurse.last_name}</div>
                      <div className="text-muted-foreground">{nurse.certification_level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Available Services
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-background">
                {services.map(service => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.selectedServices.includes(service.id)}
                      onCheckedChange={() => handleStaffSelection(service.id, 'services')}
                    />
                    <div className="text-sm">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-muted-foreground">{service.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="medical" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}