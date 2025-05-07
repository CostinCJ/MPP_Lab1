'use client';

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo     
} from 'react';

// Define the shape of a Guitar object
import { Brand } from "@/lib/entities/Brand";

export type Guitar = {
  id: string;
  name: string; // Added name property
  manufacturer: string; // Added manufacturer property
  model: string;
  brandName: string; // Use brandName to match form and API expectation
  type: string;
  strings: string;
  condition: string;
  price: string;
  imageUrl?: string;
  brand?: Brand; // Add the brand relationship
};

// Define the shape for filtering options
type FilterType = {
  type?: string[];
  manufacturer?: string[];
  condition?: string[];
  strings?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

// Define the shape for sorting options
type SortType = {
  field: string;
  direction: 'asc' | 'desc';
};

// Define the shape of the context value
type GuitarContextType = {
  guitars: Guitar[];
  isLoading: boolean;
  error: string | null;
  refreshGuitars: () => Promise<void>;
  addGuitar: (guitar: Omit<Guitar, 'id'>) => Promise<Guitar>;
  updateGuitar: (id: string, updatedGuitar: Partial<Guitar>) => Promise<Guitar | null>;
  deleteGuitar: (id: string) => Promise<boolean>;
  getFilteredGuitars: (filters: FilterType, sort?: SortType) => Promise<Guitar[]>;
};

// Create the context
const GuitarContext = createContext<GuitarContextType | undefined>(undefined);

// Create the Provider component
export const GuitarProvider = ({ children }: { children: ReactNode }) => {
  const [guitars, setGuitars] = useState<Guitar[]>([]); // Holds the raw list fetched initially
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  const refreshGuitars = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/guitars');
      if (!response.ok) {
        throw new Error(`Failed to fetch guitars (status: ${response.status})`);
      }
      const responseData = await response.json();

      if (responseData && Array.isArray(responseData.data)) {
          setGuitars(responseData.data);
      } else if (Array.isArray(responseData)) {
          setGuitars(responseData);
      } else {
          console.warn("Unexpected format on initial fetch:", responseData);
          setGuitars([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during refresh');
      console.error('Error refreshing guitars:', err);
      setGuitars([]); // Clear guitars on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addGuitar = useCallback(async (guitarData: Omit<Guitar, 'id'>): Promise<Guitar> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/guitars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guitarData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add guitar and parse error response' }));
        throw new Error(errorData.error || `Failed to add guitar (status: ${response.status})`);
      }
      const newGuitar = await response.json();
      setGuitars(prevGuitars => [...prevGuitars, newGuitar]);
      return newGuitar;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred adding guitar');
      console.error('Error adding guitar:', err);
      throw err;
    } finally {
       setIsLoading(false);
    }
  }, []);

  const updateGuitar = useCallback(async (id: string, updatedData: Partial<Guitar>): Promise<Guitar | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/guitars/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: 'Failed to update guitar and parse error response' }));
        throw new Error(errorData.error || `Failed to update guitar (status: ${response.status})`);
      }
      const updatedGuitar = await response.json();
      setGuitars(prevGuitars =>
        prevGuitars.map(guitar =>
          guitar.id === id ? { ...guitar, ...updatedGuitar } : guitar
        )
      );
      return updatedGuitar;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred updating guitar');
      console.error('Error updating guitar:', err);
      return null;
    } finally {
       setIsLoading(false);
    }
  }, []);

  const deleteGuitar = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/guitars/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete guitar and parse error response' }));
        throw new Error(errorData.error || `Failed to delete guitar (status: ${response.status})`);
      }
      // Remove from the main list
      setGuitars(prevGuitars => prevGuitars.filter(guitar => guitar.id !== id));
      return true; // Indicate success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred deleting guitar');
      console.error('Error deleting guitar:', err);
      return false; // Indicate failure
    } finally {
        setIsLoading(false);
    }
  }, []); // Empty dependency array

  const getFilteredGuitars = useCallback(async (filters: FilterType, sort?: SortType): Promise<Guitar[]> => {
    setIsLoading(true); // Set loading state for this specific operation
    setError(null);
    try {
      const params = new URLSearchParams();
       // Build query params
      if (filters) {
        if (filters.type && filters.type.length > 0) filters.type.forEach(v => params.append('type', v));
        if (filters.manufacturer && filters.manufacturer.length > 0) filters.manufacturer.forEach(v => params.append('manufacturer', v));
        if (filters.condition && filters.condition.length > 0) filters.condition.forEach(v => params.append('condition', v));
        if (filters.strings && filters.strings.length > 0) filters.strings.forEach(v => params.append('strings', v));
        if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
        if (filters.search) params.append('search', filters.search);
      }
      if (sort) {
        params.append('sortField', sort.field);
        params.append('sortDirection', sort.direction);
      }

      const response = await fetch(`/api/guitars?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch filtered guitars and parse error response' }));
        throw new Error(errorData.error || `Failed to fetch filtered guitars (status: ${response.status})`);
      }
      const responseData = await response.json();

      if (responseData && Array.isArray(responseData.data)) {
        return responseData.data; // Return the array from the 'data' property
      } else if (Array.isArray(responseData)) {
         // Handle case where API returns array directly
         return responseData;
      } else {
        console.warn("API response format unexpected in getFilteredGuitars:", responseData);
        return []; // Return empty array on unexpected format
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred fetching filtered guitars');
      console.error('Error getting filtered guitars:', err);
      return []; // Return empty array on error
    } finally {
      setIsLoading(false); // Ensure loading is set to false after attempt
    }
  }, []);

  // Load initial guitars when the provider mounts
  useEffect(() => {
    refreshGuitars();
  }, [refreshGuitars]); // Add refreshGuitars as dependency

  // Memoize the context value to stabilize its reference
  const contextValue = useMemo(() => ({
    guitars,          // Provide the raw list
    isLoading,
    error,
    refreshGuitars,   // Provide memoized functions
    addGuitar,
    updateGuitar,
    deleteGuitar,
    getFilteredGuitars,
  }), [
    guitars,          // Dependencies: Include all values provided in the object
    isLoading,
    error,
    refreshGuitars,   // Include the memoized functions themselves as dependencies
    addGuitar,
    updateGuitar,
    deleteGuitar,
    getFilteredGuitars
  ]);

  return (
    <GuitarContext.Provider value={contextValue}>
      {children}
    </GuitarContext.Provider>
  );
};

// Custom hook to use the Guitar context
export const useGuitars = () => {
  const context = useContext(GuitarContext);
  if (context === undefined) {
    throw new Error('useGuitars must be used within a GuitarProvider');
  }
  return context;
};