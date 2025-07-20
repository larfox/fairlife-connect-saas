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
import { Plus, Edit, Trash2, Shield, Mail, Phone, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Nurse {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string | null;
  certification_level: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  professional_capacity: string;
  is_active: boolean;
}

const NursesManager = () => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createFromStaff, setCreateFromStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    license_number: "",
    certification_level: "",
    phone: "",
    email: "",
    is_active: true,
  });

  useEffect(() => {
    fetchNurses();
    fetchAvailableStaff();
  }, []);

  const fetchNurses = async () => {
    try {
      const { data, error } = await supabase
        .from("nurses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNurses(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching nurses",
        description: error.message,
      });
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      // Get existing nurse emails to exclude them
      const { data: nurses } = await supabase
        .from("nurses")
        .select("email");
      
      const nurseEmails = nurses?.map(n => n.email).filter(Boolean) || [];
      
      // Get staff members who could be nurses
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("is_active", true)
        .in("professional_capacity", ["nurse", "administration"])
        .not("email", "in", `(${nurseEmails.map(e => `"${e}"`).join(",")})`);

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
      if (createFromStaff && selectedStaffId && !editingNurse) {
        // Create nurse from existing staff member
        const selectedStaff = availableStaff.find(s => s.id === selectedStaffId);
        if (!selectedStaff) throw new Error("Selected staff member not found");

        const nurseData = {
          first_name: selectedStaff.first_name,
          last_name: selectedStaff.last_name,
          email: selectedStaff.email,
          phone: selectedStaff.phone,
          license_number: formData.license_number || null,
          certification_level: formData.certification_level || null,
          is_active: true,
        };

        const { error } = await supabase
          .from("nurses")
          .insert([nurseData]);

        if (error) throw error;

        toast({
          title: "Nurse created from staff",
          description: "Staff member has been successfully added as a nurse.",
        });
      } else {
        // Clean up empty strings to null for optional fields
        const cleanFormData = {
          ...formData,
          license_number: formData.license_number || null,
          certification_level: formData.certification_level || null,
          phone: formData.phone || null,
          email: formData.email || null,
        };

        if (editingNurse) {
          const { error } = await supabase
            .from("nurses")
            .update(cleanFormData)
            .eq("id", editingNurse.id);

          if (error) throw error;

          toast({
            title: "Nurse updated",
            description: "Nurse profile has been successfully updated.",
          });
        } else {
          const { error } = await supabase
            .from("nurses")
            .insert([cleanFormData]);

          if (error) throw error;

          toast({
            title: "Nurse created",
            description: "New nurse profile has been successfully created.",
          });
        }
      }

      setIsDialogOpen(false);
      setEditingNurse(null);
      resetForm();
      fetchNurses();
      fetchAvailableStaff();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingNurse ? "Error updating nurse" : "Error creating nurse",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (nurse: Nurse) => {
    setEditingNurse(nurse);
    setFormData({
      first_name: nurse.first_name,
      last_name: nurse.last_name,
      license_number: nurse.license_number || "",
      certification_level: nurse.certification_level || "",
      phone: nurse.phone || "",
      email: nurse.email || "",
      is_active: nurse.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("nurses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Nurse deleted",
        description: "Nurse profile has been successfully deleted.",
      });
      fetchNurses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting nurse",
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      license_number: "",
      certification_level: "",
      phone: "",
      email: "",
      is_active: true,
    });
    setCreateFromStaff(false);
    setSelectedStaffId("");
  };

  const openCreateDialog = () => {
    setEditingNurse(null);
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
          <h3 className="text-lg font-semibold text-foreground">Nurses</h3>
          <p className="text-sm text-muted-foreground">
            Manage nursing staff profiles and certifications
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Nurse
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingNurse ? "Edit Nurse" : "Add Nurse"}
                </DialogTitle>
                <DialogDescription>
                  {editingNurse 
                    ? "Update the nurse's profile information below."
                    : createFromStaff
                    ? "Select an existing staff member to add as a nurse."
                    : "Create a new nurse profile or select from existing staff."
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingNurse && (
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

                {createFromStaff && !editingNurse && (
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

                {(!createFromStaff || editingNurse) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="Jane"
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
                          placeholder="nurse@hospital.com"
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

                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    placeholder="RN123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certification_level">Certification Level</Label>
                  <Input
                    id="certification_level"
                    value={formData.certification_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, certification_level: e.target.value }))}
                    placeholder="RN, LPN, BSN, etc."
                  />
                </div>

                {(!createFromStaff || editingNurse) && (
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
                    disabled={isLoading || (createFromStaff && !selectedStaffId && !editingNurse)}
                  >
                    {isLoading ? "Saving..." : (editingNurse ? "Update" : "Create")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Nurses Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Certification</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nurses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="h-8 w-8" />
                    <p>No nurses found</p>
                    <p className="text-sm">Add your first nurse to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              nurses.map((nurse) => (
                <TableRow key={nurse.id}>
                  <TableCell className="font-medium">
                    {nurse.first_name} {nurse.last_name}
                  </TableCell>
                  <TableCell>{nurse.license_number || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {nurse.certification_level || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {nurse.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {nurse.phone}
                        </div>
                      )}
                      {nurse.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {nurse.email}
                        </div>
                      )}
                      {!nurse.phone && !nurse.email && "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      nurse.is_active 
                        ? "bg-secondary text-secondary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {nurse.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(nurse)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(nurse.id)}
                        className="text-destructive hover:text-destructive"
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

export default NursesManager;