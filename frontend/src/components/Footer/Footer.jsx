import './Footer.css';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer" id="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo-link" aria-label="EatOnWheels home">
            <img src={assets.logo} alt="EatOnWheels" className="footer-logo" />
          </Link>
          <p className="footer-tagline">Delicious food, delivered to your doorstep.</p>
          <div className="social-icons">
            <button type="button" aria-label="Facebook"><img src={assets.facebook.webp} alt="" /></button>
            <button type="button" aria-label="Twitter"><img src={assets.twitter_icon} alt="" /></button>
            <button type="button" aria-label="LinkedIn"><img src={assets.linkedin_icon} alt="" /></button>
          </div>
        </div>

        <div className="footer-column">
          <h2>Explore</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/#explore-menu">Menu</Link></li>
            <li><Link to="/#app-download">Mobile App</Link></li>
            <li><Link to="/#footer">Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h2>Useful Links</h2>
          <ul>
            <li><Link to="/myorders">My Orders</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>

        <div className="footer-column footer-contact">
          <h2>Get in Touch</h2>
          <ul>
            <li><span className="contact-label">Phone</span><a href="tel:+911234567890">+91 1234567890</a></li>
            <li><span className="contact-label">Email</span><a href="mailto:eatonwheels@gmail.com">eatonwheels@gmail.com</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">© 2026 EatOnWheels. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer