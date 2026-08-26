import React, { useState, useContext } from 'react';
import './TopDishItem.css';
import { StoreContext } from '../context/StoreContext';
import { assets } from '../../assets/assets';
import FoodDetailsPopup from '../FoodDetailsPopup/FoodDetailsPopup';

const fallbackFoodImages = [
  assets.food_1,
  assets.food_2,
  assets.food_3,
  assets.food_4,
  assets.food_5,
  assets.food_6
];

const TopDishItem = ({ id, name, description, price, image, rank }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const fallbackImage = fallbackFoodImages[(Number(rank) - 1) % fallbackFoodImages.length];

  // ✅ Return early if id is missing (prevents runtime errors)
  if (!id) return null;

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  const openPopup = () => setShowPopup(true);
  const closePopup = () => setShowPopup(false);

  const formatDescription = (text) => {
    if (!text) return '';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };
  
  const getImageUrl = () => {
    if (!image) {
      return 'https://via.placeholder.com/300x200?text=Food+Image';
    }

    const imagePath = String(image).trim();
    try {
      const parsedImageUrl = new URL(imagePath, `${url}/`);
      const isAbsoluteUrl = /^https?:\/\//i.test(imagePath);

      if (parsedImageUrl.pathname.includes('/uploads/')) {
        return `${url.replace(/\/$/, '')}${parsedImageUrl.pathname}`;
      }

      if (isAbsoluteUrl) {
        return parsedImageUrl.href;
      }

      return `${url.replace(/\/$/, '')}/uploads/${imagePath.replace(/^\/+/, '')}`;
    } catch {
      return `${url.replace(/\/$/, '')}/uploads/${imagePath.replace(/^\/+/, '')}`;
    }
  };

  return (
    <div 
      className={`top-dish-item-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="top-dish-rank">{rank}</div>

      <div className="top-dish-img-container">
        <img 
          src={getImageUrl()} 
          alt={name} 
          className="top-dish-image" 
          onError={(e) => {
            console.error("Image failed to load:", image);
            if (e.currentTarget.src !== fallbackImage) {
              e.currentTarget.src = fallbackImage;
            }
          }}
        />

        <div className="top-dish-actions">
          <button className="quick-view-btn" onClick={openPopup}>
            Quick View
          </button>
        </div>

        {cartItems?.[id] ? (
          <div className="top-dish-counter">
            <img 
              src={assets.remove_icon_red} 
              alt="Remove" 
              onClick={(e) => {
                e.stopPropagation();
                removeFromCart(id);
              }}
            />
            <p>{cartItems[id]}</p>
            <img 
              src={assets.add_icon_green} 
              alt="Add" 
              onClick={(e) => {
                e.stopPropagation();
                addToCart(id);
              }}
            />
          </div>
        ) : (
          <img 
            src={assets.add_icon_white} 
            alt="Add" 
            className="add-icon"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(id);
            }}
          />
        )}
      </div>

      <div className="top-dish-info">
        <div className="top-dish-name-rating">
          <p>{name}</p>
        </div>
        <div className="top-dish-desc">{formatDescription(description)}</div>
        <div className="top-dish-price">${price?.toFixed(2)}</div>
      </div>
      
      {/* New Food Details Popup */}
      <FoodDetailsPopup
        isOpen={showPopup}
        onClose={closePopup}
        id={id}
        name={name}
        description={description}
        price={price}
        image={image}
        rank={rank}
        addToCart={addToCart}
        imageUrl={getImageUrl()}
      />
    </div>
  );
};

export default TopDishItem;
