import React, { useState, useEffect, useRef } from 'react'
import './Header.css'
import { assets } from '../../assets/assets'

const Header = () => {
  const headerRef = useRef(null)
  const [email, setEmail] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [animatedText, setAnimatedText] = useState('Delicious')
  
  // Text animation effect
  useEffect(() => {
    const textOptions = ['Delicious', 'Fresh', 'Healthy', 'Quick']
    let currentIndex = 0
    
    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % textOptions.length
      setAnimatedText(textOptions[currentIndex])
    }, 3000)
    
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const headerElement = headerRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compactScreen = window.matchMedia('(max-width: 768px)').matches

    if (!headerElement || reducedMotion || compactScreen) return undefined

    let animationFrame
    const updateParallax = () => {
      const rect = headerElement.getBoundingClientRect()
      const offset = Math.max(-20, Math.min(20, (window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.025))
      headerElement.style.setProperty('--hero-text-parallax', `${offset * 0.45}px`)
      headerElement.style.setProperty('--hero-image-parallax', `${offset}px`)
      headerElement.style.setProperty('--hero-shape-parallax', `${offset * 0.2}px`)
      animationFrame = undefined
    }

    const handleScroll = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateParallax)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateParallax()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [])
  
  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      // In a real app, you would send this to your backend
      console.log('Subscribing email:', email)
      setShowNotification(true)
      setEmail('')
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }
  
  const scrollToMenu = () => {
    const menuElement = document.getElementById('food-display')
    if (menuElement) {
      menuElement.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  return (
    <div className='header' ref={headerRef}>
      <div className="header-contents">
        <div className="header-text-container hero-text">
          <h1 className="header-title">
            <span className="animated-text">{animatedText}</span> Food <br/>
            Delivered to <span className="accent-text">Your Doorstep</span>
          </h1>
          <p className="hero-description">Enjoy the best selection of local restaurants delivered fast and fresh. Order your favorites and discover new tastes right from the comfort of your home.</p>
          
          <div className="header-actions hero-actions">
            <button className="primary-btn" onClick={scrollToMenu}>
              Explore Menu
              <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            
            <form className="header-subscribe" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Email for exclusive deals" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email for promotions"
              />
              <button type="submit">Get Deals</button>
            </form>
          </div>
        </div>
        
        <div className="header-image-container hero-image-parallax">
          <div className="header-image">
            <img src={assets.header_img} alt="Delicious food" />
          </div>
          <div className="floating-badge hero-badge">
            <div className="badge-icon">🔥</div>
            <div className="badge-text">
              <span className="badge-large">30%</span>
              <span className="badge-small">OFF</span>
            </div>
          </div>
        </div>
      </div>
      
      {showNotification && (
        <div className="subscription-notification">
          <p>✅ Thanks for subscribing! Check your inbox for exclusive deals.</p>
        </div>
      )}
    </div>
  )
}

export default Header