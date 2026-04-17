import { useState, useEffect } from 'react';
import { FileText, TrendingDown, PieChart, Calendar, Download, RefreshCw } from 'lucide-react';
import api from '../utils/axios';
import AlertDialog from '../components/AlertDialog';
import DatePicker from '../components/DatePicker';
import { formatMoney, formatDateByTimezone } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';

const Reports = () => {
  const { t } = useI18n();
  const [tab, setTab] = useState('sales');
  const [salesReport, setSalesReport] = useState(null);
  const [trends, setTrends] = useState({});
  const [profitMargins, setProfitMargins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sales, tr, profit] = await Promise.all([
        api.get(`/admin/reports/sales?from=${fromDate}&to=${toDate}`),
        api.get(`/admin/trends?from=${fromDate}&to=${toDate}`),
        api.get('/admin/profit-margins')
      ]);
      setSalesReport(sales.data);
      setTrends(tr.data);
      setProfitMargins(profit.data.data || []);
    } catch {
      setAlert({ show: true, type: 'error', title: t('error'), message: t('error'), onConfirm: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const trendEntries = Object.entries(trends || {});
  const maxTrend = trendEntries.length > 0
    ? Math.max(...trendEntries.map(([, v]) => Number(v) || 0))
    : 0;
  const reportOrders = Array.isArray(salesReport?.orders) ? salesReport.orders : [];

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
      <div className="card p-4 flex gap-4 flex-wrap items-end">
        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t('dateFrom')}</label>
          <DatePicker value={fromDate} onChange={setFromDate} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t('dateTo')}</label>
          <DatePicker value={toDate} onChange={setToDate} />
        </div>
        <button onClick={fetchReports} className="btn-primary flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> {t('generate')}
        </button>
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('date'), value: `${fromDate} ${toDate}`, icon: Calendar, color: 'text-sky-400' },
              { label: t('orderTotal'), value: salesReport.total_orders, icon: FileText, color: 'text-amber-400' },
              { label: t('todayRevenue'), value: formatMoney(salesReport.total_revenue), icon: TrendingDown, color: 'text-emerald-400' },
              { label: t('pendingCountSub'), value: formatMoney(salesReport.average_order_value), icon: PieChart, color: 'text-violet-400' },
            ].map((item, i) => (
              <div key={i} className="card-flat p-4">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-[14px] font-bold text-white">{t('salesDetails')}</h3>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-[#27272a]">
                    <th className="text-left px-6 py-3">ID</th>
                    <th className="text-left px-6 py-3">{t('date')}</th>
                    <th className="text-left px-6 py-3">{t('amount')}</th>
                    <th className="text-left px-6 py-3">{t('orderType')}</th>
                    <th className="text-left px-6 py-3">{t('orderDetails')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {reportOrders.map(o => (
                    <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 font-medium text-amber-400">#{o.id}</td>
                      <td className="px-6 py-3 text-zinc-400">{formatDateByTimezone(o.created_at)}</td>
                      <td className="px-6 py-3 font-bold text-emerald-400">{formatMoney(o.total_price)}</td>
                      <td className="px-6 py-3 capitalize text-sky-400">{o.type}</td>
                      <td className="px-6 py-3 text-zinc-500">{o.items?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div className="card p-6">
          <h3 className="text-[14px] font-bold text-white mb-6">{t('salesTrend')}</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-3 scrollbar-thin scrollbar-track-zinc-800 scrollbar-thumb-amber-600 hover:scrollbar-thumb-amber-500">
            {trendEntries.reverse().slice(0, 30).map(([date, revenue]) => {
              const percentage = maxTrend > 0 ? (Number(revenue) / maxTrend) * 100 : 0;
              return (
                <div key={date}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-semibold text-zinc-500">{date}</span>
                    <span className="text-[12px] font-bold text-emerald-400">{formatMoney(revenue)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profit Margins Tab */}
      {tab === 'profit' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-[14px] font-bold text-white">{t('profitByProduct')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-[#27272a]">
                  <th className="text-left px-6 py-3">{t('tableTitle')}</th>
                  <th className="text-left px-6 py-3">{t('unitPrice')}</th>
                  <th className="text-left px-6 py-3">{t('amount')}</th>
                  <th className="text-left px-6 py-3">{t('revenue')}</th>
                  <th className="text-left px-6 py-3">Marge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {profitMargins.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-zinc-600">{t('noData')}</td></tr>
                ) : profitMargins.slice(0, 20).map(p => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-3 font-medium text-white">{p.name}</td>
                    <td className="px-6 py-3 text-amber-400 font-bold">{formatMoney(p.price)}</td>
                    <td className="px-6 py-3 text-sky-400">{formatMoney(p.cost)}</td>
                    <td className="px-6 py-3 text-emerald-400 font-bold">{formatMoney(p.profit)}</td>
                    <td className="px-6 py-3">
                      <span className={`font-bold ${p.margin_percentage > 30 ? 'text-emerald-400' : p.margin_percentage > 15 ? 'text-amber-400' : 'text-red-400'}`}>
                        {Number(p.margin_percentage).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
