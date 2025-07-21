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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfessionalCapacity = "doctor" | "nurse" | "optician" | "dentist" | "dental_technician" | "registration_technician" | "administration";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  organization: string | null;
  created_at: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_id: string | null;
}

const RegistrationManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [existingStaff, setExistingStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
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
      // Fetch all profiles (signups)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch existing staff to filter out already registered users
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, first_name, last_name, email, user_id");

      if (staffError) throw staffError;

      setExistingStaff(staffData || []);
      
      // Filter out profiles that are already registered as staff
      const staffUserIds = (staffData || []).map(s => s.user_id).filter(Boolean);
      const availableProfiles = (profilesData || []).filter(p => !staffUserIds.includes(p.user_id));
      
      setProfiles(availableProfiles);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch signup data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStaff = (profile: Profile) => {
    setSelectedProfile(profile);
    
    // Pre-fill form with profile data
    const nameParts = profile.full_name?.split(" ") || ["", ""];
    setFormData({
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      email: "", // Will need to get from auth.users or user input
      phone: "",
      professional_capacity: "administration",
      is_admin: false,
    });
    
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setIsLoading(true);

    try {
      const staffData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        professional_capacity: formData.professional_capacity,
        is_admin: formData.is_admin,
        user_id: selectedProfile.user_id,
      };

      const { error } = await supabase
        .from("staff")
        .insert(staffData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member registered successfully",
      });

      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error registering staff:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register staff member",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      professional_capacity: "administration",
      is_admin: false,
    });
    setSelectedProfile(null);
  };

  const isAlreadyRegistered = (userId: string) => {
    return existingStaff.some(staff => staff.user_id === userId);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Staff Registration</h3>
          <p className="text-sm text-muted-foreground">
            Register staff members from the pool of signups
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            {profiles.length} Available Signups
          </Badge>
          <Badge variant="outline" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            {existingStaff.length} Registered Staff
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Signups
            </CardTitle>
            <CardDescription>
              Users who have signed up but are not yet registered as staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Signup Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No available signups
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            {profile.full_name || "Unknown"}
                          </TableCell>
                          <TableCell>{profile.organization || "-"}</TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleRegisterStaff(profile)}
                              className="gap-2"
                            >
                              <UserPlus className="h-4 w-4" />
                              Register
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registered Staff Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Registered Staff
            </CardTitle>
            <CardDescription>
              Users who have been registered as staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {existingStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No registered staff
                        </TableCell>
                      </TableRow>
                    ) : (
                      existingStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">
                            {staff.first_name} {staff.last_name}
                          </TableCell>
                          <TableCell>{staff.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">Registered</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Register Staff Member</DialogTitle>
            <DialogDescription>
              Complete the registration for {selectedProfile?.full_name}
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                Register Staff Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationManager;