'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGuitars, type Guitar } from '../context/GuitarContext';
import ProtectedPage from '../components/ProtectedPage';
import { signOut } from 'next-auth/react';

export default function AddGuitar() {
  // Get guitars and addGuitar function from context
  const { guitars, addGuitar } = useGuitars();
  
  // Form state
  const [formData, setFormData] = useState({
    model: '',
    brandName: '',
    type: '',
    strings: '',
    condition: '',
    price: '',
  });
  
  // State for image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Validation errors state
  const [errors, setErrors] = useState({
    model: false,
    brandName: false,
    type: false,
    strings: false,
    condition: false,
    price: false,
    image: false,
  });
  
  // State for form submission status
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  // State for image upload
  const [imageSelected, setImageSelected] = useState(false);

  // Handle input changes
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
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
        setImageSelected(true);

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            setImageError(true);
            setImagePreview(null);
            return;
        }
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setImageError(true);
            setImagePreview(null);
            return;
        }
        
        setImageError(false);

        setErrors(prevErrors => ({
            ...prevErrors,
            image: false  // Clear the error state for the image
        }));
        
        // Create a preview URL for the image
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
            setImageSelected(false);
            setImageError(false);
        }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {
      model: formData.model.trim() === '',
      brandName: formData.brandName.trim() === '',
      type: formData.type.trim() === '',
      strings: formData.strings === '',
      condition: formData.condition.trim() === '',
      price: formData.price.trim() === '' ||
             isNaN(Number(formData.price.replace(/[^\d.-]/g, ''))) ||
             Number(formData.price.replace(/[^\d.-]/g, '')) <= 0,
      image: imageError || !imageSelected,
    };
    
    setErrors(newErrors);
    
    // Return true if no errors
    return !Object.values(newErrors).some(error => error);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Check for duplicate based on name and manufacturer
      const isDuplicate = guitars.some(
        guitar =>
          guitar.model.toLowerCase() === formData.model.toLowerCase() &&
          guitar.brand?.name?.toLowerCase() === formData.brandName.toLowerCase()
      );
      
      if (isDuplicate) {
        // Show error for duplicate guitar
        setErrors({
          ...errors,
          model: true,
          brandName: true
        });

        // Show duplicate error message temporarily
        setFormSubmitted(false); // Reset success state
        setDuplicateError(true);
        
        setTimeout(() => {
          setDuplicateError(false);
        }, 3000);
        
        return;
      }
      
      const imageUrl = imagePreview || '/guitar-placeholder.png';
      
      // Add to shared context instead of local state
      // Construct the payload for the API based on what it expects
      const apiPayload = {
        model: formData.model,
        brandName: formData.brandName,
        type: formData.type,
        strings: formData.strings,
        condition: formData.condition,
        price: formData.price,
        imageUrl
      };
      
      addGuitar(apiPayload as Omit<Guitar, 'id'>);
      
      // Reset form
      setFormData({
        model: '',
        brandName: '',
        type: '',
        strings: '',
        condition: '',
        price: '',
      });
      
      // Reset image
      setImagePreview(null);
      setImageSelected(false);
      
      // Show success message
      setFormSubmitted(true);
      setDuplicateError(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setFormSubmitted(false);
      }, 3000);
    }
  };

  return (
    <ProtectedPage>
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
            <Link href="/add-guitar" className="px-3 py-1 hover:underline font-medium">Add Guitar</Link>
            <Link href="/update-guitar" className="px-3 py-1 hover:underline">Update Guitar</Link>
            <Link href="/delete-guitar" className="px-3 py-1 hover:underline">Delete Guitar</Link>
          </div>
          
          <div className="flex space-x-3">
            {/* Since this page is protected, user is always authenticated here */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home after sign out
              className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-800 text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content with light background */}
      <main className="flex-grow flex flex-col items-center px-4 bg-white py-8">
        <div className="w-full max-w-2xl my-10">
          <h1 className="text-6xl font-bold text-center mb-2 text-black">Add Products</h1>
          <h2 className="text-xl text-center text-gray-500 mb-8">Add a guitar in the inventory</h2>
          
          {/* Success Message */}
          {formSubmitted && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Guitar added successfully!
            </div>
          )}
          
          {/* Duplicate Error Message */}
          {duplicateError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              This guitar already exists in the inventory!
            </div>
          )}
          
          {/* Guitar Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4 my-15">
              <label htmlFor="model" className="block mb-2">Guitar Model</label>
              <input
                type="text"
                id="model"
                name="model"
                placeholder="Guitar Model"
                value={formData.model}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.model ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.model && <p className="text-red-500 text-sm mt-1">Guitar model is required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="brandName" className="block mb-2">Manufacturer</label>
              <input
                type="text"
                id="brandName"
                name="brandName"
                placeholder="Manufacturer Name"
                value={formData.brandName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.brandName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.brandName && <p className="text-red-500 text-sm mt-1">Manufacturer is required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="type" className="block mb-2">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select type</option>
                <option value="Electric">Electric</option>
                <option value="Acoustic">Acoustic</option>
                <option value="Classical">Classical</option>
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">Type is required</p>}
            </div>

            <div className="mb-4">
                <label htmlFor="strings" className="block mb-2">Strings</label>
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

            <div className="mb-4">
              <label htmlFor="condition" className="block mb-2">Condition</label>
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

            <div className="mb-6">
              <label htmlFor="price" className="block mb-2">Price</label>
              <input
                type="text"
                id="price"
                name="price"
                placeholder="Guitar Price"
                value={formData.price}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">Enter a valid positive price</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="image" className="block mb-2">Guitar Image</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageUpload}
                className={`w-full px-3 py-2 border rounded ${errors.image ? 'border-red-500' : 'border-gray-300'}`}
            />
            {!imageSelected && errors.image && (
                <p className="text-red-500 text-sm mt-1">Please select an image for the guitar</p>
            )}
            {imageSelected && imageError && (
                <p className="text-red-500 text-sm mt-1">Please upload a valid image (max 5MB)</p>
            )}

              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Image Preview:</h4>
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

            <button type="submit" className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors">
              Add Guitar
            </button>
          </form>
          
          {/* Display added guitars*/}
          {guitars.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Recently Added Guitars</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guitars.map((guitar) => (
                      <tr key={guitar.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{guitar.model}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guitar.brand?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guitar.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${guitar.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {guitar.imageUrl && (
                            <div className="relative w-12 h-12 rounded overflow-hidden">
                              <Image
                                src={guitar.imageUrl}
                                alt={guitar.model}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
    </ProtectedPage>
  );
}