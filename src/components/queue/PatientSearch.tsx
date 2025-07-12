import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, Calendar, AlertTriangle, History, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PatientDetailsModal from "./PatientDetailsModal";
import { PatientEditModal } from "./PatientEditModal";

interface PatientSearchProps {
  selectedEvent: any;
}

interface PatientRecord {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  patient_visits: {
    id: string;
    queue_number: number;
    visit_date: string;
    status: string;
    event: {
      name: string;
    };
  }[];
}

const PatientSearch = ({ selectedEvent }: PatientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a name, patient number, phone, or email to search.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          patient_visits (
            id,
            queue_number,
            visit_date,
            status,
            events (
              name
            )
          )
        `)
        .or(`
          first_name.ilike.%${searchTerm}%,
          last_name.ilike.%${searchTerm}%,
          patient_number.ilike.%${searchTerm}%,
          phone.ilike.%${searchTerm}%,
          email.ilike.%${searchTerm}%
        `)
        .order("last_name");

      if (error) throw error;

      setSearchResults(data?.map(patient => ({
        ...patient,
        patient_visits: patient.patient_visits.map((visit: any) => ({
          ...visit,
          event: visit.events
        }))
      })) || []);

    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search patients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addToCurrentEvent = async (patientId: string) => {
    try {
      // Check if patient is already registered for this event
      const { data: existingVisit, error: checkError } = await supabase
        .from("patient_visits")
        .select("*")
        .eq("patient_id", patientId)
        .eq("event_id", selectedEvent.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingVisit) {
        toast({
          title: "Already registered",
          description: "This patient is already registered for this event.",
          variant: "destructive",
        });
        return;
      }

      // Get next queue number
      const { data: existingVisits, error: visitsError } = await supabase
        .from("patient_visits")
        .select("queue_number")
        .eq("event_id", selectedEvent.id)
        .order("queue_number", { ascending: false })
        .limit(1);

      if (visitsError) throw visitsError;

      const nextQueueNumber = (existingVisits?.[0]?.queue_number || 0) + 1;

      // Create patient visit record
      const { error: visitError } = await supabase
        .from("patient_visits")
        .insert([{
          patient_id: patientId,
          event_id: selectedEvent.id,
          queue_number: nextQueueNumber,
          status: 'checked_in'
        }]);

      if (visitError) throw visitError;

      toast({
        title: "Patient added to event",
        description: `Patient has been assigned queue number ${nextQueueNumber}.`,
      });

      // Refresh search results
      handleSearch();

    } catch (error) {
      toast({
        title: "Failed to add patient",
        description: "Could not add patient to the current event.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Patient Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, patient number, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Visit History</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((patient) => {
                  const currentEventVisit = patient.patient_visits.find(
                    visit => visit.event?.name === selectedEvent.name
                  );
                  
                  return (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <Badge variant="outline">{patient.patient_number}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                          {patient.date_of_birth && (
                            <p className="text-sm text-muted-foreground">
                              DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {patient.phone && <p>📞 {patient.phone}</p>}
                          {patient.email && <p>✉️ {patient.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4" />
                          <span className="text-sm">{patient.patient_visits.length} visits</span>
                          {currentEventVisit && (
                            <Badge variant="default">
                              Queue #{currentEventVisit.queue_number}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {patient.allergies && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Allergies
                            </Badge>
                          )}
                          {patient.medical_conditions && (
                            <Badge variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Conditions
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                       <TableCell>
                         <div className="flex gap-2">
                           <Button 
                             size="sm" 
                             variant="outline"
                             onClick={() => setSelectedPatient(patient)}
                             className="gap-1"
                           >
                             <User className="h-3 w-3" />
                             Details
                           </Button>
                           <Button 
                             size="sm" 
                             variant="outline"
                             onClick={() => setEditingPatient(patient)}
                             className="gap-1"
                           >
                             <Edit className="h-3 w-3" />
                             Edit
                           </Button>
                           {!currentEventVisit && (
                             <Button 
                               size="sm"
                               onClick={() => addToCurrentEvent(patient.id)}
                               className="gap-1"
                             >
                               <Calendar className="h-3 w-3" />
                               Add to Event
                             </Button>
                           )}
                         </div>
                       </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedPatient && (
        <PatientDetailsModal 
          patient={selectedPatient}
          eventId={selectedEvent.id}
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {editingPatient && (
        <PatientEditModal 
          patient={editingPatient}
          isOpen={!!editingPatient}
          onClose={() => setEditingPatient(null)}
          onPatientUpdated={() => {
            handleSearch(); // Refresh search results
            setEditingPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientSearch;