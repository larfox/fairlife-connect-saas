import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface StaffPermissions {
  isAdmin: boolean;
  isActive: boolean;
  allowedServices: string[];
  canAccessTab: (tabName: string) => boolean;
}

const SERVICE_TAB_MAPPING = {
  'overview': 'overview',
  'screening': 'Know Your Numbers',
  'complaints-prognosis': 'Complaints',
  'prescriptions': 'Prescriptions',
  'ecg': 'ECG Results',
  'optician': 'Vision Testing',
  'dental': 'Dental Assessment',
  'pap-smears': 'PAP Smears',
  'back-to-school': 'Back to School',
  'immunizations': 'Immunizations',
  'history': 'History'
};

export const useStaffPermissions = (user: User | null): StaffPermissions => {
  const [permissions, setPermissions] = useState<StaffPermissions>({
    isAdmin: false,
    isActive: false,
    allowedServices: [],
    canAccessTab: () => false
  });

  useEffect(() => {
    const fetchStaffPermissions = async () => {
      if (!user) {
        setPermissions({
          isAdmin: false,
          isActive: false,
          allowedServices: [],
          canAccessTab: () => false
        });
        return;
      }

      try {
        // Get staff member by email
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('email', user.email)
          .eq('is_active', true)
          .single();

        if (staffError || !staffData) {
          setPermissions({
            isAdmin: false,
            isActive: false,
            allowedServices: [],
            canAccessTab: () => false
          });
          return;
        }

        // Get staff service permissions
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('staff_service_permissions')
          .select(`
            services (name)
          `)
          .eq('staff_id', staffData.id);

        if (permissionsError) {
          console.error('Error fetching permissions:', permissionsError);
        }

        const allowedServices = permissionsData?.map(p => p.services?.name).filter(Boolean) || [];

        const canAccessTab = (tabName: string): boolean => {
          // Overview and Know Your Numbers are always accessible to active staff
          if (tabName === 'overview' || tabName === 'screening') {
            return true;
          }

          // Admins have access to all tabs
          if (staffData.is_admin) {
            return true;
          }

          // Check if the tab corresponds to a service the staff has permission for
          const serviceName = SERVICE_TAB_MAPPING[tabName as keyof typeof SERVICE_TAB_MAPPING];
          return allowedServices.includes(serviceName);
        };

        setPermissions({
          isAdmin: staffData.is_admin,
          isActive: staffData.is_active,
          allowedServices,
          canAccessTab
        });

      } catch (error) {
        console.error('Error fetching staff permissions:', error);
        setPermissions({
          isAdmin: false,
          isActive: false,
          allowedServices: [],
          canAccessTab: () => false
        });
      }
    };

    fetchStaffPermissions();
  }, [user]);

  return permissions;
};