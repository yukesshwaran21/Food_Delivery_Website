import React, { useContext, useState, useEffect } from 'react';
import './TopDishes.css';
import { StoreContext } from '../context/StoreContext';
import TopDishItem from './TopDishItem';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import CategorySelector from '../CategorySelector/CategorySelector';

const TopDishes = ({ category, setCategory }) => {
  const { food_list, url } = useContext(StoreContext);
  const [topDishes, setTopDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryChanging, setCategoryChanging] = useState(false);
  const [error, setError] = useState(null);
  
  // Use Intersection Observer for scroll animations
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Effect to handle category changes
  useEffect(() => {
    const fetchTopDishes = async () => {
      try {
        setCategoryChanging(true);
        setIsLoading(true);
        setError(null);
        
        // Direct API call to get food items
        const response = await axios.get(`${url}/api/food/list`);
        
        if (response.data.success) {
          // Filter dishes based on selected category
          const allFoods = response.data.data;
          console.log("API response sample:", allFoods.length > 0 ? 
            { id: allFoods[0]._id, name: allFoods[0].name, image: allFoods[0].image } : 
            "No items");
            
          const filteredList = category === 'All' 
            ? [...allFoods] 
            : allFoods.filter(item => item.category === category);
            
          // Sort by a random value to simulate "popular" dishes for this demo
          const sorted = [...filteredList]
            .sort(() => 0.5 - Math.random())
            .slice(0, 6); // Show top 6 dishes
          
          setTopDishes(sorted);
        } else {
          setError("Could not fetch food items");
          console.error("API Error:", response.data.message);
        }
      } catch (err) {
        setError("Error loading dishes");
        console.error("Error fetching dishes:", err);
      } finally {
        setIsLoading(false);
        setCategoryChanging(false);
      }
    };
    
    fetchTopDishes();
  }, [category, url]);

  return (
    <section className="top-dishes-section" id="dishes">
      <div className={`top-dishes-container ${inView ? 'animate-in' : ''}`}>
        <div className="top-dishes-header">
          <h2>
            <span className="accent-text">Top {category !== 'All' ? category : 'Dishes'}</span> 
            {category === 'All' ? ' Near You' : ''}
          </h2>
          <p className="top-dishes-subtitle">
            {category === 'All' 
              ? 'Discover the most loved dishes in your neighborhood, fresh and ready to be delivered'
              : `Explore our popular ${category.toLowerCase()} selection, handpicked for your enjoyment`}
          </p>
        </div>
        <CategorySelector category={category} setCategory={setCategory} />
        
        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : (isLoading || categoryChanging) ? (
          <div className="top-dishes-skeleton">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="dish-skeleton-card">
                <div className="skeleton-img"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            ))}
          </div>
        ) : topDishes.length > 0 ? (
          <div className="top-dishes-grid" ref={ref}>
            {topDishes.map((item, index) => (
              <div 
                key={item._id} 
                className="top-dish-wrapper"
              >
                <TopDishItem 
                  id={item._id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image={item.image}
                  rank={index + 1}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="no-dishes-message">
            <p>No top dishes available in this category.</p>
            <p>Try selecting a different category or check back later!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopDishes;
