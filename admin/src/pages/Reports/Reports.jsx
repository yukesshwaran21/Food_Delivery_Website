import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiBarChart2, FiBox, FiCalendar, FiCheckCircle, FiClock, FiDollarSign, FiUsers } from 'react-icons/fi';
import './Reports.css';

const dateOptions = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'month', label: 'This Month' },
  { value: '12m', label: 'Last 12 Months' },
  { value: 'all', label: 'All Time' },
];

const statusPalette = [
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#22c55e',
  '#ef4444',
];

const statusLabels = [
  'Food Processing',
  'Out for delivery',
  'Pending',
  'Delivered',
  'Cancelled',
];

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatCompactCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const normalizeStatus = (status = '') => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'Pending';
  if (value.includes('cancel')) return 'Cancelled';
  if (value.includes('deliver')) return 'Delivered';
  if (value.includes('out')) return 'Out for delivery';
  if (value.includes('processing')) return 'Food Processing';
  return 'Pending';
};

const Reports = ({ url }) => {
  const [range, setRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalFoodItems: 0,
      completedOrders: 0,
      pendingOrders: 0,
      statusCounts: {
        'Food Processing': 0,
        'Out for delivery': 0,
        Delivered: 0,
        Cancelled: 0,
        Pending: 0,
      },
      newUsersToday: 0,
      newUsersThisMonth: 0,
      revenueToday: 0,
      revenueThisWeek: 0,
      revenueThisMonth: 0,
    },
    revenueTrend: [],
    statusBreakdown: [],
    topFoods: [],
    recentOrders: [],
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${url}/api/report/summary`, { params: { range } });
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to load report data');
        }
        setReport(response.data.data || {
          summary: {},
          revenueTrend: [],
          statusBreakdown: [],
          topFoods: [],
          recentOrders: [],
        });
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || fetchError.message || 'Unable to load report data.');
        setReport({
          summary: {
            totalRevenue: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalFoodItems: 0,
            completedOrders: 0,
            pendingOrders: 0,
            statusCounts: {
              'Food Processing': 0,
              'Out for delivery': 0,
              Delivered: 0,
              Cancelled: 0,
              Pending: 0,
            },
            newUsersToday: 0,
            newUsersThisMonth: 0,
            revenueToday: 0,
            revenueThisWeek: 0,
            revenueThisMonth: 0,
          },
          revenueTrend: [],
          statusBreakdown: [],
          topFoods: [],
          recentOrders: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [range, url]);

  const overviewCards = useMemo(() => [
    { label: 'Total Revenue', value: formatCurrency(report.summary.totalRevenue), icon: FiDollarSign, tone: 'blue' },
    { label: 'Total Orders', value: Number(report.summary.totalOrders || 0).toLocaleString('en-IN'), icon: FiBox, tone: 'orange' },
    { label: 'Total Customers', value: Number(report.summary.totalCustomers || 0).toLocaleString('en-IN'), icon: FiUsers, tone: 'green' },
    { label: 'Total Food Items', value: Number(report.summary.totalFoodItems || 0).toLocaleString('en-IN'), icon: FiBarChart2, tone: 'purple' },
    { label: 'Completed Orders', value: Number(report.summary.completedOrders || 0).toLocaleString('en-IN'), icon: FiCheckCircle, tone: 'mint' },
    { label: 'Pending Orders', value: Number(report.summary.pendingOrders || 0).toLocaleString('en-IN'), icon: FiClock, tone: 'amber' },
  ], [report.summary]);

  const revenueChartData = useMemo(() => {
    const data = Array.isArray(report.revenueTrend) ? report.revenueTrend : [];
    return data.length ? data.map((item) => ({
      name: item.label || item._id || 'N/A',
      revenue: Number(item.revenue || 0),
    })) : [];
  }, [report.revenueTrend]);

  const statusChartData = useMemo(() => {
    const data = Array.isArray(report.statusBreakdown) ? report.statusBreakdown : [];
    const normalized = data.length ? data.map((item) => ({
      name: item.name || normalizeStatus(item._id),
      value: Number(item.count || 0),
    })) : statusLabels.map((status) => ({ name: status, value: Number(report.summary.statusCounts?.[status] || 0) }));

    return normalized.filter((entry) => Number(entry.value) > 0).length ? normalized.filter((entry) => Number(entry.value) > 0) : [
      { name: 'No orders', value: 1 },
    ];
  }, [report.statusBreakdown, report.summary.statusCounts]);

  const topFoods = Array.isArray(report.topFoods) ? report.topFoods : [];
  const recentOrders = Array.isArray(report.recentOrders) ? report.recentOrders : [];

  return (
    <main className="reports-page">
      <header className="reports-header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Reports Dashboard</h1>
        </div>

        <div className="reports-filters">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={range === option.value ? 'active' : ''}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="reports-error">
          <FiCalendar />
          <span>{error}</span>
        </div>
      )}

      <section className="reports-grid overview-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="report-card report-card-skeleton">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))
          : overviewCards.map((card, index) => (
              <div key={card.label} className={`report-card ${card.tone}`} style={{ animationDelay: `${index * 80}ms` }}>
                <div className="report-card-icon">
                  <card.icon />
                </div>
                <div>
                  <p>{card.label}</p>
                  <h3>{card.value}</h3>
                </div>
              </div>
            ))}
      </section>

      <section className="report-panel-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Revenue</p>
            <h2>Revenue Analytics</h2>
          </div>
        </div>

        <div className="revenue-summary-grid">
          <div className="mini-stat">
            <span>Today</span>
            <strong>{formatCurrency(report.summary.revenueToday)}</strong>
          </div>
          <div className="mini-stat">
            <span>This Week</span>
            <strong>{formatCurrency(report.summary.revenueThisWeek)}</strong>
          </div>
          <div className="mini-stat">
            <span>This Month</span>
            <strong>{formatCurrency(report.summary.revenueThisMonth)}</strong>
          </div>
          <div className="mini-stat">
            <span>Total</span>
            <strong>{formatCurrency(report.summary.totalRevenue)}</strong>
          </div>
        </div>

        <div className="chart-card">
          {loading ? (
            <div className="chart-placeholder">Loading revenue trends...</div>
          ) : revenueChartData.length === 0 ? (
            <div className="chart-placeholder">No revenue data available for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#revenueFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="report-grid-two">
        <div className="report-panel-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Orders</p>
              <h2>Order Status</h2>
            </div>
          </div>

          <div className="status-stats-list">
            {[
              { label: 'Total Orders', value: Number(report.summary.totalOrders || 0) },
              { label: 'Pending Orders', value: Number(report.summary.statusCounts?.Pending || report.summary.pendingOrders || 0) },
              { label: 'Processing Orders', value: Number(report.summary.statusCounts?.['Food Processing'] || 0) },
              { label: 'Out for Delivery Orders', value: Number(report.summary.statusCounts?.['Out for delivery'] || 0) },
              { label: 'Delivered Orders', value: Number(report.summary.statusCounts?.Delivered || report.summary.completedOrders || 0) },
              { label: 'Cancelled Orders', value: Number(report.summary.statusCounts?.Cancelled || 0) },
            ].map((item) => (
              <div className="status-stat-row" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="chart-card small-chart">
            {loading ? (
              <div className="chart-placeholder">Loading order distribution...</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={statusPalette[index % statusPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} orders`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="report-panel-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Customers</p>
              <h2>Customer Report</h2>
            </div>
          </div>

          <div className="customer-summary">
            <div className="customer-stat">
              <span>Total Registered Users</span>
              <strong>{Number(report.summary.totalCustomers || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="customer-stat">
              <span>New Users Today</span>
              <strong>{Number(report.summary.newUsersToday || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="customer-stat">
              <span>New Users This Month</span>
              <strong>{Number(report.summary.newUsersThisMonth || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="panel-header secondary-heading">
            <div>
              <p className="eyebrow">Best sellers</p>
              <h2>Top Food Items</h2>
            </div>
          </div>

          <div className="top-foods-list">
            {loading ? (
              <div className="chart-placeholder">Loading top sellers...</div>
            ) : topFoods.length === 0 ? (
              <div className="empty-state-box">No sales recorded for this time period.</div>
            ) : (
              topFoods.slice(0, 5).map((food, index) => (
                <div className="food-rank-row" key={`${food.name}-${index}`}>
                  <div className="food-rank-label">
                    <span className="food-rank">#{index + 1}</span>
                    <span>{food.name}</span>
                  </div>
                  <div className="food-rank-metrics">
                    <strong>{food.orders} orders</strong>
                    <small>{formatCompactCurrency(food.revenue)}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="report-panel-panel sales-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Sales</p>
            <h2>Best Selling Food Items</h2>
          </div>
        </div>

        <div className="chart-card">
          {loading ? (
            <div className="chart-placeholder">Loading sales analytics...</div>
          ) : topFoods.length === 0 ? (
            <div className="chart-placeholder">No food sales available yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topFoods.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => `${value} orders`} />
                <Bar dataKey="orders" fill="#14b8a6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="report-panel-panel recent-orders-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Latest</p>
            <h2>Recent Sales</h2>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="chart-placeholder">Loading recent orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="empty-state-box">No recent sales to show.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id || Math.random()}>
                    <td>#{String(order._id || '').slice(-6).toUpperCase()}</td>
                    <td>{order.customerName || 'Guest'}</td>
                    <td>{formatDate(order.date || order.createdAt)}</td>
                    <td>{Number(order.itemCount || (Array.isArray(order.items) ? order.items.length : 0))}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`status-pill ${order.payment ? 'paid' : 'pending'}`}>
                        {order.payment ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${normalizeStatus(order.status).toLowerCase().replace(/\s+/g, '-')}`}>
                        {normalizeStatus(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
};

export default Reports;
