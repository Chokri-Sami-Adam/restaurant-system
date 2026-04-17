import { useState, useEffect, useRef } from 'react';
import { RefreshCw, ChefHat, Clock, Flame, CheckCircle2 } from 'lucide-react';
import api from '../utils/axios';
import AlertDialog from '../components/AlertDialog';
import { getLocale } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';

const Kitchen = () => {
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });
  const intervalRef = useRef(null);
  const locale = getLocale();

  const fetchOrders = async () => {
    try {
      const r = await api.get('/orders');
      const all = r.data.data || r.data || [];
      // Kitchen only sees pending, preparing, ready
      setOrders(all.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(fetchOrders, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const advanceStatus = async (order) => {
    const nextStatus = { pending: 'preparing', preparing: 'ready' }[order.status];
    if (!nextStatus) return;
    try {
      await api.put(`/orders/${order.id}/status`, { status: nextStatus });
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetchOrders();
    } catch (e) {
      setAlert({ show: true, type: 'error', title: t('error'), message: t('error'), onConfirm: null });
    }
  };

  const cols = [
    { key: 'pending', label: t('status.pending'), icon: Clock, color: 'amber', action: t('createProduct') },
    { key: 'preparing', label: t('status.preparing'), icon: Flame, color: 'sky', action: t('status.ready') },
    { key: 'ready', label: t('status.ready'), icon: CheckCircle2, color: 'emerald', action: null },
  ];

  const colColors = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', btn: 'bg-amber-500 hover:bg-amber-400 text-black' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', btn: 'bg-sky-500 hover:bg-sky-400 text-black' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', btn: '' },
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('kitchen')}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{t('dashboardSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 10s
          </span>
          <button onClick={fetchOrders} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}</button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {cols.map(col => {
          const c = colColors[col.color];
          const filtered = orders.filter(o => o.status === col.key);
          const Icon = col.icon;
          return (
            <div key={col.key} className="space-y-3">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl ${c.bg} border ${c.border}`}>
                <Icon className={`w-5 h-5 ${c.text}`} />
                <h2 className={`text-[15px] brand-font font-bold ${c.text}`}>{col.label}</h2>
                <span className={`ml-auto text-[13px] font-bold ${c.text}`}>{filtered.length}</span>
              </div>

              {/* Orders */}
              <div className="space-y-3 min-h-[200px]">
                {filtered.length === 0 ? (
                  <div className="card-flat border-dashed flex items-center justify-center py-12">
                    <p className="text-zinc-600 text-sm">{t('noOrdersFound')}</p>
                  </div>
                ) : filtered.map(order => (
                  <div key={order.id} className="card overflow-hidden hover:translate-y-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[18px] font-extrabold text-white brand-font">#{order.id}</span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {order.type === 'dine-in' ? `🍽️ ${t('type.dineIn')}` : `📦 ${t('type.takeaway')}`}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 mb-4">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-[13px]">
                            <span className="text-zinc-300 font-medium">{item.product?.name || `Produit #${item.product_id}`}</span>
                            <span className="text-amber-400 font-bold">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-zinc-600 mb-3">
                        {new Date(order.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Action button */}
                    {col.action && (
                      <button onClick={() => advanceStatus(order)}
                        className={`w-full py-3 text-[13px] font-bold transition-all border-t border-white/5 ${c.btn}`}>
                        {col.action}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
export default Kitchen;
