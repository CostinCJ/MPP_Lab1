/**
 * @jest-environment jsdom
 */

// Jest mock calls need to be before imports
jest.mock('../context/GuitarContext', () => {
  // Create a mock Provider that just renders its children
  const mockContext = {
    guitars: [],
    isLoading: false,
    error: null,
    deleteGuitar: jest.fn().mockResolvedValue(true)
  };
  
  return {
    useGuitars: () => mockContext,
    GuitarProvider: ({ children }) => children // Simple pass-through provider
  };
});

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} data-testid="mock-image" />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => {
    return <a href={href}>{children}</a>;
  },
}));

// Then imports
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteGuitar from './page';
import { GuitarProvider } from '../context/GuitarContext';

describe('DeleteGuitar Component', () => {
  test('renders the delete guitar page', () => {
    // Wrap the component with the GuitarProvider
    render(
      <GuitarProvider>
        <DeleteGuitar />
      </GuitarProvider>
    );
    
    // Use a more specific query to target the h1 heading
    expect(screen.getByRole('heading', { level: 1, name: 'Delete Guitar' })).toBeInTheDocument();
    
    // Check for the description text which is uniquely identifiable
    expect(screen.getByText('Choose and delete a guitar')).toBeInTheDocument();
    
    // Check for the search input
    expect(screen.getByLabelText('Enter Guitar Name')).toBeInTheDocument();
    
    // Check for the delete button (should be disabled initially)
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toBeDisabled();
  });
});