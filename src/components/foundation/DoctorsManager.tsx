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
import { Plus, Edit, Trash2, Stethoscope, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string | null;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

const DoctorsManager = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    license_number: "",
    specialization: "",
    phone: "",
    email: "",
    is_active: true,
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching doctors",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clean up empty strings to null for optional fields
      const cleanFormData = {
        ...formData,
        license_number: formData.license_number || null,
        specialization: formData.specialization || null,
        phone: formData.phone || null,
        email: formData.email || null,
      };

      if (editingDoctor) {
        const { error } = await supabase
          .from("doctors")
          .update(cleanFormData)
          .eq("id", editingDoctor.id);

        if (error) throw error;

        toast({
          title: "Doctor updated",
          description: "Doctor profile has been successfully updated.",
        });
      } else {
        const { error } = await supabase
          .from("doctors")
          .insert([cleanFormData]);

        if (error) throw error;

        toast({
          title: "Doctor created",
          description: "New doctor profile has been successfully created.",
        });
      }

      setIsDialogOpen(false);
      setEditingDoctor(null);
      resetForm();
      fetchDoctors();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingDoctor ? "Error updating doctor" : "Error creating doctor",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      license_number: doctor.license_number || "",
      specialization: doctor.specialization || "",
      phone: doctor.phone || "",
      email: doctor.email || "",
      is_active: doctor.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Doctor deleted",
        description: "Doctor profile has been successfully deleted.",
      });
      fetchDoctors();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting doctor",
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      license_number: "",
      specialization: "",
      phone: "",
      email: "",
      is_active: true,
    });
  };

  const openCreateDialog = () => {
    setEditingDoctor(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Doctors</h3>
          <p className="text-sm text-muted-foreground">
            Manage healthcare provider profiles and specializations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
              </DialogTitle>
              <DialogDescription>
                {editingDoctor 
                  ? "Update the doctor's profile information below."
                  : "Create a new doctor profile for health fair services."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  placeholder="MD123456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  placeholder="Cardiology, Family Medicine, etc."
                />
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
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : (editingDoctor ? "Update" : "Create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Doctors Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Stethoscope className="h-8 w-8" />
                    <p>No doctors found</p>
                    <p className="text-sm">Add your first doctor to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </TableCell>
                  <TableCell>{doctor.license_number || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {doctor.specialization || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {doctor.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {doctor.phone}
                        </div>
                      )}
                      {doctor.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {doctor.email}
                        </div>
                      )}
                      {!doctor.phone && !doctor.email && "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      doctor.is_active 
                        ? "bg-secondary text-secondary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {doctor.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(doctor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doctor.id)}
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

export default DoctorsManager;