import React, { useState, useEffect } from 'react';
import './FoodDetailsPopup.css';
import { createPortal } from 'react-dom';

const FoodDetailsPopup = ({ 
  isOpen, 
  onClose, 
  id, 
  name, 
  description, 
  price, 
  rank, 
  addToCart, 
  imageUrl 
}) => {
  const [animationState, setAnimationState] = useState('closed');
  const [cookingRequest, setCookingRequest] = useState('');
  const [cookingRequestSubmitted, setCookingRequestSubmitted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Control animation states
  useEffect(() => {
    if (isOpen) {
      setAnimationState('opening');
      document.body.style.overflow = 'hidden';
      
      // After animation completes, set to fully open state
      const timer = setTimeout(() => setAnimationState('open'), 500);
      return () => clearTimeout(timer);
    } else {
      if (animationState !== 'closed') {
        setAnimationState('closing');
        
        // Reset after close animation completes
        const timer = setTimeout(() => {
          setAnimationState('closed');
          setCookingRequest('');
          setCookingRequestSubmitted(false);
          document.body.style.overflow = 'auto';
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, animationState]);

  // Preload image when component mounts
  useEffect(() => {
    if (imageUrl && isOpen) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageUrl, isOpen]);

  const handleCookingRequestSubmit = (e) => {
    e.preventDefault();
    if (cookingRequest.trim()) {
      console.log(`Cooking request for ${name}: ${cookingRequest}`);
      setCookingRequestSubmitted(true);
      // In a production app, this would be sent to the backend
    }
  };

  // Only render if we're at least in opening state
  if (animationState === 'closed') return null;

  // Use portal to render outside of normal DOM hierarchy
  return createPortal(
    <div 
      className={`food-details-popup ${animationState}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div 
        className={`popup-content ${animationState}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="close-popup" 
          onClick={onClose} 
          aria-label="Close popup"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="popup-grid">
          <div className="popup-image-section">
            {imageLoaded ? (
              <img 
                src={imageUrl} 
                alt={name} 
                className="popup-image"
              />
            ) : (
              <div className="image-skeleton">
                <div className="pulse"></div>
              </div>
            )}
            
            {rank && (
              <div className="rank-badge">
                <span>#{rank}</span>
                <span className="rank-label">Top Pick</span>
              </div>
            )}
          </div>
          
          <div className="popup-details-section">
            <h2 id="popup-title">{name}</h2>
            
            <div className="popup-price">${price?.toFixed(2)}</div>
            
            <div className="popup-description">
              <h3>About this dish</h3>
              <p>{description}</p>
            </div>
            
            <div className="cooking-instructions">
              <div className="section-header">
                <h3>Special Cooking Instructions</h3>
                <span className="custom-tag">Customizable</span>
              </div>
              
              {cookingRequestSubmitted ? (
                <div className="cooking-request-success">
                  <div className="success-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#4CAF50"/>
                    </svg>
                  </div>
                  <div className="success-content">
                    <p className="success-message">Instructions received!</p>
                    <p className="request-text">"{cookingRequest}"</p>
                    <button 
                      className="edit-request-btn"
                      onClick={() => setCookingRequestSubmitted(false)}
                    >
                      Edit Instructions
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCookingRequestSubmit} className="cooking-request-form">
                  <textarea 
                    placeholder="Add special instructions for the chef (e.g., less spicy, no onions, extra crispy...)"
                    value={cookingRequest}
                    onChange={(e) => setCookingRequest(e.target.value)}
                    className="cooking-request-input"
                    aria-label="Special cooking instructions"
                  />
                  <div className="request-actions">
                    <button 
                      type="submit" 
                      className="add-instructions-btn"
                      disabled={!cookingRequest.trim()}
                    >
                      Save Instructions
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        
        <div className="popup-footer">
          <button 
            className="add-to-cart-btn"
            onClick={() => {
              addToCart(id);
              if (!cookingRequestSubmitted && cookingRequest.trim()) {
                setCookingRequestSubmitted(true);
              }
            }}
          >
            <span className="cart-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="white" strokeWidth="2"/>
                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="white" strokeWidth="2"/>
                <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 9V3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 6H15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Add to Cart • ${price?.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FoodDetailsPopup;
