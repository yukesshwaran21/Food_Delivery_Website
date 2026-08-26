import React, { useContext, useState, useEffect } from 'react';
import './Cart.css';
import './cart-title.css';
import './cart-mobile.css';
import './discount-notification.css';
import { StoreContext } from '../../components/context/StoreContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItems = {}, food_list = [], removeFromCart, addToCart, getTotalCartAmount, getTotalCartItems, url } = useContext(StoreContext);
  const navigate = useNavigate();
  const hasItems = food_list && food_list.length > 0 && Object.values(cartItems).some(qty => qty > 0);
  const itemCount = getTotalCartItems();
  
  const [promoCode, setPromoCode] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [discountMessage, setDiscountMessage] = useState({});
  const [discountedTotal, setDiscountedTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Function to handle promo code application
  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) return;
    
    // Simulating different promo codes
    let discount = 0;
    let message = {};
    
    if (promoCode.toLowerCase() === 'welcome10') {
      discount = 0.1; // 10% discount
      message = {
        title: "10% Discount Applied!",
        text: "You've received 10% off your order. Enjoy your meal!"
      };
    } else if (promoCode.toLowerCase() === 'special25') {
      discount = 0.25; // 25% discount
      message = {
        title: "Special 25% Off!",
        text: "You've unlocked our special 25% discount. Great savings!"
      };
    } else if (promoCode.toLowerCase() === 'freeship') {
      discount = 2; // Free shipping ($2)
      message = {
        title: "Free Delivery!",
        text: "Shipping fee has been waived. Enjoy free delivery!"
      };
    } else {
      // Generic success message for any other code
      discount = 0.05; // 5% discount
      message = {
        title: "Promo Code Applied!",
        text: "You've received 5% off your order. Enjoy!"
      };
    }
    
    const subtotal = getTotalCartAmount();
    let discountValue = 0;
    
    if (promoCode.toLowerCase() === 'freeship') {
      discountValue = 2; // Just the shipping fee
      setDiscountedTotal(subtotal); // Only subtotal without shipping
    } else {
      discountValue = subtotal * discount;
      setDiscountedTotal(subtotal - discountValue);
    }
    
    setDiscountAmount(discountValue);
    setDiscountMessage(message);
    setShowNotification(true);
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };
  
  // Function to close notification manually
  const closeNotification = () => {
    setShowNotification(false);
  };
  
  // Function to verify and fix image URL if needed
  const getImageUrl = (image) => {
    if (!image) {
      return 'https://via.placeholder.com/100x100?text=Food';
    }
    
    if (image.startsWith('http')) {
      const parsedImageUrl = new URL(image);
      if (parsedImageUrl.pathname.includes('/uploads/')) {
        return `${url}${parsedImageUrl.pathname}`;
      }
      return parsedImageUrl.href;
    }
    
    // For relative paths, make sure they go to the uploads folder
    if (image.includes('/uploads/')) {
      return image;
    } else {
      return `${url}/uploads/${image}`;
    }
  };

  return (
    <div className='cart-page'>
      {/* Discount Notification */}
      {showNotification && (
        <div className="discount-notification-container">
          <div className="discount-notification">
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="discount-icon">🎁</div>
            <div className="discount-content">
              <h4 className="discount-title">{discountMessage.title}</h4>
              <p className="discount-message">{discountMessage.text}</p>
            </div>
            <button className="discount-close" onClick={closeNotification}>×</button>
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
                            e.target.src = 'https://via.placeholder.com/100x100?text=Food';
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
                              e.target.src = 'https://via.placeholder.com/100x100?text=Food';
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
                  <span>${getTotalCartAmount().toFixed(2)}</span>
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
                  <span>${getTotalCartAmount() === 0 || (promoCode.toLowerCase() === 'freeship' && discountAmount > 0) ? '0.00' : '2.00'}</span>
                </div>
                
                <hr className='summary-divider' />
                
                <div className='summary-total'>
                  <span className='total-label'>Total</span>
                  <span className='total-amount'>
                    ${discountAmount > 0 
                      ? (promoCode.toLowerCase() === 'freeship' 
                          ? discountedTotal.toFixed(2) 
                          : (discountedTotal + 2).toFixed(2))
                      : (getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2).toFixed(2)}
                  </span>
                </div>
                
                <button 
                  className='checkout-btn'
                  onClick={() => navigate('/order')}
                >PROCEED TO CHECKOUT</button>
                
                <div className='promo-section'>
                  <h3 className='promo-title'>Have a promo code?</h3>
                  <p className='promo-description'>
                    Enter your code below to get a discount
                    <span className="promo-hint"> (Try: welcome10, special25, freeship)</span>
                  </p>
                  
                  <div className='promo-input-container'>
                    <input 
                      className='promo-input'
                      type='text' 
                      placeholder='Enter promo code'
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button 
                      className='promo-btn'
                      onClick={handleApplyPromoCode}
                    >
                      Apply
                    </button>
                  </div>
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