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

// Cache to avoid repeated API calls for the same user
const permissionsCache = new Map<string, { data: StaffPermissions; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useStaffPermissions = (user: User | null): StaffPermissions => {
  const [permissions, setPermissions] = useState<StaffPermissions>({
    isAdmin: false,
    isActive: false,
    allowedServices: [],
    canAccessTab: (tabName: string) => {
      // Default: allow overview and screening for all authenticated users
      return tabName === 'overview' || tabName === 'screening';
    }
  });

  useEffect(() => {
    // If no user, return default permissions
    if (!user?.email) {
      setPermissions({
        isAdmin: false,
        isActive: false,
        allowedServices: [],
        canAccessTab: (tabName: string) => {
          // Default: allow overview and screening for all authenticated users
          return tabName === 'overview' || tabName === 'screening';
        }
      });
      return;
    }

    // Check cache first
    const cached = permissionsCache.get(user.email);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPermissions(cached.data);
      return;
    }

    // Use a flag to prevent multiple simultaneous requests
    let isMounted = true;
    
    const fetchPermissions = async () => {
      try {
        // Get staff member by email and their permissions in a single optimized query
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select(`
            is_admin,
            is_active,
            staff_service_permissions (
              services (name)
            )
          `)
          .eq('email', user.email)
          .eq('is_active', true)
          .maybeSingle();

        // Only update state if component is still mounted
        if (!isMounted) return;

        if (staffError || !staffData) {
          const defaultPermissions = {
            isAdmin: false,
            isActive: false,
            allowedServices: [],
            canAccessTab: (tabName: string) => {
              // Default: allow overview and screening for all authenticated users
              return tabName === 'overview' || tabName === 'screening';
            }
          };
          setPermissions(defaultPermissions);
          
          // Cache the default permissions to avoid repeated failed lookups
          permissionsCache.set(user.email, { data: defaultPermissions, timestamp: Date.now() });
          return;
        }

        const allowedServices = staffData.staff_service_permissions
          ?.map(p => p.services?.name)
          .filter(Boolean) || [];

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

        const newPermissions = {
          isAdmin: staffData.is_admin,
          isActive: staffData.is_active,
          allowedServices,
          canAccessTab
        };

        setPermissions(newPermissions);
        
        // Cache the results
        permissionsCache.set(user.email, { data: newPermissions, timestamp: Date.now() });

      } catch (error) {
        console.error('Error fetching staff permissions:', error);
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        // Set safe default permissions on error
        const defaultPermissions = {
          isAdmin: false,
          isActive: false,
          allowedServices: [],
          canAccessTab: (tabName: string) => {
            // Default: allow overview and screening for all authenticated users
            return tabName === 'overview' || tabName === 'screening';
          }
        };
        setPermissions(defaultPermissions);
      }
    };

    // Debounce the fetch to prevent rapid-fire requests
    const timeoutId = setTimeout(fetchPermissions, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user?.email]); // Only depend on email, not the entire user object

  return permissions;
};