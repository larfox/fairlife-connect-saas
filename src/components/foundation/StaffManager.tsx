import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, UserCheck, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfessionalCapacity = "doctor" | "nurse" | "optician" | "dentist" | "dental_technician" | "registration_technician" | "administration";

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  professional_capacity: ProfessionalCapacity;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface StaffServicePermission {
  id: string;
  staff_id: string;
  service_id: string;
  services: {
    name: string;
  };
}

const StaffManager = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffPermissions, setStaffPermissions] = useState<StaffServicePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedAdminStatus, setSelectedAdminStatus] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    professional_capacity: "administration" as ProfessionalCapacity,
    is_admin: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch staff
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .order("first_name");

      if (staffError) throw staffError;
      setStaff(staffData || []);

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Fetch staff permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from("staff_service_permissions")
        .select(`
          id,
          staff_id,
          service_id,
          services (name)
        `);

      if (permissionsError) throw permissionsError;
      setStaffPermissions(permissionsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const staffData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        professional_capacity: formData.professional_capacity,
        is_admin: formData.is_admin,
      };

      if (editingStaff) {
        const { error } = await supabase
          .from("staff")
          .update(staffData)
          .eq("id", editingStaff.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Staff member updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("staff")
          .insert(staffData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Staff member added successfully",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving staff:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff member",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      first_name: staffMember.first_name,
      last_name: staffMember.last_name,
      email: staffMember.email,
      phone: staffMember.phone || "",
      professional_capacity: staffMember.professional_capacity,
      is_admin: staffMember.is_admin,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
      fetchData();
    } catch (error: any) {
      console.error("Error deleting staff:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (staffMember: Staff) => {
    try {
      const { error } = await supabase
        .from("staff")
        .update({ is_active: !staffMember.is_active })
        .eq("id", staffMember.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Staff member ${!staffMember.is_active ? "activated" : "deactivated"}`,
      });
      fetchData();
    } catch (error: any) {
      console.error("Error updating staff status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update staff status",
        variant: "destructive",
      });
    }
  };

  const openPermissionsDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    const currentPermissions = staffPermissions
      .filter(p => p.staff_id === staffMember.id)
      .map(p => p.service_id);
    setSelectedServiceIds(currentPermissions);
    setSelectedAdminStatus(staffMember.is_admin);
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedStaff) return;

    try {
      // Update admin status
      await supabase
        .from("staff")
        .update({ is_admin: selectedAdminStatus })
        .eq("id", selectedStaff.id);

      // Delete existing permissions
      await supabase
        .from("staff_service_permissions")
        .delete()
        .eq("staff_id", selectedStaff.id);

      // Insert new permissions (only if not admin)
      if (!selectedAdminStatus && selectedServiceIds.length > 0) {
        const permissions = selectedServiceIds.map(serviceId => ({
          staff_id: selectedStaff.id,
          service_id: serviceId,
        }));

        const { error } = await supabase
          .from("staff_service_permissions")
          .insert(permissions);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
      
      setPermissionsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      professional_capacity: "administration" as ProfessionalCapacity,
      is_admin: false,
    });
    setEditingStaff(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStaffPermissions = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (staffMember?.is_admin) {
      return ["Admin"];
    }
    return staffPermissions
      .filter(p => p.staff_id === staffId)
      .map(p => p.services.name);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Staff Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage staff members and their access permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
              </DialogTitle>
              <DialogDescription>
                {editingStaff
                  ? "Update the staff member details below."
                  : "Add a new staff member to the system."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professional_capacity">Professional Capacity</Label>
                  <Select 
                    value={formData.professional_capacity} 
                    onValueChange={(value: ProfessionalCapacity) => setFormData({ ...formData, professional_capacity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select professional capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="optician">Optician</SelectItem>
                      <SelectItem value="dentist">Dentist</SelectItem>
                      <SelectItem value="dental_technician">Dental Technician</SelectItem>
                      <SelectItem value="registration_technician">Registration Technician</SelectItem>
                      <SelectItem value="administration">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_admin"
                    checked={formData.is_admin}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_admin: checked })
                    }
                  />
                  <Label htmlFor="is_admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administrator Access
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {editingStaff ? "Update" : "Add"} Staff Member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Manage staff access and permissions for different services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px] max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Professional Capacity</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((staffMember) => {
                    const permissions = getStaffPermissions(staffMember.id);
                    return (
                      <TableRow key={staffMember.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {staffMember.first_name} {staffMember.last_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{staffMember.email}</TableCell>
                        <TableCell>{staffMember.phone || "N/A"}</TableCell>
                        <TableCell>
                          <div className="capitalize">
                            {staffMember.professional_capacity?.replace('_', ' ') || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {staffMember.is_admin ? (
                            <Badge variant="destructive" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Staff</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {permissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {permissions.slice(0, 2).map((permission) => (
                                  <Badge 
                                    key={permission} 
                                    variant={permission === "Admin" ? "destructive" : "outline"} 
                                    className="text-xs"
                                  >
                                    {permission}
                                  </Badge>
                                ))}
                                {permissions.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{permissions.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary">No Access</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={staffMember.is_active}
                              onCheckedChange={() => handleToggleActive(staffMember)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {staffMember.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPermissionsDialog(staffMember)}
                              className="gap-1"
                            >
                              <UserCheck className="h-3 w-3" />
                              Permissions
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(staffMember)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(staffMember.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              {selectedStaff && (
                <>
                  Set service access permissions for{" "}
                  <strong>
                    {selectedStaff.first_name} {selectedStaff.last_name}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {/* Admin Toggle */}
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="admin-access"
                  checked={selectedAdminStatus}
                  onCheckedChange={(checked) => {
                    setSelectedAdminStatus(checked as boolean);
                    // Clear service selections when admin is toggled on
                    if (checked) {
                      setSelectedServiceIds([]);
                    }
                  }}
                />
                <Label htmlFor="admin-access" className="flex items-center gap-2 flex-1">
                  <Shield className="h-4 w-4 text-destructive" />
                  <div>
                    <div className="font-medium">Administrator Access</div>
                    <div className="text-sm text-muted-foreground">
                      Full access to all services and admin functions
                    </div>
                  </div>
                </Label>
              </div>

              {/* Service Permissions (only show if not admin) */}
              {!selectedAdminStatus && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Or select specific services this staff member can access:
                    </p>
                    {services.filter(service => 
                      !service.name.toLowerCase().includes('general consultation')
                    ).map((service) => (
                      <div key={service.id} className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id={service.id}
                          checked={selectedServiceIds.includes(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedServiceIds([...selectedServiceIds, service.id]);
                            } else {
                              setSelectedServiceIds(
                                selectedServiceIds.filter((id) => id !== service.id)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={service.id} className="flex-1">
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-muted-foreground">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                    
                    {/* Additional Data Access Permissions */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-3">
                        Data access permissions:
                      </p>
                      {[
                        { id: 'immunizations', name: 'Immunizations', description: 'Access to patient immunization records' },
                        { id: 'history', name: 'History', description: 'Access to patient history and records' },
                        { id: 'complaints', name: 'Complaints', description: 'Access to patient complaints' },
                        { id: 'prognosis', name: 'Prognosis', description: 'Access to patient prognosis data' },
                        { id: 'prescriptions', name: 'Prescriptions', description: 'Access to patient prescriptions' }
                      ].map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2 mb-3">
                          <Checkbox
                            id={permission.id}
                            checked={selectedServiceIds.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedServiceIds([...selectedServiceIds, permission.id]);
                              } else {
                                setSelectedServiceIds(
                                  selectedServiceIds.filter((id) => id !== permission.id)
                                );
                              }
                            }}
                          />
                          <Label htmlFor={permission.id} className="flex-1">
                            <div>
                              <div className="font-medium">{permission.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {permission.description}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSavePermissions}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManager;