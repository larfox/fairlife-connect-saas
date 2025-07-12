import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, User, Calendar, AlertTriangle, History, Edit, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PatientDetailsModal from "./PatientDetailsModal";
import { PatientEditModal } from "./PatientEditModal";

interface ServicePatientSearchProps {
  selectedEvent: any;
  serviceId: string;
  serviceName: string;
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

const ServicePatientSearch = ({ selectedEvent, serviceId, serviceName }: ServicePatientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PatientRecord[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
            selectPatient(searchResults[highlightedIndex]);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    if (showDropdown) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showDropdown, searchResults, highlightedIndex]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    console.log("=== SERVICE PATIENT SEARCH DEBUG ===");
    console.log("Search term:", searchTerm);
    console.log("Selected event:", selectedEvent);
    console.log("Service ID:", serviceId);
    console.log("Service name:", serviceName);

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email,
          date_of_birth,
          allergies,
          medical_conditions,
          patient_visits (
            id,
            queue_number,
            visit_date,
            status,
            events!patient_visits_event_id_fkey (
              name
            )
          )
        `)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,patient_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .eq("is_active", true)
        .limit(10);

      console.log("Search query result:", data);
      console.log("Search query error:", error);

      if (error) throw error;

      const formattedResults = data?.map(patient => ({
        ...patient,
        patient_visits: patient.patient_visits.map(visit => ({
          ...visit,
          event: visit.events
        }))
      })) || [];

      console.log("Formatted search results:", formattedResults);
      console.log("Number of results:", formattedResults.length);

      setSearchResults(formattedResults);
      setShowDropdown(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Failed to search for patients.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          selectPatient(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectPatient = (patient: PatientRecord) => {
    setSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_number})`);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const addToCurrentEvent = async (patientId: string) => {
    try {
      // Check if patient already has a visit for this event
      const { data: existingVisit, error: visitCheckError } = await supabase
        .from("patient_visits")
        .select("id")
        .eq("patient_id", patientId)
        .eq("event_id", selectedEvent.id)
        .maybeSingle();

      if (visitCheckError) throw visitCheckError;

      if (existingVisit) {
        // Check if they already have the specific service in queue
        const { data: existingService, error: serviceCheckError } = await supabase
          .from("service_queue")
          .select("id")
          .eq("patient_visit_id", existingVisit.id)
          .eq("service_id", serviceId)
          .maybeSingle();

        if (serviceCheckError) throw serviceCheckError;

        if (existingService) {
          toast({
            title: "Already in queue",
            description: `Patient is already queued for ${serviceName}.`,
            variant: "destructive",
          });
          return;
        }

        // Add the service to existing visit
        const { error: queueError } = await supabase
          .from("service_queue")
          .insert({
            patient_visit_id: existingVisit.id,
            service_id: serviceId,
            status: 'waiting'
          });

        if (queueError) throw queueError;

        toast({
          title: "Added to service queue",
          description: `Patient added to ${serviceName} queue.`,
        });
        return;
      }

      // Get next queue number
      const { data: queueData, error: queueError } = await supabase
        .from("patient_visits")
        .select("queue_number")
        .eq("event_id", selectedEvent.id)
        .order("queue_number", { ascending: false })
        .limit(1);

      if (queueError) throw queueError;

      const nextQueueNumber = (queueData?.[0]?.queue_number || 0) + 1;

      // Create new visit
      const { data: newVisit, error: visitError } = await supabase
        .from("patient_visits")
        .insert({
          patient_id: patientId,
          event_id: selectedEvent.id,
          queue_number: nextQueueNumber,
          status: 'checked_in'
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Add to service queue
      const { error: serviceQueueError } = await supabase
        .from("service_queue")
        .insert({
          patient_visit_id: newVisit.id,
          service_id: serviceId,
          status: 'waiting'
        });

      if (serviceQueueError) throw serviceQueueError;

      toast({
        title: "Patient added",
        description: `Patient added to ${serviceName} queue with number #${nextQueueNumber}.`,
      });

      setSearchTerm("");
      setSearchResults([]);
      setShowDropdown(false);

    } catch (error) {
      console.error("Error adding patient:", error);
      toast({
        title: "Failed to add patient",
        description: "Could not add patient to the queue.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Patients for {serviceName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search by name, patient number, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
              {loading && (
                <div className="absolute right-3 top-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto bg-background border rounded-lg shadow-lg">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No patients found matching your search.
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((patient, index) => (
                      <div
                        key={patient.id}
                        className={`px-4 py-3 border-b last:border-b-0 transition-colors ${
                          index === highlightedIndex ? 'bg-accent' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {patient.first_name} {patient.last_name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {patient.patient_number}
                              </Badge>
                              {patient.allergies && (
                                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {patient.phone && <div>📞 {patient.phone}</div>}
                              {patient.email && <div>✉️ {patient.email}</div>}
                              {patient.date_of_birth && <div>🎂 {formatDate(patient.date_of_birth)}</div>}
                              {patient.allergies && (
                                <div className="text-red-600">⚠️ Allergies: {patient.allergies}</div>
                              )}
                              {patient.medical_conditions && (
                                <div className="text-orange-600">🏥 Conditions: {patient.medical_conditions}</div>
                              )}
                            </div>

                            {/* Recent Visits */}
                            {patient.patient_visits.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <History className="h-3 w-3" />
                                  Recent visits:
                                </div>
                                <div className="space-y-1">
                                  {patient.patient_visits.slice(0, 3).map((visit) => (
                                    <div key={visit.id} className="text-xs bg-muted/50 rounded p-1">
                                      <span className="font-medium">#{visit.queue_number}</span> - {visit.event.name} 
                                      <span className="text-muted-foreground ml-1">
                                        ({formatDate(visit.visit_date)})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => setSelectedPatient(patient)}
                              variant="outline"
                              className="gap-1 text-xs"
                            >
                              <User className="h-3 w-3" />
                              Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setEditingPatient(patient)}
                              variant="outline"
                              className="gap-1 text-xs"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => addToCurrentEvent(patient.id)}
                              className="gap-1 text-xs"
                            >
                              <Calendar className="h-3 w-3" />
                              Add to {serviceName}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          eventId={selectedEvent.id}
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {/* Patient Edit Modal */}
      {editingPatient && (
        <PatientEditModal
          patient={editingPatient}
          selectedEvent={selectedEvent}
          isOpen={!!editingPatient}
          onClose={() => setEditingPatient(null)}
          onPatientUpdated={() => {
            setEditingPatient(null);
            // Refresh search if needed
            if (searchTerm.trim()) {
              handleSearch();
            }
          }}
        />
      )}
    </div>
  );
};

export default ServicePatientSearch;