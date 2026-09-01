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
import {
  FiAlertCircle,
  FiBox,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiShoppingBag,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Reports.css';

const MONTHS = [
  { value: 1, name: 'January', short: 'Jan' },
  { value: 2, name: 'February', short: 'Feb' },
  { value: 3, name: 'March', short: 'Mar' },
  { value: 4, name: 'April', short: 'Apr' },
  { value: 5, name: 'May', short: 'May' },
  { value: 6, name: 'June', short: 'Jun' },
  { value: 7, name: 'July', short: 'Jul' },
  { value: 8, name: 'August', short: 'Aug' },
  { value: 9, name: 'September', short: 'Sep' },
  { value: 10, name: 'October', short: 'Oct' },
  { value: 11, name: 'November', short: 'Nov' },
  { value: 12, name: 'December', short: 'Dec' },
];

const reportModes = [
  { id: 'singleDay', label: 'Single Day', icon: '📅' },
  { id: 'customRange', label: 'Custom Date Range', icon: '↔️' },
  { id: 'week', label: 'Week of a Month', icon: '📆' },
  { id: 'month', label: 'Complete Month', icon: '🗓️' },
];

const statusPalette = [
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#22c55e',
  '#ef4444',
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
  if (value.includes('out') || value.includes('ready') || value.includes('pickup')) return 'Out for delivery';
  if (value.includes('processing') || value.includes('confirm')) return 'Food Processing';
  return 'Pending';
};

const padZero = (n) => String(n).padStart(2, '0');

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
};

