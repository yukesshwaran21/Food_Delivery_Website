/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import './Dashboard.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  FaArrowRight,
  FaBell,
  FaBoxOpen,
  FaChartLine,
  FaChevronDown,
  FaCheckDouble,
  FaClock,
  FaHamburger,
  FaPlus,
  FaRupeeSign,
  FaShoppingBag,
  FaTrash,
  FaUtensils,
} from 'react-icons/fa'
import { assets } from '../../assets/assets'

const filters = ['Weekly', 'Monthly', 'Yearly']
const statusOrder = ['Pending', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled']

const statusLabel = (status = '') => {
  const value = status.toLowerCase()
  if (value.includes('cancel')) return 'Cancelled'
  if (value.includes('deliver')) return 'Delivered'
  if (value.includes('processing')) return 'Processing'
  if (value.includes('pickup') || value.includes('ready') || value.includes('out')) return 'Out for Delivery'
  return 'Pending'
}

const orderDate = (order) => new Date(order.date || order.createdAt || Date.now())

const formatCurrency = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`

const Counter = ({ value, currency = false }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let frame
    const started = performance.now()
    const duration = 1400
    const animate = (now) => {
      const progress = Math.min((now - started) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <strong>{currency ? formatCurrency(count) : count.toLocaleString('en-IN')}</strong>
}

const useReveal = () => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.12 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, visible]
}

const Dashboard = ({ url }) => {
  const [orders, setOrders] = useState([])
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Weekly')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [analyticsRef, analyticsVisible] = useReveal()
  const [ordersRef, ordersVisible] = useReveal()
  const [popularRef, popularVisible] = useReveal()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersResponse, foodsResponse] = await Promise.all([
          axios.get(`${url}/api/order/list`),
          axios.get(`${url}/api/food/list`),
        ])
        if (!ordersResponse.data.success || !foodsResponse.data.success) throw new Error('Unable to load dashboard data')
        setOrders(ordersResponse.data.data || [])
        setFoods(foodsResponse.data.data || [])
      } catch (error) {
        toast.error('Unable to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [url])

  useEffect(() => {
    let active = true
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${url}/api/notification/list`)
        if (active && response.data.success) {
          setNotifications(response.data.data || [])
          setUnreadCount((response.data.data || []).filter((notification) => !notification.isRead).length)
        }
      } catch (error) {
        // Dashboard data remains usable when notifications are unavailable.
      }
    }
    fetchNotifications()
    const interval = window.setInterval(fetchNotifications, 15000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [url])

  const markNotificationRead = async (notification) => {
    if (notification.isRead) return
    try {
      await axios.post(`${url}/api/notification/${notification._id}/read`)
      setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, isRead: true } : item))
      setUnreadCount((current) => Math.max(0, current - 1))
    } catch (error) {
      toast.error('Unable to update notification')
    }
  }

  const markAllNotificationsRead = async () => {
    try {
      await axios.post(`${url}/api/notification/read-all`)
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      toast.error('Unable to update notifications')
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${url}/api/notification/${notificationId}`)
      setNotifications((current) => current.filter((notification) => notification._id !== notificationId))
      setUnreadCount((current) => notifications.find((notification) => notification._id === notificationId && !notification.isRead) ? Math.max(0, current - 1) : current)
    } catch (error) {
      toast.error('Unable to delete notification')
    }
  }

  const metrics = useMemo(() => ({
    totalOrders: orders.length,
    revenue: orders.reduce((total, order) => total + Number(order.amount || 0), 0),
    pending: orders.filter((order) => statusLabel(order.status) === 'Pending').length,
  }), [orders])

  const chartData = useMemo(() => {
    const now = new Date()
    const points = filter === 'Weekly' ? 7 : filter === 'Monthly' ? 5 : 6
    const buckets = Array.from({ length: points }, (_, index) => ({
      label: filter === 'Weekly'
        ? new Date(now.getTime() - (points - index - 1) * 86400000).toLocaleDateString('en-US', { weekday: 'short' })
        : filter === 'Monthly'
          ? `W${index + 1}`
          : new Date(now.getFullYear(), now.getMonth() - (points - index - 1), 1).toLocaleDateString('en-US', { month: 'short' }),
      value: 0,
    }))
    orders.forEach((order) => {
      const date = orderDate(order)
      let index = -1
      if (filter === 'Weekly') {
        index = Math.floor((date.setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400000) + points - 1
      } else if (filter === 'Monthly') {
        const age = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth()
        index = points - 1 - age
      } else {
        index = points - 1 - (now.getFullYear() - date.getFullYear())
      }
      if (index >= 0 && index < points) buckets[index].value += Number(order.amount || 0)
    })
    return buckets
  }, [filter, orders])

  const chartMax = Math.max(...chartData.map((item) => item.value), 1)
  const chartPoints = chartData.map((item, index) => `${(index / Math.max(chartData.length - 1, 1)) * 100},${92 - (item.value / chartMax) * 70}`).join(' ')

  const statusCounts = statusOrder.map((status) => ({
    status,
    count: orders.filter((order) => statusLabel(order.status) === status).length,
  }))
  const statusMax = Math.max(...statusCounts.map((item) => item.count), 1)
  const popularFoods = useMemo(() => {
    const sales = new Map()
    orders.forEach((order) => (order.items || []).forEach((item) => {
      const current = sales.get(item.name) || { name: item.name, orders: 0, revenue: 0 }
      current.orders += Number(item.quantity || 1)
      current.revenue += Number(item.price || 0) * Number(item.quantity || 1)
      sales.set(item.name, current)
    }))
    return [...sales.values()].sort((a, b) => b.orders - a.orders).slice(0, 4).map((item) => ({
      ...item,
      image: foods.find((food) => food.name === item.name)?.image,
    }))
  }, [orders, foods])
  const recentOrders = orders.slice().sort((a, b) => orderDate(b) - orderDate(a)).slice(0, 5)
  const getImageUrl = (image) => image?.startsWith('http') ? image : image ? `${url}/uploads/${image}` : ''

  const statCards = [
    { title: 'Total Orders', value: metrics.totalOrders, note: 'All orders received', icon: FaShoppingBag, className: 'blue' },
    { title: 'Total Revenue', value: metrics.revenue, note: 'Gross order value', icon: FaRupeeSign, className: 'mint', currency: true },
    { title: 'Food Items', value: foods.length, note: 'Active menu items', icon: FaUtensils, className: 'sky' },
    { title: 'Pending Orders', value: metrics.pending, note: 'Needs your attention', icon: FaClock, className: 'amber' },
  ]

  return (
    <main className="dashboard">
      <header className="dashboard-header dashboard-reveal">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Welcome back, Admin <span aria-hidden="true">👋</span></h1>
          <p className="dashboard-subtitle">Here&apos;s what&apos;s happening with your food delivery business today.</p>
        </div>
        <div className="header-tools">
          <span className="date-chip">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          <div className="notification-wrap">
            <button className="notification-button" aria-label="Notifications" onClick={() => setNotificationsOpen((current) => !current)}><FaBell />{unreadCount > 0 && <span className="unread-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
            {notificationsOpen && <div className="notification-panel" role="dialog" aria-label="Notifications">
              <div className="notification-panel-heading"><strong>Notifications</strong>{unreadCount > 0 && <button onClick={markAllNotificationsRead}><FaCheckDouble /> Mark all as read</button>}</div>
              {notifications.length === 0 ? <p className="notification-empty">No notifications yet</p> : <div className="notification-list">{notifications.map((notification) => <div className={`notification-item ${notification.isRead ? '' : 'unread'}`} key={notification._id} onClick={() => markNotificationRead(notification)}><div><strong>{notification.title}</strong><p>{notification.message}</p><span>{notification.customerName} · {formatCurrency(notification.amount)} · {new Date(notification.createdAt).toLocaleString()}</span></div><button className="notification-delete" aria-label="Delete notification" onClick={(event) => { event.stopPropagation(); deleteNotification(notification._id) }}><FaTrash /></button></div>)}</div>}
            </div>}
          </div>
          <img className="dashboard-avatar" src={assets.profile_image} alt="Admin profile" />
        </div>
      </header>

      <section className="stats-grid" aria-label="Business statistics">
        {statCards.map(({ title, value, note, icon: Icon, className, currency }, index) => (
          <article className={`stat-card ${className}`} style={{ '--delay': `${index * 280}ms` }} key={title}>
            <div className="stat-icon"><Icon /></div>
            <div><p>{title}</p>{loading ? <div className="skeleton stat-skeleton" /> : <Counter value={value} currency={currency} />}<span>{note}</span></div>
            <FaArrowRight className="stat-arrow" />
          </article>
        ))}
      </section>

      <section ref={analyticsRef} className={`analytics-grid reveal-section ${analyticsVisible ? 'is-visible' : ''}`}>
        <article className="panel revenue-panel">
          <div className="panel-heading"><div><p className="eyebrow">Performance</p><h2>Revenue Overview</h2></div><div className="filter-group">{filters.map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div></div>
          {loading ? <div className="skeleton chart-skeleton" /> : <div className="chart-wrap"><div className="chart-y-labels"><span>{formatCurrency(chartMax)}</span><span>{formatCurrency(chartMax / 2)}</span><span>₹0</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart" role="img" aria-label={`${filter} revenue chart`}><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3b82f6" stopOpacity=".24" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs><polyline points={`0,92 ${chartPoints} 100,92`} fill="url(#chartFill)" stroke="none" /><polyline points={chartPoints} fill="none" stroke="#2563eb" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="chart-line" />{chartData.map((item, index) => { const x = (index / Math.max(chartData.length - 1, 1)) * 100; const y = 92 - (item.value / chartMax) * 70; return <circle key={item.label} cx={x} cy={y} r="1.8" className="chart-dot" onMouseEnter={() => setTooltip({ x, y, ...item })} onMouseLeave={() => setTooltip(null)} /> })}{tooltip && <g className="chart-tooltip" transform={`translate(${tooltip.x},${tooltip.y - 8})`}><rect x="-15" y="-9" width="30" height="7" rx="2" /><text x="0" y="-4" textAnchor="middle">{formatCurrency(tooltip.value)}</text></g>}</svg><div className="chart-x-labels">{chartData.map((item) => <span key={item.label}>{item.label}</span>)}</div></div>}
        </article>
        <article className="panel status-panel"><div className="panel-heading"><div><p className="eyebrow">Live pulse</p><h2>Order Status</h2></div><FaChartLine className="panel-icon" /></div><div className="status-list">{statusCounts.map(({ status, count }, index) => <div className="status-row" style={{ '--row-delay': `${index * 90}ms` }} key={status}><div className="status-row-label"><span className={`status-dot ${status.toLowerCase().replaceAll(' ', '-')}`} />{status}<b>{count}</b></div><div className="status-track"><span style={{ width: `${(count / statusMax) * 100}%` }} /></div></div>)}</div></article>
      </section>

      <section ref={ordersRef} className={`content-grid reveal-section ${ordersVisible ? 'is-visible' : ''}`}>
        <article className="panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent Orders</h2></div><a href="/orders" className="text-link">View all orders <FaArrowRight /></a></div>{loading ? <div className="table-skeleton">{[1, 2, 3].map((item) => <div className="skeleton" key={item} />)}</div> : recentOrders.length === 0 ? <EmptyState message="No orders available yet" action="View orders" href="/orders" /> : <div className="orders-table-wrap"><table><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>{recentOrders.map((order) => <tr key={order._id}><td className="order-id">#{String(order._id || '').slice(-6).toUpperCase()}</td><td>{order.address?.firstName || 'Guest'} {order.address?.lastName || ''}</td><td>{(order.items || []).length} items</td><td className="amount">{formatCurrency(order.amount)}</td><td><span className={`status-badge ${statusLabel(order.status).toLowerCase().replaceAll(' ', '-')}`}>{statusLabel(order.status)}</span></td><td>{orderDate(order).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td><td><FaChevronDown className="row-action" /></td></tr>)}</tbody></table></div>}</article>
        <article ref={popularRef} className={`panel popular-panel reveal-section ${popularVisible ? 'is-visible' : ''}`}><div className="panel-heading"><div><p className="eyebrow">Menu spotlight</p><h2>Top Selling Food Items</h2></div><FaHamburger className="panel-icon" /></div>{loading ? <div className="food-skeletons">{[1, 2, 3].map((item) => <div className="skeleton" key={item} />)}</div> : popularFoods.length === 0 ? <EmptyState message="Your best sellers will appear here" action="Add food item" href="/add" /> : <div className="popular-list">{popularFoods.map((food) => <div className="popular-item" key={food.name}><div className="food-image-wrap">{food.image ? <img src={getImageUrl(food.image)} alt={food.name} /> : <FaUtensils />}</div><div className="popular-copy"><b>{food.name}</b><span>{food.orders} orders</span></div><strong>{formatCurrency(food.revenue)}</strong></div>)}</div>}</article>
      </section>

      <section className="quick-actions dashboard-reveal"><div><p className="eyebrow">Move faster</p><h2>Quick actions</h2></div><div className="action-buttons"><a href="/add"><FaPlus /> Add new food item</a><a href="/orders"><FaBoxOpen /> View orders</a><a href="/list"><FaUtensils /> Manage food items</a></div></section>
    </main>
  )
}

const EmptyState = ({ message, action, href }) => <div className="empty-state"><FaBoxOpen /><p>{message}</p><a href={href}>{action} <FaArrowRight /></a></div>

export default Dashboard
