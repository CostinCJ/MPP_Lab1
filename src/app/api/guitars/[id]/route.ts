// src/app/api/guitars/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getGuitarById as getGuitarByIdFromService,
  updateGuitar as updateGuitarFromService,
  deleteGuitar as deleteGuitarFromService,
  getGuitars as getAllGuitarsFromService
} from '@/lib/services/GuitarService';
import { getInitializedDataSource } from '@/lib/database/data-source';

// GET handler - retrieve a specific guitar by ID
export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  let id: string | undefined;
  try {
    await getInitializedDataSource(); // Initialize data source
    const resolvedParams = await paramsPromise;
    id = resolvedParams.id;
    const guitarId = parseInt(id); // Convert id to number

    if (isNaN(guitarId)) {
        return NextResponse.json(
            { error: 'Invalid guitar ID' },
            { status: 400 }
        );
    }

    // Get the guitar by ID from the database service
    const guitar = await getGuitarByIdFromService(guitarId);

    if (!guitar) {
      return NextResponse.json(
        { error: 'Guitar not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(guitar);
  } catch (error) {
    console.error(`Error in GET /api/guitars/${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve guitar' },
      { status: 500 }
    );
  }
}

// PATCH - update a specific guitar
export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    let id: string | undefined;
    try {
      await getInitializedDataSource(); // Initialize data source
      const resolvedParams = await paramsPromise;
      id = resolvedParams.id;
      const guitarId = parseInt(id); // Convert id to number
      const updates = await request.json();

      if (isNaN(guitarId)) {
          return NextResponse.json(
              { error: 'Invalid guitar ID' },
              { status: 400 }
          );
      }

      // Check if the guitar exists using the database service
      const existingGuitar = await getGuitarByIdFromService(guitarId);

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

      // Validate fields if they are being updated (adjust based on new Guitar entity)
      if (updates.price !== undefined) {
        const price = parseFloat(updates.price);
        if (isNaN(price) || price <= 0) {
          return NextResponse.json(
            { error: 'Price must be a positive number' },
            { status: 400 }
          );
        }
        updates.price = price; // Convert price to number
      }

      if (updates.strings !== undefined) {
          const strings = parseInt(updates.strings);
          if (isNaN(strings) || strings <= 0) {
              return NextResponse.json(
                  { error: 'Strings must be a positive number' },
                  { status: 400 }
              );
          }
          updates.strings = strings; // Convert strings to number
      }


      // Check for potential duplicate if model or brandName is being updated
      if (updates.model || updates.brandName) {
        const modelToCheck = updates.model || existingGuitar.model;
        const brandNameToCheck = updates.brandName || existingGuitar.brand.name; // Access brand name from relation

        // Fetch all guitars from the database service to check for duplicates
        const allGuitars = await getAllGuitarsFromService();
        const isDuplicate = allGuitars.some(guitar =>
          guitar.id !== guitarId && // Compare with numeric ID
          guitar.model.toLowerCase() === modelToCheck.toLowerCase() &&
          guitar.brand.name.toLowerCase() === brandNameToCheck.toLowerCase() // Compare brand name
        );

        if (isDuplicate) {
          return NextResponse.json(
            { error: 'A guitar with this model and manufacturer already exists' },
            { status: 409 }
          );
        }
      }

      // Update the guitar using the database service
      const updatedGuitar = await updateGuitarFromService(guitarId, updates);

      if (!updatedGuitar) {
           return NextResponse.json(
            { error: 'Failed to update guitar' },
            { status: 500 }
          );
      }

      return NextResponse.json(updatedGuitar);
    } catch (error) {
      console.error(`Error in PATCH /api/guitars/${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to update guitar' },
        { status: 500 }
      );
    }
}

// DELETE - remove a specific guitar
export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    let id: string | undefined;
    try {
      await getInitializedDataSource(); // Initialize data source
      const resolvedParams = await paramsPromise;
      id = resolvedParams.id;
      const guitarId = parseInt(id); // Convert id to number

      if (isNaN(guitarId)) {
          return NextResponse.json(
              { error: 'Invalid guitar ID' },
              { status: 400 }
          );
      }

      // Check if the guitar exists before attempting to delete using the database service
      const existingGuitar = await getGuitarByIdFromService(guitarId);

      if (!existingGuitar) {
        return NextResponse.json(
          { error: 'Guitar not found' },
          { status: 404 }
        );
      }

      // Delete the guitar using the database service
      const deleted = await deleteGuitarFromService(guitarId);

      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete guitar' },
          { status: 500 }
        );
      }

      // Return no content for successful deletion
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error(`Error in DELETE /api/guitars/${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to delete guitar' },
        { status: 500 }
      );
    }
}