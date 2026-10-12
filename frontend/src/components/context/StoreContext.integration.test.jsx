
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import axios from 'axios';

import StoreContextProvider, {
  StoreContext,
} from './StoreContext';

// Mock HTTP requests, but keep the real StoreContext logic.
vi.mock('axios', () => ({
  default: {
    defaults: {},
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const food = {
  _id: 'food-1',
  name: 'Margherita Pizza',
  price: 10,
  image: 'pizza.png',
};

// Read and display values from the real context.
function TestConsumer() {
  const {
    cartItems,
    addToCart,
    getTotalCartAmount,
    getTotalCartItems,
  } = useContext(StoreContext);

  return (
    <div>
      <p data-testid="quantity">
        Quantity: {cartItems['food-1'] || 0}
      </p>

      <p data-testid="item-count">
        Items: {getTotalCartItems()}
      </p>

      <p data-testid="total">
        Total: {getTotalCartAmount()}
      </p>

      <button onClick={() => addToCart('food-1')}>
        Add pizza
      </button>
    </div>
  );
}

function renderStore() {
  return render(
    <StoreContextProvider>
      <TestConsumer />
    </StoreContextProvider>
  );
}

describe('StoreContext integration tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    axios.get.mockResolvedValue({
      data: { data: [food] },
    });
  });

  it('adds an item, updates totals, and saves the guest cart', async () => {
    renderStore();

    // Wait for the provider to load the food list.
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/food/list'
      );
    });

    // Add the pizza.
    fireEvent.click(
      screen.getByRole('button', { name: 'Add pizza' })
    );

    // Verify the real context state and calculated values.
    await waitFor(() => {
      expect(screen.getByTestId('quantity'))
        .toHaveTextContent('Quantity: 1');

      expect(screen.getByTestId('item-count'))
        .toHaveTextContent('Items: 1');

      expect(screen.getByTestId('total'))
        .toHaveTextContent('Total: 10');
    });

    // Verify guest cart persistence.
    expect(
      JSON.parse(localStorage.getItem('guest_cart'))
    ).toEqual({
      'food-1': 1,
    });
  });
});
