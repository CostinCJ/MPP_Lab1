import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllGuitars,
  createGuitar, 
  getFilteredAndSortedGuitars 
} from '@/app/lib/guitar-service';

// GET handler - retrieve all guitars with optional filtering, sorting, and pagination
export async function GET(request: NextRequest) {
    try {
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
      const sortField = searchParams.get('sortField') || 'name';
      const sortDirection = (searchParams.get('sortDirection') || 'asc') as 'asc' | 'desc';
      
      // Build filter object
      const filters: Record<string, string[] | number | string> = {};
      
      if (type.length > 0) filters.type = type;
      if (manufacturer.length > 0) filters.manufacturer = manufacturer;
      if (condition.length > 0) filters.condition = condition;
      if (strings.length > 0) filters.strings = strings;
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (search) filters.search = search;
      
      // Build sort object
      const sort = { field: sortField, direction: sortDirection };
      
      // Get filtered and sorted guitars
      const allGuitars = await getFilteredAndSortedGuitars(
        Object.keys(filters).length > 0 ? filters : undefined,
        sort
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

// POST handler - create a new guitar
export async function POST(request: NextRequest) {
    try {
      const guitarData = await request.json();
      
      // Validate required fields
      const requiredFields = ['name', 'manufacturer', 'type', 'strings', 'condition', 'price'];
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
      
      // Check for duplicate based on name and manufacturer
      const existingGuitars = await getAllGuitars();
      const isDuplicate = existingGuitars.some(
        guitar => 
          guitar.name.toLowerCase() === guitarData.name.toLowerCase() && 
          guitar.manufacturer.toLowerCase() === guitarData.manufacturer.toLowerCase()
      );
      
      if (isDuplicate) {
        return NextResponse.json(
          { error: 'A guitar with this name and manufacturer already exists' },
          { status: 409 }
        );
      }
      
      // Create the new guitar
      const newGuitar = await createGuitar(guitarData);
      
      return NextResponse.json(newGuitar, { status: 201 });
    } catch (error) {
      console.error('Error in POST /api/guitars:', error);
      return NextResponse.json(
        { error: 'Failed to create guitar' },
        { status: 500 }
      );
    }
}


