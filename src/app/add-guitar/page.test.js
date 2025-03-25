/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddGuitar from './page';

// Mock Next.js components
jest.mock('next/image', () => {
  const MockImage = jest.requireActual('next/image').default;
  return {
    __esModule: true,
    default: (props) => <MockImage {...props} alt={props.alt || 'Mock image'} data-testid="mock-image" />,
  };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => {
    return <a href={href}>{children}</a>;
  },
}));

// Mock the FileReader API
global.FileReader = class {
  constructor() {
    this.result = 'data:image/png;base64,mockbase64string';
  }
  readAsDataURL() {
    setTimeout(() => {
      if (typeof this.onloadend === 'function') {
        this.onloadend();
      }
    }, 100);
  }
};

// Basic tests to verify form functionality
describe('AddGuitar Component', () => {
  test('renders the form with required fields', () => {
    render(<AddGuitar />);
    
    // Check form headings
    expect(screen.getByText('Add Products')).toBeInTheDocument();
    expect(screen.getByText('Add a guitar in the inventory')).toBeInTheDocument();
    
    // Check form fields
    expect(screen.getByLabelText(/Guitar Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Manufacturer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Strings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    
    // Check submit button
    expect(screen.getByRole('button', { name: /Add Guitar/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    render(<AddGuitar />);
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /Add Guitar/i }));
    
    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText(/Guitar name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Manufacturer is required/i)).toBeInTheDocument();
    });
  });

  test('allows adding a guitar with valid data', async () => {
    render(<AddGuitar />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/Guitar Name/i), { 
      target: { name: 'name', value: 'Test Guitar' } 
    });
    fireEvent.change(screen.getByLabelText(/Manufacturer/i), { 
      target: { name: 'manufacturer', value: 'Test Brand' } 
    });
    fireEvent.change(screen.getByLabelText(/Type/i), { 
      target: { name: 'type', value: 'Electric' } 
    });
    fireEvent.change(screen.getByLabelText(/Strings/i), { 
      target: { name: 'strings', value: '6' } 
    });
    fireEvent.change(screen.getByLabelText(/Condition/i), {
      target: { name: 'condition', value: 'New' }
    });
    fireEvent.change(screen.getByLabelText(/Price/i), { 
      target: { name: 'price', value: '1200' } 
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Add Guitar/i }));
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/Guitar added successfully!/i)).toBeInTheDocument();
    });
  });
});