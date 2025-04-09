// src/app/context/__mocks__/GuitarContext.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the Guitar type without priceCategory
type Guitar = {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  strings: string;
  condition: string;
  price: string;
  imageUrl?: string;
};

// Sample guitar data for tests
const sampleGuitars: Guitar[] = [
  {
    id: 'fender_strat_1',
    name: 'Stratocaster',
    manufacturer: 'Fender',
    type: 'Electric',
    strings: '6',
    condition: 'New',
    price: '733',
    imageUrl: '/fenderStratocaster.jpg'
  },
  {
    id: 'ibanez_gio_1',
    name: 'Gio',
    manufacturer: 'Ibanez',
    type: 'Electric',
    strings: '6',
    condition: 'Used',
    price: '269',
    imageUrl: '/ibanezGio.jpg'
  },
  {
    id: 'gibson_sg_1',
    name: 'SG',
    manufacturer: 'Gibson',
    type: 'Electric',
    strings: '6',
    condition: 'New',
    price: '1526',
    imageUrl: '/gibsonSG.jpg'
  },
  {
    id: 'gibson_lp_1',
    name: 'Les Paul \'60s',
    manufacturer: 'Gibson',
    type: 'Electric',
    strings: '6',
    condition: 'Vintage',
    price: '2499',
    imageUrl: '/gibsonLesPaul60.jpg'
  },
  {
    id: 'fender_squier_1',
    name: 'Squier',
    manufacturer: 'Fender',
    type: 'Electric',
    strings: '6',
    condition: 'Used',
    price: '115',
    imageUrl: '/fenderSquire.jpg'
  },
  {
    id: 'ibanez_grg_1',
    name: 'GRG170DX',
    manufacturer: 'Ibanez',
    type: 'Electric',
    strings: '6',
    condition: 'New',
    price: '287',
    imageUrl: '/ibanezGRGW.jpg'
  }
];

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

// Create the Provider component for tests with immediate data
export const GuitarProvider = ({ children }: { children: ReactNode }) => {
  const [guitars, setGuitars] = useState<Guitar[]>(sampleGuitars);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  const refreshGuitars = async () => {
    setIsLoading(true);
    // Return data immediately
    setGuitars(sampleGuitars);
    setIsLoading(false);
    return Promise.resolve();
  };

  const addGuitar = async (guitarData: Omit<Guitar, 'id'>): Promise<Guitar> => {
    const newGuitar = {
      ...guitarData,
      id: `guitar_${Date.now()}`
    };
    setGuitars((prev) => [...prev, newGuitar]);
    return Promise.resolve(newGuitar);
  };

  const updateGuitar = async (id: string, updatedGuitar: Partial<Guitar>): Promise<Guitar | null> => {
    const guitarIndex = guitars.findIndex(g => g.id === id);
    if (guitarIndex === -1) return Promise.resolve(null);
    
    const updatedGuitars = [...guitars];
    updatedGuitars[guitarIndex] = { ...updatedGuitars[guitarIndex], ...updatedGuitar };
    setGuitars(updatedGuitars);
    return Promise.resolve(updatedGuitars[guitarIndex]);
  };

  const deleteGuitar = async (id: string): Promise<boolean> => {
    setGuitars(guitars.filter(g => g.id !== id));
    return Promise.resolve(true);
  };

  const getFilteredGuitars = async (filters: FilterType, sort?: SortType): Promise<Guitar[]> => {
    let filteredGuitars = [...sampleGuitars];
    
    // Apply filtering
    if (filters.type && filters.type.length > 0) {
      filteredGuitars = filteredGuitars.filter(guitar => 
        filters.type!.includes(guitar.type)
      );
    }
    
    if (filters.manufacturer && filters.manufacturer.length > 0) {
      filteredGuitars = filteredGuitars.filter(guitar => 
        filters.manufacturer!.includes(guitar.manufacturer)
      );
    }
    
    if (filters.condition && filters.condition.length > 0) {
      filteredGuitars = filteredGuitars.filter(guitar => 
        filters.condition!.includes(guitar.condition)
      );
    }
    
    if (filters.strings && filters.strings.length > 0) {
      filteredGuitars = filteredGuitars.filter(guitar => 
        filters.strings!.includes(guitar.strings)
      );
    }
    
    if (filters.minPrice !== undefined) {
      filteredGuitars = filteredGuitars.filter(guitar => 
        parseInt(guitar.price) >= filters.minPrice!
      );
    }
    
    if (filters.maxPrice !== undefined) {
      filteredGuitars = filteredGuitars.filter(guitar => 
        parseInt(guitar.price) <= filters.maxPrice!
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredGuitars = filteredGuitars.filter(guitar => 
        guitar.name.toLowerCase().includes(searchTerm) || 
        guitar.manufacturer.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    if (sort) {
      filteredGuitars.sort((a, b) => {
        if (sort.field === 'price') {
          const priceA = parseInt(a.price);
          const priceB = parseInt(b.price);
          return sort.direction === 'asc' ? priceA - priceB : priceB - priceA;
        }
        
        const valueA = a[sort.field as keyof Guitar] || '';
        const valueB = b[sort.field as keyof Guitar] || '';
        
        if (valueA < valueB) return sort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Return data immediately to speed up tests
    return Promise.resolve(filteredGuitars);
  };

  return (
    <GuitarContext.Provider
      value={{
        guitars,
        isLoading,
        error,
        refreshGuitars,
        addGuitar,
        updateGuitar,
        deleteGuitar,
        getFilteredGuitars
      }}
    >
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