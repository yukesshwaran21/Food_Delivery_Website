import { useEffect, useRef, useState } from 'react'
import './ScrollReveal.css'

const ScrollReveal = ({ children, className = '', replay = false }) => {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = sectionRef.current
    if (!element) return undefined

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        if (!replay) observer.unobserve(element)
      } else if (replay) {
        setIsVisible(false)
      }
    }, { threshold: 0.12 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [replay])

  return (
    <div ref={sectionRef} className={`scroll-reveal ${isVisible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

export default ScrollReveal
