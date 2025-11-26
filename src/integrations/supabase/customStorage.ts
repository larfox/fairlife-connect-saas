import type { SupportedStorage } from '@supabase/supabase-js';

/**
 * Custom storage adapter that wraps sessionStorage.
 * Stores sessions normally but relies on autoRefreshToken: false
 * and manual session management to avoid token refresh issues.
 */
export const customSessionStorage: SupportedStorage = {
  getItem: (key: string) => {
    return sessionStorage.getItem(key);
  },
  
  setItem: (key: string, value: string) => {
    sessionStorage.setItem(key, value);
  },
  
  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
  }
};
