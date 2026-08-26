import React, { useState, useEffect } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import TopDishes from '../../components/TopDishes/TopDishes'
import FeatureSection from '../../components/FeatureSection/FeatureSection'
import TestimonialSection from '../../components/TestimonialSection/TestimonialSection'
import Newsletter from '../../components/Newsletter/Newsletter'
import ScrollProgress from '../../components/ScrollProgress/ScrollProgress'
import ContactUs from '../../components/ContactUs/ContactUs'
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal'

const Home = () => {
  const [category, setCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [showBackToTop, setShowBackToTop] = useState(false)
  
  // Simulate loading state for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Handle scroll events for "Back to Top" button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  
  return (
    <div className="home-container">
      <ScrollProgress />
      <ScrollReveal className="hero-reveal" replay><Header/></ScrollReveal>
      <ScrollReveal><TopDishes category={category} setCategory={setCategory} /></ScrollReveal>
      <ScrollReveal><TestimonialSection /></ScrollReveal>
      <ScrollReveal><FeatureSection /></ScrollReveal>
      <ScrollReveal><Newsletter /></ScrollReveal>
      <ScrollReveal><AppDownload id="app-download" /></ScrollReveal>
      <ScrollReveal><ContactUs /></ScrollReveal>
      
      {showBackToTop && (
        <button 
          className="back-to-top-btn" 
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </button>
      )}
    </div>
  )
}

export default Home