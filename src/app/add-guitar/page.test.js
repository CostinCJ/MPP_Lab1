/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddGuitar from './page';
import '@testing-library/jest-dom';

// Mock components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const { fill, ...restProps } = props;
    const fillValue = fill ? "true" : undefined;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...restProps} fill={fillValue} alt={props.alt || 'Mock image'} />;
  },
}));

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
  beforeEach(() => {
    render(<AddGuitar />);
  });

  test('renders the form with required fields', () => {
    expect(screen.getByText('Add Products')).toBeInTheDocument();
    expect(screen.getByLabelText(/Guitar Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Manufacturer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Strings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    
    // Check submit button
    expect(screen.getByRole('button', { name: /Add Guitar/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty form', async () => {
    fireEvent.click(screen.getByRole('button', { name: /Add Guitar/i }));
    
    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText(/Guitar name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Manufacturer is required/i)).toBeInTheDocument();
    });
  });

  test('allows adding a guitar with valid data', async () => {
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
    
    // Mock file upload
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText('Guitar Image'), file);
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Add Guitar/i }));
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/Guitar added successfully!/i)).toBeInTheDocument();
    });
  });

  test('shows error for invalid price', async () => {
    const price = screen.getByLabelText('Price');
    await userEvent.type(price, 'invalid');
    fireEvent.click(screen.getByRole('button', { name: /Add Guitar/i }));

    await waitFor(() => {
      expect(screen.getByText('Enter a valid positive price')).toBeInTheDocument();
    });
  });

  test('shows error for invalid image file type', async () => {
    // Create an invalid file type
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Guitar Image');
    
    // Mock implementation to simulate file type error
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    // Trigger file input change
    fireEvent.change(input);
    
    // Click submit to trigger validation
    fireEvent.click(screen.getByRole('button', { name: 'Add Guitar' }));
    
    // Just look for the exact text that's in the DOM
    await waitFor(() => {
      expect(screen.getByText('Please upload a valid image (max 5MB)')).toBeInTheDocument();
    });
  });

  test('handles valid image upload', async () => {
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText('Guitar Image');

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(input.files[0]).toStrictEqual(file);
      expect(input.files).toHaveLength(1);
    });
  });

  test('shows success message after successful submission', async () => {
    await userEvent.type(screen.getByLabelText('Guitar Name'), 'Les Paul');
    await userEvent.type(screen.getByLabelText('Manufacturer'), 'Gibson');
    await userEvent.type(screen.getByLabelText('Type'), 'Electric');
    await userEvent.selectOptions(screen.getByLabelText('Strings'), '6');
    await userEvent.selectOptions(screen.getByLabelText('Condition'), 'New');
    await userEvent.type(screen.getByLabelText('Price'), '2500');

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText('Guitar Image'), file);

    await userEvent.click(screen.getByRole('button', { name: 'Add Guitar' }));

    await waitFor(() => {
      expect(screen.getByText('Guitar added successfully!')).toBeInTheDocument();
    });
  });

  test('clears validation errors when user starts typing', async () => {
    fireEvent.click(screen.getByRole('button', { name: /Add Guitar/i }));

    await userEvent.type(screen.getByLabelText('Guitar Name'), 'S');

    await waitFor(() => {
      expect(screen.queryByText('Guitar name is required')).not.toBeInTheDocument();
    });
  });
});