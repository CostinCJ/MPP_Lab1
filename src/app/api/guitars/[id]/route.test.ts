import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Define mock functions for the service methods
const mockGetGuitarById = jest.fn();
const mockGetAllGuitars = jest.fn();
const mockUpdateGuitar = jest.fn();
const mockDeleteGuitar = jest.fn();

// Mock next/server
jest.mock('next/server', () => {
  // Define an interface for the mock constructor that includes the static json method
  interface MockNextResponse extends jest.Mock {
    json: jest.Mock;
  }

  // Mock for the NextResponse constructor `new NextResponse()`
  const MockNextResponseConstructor = jest.fn((body, init) => {
    const status = init?.status || 200;
    // This is an instance of NextResponse
    return {
      status: status,
      ok: status >= 200 && status < 300,
      headers: new Map(init?.headers), // Preserve headers
      json: async () => { // Method on the instance
        if (body === null && status === 204) return Promise.resolve(null); // Handle 204 specifically
        if (typeof body === 'object') return Promise.resolve(body);
        // Attempt to parse if it looks like a JSON string, otherwise return as is
        if (typeof body === 'string') {
          try {
            return Promise.resolve(JSON.parse(body));
          } catch { /* ignore if not parsable JSON */ }
        }
        return Promise.resolve(body);
      },
      text: async () => Promise.resolve(String(body)),
    };
  }) as unknown as MockNextResponse;

  // Attach static .json method to the mock constructor
  MockNextResponseConstructor.json = jest.fn((data, options) => {
    // This is the object returned by NextResponse.json()
    return {
      status: options?.status || 200,
      ok: (options?.status || 200) >= 200 && (options?.status || 200) < 300,
      headers: new Map(options?.headers), // Preserve headers
      json: async () => Promise.resolve(data), // Method on the object returned by static .json()
      text: async () => Promise.resolve(JSON.stringify(data)),
    };
  });

  return {
    NextRequest: jest.fn(), // Simple mock for NextRequest constructor
    NextResponse: MockNextResponseConstructor, // NextResponse is now a mock constructor with a static .json
  };
});

// Mock the guitar service module using a factory
jest.mock('@/lib/services/GuitarService', () => {
  // This factory function is hoisted.
  // The mockGetGuitarById etc. are not initialized at the point the factory is defined.
  // So, we return functions that will call the (later initialized) mocks.
  interface UpdateGuitarDataForMock {
    model?: string;
    year?: number;
    brandName?: string;
    type?: string;
    strings?: number;
    condition?: string;
    price?: number;
    imageUrl?: string;
  }
  return {
    __esModule: true,
    getGuitarById: (id: number) => mockGetGuitarById(id),
    getGuitars: () => mockGetAllGuitars(), // Corrected key to match exported name from service
    updateGuitar: (id: number, data: UpdateGuitarDataForMock) => mockUpdateGuitar(id, data),
    deleteGuitar: (id: number) => mockDeleteGuitar(id),
  };
});

