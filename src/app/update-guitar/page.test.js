/**
 * @jest-environment jsdom
 */

// Mock definitions need to go before imports
jest.mock('../context/GuitarContext', () => {
  return {
    useGuitars: () => ({
      guitars: [
        {
          id: 'fender_strat_1',
          name: 'Stratocaster', // Keep for now, or decide if model/brandName are sole identifiers
          model: 'Stratocaster',
          manufacturer: 'Fender', // Keep for now
          brandName: 'Fender',
          type: 'Electric',
          strings: '6',
          condition: 'New',
          price: '733',
          imageUrl: '/fenderStratocaster.jpg'
        }
      ],
      isLoading: false,
      error: null,
      updateGuitar: jest.fn().mockImplementation((id, updates) => {
        return Promise.resolve({
          id,
          name: 'Stratocaster',
          model: 'Stratocaster',
          manufacturer: 'Fender',
          brandName: 'Fender',
          type: 'Electric',
          strings: '6',
          condition: 'New',
          price: '733',
          ...updates
        });
      }),
      getFilteredGuitars: jest.fn().mockImplementation(async (filters) => {
        // Basic mock: return the sample guitar if search matches, or empty array
        if (filters && filters.search && 'stratocaster'.includes(filters.search.toLowerCase())) {
          return Promise.resolve([{
            id: 'fender_strat_1',
            name: 'Stratocaster',
            model: 'Stratocaster',
            manufacturer: 'Fender',
            brandName: 'Fender',
            type: 'Electric',
            strings: '6',
            condition: 'New',
            price: '733',
            imageUrl: '/fenderStratocaster.jpg'
          }]);
        }
        return Promise.resolve([]);
      })
    })
  };
});

// Mock Next.js components
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: (props) => {
      // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
      return <img {...props} data-testid="mock-image" />;
    },
  };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => {
    return <a href={href}>{children}</a>;
  },
}));

// Then imports
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpdateGuitar from './page';

describe('UpdateGuitar Component', () => {
  beforeEach(() => {
    render(<UpdateGuitar />);
  });

  test('renders the update guitar page with search field', () => {
    // Check heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Update Guitar');
    expect(screen.getByText('Edit guitar information')).toBeInTheDocument();
    
    // Check search field
    expect(screen.getByLabelText(/Enter Guitar Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name or manufacturer/i)).toBeInTheDocument();
  });

  test('handles search input changes', () => {
    const searchInput = screen.getByPlaceholderText(/Search by name or manufacturer/i);
    
    // Enter text in search field
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');
  });

  test('displays the clear search button when text is entered', () => {
    const searchInput = screen.getByPlaceholderText(/Search by name or manufacturer/i);
    
    // Enter text in search field
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Clear button should be visible
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
    
    // Click the clear button
    fireEvent.click(clearButton);
    
    // Search field should be cleared
    expect(searchInput).toHaveValue('');
  });
});