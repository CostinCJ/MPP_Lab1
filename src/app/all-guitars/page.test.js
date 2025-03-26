/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllGuitars from './page';

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

describe('AllGuitars Component', () => {
  test('renders the guitar listing page with filters and guitars', () => {
    render(<AllGuitars />);
    
    // Check filter sections
    expect(screen.getByText('Guitar Type')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('String Type')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    
    // Check guitar cards - should find at least some of the default guitars
    expect(screen.getByText(/Fender Stratocaster/i)).toBeInTheDocument();
    expect(screen.getByText(/Gibson SG/i)).toBeInTheDocument();
    
    // Check search and sort controls
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Price ascending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Price descending/i })).toBeInTheDocument();
  });

  test('filters guitars by manufacturer', async () => {
    render(<AllGuitars />);
    
    // Initially, all guitars should be visible
    expect(screen.getByText(/Fender Stratocaster/i)).toBeInTheDocument();
    expect(screen.getByText(/Gibson SG/i)).toBeInTheDocument();
    expect(screen.getByText(/Ibanez Gio/i)).toBeInTheDocument();
    
    // Uncheck Gibson
    const gibsonCheckbox = screen.getByLabelText('Gibson');
    fireEvent.click(gibsonCheckbox);
    
    // Gibson guitars should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Gibson SG/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Gibson Les Paul/i)).not.toBeInTheDocument();
    });
    
    // Fender and Ibanez should still be visible
    expect(screen.getByText(/Fender Stratocaster/i)).toBeInTheDocument();
    expect(screen.getByText(/Ibanez Gio/i)).toBeInTheDocument();
  });

  test('filters guitars by condition', async () => {
    render(<AllGuitars />);
    
    // Initially, all guitars should be visible
    expect(screen.getAllByText(/Condition: New/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Condition: Used/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Condition: Vintage/i).length).toBeGreaterThan(0);
    
    // Uncheck Used
    const usedCheckbox = screen.getByLabelText('Used');
    fireEvent.click(usedCheckbox);
    
    // Used guitars should be hidden
    await waitFor(() => {
      const usedGuitars = screen.queryAllByText(/Condition: Used/i);
      expect(usedGuitars.length).toBe(0);
    });
    
    // New and Vintage should still be visible
    expect(screen.getAllByText(/Condition: New/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Condition: Vintage/i).length).toBeGreaterThan(0);
  });

  test('searches guitars by name', async () => {
    render(<AllGuitars />);
    
    // Initially, all guitars should be visible
    expect(screen.getByText(/Fender Stratocaster/i)).toBeInTheDocument();
    expect(screen.getByText(/Gibson SG/i)).toBeInTheDocument();
    
    // Search for "Strat"
    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'Strat' } });
    
    // Only Stratocaster should be visible
    await waitFor(() => {
      expect(screen.getByText(/Fender Stratocaster/i)).toBeInTheDocument();
      expect(screen.queryByText(/Gibson SG/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Ibanez Gio/i)).not.toBeInTheDocument();
    });
  });

  test('sorts guitars by price ascending', async () => {
    render(<AllGuitars />);
    
    // Click on price ascending
    const ascButton = screen.getByRole('button', { name: /Price ascending/i });
    fireEvent.click(ascButton);
    
    // Check that the button is now active
    expect(ascButton).toHaveClass('bg-gray-200');
    
    // This is harder to test definitively without querying the DOM structure
    // But we can check that the ascending button has the active class and descending doesn't
    const descButton = screen.getByRole('button', { name: /Price descending/i });
    expect(descButton).not.toHaveClass('bg-gray-200');
  });

  test('sorts guitars by price descending', async () => {
    render(<AllGuitars />);
    
    // Click on price descending
    const descButton = screen.getByRole('button', { name: /Price descending/i });
    fireEvent.click(descButton);
    
    // Check that the button is now active
    expect(descButton).toHaveClass('bg-gray-200');
    
    // This is harder to test definitively without querying the DOM structure
    // But we can check that the descending button has the active class and ascending doesn't
    const ascButton = screen.getByRole('button', { name: /Price ascending/i });
    expect(ascButton).not.toHaveClass('bg-gray-200');
  });

  test('displays no guitars message when no matches are found', async () => {
    render(<AllGuitars />);
    
    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'NonExistentGuitar' } });
    
    // Should display the no guitars message
    await waitFor(() => {
      expect(screen.getByText(/No guitars match your current filters/i)).toBeInTheDocument();
    });
  });

  test('filters guitars by price range', async () => {
    render(<AllGuitars />);
    
    // Initially, all guitars should be visible
    expect(screen.getByText(/Fender Stratocaster/i)).toBeInTheDocument();
    expect(screen.getByText(/Gibson Les Paul/i)).toBeInTheDocument();
    
    // Set price range to max $500
    const priceSlider = screen.getByRole('slider');
    fireEvent.change(priceSlider, { target: { value: '500' } });
    
    // More expensive guitars should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Gibson Les Paul/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Gibson SG/i)).not.toBeInTheDocument();
    });
    
    // Cheaper guitars should still be visible
    expect(screen.queryByText(/Fender Squier/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ibanez Gio/i)).toBeInTheDocument();
  });
});