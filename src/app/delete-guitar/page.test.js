/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteGuitar from './page';
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

describe('DeleteGuitar Component', () => {
  beforeEach(() => {
    render(
      <GuitarProvider>
        <DeleteGuitar />
      </GuitarProvider>
    );
  });

  test('renders the delete guitar page with search field', () => {
    // Check heading - using h1 to be specific since "Delete Guitar" appears multiple times
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Delete Guitar');
    expect(screen.getByText('Choose and delete a guitar')).toBeInTheDocument();
    
    // Check search field
    expect(screen.getByLabelText(/Enter Guitar Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search guitar by name/i)).toBeInTheDocument();
    
    // Check buttons - find delete button by its disabled state
    const deleteButton = screen.getByRole('button', { name: /Delete/i, disabled: true });
    expect(deleteButton).toBeInTheDocument();
    
    // Check cancel link
    expect(screen.getByRole('link', { name: /Cancel/i })).toBeInTheDocument();
  });

  test('shows search results when typing in search field', async () => {
    // Type in search field
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Wait for dropdown to appear with search results
    await waitFor(() => {
      // Looking for manufacturer + model name in the search results
      expect(screen.getByText(/Fender/i)).toBeInTheDocument();
      expect(screen.getByText(/Stratocaster/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Type/i)).toBeInTheDocument();
      expect(screen.getByText(/Price/i)).toBeInTheDocument();
      expect(screen.getByText(/Strings/i)).toBeInTheDocument();
    });
    
    // Delete button should be enabled now
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    expect(deleteButton).not.toBeDisabled();
  });

  test('clears search when clicking the clear button', async () => {
    // Type in search field
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Wait for the clear button and click it
    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: '' }); 
      fireEvent.click(clearButton);
    });
    
    // Search should be cleared
    expect(searchInput.value).toBe('');
  });

  test('shows confirmation dialog when delete button is clicked', async () => {
    // Type in search field
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Wait for dropdown and click on result
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Wait for the delete button to be enabled and click it
    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /Delete/i, disabled: false });
      fireEvent.click(deleteButton);
    });
    
    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
      
      // There should be a Cancel and Delete button in the dialog
      const dialogButtons = screen.getAllByRole('button').filter(
        button => button.textContent === 'Cancel' || button.textContent === 'Delete'
      );
      expect(dialogButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  test('cancels deletion when cancel button in confirmation is clicked', async () => {
    // Type in search field
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Wait for dropdown and click on result
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Wait for the delete button to be enabled and click it
    let deleteButton;
    await waitFor(() => {
      deleteButton = screen.getByRole('button', { name: /Delete/i, disabled: false });
      fireEvent.click(deleteButton);
    });
    
    // Wait for the confirmation dialog and click Cancel
    await waitFor(() => {
      // Get all buttons and find the one with text "Cancel"
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(button => button.textContent === 'Cancel');
      fireEvent.click(cancelButton);
    });
    
    // Confirmation dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText(/Confirm Deletion/i)).not.toBeInTheDocument();
    });
    
    // Delete button should still be visible and enabled
    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /Delete/i, disabled: false });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  test('deletes guitar when confirmed and shows success message', async () => {
    // Type in search field
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Wait for dropdown and click on result
    await waitFor(() => {
      const searchResult = screen.getByText(/Stratocaster/i);
      fireEvent.click(searchResult);
    });
    
    // Wait for the delete button to be enabled and click it
    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /Delete/i, disabled: false });
      fireEvent.click(deleteButton);
    });
    
    // Wait for the confirmation dialog and click Delete
    await waitFor(() => {
      // Get all buttons and find the one with text "Delete" inside the confirmation dialog
      const buttons = screen.getAllByRole('button');
      // The last "Delete" button should be the one in the confirmation dialog
      const confirmDeleteButtons = buttons.filter(button => button.textContent === 'Delete');
      const confirmButton = confirmDeleteButtons[confirmDeleteButtons.length - 1];
      
      act(() => {
        fireEvent.click(confirmButton);
      });
    });
    
    // Success message should be shown
    await waitFor(() => {
      expect(screen.getByText(/Guitar deleted successfully/i)).toBeInTheDocument();
    });
    
    // Success message should disappear after timeout
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/Guitar deleted successfully/i)).not.toBeInTheDocument();
    });
  });

  test('handles empty search results', async () => {
    // Type non-matching search
    const searchInput = screen.getByLabelText(/Enter Guitar Name/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentGuitar' } });
    
    // Wait a moment for any potential results
    await waitFor(() => {
      // Should not find Stratocaster in results
      expect(screen.queryByText(/Stratocaster/i)).not.toBeInTheDocument();
    });
  });
});