import React, { useContext, useState, useEffect } from 'react';
import './TopDishes.css';
import { StoreContext } from '../context/StoreContext';
import TopDishItem from './TopDishItem';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import CategorySelector from '../CategorySelector/CategorySelector';

const worstCaseFoods = [
  {
    _id: 'worst-long-name',
    name: 'Aleksandra Wiśniewska-Kowalczyk’s Saffron Seafood Risotto with Caramelized Fennel and Lemon',
    description: 'A realistic long description with diacritics, tall characters, and enough detail to test the two-line card clamp without relying on nonsense text.',
    price: 1284.99,
    image: '',
    category: 'Pasta',
  },
  {
    _id: 'worst-long-description',
    name: 'Jo',
    description: 'A creamy seasonal bowl with roasted garlic, hand-cut vegetables, toasted seeds, fresh herbs, house-made dressing, and optional substitutions for common allergens.',
    price: 1,
    image: 'missing-food-image.webp',
    category: 'Salad',
  },
  {
    _id: 'worst-unbounded-text',
    name: 'Pad Thai',
    description: 'Gluten-free noodles with a sauce made from tamarind, peanuts, lime, bean sprouts, and chili.',
    price: 0,
    image: 'https://images.example.com/food/this-is-a-deliberately-long-but-plausible-food-image-file-name-v12-final.webp',
    category: 'Noodles',
  },
  {
    _id: 'worst-short-name',
    name: 'À',
    description: '',
    price: 999999.99,
    image: 'not-a-valid-image',
    category: 'Cake',
  },
  {
    _id: 'worst-special-chars',
    name: 'Súp đậu xanh ไทย',
    description: 'A dish name containing Vietnamese diacritics and Thai script to check clipping and line-height.',
    price: 12.5,
    image: 'food_5.png',
    category: 'Vegetable',
  },
  {
    _id: 'worst-missing-fields',
    name: 'Sandwich',
    description: null,
    price: null,
    image: null,
    category: 'Sandwich',
  },
];

const getFixture = (mode, demoData) => {
  if (mode === 'demo') return demoData;
  if (mode === 'empty') return [];
  if (mode === 'one') return [worstCaseFoods[0]];
  if (mode === '1000') return Array.from({ length: 1000 }, (_, index) => ({
    ...worstCaseFoods[index % worstCaseFoods.length],
    _id: `worst-row-${index + 1}`,
    name: `${worstCaseFoods[index % worstCaseFoods.length].name} ${index + 1}`,
  }));
  return worstCaseFoods;
};

const TopDishes = ({ category, setCategory }) => {
  const { url } = useContext(StoreContext);
  const [topDishes, setTopDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryChanging, setCategoryChanging] = useState(false);
  const [error, setError] = useState(null);
  const isDev = import.meta.env.DEV;
  const dataMode = isDev
    ? new URLSearchParams(window.location.search).get('data') || 'demo'
    : 'demo';
  
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

        if (dataMode !== 'demo') {
          setTopDishes(getFixture(dataMode, []));
          return;
        }
        
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
          
          setTopDishes(getFixture(dataMode, sorted));
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
  }, [category, dataMode, url]);

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
      {isDev && (
        <nav className="ui-breaker-toggle" aria-label="Data fixture">
          {[
            ['demo', 'Demo data'],
            ['worst', 'Worst case'],
            ['empty', 'Empty'],
            ['one', 'One'],
            ['1000', '1,000 rows'],
          ].map(([mode, label]) => (
            <a
              key={mode}
              href={`?data=${mode}`}
              className={dataMode === mode ? 'active' : ''}
              aria-current={dataMode === mode ? 'page' : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </section>
  );
};

export default TopDishes;
