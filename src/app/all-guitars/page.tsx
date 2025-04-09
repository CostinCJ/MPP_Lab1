'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGuitars } from '../context/GuitarContext';

// Basic Guitar type (from context)
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

// Extended type for display with price category
type GuitarWithCategory = Guitar & {
  priceCategory: 'cheapest' | 'mostExpensive' | 'averagePrice' | null;
};

// Types for API filtering and sorting
type FilterType = {
  type?: string[];
  manufacturer?: string[];
  condition?: string[];
  strings?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

type SortType = {
  field: string;
  direction: 'asc' | 'desc';
};

export default function AllGuitars() {
  // Get functions and state from context
  const { getFilteredGuitars } = useGuitars();

  // State for guitars to be displayed (fetched and enhanced)
  const [displayGuitars, setDisplayGuitars] = useState<GuitarWithCategory[]>([]);

  // Add local loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for price statistics based on the currently displayed guitars
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Main Effect for Fetching and Processing Data
  useEffect(() => {
    const fetchAndProcessGuitars = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Construct API Filters
        const apiFilters: FilterType = {
          type: Object.entries(filters.type)
            .filter(([, value]) => value)
            .map(([key]) => key),
          manufacturer: Object.entries(filters.manufacturer)
            .filter(([, value]) => value)
            .map(([key]) => key),
          condition: Object.entries(filters.condition)
            .filter(([, value]) => value)
            .map(([key]) => key),
          strings: Object.entries(filters.strings)
            .filter(([, value]) => value)
            .map(([key]) => key.split('-')[0]),
          minPrice: filters.priceRange.min,
          maxPrice: filters.priceRange.max,
          search: searchQuery || undefined
        };

        // Clean up empty filters
        Object.keys(apiFilters).forEach(key => {
          const filterKey = key as keyof FilterType;
          if (apiFilters.hasOwnProperty(filterKey) && Array.isArray(apiFilters[filterKey]) && (apiFilters[filterKey] as string[]).length === 0) {
              delete apiFilters[filterKey];
          } else if (apiFilters.hasOwnProperty(filterKey) && apiFilters[filterKey] === undefined) {
              delete apiFilters[filterKey];
          }
        });

        // Construct API Sort
        const apiSort: SortType | undefined = sortOrder
          ? { field: 'price', direction: sortOrder }
          : undefined;

        // Fetch filtered guitars
        const fetchedGuitars = await getFilteredGuitars(apiFilters, apiSort);

        // Process fetched guitars if we have some
        if (fetchedGuitars && fetchedGuitars.length > 0) {
          // Calculate price statistics
          const prices = fetchedGuitars.map(guitar => parseInt(guitar.price));
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

          setPriceStats({ min: minPrice, max: maxPrice, avg: avgPrice });

          // Find guitar closest to average price
          let closestToAvg: Guitar | null = null;
          let minDiff = Infinity;

          fetchedGuitars.forEach(guitar => {
            const diff = Math.abs(parseInt(guitar.price) - avgPrice);
            if (diff < minDiff) {
              minDiff = diff;
              closestToAvg = guitar;
            }
          });

          // Add price categories to guitars
          const enhanced = fetchedGuitars.map(guitar => {
            let priceCategory: 'cheapest' | 'mostExpensive' | 'averagePrice' | null = null;
            const price = parseInt(guitar.price);

            if (price === minPrice) priceCategory = 'cheapest';
            else if (price === maxPrice) priceCategory = 'mostExpensive';
            else if (closestToAvg && guitar.id === closestToAvg.id) priceCategory = 'averagePrice';

            return { ...guitar, priceCategory } as GuitarWithCategory;
          });

          setDisplayGuitars(enhanced);
        } else {
          // No guitars match filters
          setDisplayGuitars([]);
          setPriceStats({ min: 0, max: 0, avg: 0 });
        }
      } catch (err) {
        console.error("Error fetching guitars:", err);
        setError("Error loading guitars: " + (err instanceof Error ? err.message : String(err)));
        setDisplayGuitars([]);
        setPriceStats({ min: 0, max: 0, avg: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessGuitars();
  }, [filters, searchQuery, sortOrder, getFilteredGuitars]);

  // Handle filter changes
  const handleFilterChange = (category: string, value: string) => {
    // Type assertion needed for nested dynamic keys
    type FilterCategoryKey = keyof typeof filters;
    type FilterValueKey<T extends FilterCategoryKey> = keyof typeof filters[T];

    setFilters(prevFilters => {
      const categoryKey = category as FilterCategoryKey;

      // Handle specific category logic if needed, otherwise assume boolean toggles
      if (categoryKey === 'priceRange') {
        // This part is handled by the range input's onChange directly
        return prevFilters;
      }

      // Ensure the category exists and is an object
      if (typeof prevFilters[categoryKey] !== 'object' || prevFilters[categoryKey] === null) {
        console.error("Invalid filter category:", categoryKey);
        return prevFilters;
      }

      // Assert the type for the nested structure
      const currentCategoryState = prevFilters[categoryKey] as Record<string, boolean>;
      const valueKey = value as FilterValueKey<typeof categoryKey>;

      return {
        ...prevFilters,
        [categoryKey]: {
          ...currentCategoryState,
          [valueKey]: !currentCategoryState[valueKey]
        }
      };
    });
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Helper functions for UI
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

  // Render Logic
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
            {/* Filter Box */}
            <div className="border border-gray-400 rounded-xl">
              {/* Guitar Type */}
              <div className="p-4">
                <h2 className="font-medium mb-1.5">Guitar Type</h2>
                <div className="space-y-1">
                  {Object.keys(filters.type).map(typeKey => (
                    <div key={typeKey} className="flex items-center">
                      <input
                        type="checkbox"
                        id={typeKey.toLowerCase()}
                        checked={filters.type[typeKey as keyof typeof filters.type]}
                        onChange={() => handleFilterChange('type', typeKey)}
                        className="mr-2"
                      />
                      <label htmlFor={typeKey.toLowerCase()} className="text-sm">{typeKey}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
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
                    className="w-full appearance-none rounded-full h-1 bg-gray-300 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Manufacturer */}
              <div className="p-4">
                <h2 className="font-medium mb-1.5">Manufacturer</h2>
                <div className="space-y-1">
                  {Object.keys(filters.manufacturer).map(mfgKey => (
                    <div key={mfgKey} className="flex items-center">
                      <input
                        type="checkbox"
                        id={mfgKey.toLowerCase()}
                        checked={filters.manufacturer[mfgKey as keyof typeof filters.manufacturer]}
                        onChange={() => handleFilterChange('manufacturer', mfgKey)}
                        className="mr-2"
                      />
                      <label htmlFor={mfgKey.toLowerCase()} className="text-sm">{mfgKey}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="p-4">
                <h2 className="font-medium mb-1.5">Condition</h2>
                <div className="space-y-1">
                  {Object.keys(filters.condition).map(condKey => (
                    <div key={condKey} className="flex items-center">
                      <input
                        type="checkbox"
                        id={condKey.toLowerCase()}
                        checked={filters.condition[condKey as keyof typeof filters.condition]}
                        onChange={() => handleFilterChange('condition', condKey)}
                        className="mr-2"
                      />
                      <label htmlFor={condKey.toLowerCase()} className="text-sm">{condKey}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* String Type */}
              <div className="p-4">
                <h2 className="font-medium mb-1.5">String Type</h2>
                <div className="space-y-1">
                  {Object.keys(filters.strings).map(strKey => (
                    <div key={strKey} className="flex items-center">
                      <input
                        type="checkbox"
                        id={strKey}
                        checked={filters.strings[strKey as keyof typeof filters.strings]}
                        onChange={() => handleFilterChange('strings', strKey)}
                        className="mr-2"
                      />
                      <label htmlFor={strKey} className="text-sm">{strKey}</label>
                    </div>
                  ))}
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
              {displayGuitars.length > 0 ? (
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
              ) : (
                <p className="text-sm text-gray-500">No guitars to calculate stats for.</p>
              )}
            </div>
          </div>

          {/* Right side - Guitar grid with search and sort */}
          <div className="flex-1">
            {/* Search and sort controls */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="relative w-full sm:w-64 md:w-80">
                <input
                  type="text"
                  placeholder="Search by name or manufacturer"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-3 pr-10 py-2 border rounded-3xl border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`px-3 py-1 text-sm rounded-md border ${sortOrder === 'asc' ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-400 hover:bg-gray-100'}`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`px-3 py-1 text-sm rounded-md border ${sortOrder === 'desc' ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-400 hover:bg-gray-100'}`}
                >
                  Price: High to Low
                </button>
                {/* Optional: Button to clear sort */}
                {sortOrder && (
                  <button
                    onClick={() => setSortOrder(null)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                    title="Clear sort"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Display Loading State */}
            {isLoading && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                Loading guitars...
              </div>
            )}

            {/* Display Error State */}
            {error && !isLoading && (
              <div className="col-span-3 py-8 text-center text-red-600 bg-red-50 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Guitar grid - Uses displayGuitars */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayGuitars.length > 0 ? (
                  displayGuitars.map(guitar => (
                    <div
                      key={guitar.id}
                      className="border border-gray-300 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col pt-4"
                    >
                      {/* Image Container */}
                      <div className="h-60 sm:h-64 bg-white flex items-center justify-center p-2 relative overflow-hidden">
                        {guitar.imageUrl ? (
                          <Image
                            src={guitar.imageUrl}
                            alt={`${guitar.manufacturer} ${guitar.name}`}
                            fill
                            style={{ objectFit: "contain" }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={false}
                          />
                        ) : (
                          <Image
                            src="/guitar-placeholder.png"
                            alt="Guitar placeholder"
                            fill
                            style={{ objectFit: "contain" }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={false}
                          />
                        )}
                      </div>
                      {/* Details Container */}
                      <div
                        className="p-3 flex flex-col flex-grow"
                        style={getPriceCategoryStyle(guitar.priceCategory)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium text-base leading-tight">{guitar.manufacturer} {guitar.name}</h3>
                          <span className="font-bold text-lg">${guitar.price}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 space-y-0.5">
                          <p><span className="font-medium">Type:</span> {guitar.type}</p>
                          <p><span className="font-medium">Condition:</span> {guitar.condition}</p>
                          <p><span className="font-medium">Strings:</span> {guitar.strings}</p>
                        </div>
                        <div className="mt-auto pt-2">
                          {getPriceCategoryLabel(guitar.priceCategory)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 py-8 text-center text-gray-500">
                    No guitars match your current filters or search.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 py-3 px-6 flex justify-between items-center bg-white">
        <div className="flex items-center">
          <Image
            src="/guitar-icon.png"
            alt="StringTracker Logo"
            width={40}
            height={40}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">&copy; {new Date().getFullYear()} StringTracker</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/about" className="text-sm hover:underline px-3 py-1 text-gray-700">About Us</Link>
          <Link
            href="/contact"
            className="text-sm hover:underline bg-gray-800 text-white px-3 py-1 rounded-lg !text-white hover:bg-gray-700"
          >
            Contact Us
          </Link>
        </div>
      </footer>
    </div>
  );
};