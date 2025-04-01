'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

export default function DeleteGuitar() {
  // Sample guitar data
  const [guitars, setGuitars] = useState<Guitar[]>([
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
  ]);

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guitar[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // State for selected guitar
  const [selectedGuitar, setSelectedGuitar] = useState<Guitar | null>(null);
  
  // State for confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // State for success message
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  // Ref for the search input
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Ref for the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update search results when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = guitars.filter(guitar => {
      const fullName = `${guitar.manufacturer} ${guitar.name}`.toLowerCase();
      return fullName.includes(lowerCaseQuery);
    });

    // Only show dropdown if we have results and no guitar is selected
    // or if the current search doesn't exactly match the selected guitar
    if (results.length > 0) {
      if (!selectedGuitar) {
        setShowDropdown(true);
      } else {
        const exactMatch = `${selectedGuitar.manufacturer} ${selectedGuitar.name}`.toLowerCase() === searchQuery.toLowerCase();
        setShowDropdown(!exactMatch);
      }
    } else {
      setShowDropdown(false);
    }
    
    setSearchResults(results);
  }, [searchQuery, guitars, selectedGuitar]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle selecting a guitar from the dropdown
  const handleSelectGuitar = (guitar: Guitar) => {
    setSelectedGuitar(guitar);
    setSearchQuery(`${guitar.manufacturer} ${guitar.name}`);
    setShowDropdown(false);
  };

  // Handle clearing the search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedGuitar(null);
    setShowDropdown(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    if (selectedGuitar) {
      setShowConfirmation(true);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowConfirmation(false);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!selectedGuitar) return;
    
    console.log(`Deleting guitar: ${selectedGuitar.manufacturer} ${selectedGuitar.name}`);
    
    // Remove the guitar from the guitars array
    setGuitars(prevGuitars => prevGuitars.filter(guitar => guitar.id !== selectedGuitar.id));
    
    // Show success message
    setDeleteSuccess(true);
    
    // Reset states
    setShowConfirmation(false);
    setSelectedGuitar(null);
    setSearchQuery('');
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setDeleteSuccess(false);
    }, 3000);
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
              className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              All Guitars
            </Link>
            <Link href="/add-guitar" className="px-3 py-1 hover:underline">Add Guitar</Link>
            <Link href="/update-guitar" className="px-3 py-1 hover:underline">Update Guitar</Link>
            <Link href="/delete-guitar" className="px-3 py-1 hover:underline font-medium">Delete Guitar</Link>
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

      {/* Main Content with light background */}
      <main className="flex-grow flex flex-col items-center px-4 bg-white py-8">
        <div className="w-full max-w-3xl my-10">
          <h1 className="text-6xl font-bold text-center mb-2 text-black">Delete Guitar</h1>
          <h2 className="text-xl text-center text-gray-500 mb-8">Choose and delete a guitar</h2>
          
          {/* Success Message */}
          {deleteSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Guitar deleted successfully!
            </div>
          )}
          
          {/* Search Box */}
          <div className="mb-8 relative">
            <label htmlFor="guitarSearch" className="block mb-2 text-sm font-medium">Enter Guitar Name</label>
            <div className="relative">
              <input
                type="text"
                id="guitarSearch"
                ref={searchInputRef}
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search guitar by name..."
                className="w-full pl-10 pr-10 py-2 border rounded-lg border-gray-400"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                {searchResults.map((guitar) => (
                  <div
                    key={guitar.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectGuitar(guitar)}
                  >
                    <div className="font-medium">{guitar.manufacturer} {guitar.name}</div>
                    <div className="text-sm text-gray-500">{guitar.type} · {guitar.condition}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected Guitar Preview */}
            {selectedGuitar && (
            <div className="mb-8 border border-gray-300 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Selected Guitar</h3>
                <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex justify-center">
                    <div className="relative w-48 h-48">
                    <Image
                        src={selectedGuitar.imageUrl || "/guitar-placeholder.png"}
                        alt={`${selectedGuitar.manufacturer} ${selectedGuitar.name}`}
                        fill
                        style={{ objectFit: "contain" }}
                    />
                    </div>
                </div>
                <div className="w-full md:w-2/3">
                    <h4 className="text-xl font-medium mb-2">{selectedGuitar.manufacturer} {selectedGuitar.name}</h4>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p>{selectedGuitar.type}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Condition</p>
                        <p>{selectedGuitar.condition}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Strings</p>
                        <p>{selectedGuitar.strings}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p>${selectedGuitar.price}</p>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            )}
          
          {/* Buttons at bottom */}
          <div className="flex justify-between mt-8">
            <Link
              href="/"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleDeleteClick}
              disabled={!selectedGuitar}
              className={`px-6 py-2 rounded-lg ${
                selectedGuitar
                  ? 'bg-black text-white hover:bg-gray-900'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-colors`}
            >
              Delete
            </button>
          </div>
        </div>
      </main>


      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
                Are you sure you want to delete <span className="font-medium">{selectedGuitar?.manufacturer} {selectedGuitar?.name}</span>?
                This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
                <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                Cancel
                </button>
                <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-[black] text-white rounded-lg hover:bg-[black]"
                >
                Delete
                </button>
            </div>
            </div>
        </div>
        )}

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