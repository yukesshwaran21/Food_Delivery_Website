import React, { useContext, useState } from 'react';
import './Cart.css';
import './cart-title.css';
import './cart-mobile.css';
import './discount-notification.css';
import { StoreContext } from '../../components/context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

const FALLBACK_IMG = assets.food_1;

const resolveImageUrl = (image, apiBaseUrl) => {
  if (!image) return FALLBACK_IMG;

  const imageValue = String(image).trim();
  if (!imageValue) return FALLBACK_IMG;

  const baseUrl = (apiBaseUrl || 'http://localhost:4000').replace(/\/$/, '');

  if (/^https?:\/\//i.test(imageValue)) {
    try {
      const parsed = new URL(imageValue);
      if (parsed.pathname.includes('/uploads/')) {
        return `${baseUrl}${parsed.pathname}`;
      }
      return parsed.href;
    } catch {
      return imageValue;
    }
  }

  const normalized = imageValue.replace(/^\/+/, '').replace(/^uploads\/+/, '');
  return `${baseUrl}/uploads/${normalized}`;
};

const Cart = () => {
  const { cartItems = {}, food_list = [], removeFromCart, addToCart, getTotalCartAmount, getTotalCartItems, url } = useContext(StoreContext);
  const navigate = useNavigate();
  const hasItems = food_list && food_list.length > 0 && Object.values(cartItems).some(qty => qty > 0);
  const itemCount = getTotalCartItems();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  
  const getImageUrl = (image) => resolveImageUrl(image, url);
  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 || appliedPromo?.freeDelivery ? 0 : 2;
  const discountAmount = appliedPromo?.freeDelivery ? 0 : subtotal * (appliedPromo?.discount || 0);
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleApplyPromoCode = () => {
    const code = promoCode.trim().toLowerCase();
    const promos = {
      welcome10: { discount: 0.1, title: '10% Discount Applied!', text: 'You saved 10% on your order.' },
      special25: { discount: 0.25, title: 'Special 25% Off!', text: 'You saved 25% on your order.' },
      freeship: { freeDelivery: true, title: 'Free Delivery!', text: 'Your delivery fee has been waived.' },
    };

    if (!code || !promos[code]) {
      setAppliedPromo(null);
      setPromoMessage('Enter a valid promo code.');
      setShowNotification(false);
      return;
    }

    setAppliedPromo({ code, ...promos[code] });
    setPromoMessage('');
    setShowNotification(true);
  };

  return (
    <div className='cart-page'>
      {showNotification && appliedPromo && (
        <div className="discount-notification-container" role="status">
          <div className="discount-notification">
            <div className="discount-icon">%</div>
            <div className="discount-content">
              <h4 className="discount-title">{appliedPromo.title}</h4>
              <p className="discount-message">{appliedPromo.text}</p>
            </div>
            <button className="discount-close" aria-label="Close promo notification" onClick={() => setShowNotification(false)}>×</button>
          </div>
        </div>
      )}
      <div className='cart-container'>
        <div className='cart-header fade-in'>
          <h1 className="cart-title">
            Your Cart {itemCount > 0 && <span className="cart-item-count">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>}
          </h1>
          <p className="cart-subtitle">Review your items and proceed to checkout</p>
        </div>
        
        {!hasItems ? (
          <div className='empty-cart slide-up'>
            <div className='empty-cart-icon'>🛒</div>
            <h2 className='empty-cart-title'>Your cart is empty</h2>
            <p className='empty-cart-description'>Looks like you haven't added any items to your cart yet. Browse our menu and discover delicious meals!</p>
            <button className='start-shopping-btn' onClick={() => navigate('/')}>Start Shopping</button>
          </div>
        ) : (
          <div className='cart-content'>
            <div className='cart-items-section slide-up'>
              <div className='cart-items-header'>
                <div>Image</div>
                <div>Product</div>
                <div>Price</div>
                <div>Quantity</div>
                <div>Total</div>
                <div>Action</div>
              </div>
              
              <div className='cart-items-list'>
                {food_list.map((item) => (
                  cartItems[String(item._id)] > 0 ? (
                    <div key={item._id} className='cart-item'>
                      {/* Desktop Layout */}
                      <div className='cart-item-desktop'>
                        <img 
                          className='cart-item-image'
                          src={getImageUrl(item.image)} 
                          alt={item.name} 
                          onError={(e) => {
                            e.target.src = FALLBACK_IMG;
                          }}
                        />
                        <div className='cart-item-name'>{item.name}</div>
                        <div className='cart-item-price'>${item.price.toFixed(2)}</div>
                        
                        <div className='quantity-controls'>
                          <button 
                            className='quantity-btn'
                            onClick={() => removeFromCart(item._id)}
                          >-</button>
                          <span className='quantity-display'>{cartItems[String(item._id)]}</span>
                          <button 
                            className='quantity-btn'
                            onClick={() => addToCart(item._id)}
                          >+</button>
                        </div>
                        
                        <div className='cart-item-total'>${(item.price * cartItems[String(item._id)]).toFixed(2)}</div>
                        
                        <button 
                          className='remove-btn'
                          onClick={() => {
                            // Remove all of this item
                            for(let i=0; i<cartItems[String(item._id)]; i++) {
                              removeFromCart(item._id);
                            }
                          }}
                        >×</button>
                      </div>
                      
                      {/* Mobile Layout */}
                      <div className='cart-item-mobile'>
                        <div className='mobile-item-header'>
                          <img 
                            className='mobile-item-image'
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            onError={(e) => {
                              e.target.src = FALLBACK_IMG;
                            }}
                          />
                          <div className='mobile-item-info'>
                            <div className='mobile-item-name'>{item.name}</div>
                            <div className='mobile-item-price'>${item.price.toFixed(2)}</div>
                          </div>
                          <button 
                            className='mobile-remove-btn'
                            onClick={() => {
                              // Remove all of this item
                              for(let i=0; i<cartItems[String(item._id)]; i++) {
                                removeFromCart(item._id);
                              }
                            }}
                          >×</button>
                        </div>
                        
                        <div className='mobile-item-footer'>
                          <div className='mobile-quantity-controls'>
                            <button 
                              className='quantity-btn'
                              onClick={() => removeFromCart(item._id)}
                            >-</button>
                            <span className='quantity-display'>{cartItems[String(item._id)]}</span>
                            <button 
                              className='quantity-btn'
                              onClick={() => addToCart(item._id)}
                            >+</button>
                          </div>
                          
                          <div className='mobile-total-section'>
                            <div className='mobile-total-label'>Total:</div>
                            <div className='mobile-total-amount'>${(item.price * cartItems[String(item._id)]).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
            
            <div className='cart-summary slide-up'>
              <div className='summary-card'>
                <h2 className='summary-title'>Order Summary</h2>
                
                <div className='summary-row'>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <>
                    <div className='summary-row discount-row'>
                      <span>Discount</span>
                      <span className="discount-value">-${discountAmount.toFixed(2)}</span>
                    </div>
                    <hr className='summary-divider' />
                  </>
                )}
                
                <hr className='summary-divider' />
                
                <div className='summary-row'>
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                
                <hr className='summary-divider' />
                
                <div className='summary-total'>
                  <span className='total-label'>Total</span>
                  <span className='total-amount'>${total.toFixed(2)}</span>
                </div>
                
                <button 
                  className='checkout-button'
                  onClick={() => navigate('/order')}
                >PROCEED TO CHECKOUT</button>

                <div className='promo-section'>
                  <h3 className='promo-title'>Have a promo code?</h3>
                  <p className='promo-description'>Try: welcome10, special25, or freeship</p>
                  <div className='promo-input-container'>
                    <input
                      className='promo-input'
                      type='text'
                      placeholder='Enter promo code'
                      value={promoCode}
                      aria-label='Promo code'
                      onChange={(event) => setPromoCode(event.target.value)}
                    />
                    <button className='promo-btn' type='button' onClick={handleApplyPromoCode}>Apply</button>
                  </div>
                  {promoMessage && <p className='promo-error' role='alert'>{promoMessage}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;