import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Zap, Target, Calendar, Download } from 'lucide-react';
import api from '../utils/axios';
import AlertDialog from '../components/AlertDialog';
import { formatMoney } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';

const Analytics = () => {
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState(null);
  const [bestProducts, setBestProducts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [rev, prod, perf] = await Promise.all([
          api.get('/admin/analytics/revenue'),
          api.get('/admin/best-selling-products'),
          api.get('/admin/performance-metrics')
        ]);
        setAnalytics(rev.data);
        setBestProducts(prod.data.data || []);
        setMetrics(perf.data);
      } catch (e) {
        console.error('Analytics Error:', e.response?.data || e.message);
        setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics & Insights</h1>
        <p className="text-sm text-zinc-500 mt-1">Vue d'ensemble complète de vos performances</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Revenu Aujourd\'hui', value: formatMoney(analytics?.daily || 0), icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Semaine', value: formatMoney(analytics?.weekly || 0), icon: Calendar, color: 'text-sky-400 bg-sky-500/10' },
          { label: 'Mois', value: formatMoney(analytics?.monthly || 0), icon: BarChart3, color: 'text-violet-400 bg-violet-500/10' },
        ].map((card, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{card.label}</p>
              <div className={`p-3 rounded-xl ${card.color}`}><card.icon className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-extrabold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics && [
          { label: 'Commandes Totales', value: metrics.total_orders, color: 'text-amber-400' },
          { label: 'Commandes Complétées', value: metrics.completed_orders, color: 'text-emerald-400' },
          { label: 'Revenu Total', value: formatMoney(metrics.total_revenue), color: 'text-sky-400' },
          { label: 'Valeur Moyenne', value: formatMoney(metrics.average_order_value), color: 'text-violet-400' },
        ].map((m, i) => (
          <div key={i} className="card-flat p-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">{ m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Best Selling Products */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-[15px] font-bold text-white">Produits les Plus Vendus</h2>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-bold">{bestProducts.length} produits</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-[#27272a]">
                <th className="text-left px-6 py-3">Produit</th>
                <th className="text-left px-6 py-3">Quantité Vendue</th>
                <th className="text-left px-6 py-3">Prix Unitaire</th>
                <th className="text-left px-6 py-3">Revenu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {bestProducts.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-zinc-600">{t('noData')}</td></tr>
              ) : bestProducts.slice(0, 10).map((p, i) => (
                <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-6 py-3 text-amber-400 font-bold">{p.total_sold}</td>
                  <td className="px-6 py-3 text-zinc-400">{formatMoney(p.price)}</td>
                  <td className="px-6 py-3 text-emerald-400 font-bold">{formatMoney(p.total_sold * p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-sky-400" />
            <h3 className="text-[14px] font-bold text-white">Statut du Système</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-zinc-500">{t('totalActiveUsers')}</span>
              <span className="text-[13px] font-bold text-white">{metrics?.total_users || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-zinc-500">{t('totalMenuProducts')}</span>
              <span className="text-[13px] font-bold text-white">{metrics?.total_products || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-zinc-500">Articles en Stock Faible</span>
              <span className={`text-[13px] font-bold ${metrics?.low_stock_items > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {metrics?.low_stock_items || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-[14px] font-bold text-white">Taux de Complétion</h3>
          </div>
          {metrics && (
            <>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-[12px] text-zinc-500">Commandes Complétées</span>
                  <span className="text-[12px] font-bold text-emerald-400">{((metrics.completed_orders / metrics.total_orders) * 100 || 0).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${(metrics.completed_orders / metrics.total_orders) * 100 || 0}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-600 text-center mt-3">
                {metrics.completed_orders} / {metrics.total_orders} commandes complétées
              </p>
            </>
          )}
        </div>
      </div>

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

export default Analytics;
