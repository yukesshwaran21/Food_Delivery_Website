import foodModel from '../models/foodModel.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const padZero = (num, length = 2) => String(num).padStart(length, '0');

const getDaysInMonth = (year, month) => {
  // month is 1-indexed (1 to 12)
  return new Date(year, month, 0).getDate();
};

const normalizeStatus = (status = '') => {
  const value = String(status || '').trim().toLowerCase();

  if (!value) return 'Pending';
  if (value.includes('cancel')) return 'Cancelled';
  if (value.includes('deliver')) return 'Delivered';
  if (value.includes('out') || value.includes('ready') || value.includes('pickup')) return 'Out for delivery';
  if (value.includes('processing') || value.includes('confirm')) return 'Food Processing';
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

  // Paid orders or successfully delivered orders count towards revenue
  return Boolean(order.payment) || normalizeStatus(order.status) === 'Delivered';
};

const formatReadableDate = (dateObj) => {
  const day = padZero(dateObj.getDate());
  const monthName = MONTH_NAMES[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${monthName} ${year}`;
};

const formatShortDate = (dateObj) => {
  const day = padZero(dateObj.getDate());
  const monthShort = MONTH_SHORT[dateObj.getMonth()];
  return `${monthShort} ${day}`;
};

/**
 * Parses and computes exact Start-of-Day (00:00:00.000) and End-of-Day (23:59:59.999)
 * for the 4 custom report modes:
 * 1. Single Day: date=YYYY-MM-DD
 * 2. Custom Date Range: startDate=YYYY-MM-DD & endDate=YYYY-MM-DD
 * 3. Week of a Month: month=1..12 & year=YYYY & week=1..5
 * 4. Complete Month: month=1..12 & year=YYYY
 */
const parseDateBounds = (query = {}) => {
  const {
    reportType,
    range,
    date,
    startDate,
    endDate,
    month,
    year,
    week
  } = query;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const mode = String(reportType || range || '').trim().toLowerCase();

  // -------------------------------------------------------------
  // 1. SINGLE DAY REPORT (reportType === 'singleday' or query.date provided)
  // -------------------------------------------------------------
  const singleDateStr = date || (mode === 'singleday' || mode === 'specificdate' || mode === 'customdate' ? query.date : null);
  if (mode === 'singleday' || (singleDateStr && /^\d{4}-\d{2}-\d{2}$/.test(singleDateStr))) {
    let yr = currentYear;
    let mo = currentMonth;
    let da = now.getDate();

    if (singleDateStr && /^\d{4}-\d{2}-\d{2}$/.test(singleDateStr)) {
      const parts = singleDateStr.split('-').map(Number);
      yr = parts[0];
      mo = parts[1];
      da = parts[2];
    }

    const start = new Date(yr, mo - 1, da, 0, 0, 0, 0);
    const end = new Date(yr, mo - 1, da, 23, 59, 59, 999);
    const dateFormatted = formatReadableDate(start);

    return {
      mode: 'singleDay',
      range: 'singleDay',
      start,
      end,
      date: `${yr}-${padZero(mo)}-${padZero(da)}`,
      label: `Single Day (${dateFormatted})`,
      formattedPeriod: dateFormatted,
      pdfTitle: `Report Period: ${dateFormatted}`
    };
  }

  // -------------------------------------------------------------
  // 2. CUSTOM DATE RANGE REPORT (reportType === 'customrange' or startDate & endDate provided)
  // -------------------------------------------------------------
  const sStr = startDate || query.startDate;
  const eStr = endDate || query.endDate;
  if (mode === 'customrange' || (sStr && eStr && /^\d{4}-\d{2}-\d{2}$/.test(sStr) && /^\d{4}-\d{2}-\d{2}$/.test(eStr))) {
    let [sYr, sMo, sDa] = (sStr || '').split('-').map(Number);
    let [eYr, eMo, eDa] = (eStr || '').split('-').map(Number);

    if (!sYr || !sMo || !sDa) {
      sYr = currentYear;
      sMo = currentMonth;
      sDa = 1;
    }
    if (!eYr || !eMo || !eDa) {
      eYr = currentYear;
      eMo = currentMonth;
      eDa = now.getDate();
    }

    let start = new Date(sYr, sMo - 1, sDa, 0, 0, 0, 0);
    let end = new Date(eYr, eMo - 1, eDa, 23, 59, 59, 999);

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    const sFormatted = formatReadableDate(start);
    const eFormatted = formatReadableDate(end);

    return {
      mode: 'customRange',
      range: 'customRange',
      start,
      end,
      startDate: `${start.getFullYear()}-${padZero(start.getMonth() + 1)}-${padZero(start.getDate())}`,
      endDate: `${end.getFullYear()}-${padZero(end.getMonth() + 1)}-${padZero(end.getDate())}`,
      label: `Custom Range (${sFormatted} - ${eFormatted})`,
      formattedPeriod: `${sFormatted} - ${eFormatted}`,
      pdfTitle: `Report Period: ${sFormatted} - ${eFormatted}`
    };
  }

  // -------------------------------------------------------------
  // 3. WEEK REPORT INSIDE A SELECTED MONTH (reportType === 'week' or week parameter present)
  // -------------------------------------------------------------
  if (mode === 'week' || (week !== undefined && week !== null && week !== '')) {
    const selYear = Number(year) || currentYear;
    const selMonth = Math.min(12, Math.max(1, Number(month) || currentMonth));
    const selWeek = Math.min(5, Math.max(1, Number(week) || 1));
    const daysInMonth = getDaysInMonth(selYear, selMonth);

    let startDay = 1;
    let endDay = 7;

    if (selWeek === 1) {
      startDay = 1;
      endDay = 7;
    } else if (selWeek === 2) {
      startDay = 8;
      endDay = 14;
    } else if (selWeek === 3) {
      startDay = 15;
      endDay = 21;
    } else if (selWeek === 4) {
      startDay = 22;
      endDay = 28;
    } else if (selWeek === 5) {
      startDay = 29;
      endDay = Math.max(29, daysInMonth);
    }

    // Clamp if month has fewer days than startDay
    if (startDay > daysInMonth) {
      startDay = Math.max(1, daysInMonth - 6);
      endDay = daysInMonth;
    } else {
      endDay = Math.min(endDay, daysInMonth);
    }

    const start = new Date(selYear, selMonth - 1, startDay, 0, 0, 0, 0);
    const end = new Date(selYear, selMonth - 1, endDay, 23, 59, 59, 999);

    const sFormatted = formatReadableDate(start);
    const eFormatted = formatReadableDate(end);
    const monthName = MONTH_NAMES[selMonth - 1];

    return {
      mode: 'week',
      range: 'week',
      start,
      end,
      year: selYear,
      month: selMonth,
      week: selWeek,
      startDay,
      endDay,
      label: `Week ${selWeek}, ${monthName} ${selYear} (${sFormatted} - ${eFormatted})`,
      formattedPeriod: `Week ${selWeek}, ${monthName} ${selYear} (${sFormatted} - ${eFormatted})`,
      pdfTitle: `Report Period: Week ${selWeek}, ${monthName} ${selYear} (${sFormatted} - ${eFormatted})`
    };
  }

  // -------------------------------------------------------------
  // 4. COMPLETE MONTH REPORT (reportType === 'month' or month & year present without week)
  // -------------------------------------------------------------
  if (mode === 'month' || (month !== undefined && month !== null && month !== '')) {
    const selYear = Number(year) || currentYear;
    const selMonth = Math.min(12, Math.max(1, Number(month) || currentMonth));
    const daysInMonth = getDaysInMonth(selYear, selMonth);

    const start = new Date(selYear, selMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(selYear, selMonth - 1, daysInMonth, 23, 59, 59, 999);

    const sFormatted = formatReadableDate(start);
    const eFormatted = formatReadableDate(end);
    const monthName = MONTH_NAMES[selMonth - 1];

    return {
      mode: 'month',
      range: 'month',
      start,
      end,
      year: selYear,
      month: selMonth,
      daysInMonth,
      label: `${monthName} ${selYear} (${sFormatted} - ${eFormatted})`,
      formattedPeriod: `${monthName} ${selYear} (${sFormatted} - ${eFormatted})`,
      pdfTitle: `Report Period: ${monthName} ${selYear} (${sFormatted} - ${eFormatted})`
    };
  }

  // -------------------------------------------------------------
  // Named Range Fallbacks (e.g. today, 2d, 7d, 30d, 12m, all)
  // -------------------------------------------------------------
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (mode) {
    case 'today': {
      const todayFormatted = formatReadableDate(todayStart);
      return {
        mode: 'singleDay',
        range: 'today',
        start: todayStart,
        end: todayEnd,
        label: `Today (${todayFormatted})`,
        formattedPeriod: todayFormatted,
        pdfTitle: `Report Period: ${todayFormatted}`
      };
    }
    case '2d':
    case 'last2days': {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 1);
      const sFmt = formatReadableDate(start);
      const eFmt = formatReadableDate(todayEnd);
      return {
        mode: 'customRange',
        range: '2d',
        start,
        end: todayEnd,
        label: `Last 2 Days (${sFmt} - ${eFmt})`,
        formattedPeriod: `${sFmt} - ${eFmt}`,
        pdfTitle: `Report Period: ${sFmt} - ${eFmt}`
      };
    }
    case '7d':
    case 'last7days': {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 6);
      const sFmt = formatReadableDate(start);
      const eFmt = formatReadableDate(todayEnd);
      return {
        mode: 'customRange',
        range: '7d',
        start,
        end: todayEnd,
        label: `Last 7 Days (${sFmt} - ${eFmt})`,
        formattedPeriod: `${sFmt} - ${eFmt}`,
        pdfTitle: `Report Period: ${sFmt} - ${eFmt}`
      };
    }
    case '30d':
    case 'last30days': {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 29);
      const sFmt = formatReadableDate(start);
      const eFmt = formatReadableDate(todayEnd);
      return {
        mode: 'customRange',
        range: '30d',
        start,
        end: todayEnd,
        label: `Last 30 Days (${sFmt} - ${eFmt})`,
        formattedPeriod: `${sFmt} - ${eFmt}`,
        pdfTitle: `Report Period: ${sFmt} - ${eFmt}`
      };
    }
    case '12m': {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
      const sFmt = formatReadableDate(start);
      const eFmt = formatReadableDate(todayEnd);
      return {
        mode: 'customRange',
        range: '12m',
        start,
        end: todayEnd,
        label: `Last 12 Months (${sFmt} - ${eFmt})`,
        formattedPeriod: `${sFmt} - ${eFmt}`,
        pdfTitle: `Report Period: ${sFmt} - ${eFmt}`
      };
    }
    case 'all':
    default: {
      return {
        mode: 'all',
        range: 'all',
        start: null,
        end: todayEnd,
        label: 'All Time',
        formattedPeriod: 'All Time',
        pdfTitle: 'Report Period: All Time'
      };
    }
  }
};

const getDateMatch = (start, end) => {
  if (!start && !end) return {};

  if (start && end) {
    return {
      $or: [
        { createdAt: { $gte: start, $lte: end } },
        { date: { $gte: start, $lte: end } },
      ],
    };
  }

  if (start) {
    return {
      $or: [
        { createdAt: { $gte: start } },
        { date: { $gte: start } },
      ],
    };
  }

  return {
    $or: [
      { createdAt: { $lte: end } },
      { date: { $lte: end } },
    ],
  };
};

const makeDateKey = (d) => `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;

/**
 * Builds dynamic revenue trend charts tailored to the exact period mode:
 * 1. Single Day: 24 hourly buckets (00:00 - 23:00)
 * 2. Week: Daily buckets for each day of that specific week (e.g. Day 1..7 or 29..31)
 * 3. Complete Month: Daily buckets (Day 1..31)
 * 4. Custom Range: Daily buckets if <= 31 days, otherwise Monthly buckets
 */
const buildRevenueTrend = (orders, dateBounds) => {
  const { mode, start, end } = dateBounds;
  const filteredOrders = orders.filter((order) => isRevenueEligibleOrder(order) && getOrderDate(order));

  // 1. Single Day (24 Hourly Buckets)
  if (mode === 'singleDay' || (!start && !end)) {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      name: `${padZero(hour)}:00`,
      label: `${padZero(hour)}:00`,
      hour,
      revenue: 0,
      orders: 0,
    }));

    filteredOrders.forEach((order) => {
      const d = getOrderDate(order);
      if (!d) return;
      const hour = d.getHours();
      if (hour >= 0 && hour < 24) {
        buckets[hour].revenue += Number(order.amount || 0);
        buckets[hour].orders += 1;
      }
    });

    return buckets;
  }

  // 2. Week or Complete Month or Custom Range <= 31 days (Daily Buckets)
  if (start && end) {
    const dayDifference = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDifference <= 35) {
      const buckets = [];
      const cur = new Date(start);

      while (cur <= end) {
        const key = makeDateKey(cur);
        const name = formatShortDate(cur);
        buckets.push({
          name,
          label: name,
          key,
          revenue: 0,
          orders: 0,
        });
        cur.setDate(cur.getDate() + 1);
      }

      filteredOrders.forEach((order) => {
        const d = getOrderDate(order);
        if (!d) return;
        const key = makeDateKey(d);
        const bucket = buckets.find((b) => b.key === key);
        if (bucket) {
          bucket.revenue += Number(order.amount || 0);
          bucket.orders += 1;
        }
      });

      return buckets;
    }
  }

  // 3. Multi-Month Custom Range or All Time (Monthly Buckets)
  const monthlyMap = new Map();

  // If explicit start and end provided, initialize monthly buckets
  if (start && end) {
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${padZero(cur.getMonth() + 1)}`;
      const name = `${MONTH_SHORT[cur.getMonth()]} ${String(cur.getFullYear()).slice(-2)}`;
      monthlyMap.set(key, { name, label: name, key, revenue: 0, orders: 0 });
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  filteredOrders.forEach((order) => {
    const d = getOrderDate(order);
    if (!d) return;
    const key = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}`;
    const name = `${MONTH_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
    const current = monthlyMap.get(key) || { name, label: name, key, revenue: 0, orders: 0 };
    current.revenue += Number(order.amount || 0);
    current.orders += 1;
    monthlyMap.set(key, current);
  });

  const sortedMonthly = [...monthlyMap.values()].sort((a, b) => a.key.localeCompare(b.key));
  if (sortedMonthly.length > 0) return sortedMonthly;

  // Fallback 6 months if empty
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      name: MONTH_SHORT[d.getMonth()],
      label: MONTH_SHORT[d.getMonth()],
      key: `${d.getFullYear()}-${padZero(d.getMonth() + 1)}`,
      revenue: 0,
      orders: 0,
    };
  });
};

const getStatusBreakdown = (orders) => {
  const counts = orders.reduce((acc, order) => {
    const status = normalizeStatus(order?.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const standardStatuses = ['Food Processing', 'Out for delivery', 'Delivered', 'Cancelled', 'Pending'];
  return standardStatuses.map((name) => ({
    name,
    count: counts[name] || 0,
    value: counts[name] || 0,
  }));
};

const getTopFoods = (orders) => {
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

const getReportSummary = async (req, res) => {
  try {
    const dateBounds = parseDateBounds(req.query);
    const dateMatch = getDateMatch(dateBounds.start, dateBounds.end);

    // 1. Fetch filtered orders from MongoDB
    const orders = await orderModel.find(dateMatch).sort({ createdAt: -1, date: -1 }).lean();

    // 2. Fetch Customer and Food totals
    const [totalCustomersCount, newCustomersCount, totalFoodItemsCount] = await Promise.all([
      userModel.countDocuments(),
      dateBounds.start
        ? userModel.countDocuments({ createdAt: { $gte: dateBounds.start, $lte: dateBounds.end } })
        : userModel.countDocuments(),
      foodModel.countDocuments(),
    ]);

    // 3. Compute Metrics
    const eligibleOrders = orders.filter((order) => isRevenueEligibleOrder(order));
    const totalRevenue = eligibleOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((order) => normalizeStatus(order.status) === 'Delivered').length;
    const cancelledOrders = orders.filter((order) => normalizeStatus(order.status) === 'Cancelled').length;
    const pendingOrders = orders.filter((order) => {
      const st = normalizeStatus(order.status);
      return st !== 'Delivered' && st !== 'Cancelled';
    }).length;

    const totalItemsSold = orders.reduce((sum, order) => {
      if (!Array.isArray(order.items)) return sum;
      return sum + order.items.reduce((iSum, item) => iSum + Number(item?.quantity || 1), 0);
    }, 0);

    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const statusCounts = {
      'Food Processing': orders.filter((order) => normalizeStatus(order.status) === 'Food Processing').length,
      'Out for delivery': orders.filter((order) => normalizeStatus(order.status) === 'Out for delivery').length,
      Delivered: completedOrders,
      Cancelled: cancelledOrders,
      Pending: orders.filter((order) => normalizeStatus(order.status) === 'Pending').length,
    };

    // Sub-period metrics for quick comparison
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const revenueToday = eligibleOrders.filter((order) => {
      const d = getOrderDate(order);
      return d && d >= startOfToday;
    }).reduce((sum, order) => sum + Number(order.amount || 0), 0);

    const revenueThisWeek = eligibleOrders.filter((order) => {
      const d = getOrderDate(order);
      return d && d >= weekAgo;
    }).reduce((sum, order) => sum + Number(order.amount || 0), 0);

    const revenueThisMonth = eligibleOrders.filter((order) => {
      const d = getOrderDate(order);
      return d && d >= monthStart;
    }).reduce((sum, order) => sum + Number(order.amount || 0), 0);

    // 4. Build trends and breakdown
    const revenueTrend = buildRevenueTrend(orders, dateBounds);
    const statusBreakdown = getStatusBreakdown(orders);
    const topFoods = getTopFoods(orders);

    // 5. Format order details
    const formattedOrders = orders.map((order) => {
      const customerName = order.address?.firstName || order.address?.lastName
        ? `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim()
        : 'Guest';

      const isPaid = Boolean(order.payment);

      return {
        _id: order._id,
        orderId: String(order._id),
        customerName,
        date: order.date || order.createdAt,
        createdAt: order.createdAt || order.date,
        items: Array.isArray(order.items) ? order.items : [],
        itemCount: Array.isArray(order.items)
          ? order.items.reduce((acc, it) => acc + Number(it?.quantity || 1), 0)
          : 0,
        amount: Number(order.amount || 0),
        totalAmount: Number(order.amount || 0),
        payment: isPaid,
        paymentStatus: isPaid ? 'Paid' : 'Pending',
        status: normalizeStatus(order.status),
        rawStatus: order.status,
        address: order.address || {},
      };
    });

    const summary = {
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalCustomers: totalCustomersCount,
      totalUsers: totalCustomersCount,
      newCustomers: newCustomersCount,
      newUsersToday: newCustomersCount,
      newUsersThisMonth: newCustomersCount,
      averageOrderValue,
      totalItemsSold,
      totalFoodItems: totalFoodItemsCount,
      statusCounts,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
    };

    const responseData = {
      mode: dateBounds.mode,
      range: dateBounds.range,
      dateRange: {
        mode: dateBounds.mode,
        range: dateBounds.range,
        startDate: dateBounds.start ? dateBounds.start.toISOString().slice(0, 10) : null,
        endDate: dateBounds.end ? dateBounds.end.toISOString().slice(0, 10) : null,
        label: dateBounds.label,
        formattedPeriod: dateBounds.formattedPeriod,
        pdfTitle: dateBounds.pdfTitle,
      },
      summary,
      revenueTrend,
      revenueData: revenueTrend,
      statusBreakdown,
      orderStatusData: statusBreakdown,
      topFoods,
      topFoodItems: topFoods,
      orders: formattedOrders,
      recentOrders: formattedOrders.slice(0, 15),
      recentSales: formattedOrders.slice(0, 15),
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Report summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load report data: ' + error.message,
      data: {
        mode: 'all',
        range: 'all',
        dateRange: { mode: 'all', range: 'all', label: 'All Time', formattedPeriod: 'All Time', pdfTitle: 'Report Period: All Time' },
        summary: {
          totalRevenue: 0,
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          totalCustomers: 0,
          newCustomers: 0,
          averageOrderValue: 0,
          totalItemsSold: 0,
          totalFoodItems: 0,
          statusCounts: {},
          revenueToday: 0,
          revenueThisWeek: 0,
          revenueThisMonth: 0,
        },
        revenueTrend: [],
        revenueData: [],
        statusBreakdown: [],
        topFoods: [],
        orders: [],
        recentOrders: [],
      },
    });
  }
};

export { getReportSummary };
