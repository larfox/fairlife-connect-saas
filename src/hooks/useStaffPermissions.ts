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
  'basic-info': 'overview',
  'screening': 'know your numbers',
  'services': 'services',
  'prognosis': 'General Consultation',
  'prescriptions': 'prescriptions',
  'ecg': 'ECG screening',
  'optician': 'Optical',
  'dental': 'Dental ',
  'pap-smear': 'Paps Smears',
  'back-to-school': 'Back to School '
};

// Global cache and request deduplication with localStorage persistence
const permissionsCache = new Map<string, { data: StaffPermissions; timestamp: number }>();
const activeRequests = new Map<string, Promise<StaffPermissions>>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - persist throughout the day

// Helper functions for localStorage persistence
const getStoredPermissions = (email: string): { data: StaffPermissions; timestamp: number } | null => {
  try {
    const stored = localStorage.getItem(`staff_permissions_${email}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Reconstruct the canAccessTab function
      if (parsed.data) {
        parsed.data.canAccessTab = (tabName: string): boolean => {
          if (tabName === 'basic-info' || tabName === 'screening') return true;
          if (parsed.data.isAdmin) return true;
          
          // Check specific tab permissions (stored in cache)
          if (tabName === 'services' && parsed.data.canAccessServicesTab) return true;
          if (tabName === 'prognosis' && parsed.data.canAccessPrognosisTab) return true;
          if (tabName === 'prescriptions' && parsed.data.canAccessPrescriptionsTab) return true;
          
          if (parsed.data.allowedServices.includes(tabName)) return true;
          const serviceName = SERVICE_TAB_MAPPING[tabName as keyof typeof SERVICE_TAB_MAPPING];
          return serviceName && parsed.data.allowedServices.includes(serviceName);
        };
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error reading stored permissions:', error);
  }
  return null;
};

const storePermissions = (email: string, data: StaffPermissions, timestamp: number) => {
  try {
    // Store everything except the function
    const toStore = {
      data: {
        isAdmin: data.isAdmin,
        isActive: data.isActive,
        allowedServices: data.allowedServices,
        canAccessServicesTab: data.canAccessTab('services'),
        canAccessPrognosisTab: data.canAccessTab('prognosis'),
        canAccessPrescriptionsTab: data.canAccessTab('prescriptions')
      },
      timestamp
    };
    localStorage.setItem(`staff_permissions_${email}`, JSON.stringify(toStore));
  } catch (error) {
    console.error('Error storing permissions:', error);
  }
};

// Function to clear permissions cache (useful when permissions are updated)
export const clearPermissionsCache = (email?: string) => {
  if (email) {
    permissionsCache.delete(email);
    localStorage.removeItem(`staff_permissions_${email}`);
  } else {
    // Clear all permissions
    permissionsCache.clear();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('staff_permissions_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

export const useStaffPermissions = (user: User | null): StaffPermissions => {
  const [permissions, setPermissions] = useState<StaffPermissions>({
    isAdmin: false,
    isActive: false,
    allowedServices: [],
    canAccessTab: (tabName: string) => {
      // Default: allow basic-info and screening for all authenticated users
      return tabName === 'basic-info' || tabName === 'screening';
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
          return tabName === 'basic-info' || tabName === 'screening';
        }
      });
      return;
    }

    // Check memory cache first
    let cached = permissionsCache.get(user.email);
    
    // If not in memory, check localStorage
    if (!cached) {
      const stored = getStoredPermissions(user.email);
      if (stored && Date.now() - stored.timestamp < CACHE_DURATION) {
        cached = stored;
        // Put it back in memory cache for faster access
        permissionsCache.set(user.email, cached);
      }
    }
    
    // Use cached permissions if valid
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
          canAccessTab: (tabName: string) => tabName === 'basic-info' || tabName === 'screening'
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
            can_access_services_tab,
            can_access_prognosis_tab,
            can_access_prescriptions_tab,
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
            canAccessTab: (tabName: string) => tabName === 'basic-info' || tabName === 'screening'
          };
          
          // Cache the default permissions
          permissionsCache.set(user.email, { data: defaultPermissions, timestamp: Date.now() });
          return defaultPermissions;
        }

        const allowedServices = staffData.staff_service_permissions
          ?.map(p => p.services?.name)
          .filter(Boolean) || [];

        const canAccessTab = (tabName: string): boolean => {
          // Basic info and screening are always accessible
          if (tabName === 'basic-info' || tabName === 'screening') {
            return true;
          }

          // Admins have access to everything
          if (staffData.is_admin) {
            return true;
          }

          // Check specific tab permissions
          if (tabName === 'services' && staffData.can_access_services_tab) {
            return true;
          }
          if (tabName === 'prognosis' && staffData.can_access_prognosis_tab) {
            return true;
          }
          if (tabName === 'prescriptions' && staffData.can_access_prescriptions_tab) {
            return true;
          }

          // Check if it's a service-based permission or tab-based permission
          if (allowedServices.includes(tabName)) {
            return true;
          }

          // Check if there's a service mapping for this tab
          const serviceName = SERVICE_TAB_MAPPING[tabName as keyof typeof SERVICE_TAB_MAPPING];
          if (serviceName && allowedServices.includes(serviceName)) {
            return true;
          }

          return false;
        };

        const newPermissions = {
          isAdmin: staffData.is_admin,
          isActive: staffData.is_active,
          allowedServices,
          canAccessTab
        };

        const timestamp = Date.now();
        
        // Cache the results in both memory and localStorage
        permissionsCache.set(user.email, { data: newPermissions, timestamp });
        storePermissions(user.email, newPermissions, timestamp);
        
        return newPermissions;

      } catch (error) {
        console.error('Error fetching staff permissions:', error);
        const defaultPermissions = {
          isAdmin: false,
          isActive: false,
          allowedServices: [],
          canAccessTab: (tabName: string) => tabName === 'basic-info' || tabName === 'screening'
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
        canAccessTab: (tabName: string) => tabName === 'basic-info' || tabName === 'screening'
      });
    });

  }, [user?.email]);

  return permissions;
};