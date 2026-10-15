
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreContext } from '../../components/context/StoreContext';
import Cart from './Cart';

const food = {
  _id: 'food-1',
  name: 'Margherita Pizza',
  price: 10,
  image: 'pizza.png',
};

const mockStore = {
  cartItems: { 'food-1': 1 },
  food_list: [food],
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  getTotalCartAmount: vi.fn(() => 10),
  getTotalCartItems: vi.fn(() => 1),
  url: 'http://localhost:4000',
};

function renderCart(store = mockStore) {
  return render(
    <StoreContext.Provider value={store}>
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    </StoreContext.Provider>
  );
}

describe('Cart component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the food item and quantity', () => {
    renderCart();

   expect(screen.getAllByText('Margherita Pizza'))
  .not.toHaveLength(0);

    expect(screen.getByRole('heading', { level: 1 }))
  .toHaveTextContent('Your Cart (1 item)');

    expect(screen.getAllByText('$10.00').length)
      .toBeGreaterThan(0);
  });

 

it('displays the delivery fee and total', () => {
  renderCart();

  expect(screen.getAllByText('Delivery Fee'))
    .not.toHaveLength(0);

  expect(screen.getAllByText('$2.00'))
    .not.toHaveLength(0);

  expect(screen.getAllByText('$12.00'))
    .not.toHaveLength(0);
});

  it('shows the empty-cart message when there are no items', () => {
    const emptyStore = {
      ...mockStore,
      cartItems: {},
      getTotalCartAmount: vi.fn(() => 0),
      getTotalCartItems: vi.fn(() => 0),
    };

    renderCart(emptyStore);

    expect(screen.getByText('Your cart is empty'))
      .toBeInTheDocument();
  });

  it('applies a percentage promo code to the order total', () => {
    renderCart();

    fireEvent.change(screen.getByRole('textbox', { name: 'Promo code' }), {
      target: { value: 'welcome10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByText('10% Discount Applied!')).toBeInTheDocument();
    expect(screen.getByText('-$1.00')).toBeInTheDocument();
    expect(screen.getAllByText('$11.00').length).toBeGreaterThan(0);
  });

  it('waives delivery for the free shipping promo code', () => {
    renderCart();

    fireEvent.change(screen.getByRole('textbox', { name: 'Promo code' }), {
      target: { value: 'freeship' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByText('Free Delivery!')).toBeInTheDocument();
    expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$10.00').length).toBeGreaterThan(0);
  });

  it('clears the cart after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderCart();
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR CART' }));

    expect(mockStore.clearCart).toHaveBeenCalledTimes(1);
  });
});
