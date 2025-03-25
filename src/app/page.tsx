import Image from "next/image";
import Link from "next/link";

export default function Home() {
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

      {/* Main Content with light background */}
      <main className="flex-grow flex flex-col items-center px-4 bg-white">
        {/* Header Section */}
        <div className="text-center my-22">
          <h1 className="text-5xl font-bold mb-2 text-black">StringTracker</h1>
          <h2 className="text-xl text-gray-800">Guitar Inventory System</h2>
        </div>

        {/* Hero Image */}
        <div className="w-full max-w-3xl mb-12">
          <Image 
            src="/guitar-collection.png" 
            alt="Guitar Collection"
            width={1200}
            height={600}
            className="rounded-lg shadow-md w-full"
            priority
          />
        </div>

        {/* Features Section */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 my-5">
          {/* Feature 1 */}
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">StringTraker</h3>
            <p className="text-center text-gray-600 text-sm">
              A tool for small music shops or guitar dealers to track their inventory, including details on each guitar and pricing information.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Track Your Collection</h3>
            <p className="text-center text-gray-600 text-sm">
              Keep detailed records of every guitar including brand, model, serial number, and purchase date. Never lose track of your growing inventory again.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Photo Documentation</h3>
            <p className="text-center text-gray-600 text-sm">
              Upload high-quality images of each instrument from multiple angles. Document unique features, modifications, and any cosmetic details important to collectors.
            </p>
          </div>
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