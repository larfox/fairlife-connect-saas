import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Eye, 
  Calendar, 
  MapPin, 
  Activity, 
  FileText,
  Heart,
  Stethoscope,
  Pill,
  Syringe,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import PatientHistoryModal from "./PatientHistoryModal";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  medications: string | null;
}

interface PatientVisit {
  id: string;
  visit_date: string;
  status: string;
  queue_number: number;
  basic_screening_completed: boolean;
  event: {
    id: string;
    name: string;
    event_date: string;
    location_id?: string;
    location: {
      name: string;
    };
  };
  patient: Patient;
}

interface ServiceHistory {
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

interface Location {
  id: string;
  name: string;
}

interface PatientHistoryProps {
  selectedEventId?: string;
}

const PatientHistory = ({ selectedEventId }: PatientHistoryProps) => {
  const [patientVisits, setPatientVisits] = useState<PatientVisit[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [selectedPatientVisit, setSelectedPatientVisit] = useState<PatientVisit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchPatientHistory = async () => {
    try {
      // Fetch patient visits with location data
      let visitsQuery = supabase
        .from("patient_visits")
        .select(`
          *,
          patients!inner (
            id,
            first_name,
            last_name,
            date_of_birth,
            phone,
            email,
            gender,
            medical_conditions,
            allergies,
            medications
          ),
          events!inner (
            id,
            name,
            event_date,
            location_id,
            locations (
              id,
              name
            )
          )
        `)
        .order("visit_date", { ascending: false });

      // If a specific event is selected, filter by it
      if (selectedEventId) {
        visitsQuery = visitsQuery.eq("event_id", selectedEventId);
      }

      // Fetch all locations for the filter dropdown
      const [visitsResult, locationsResult] = await Promise.all([
        visitsQuery,
        supabase.from("locations").select("id, name").eq("is_active", true).order("name")
      ]);

      if (visitsResult.error) throw visitsResult.error;
      if (locationsResult.error) throw locationsResult.error;

      // Transform the visits data to match our interface
      const transformedData: PatientVisit[] = (visitsResult.data || []).map(visit => ({
        id: visit.id,
        visit_date: visit.visit_date,
        status: visit.status,
        queue_number: visit.queue_number,
        basic_screening_completed: visit.basic_screening_completed,
        event: {
          id: visit.events.id,
          name: visit.events.name,
          event_date: visit.events.event_date,
          location_id: visit.events.location_id,
          location: {
            name: visit.events.locations?.name || 'Unknown Location'
          }
        },
        patient: visit.patients
      }));

      setPatientVisits(transformedData);
      setLocations(locationsResult.data || []);
    } catch (error) {
      console.error("Error fetching patient history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch patient history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientHistory();
  }, [selectedEventId]);

  const handleViewDetails = (visit: PatientVisit) => {
    setSelectedPatientVisit(visit);
    setIsDetailModalOpen(true);
  };

  const filteredVisits = patientVisits.filter((visit) => {
    const matchesSearch = 
      visit.patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patient.phone?.includes(searchTerm) ||
      visit.event.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = selectedLocationId === "all" || visit.event.location_id === selectedLocationId;

    return matchesSearch && matchesLocation;
  });

  // Calculate statistics
  const totalVisits = patientVisits.length;
  const completedScreenings = patientVisits.filter(v => v.basic_screening_completed).length;
  const uniquePatients = new Set(patientVisits.map(v => v.patient.id)).size;
  const uniqueEvents = new Set(patientVisits.map(v => v.event.id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading patient history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Patient History</h2>
          <p className="text-muted-foreground">
            View comprehensive patient visit history and service records across all health fairs
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, email, phone, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(searchTerm || selectedLocationId !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSelectedLocationId("all");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold text-foreground">{totalVisits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Screenings</p>
                <p className="text-2xl font-bold text-foreground">{completedScreenings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Patients</p>
                <p className="text-2xl font-bold text-foreground">{uniquePatients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Fairs</p>
                <p className="text-2xl font-bold text-foreground">{uniqueEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Visit History</CardTitle>
          <CardDescription>
            {filteredVisits.length} of {patientVisits.length} visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Queue #</TableHead>
                  <TableHead>Screening Status</TableHead>
                  <TableHead>Visit Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">
                          {visit.patient.first_name} {visit.patient.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {visit.patient.phone && (
                            <span className="block">{visit.patient.phone}</span>
                          )}
                          {visit.patient.email && (
                            <span className="block">{visit.patient.email}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{visit.event.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{visit.event.location.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(visit.event.event_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(visit.visit_date), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{visit.queue_number}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={visit.basic_screening_completed ? "default" : "secondary"}
                      >
                        {visit.basic_screening_completed ? "Completed" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          visit.status === "completed" ? "default" :
                          visit.status === "in_progress" ? "secondary" :
                          "outline"
                        }
                      >
                        {visit.status?.replace('_', ' ').toUpperCase() || "CHECKED IN"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(visit)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredVisits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No patient visits found matching your search." : "No patient visits recorded yet."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient History Detail Modal */}
      {selectedPatientVisit && (
        <PatientHistoryModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          patientVisit={selectedPatientVisit}
        />
      )}
    </div>
  );
};

export default PatientHistory;