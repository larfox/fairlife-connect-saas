import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, UserCheck, Mail, Phone, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ProfessionalCapacity = "doctor" | "nurse" | "optician" | "dentist" | "dental_technician" | "registration_technician" | "administration";

interface RegistrationTechnician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  professional_capacity: ProfessionalCapacity;
  is_active: boolean;
  created_at: string;
}

interface AvailableStaff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  professional_capacity: ProfessionalCapacity;
  is_active: boolean;
}

const RegistrationManager = () => {
  const [registrationTechnicians, setRegistrationTechnicians] = useState<RegistrationTechnician[]>([]);
  const [availableStaff, setAvailableStaff] = useState<AvailableStaff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<RegistrationTechnician | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createFromStaff, setCreateFromStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    is_active: true,
  });

  useEffect(() => {
    fetchRegistrationTechnicians();
    fetchAvailableStaff();
  }, []);

  const fetchRegistrationTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("professional_capacity", "registration_technician")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrationTechnicians(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching registration technicians",
        description: error.message,
      });
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      // Get existing registration technician emails to exclude them
      const { data: registrationTechs } = await supabase
        .from("staff")
        .select("email")
        .eq("professional_capacity", "registration_technician");
      
      const techEmails = registrationTechs?.map(t => t.email).filter(Boolean) || [];
      
      // Get staff members who could be registration technicians
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("is_active", true)
        .in("professional_capacity", ["administration", "registration_technician"])
        .not("email", "in", `(${techEmails.map(e => `"${e}"`).join(",")})`);

      if (error) throw error;
      setAvailableStaff(data || []);
    } catch (error: any) {
      console.error("Error fetching available staff:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (createFromStaff && selectedStaffId && !editingTechnician) {
        // Update existing staff member to be a registration technician
        const selectedStaff = availableStaff.find(s => s.id === selectedStaffId);
        if (!selectedStaff) throw new Error("Selected staff member not found");

        const { error } = await supabase
          .from("staff")
          .update({
            professional_capacity: "registration_technician",
          })
          .eq("id", selectedStaffId);

        if (error) throw error;

        toast({
          title: "Registration technician assigned",
          description: "Staff member has been successfully assigned as a registration technician.",
        });
      } else {
        // Clean up empty strings to null for optional fields
        const cleanFormData = {
          ...formData,
          phone: formData.phone || null,
          email: formData.email || null,
          professional_capacity: "registration_technician" as ProfessionalCapacity,
        };

        if (editingTechnician) {
          const { error } = await supabase
            .from("staff")
            .update(cleanFormData)
            .eq("id", editingTechnician.id);

          if (error) throw error;

          toast({
            title: "Registration technician updated",
            description: "Registration technician profile has been successfully updated.",
          });
        } else {
          const { error } = await supabase
            .from("staff")
            .insert([cleanFormData]);

          if (error) throw error;

          toast({
            title: "Registration technician created",
            description: "New registration technician profile has been successfully created.",
          });
        }
      }

      setIsDialogOpen(false);
      setEditingTechnician(null);
      resetForm();
      fetchRegistrationTechnicians();
      fetchAvailableStaff();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingTechnician ? "Error updating registration technician" : "Error creating registration technician",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (technician: RegistrationTechnician) => {
    setEditingTechnician(technician);
    setFormData({
      first_name: technician.first_name,
      last_name: technician.last_name,
      phone: technician.phone || "",
      email: technician.email || "",
      is_active: technician.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Registration technician deleted",
        description: "Registration technician profile has been successfully deleted.",
      });
      fetchRegistrationTechnicians();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting registration technician",
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      is_active: true,
    });
    setCreateFromStaff(false);
    setSelectedStaffId("");
  };

  const openCreateDialog = () => {
    setEditingTechnician(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleStaffSelection = (staffId: string) => {
    setSelectedStaffId(staffId);
    const selectedStaff = availableStaff.find(s => s.id === staffId);
    if (selectedStaff) {
      setFormData(prev => ({
        ...prev,
        first_name: selectedStaff.first_name,
        last_name: selectedStaff.last_name,
        email: selectedStaff.email,
        phone: selectedStaff.phone || "",
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Registration Technicians</h3>
          <p className="text-sm text-muted-foreground">
            Manage staff responsible for patient registration and check-in processes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Registration Technician
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTechnician ? "Edit Registration Technician" : "Add Registration Technician"}
                </DialogTitle>
                <DialogDescription>
                  {editingTechnician 
                    ? "Update the registration technician's profile information below."
                    : createFromStaff
                    ? "Select an existing staff member to assign as a registration technician."
                    : "Create a new registration technician profile or select from existing staff."
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingTechnician && (
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={!createFromStaff ? "default" : "outline"}
                      onClick={() => {
                        setCreateFromStaff(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Create New
                    </Button>
                    <Button
                      type="button"
                      variant={createFromStaff ? "default" : "outline"}
                      onClick={() => setCreateFromStaff(true)}
                      className="flex-1"
                      disabled={availableStaff.length === 0}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      From Staff
                    </Button>
                  </div>
                )}

                {createFromStaff && !editingTechnician && (
                  <div className="space-y-2">
                    <Label htmlFor="staff_select">Select Staff Member</Label>
                    <Select value={selectedStaffId} onValueChange={handleStaffSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStaff.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.first_name} {staff.last_name} ({staff.professional_capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(!createFromStaff || editingTechnician) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="John"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="technician@hospital.com"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {(createFromStaff && selectedStaffId) && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Selected Staff Member:</p>
                    <p className="font-medium">
                      {availableStaff.find(s => s.id === selectedStaffId)?.first_name}{" "}
                      {availableStaff.find(s => s.id === selectedStaffId)?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {availableStaff.find(s => s.id === selectedStaffId)?.email}
                    </p>
                  </div>
                )}

                {(!createFromStaff || editingTechnician) && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                )}

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isLoading || (createFromStaff && !selectedStaffId && !editingTechnician)}
                  >
                    {isLoading ? "Saving..." : (editingTechnician ? "Update" : "Create")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Registration Technicians Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrationTechnicians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <UserCheck className="h-8 w-8" />
                    <p>No registration technicians found</p>
                    <p className="text-sm">Add your first registration technician to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              registrationTechnicians.map((technician) => (
                <TableRow key={technician.id}>
                  <TableCell className="font-medium">
                    {technician.first_name} {technician.last_name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {technician.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {technician.phone}
                        </div>
                      )}
                      {technician.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {technician.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${technician.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm">{technician.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(technician)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(technician.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RegistrationManager;