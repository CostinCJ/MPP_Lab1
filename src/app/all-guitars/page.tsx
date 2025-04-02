'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGuitars } from '../context/GuitarContext';

type Guitar = {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  strings: string;
  condition: string;
  price: string;
  imageUrl?: string;
  priceCategory?: 'cheapest' | 'mostExpensive' | 'averagePrice' | null;
};

type GuitarWithCategory = Guitar & {
  priceCategory: 'cheapest' | 'mostExpensive' | 'averagePrice' | null;
};

export default function AllGuitars() {
  // Get guitars from context 
  const { guitars } = useGuitars();
  
  // State for enhanced guitars with price categories
  const [enhancedGuitars, setEnhancedGuitars] = useState<GuitarWithCategory[]>([]);
  const [priceStats, setPriceStats] = useState({
    min: 0,
    max: 0,
    avg: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    type: {
      Electric: true,
      Acoustic: true,
      Classical: true
    },
    manufacturer: {
      Fender: true,
      Gibson: true,
      Ibanez: true
    },
    condition: {
      New: true,
      Used: true,
      Vintage: true
    },
    strings: {
      '6-string': true,
      '7-string': true,
      '12-string': true
    },
    priceRange: {
      min: 0,
      max: 10000
    }
  });

  // Sort state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  
  // Toggle state for showing stats
  const [showStats, setShowStats] = useState(true);

  // Filtered guitars
  const [filteredGuitars, setFilteredGuitars] = useState<Guitar[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate price statistics and enhance guitars with categories
  useEffect(() => {
    if (guitars && guitars.length > 0) {
      const prices = guitars.map(guitar => parseInt(guitar.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      setPriceStats({
        min: minPrice,
        max: maxPrice,
        avg: avgPrice
      });
      
      // Find closest to average price
      let closestToAvg = guitars[0];
      let minDiff = Math.abs(parseInt(closestToAvg.price) - avgPrice);
      
      guitars.forEach(guitar => {
        const diff = Math.abs(parseInt(guitar.price) - avgPrice);
        if (diff < minDiff) {
          minDiff = diff;
          closestToAvg = guitar;
        }
      });
      
      // Enhance guitars with price categories
      const enhanced = guitars.map(guitar => {
        let priceCategory: 'cheapest' | 'mostExpensive' | 'averagePrice' | null = null;
        const price = parseInt(guitar.price);
        
        if (price === minPrice) {
          priceCategory = 'cheapest';
        } else if (price === maxPrice) {
          priceCategory = 'mostExpensive';
        } else if (guitar.id === closestToAvg.id) {
          priceCategory = 'averagePrice';
        }
        
        return {
          ...guitar,
          priceCategory
        } as GuitarWithCategory;
      });
      
      setEnhancedGuitars(enhanced);
    }
  }, [guitars]);

  // Handle filter changes
  const handleFilterChange = (category: string, value: string) => {
    setFilters({
      ...filters,
      [category]: {
        ...filters[category as keyof typeof filters],
        [value]: !filters[category as keyof typeof filters][value as keyof typeof filters[keyof typeof filters]]
      }
    });
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Apply filters and search
  useEffect(() => {
    const result = enhancedGuitars.filter(guitar => {
      // Apply type filter
      if (!filters.type[guitar.type as keyof typeof filters.type]) {
        return false;
      }
      
      // Apply manufacturer filter
      if (!filters.manufacturer[guitar.manufacturer as keyof typeof filters.manufacturer]) {
        return false;
      }
      
      // Apply condition filter
      if (!filters.condition[guitar.condition as keyof typeof filters.condition]) {
        return false;
      }
      
      // Apply strings filter
      const stringKey = `${guitar.strings}-string` as keyof typeof filters.strings;
      if (!filters.strings[stringKey]) {
        return false;
      }
      
      // Apply price filter
      const price = parseInt(guitar.price);
      if (price < filters.priceRange.min || price > filters.priceRange.max) {
        return false;
      }
      
      // Apply search query
      if (searchQuery && 
          !guitar.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !guitar.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Apply sorting if selected
    const sortedResult = [...result];
    if (sortOrder === 'asc') {
      sortedResult.sort((a, b) => parseInt(a.price) - parseInt(b.price));
    } else if (sortOrder === 'desc') {
      sortedResult.sort((a, b) => parseInt(b.price) - parseInt(a.price));
    }
    setFilteredGuitars(sortedResult);
    
  }, [filters, enhancedGuitars, searchQuery, sortOrder]);

  // Get the background color based on price category
  const getPriceCategoryStyle = (category: string | null | undefined) => {
    if (!showStats) return {};
    
    switch(category) {
      case 'cheapest':
        return { backgroundColor: 'rgba(254, 215, 215, 0.5)' }; // Light red
      case 'mostExpensive':
        return { backgroundColor: 'rgba(209, 250, 229, 0.5)' }; // Light green
      case 'averagePrice':
        return { backgroundColor: 'rgba(219, 234, 254, 0.5)' }; // Light blue
      default:
        return {};
    }
  };

  // Get text description for price category
  const getPriceCategoryLabel = (category: string | null | undefined) => {
    if (!showStats) return null;
    
    switch(category) {
      case 'cheapest':
        return <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">Lowest Price</span>;
      case 'mostExpensive':
        return <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">Highest Price</span>;
      case 'averagePrice':
        return <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Average Price Range</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center px-4 py-3 border-b">
        <Link href="/" className="flex items-center">
          <Image 
            src="/guitar-icon.png" 
            alt="StringTracker Logo" 
            width={52}
            height={52}
            className="mr-2"
          />
        </Link>
        
        <div className="flex items-center">
          <div className="flex items-center space-x-6 mr-8">
            <Link 
              href="/all-guitars" 
              className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
            >
              All Guitars
            </Link>
            <Link href="/add-guitar" className="px-3 py-1 hover:underline">Add Guitar</Link>
            <Link href="/update-guitar" className="px-3 py-1 hover:underline">Update Guitar</Link>
            <Link href="/delete-guitar" className="px-3 py-1 hover:underline">Delete Guitar</Link>
          </div>
          
          <div className="flex space-x-3">
            <Link 
              href="/signin" 
              className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Sign in
            </Link>
            <Link 
              href="/register" 
              className="px-3 py-1 rounded-lg bg-black text-white hover:bg-gray-900 !text-white"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Left side - Filters */}
          <div className="w-full md:w-56 -ml-18">
            <div className="border border-gray-400 rounded-xl">
              <div className="p-4">
                <h2 className="font-medium mb-1.5">Guitar Type</h2>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="electric"
                      checked={filters.type.Electric}
                      onChange={() => handleFilterChange('type', 'Electric')}
                      className="mr-2"
                    />
                    <label htmlFor="electric" className="text-sm">Electric</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="acoustic"
                      checked={filters.type.Acoustic}
                      onChange={() => handleFilterChange('type', 'Acoustic')}
                      className="mr-2"
                    />
                    <label htmlFor="acoustic" className="text-sm">Acoustic</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="classical"
                      checked={filters.type.Classical}
                      onChange={() => handleFilterChange('type', 'Classical')}
                      className="mr-2"
                    />
                    <label htmlFor="classical" className="text-sm">Classical</label>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h2 className="font-medium mb-1.5">Price</h2>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>${filters.priceRange.min}</span>
                  <span>${filters.priceRange.max}</span>
                </div>
                <div className="flex items-center my-2">
                  <input 
                    type="range"
                    name="price"
                    min="0" 
                    max="10000" 
                    value={filters.priceRange.max}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setFilters({
                        ...filters,
                        priceRange: {
                          ...filters.priceRange,
                          max: value
                        }
                      });
                    }}
                    className="w-full appearance-none rounded-full h-1 bg-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4">
                <h2 className="font-medium mb-1.5">Manufacturer</h2>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="fender"
                      checked={filters.manufacturer.Fender}
                      onChange={() => handleFilterChange('manufacturer', 'Fender')}
                      className="mr-2"
                    />
                    <label htmlFor="fender" className="text-sm">Fender</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="gibson"
                      checked={filters.manufacturer.Gibson}
                      onChange={() => handleFilterChange('manufacturer', 'Gibson')}
                      className="mr-2"
                    />
                    <label htmlFor="gibson" className="text-sm">Gibson</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="ibanez"
                      checked={filters.manufacturer.Ibanez}
                      onChange={() => handleFilterChange('manufacturer', 'Ibanez')}
                      className="mr-2"
                    />
                    <label htmlFor="ibanez" className="text-sm">Ibanez</label>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h2 className="font-medium mb-1.5">Condition</h2>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="new"
                      checked={filters.condition.New}
                      onChange={() => handleFilterChange('condition', 'New')}
                      className="mr-2"
                    />
                    <label htmlFor="new" className="text-sm">New</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="used"
                      checked={filters.condition.Used}
                      onChange={() => handleFilterChange('condition', 'Used')}
                      className="mr-2"
                    />
                    <label htmlFor="used" className="text-sm">Used</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="vintage"
                      checked={filters.condition.Vintage}
                      onChange={() => handleFilterChange('condition', 'Vintage')}
                      className="mr-2"
                    />
                    <label htmlFor="vintage" className="text-sm">Vintage</label>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h2 className="font-medium mb-1.5">String Type</h2>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="6-string"
                      checked={filters.strings['6-string']}
                      onChange={() => handleFilterChange('strings', '6-string')}
                      className="mr-2"
                    />
                    <label htmlFor="6-string" className="text-sm">6-string</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="7-string"
                      checked={filters.strings['7-string']}
                      onChange={() => handleFilterChange('strings', '7-string')}
                      className="mr-2"
                    />
                    <label htmlFor="7-string" className="text-sm">7-string</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="12-string"
                      checked={filters.strings['12-string']}
                      onChange={() => handleFilterChange('strings', '12-string')}
                      className="mr-2"
                    />
                    <label htmlFor="12-string" className="text-sm">12-string</label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Price Statistics Box */}
            <div className="mt-6 border border-gray-400 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-medium">Price Statistics</h2>
                <button 
                  onClick={() => setShowStats(!showStats)}
                  className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                >
                  {showStats ? 'Hide Highlights' : 'Show Highlights'}
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Lowest:</span>
                  <span className="text-red-700">${priceStats.min}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Highest:</span>
                  <span className="text-green-700">${priceStats.max}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Average:</span>
                  <span className="text-blue-700">${priceStats.avg.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Guitar grid with search and sort */}
          <div className="flex-1">
            {/* Search and sort controls */}
            <div className="flex justify-between mb-6">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-80 pl-3 pr-10 py-2 border rounded-3xl border-gray-400"
                />
                <div className="absolute inset-y-0 left-70 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSortOrder('asc')}
                  className={`px-3 py-1 ring rounded-md ring-[grey] ${sortOrder === 'asc' ? 'bg-gray-200' : 'bg-white'}`}
                >
                  Price ascending
                </button>
                <button 
                  onClick={() => setSortOrder('desc')}
                  className={`px-3 py-1 ring rounded-md ring-[grey] ${sortOrder === 'desc' ? 'bg-gray-200' : 'bg-white'}`}
                >
                  Price descending
                </button>
              </div>
            </div>

            {/* Guitar grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGuitars.length > 0 ? (
                filteredGuitars.map(guitar => (
                  <div 
                    key={guitar.id} 
                    className="border border-gray-400 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg"
                    style={getPriceCategoryStyle(guitar.priceCategory)}
                  >
                    <div className="h-64 flex items-center justify-center p-2">
                      <Image
                        src={guitar.imageUrl || "/guitar-placeholder.png"}
                        alt={guitar.name}
                        width={260}
                        height={260}
                        style={{ objectFit: "contain" }}
                        className="max-h-full"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium">{guitar.manufacturer} {guitar.name}</h3>
                        <span className="font-bold">${guitar.price}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p>Type: {guitar.type}</p>
                        <p>Condition: {guitar.condition}</p>
                        <p>Strings: {guitar.strings}</p>
                      </div>
                      {getPriceCategoryLabel(guitar.priceCategory)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-gray-500">
                  No guitars match your current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-3 px-6 flex justify-between items-center bg-white">
        <div className="flex items-center">
          <Image 
            src="/guitar-icon.png" 
            alt="StringTracker Logo" 
            width={52}
            height={52}
            className="mr-2"
          />
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/about" className="text-sm hover:underline px-3 py-1">About Us</Link>
          <Link 
            href="/contact" 
            className="text-sm hover:underline bg-gray-800 text-white px-3 py-1 rounded-lg !text-white"
          >
            Contact Us
          </Link>
        </div>
      </footer>
    </div>
  );
}