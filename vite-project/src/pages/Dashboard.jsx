import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Package, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { formatMoney, formatDateByTimezone } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';

const Dashboard = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, st, o] = await Promise.all([api.get('/admin/stats'), api.get('/admin/low-stock'), api.get('/orders')]);
        setStats(s.data);
        setLowStock(st.data.data || []);
        setRecentOrders((o.data.data || o.data || []).slice(0, 5));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const sc = (s) => ({ served: 'text-emerald-400 bg-emerald-500/10', preparing: 'text-sky-400 bg-sky-500/10', ready: 'text-violet-400 bg-violet-500/10', pending: 'text-amber-400 bg-amber-500/10', cancelled: 'text-red-400 bg-red-500/10' }[s] || 'text-zinc-400 bg-zinc-500/10');

  // Translation helpers
  const translateStatus = (s) => ({ pending: 'en attente', preparing: 'en préparation', ready: 'prêt', served: 'servi', cancelled: 'annulé' }[s] || s);
  const translateType = (type) => (type === 'takeaway' ? t('type.takeaway') : t('type.dineIn'));

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>;

  const cards = [
    { label: t('todayRevenue'), value: formatMoney(stats?.total_revenue || 0), sub: t('todayRevenueSub'), icon: DollarSign, accent: 'text-emerald-400 bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    { label: t('totalOrders'), value: stats?.total_orders || 0, sub: t('totalOrdersSub'), icon: ShoppingCart, accent: 'text-sky-400 bg-sky-500/10', ring: 'ring-sky-500/20' },
    { label: t('productsCount'), value: stats?.total_products || 0, sub: t('productsCountSub'), icon: Package, accent: 'text-violet-400 bg-violet-500/10', ring: 'ring-violet-500/20' },
    { label: t('pendingCount'), value: stats?.pending_orders || 0, sub: t('pendingCountSub'), icon: Clock, accent: 'text-amber-400 bg-amber-500/10', ring: 'ring-amber-500/20' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t('dashboardSubtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-5 glow-amber">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{c.label}</p>
              <div className={`p-2 rounded-xl ${c.accent} ring-1 ${c.ring}`}><c.icon className="w-4 h-4" /></div>
            </div>
            <p className="text-[28px] font-extrabold text-white leading-none">{c.value}</p>
            <p className="text-[11px] text-zinc-600 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {c.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Orders */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
            <h2 className="text-[13px] font-bold text-white">{t('recentOrders')}</h2>
            <Link to="/orders" className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors">{t('viewAll')} →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-zinc-600 p-5 text-center">{t('noOrdersYet')}</p>
          ) : (
            <div className="divide-y divide-[#27272a]">
              {recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">#{o.id}</div>
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-200">{formatMoney(o.total_price)}</p>
                      <p className="text-[10px] text-zinc-600">{formatDateByTimezone(o.created_at)}</p>
                      <p className="text-[10px] text-zinc-600 capitalize">{translateType(o.type)} • {o.items?.length || 0} {t('orderDetails')}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-lg ${sc(o.status)}`}>{translateStatus(o.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-[13px] font-bold text-white">{t('lowStock')}</h2>
            </div>
            {lowStock.length > 0 && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg font-bold ring-1 ring-red-500/20">{lowStock.length}</span>}
          </div>
          {lowStock.length === 0 ? (
            <div className="p-5 text-center"><p className="text-[12px] text-emerald-400 font-medium">✓ Stock optimal</p></div>
          ) : (
            <div className="divide-y divide-[#27272a]">
              {lowStock.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50"></span>
                    <span className="text-[13px] font-medium text-zinc-300">{item.name}</span>
                  </div>
                  <span className="text-[12px] font-bold text-red-400">{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
