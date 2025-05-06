import { GET, POST } from './route';
import * as guitarService from '@/app/lib/guitar-service';

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
jest.mock('@/app/lib/guitar-service');

describe('Guitars Collection API Route Handlers', () => {
  let mockRequest;
  
  const mockGuitars = [
    {
      id: 'guitar-1',
      name: 'Stratocaster',
      manufacturer: 'Fender',
      type: 'Electric',
      strings: '6',
      condition: 'New',
      price: '1200',
      imageUrl: '/images/strat.jpg'
    },
    {
      id: 'guitar-2',
      name: 'Les Paul',
      manufacturer: 'Gibson',
      type: 'Electric',
      strings: '6',
      condition: 'Used',
      price: '2500',
      imageUrl: '/images/lespaul.jpg'
    },
    {
      id: 'guitar-3',
      name: 'Telecaster',
      manufacturer: 'Fender',
      type: 'Electric',
      strings: '6',
      condition: 'Vintage',
      price: '3000',
      imageUrl: '/images/tele.jpg'
    }
  ];
  
  const newGuitarData = {
    name: 'New Guitar',
    manufacturer: 'Test Brand',
    type: 'Electric',
    strings: '6',
    condition: 'New',
    price: '800',
    imageUrl: '/images/new.jpg'
  };

  const createdGuitar = {
    ...newGuitarData,
    id: 'new-guitar-id'
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
      guitarService.getFilteredAndSortedGuitars.mockResolvedValue(mockGuitars);
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getFilteredAndSortedGuitars).toHaveBeenCalledWith(undefined, { field: 'name', direction: 'asc' });
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
      guitarService.getFilteredAndSortedGuitars.mockResolvedValue(filteredGuitars);
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getFilteredAndSortedGuitars).toHaveBeenCalledWith(
        { 
          manufacturer: ['Fender'],
          minPrice: 1000
        },
        { field: 'name', direction: 'asc' }
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
      
      guitarService.getFilteredAndSortedGuitars.mockResolvedValue(sortedGuitars);
      
      // Execute the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getFilteredAndSortedGuitars).toHaveBeenCalledWith(
        undefined,
        { field: 'price', direction: 'desc' }
      );
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(sortedGuitars);
    });

    it('should handle pagination correctly', async () => {
      // Create a larger mock dataset for pagination
      const paginatedGuitars = Array(25).fill(null).map((_, i) => ({
        ...mockGuitars[0],
        id: `guitar-${i+1}`,
        name: `Guitar ${i+1}`
      }));
      
      // Set up request with pagination params
      mockRequest.url = 'http://localhost:3000/api/guitars?page=2&limit=5';
      
      guitarService.getFilteredAndSortedGuitars.mockResolvedValue(paginatedGuitars);
      
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
      guitarService.getFilteredAndSortedGuitars.mockRejectedValue(
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
      guitarService.getAllGuitars.mockResolvedValue([]);
      guitarService.createGuitar.mockResolvedValue(createdGuitar);
      
      // Execute the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getAllGuitars).toHaveBeenCalled();
      expect(guitarService.createGuitar).toHaveBeenCalledWith(newGuitarData);
      expect(response.status).toBe(201);
      expect(responseData).toEqual(createdGuitar);
    });

    it('should return 400 when required fields are missing', async () => {
      // Set up request with missing fields
      const incompleteData = { name: 'Incomplete Guitar', manufacturer: 'Test' };
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
      // Set up request with invalid price
      const invalidPriceData = { ...newGuitarData, price: '-100' };
      mockRequest.json.mockResolvedValue(invalidPriceData);
      
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
      const existingGuitars = [
        {
          id: 'existing-id',
          name: newGuitarData.name,
          manufacturer: newGuitarData.manufacturer,
          type: 'Electric',
          strings: '6',
          condition: 'New',
          price: '800'
        }
      ];
      
      guitarService.getAllGuitars.mockResolvedValue(existingGuitars);
      
      // Execute the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.createGuitar).not.toHaveBeenCalled();
      expect(response.status).toBe(409);
      expect(responseData).toEqual({ 
        error: 'A guitar with this name and manufacturer already exists' 
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      guitarService.getAllGuitars.mockResolvedValue([]);
      guitarService.createGuitar.mockRejectedValue(
        new Error('Database error')
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