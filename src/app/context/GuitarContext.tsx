'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

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

type GuitarContextType = {
  guitars: Guitar[];
  setGuitars: React.Dispatch<React.SetStateAction<Guitar[]>>;
  addGuitar: (guitar: Omit<Guitar, 'id'>) => void;
  updateGuitar: (id: string, updatedGuitar: Partial<Guitar>) => void;
  deleteGuitar: (id: string) => void;
};

const initialGuitars: Guitar[] = [
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

const GuitarContext = createContext<GuitarContextType | undefined>(undefined);

export const GuitarProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage or use initial data
  const [guitars, setGuitars] = useState<Guitar[]>(initialGuitars);
  const [isClient, setIsClient] = useState(false);


  // Save to localStorage whenever guitars change
  useEffect(() => {
    setIsClient(true);
    const savedGuitars = localStorage.getItem('guitars');
    if (savedGuitars) {
      setGuitars(JSON.parse(savedGuitars));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('guitars', JSON.stringify(guitars));
    }
  }, [guitars, isClient]);

  const addGuitar = (guitarData: Omit<Guitar, 'id'>) => {
    const newGuitar: Guitar = {
      ...guitarData,
      id: `guitar_${Date.now()}`,
    };
    setGuitars(prevGuitars => [...prevGuitars, newGuitar]);
  };

  const updateGuitar = (id: string, updatedGuitar: Partial<Guitar>) => {
    setGuitars(prevGuitars => 
      prevGuitars.map(guitar => 
        guitar.id === id ? { ...guitar, ...updatedGuitar } : guitar
      )
    );
  };

  const deleteGuitar = (id: string) => {
    setGuitars(prevGuitars => prevGuitars.filter(guitar => guitar.id !== id));
  };

  return (
    <GuitarContext.Provider value={{ guitars, setGuitars, addGuitar, updateGuitar, deleteGuitar }}>
      {children}
    </GuitarContext.Provider>
  );
};

export const useGuitars = () => {
    const context = useContext(GuitarContext);
    if (context === undefined) {
      throw new Error('useGuitars must be used within a GuitarProvider');
    }
    return context;
  };