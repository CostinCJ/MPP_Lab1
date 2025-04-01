'use client';

import { useState } from 'react';
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
};

export default function UpdateGuitar() {
  const { guitars, updateGuitar } = useGuitars();
  
  // State for search and form display
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guitar[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedGuitar, setSelectedGuitar] = useState<Guitar | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    strings: '',
    condition: '',
    price: '',
  });
  
  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // Validation and submission state
  const [errors, setErrors] = useState({
    strings: false,
    condition: false,
    price: false,
    image: false,
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 1) {
      // Filter guitars based on name or manufacturer
      const results = guitars.filter(guitar => 
        guitar.name.toLowerCase().includes(query.toLowerCase()) || 
        guitar.manufacturer.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  // Handle search result selection
  const handleSelectGuitar = (guitar: Guitar) => {
    setSelectedGuitar(guitar);
    setFormData({
      strings: guitar.strings,
      condition: guitar.condition,
      price: guitar.price,
    });
    setImagePreview(guitar.imageUrl || null);
    setSearchQuery(`${guitar.manufacturer} ${guitar.name}`);
    setShowSearchResults(false);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user types
    setErrors({
      ...errors,
      [name]: false,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
 
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setImageError(true);
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageError(true);
        return;
      }
      
      setImageError(false);
      setErrors(prevErrors => ({
        ...prevErrors,
        image: false
      }));
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If no file is selected, keep the current image
      if (selectedGuitar) {
        setImagePreview(selectedGuitar.imageUrl || null);
      } else {
        setImagePreview(null);
      }
      setImageError(false);
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {
      strings: formData.strings === '',
      condition: formData.condition === '',
      price: formData.price === '' || 
             isNaN(Number(formData.price.replace(/[^\d.-]/g, ''))) || 
             Number(formData.price.replace(/[^\d.-]/g, '')) <= 0,
      image: imageError,
    };
    
    setErrors(newErrors);
    
    // Return true if no errors
    return !Object.values(newErrors).some(error => error);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGuitar) {
      alert('Please select a guitar to update');
      return;
    }
    
    if (validateForm()) {
      // Create updated guitar object
      const updatedGuitar = {
        ...selectedGuitar,
        ...formData,
        imageUrl: imagePreview || selectedGuitar.imageUrl,
      };
      
      // Update the guitar in the guitars array
      updateGuitar(selectedGuitar.id, updatedGuitar);
      
      // Update the state with the new guitars array
      setSelectedGuitar({
        ...selectedGuitar,
        ...updatedGuitar
      });
      
      // Update search query to reflect potential name changes
      setSearchQuery(`${selectedGuitar.manufacturer} ${selectedGuitar.name}`);
      
      // Show success message
      setFormSubmitted(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setFormSubmitted(false);
      }, 3000);
    }
  };

  // Clear the selected guitar and form
  const handleCancel = () => {
    setSelectedGuitar(null);
    setFormData({
      strings: '',
      condition: '',
      price: '',
    });
    setImagePreview(null);
    setSearchQuery('');
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
            <Link href="/update-guitar" className="px-3 py-1 hover:underline font-medium">Update Guitar</Link>
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
      <main className="flex-grow flex flex-col items-center px-4 bg-white py-8">
        <div className="w-full max-w-2xl my-10">
          <h1 className="text-6xl font-bold text-center mb-2 text-black">Update Guitar</h1>
          <h2 className="text-xl text-center text-gray-500 mb-8">Edit guitar information</h2>
          
          {/* Success Message */}
          {formSubmitted && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Guitar updated successfully!
            </div>
          )}
          
          {/* Search Input */}
          <div className="relative mb-8">
            <label htmlFor="guitarSearch" className="block mb-2">Enter Guitar Name</label>
            <div className="relative">
              <input
                type="text"
                id="guitarSearch"
                placeholder="Search by name or manufacturer..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border rounded border-gray-300 pl-10"
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-400 absolute left-3 top-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-3"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
                {searchResults.map(guitar => (
                  <div 
                    key={guitar.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleSelectGuitar(guitar)}
                  >
                    <div className="w-10 h-10 mr-3 relative flex-shrink-0">
                      <Image
                        src={guitar.imageUrl || "/guitar-placeholder.png"}
                        alt={guitar.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{guitar.manufacturer} {guitar.name}</div>
                      <div className="text-sm text-gray-600">${guitar.price} - {guitar.condition}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showSearchResults && searchResults.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
                <div className="px-4 py-2 text-gray-500">No guitars found</div>
              </div>
            )}
          </div>
          
          {/* Selected Guitar Preview */}
          {selectedGuitar && (
            <div className="mb-8 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-xl font-semibold mb-4">Selected Guitar</h3>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative w-48 h-48 overflow-hidden rounded border border-gray-300 bg-white">
                  <Image 
                    src={selectedGuitar.imageUrl || "/guitar-placeholder.png"} 
                    alt={selectedGuitar.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    className="p-2"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium mb-2">{selectedGuitar.manufacturer} {selectedGuitar.name}</h4>
                  <div className="flex flex-col space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {selectedGuitar.type}
                    </div>
                    <div>
                      <span className="font-medium">Strings:</span> {selectedGuitar.strings}
                    </div>
                    <div>
                      <span className="font-medium">Condition:</span> {selectedGuitar.condition}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> ${selectedGuitar.price}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Update Form */}
          {selectedGuitar && (
            <form onSubmit={handleSubmit}>              
              {/* Strings Update */}
              <div className="mb-4">
                <label htmlFor="strings" className="block mb-2">String Number Update</label>
                <select
                  id="strings"
                  name="strings"
                  value={formData.strings}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded ${errors.strings ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select number of strings</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="12">12</option>
                </select>
                {errors.strings && <p className="text-red-500 text-sm mt-1">Please select number of strings</p>}
              </div>
              
              {/* Condition Update */}
              <div className="mb-4">
                <label htmlFor="condition" className="block mb-2">Condition Update</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded ${errors.condition ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Vintage">Vintage</option>
                </select>
                {errors.condition && <p className="text-red-500 text-sm mt-1">Condition is required</p>}
              </div>
              
              {/* Price Update */}
              <div className="mb-6">
                <label htmlFor="price" className="block mb-2">Price Update</label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  placeholder="Updated Price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">Enter a valid positive price</p>}
              </div>
              
              {/* Image Update */}
              <div className="mb-6">
                <label htmlFor="image" className="block mb-2">Update Guitar Image</label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={`w-full px-3 py-2 border rounded ${errors.image ? 'border-red-500' : 'border-gray-300'}`}
                />
                {imageError && (
                  <p className="text-red-500 text-sm mt-1">Please upload a valid image (max 5MB)</p>
                )}
                
                {/* Updated Image Preview */}
                {imagePreview && imagePreview !== selectedGuitar.imageUrl && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">New Image Preview:</h4>
                    <div className="relative w-full h-40 overflow-hidden rounded border border-gray-300">
                      <Image 
                        src={imagePreview} 
                        alt="Guitar preview" 
                        fill
                        style={{ objectFit: 'contain' }}
                        className="p-2"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-between gap-4">
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="w-1/2 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

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