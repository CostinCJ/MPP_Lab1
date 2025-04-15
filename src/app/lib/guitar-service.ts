import { promises as fs } from 'fs';
import path from 'path';

// Define the Guitar type
export type Guitar = {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  strings: string;
  condition: string;
  price: string;
  imageUrl?: string;
};

// Path to the data file
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'guitars.json');

// Initialize data directory and file if they don't exist
const initializeDataFile = async (): Promise<void> => {
  try {
    // Ensure the data directory exists
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    
    // Check if the data file exists
    try {
      await fs.access(DATA_FILE_PATH);
    } catch {
      // If the file doesn't exist, create it with initial data
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
      
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(initialGuitars, null, 2));
    }
  } catch (error) {
    console.error('Error initializing data file:', error);
    throw new Error('Failed to initialize data storage');
  }
};

// Get all guitars
export const getAllGuitars = async (): Promise<Guitar[]> => {
  await initializeDataFile();
  
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading guitars data:', error);
    throw new Error('Failed to get guitars');
  }
};

// Get a single guitar by ID
export const getGuitarById = async (id: string): Promise<Guitar | null> => {
  try {
    const guitars = await getAllGuitars();
    return guitars.find(guitar => guitar.id === id) || null;
  } catch (error) {
    console.error(`Error getting guitar with ID ${id}:`, error);
    throw new Error('Failed to get guitar');
  }
};

// Create a new guitar
export const createGuitar = async (guitarData: Omit<Guitar, 'id'>): Promise<Guitar> => {
  try {
    const guitars = await getAllGuitars();
    
    // Generate a unique ID
    const id = `guitar_${Date.now()}`;
    
    const newGuitar: Guitar = {
      ...guitarData,
      id,
    };
    
    // Add the new guitar to the array
    guitars.push(newGuitar);
    
    // Save the updated array
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(guitars, null, 2));
    
    return newGuitar;
  } catch (error) {
    console.error('Error creating guitar:', error);
    throw new Error('Failed to create guitar');
  }
};

// Update an existing guitar
export const updateGuitar = async (id: string, updates: Partial<Guitar>): Promise<Guitar | null> => {
  try {
    const guitars = await getAllGuitars();
    
    // Find the index of the guitar to update
    const index = guitars.findIndex(guitar => guitar.id === id);
    
    if (index === -1) {
      return null; // Guitar not found
    }
    
    // Update the guitar
    const updatedGuitar = {
      ...guitars[index],
      ...updates,
      id, // Ensure the ID doesn't change
    };
    
    guitars[index] = updatedGuitar;
    
    // Save the updated array
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(guitars, null, 2));
    
    return updatedGuitar;
  } catch (error) {
    console.error(`Error updating guitar with ID ${id}:`, error);
    throw new Error('Failed to update guitar');
  }
};

// Delete a guitar
export const deleteGuitar = async (id: string): Promise<boolean> => {
  try {
    let guitars = await getAllGuitars();
    
    // Check if the guitar exists
    const guitarExists = guitars.some(guitar => guitar.id === id);
    
    if (!guitarExists) {
      return false; // Guitar not found
    }
    
    // Filter out the guitar to delete
    guitars = guitars.filter(guitar => guitar.id !== id);
    
    // Save the updated array
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(guitars, null, 2));
    
    return true;
  } catch (error) {
    console.error(`Error deleting guitar with ID ${id}:`, error);
    throw new Error('Failed to delete guitar');
  }
};

// Filter and sort guitars
export const getFilteredAndSortedGuitars = async (
  filters?: {
    type?: string[];
    manufacturer?: string[];
    condition?: string[];
    strings?: string[];
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  },
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  }
): Promise<Guitar[]> => {
  try {
    let guitars = await getAllGuitars();
    
    // Apply filters if they exist
    if (filters) {
      if (filters.type && filters.type.length > 0) {
        guitars = guitars.filter(guitar => filters.type!.includes(guitar.type));
      }
      
      if (filters.manufacturer && filters.manufacturer.length > 0) {
        guitars = guitars.filter(guitar => filters.manufacturer!.includes(guitar.manufacturer));
      }
      
      if (filters.condition && filters.condition.length > 0) {
        guitars = guitars.filter(guitar => filters.condition!.includes(guitar.condition));
      }
      
      if (filters.strings && filters.strings.length > 0) {
        guitars = guitars.filter(guitar => filters.strings!.includes(guitar.strings));
      }
      
      if (filters.minPrice !== undefined) {
        guitars = guitars.filter(guitar => parseFloat(guitar.price) >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        guitars = guitars.filter(guitar => parseFloat(guitar.price) <= filters.maxPrice!);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        guitars = guitars.filter(
          guitar => 
            guitar.name.toLowerCase().includes(searchTerm) || 
            guitar.manufacturer.toLowerCase().includes(searchTerm)
        );
      }
    }
    
    // Apply sorting if it exists
    if (sort) {
      guitars.sort((a, b) => {
        let valueA, valueB;
        
        // Handle special case for price (convert to number)
        if (sort.field === 'price') {
          valueA = parseFloat(String(a[sort.field as keyof Guitar] || '0'));
          valueB = parseFloat(String(b[sort.field as keyof Guitar] || '0'));
        } else {
          valueA = a[sort.field as keyof Guitar] || '';
          valueB = b[sort.field as keyof Guitar] || '';
        }
        
        if (valueA < valueB) {
          return sort.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sort.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return guitars;
  } catch (error) {
    console.error('Error filtering and sorting guitars:', error);
    throw new Error('Failed to filter and sort guitars');
  }
};