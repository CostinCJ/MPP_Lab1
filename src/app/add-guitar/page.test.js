/**
 * @jest-environment jsdom
 */

// Mock definitions need to go before imports
jest.mock('../context/GuitarContext', () => {
  return {
    useGuitars: () => ({
      guitars: [],
      isLoading: false,
      error: null,
      addGuitar: jest.fn().mockImplementation((guitar) => {
        return Promise.resolve({
          ...guitar,
          id: 'mock-id-' + Date.now()
        });
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
import AddGuitar from './page';

describe('AddGuitar Component', () => {
  beforeEach(() => {
    render(<AddGuitar />);
  });

  test('renders the form with required fields', () => {
    expect(screen.getByText('Add Products')).toBeInTheDocument();
    expect(screen.getByLabelText(/Guitar Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Manufacturer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Strings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Guitar Image/i)).toBeInTheDocument();
    
    // Check submit button
    expect(screen.getByRole('button', { name: /Add Guitar/i })).toBeInTheDocument();
  });

  test('updates form fields when typing', () => {
    // Get form fields
    const nameInput = screen.getByLabelText(/Guitar Name/i);
    const manufacturerInput = screen.getByLabelText(/Manufacturer/i);
    const priceInput = screen.getByLabelText(/Price/i);
    
    // Type in the inputs
    fireEvent.change(nameInput, { target: { value: 'Test Guitar' } });
    fireEvent.change(manufacturerInput, { target: { value: 'Test Brand' } });
    fireEvent.change(priceInput, { target: { value: '1200' } });
    
    // Check values
    expect(nameInput).toHaveValue('Test Guitar');
    expect(manufacturerInput).toHaveValue('Test Brand');
    expect(priceInput).toHaveValue('1200');
  });

  test('updates dropdown selections', () => {
    // Get dropdown fields
    const typeSelect = screen.getByLabelText(/Type/i);
    const stringsSelect = screen.getByLabelText(/Strings/i);
    const conditionSelect = screen.getByLabelText(/Condition/i);
    
    // Change selections
    fireEvent.change(typeSelect, { target: { value: 'Electric' } });
    fireEvent.change(stringsSelect, { target: { value: '6' } });
    fireEvent.change(conditionSelect, { target: { value: 'New' } });
    
    // Check values
    expect(typeSelect).toHaveValue('Electric');
    expect(stringsSelect).toHaveValue('6');
    expect(conditionSelect).toHaveValue('New');
  });
});