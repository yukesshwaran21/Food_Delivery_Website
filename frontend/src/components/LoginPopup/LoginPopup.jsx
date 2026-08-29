import React, { useContext, useState, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from './../context/StoreContext';
import axios from 'axios'

const LoginPopup = ({ setShowLogin }) => {

    const { url, setToken } = useContext(StoreContext)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentState, setCurrentState] = useState('Login')
    const [data, setData] = useState({
        name: "",
        email: "",
        password: ""
    })

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setData(data => ({ ...data, [name]: value }))
        setError('') // Clear error when user types
    }

    const onLogin = async (event) => {
        event.preventDefault()
        setIsLoading(true)
        setError('')

        let newUrl = url;
        if (currentState === 'Login') {
            newUrl += "/api/user/login"
        } else {
            newUrl += "/api/user/register"
        }

        try {
            const response = await axios.post(newUrl, data);

            if (response.data.success) {
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

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setIsLoading(true)
            setError('')

            const response = await axios.post(
                `${url}/api/user/google-login`,
                {
                    credential: credentialResponse.credential
                }
            )

            if (response.data.success) {
                setToken(response.data.token)

                localStorage.setItem(
                    "token",
                    response.data.token
                )

                setShowLogin(false)
            } else {
                setError(
                    response.data.message ||
                    "Google login failed"
                )
            }

        } catch (err) {
            console.error("Google Login Error:", err)

            setError(
                err.response?.data?.message ||
                "Google login failed. Please try again."
            )

        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='login-popup' onClick={() => setShowLogin(false)}>
            <form onSubmit={onLogin} className="login-popup-container" onClick={(e) => e.stopPropagation()}>
                <div className="login-popup-title">
                    <h2>{currentState}</h2>
                    <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" title="Close" />
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
                    <div
                        className="social-login-btn google-login-wrapper"
                        title="Continue with Google"
                    >
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                setError("Google login failed. Please try again.")
                            }}
                            useOneTap={false}
                            theme="outline"
                            size="medium"
                            text="continue_with"
                            shape="rectangular"
                        />
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