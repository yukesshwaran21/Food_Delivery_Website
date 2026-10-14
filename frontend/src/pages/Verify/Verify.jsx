import React, { useContext, useEffect, useState } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';

const Verify = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('orderId');
    const { url, setCartItems } = useContext(StoreContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const verifyPayment = async () => {
        // If no session_id, treat as cancelled/failed payment
        if (!sessionId) {
            setLoading(false);
            setTimeout(() => {
                navigate('/cart', { replace: true });
            }, 2000);
            return;
        }

        if (!orderId) {
            navigate('/cart', { replace: true });
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const response = await axios.post(
                `${url}/api/order/verify`,
                { orderId, sessionId },
                { headers: token ? { token } : {} }
            );

            if (response.data.success) {
                setCartItems({});
                localStorage.removeItem('guest_cart');
                setPaymentSuccess(true);
                setLoading(false);
                // Redirect to homepage after 3 seconds
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 3000);
            } else {
                setLoading(false);
                setTimeout(() => {
                    navigate('/cart', { replace: true });
                }, 2000);
            }
        } catch (error) {
            console.error('Verify payment error:', error);
            setLoading(false);
            setTimeout(() => {
                navigate('/cart', { replace: true });
            }, 2000);
        }
    };

    useEffect(() => {
        verifyPayment();
    }, []);

    return (
        <div className='verify'>
            {loading ? (
                <>
                    <div className="spinner"></div>
                    <p className="verify-status">Verifying your payment...</p>
                </>
            ) : paymentSuccess ? (
                <div className="verify-success">
                    <div className="success-checkmark">✓</div>
                    <h2>Payment Successful!</h2>
                    <p>Your order has been placed.</p>
                    <p className="verify-redirect">Redirecting to homepage...</p>
                </div>
            ) : (
                <div className="verify-failed">
                    <div className="failed-icon">✕</div>
                    <h2>Payment was not completed</h2>
                    <p className="verify-redirect">Redirecting to cart...</p>
                </div>
            )}
        </div>
    )
}

export default Verify