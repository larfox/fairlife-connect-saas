import type { SupportedStorage } from '@supabase/supabase-js';

/**
 * Custom storage adapter that strips refresh_token from session data
 * before storing it. This prevents the Supabase SDK from attempting
 * token refresh, which fails due to a backend issue with missing
 * oauth_client_id column in auth.sessions table.
 */
export const customSessionStorage: SupportedStorage = {
  getItem: (key: string) => {
    return sessionStorage.getItem(key);
  },
  
  setItem: (key: string, value: string) => {
    try {
      // Parse the session data
      const data = JSON.parse(value);
      
      // If this is session data and contains a refresh_token, remove it
      if (data && typeof data === 'object' && 'refresh_token' in data) {
        console.log('Stripping refresh_token from session before storage');
        const { refresh_token, ...sessionWithoutRefreshToken } = data;
        sessionStorage.setItem(key, JSON.stringify(sessionWithoutRefreshToken));
      } else {
        // Store as-is if it's not session data
        sessionStorage.setItem(key, value);
      }
    } catch (e) {
      // If parsing fails, just store the value as-is
      sessionStorage.setItem(key, value);
    }
  },
  
  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
  }
};
