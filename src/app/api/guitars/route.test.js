import { GET, POST } from './route';
import * as guitarService from '@/lib/services/GuitarService'; // Corrected import path

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => {
      return {
        status: options?.status || 200,
        json: async () => data
      };
    }),
    error: jest.fn(),
  }
}));

// Mock the guitar service module
jest.mock('@/lib/services/GuitarService'); // Corrected mock path

// Mock the data source
jest.mock('@/lib/database/data-source', () => ({
  getInitializedDataSource: jest.fn().mockResolvedValue(undefined),
}));

describe('Guitars Collection API Route Handlers', () => {
  let mockRequest;
  
  const mockGuitars = [
    {
      id: 'guitar-1',
      model: 'Stratocaster',
      brand: { name: 'Fender' }, // Align with entity structure
      type: 'Electric',
      strings: 6, // Align with entity type
      condition: 'New',
      price: 1200, // Align with entity type
      imageUrl: '/images/strat.jpg'
    },
    {
      id: 'guitar-2',
      model: 'Les Paul',
      brand: { name: 'Gibson' },
      type: 'Electric',
      strings: 6,
      condition: 'Used',
      price: 2500,
      imageUrl: '/images/lespaul.jpg'
    },
    {
      id: 'guitar-3',
      model: 'Telecaster',
      brand: { name: 'Fender' },
      type: 'Electric',
      strings: 6,
      condition: 'Vintage',
      price: 3000,
      imageUrl: '/images/tele.jpg'
    }
  ];
  
  // For POST, the API expects a flat structure, service handles brand relation
  const newGuitarData = {
    model: 'New Model',
    brandName: 'Test Brand', // API expects brandName for creation
    type: 'Electric',
    strings: 6, // API might expect string, service converts
    condition: 'New',
    price: 800, // API might expect string, service converts
    imageUrl: '/images/new.jpg'
  };

  // The created guitar returned by the service/API should be entity-like
  const createdGuitar = {
    id: 'new-guitar-id',
    model: 'New Model',
    brand: { name: 'Test Brand' }, // Align with entity structure
    type: 'Electric',
    strings: 6,
    condition: 'New',
    price: 800,
    imageUrl: '/images/new.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create a fresh mock request with URL and search params for each test
    mockRequest = {
      url: 'http://localhost:3000/api/guitars',
      json: jest.fn()
    };
  });

  describe('GET handler', () => {
    it('should return all guitars with default pagination', async () => {
      // Mock implementation
      guitarService.getGuitars.mockResolvedValue(mockGuitars); // Changed to getGuitars
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      // The route itself applies default sort if not provided, so getGuitars might be called with undefined sort initially
      // The route default sort is { model: 'ASC' }
      expect(guitarService.getGuitars).toHaveBeenCalledWith(undefined, {"model": "ASC"});
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockGuitars.slice(0, 10)); // Default limit is 10
      expect(responseData.meta).toEqual({
        page: 1,
        limit: 10,
        totalGuitars: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    });

    it('should apply filter parameters correctly', async () => {
      // Set up request with search params
      mockRequest.url = 'http://localhost:3000/api/guitars?manufacturer=Fender&minPrice=1000';
      
      // Mock filtered results
      const filteredGuitars = [mockGuitars[0], mockGuitars[2]]; // Only Fender guitars
      guitarService.getGuitars.mockResolvedValue(filteredGuitars); // Changed to getGuitars
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getGuitars).toHaveBeenCalledWith( // Changed to getGuitars
        {
          brandName: ['Fender'], // Changed manufacturer to brandName
          minPrice: 1000
        },
        { "model": "ASC" } // Default sort
      );
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(filteredGuitars);
      expect(responseData.meta.totalGuitars).toBe(2);
    });

    it('should handle sorting parameters correctly', async () => {
      // Set up request with sort params
      mockRequest.url = 'http://localhost:3000/api/guitars?sortField=price&sortDirection=desc';
      
      // Mock sorted results
      const sortedGuitars = [...mockGuitars].sort((a, b) => 
        parseInt(b.price) - parseInt(a.price)
      );
      
      guitarService.getGuitars.mockResolvedValue(sortedGuitars); // Changed to getGuitars
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getGuitars).toHaveBeenCalledWith( // Changed to getGuitars
        undefined,
        { price: 'DESC' } // Sort object structure from route
      );
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(sortedGuitars);
    });

    it('should handle pagination correctly', async () => {
      // Create a larger mock dataset for pagination
      const paginatedGuitars = Array(25).fill(null).map((_, i) => ({
        id: `guitar-${i+1}`,
        model: `Model ${i+1}`, // Use model
        brand: { name: 'Fender' }, // Add brand object
        type: 'Electric',
        strings: 6,
        condition: 'New',
        price: 1200 + i,
        imageUrl: `/images/strat-${i+1}.jpg`
      }));
      
      // Set up request with pagination params
      mockRequest.url = 'http://localhost:3000/api/guitars?page=2&limit=5';
      
      // Use mockImplementation with a deep clone to ensure data integrity
      guitarService.getGuitars.mockImplementation(async () => JSON.parse(JSON.stringify(paginatedGuitars)));
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(paginatedGuitars.slice(5, 10)); // Page 2 with limit 5
      expect(responseData.meta).toEqual({
        page: 2,
        limit: 5,
        totalGuitars: 25,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true
      });
    });

    it('should return 400 for invalid page parameter', async () => {
      mockRequest.url = 'http://localhost:3000/api/guitars?page=invalid';
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Page must be a positive number' });
    });

    it('should return 400 for invalid limit parameter', async () => {
      mockRequest.url = 'http://localhost:3000/api/guitars?limit=200';
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Limit must be between 1 and 100' });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      guitarService.getGuitars.mockRejectedValueOnce( // Use mockRejectedValueOnce for specificity
        new Error('Database error')
      );
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to retrieve guitars' });
    });
  });

  describe('POST handler', () => {
    beforeEach(() => {
      mockRequest.json.mockResolvedValue(newGuitarData);
    });

    it('should create a new guitar with valid data', async () => {
      // Mock implementations
      // guitarService.getAllGuitars.mockResolvedValue([]); // This is not called in the current POST route logic before createGuitar
      guitarService.createGuitar.mockResolvedValue(createdGuitar);
      
      // Execute the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      // expect(guitarService.getAllGuitars).toHaveBeenCalled(); // Removed this expectation
      expect(guitarService.createGuitar).toHaveBeenCalledWith(newGuitarData);
      expect(response.status).toBe(201);
      expect(responseData).toEqual(createdGuitar);
    });

    it('should return 400 when required fields are missing', async () => {
      // Set up request with missing fields
      const incompleteData = { model: 'Incomplete Guitar' /* missing brandName, type etc. */ };
      mockRequest.json.mockResolvedValue(incompleteData);
      
      // Execute the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.createGuitar).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Missing required fields');
    });

    it('should return 400 when price is invalid', async () => {
      // Set up request with invalid price, ensuring all other fields are valid and present
      const invalidPriceData = {
        model: 'Test Model Price', // Required
        brandName: 'Test Brand Price', // Required by API for creation
        type: 'Electric', // Required
        strings: '6', // Required
        condition: 'New', // Required
        price: '-100', // Invalid price
        imageUrl: '/images/new-price-test.jpg'
      };
      // Explicitly set the mock for this test case to ensure it overrides beforeEach
      mockRequest.json = jest.fn().mockResolvedValue(invalidPriceData);
      
      // Execute the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.createGuitar).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Price must be a positive number' });
    });

    it('should return 409 when guitar already exists', async () => {
      // Set up scenario where guitar already exists
      // The route's POST handler now relies on createGuitar to throw an error for duplicates.
      mockRequest.json = jest.fn().mockResolvedValue(newGuitarData); // Ensure correct payload for this test
      guitarService.createGuitar.mockRejectedValue(new Error('A guitar with this name and manufacturer already exists'));
      
      // Execute the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.createGuitar).toHaveBeenCalledWith(newGuitarData); // It will be called
      expect(response.status).toBe(409); // Status code from the route's error handling
      expect(responseData).toEqual({ 
        error: 'A guitar with this name and manufacturer already exists' 
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      // guitarService.getAllGuitars.mockResolvedValue([]); // Not relevant for this error path
      mockRequest.json = jest.fn().mockResolvedValue(newGuitarData); // Ensure correct payload for this test
      guitarService.createGuitar.mockRejectedValue(
        new Error('Database error') // Generic error
      );
      
      // Execute the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to create guitar' });
    });
  });
});