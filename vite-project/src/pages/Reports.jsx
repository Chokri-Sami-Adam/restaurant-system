import { useState, useEffect } from 'react';
import { FileText, TrendingDown, PieChart, Calendar, RefreshCw, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import api from '../utils/axios';
import AlertDialog from '../components/AlertDialog';
import DatePicker from '../components/DatePicker';
import { formatMoney, formatDateByTimezone } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { t } = useI18n();
  const [tab, setTab] = useState('sales');
  const [chartType, setChartType] = useState('line');
  const [salesReport, setSalesReport] = useState(null);
  const [trends, setTrends] = useState({});
  const [profitMargins, setProfitMargins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });
  // Sales Report filters
  const [salesSearch, setSalesSearch] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sales, tr, profit] = await Promise.all([
        api.get(`/admin/reports/sales?from=${fromDate}&to=${toDate}`),
        api.get(`/admin/trends?from=${fromDate}&to=${toDate}`),
        api.get('/admin/profit-margins')
      ]);

      // Handle response - check both for direct data and wrapped data
      const salesData = sales.data.data || sales.data;
      setSalesReport(salesData);

      const trendsData = tr.data.data || tr.data;
      setTrends(trendsData || {});

      const profitData = profit.data.data || profit.data;
      setProfitMargins(Array.isArray(profitData) ? profitData : []);
    } catch (e) {
      console.error('Reports Error:', e);
      const errorMsg = e.response?.data?.message || e.message || t('error');
      setAlert({ show: true, type: 'error', title: t('error'), message: errorMsg, onConfirm: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-40 h-8 bg-gradient-to-r from-zinc-700 to-zinc-800 rounded animate-pulse"></div>
          <div className="w-60 h-4 bg-zinc-800 rounded animate-pulse"></div>
        </div>
        <div className="w-32 h-10 bg-zinc-800 rounded animate-pulse"></div>
      </div>
      <div className="card p-4 grid grid-cols-3 gap-3">
        <div className="h-12 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-12 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-12 bg-zinc-800 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-20 animate-pulse"></div>
            <div className="h-6 bg-zinc-800 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Process trends data to fill missing days
  const generateChartData = () => {
    const from = new Date(fromDate + 'T00:00:00Z');
    const to = new Date(toDate + 'T23:59:59Z');
    const data = [];
    const currentDate = new Date(from);

    while (currentDate <= to) {
      // Format date as YYYY-MM-DD in UTC
      const year = currentDate.getUTCFullYear();
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const revenue = trends[dateStr] ? Number(trends[dateStr]) : 0;
      const displayDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

      data.push({ date: dateStr, revenue, displayDate });
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log('Generated chart data:', data);
    return data;
  };

  const chartData = generateChartData();
  const totalDays = chartData.length;
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 0);
  const minRevenue = Math.min(...chartData.filter(d => d.revenue > 0).map(d => d.revenue), 0);
  const avgRevenue = totalDays > 0 ? totalRevenue / totalDays : 0;
  const peakDate = chartData.find(d => d.revenue === maxRevenue);

  // Get orders from API response (handle different response structures)
  const reportOrders = Array.isArray(salesReport?.orders) ? salesReport.orders : [];

  // Calculate insights from ALL orders (before filtering)
  const allOrderAmounts = reportOrders.map(o => Number(o.payments?.[0]?.amount || o.total_price) || 0);
  const calculatedAvg = allOrderAmounts.length > 0 ? allOrderAmounts.reduce((a, b) => a + b, 0) / allOrderAmounts.length : 0;
  // Fallback to API's pre-calculated average if orders not available
  const avgOrderAmount = reportOrders.length > 0 ? calculatedAvg : (salesReport?.average_order_value || 0);
  const highestOrder = allOrderAmounts.length > 0 ? Math.max(...allOrderAmounts) : 0;
  const lowestOrder = allOrderAmounts.length > 0 ? Math.min(...allOrderAmounts) : 0;

  // Format date range nicely
  const formatDateRange = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const fromStr = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const toStr = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fromStr} → ${toStr}`;
  };

  // Filter and search orders
  const filteredOrders = reportOrders
    .filter(o => {
      // Search filter
      if (salesSearch && !o.id.toString().includes(salesSearch)) return false;
      // Type filter
      if (salesTypeFilter !== 'all' && o.type !== salesTypeFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount-high':
          return (Number(b.payments?.[0]?.amount || b.total_price) || 0) - (Number(a.payments?.[0]?.amount || a.total_price) || 0);
        case 'amount-low':
          return (Number(a.payments?.[0]?.amount || a.total_price) || 0) - (Number(b.payments?.[0]?.amount || b.total_price) || 0);
        case 'date-desc':
          // Newest first (Z → A)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          // Oldest first (A → Z)
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

  // Generate daily sales chart data - SUPER SIMPLE & EXPLICIT
  const generateSalesChartData = () => {
    // STEP 1: Generate last 7 days
    const endDate = new Date(toDate);
    const chartDays = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      chartDays.push({ dateKey: `${yr}-${mo}-${dy}`, dateObj: d });
    }

    // STEP 2: Aggregate orders
    const ordersByDate = {};
    reportOrders.forEach(order => {
      const dateKey = order.created_at.substring(0, 10); // YYYY-MM-DD
      const orderAmount = order.payments?.[0]?.amount ? Number(order.payments[0].amount) : Number(order.total_price) || 0;

      if (!ordersByDate[dateKey]) {
        ordersByDate[dateKey] = { count: 0, total: 0 };
      }
      ordersByDate[dateKey].count += 1;
      ordersByDate[dateKey].total += orderAmount;
    });

    // STEP 3: Build chart data
    const chartData = chartDays.map(day => {
      const stats = ordersByDate[day.dateKey] || { count: 0, total: 0 };
      return {
        displayDate: day.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: stats.count,
        revenue: stats.total
      };
    });

    return chartData;
  };

  const salesChartData = generateSalesChartData();

  // Log chart data for debugging
  if (salesChartData.length > 0) {
    console.log('📊 Chart Data:', salesChartData);
    console.log('📊 Data with orders:', salesChartData.filter(d => d.orders > 0));
    console.log('📊 Data with revenue:', salesChartData.filter(d => d.revenue > 0));
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('reports')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('dashboardSubtitle')}</p>
        </div>
        <button onClick={fetchReports} className="btn-ghost flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}
        </button>
      </div>

      {/* Date Range Picker */}
      <div className="card p-4 flex gap-3 flex-wrap items-end border-l-2 border-amber-500/20 bg-amber-500/5">
        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t('dateFrom')}</label>
          <DatePicker value={fromDate} onChange={setFromDate} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t('dateTo')}</label>
          <DatePicker value={toDate} onChange={setToDate} />
        </div>
        <button onClick={fetchReports} className="btn-primary flex items-center gap-1.5 text-[12px]">
          <Calendar className="w-4 h-4" /> {t('generate')}
        </button>
        <div className="flex-1 text-right text-[12px] text-zinc-400">
          Range: <span className="text-zinc-200 font-semibold">{formatDateRange()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#27272a]">
        {[
          { id: 'sales', label: t('salesReport'), icon: FileText },
          { id: 'trends', label: t('trends'), icon: TrendingDown },
          { id: 'profit', label: t('profitMargins'), icon: PieChart },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              tab === t.id
                ? 'text-amber-400 border-amber-400'
                : 'text-zinc-600 border-transparent hover:text-zinc-400'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Sales Report Tab */}
      {tab === 'sales' && salesReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: t('orderTotal'), value: salesReport.total_orders, icon: FileText, color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
              { label: t('todayRevenue'), value: formatMoney(salesReport.total_revenue), icon: TrendingDown, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { label: 'Avg Order', value: formatMoney(avgOrderAmount), icon: PieChart, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { label: 'Period', value: formatDateRange(), icon: Calendar, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
            ].map((item, i) => (
              <div key={i} className={`card p-4 border-l-2 ${item.color.split(' ').slice(-1)[0]} hover:shadow-lg transition-all`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{item.label}</p>
                    <p className={`text-lg font-bold ${item.color.split(' ')[1]}`}>{item.value}</p>
                  </div>
                  <item.icon className={`w-5 h-5 ${item.color.split(' ')[1]} opacity-60`} />
                </div>
              </div>
            ))}
          </div>

          {/* Daily Orders & Revenue Charts */}
          {salesChartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Orders Chart */}
              <div className="card p-5">
                <h3 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  Daily Orders
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fill: '#a1a1aa' }} />
                      <YAxis dataKey="displayDate" type="category" stroke="#71717a" style={{ fontSize: '10px' }} tick={{ fill: '#a1a1aa' }} width={55} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} formatter={(value) => [value, 'Orders']} cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }} />
                      <Bar dataKey="orders" fill="#0ea5e9" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={800} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Revenue Chart */}
              <div className="card p-5">
                <h3 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  Daily Revenue
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fill: '#a1a1aa' }} />
                      <YAxis dataKey="displayDate" type="category" stroke="#71717a" style={{ fontSize: '10px' }} tick={{ fill: '#a1a1aa' }} width={55} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} formatter={(value) => [formatMoney(value), 'Revenue']} cursor={{ fill: 'rgba(234, 179, 8, 0.1)' }} />
                      <Bar dataKey="revenue" fill="#eab308" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={800} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}

          {/* Orders Table with Sorting */}
          <div className="card overflow-hidden">
            <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <div>
                <h3 className="text-[15px] font-bold text-white">{t('salesDetails')}</h3>
                <p className="text-[11px] text-zinc-600 mt-1">{filteredOrders.length} total orders</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Sort:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-[12px] text-zinc-200 px-3 py-2 rounded-lg hover:border-zinc-600 transition-colors">
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-high">Highest Amount</option>
                  <option value="amount-low">Lowest Amount</option>
                </select>
              </div>
            </div>
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[13px] text-zinc-500">{reportOrders.length === 0 ? 'Order details not available - showing summary data from API' : t('noData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-zinc-950 border-b border-white/10">
                    <tr className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">
                      <th className="text-left px-8 py-4">Order ID</th>
                      <th className="text-left px-8 py-4">{t('date')}</th>
                      <th className="text-left px-8 py-4">{t('amount')}</th>
                      <th className="text-left px-8 py-4">{t('orderType')}</th>
                      <th className="text-left px-8 py-4">{t('orderDetails')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredOrders.map((o, idx) => {
                      const isTopValue = idx < Math.ceil(filteredOrders.length * 0.3);
                      return (
                        <tr key={o.id} className={`text-[13px] transition-all ${isTopValue ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-white/5'}`}>
                          <td className="px-8 py-4 font-bold text-amber-400">#{o.id}</td>
                          <td className="px-8 py-4 text-zinc-300">{formatDateByTimezone(o.created_at)}</td>
                          <td className="px-8 py-4 font-bold text-emerald-400">{formatMoney(o.payments?.[0]?.amount || o.total_price)}</td>
                          <td className="px-8 py-4"><span className={`px-3 py-1.5 rounded-md text-[11px] font-bold inline-block ${o.type === 'dine-in' ? 'bg-sky-500/20 text-sky-300' : o.type === 'takeaway' ? 'bg-amber-500/20 text-amber-300' : 'bg-violet-500/20 text-violet-300'}`}>{o.type}</span></td>
                          <td className="px-8 py-4 text-zinc-300"><span className="bg-zinc-800 px-3 py-1.5 rounded-md text-[11px] font-semibold text-zinc-100">{o.items?.length || 0} items</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-8 py-4 border-t border-white/10 bg-zinc-900/50 text-[12px] text-zinc-400 font-semibold flex justify-between">
              <span>Total: <span className="text-emerald-400">{formatMoney(filteredOrders.reduce((sum, o) => sum + (Number(o.payments?.[0]?.amount || o.total_price) || 0), 0))}</span></span>
              <span className="text-zinc-600">{filteredOrders.length} orders</span>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div className="space-y-6">
          {/* Key Insights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Revenue', value: formatMoney(totalRevenue), sub: `${totalDays} days`, icon: TrendingDown, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { label: 'Highest Day', value: formatMoney(maxRevenue), sub: peakDate?.displayDate || '-', icon: BarChart3, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { label: 'Average Daily', value: formatMoney(avgRevenue), sub: 'per day', icon: LineChartIcon, color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
              { label: 'Lowest Day', value: formatMoney(minRevenue || 0), sub: minRevenue > 0 ? 'active days' : 'no sales', icon: Calendar, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
            ].map((item, i) => (
              <div key={i} className={`card p-4 border-l-2 ${item.color.split(' ').slice(-1)[0]} animate-fadeIn`} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">{item.label}</p>
                    <p className={`text-lg font-bold ${item.color.split(' ')[1]}`}>{item.value}</p>
                    <p className="text-[11px] text-zinc-600 mt-1">{item.sub}</p>
                  </div>
                  <item.icon className={`w-5 h-5 ${item.color.split(' ')[1]} opacity-60`} />
                </div>
              </div>
            ))}
          </div>

          {/* Chart Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[12px] uppercase tracking-wider transition-all ${
                chartType === 'line'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-800/30 text-zinc-500 border border-zinc-700/30 hover:text-zinc-300'
              }`}
            >
              <LineChartIcon className="w-4 h-4" /> Line Chart
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[12px] uppercase tracking-wider transition-all ${
                chartType === 'bar'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-800/30 text-zinc-500 border border-zinc-700/30 hover:text-zinc-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Bar Chart
            </button>
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="card p-6">
              <h3 className="text-[14px] font-bold text-white mb-4">{t('revenueOverTime') || 'Revenue Over Time'}</h3>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#71717a" style={{ fontSize: '12px' }} tick={{ fill: '#a1a1aa' }} />
                      <YAxis stroke="#71717a" style={{ fontSize: '12px' }} tick={{ fill: '#a1a1aa' }} formatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} formatter={(value) => formatMoney(value)} labelFormatter={(label) => `${label}`} />
                      <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: '12px', paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#eab308" strokeWidth={2.5} dot={{ fill: '#eab308', r: 4 }} activeDot={{ r: 6, fill: '#fbbf24' }} name="Daily Revenue" isAnimationActive={true} animationDuration={600} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#71717a" style={{ fontSize: '12px' }} tick={{ fill: '#a1a1aa' }} />
                      <YAxis stroke="#71717a" style={{ fontSize: '12px' }} tick={{ fill: '#a1a1aa' }} formatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} formatter={(value) => formatMoney(value)} labelFormatter={(label) => `${label}`} />
                      <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: '12px', paddingTop: '20px' }} />
                      <Bar dataKey="revenue" fill="#eab308" radius={[8, 8, 0, 0]} name="Daily Revenue" isAnimationActive={true} animationDuration={600} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-[14px] font-bold text-zinc-400">{t('noData') || 'No data available'}</p>
              <p className="text-[12px] text-zinc-600 mt-2">{t('tryChangingDates') || 'Try changing your date range'}</p>
            </div>
          )}
        </div>
      )}

      {/* Profit Margins Tab */}
      {tab === 'profit' && (
        <div className="space-y-6">
          {/* Profit Summary Cards */}
          {profitMargins.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[
                {
                  label: 'Total Revenue',
                  value: formatMoney(profitMargins.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.sold) || 1), 0)),
                  icon: TrendingDown,
                  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                },
                {
                  label: 'Total Cost',
                  value: formatMoney(profitMargins.reduce((sum, p) => sum + (Number(p.cost) || 0) * (Number(p.sold) || 1), 0)),
                  icon: FileText,
                  color: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                },
                {
                  label: 'Total Profit',
                  value: formatMoney(profitMargins.reduce((sum, p) => {
                    const revenue = (Number(p.price) || 0) * (Number(p.sold) || 1);
                    const cost = (Number(p.cost) || 0) * (Number(p.sold) || 1);
                    return sum + (revenue - cost);
                  }, 0)),
                  icon: PieChart,
                  color: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                }
              ].map((item, i) => (
                <div key={i} className={`card p-4 border-l-2 ${item.color.split(' ').slice(-1)[0]}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{item.label}</p>
                      <p className={`text-lg font-bold ${item.color.split(' ')[1]}`}>{item.value}</p>
                    </div>
                    <item.icon className={`w-5 h-5 ${item.color.split(' ')[1]} opacity-60`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-[14px] font-bold text-white">{t('profitByProduct')}</h3>
            </div>
            {profitMargins.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[12px] text-zinc-500">{t('noData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-zinc-900 border-b border-[#27272a]">
                    <tr className="text-[10px] text-zinc-600 uppercase tracking-wider">
                      <th className="text-left px-6 py-3">Product</th>
                      <th className="text-right px-6 py-3">Price</th>
                      <th className="text-right px-6 py-3">Cost</th>
                      <th className="text-right px-6 py-3">Sold</th>
                      <th className="text-right px-6 py-3">Profit</th>
                      <th className="text-right px-6 py-3">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    {profitMargins.slice(0, 30).map(p => {
                      const price = Number(p.price) || 0;
                      const cost = Number(p.cost) || 0;
                      const sold = Number(p.sold) || 1;
                      const revenue = price * sold;
                      const totalCost = cost * sold;
                      const profit = revenue - totalCost;
                      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

                      let marginColor = 'text-emerald-400';
                      if (margin > 40) marginColor = 'text-emerald-400';
                      else if (margin > 20) marginColor = 'text-amber-400';
                      else if (margin > 0) marginColor = 'text-orange-400';
                      else marginColor = 'text-red-500';

                      return (
                        <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-3 font-medium text-white">{p.name}</td>
                          <td className="px-6 py-3 text-right text-amber-400 font-bold">{formatMoney(price)}</td>
                          <td className="px-6 py-3 text-right text-orange-400">{formatMoney(cost)}</td>
                          <td className="px-6 py-3 text-right text-sky-400">{sold}</td>
                          <td className="px-6 py-3 text-right font-bold text-emerald-400">{formatMoney(profit)}</td>
                          <td className={`px-6 py-3 text-right font-bold ${marginColor}`}>
                            {Math.max(0, Math.min(100, margin)).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {profitMargins.length > 30 && (
              <div className="px-6 py-3 border-t border-white/5 bg-zinc-900/50 text-[11px] text-zinc-500">
                Showing 30 of {profitMargins.length} products
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alert.show}
        onClose={() => setAlert({ ...alert, show: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
      />
    </div>
  );
};

export default Reports;
