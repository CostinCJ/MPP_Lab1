import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';
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

describe('Guitar API Route Handlers', () => {
  const mockRequest = {
    json: jest.fn(),
  } as unknown as NextRequest;
  
  const mockParams = {
    params: {
      id: 'test-guitar-id'
    }
  };

  const mockGuitar = {
    id: 'test-guitar-id',
    name: 'Test Guitar',
    manufacturer: 'Test Manufacturer',
    type: 'Electric',
    strings: '6',
    condition: 'New',
    price: '500',
    imageUrl: '/test-guitar.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('GET handler', () => {
    it('should return a guitar when it exists', async () => {
      // Mock implementation
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      
      // Execute the handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getGuitarById).toHaveBeenCalledWith('test-guitar-id');
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockGuitar);
    });

    it('should return 404 when guitar is not found', async () => {
      // Mock implementation - guitar not found
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(null);
      
      // Execute the handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getGuitarById).toHaveBeenCalledWith('test-guitar-id');
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Guitar not found' });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      (guitarService.getGuitarById as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Execute the handler
      const response = await GET(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
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
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      (guitarService.getAllGuitars as jest.Mock).mockResolvedValue([mockGuitar]);
      (guitarService.updateGuitar as jest.Mock).mockResolvedValue(updatedGuitar);
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getGuitarById).toHaveBeenCalledWith('test-guitar-id');
      expect(guitarService.updateGuitar).toHaveBeenCalledWith('test-guitar-id', updates);
      expect(response.status).toBe(200);
      expect(responseData).toEqual(updatedGuitar);
    });

    it('should return 404 when guitar to update is not found', async () => {
      // Mock implementation - guitar not found
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(null);
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getGuitarById).toHaveBeenCalledWith('test-guitar-id');
      expect(guitarService.updateGuitar).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Guitar not found' });
    });

    it('should return 400 when no updates are provided', async () => {
      // Mock empty updates
      (mockRequest.json as jest.Mock).mockResolvedValue({});
      
      // Mock implementation
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'No updates provided' });
    });

    it('should return 400 when price is invalid', async () => {
      // Mock invalid price update
      (mockRequest.json as jest.Mock).mockResolvedValue({ price: '-50' });
      
      // Mock implementation
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Price must be a positive number' });
    });

    it('should return 409 when there is a duplicate name and manufacturer', async () => {
      const updates = { name: 'Duplicate Guitar' };
      (mockRequest.json as jest.Mock).mockResolvedValue(updates);
      
      const existingGuitars = [
        mockGuitar,
        {
          id: 'different-id',
          name: 'Duplicate Guitar',
          manufacturer: 'Test Manufacturer',
          type: 'Electric',
          strings: '6',
          condition: 'Used',
          price: '300'
        }
      ];
      
      // Mock implementation
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      (guitarService.getAllGuitars as jest.Mock).mockResolvedValue(existingGuitars);
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(409);
      expect(responseData).toEqual({ error: 'A guitar with this name and manufacturer already exists' });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      (guitarService.getAllGuitars as jest.Mock).mockResolvedValue([mockGuitar]);
      (guitarService.updateGuitar as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Execute the handler
      const response = await PATCH(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to update guitar' });
    });
  });

  describe('DELETE handler', () => {
    it('should delete a guitar when it exists', async () => {
      // Mock implementation
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      (guitarService.deleteGuitar as jest.Mock).mockResolvedValue(true);
      
      // Execute the handler
      const response = await DELETE(mockRequest, mockParams);
      
      // Assertions
      expect(guitarService.getGuitarById).toHaveBeenCalledWith('test-guitar-id');
      expect(guitarService.deleteGuitar).toHaveBeenCalledWith('test-guitar-id');
      expect(response.status).toBe(500);
    });

    it('should return 404 when guitar to delete is not found', async () => {
      // Mock implementation - guitar not found
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(null);
      
      // Execute the handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.getGuitarById).toHaveBeenCalledWith('test-guitar-id');
      expect(guitarService.deleteGuitar).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Guitar not found' });
    });

    it('should return 500 when deletion fails', async () => {
      // Mock implementation - deletion fails
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      (guitarService.deleteGuitar as jest.Mock).mockResolvedValue(false);
      
      // Execute the handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(guitarService.deleteGuitar).toHaveBeenCalledWith('test-guitar-id');
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to delete guitar' });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock implementation - service throws error
      (guitarService.getGuitarById as jest.Mock).mockResolvedValue(mockGuitar);
      (guitarService.deleteGuitar as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Execute the handler
      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to delete guitar' });
    });
  });
});