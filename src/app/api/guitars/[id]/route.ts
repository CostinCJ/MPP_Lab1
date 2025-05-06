// src/app/api/guitars/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGuitarById, updateGuitar, deleteGuitar, getAllGuitars } from '@/app/lib/guitar-service';

interface Params {
  params: {
    id: string;
  };
}

// GET handler - retrieve a specific guitar by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // Get the guitar by ID
    const guitar = await getGuitarById(id);
    
    if (!guitar) {
      return NextResponse.json(
        { error: 'Guitar not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(guitar);
  } catch (error) {
    console.error(`Error in GET /api/guitars/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve guitar' },
      { status: 500 }
    );
  }
}

// PATCH - update a specific guitar
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
      const { id } = params;
      const updates = await request.json();
      
      // Check if the guitar exists
      const existingGuitar = await getGuitarById(id);
      
      if (!existingGuitar) {
        return NextResponse.json(
          { error: 'Guitar not found' },
          { status: 404 }
        );
      }
      
      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: 'No updates provided' },
          { status: 400 }
        );
      }
      
      // Validate fields if they are being updated
      if (updates.price !== undefined) {
        const price = parseFloat(updates.price);
        if (isNaN(price) || price <= 0) {
          return NextResponse.json(
            { error: 'Price must be a positive number' },
            { status: 400 }
          );
        }
      }
      
      // Check for potential duplicate if name or manufacturer is being updated
      if (updates.name || updates.manufacturer) {
        const nameToCheck = updates.name || existingGuitar.name;
        const manufacturerToCheck = updates.manufacturer || existingGuitar.manufacturer;
        
        const allGuitars = await getAllGuitars();
        const isDuplicate = allGuitars.some(guitar => 
          guitar.id !== id && 
          guitar.name.toLowerCase() === nameToCheck.toLowerCase() && 
          guitar.manufacturer.toLowerCase() === manufacturerToCheck.toLowerCase()
        );
        
        if (isDuplicate) {
          return NextResponse.json(
            { error: 'A guitar with this name and manufacturer already exists' },
            { status: 409 }
          );
        }
      }
      
      // Update the guitar
      const updatedGuitar = await updateGuitar(id, updates);
      
      return NextResponse.json(updatedGuitar);
    } catch (error) {
      console.error(`Error in PATCH /api/guitars/${params.id}:`, error);
      return NextResponse.json(
        { error: 'Failed to update guitar' },
        { status: 500 }
      );
    }
}

// DELETE - remove a specific guitar
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
      const { id } = params;
      
      // Check if the guitar exists before attempting to delete
      const existingGuitar = await getGuitarById(id);
      
      if (!existingGuitar) {
        return NextResponse.json(
          { error: 'Guitar not found' },
          { status: 404 }
        );
      }
      
      // Delete the guitar
      const deleted = await deleteGuitar(id);
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete guitar' },
          { status: 500 }
        );
      }
      
      // Return no content for successful deletion
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error(`Error in DELETE /api/guitars/${params.id}:`, error);
      return NextResponse.json(
        { error: 'Failed to delete guitar' },
        { status: 500 }
      );
    }
}