const getDaysAgoString = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const Reports = ({ url }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // 1. Report Mode selection
  const [reportType, setReportType] = useState('singleDay');

  // 2. Mode 1: Single Day State
  const [singleDate, setSingleDate] = useState(getTodayString());

  // 3. Mode 2: Custom Date Range State
  const [startDate, setStartDate] = useState(getDaysAgoString(7));
  const [endDate, setEndDate] = useState(getTodayString());

  // 4. Mode 3: Week within Month State
  const [weekYear, setWeekYear] = useState(currentYear);
  const [weekMonth, setWeekMonth] = useState(currentMonth);
  const [selectedWeek, setSelectedWeek] = useState(1);

  // 5. Mode 4: Complete Month State
  const [monthYear, setMonthYear] = useState(currentYear);
  const [monthMonth, setMonthMonth] = useState(currentMonth);

  // Data & Loading state
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState('');

  const [report, setReport] = useState({
    dateRange: {
      mode: 'singleDay',
      label: 'Single Day',
      formattedPeriod: 'Today',
      pdfTitle: 'Report Period: Today',
    },
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalFoodItems: 0,
      completedOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      averageOrderValue: 0,
      totalItemsSold: 0,
      newCustomers: 0,
      statusCounts: {
        'Food Processing': 0,
        'Out for delivery': 0,
        Delivered: 0,
        Cancelled: 0,
        Pending: 0,
      },
      revenueToday: 0,
      revenueThisWeek: 0,
      revenueThisMonth: 0,
    },
    revenueTrend: [],
    statusBreakdown: [],
    topFoods: [],
    orders: [],
    recentOrders: [],
  });

  // Calculate days in month for week selector
  const daysInWeekMonth = useMemo(() => getDaysInMonth(weekYear, weekMonth), [weekYear, weekMonth]);

  // Dynamic week options
  const weekOptions = useMemo(() => {
    const options = [
      { week: 1, label: 'Week 1', rangeText: `01 - 07 ${MONTHS[weekMonth - 1]?.short}` },
      { week: 2, label: 'Week 2', rangeText: `08 - 14 ${MONTHS[weekMonth - 1]?.short}` },
      { week: 3, label: 'Week 3', rangeText: `15 - 21 ${MONTHS[weekMonth - 1]?.short}` },
      { week: 4, label: 'Week 4', rangeText: `22 - 28 ${MONTHS[weekMonth - 1]?.short}` },
    ];

    if (daysInWeekMonth >= 29) {
      options.push({
        week: 5,
        label: 'Week 5',
        rangeText: `29 - ${padZero(daysInWeekMonth)} ${MONTHS[weekMonth - 1]?.short}`,
      });
    }

    return options;
  }, [daysInWeekMonth, weekMonth]);

  // Clamp week if switching to month with fewer days (e.g. Feb)
  useEffect(() => {
    if (selectedWeek === 5 && daysInWeekMonth < 29) {
      setSelectedWeek(4);
    }
  }, [daysInWeekMonth, selectedWeek]);

  // Year options for dropdowns (2020 - 2030)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear + 2; y >= 2020; y -= 1) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Validation warning for custom range
  const isCustomRangeInvalid = useMemo(() => {
    if (reportType !== 'customRange') return false;
    return startDate && endDate && startDate > endDate;
  }, [reportType, startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      const params = { reportType };

      if (reportType === 'singleDay') {
        params.date = singleDate || getTodayString();
      } else if (reportType === 'customRange') {
        params.startDate = startDate || getDaysAgoString(7);
        params.endDate = endDate || getTodayString();
      } else if (reportType === 'week') {
        params.year = weekYear;
        params.month = weekMonth;
        params.week = selectedWeek;
      } else if (reportType === 'month') {
        params.year = monthYear;
        params.month = monthMonth;
      }

      const response = await axios.get(`${url}/api/report/summary`, { params });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load report data');
      }

      setReport(response.data.data || {
        dateRange: { mode: reportType, label: 'Selected Period', formattedPeriod: 'Selected Period' },
        summary: {},
        revenueTrend: [],
        statusBreakdown: [],
        topFoods: [],
        orders: [],
        recentOrders: [],
      });
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || fetchError.message || 'Unable to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, singleDate, startDate, endDate, weekYear, weekMonth, selectedWeek, monthYear, monthMonth, url]);

  // 9 Core Business Metrics
  const overviewCards = useMemo(() => [
    { label: 'Total Revenue', value: formatCurrency(report.summary?.totalRevenue), icon: FiDollarSign, tone: 'blue' },
    { label: 'Total Orders', value: Number(report.summary?.totalOrders || 0).toLocaleString('en-IN'), icon: FiBox, tone: 'orange' },
    { label: 'Completed Orders', value: Number(report.summary?.completedOrders || 0).toLocaleString('en-IN'), icon: FiCheckCircle, tone: 'mint' },
    { label: 'Pending Orders', value: Number(report.summary?.pendingOrders || 0).toLocaleString('en-IN'), icon: FiClock, tone: 'amber' },
    { label: 'Cancelled Orders', value: Number(report.summary?.cancelledOrders || 0).toLocaleString('en-IN'), icon: FiAlertCircle, tone: 'red' },
    { label: 'Total Customers', value: Number(report.summary?.totalCustomers || 0).toLocaleString('en-IN'), icon: FiUsers, tone: 'green' },
    { label: 'New Customers', value: Number(report.summary?.newCustomers || 0).toLocaleString('en-IN'), icon: FiUserPlus, tone: 'purple' },
    { label: 'Avg Order Value', value: formatCurrency(report.summary?.averageOrderValue), icon: FiTrendingUp, tone: 'indigo' },
    { label: 'Food Items Sold', value: Number(report.summary?.totalItemsSold || 0).toLocaleString('en-IN'), icon: FiShoppingBag, tone: 'teal' },
  ], [report.summary]);

  const revenueChartData = useMemo(() => {
    const data = Array.isArray(report.revenueTrend) ? report.revenueTrend : [];
    return data.map((item) => ({
      name: item.name || item.label || item.key || 'N/A',
      revenue: Number(item.revenue || 0),
      orders: Number(item.orders || 0),
    }));
  }, [report.revenueTrend]);

  const statusChartData = useMemo(() => {
    const data = Array.isArray(report.statusBreakdown) ? report.statusBreakdown : [];
    const filtered = data.filter((entry) => Number(entry.count || entry.value || 0) > 0).map((entry) => ({
      name: entry.name,
      value: Number(entry.count || entry.value || 0),
    }));

    return filtered.length > 0 ? filtered : [{ name: 'No orders', value: 1 }];
  }, [report.statusBreakdown]);

  const topFoods = Array.isArray(report.topFoods) ? report.topFoods : [];
  const ordersList = Array.isArray(report.orders) ? report.orders : [];

  // PDF Export Handler
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const periodHeader = report.dateRange?.pdfTitle || `Report Period: ${report.dateRange?.formattedPeriod || 'Selected Period'}`;
      const generatedAt = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      // 1. Header Banner
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, 210, 42, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('Food Delivery Admin Report', 14, 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(56, 189, 248); // Sky 400
      doc.text(periodHeader, 14, 27);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225); // Slate 300
      doc.text(`Generated on: ${generatedAt}`, 14, 35);

      // 2. Summary KPI Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('Executive Summary', 14, 52);

      const summaryKpis = [
        ['Total Revenue', formatCurrency(report.summary?.totalRevenue), 'Total Orders', Number(report.summary?.totalOrders || 0).toLocaleString('en-IN')],
        ['Completed Orders', Number(report.summary?.completedOrders || 0).toLocaleString('en-IN'), 'Pending Orders', Number(report.summary?.pendingOrders || 0).toLocaleString('en-IN')],
        ['Cancelled Orders', Number(report.summary?.cancelledOrders || 0).toLocaleString('en-IN'), 'Total Customers', Number(report.summary?.totalCustomers || 0).toLocaleString('en-IN')],
        ['New Customers in Period', Number(report.summary?.newCustomers || 0).toLocaleString('en-IN'), 'Avg Order Value', formatCurrency(report.summary?.averageOrderValue)],
        ['Total Food Items Sold', Number(report.summary?.totalItemsSold || 0).toLocaleString('en-IN'), 'Total Menu Items', Number(report.summary?.totalFoodItems || 0).toLocaleString('en-IN')],
      ];

      autoTable(doc, {
        startY: 56,
        head: [['Metric', 'Value', 'Metric', 'Value']],
        body: summaryKpis,
        theme: 'striped',
        headStyles: {
          fillColor: [37, 99, 235], // Blue 600
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        styles: {
          fontSize: 9,
          cellPadding: 3.5,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { fontStyle: 'bold', width: 45 },
          1: { width: 45 },
          2: { fontStyle: 'bold', width: 45 },
          3: { width: 45 },
        },
      });

      // 3. Orders Details Table
      const finalSummaryY = doc.lastAutoTable.finalY + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`Order Details (${ordersList.length} orders)`, 14, finalSummaryY);

      if (ordersList.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('No orders found for the selected period.', 14, finalSummaryY + 8);
      } else {
        const orderRows = ordersList.map((order, idx) => [
          idx + 1,
          `#${String(order._id || '').slice(-6).toUpperCase()}`,
          order.customerName || 'Guest',
          formatDate(order.date || order.createdAt),
          Number(order.itemCount || (Array.isArray(order.items) ? order.items.length : 0)),
          formatCurrency(order.amount || order.totalAmount),
          order.payment ? 'Paid' : 'Pending',
          normalizeStatus(order.status),
        ]);

        autoTable(doc, {
          startY: finalSummaryY + 4,
          head: [['#', 'Order ID', 'Customer', 'Date', 'Items', 'Amount', 'Payment', 'Status']],
          body: orderRows,
          theme: 'striped',
          headStyles: {
            fillColor: [30, 41, 59],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8.5,
          },
          styles: {
            fontSize: 8,
            cellPadding: 2.8,
            textColor: [51, 65, 85],
          },
          columnStyles: {
            0: { width: 10, halign: 'center' },
            1: { width: 22, fontStyle: 'bold' },
            2: { width: 40 },
            3: { width: 28 },
            4: { width: 15, halign: 'center' },
            5: { width: 25, halign: 'right' },
            6: { width: 20, halign: 'center' },
            7: { width: 26, halign: 'center' },
          },
          didParseCell: (data) => {
            if (data.section === 'body') {
              if (data.column.index === 6) {
                if (data.cell.raw === 'Paid') {
                  data.cell.styles.textColor = [22, 163, 74];
                  data.cell.styles.fontStyle = 'bold';
                } else {
                  data.cell.styles.textColor = [217, 119, 6];
                }
              }
              if (data.column.index === 7) {
                if (data.cell.raw === 'Delivered') {
                  data.cell.styles.textColor = [22, 163, 74];
                  data.cell.styles.fontStyle = 'bold';
                } else if (data.cell.raw === 'Cancelled') {
                  data.cell.styles.textColor = [220, 38, 38];
                }
              }
            }
          },
        });
      }

      // 4. Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount}  •  Food Delivery Admin Report  •  ${report.dateRange?.formattedPeriod || 'Report'}`,
          105,
          290,
          { align: 'center' }
        );
      }

      // Safe filename
      const safeSlug = String(reportType || 'custom').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Food_Delivery_Report_${safeSlug}_${getTodayString()}.pdf`;

      doc.save(filename);
    } catch (pdfErr) {
      console.error('Failed to generate PDF:', pdfErr);
      setError('Failed to generate PDF report: ' + pdfErr.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <main className="reports-page">
      <header className="reports-header">
        <div>
          <p className="eyebrow">Analytics &amp; Intelligence</p>
          <h1>Reports &amp; Statistics</h1>
          <p className="reports-period-indicator">
            Active Report Period: <strong>{report.dateRange?.formattedPeriod || report.dateRange?.label || 'Loading...'}</strong>
          </p>
        </div>

        <div className="reports-header-actions">
          <button
            type="button"
            className="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={loading || isGeneratingPdf}
            aria-label="Download Report as PDF"
          >
            <FiDownload className={isGeneratingPdf ? 'spin' : ''} />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </header>

      {/* 4 Report Mode Selection Tabs */}
      <section className="reports-filter-section">
        <div className="report-mode-tabs-wrap">
          <p className="filter-group-label">Select Report Period Type:</p>
          <div className="report-mode-tabs">
            {reportModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-tab-btn ${reportType === mode.id ? 'active' : ''}`}
                onClick={() => setReportType(mode.id)}
              >
                <span className="mode-icon">{mode.icon}</span>
                <span className="mode-title">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Controls Sub-Panel based on Active Report Mode */}
        <div className="report-controls-panel">
          {/* MODE 1: SINGLE DAY */}
          {reportType === 'singleDay' && (
            <div className="control-row single-day-controls">
              <div className="control-field">
                <label htmlFor="single-day-input">
                  <FiCalendar className="field-icon" />
                  <span>Select Date:</span>
                </label>
                <input
                  id="single-day-input"
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                />
              </div>

              <div className="quick-date-pills">
                <button
                  type="button"
                  className={singleDate === getTodayString() ? 'pill-active' : ''}
                  onClick={() => setSingleDate(getTodayString())}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={singleDate === getDaysAgoString(1) ? 'pill-active' : ''}
                  onClick={() => setSingleDate(getDaysAgoString(1))}
                >
                  Yesterday
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: CUSTOM DATE RANGE */}
          {reportType === 'customRange' && (
            <div className="control-row custom-range-controls">
              <div className="control-field">
                <label htmlFor="start-date-input">
                  <FiCalendar className="field-icon" />
                  <span>Start Date:</span>
                </label>
                <input
                  id="start-date-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <span className="range-separator">to</span>

              <div className="control-field">
                <label htmlFor="end-date-input">
                  <FiCalendar className="field-icon" />
                  <span>End Date:</span>
                </label>
                <input
                  id="end-date-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="quick-date-pills">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(getDaysAgoString(6));
                    setEndDate(getTodayString());
                  }}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(getDaysAgoString(29));
                    setEndDate(getTodayString());
                  }}
                >
                  Last 30 Days
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: WEEK OF A MONTH */}
          {reportType === 'week' && (
            <div className="control-row week-of-month-controls">
              <div className="control-field-group">
                <div className="control-field">
                  <label htmlFor="week-month-select">
                    <FiCalendar className="field-icon" />
                    <span>Month:</span>
                  </label>
                  <select
                    id="week-month-select"
                    value={weekMonth}
                    onChange={(e) => setWeekMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="control-field">
                  <label htmlFor="week-year-select">
                    <span>Year:</span>
                  </label>
                  <select
                    id="week-year-select"
                    value={weekYear}
                    onChange={(e) => setWeekYear(Number(e.target.value))}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="week-selector-wrap">
                <span className="week-selector-label">Select Week:</span>
                <div className="week-pills">
                  {weekOptions.map((opt) => (
                    <button
                      key={opt.week}
                      type="button"
                      className={`week-pill-btn ${selectedWeek === opt.week ? 'active' : ''}`}
                      onClick={() => setSelectedWeek(opt.week)}
                    >
                      <strong>{opt.label}</strong>
                      <small>{opt.rangeText}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: COMPLETE MONTH */}
          {reportType === 'month' && (
            <div className="control-row complete-month-controls">
              <div className="control-field">
                <label htmlFor="month-month-select">
                  <FiCalendar className="field-icon" />
                  <span>Month:</span>
                </label>
                <select
                  id="month-month-select"
                  value={monthMonth}
                  onChange={(e) => setMonthMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-field">
                <label htmlFor="month-year-select">
                  <span>Year:</span>
                </label>
                <select
                  id="month-year-select"
                  value={monthYear}
                  onChange={(e) => setMonthYear(Number(e.target.value))}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="month-badge-info">
                <span>Includes:</span>
                <strong>
                  01 {MONTHS[monthMonth - 1]?.name} {monthYear} → {getDaysInMonth(monthYear, monthMonth)} {MONTHS[monthMonth - 1]?.name} {monthYear}
                </strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {isCustomRangeInvalid && (
        <div className="reports-error">
          <FiAlertCircle />
          <span>Start date cannot be after end date. Please select a valid date range.</span>
        </div>
      )}

      {error && (
        <div className="reports-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* 9 Overview KPI Cards */}
      <section className="reports-grid overview-grid">
        {loading
          ? Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="report-card report-card-skeleton">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))
          : overviewCards.map((card, index) => (
              <div key={card.label} className={`report-card ${card.tone}`} style={{ animationDelay: `${index * 50}ms` }}>
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

      {/* Revenue Analytics Chart */}
      <section className="report-panel-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Revenue Insights</p>
            <h2>Revenue Analytics ({report.dateRange?.formattedPeriod || 'Selected Period'})</h2>
          </div>
        </div>

        <div className="revenue-summary-grid">
          <div className="mini-stat">
            <span>Today's Revenue</span>
            <strong>{formatCurrency(report.summary?.revenueToday)}</strong>
          </div>
          <div className="mini-stat">
            <span>This Week's Revenue</span>
            <strong>{formatCurrency(report.summary?.revenueThisWeek)}</strong>
          </div>
          <div className="mini-stat">
            <span>This Month's Revenue</span>
            <strong>{formatCurrency(report.summary?.revenueThisMonth)}</strong>
          </div>
          <div className="mini-stat">
            <span>Period Total Revenue</span>
            <strong>{formatCurrency(report.summary?.totalRevenue)}</strong>
          </div>
        </div>

        <div className="chart-card">
          {loading ? (
            <div className="chart-placeholder">Loading revenue trends...</div>
          ) : revenueChartData.length === 0 || revenueChartData.every((d) => d.revenue === 0) ? (
            <div className="chart-placeholder">No revenue recorded for this period.</div>
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
                <YAxis
                  tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#revenueFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Orders Breakdown & Customer Metrics */}
      <section className="report-grid-two">
        <div className="report-panel-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Status Distribution</p>
              <h2>Order Status Breakdown</h2>
            </div>
          </div>

          <div className="status-stats-list">
            {[
              { label: 'Total Orders', value: Number(report.summary?.totalOrders || 0) },
              { label: 'Delivered', value: Number(report.summary?.completedOrders || report.summary?.statusCounts?.Delivered || 0) },
              { label: 'Food Processing', value: Number(report.summary?.statusCounts?.['Food Processing'] || 0) },
              { label: 'Out for Delivery', value: Number(report.summary?.statusCounts?.['Out for delivery'] || 0) },
              { label: 'Pending', value: Number(report.summary?.statusCounts?.Pending || 0) },
              { label: 'Cancelled', value: Number(report.summary?.cancelledOrders || report.summary?.statusCounts?.Cancelled || 0) },
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
              <p className="eyebrow">Audience</p>
              <h2>Customer Activity</h2>
            </div>
          </div>

          <div className="customer-summary">
            <div className="customer-stat">
              <span>Total Registered Users</span>
              <strong>{Number(report.summary?.totalCustomers || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="customer-stat">
              <span>New Customers in Selected Period</span>
              <strong>{Number(report.summary?.newCustomers || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="customer-stat">
              <span>Avg Revenue Per Order</span>
              <strong>{formatCurrency(report.summary?.averageOrderValue)}</strong>
            </div>
          </div>

          <div className="panel-header secondary-heading">
            <div>
              <p className="eyebrow">Top Performers</p>
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
                    <strong>{food.orders} sold</strong>
                    <small>{formatCompactCurrency(food.revenue)}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Best Selling Items Bar Chart */}
      <section className="report-panel-panel sales-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Volume Analysis</p>
            <h2>Best Selling Food Items (Units Sold)</h2>
          </div>
        </div>

        <div className="chart-card">
          {loading ? (
            <div className="chart-placeholder">Loading sales analytics...</div>
          ) : topFoods.length === 0 ? (
            <div className="chart-placeholder">No food sales available for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topFoods.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${value} units`, 'Quantity Sold']} />
                <Bar dataKey="orders" fill="#14b8a6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Orders Table for the Filtered Period */}
      <section className="report-panel-panel recent-orders-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Detailed Logs</p>
            <h2>Orders in Selected Period ({ordersList.length})</h2>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="chart-placeholder">Loading orders...</div>
          ) : ordersList.length === 0 ? (
            <div className="empty-state-box">No orders found for the selected period.</div>
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
                {ordersList.map((order) => (
                  <tr key={order._id || Math.random()}>
                    <td>#{String(order._id || '').slice(-6).toUpperCase()}</td>
                    <td>{order.customerName || 'Guest'}</td>
                    <td>{formatDate(order.date || order.createdAt)}</td>
                    <td>{Number(order.itemCount || (Array.isArray(order.items) ? order.items.length : 0))} items</td>
                    <td>{formatCurrency(order.amount || order.totalAmount)}</td>
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