describe('Guitar API Route Handlers', () => {
  const mockRequest = {
    json: jest.fn(),
  } as unknown as NextRequest;
  
  const mockParams = {
    params: {
      id: '1'
    }
  };

  const mockGuitar = {
    id: 1,
    model: 'Test Guitar',
    manufacturer: 'Test Manufacturer',
    type: 'Electric',
    strings: '6',
    condition: 'New',
    price: '500',
    imageUrl: '/test-guitar.jpg'
  };

  beforeEach(() => {
    // Clear all mock instances and their implementations
    mockGetGuitarById.mockReset();
    mockGetAllGuitars.mockReset();
    mockUpdateGuitar.mockReset();
    mockDeleteGuitar.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('GET handler', () => {
    it('should return a guitar when it exists', async () => {
      // Mock implementation
      mockGetGuitarById.mockResolvedValue(mockGuitar);
      
      // Execute the handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockGuitar);
    });

    it('should return 404 when guitar is not found', async () => {
      // Mock implementation - guitar not found
      mockGetGuitarById.mockResolvedValue(null);
      
      // Execute the handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Guitar not found' });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      mockGetGuitarById.mockRejectedValue(new Error('Test error'));
      
      // Execute the handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1); // Expect it to be called even if it throws
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to retrieve guitar' });
    });
  });

  describe('PATCH handler', () => {
    const updates = {
      name: 'Updated Guitar',
      price: '600'
    };

    beforeEach(() => {
      // Set up request mock
      (mockRequest.json as jest.Mock).mockResolvedValue(updates);
    });

    it('should update a guitar when it exists and updates are valid', async () => {
      const updatedGuitar = { ...mockGuitar, ...updates };
      
      // Mock implementation
      mockGetGuitarById.mockResolvedValue(mockGuitar);
      mockGetAllGuitars.mockResolvedValue([mockGuitar]);
      mockUpdateGuitar.mockResolvedValue(updatedGuitar);
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(mockUpdateGuitar).toHaveBeenCalledWith(1, updates);
      expect(response.status).toBe(200);
      expect(responseData).toEqual(updatedGuitar);
    });

    it('should return 404 when guitar to update is not found', async () => {
      // Mock implementation - guitar not found
      mockGetGuitarById.mockResolvedValue(null);
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(mockUpdateGuitar).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Guitar not found' });
    });

    it('should return 400 when no updates are provided', async () => {
      // Mock empty updates
      (mockRequest.json as jest.Mock).mockResolvedValue({});
      
      // Mock implementation
      mockGetGuitarById.mockResolvedValue(mockGuitar); // getGuitarById is still called before validation
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'No updates provided' });
    });

    it('should return 400 when price is invalid', async () => {
      // Mock invalid price update
      (mockRequest.json as jest.Mock).mockResolvedValue({ price: '-50' });
      
      // Mock implementation
      mockGetGuitarById.mockResolvedValue(mockGuitar); // getGuitarById is still called
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Price must be a positive number' });
    });

    it('should return 409 when there is a duplicate model and manufacturer', async () => {
      const updates = { model: 'Test Guitar' };
      (mockRequest.json as jest.Mock).mockResolvedValue(updates);
      
      const existingGuitars = [
        {
          id: 2,
          model: 'Test Guitar',
          manufacturer: 'Test Manufacturer',
          type: 'Acoustic',
          strings: '12',
          condition: 'Vintage',
          price: '1000',
          // Simulate the brand object as it would be in the service response
          brand: { id: 2, name: 'Test Manufacturer', description: '', logoUrl: '' }
        },
        // Add the guitar being updated to the list of all guitars, so it's found by getAllGuitars
        { ...mockGuitar, brand: { id: 1, name: 'Test Manufacturer', description: '', logoUrl: ''} }
      ];
      
      // Mock implementation
      // getGuitarById will return the guitar we are trying to patch (mockGuitar)
      mockGetGuitarById.mockResolvedValue({ ...mockGuitar, brand: { id: 1, name: 'Test Manufacturer', description: '', logoUrl: ''} });
      // getAllGuitars will return all guitars, including the one that would cause a duplicate
      mockGetAllGuitars.mockResolvedValue(existingGuitars);
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(mockGetAllGuitars).toHaveBeenCalled(); // Or more specific if needed
      expect(response.status).toBe(409);
      expect(responseData).toEqual({ error: 'A guitar with this model and manufacturer already exists' });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      mockGetGuitarById.mockResolvedValue(mockGuitar);
      mockGetAllGuitars.mockResolvedValue([mockGuitar]); // This might not be called if updateGuitar errors first
      mockUpdateGuitar.mockRejectedValue(new Error('Test error'));
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      // expect(mockGetAllGuitars).toHaveBeenCalled(); // Depending on route logic
      expect(mockUpdateGuitar).toHaveBeenCalledWith(1, updates);
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to update guitar' });
    });
  });

  describe('DELETE handler', () => {
    it('should delete a guitar when it exists', async () => {
      // Mock implementation
      mockGetGuitarById.mockResolvedValue(mockGuitar);
      mockDeleteGuitar.mockResolvedValue(true);
      
      // Execute the handler
      const response = await DELETE(mockRequest, mockParams);
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(mockDeleteGuitar).toHaveBeenCalledWith(1);
      expect(response.status).toBe(204);
    });

    it('should return 404 when guitar to delete is not found', async () => {
      // Mock implementation - guitar not found
      mockGetGuitarById.mockResolvedValue(null);
      
      // Execute the handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(mockDeleteGuitar).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Guitar not found' });
    });

    it('should return 500 when deletion fails', async () => {
      // Mock implementation - deletion fails
      mockGetGuitarById.mockResolvedValue(mockGuitar);
      mockDeleteGuitar.mockResolvedValue(false); // Service indicates deletion failed
      
      // Execute the handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(mockDeleteGuitar).toHaveBeenCalledWith(1);
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to delete guitar' });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      mockGetGuitarById.mockResolvedValue(mockGuitar); // This call succeeds
      mockDeleteGuitar.mockRejectedValue(new Error('Test error')); // This call fails
      
      // Execute the handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(mockGetGuitarById).toHaveBeenCalledWith(1);
      expect(mockDeleteGuitar).toHaveBeenCalledWith(1);
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to delete guitar' });
    });
  });
});