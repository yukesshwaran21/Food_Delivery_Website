import './FeatureSection.css';
import { useInView } from 'react-intersection-observer';

const FeatureSection = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  return (
    <section className={`feature-section ${inView ? 'visible' : ''}`} id="why-choose-us">
      <div className="feature-container">
        <div className="feature-header">
          <span className="section-tag">OUR BENEFITS</span>
          <h2>Why Choose <span className="accent-text">Us</span></h2>
          <p className="feature-subtitle">Discover why thousands of food lovers trust us for their daily meals</p>
        </div>
        
        <div className="features-grid" ref={ref}>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3>Lightning Fast Delivery</h3>
            <p>Our optimized delivery network ensures your food arrives hot and fresh in 30 minutes or less.</p>
            <div className="feature-stat">
              <span className="stat-number">30</span>
              <span className="stat-unit">min</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
              </svg>
            </div>
            <h3>Customer Satisfaction</h3>
            <p>Join our community of satisfied customers who love our diverse menu and exceptional service.</p>
            <div className="feature-stat">
              <span className="stat-number">98</span>
              <span className="stat-unit">%</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h3>Best Value Pricing</h3>
            <p>Enjoy premium quality food at competitive prices with exclusive deals and promotions.</p>
            <div className="feature-stat">
              <span className="stat-number">20</span>
              <span className="stat-unit">%</span>
              <span className="stat-desc">off</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <h3>24/7 Customer Support</h3>
            <p>Our dedicated team is always available to assist you with any questions or special requests.</p>
            <div className="feature-stat">
              <span className="stat-number">24</span>
              <span className="stat-unit">/7</span>
            </div>
          </div>
        </div>
        
        <div className="feature-cta">
          <button className="feature-button" onClick={() => document.getElementById('food-display').scrollIntoView({ behavior: 'smooth' })}>
            Explore Our Menu
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
