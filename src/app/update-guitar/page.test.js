/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpdateGuitar from './page';
import { GuitarProvider } from '../context/GuitarContext';

// Mock components
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: (props) => {
      const { fill, ...restProps } = props;
      const fillValue = fill ? "true" : undefined;
      // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
      return <img {...restProps} fill={fillValue} data-testid="mock-image" />;
    },
  };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => {
    return <a href={href}>{children}</a>;
  },
}));

// Mock for setTimeout
jest.useFakeTimers();

// Mock for FileReader
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

describe('UpdateGuitar Component', () => {
  beforeEach(() => {
    render(
      <GuitarProvider>
        <UpdateGuitar />
      </GuitarProvider>
    );
  });

  test('renders the update guitar page with search field', () => {
    // Check heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Update Guitar');
    expect(screen.getByText('Edit guitar information')).toBeInTheDocument();
    
    // Check search field
    expect(screen.getByLabelText(/Enter Guitar Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name or manufacturer/i)).toBeInTheDocument();
    
    // Form should not be visible initially (no guitar selected)
    expect(screen.queryByLabelText(/String Number Update/i)).not.toBeInTheDocument();
  });

  test('shows search results when typing in search field', async () => {
    // Type in search field
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Wait for dropdown to appear with search results
    await waitFor(() => {
      expect(screen.getByText(/Fender Stratocaster/i)).toBeInTheDocument();
    });
  });

  test('selects a guitar when clicking on search result', async () => {
    // Type in search field
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Wait for dropdown and click on result
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Should show selected guitar details
    await waitFor(() => {
      expect(screen.getByText('Selected Guitar')).toBeInTheDocument();
      expect(screen.getByText(/Type:/i)).toBeInTheDocument();
      expect(screen.getByText(/Price:/i)).toBeInTheDocument();
    });
    
    // Form should now be visible
    expect(screen.getByLabelText(/String Number Update/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Condition Update/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price Update/i)).toBeInTheDocument();
  });

  test('clears search when clicking the clear button', async () => {
    // Type in search field
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Wait for the clear button and click it
    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: '' }); // The SVG clear button
      fireEvent.click(clearButton);
    });
    
    // Search should be cleared
    expect(searchInput.value).toBe('');
  });

  test('shows validation errors when submitting invalid form', async () => {
    // Type in search field and select a guitar
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Clear form fields to make them invalid
    await waitFor(() => {
      const priceInput = screen.getByLabelText(/Price Update/i);
      fireEvent.change(priceInput, { target: { value: '' } });
      
      const stringsSelect = screen.getByLabelText(/String Number Update/i);
      fireEvent.change(stringsSelect, { target: { value: '' } });
      
      const conditionSelect = screen.getByLabelText(/Condition Update/i);
      fireEvent.change(conditionSelect, { target: { value: '' } });
    });
    
    // Submit form
    const updateButton = screen.getByRole('button', { name: /Update/i });
    fireEvent.click(updateButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/Please select number of strings/i)).toBeInTheDocument();
      expect(screen.getByText(/Condition is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a valid positive price/i)).toBeInTheDocument();
    });
  });

  test('successfully updates guitar with valid data', async () => {
    // Type in search field and select a guitar
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Update form fields with valid data
    await waitFor(() => {
      const priceInput = screen.getByLabelText(/Price Update/i);
      fireEvent.change(priceInput, { target: { value: '1500' } });
      
      const stringsSelect = screen.getByLabelText(/String Number Update/i);
      fireEvent.change(stringsSelect, { target: { value: '7' } });
      
      const conditionSelect = screen.getByLabelText(/Condition Update/i);
      fireEvent.change(conditionSelect, { target: { value: 'Used' } });
    });
    
    // Submit form
    const updateButton = screen.getByRole('button', { name: /Update/i });
    
    await act(async () => {
      fireEvent.click(updateButton);
    });
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/Guitar updated successfully/i)).toBeInTheDocument();
    });
    
    // Success message should disappear after timeout
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/Guitar updated successfully/i)).not.toBeInTheDocument();
    });
  });

  test('cancels update when cancel button is clicked', async () => {
    // Type in search field and select a guitar
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Selected guitar and form should be visible
    await waitFor(() => {
      expect(screen.getByText('Selected Guitar')).toBeInTheDocument();
      expect(screen.getByLabelText(/String Number Update/i)).toBeInTheDocument();
    });
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    // Selected guitar and form should no longer be visible
    await waitFor(() => {
      expect(screen.queryByText('Selected Guitar')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/String Number Update/i)).not.toBeInTheDocument();
    });
    
    // Search field should be cleared
    expect(screen.getByLabelText(/Enter Guitar Name/i).value).toBe('');
  });

  test('handles image upload correctly', async () => {
    // Type in search field and select a guitar
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Create a mock file
    const file = new File(['dummy content'], 'example.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Update Guitar Image/i);
    
    // Simulate file upload
    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });
      fireEvent.change(fileInput);
    });
    
    // Should show image preview
    await waitFor(() => {
      expect(screen.getByText(/New Image Preview/i)).toBeInTheDocument();
    });
  });

  test('shows error for invalid image', async () => {
    // Type in search field and select a guitar
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Create an invalid file (not an image)
    const file = new File(['dummy content'], 'example.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/Update Guitar Image/i);
    
    // Mock implementation to simulate file type error
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    });
    
    // Simulate file upload
    fireEvent.change(fileInput);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Please upload a valid image/i)).toBeInTheDocument();
    });
  });

  test('handles empty search results', async () => {
    // Type non-matching search
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentGuitar' } });
    
    // Should show "No guitars found" message
    await waitFor(() => {
      expect(screen.getByText(/No guitars found/i)).toBeInTheDocument();
    });
  });
});