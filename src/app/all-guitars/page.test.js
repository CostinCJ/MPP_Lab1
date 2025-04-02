/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllGuitars from './page';
import { GuitarProvider } from '../context/GuitarContext';

// Mock components
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
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
    // Check filter sections
    expect(screen.getByText('Guitar Type')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('String Type')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    
    // Check guitar cards
    expect(screen.getByText(/Fender Stratocaster/i)).toBeInTheDocument();
    expect(screen.getByText(/Gibson SG/i)).toBeInTheDocument();
    
    // Check search and sort controls
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Price ascending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Price descending/i })).toBeInTheDocument();
  });

  test('filters guitars by manufacturer', async () => {
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
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
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
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
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
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
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
    // Click on price ascending
    const ascButton = screen.getByRole('button', { name: /Price ascending/i });
    fireEvent.click(ascButton);
    
    // Check that the button is now active
    expect(ascButton).toHaveClass('bg-gray-200');
    
    const descButton = screen.getByRole('button', { name: /Price descending/i });
    expect(descButton).not.toHaveClass('bg-gray-200');
  });

  test('sorts guitars by price descending', async () => {
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
    // Click on price descending
    const descButton = screen.getByRole('button', { name: /Price descending/i });
    fireEvent.click(descButton);
    
    // Check that the button is now active
    expect(descButton).toHaveClass('bg-gray-200');
    
    const ascButton = screen.getByRole('button', { name: /Price ascending/i });
    expect(ascButton).not.toHaveClass('bg-gray-200');
  });

  test('displays no guitars message when no matches are found', async () => {
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'NonExistentGuitar' } });
    
    // Should display the no guitars message
    await waitFor(() => {
      expect(screen.getByText(/No guitars match your current filters/i)).toBeInTheDocument();
    });
  });

  test('filters guitars by price range', async () => {
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
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

  test('displays price statistics correctly', async () => {
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
    // Check if the price statistics section exists
    expect(screen.getByText('Price Statistics')).toBeInTheDocument();
    
    // Check specific price statistics labels
    expect(screen.getByText('Lowest:')).toBeInTheDocument();
    expect(screen.getByText('Highest:')).toBeInTheDocument();
    expect(screen.getByText('Average:')).toBeInTheDocument();
    
    await waitFor(() => {
      const priceElements = screen.getAllByText(/\$\d+/);
      const prices = priceElements.map(el => 
        parseInt(el.textContent.replace('$', ''))
      ).filter(price => !isNaN(price));
      
      // Check that we have at least one price that matches the minimum and maximum
      expect(prices.some(price => price === 115)).toBe(true); 
      expect(prices.some(price => price === 2499)).toBe(true);
    });
  });

  test('price statistics box displays correct information', async () => {
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
    // Check if the price statistics section exists
    expect(screen.getByText('Price Statistics')).toBeInTheDocument();
    
    // Check the statistics box contains the expected elements
    const statsBox = screen.getByText('Price Statistics').closest('.mt-6.border.border-gray-400.rounded-xl.p-4');
    expect(statsBox).toBeInTheDocument();
    
    expect(within(statsBox).getByText('Lowest:')).toBeInTheDocument();
    expect(within(statsBox).getByText('Highest:')).toBeInTheDocument();
    expect(within(statsBox).getByText('Average:')).toBeInTheDocument();
    
    // Verify the toggle button exists
    const toggleButton = within(statsBox).getByRole('button');
    expect(toggleButton).toHaveTextContent('Hide Highlights');
  });

  test('highlights can be toggled off and on', async () => {
    render(
      <GuitarProvider>
        <AllGuitars />
      </GuitarProvider>
    );
    
    // Find the toggle button
    const toggleButton = screen.getByText('Hide Highlights');
    
    // Initially, at least one guitar should have a price category label
    await waitFor(() => {
      expect(screen.queryByText('Highest Price')).toBeInTheDocument();
    });
    
    // Click to hide highlights
    fireEvent.click(toggleButton);
    
    // Button text should change
    expect(screen.getByText('Show Highlights')).toBeInTheDocument();
    
    // Price category labels should disappear
    await waitFor(() => {
      expect(screen.queryByText('Highest Price')).not.toBeInTheDocument();
      expect(screen.queryByText('Lowest Price')).not.toBeInTheDocument();
      expect(screen.queryByText('Average Price Range')).not.toBeInTheDocument();
    });
    
    // Click to show highlights again
    fireEvent.click(screen.getByText('Show Highlights'));
    
    // Button text should change back
    expect(screen.getByText('Hide Highlights')).toBeInTheDocument();
    
    // Price category labels should reappear
    await waitFor(() => {
      // At least one price category should be visible again
      const priceLabels = screen.queryAllByText(/Price/i);
      // We should have more than just "Price Statistics" and "Price ascending/descending"
      expect(priceLabels.length).toBeGreaterThan(3);
    });
  });
});