/**
 * @jest-environment jsdom
 */

// Jest mock calls need to be before imports
jest.mock('../context/GuitarContext', () => {
  return {
    useGuitars: () => ({
      guitars: [
        {
          id: 'fender_strat_1',
          name: 'Stratocaster',
          manufacturer: 'Fender',
          type: 'Electric',
          strings: '6',
          condition: 'New',
          price: '733',
          imageUrl: '/fenderStratocaster.jpg'
        },
        {
          id: 'gibson_sg_1',
          name: 'SG',
          manufacturer: 'Gibson',
          type: 'Electric',
          strings: '6',
          condition: 'New',
          price: '1526',
          imageUrl: '/gibsonSG.jpg'
        }
      ],
      isLoading: false,
      error: null,
      getFilteredGuitars: jest.fn(() => Promise.resolve([
        {
          id: 'fender_strat_1',
          name: 'Stratocaster',
          manufacturer: 'Fender',
          type: 'Electric',
          strings: '6',
          condition: 'New',
          price: '733',
          imageUrl: '/fenderStratocaster.jpg'
        }
      ]))
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

// Imports after mock definitions
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllGuitars from './page';

describe('AllGuitars Component', () => {
  test('renders the main page sections', () => {
    render(<AllGuitars />);
    
    // Check for main UI elements
    expect(screen.getByText('Guitar Type')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('String Type')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Price Statistics')).toBeInTheDocument();
    
    // Check search and sort controls
    expect(screen.getByPlaceholderText('Search by model or manufacturer')).toBeInTheDocument();
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
    expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
  });
});