import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, User, Calendar, AlertTriangle, History, Edit, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PatientDetailsModal from "./PatientDetailsModalWithPermissions";
import { PatientEditModal } from "./PatientEditModal";

interface AutocompletePatientSearchProps {
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

const AutocompletePatientSearch = ({ selectedEvent }: AutocompletePatientSearchProps) => {
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
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
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
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,patient_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order("last_name")
        .limit(10);

      if (error) throw error;

      const formattedResults = data?.map(patient => ({
        ...patient,
        patient_visits: patient.patient_visits.map((visit: any) => ({
          ...visit,
          event: visit.events
        }))
      })) || [];

      setSearchResults(formattedResults);
      setShowDropdown(formattedResults.length > 0);
      setHighlightedIndex(-1);

    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Failed to search patients. Please try again.",
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
        setHighlightedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
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
        inputRef.current?.blur();
        break;
    }
  };

  const selectPatient = (patient: PatientRecord) => {
    setSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_number})`);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    // You can add logic here to handle the selected patient
  };

  const addToCurrentEvent = async (patientId: string) => {
    try {
      // Check if patient is already registered for this event
      const { data: existingVisit, error: checkError } = await supabase
        .from("patient_visits")
        .select("*")
        .eq("patient_id", patientId)
        .eq("event_id", selectedEvent.id)
        .maybeSingle();

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
      console.error("Error adding patient:", error);
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
            Search & Recall Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  placeholder="Type patient name, number, phone, or email (min 2 characters)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                  className="pr-10"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.map((patient, index) => {
                  const currentEventVisit = patient.patient_visits.find(
                    visit => visit.event?.name === selectedEvent.name
                  );
                  
                  return (
                    <div
                      key={patient.id}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        index === highlightedIndex 
                          ? 'bg-accent' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => selectPatient(patient)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {patient.patient_number}
                            </Badge>
                            {currentEventVisit && (
                              <Badge variant="default" className="text-xs">
                                Queue #{currentEventVisit.queue_number}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {patient.phone && <span>📞 {patient.phone}</span>}
                            {patient.phone && patient.email && <span> • </span>}
                            {patient.email && <span>✉️ {patient.email}</span>}
                            {patient.date_of_birth && (
                              <span> • DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mt-1">
                            <History className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {patient.patient_visits.length} visits
                            </span>
                            {patient.allergies && (
                              <Badge variant="destructive" className="text-xs ml-2">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Allergies
                              </Badge>
                            )}
                            {patient.medical_conditions && (
                              <Badge variant="outline" className="text-xs ml-1">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Conditions
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                              setShowDropdown(false);
                            }}
                            className="gap-1"
                          >
                            <User className="h-3 w-3" />
                            Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPatient(patient);
                              setShowDropdown(false);
                            }}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          {!currentEventVisit && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCurrentEvent(patient.id);
                                setShowDropdown(false);
                              }}
                              className="gap-1"
                            >
                              <Calendar className="h-3 w-3" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Loading state */}
            {loading && searchTerm.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-4 text-center text-muted-foreground">
                Searching...
              </div>
            )}

            {/* No results state */}
            {!loading && searchTerm.length >= 2 && searchResults.length === 0 && showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-4 text-center text-muted-foreground">
                No patients found matching "{searchTerm}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
          selectedEvent={selectedEvent}
        />
      )}
    </div>
  );
};

export default AutocompletePatientSearch;