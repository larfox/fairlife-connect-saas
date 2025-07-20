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

// Global cache and request deduplication
const permissionsCache = new Map<string, { data: StaffPermissions; timestamp: number }>();
const activeRequests = new Map<string, Promise<StaffPermissions>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - longer cache to prevent rate limiting

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

    // Check if there's already an active request for this user
    const existingRequest = activeRequests.get(user.email);
    if (existingRequest) {
      // Wait for the existing request to complete
      existingRequest.then(setPermissions).catch(() => {
        // Fallback to default permissions on error
        setPermissions({
          isAdmin: false,
          isActive: false,
          allowedServices: [],
          canAccessTab: (tabName: string) => tabName === 'overview' || tabName === 'screening'
        });
      });
      return;
    }

    // Create new request promise
    const fetchPermissions = async (): Promise<StaffPermissions> => {
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

        if (staffError || !staffData) {
          const defaultPermissions = {
            isAdmin: false,
            isActive: false,
            allowedServices: [],
            canAccessTab: (tabName: string) => tabName === 'overview' || tabName === 'screening'
          };
          
          // Cache the default permissions
          permissionsCache.set(user.email, { data: defaultPermissions, timestamp: Date.now() });
          return defaultPermissions;
        }

        const allowedServices = staffData.staff_service_permissions
          ?.map(p => p.services?.name)
          .filter(Boolean) || [];

        const canAccessTab = (tabName: string): boolean => {
          if (tabName === 'overview' || tabName === 'screening') {
            return true;
          }

          if (staffData.is_admin) {
            return true;
          }

          const serviceName = SERVICE_TAB_MAPPING[tabName as keyof typeof SERVICE_TAB_MAPPING];
          return allowedServices.includes(serviceName);
        };

        const newPermissions = {
          isAdmin: staffData.is_admin,
          isActive: staffData.is_active,
          allowedServices,
          canAccessTab
        };

        // Cache the results
        permissionsCache.set(user.email, { data: newPermissions, timestamp: Date.now() });
        return newPermissions;

      } catch (error) {
        console.error('Error fetching staff permissions:', error);
        const defaultPermissions = {
          isAdmin: false,
          isActive: false,
          allowedServices: [],
          canAccessTab: (tabName: string) => tabName === 'overview' || tabName === 'screening'
        };
        return defaultPermissions;
      } finally {
        // Remove from active requests when done
        activeRequests.delete(user.email);
      }
    };

    // Store the request promise and execute
    const requestPromise = fetchPermissions();
    activeRequests.set(user.email, requestPromise);
    
    // Set permissions when request completes
    requestPromise.then(setPermissions).catch(() => {
      setPermissions({
        isAdmin: false,
        isActive: false,
        allowedServices: [],
        canAccessTab: (tabName: string) => tabName === 'overview' || tabName === 'screening'
      });
    });

  }, [user?.email]);

  return permissions;
};