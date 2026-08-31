import foodModel from '../models/foodModel.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

const SAFE_RANGES = ['today', '7d', '30d', 'thisMonth', 'month', '12m', 'all'];

const normalizeStatus = (status = '') => {
  const value = String(status || '').trim().toLowerCase();

  if (!value) return 'Pending';
  if (value.includes('cancel')) return 'Cancelled';
  if (value.includes('deliver')) return 'Delivered';
  if (value.includes('out') || value.includes('ready') || value.includes('pickup')) return 'Out for delivery';
  if (value.includes('processing')) return 'Food Processing';
  return 'Pending';
};

const getDateValue = (order) => order?.date || order?.createdAt || null;

const getOrderDate = (order) => {
  const value = getDateValue(order);
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isCancelledStatus = (status = '') => normalizeStatus(status) === 'Cancelled';

const isRevenueEligibleOrder = (order) => {
  if (!order || order.amount === undefined || order.amount === null) return false;

  const amount = Number(order.amount);
  if (!Number.isFinite(amount) || amount < 0) return false;
  if (isCancelledStatus(order.status)) return false;

  return true;
};

const getDateWindow = (range = 'all') => {
  const normalizedRange = SAFE_RANGES.includes(range) ? range : 'all';
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (normalizedRange === 'all') {
    return { start: null, end, range: normalizedRange };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (normalizedRange) {
    case 'today':
      return { start, end, range: normalizedRange };
    case '7d':
      start.setDate(now.getDate() - 6);
      return { start, end, range: normalizedRange };
    case '30d':
      start.setDate(now.getDate() - 29);
      return { start, end, range: normalizedRange };
    case 'thisMonth':
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start, end, range: normalizedRange };
    case '12m':
      start.setMonth(now.getMonth() - 11);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start, end, range: normalizedRange };
    default:
      return { start, end, range: normalizedRange };
  }
};

const getDateMatch = (range = 'all') => {
  const { start, end } = getDateWindow(range);

  if (!start) {
    return {};
  }

  return {
    $or: [
      { date: { $gte: start, $lte: end } },
      { createdAt: { $gte: start, $lte: end } },
    ],
  };
};

const getOrderListForRange = async (range = 'all') => {
  const dateMatch = getDateMatch(range);
  const orders = await orderModel.find(dateMatch).lean();
  return orders;
};

