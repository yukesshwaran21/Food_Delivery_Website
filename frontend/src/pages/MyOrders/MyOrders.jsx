import React, { useContext, useEffect, useRef, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';
import { assets } from './../../assets/assets';
import TrackingPopup from '../../components/TrackingPopup/TrackingPopup';

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const pollingIntervalRef = useRef(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${url}/api/order/userorders`,
        {},
        {
          headers: { token }
        }
      );

      console.log("MY ORDERS API RESPONSE:", response.data);

      if (response.data?.success) {
        const orders = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        setData(orders);
      } else {
        setData([]);
        setError(response.data?.message || "Unable to fetch your orders.");
      }

    } catch (err) {
      console.error("Error fetching orders:", err);

      setData([]);
      setError(
        err.response?.data?.message ||
        "Unable to fetch your orders. Please try again later."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setData([]);
      setLoading(false);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [token]);

  const getStatusColor = (status) => {
    const safeStatus = String(status || "pending").toLowerCase();

    switch (safeStatus) {
      case 'delivered':
        return 'status-delivered';

      case 'in transit':
        return 'status-transit';

      case 'processing':
        return 'status-processing';

      case 'cancelled':
        return 'status-cancelled';

      default:
        return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openTrackingPopup = (order) => {
    setSelectedOrder(order);
    setIsTrackingOpen(true);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!order?._id) return;

      try {
        const response = await axios.post(
          `${url}/api/order/userorders`,
          {},
          {
            headers: { token }
          }
        );

        if (response.data?.success) {
          const updatedOrders = Array.isArray(response.data.data)
            ? response.data.data
            : [];

          const updatedOrder = updatedOrders.find(
            (o) => o?._id === order._id
          );

          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
            setData(updatedOrders);
          }
        }

      } catch (error) {
        console.error("Error polling for order updates:", error);
      }

    }, 15000);
  };

  const closeTrackingPopup = () => {
    setIsTrackingOpen(false);
    setSelectedOrder(null);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const deliveredOrders = data.filter(
    (order) =>
      String(order?.status || "").toLowerCase() === 'delivered'
  );

  const activeOrders = data.filter((order) => {
    const status = String(order?.status || "").toLowerCase();

    return status !== 'delivered' && status !== 'cancelled';
  });

  return (
    <div className='my-orders-page'>

      <div className="orders-header">

        <div className="orders-title-section">
          <h1 className="my-orders-page-title">
            My Orders
          </h1>

          <p className="orders-subtitle">
            Track and manage your orders
          </p>
        </div>

        <div className="orders-stats">

          <div className="order-stat">
            <span className="stat-value">
              {data.length}
            </span>

            <span className="stat-label">
              Total Orders
            </span>
          </div>

          <div className="order-stat">
            <span className="stat-value">
              {deliveredOrders.length}
            </span>

            <span className="stat-label">
              Delivered
            </span>
          </div>

          <div className="order-stat">
            <span className="stat-value">
              {activeOrders.length}
            </span>

            <span className="stat-label">
              Active
            </span>
          </div>

        </div>
      </div>

      {loading ? (

        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading your orders...</p>
        </div>

      ) : error ? (

        <div className="error-container">
          <p className="error-message">
            {error}
          </p>

          <button
            className="retry-button"
            onClick={fetchOrders}
          >
            Try Again
          </button>
        </div>

      ) : data.length === 0 ? (

        <div className="empty-orders">

          <img
            src={assets.parcel_icon}
            alt="No orders"
            className="empty-icon"
          />

          <h3>No orders yet!</h3>

          <p>
            Your order history will appear here
          </p>

        </div>

      ) : (

        <div className="my-orders-page-container">

          {data.map((order, index) => {

            const items = Array.isArray(order?.items)
              ? order.items
              : [];

            const orderDate = formatDate(order?.createdAt);

            const status = order?.status || "Pending";

            return (

              <div
                key={order?._id || index}
                className="my-orders-page-order"
              >

                <div className="order-top">

                  <div className="order-header">

                    <div className="order-icon-wrapper">
                      <img
                        src={assets.parcel_icon}
                        alt=""
                        className="my-orders-page-order-icon"
                      />
                    </div>

                    <div className="order-details">

                      <div className="order-id">
                        Order #{order?._id?.substring(0, 8) || index + 1}
                      </div>

                      <div className="order-date">
                        {orderDate}
                      </div>

                    </div>

                  </div>

                  <div
                    className={`order-status ${getStatusColor(status)}`}
                  >

                    <span className="status-dot"></span>

                    <span className="status-text">
                      {status}
                    </span>

                  </div>

                </div>

                <div className="order-items-container">

                  <p className="my-orders-page-order-items">

                    {items.length > 0
                      ? items.map((item, itemIndex) => (
                          <React.Fragment
                            key={item?._id || itemIndex}
                          >
                            {item?.name || "Unknown Item"}
                            {" × "}
                            {item?.quantity || 0}

                            {itemIndex < items.length - 1
                              ? ", "
                              : ""}
                          </React.Fragment>
                        ))
                      : "No item details available"
                    }

                  </p>

                </div>

                <div className="order-footer">

                  <div className="order-info">

                    <p className="my-orders-page-order-amount">
                      ${Number(order?.amount || 0).toFixed(2)}
                    </p>

                    <p className="my-orders-page-order-count">
                      {items.length}{" "}
                      {items.length === 1
                        ? 'Item'
                        : 'Items'}
                    </p>

                  </div>

                  <button
                    className="my-orders-page-track-button"
                    onClick={() => openTrackingPopup(order)}
                  >

                    <i className="track-icon"></i>
                    Track Order

                  </button>

                </div>

              </div>

            );
          })}

        </div>

      )}

      {isTrackingOpen && selectedOrder && (

        <TrackingPopup
          isOpen={isTrackingOpen}
          onClose={closeTrackingPopup}
          order={selectedOrder}
        />

      )}

    </div>
  );
};

export default MyOrders;