import React, { useContext, useState, useEffect } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from './../context/StoreContext';
import axios from 'axios'

const LoginPopup = ({setShowLogin}) => {

    const {url, setToken} = useContext(StoreContext)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentState, setCurrentState] = useState('Login')
    const [data, setData] = useState({
        name:"",
        email:"",
        password:""
    })

    const onChangeHandler = (event) =>{
        const name = event.target.name
        const value = event.target.value 
        setData(data=>({...data,[name]:value}))
        setError('') // Clear error when user types
    }

   const onLogin = async (event) =>{
        event.preventDefault()
        setIsLoading(true)
        setError('')
        
        let newUrl = url;
        if(currentState==='Login'){
            newUrl+= "/api/user/login"
        }else{
            newUrl += "/api/user/register"
        }

        try {
            const response = await axios.post(newUrl,data);

            if(response.data.success){
                setToken(response.data.token);
                localStorage.setItem("token", response.data.token)
                setShowLogin(false);
            } else {
                setError(response.data.message || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setIsLoading(false)
        }
   }

   // Handle escape key to close popup
   useEffect(() => {
       const handleEsc = (event) => {
           if (event.key === 'Escape') {
               setShowLogin(false);
           }
       };
       window.addEventListener('keydown', handleEsc);
       
       return () => {
           window.removeEventListener('keydown', handleEsc);
       };
   }, [setShowLogin]);

  return (
    <div className='login-popup' onClick={() => setShowLogin(false)}>
        <form onSubmit={onLogin} className="login-popup-container" onClick={(e) => e.stopPropagation()}>
            <div className="login-popup-title">
                <h2>{currentState}</h2>
                <img onClick={()=>setShowLogin(false)} src={assets.cross_icon} alt="Close" title="Close" />
            </div>
            
            <div className="login-popup-inputs">
                {currentState === 'Sign Up' && (
                    <div className="input-group">
                        <label htmlFor="name">Full Name</label>
                        <input 
                            id="name"
                            name="name" 
                            onChange={onChangeHandler} 
                            value={data.name} 
                            type="text" 
                            placeholder="Enter your name" 
                            required 
                        />
                    </div>
                )}
                
                <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                        id="email"
                        name="email" 
                        onChange={onChangeHandler} 
                        value={data.email} 
                        type="email" 
                        placeholder="Enter your email" 
                        required 
                    />
                </div>
                
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input 
                        id="password"
                        name="password" 
                        onChange={onChangeHandler} 
                        value={data.password} 
                        type="password" 
                        placeholder="Enter your password" 
                        required 
                    />
                </div>
            </div>
            
            {error && <p style={{ color: '#EF4444', fontSize: '14px', margin: '-5px 0 0', textAlign: 'center' }}>{error}</p>}

            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Please wait...' : (currentState === 'Sign Up' ? 'Create Account' : 'Login')}
            </button>
            
            <div className="login-popup-condition">
                <input type="checkbox" id="terms" required />
                <p>By continuing, I agree to the terms of use & privacy policy</p>
            </div>
            
            <div className="login-popup-divider">
                <span>or continue with</span>
            </div>
            
            <div className="social-login">
                <div className="social-login-btn" title="Continue with Google">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                        <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                        <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                        <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                    </svg>
                </div>
                <div className="social-login-btn" title="Continue with Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#1877F2" d="M24 12.073c0-5.8-4.85-10.5-10.837-10.5S2.326 6.273 2.326 12.073c0 5.242 3.874 9.594 9.113 10.375v-7.292H8.217v-3.083h3.222V9.67c0-3.121 1.899-4.84 4.76-4.84 1.371 0 2.813.23 2.813.23v3.05h-1.585c-1.562 0-2.05.957-2.05 1.942v2.337h3.487l-.556 3.084h-2.93v7.291c5.237-.782 9.112-5.134 9.112-10.375Z"/>
                        <path fill="#FFF" d="M16.307 15.073l.557-3.084h-3.487v-2.337c0-.985.487-1.942 2.05-1.942h1.585v-3.05s-1.442-.23-2.813-.23c-2.861 0-4.76 1.719-4.76 4.84v2.603H6.217v3.084h3.222v7.291c1.375.197 2.79.197 4.164 0v-7.291h2.703Z"/>
                    </svg>
                </div>
                <div className="social-login-btn" title="Continue with Apple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                        <path d="M14.94 5.19A4.38 4.38 0 0 0 16 2a4.44 4.44 0 0 0-3 1.52 4.17 4.17 0 0 0-1 3.09 3.69 3.69 0 0 0 2.94-1.42zm2.52 7.44a4.51 4.51 0 0 1 2.16-3.81 4.66 4.66 0 0 0-3.66-2c-1.56-.16-3 .91-3.83.91s-2-.89-3.3-.87a4.92 4.92 0 0 0-4.14 2.53C2.93 12.45 4.24 17 6 19.47c.8 1.21 1.8 2.58 3.12 2.53s1.75-.82 3.28-.82 2 .82 3.3.79 2.22-1.24 3.06-2.45a11 11 0 0 0 1.38-2.85 4.41 4.41 0 0 1-2.68-4.04z"/>
                    </svg>
                </div>
            </div>
            
            <div className="login-popup-switch">
                {currentState === 'Login' ?
                 <p>Don't have an account? <span onClick={() => setCurrentState('Sign Up')}>Sign up</span></p>
                 : <p>Already have an account? <span onClick={() => setCurrentState('Login')}>Login</span></p>}
            </div>
        </form>
    </div>
  )
}

export default LoginPopup