const buildRevenueTrend = async (range = 'all') => {
  const orders = await getOrderListForRange(range);
  const now = new Date();
  const filteredOrders = orders.filter((order) => isRevenueEligibleOrder(order) && getOrderDate(order));

  const makeKey = (date) => date.toISOString().slice(0, 10);

  if (range === 'today') {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      label: `${String(hour).padStart(2, '0')}:00`,
      revenue: 0,
    }));

    filteredOrders.forEach((order) => {
      const d = getOrderDate(order);
      if (!d) return;
      const hour = d.getHours();
      buckets[hour].revenue += Number(order.amount || 0);
    });

    return buckets;
  }

  if (range === '7d' || range === '30d' || range === 'month' || range === 'thisMonth' || range === '12m') {
    const bucketCount = range === '7d' ? 7 : range === '30d' ? 30 : 12;
    const buckets = [];

    for (let index = bucketCount - 1; index >= 0; index -= 1) {
      const bucketDate = new Date(now);

      if (range === '7d' || range === '30d') {
        bucketDate.setDate(now.getDate() - index);
        bucketDate.setHours(0, 0, 0, 0);
      } else {
        bucketDate.setMonth(now.getMonth() - index);
        bucketDate.setDate(1);
        bucketDate.setHours(0, 0, 0, 0);
      }

      const key = makeKey(bucketDate);
      buckets.push({
        label: range === '12m' || range === 'month' || range === 'thisMonth'
          ? bucketDate.toLocaleDateString('en-US', { month: 'short' })
          : bucketDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        key,
        revenue: 0,
      });
    }

    filteredOrders.forEach((order) => {
      const d = getOrderDate(order);
      if (!d) return;

      let matchKey = '';
      if (range === '7d' || range === '30d') {
        matchKey = makeKey(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      } else {
        matchKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      const bucket = buckets.find((item) => item.key === matchKey || item.label === d.toLocaleDateString('en-US', { month: 'short' }));
      if (!bucket) return;
      bucket.revenue += Number(order.amount || 0);
    });

    return buckets;
  }

  const monthlyMap = new Map();
  filteredOrders.forEach((order) => {
    const d = getOrderDate(order);
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyMap.set(key, { label, key, revenue: (monthlyMap.get(key)?.revenue || 0) + Number(order.amount || 0) });
  });

  return [...monthlyMap.values()].sort((a, b) => a.key.localeCompare(b.key));
};

const getStatusBreakdown = async (range = 'all') => {
  const orders = await getOrderListForRange(range);

  return Object.entries(
    orders.reduce((acc, order) => {
      const status = normalizeStatus(order?.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));
};

const getTopFoods = async (range = 'all') => {
  const orders = await getOrderListForRange(range);

  const map = new Map();

  orders.forEach((order) => {
    if (!Array.isArray(order.items)) return;
    order.items.forEach((item) => {
      const name = item?.name || 'Unknown Item';
      const quantity = Number(item?.quantity || 1);
      const price = Number(item?.price || 0);
      const current = map.get(name) || { name, orders: 0, revenue: 0 };
      current.orders += quantity;
      current.revenue += quantity * price;
      map.set(name, current);
    });
  });

  return [...map.values()].sort((a, b) => b.orders - a.orders || b.revenue - a.revenue).slice(0, 10);
};

const getRecentOrders = async (range = 'all') => {
  const orders = await getOrderListForRange(range);

  return orders
    .slice()
    .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
    .slice(0, 10)
    .map((order) => {
      const customerName = order.address?.firstName || order.address?.lastName
        ? `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim()
        : 'Guest';

      return {
        _id: order._id,
        customerName,
        date: order.date || order.createdAt,
        items: Array.isArray(order.items) ? order.items : [],
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
        totalAmount: Number(order.amount || 0),
        payment: Boolean(order.payment),
        status: normalizeStatus(order.status),
        userId: order.userId || null,
      };
    });
};

const getSummaryData = async (range = 'all') => {
  const orders = await getOrderListForRange(range);
  const filteredOrders = orders.filter((order) => isRevenueEligibleOrder(order));

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const completedOrders = orders.filter((order) => normalizeStatus(order.status) === 'Delivered').length;
  const pendingOrders = orders.filter((order) => normalizeStatus(order.status) === 'Pending').length;

  const statusCounts = {
    'Food Processing': orders.filter((order) => normalizeStatus(order.status) === 'Food Processing').length,
    'Out for delivery': orders.filter((order) => normalizeStatus(order.status) === 'Out for delivery').length,
    Delivered: orders.filter((order) => normalizeStatus(order.status) === 'Delivered').length,
    Cancelled: orders.filter((order) => normalizeStatus(order.status) === 'Cancelled').length,
    Pending: orders.filter((order) => normalizeStatus(order.status) === 'Pending').length,
  };

  const foodsCount = await foodModel.countDocuments();
  const totalCustomers = await userModel.countDocuments();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newUsersToday = await userModel.countDocuments({ createdAt: { $gte: startOfToday } });
  const newUsersThisMonth = await userModel.countDocuments({ createdAt: { $gte: monthStart } });

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalCustomers,
    totalUsers: totalCustomers,
    totalFoodItems: foodsCount,
    completedOrders,
    pendingOrders,
    statusCounts,
    newUsersToday,
    newUsersThisMonth,
    revenueToday: filteredOrders.filter((order) => {
      const date = getOrderDate(order);
      return date && date >= startOfToday;
    }).reduce((sum, order) => sum + Number(order.amount || 0), 0),
    revenueThisWeek: filteredOrders.filter((order) => {
      const date = getOrderDate(order);
      if (!date) return false;
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      return date >= weekAgo && date <= now;
    }).reduce((sum, order) => sum + Number(order.amount || 0), 0),
    revenueThisMonth: filteredOrders.filter((order) => {
      const date = getOrderDate(order);
      return date && date >= monthStart;
    }).reduce((sum, order) => sum + Number(order.amount || 0), 0),
  };
};

const getReportSummary = async (req, res) => {
  try {
    const range = String(req.query.range || 'all').toLowerCase();
    const selectedRange = SAFE_RANGES.includes(range) ? range : 'all';

    const [summary, revenueTrend, statusBreakdown, topFoods, recentOrders] = await Promise.all([
      getSummaryData(selectedRange),
      buildRevenueTrend(selectedRange),
      getStatusBreakdown(selectedRange),
      getTopFoods(selectedRange),
      getRecentOrders(selectedRange),
    ]);

    const responseData = {
      range: selectedRange,
      summary,
      revenueTrend,
      revenueData: revenueTrend,
      statusBreakdown,
      orderStatusData: statusBreakdown,
      topFoods,
      topFoodItems: topFoods,
      recentOrders,
      recentSales: recentOrders,
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Report summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load report data',
      data: {
        range: 'all',
        summary: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalUsers: 0,
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
        revenueData: [],
        statusBreakdown: [],
        orderStatusData: [],
        topFoods: [],
        topFoodItems: [],
        recentOrders: [],
        recentSales: [],
      },
    });
  }
};

export { getReportSummary };
