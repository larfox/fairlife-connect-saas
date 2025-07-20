import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global cache with localStorage persistence
const globalCache = new Map<string, { data: any; timestamp: number }>();
const activeRequests = new Map<string, Promise<any>>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper functions for localStorage persistence
const getStoredData = (key: string): { data: any; timestamp: number } | null => {
  try {
    const stored = localStorage.getItem(`cache_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading cached data:', error);
  }
  return null;
};

const storeData = (key: string, data: any, timestamp: number) => {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({ data, timestamp }));
  } catch (error) {
    console.error('Error storing cached data:', error);
  }
};

export const useDataCache = <T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check memory cache first
        let cached = globalCache.get(cacheKey);
        
        // If not in memory, check localStorage
        if (!cached) {
          const stored = getStoredData(cacheKey);
          if (stored && Date.now() - stored.timestamp < CACHE_DURATION) {
            cached = stored;
            // Put it back in memory cache for faster access
            globalCache.set(cacheKey, cached);
          }
        }
        
        // Use cached data if valid
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }

        // Check if there's already an active request
        const existingRequest = activeRequests.get(cacheKey);
        if (existingRequest) {
          const result = await existingRequest;
          setData(result);
          setLoading(false);
          return;
        }

        // Create new request
        setLoading(true);
        const requestPromise = fetcher();
        activeRequests.set(cacheKey, requestPromise);

        try {
          const result = await requestPromise;
          const timestamp = Date.now();
          
          // Cache the results in both memory and localStorage
          globalCache.set(cacheKey, { data: result, timestamp });
          storeData(cacheKey, result, timestamp);
          
          setData(result);
          setError(null);
        } catch (err) {
          const error = err as Error;
          setError(error);
          console.error(`Error fetching ${cacheKey}:`, error);
        } finally {
          activeRequests.delete(cacheKey);
          setLoading(false);
        }

      } catch (err) {
        const error = err as Error;
        setError(error);
        setLoading(false);
        console.error(`Error in useDataCache for ${cacheKey}:`, error);
      }
    };

    fetchData();
  }, [cacheKey, ...dependencies]);

  return { data, loading, error };
};

// Specific hooks for common data
export const useLocations = () => 
  useDataCache('locations', async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, address")
      .eq("is_active", true)
      .order("name");
    
    if (error) throw error;
    return data || [];
  });

export const useDoctors = () => 
  useDataCache('doctors', async () => {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, first_name, last_name, specialization")
      .eq("is_active", true);
    
    if (error) throw error;
    return data || [];
  });

export const useNurses = () => 
  useDataCache('nurses', async () => {
    const { data, error } = await supabase
      .from("nurses")
      .select("id, first_name, last_name, certification_level")
      .eq("is_active", true);
    
    if (error) throw error;
    return data || [];
  });

export const useServices = () => 
  useDataCache('services', async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description")
      .eq("is_active", true);
    
    if (error) throw error;
    return data || [];
  });

export const useParishes = () => 
  useDataCache('parishes', async () => {
    const { data, error } = await supabase
      .from("parishes")
      .select("*")
      .order("name");
    
    if (error) throw error;
    return data || [];
  });

export const useTowns = () => 
  useDataCache('towns', async () => {
    const { data, error } = await supabase
      .from("towns")
      .select("*")
      .order("name");
    
    if (error) throw error;
    return data || [];
  });