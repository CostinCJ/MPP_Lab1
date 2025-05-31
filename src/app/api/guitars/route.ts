import { NextRequest, NextResponse } from 'next/server';
import { getGuitars } from '../../../lib/services/GuitarService';
import { createGuitar } from '../../../lib/services/GuitarService';
import { getInitializedDataSource } from '@/lib/database/data-source'; 
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - retrieve all guitars with optional filtering, sorting, and pagination
export async function GET(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ data: [], meta: { totalGuitars: 0, totalPages: 0, page: 1, limit: 10 } }, { status: 200 }); // Or 401
      }
      const userId = session.user.id;

      await getInitializedDataSource(); // Ensure data source is initialized
      const { searchParams } = new URL(request.url);

      // Extract pagination parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        return NextResponse.json(
          { error: 'Page must be a positive number' },
          { status: 400 }
        );
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return NextResponse.json(
          { error: 'Limit must be between 1 and 100' },
          { status: 400 }
        );
      }

      // Extract filter parameters
      const type = searchParams.getAll('type');
      const manufacturer = searchParams.getAll('manufacturer');
      const condition = searchParams.getAll('condition');
      const strings = searchParams.getAll('strings');
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const search = searchParams.get('search');

      // Extract sort parameters
      const sortField = searchParams.get('sortField') || 'model'; // Default sort field to 'model'
      const sortDirection = (searchParams.get('sortDirection') || 'asc') as 'asc' | 'desc';

      // Build filter object for the database service
      const filters: {
        type?: string[];
        brandName?: string[];
        condition?: string[];
        strings?: number[];
        minPrice?: number;
        maxPrice?: number;
        search?: string; // Change type to string
        userId?: string; // Add userId to filters
      } = {}; // Define a specific type for filters

      filters.userId = userId; // Always filter by the logged-in user's ID

      if (type.length > 0) filters.type = type;
      if (manufacturer.length > 0) filters.brandName = manufacturer; // Map manufacturer to brandName
      if (condition.length > 0) filters.condition = condition;
      if (strings.length > 0) filters.strings = strings.map(s => parseInt(s)); // Convert strings to numbers
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (search) filters.search = search; // Pass the raw search string

      // Build sort object for the database service
      const sort: Record<string, 'ASC' | 'DESC'> = {}; // Use a specific type for sort

      if (sortField === 'price') {
          sort.price = sortDirection.toUpperCase() as 'ASC' | 'DESC'; // Sort by price
      } else if (sortField === 'manufacturer') {
          sort.brandName = sortDirection.toUpperCase() as 'ASC' | 'DESC'; // Sort by brand name
      } else {
          sort[sortField] = sortDirection.toUpperCase() as 'ASC' | 'DESC'; // Sort by other fields
      }


      console.log('Filters being passed to getFilteredAndSortedGuitars:', filters); // Added logging
      // Get filtered and sorted guitars from the database
      const allGuitars = await getGuitars(
        Object.keys(filters).length > 0 ? filters : undefined, // Pass the filters object directly
        Object.keys(sort).length > 0 ? sort : undefined
      );

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedGuitars = allGuitars.slice(startIndex, endIndex);

      // Prepare pagination metadata
      const totalGuitars = allGuitars.length;
      const totalPages = Math.ceil(totalGuitars / limit);

      // Return response with pagination metadata
      return NextResponse.json({
        data: paginatedGuitars,
        meta: {
          page,
          limit,
          totalGuitars,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error in GET /api/guitars:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve guitars' },
        { status: 500 }
      );
    }
}

// POST - create a new guitar
export async function POST(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const userId = session.user.id;

      await getInitializedDataSource(); // Ensure data source is initialized
      const guitarData = await request.json();

      // Validate required fields (adjust based on new Guitar entity)
      const requiredFields = ['model', 'brandName', 'type', 'strings', 'condition', 'price'];
      const missingFields = requiredFields.filter(field => !guitarData[field]);

      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields: ${missingFields.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate price is a positive number
      const price = parseFloat(guitarData.price);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number' },
          { status: 400 }
        );
      }

      // Create the new guitar using the database service
      const newGuitar = await createGuitar({
          model: guitarData.model,
          brandName: guitarData.brandName,
          type: guitarData.type,
          strings: parseInt(guitarData.strings), // Ensure strings is a number
          condition: guitarData.condition,
          price: price, // Use the validated price number
          imageUrl: guitarData.imageUrl, // Include imageUrl
          userId: userId // Associate with the logged-in user
      });

      return NextResponse.json(newGuitar, { status: 201 });
    } catch (error: unknown) {
      console.error('Error in POST /api/guitars:', error);
      if (error instanceof Error && error.message && error.message.toLowerCase().includes('already exist')) {
        return NextResponse.json(
          { error: error.message }, // Use the error message from the service
          { status: 409 } // Conflict
        );
      }
      return NextResponse.json(
        { error: 'Failed to create guitar' },
        { status: 500 }
      );
    }
}
