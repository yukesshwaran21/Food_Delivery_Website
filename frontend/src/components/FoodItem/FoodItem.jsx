import React, { useContext, useState } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../context/StoreContext';

const FoodItem = ({id, name, price, description, image}) => {
    const {cartItems, addToCart, removeFromCart, url} = useContext(StoreContext);
    const [showDetails, setShowDetails] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
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
    const handleAddToCart = () => {
        addToCart(id);
        // Show toast notification (in a real implementation)
        console.log(`Added ${name} to cart`);
    }
    
    const toggleDetails = (e) => {
        e.stopPropagation();
        setShowDetails(!showDetails);
    }
    
    return (
        <div 
            className={`food-item ${isHovered ? 'hovered' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="food-item-img-container">
                <img 
                    className='food-item-image' 
                    src={getImageUrl()} 
                    alt={name} 
                    onError={(e) => {
                        console.error("Image failed to load:", image);
                        e.target.src = 'https://via.placeholder.com/300x200?text=Food+Image';
                    }}
                />
                
                {isHovered && !cartItems[id] && (
                    <div className="food-item-actions">
                        <button 
                            className="quick-view-btn" 
                            onClick={toggleDetails}
                            aria-label="Quick view"
                        >
                            Quick View
                        </button>
                    </div>
                )}
                
                {cartItems && cartItems[id] > 0 ? (
                    <div className="food-item-counter">
                        <img 
                            onClick={() => removeFromCart(id)} 
                            src={assets.remove_icon_red} 
                            alt="Remove" 
                            className="counter-icon"
                        />
                        <p>{cartItems[id]}</p>
                        <img 
                            onClick={() => addToCart(id)} 
                            src={assets.add_icon_green} 
                            alt="Add" 
                            className="counter-icon"
                        />
                    </div>
                ) : (
                    <img 
                        className='add' 
                        onClick={handleAddToCart} 
                        src={assets.add_icon_white} 
                        alt="Add" 
                    />
                )}
            </div>
            
            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p>
                    <img src={assets.rating_starts} alt="Rating" />
                </div>
                <p className="food-item-desc">{description}</p>
                <p className="food-item-price">${price}</p>
            </div>
            
            {showDetails && (
                <div className="food-item-details-modal">
                    <div className="modal-content">
                        <button 
                            className="close-modal" 
                            onClick={toggleDetails}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                        <div className="modal-body">
                            <img 
                                src={getImageUrl()} 
                                alt={name} 
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/500x300?text=Food+Image';
                                }} 
                            />
                            <div className="modal-info">
                                <h3>{name}</h3>
                                <p className="modal-description">{description}</p>
                                <p className="modal-price">${price}</p>
                                <button 
                                    className="add-to-cart-btn" 
                                    onClick={() => {
                                        handleAddToCart();
                                        setShowDetails(false);
                                    }}
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FoodItem