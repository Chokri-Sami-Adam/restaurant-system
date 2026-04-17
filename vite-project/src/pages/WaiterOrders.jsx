import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Send, X } from 'lucide-react';
import api from '../utils/axios';
import AlertDialog from '../components/AlertDialog';
import { useI18n } from '../i18n/I18nProvider';

const WaiterOrders = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [tab, setTab] = useState('create');
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([api.get('/products'), api.get('/orders')]);
      setProducts((p.data.data || p.data || []).filter(pr => pr.is_available !== false));
      setMyOrders(o.data.data || o.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(cart.map(i => {
      if (i.product_id === productId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(i => i.product_id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await api.post('/orders', {
        type: orderType,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      });
      setCart([]);
      setAlert({ show: true, type: 'success', title: t('success'), message: t('sendToKitchen'), onConfirm: null });
      fetchData();
      setTab('orders');
    } catch (e) {
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
    finally { setSubmitting(false); }
  };

  const translateStatus = (s) => t(`status.${s}`) || s;
  const sc = (s) => ({ served: 'text-emerald-400 bg-emerald-500/10', paid: 'text-green-400 bg-green-500/10', preparing: 'text-sky-400 bg-sky-500/10', ready: 'text-violet-400 bg-violet-500/10', pending: 'text-amber-400 bg-amber-500/10', cancelled: 'text-red-400 bg-red-500/10' }[s] || 'text-zinc-400 bg-zinc-500/10');

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('orders')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('createAndTrackOrders')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#18181b]/50 backdrop-blur-sm border border-white/5 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('create')} className={`text-[12px] font-semibold px-4 py-2 rounded-lg transition-all ${tab === 'create' ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          {t('waiterCreate')}
        </button>
        <button onClick={() => setTab('orders')} className={`text-[12px] font-semibold px-4 py-2 rounded-lg transition-all ${tab === 'orders' ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          {t('waiterOrders')} <span className="text-zinc-600 ml-1">({myOrders.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          {tab === 'create' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Products grid */}
              <div className="lg:col-span-2 space-y-4">
                {/* Order type */}
                <div className="flex gap-2">
                      {[{ v: 'dine-in', l: `🍽️ ${t('type.dineIn')}` }, { v: 'takeaway', l: `📦 ${t('type.takeaway')}` }].map(option => (
                    <button key={option.v} onClick={() => setOrderType(option.v)}
                      className={`text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all border ${orderType === option.v ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'text-zinc-500 border-white/5 hover:bg-white/5'}`}>
                      {option.l}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {products.map(p => {
                    const inCart = cart.find(i => i.product_id === p.id);
                    return (
                      <button key={p.id} onClick={() => addToCart(p)}
                        className={`card p-4 text-left transition-all group cursor-pointer relative overflow-hidden ${inCart ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                        <h3 className="text-[14px] font-bold text-white mb-1">{p.name}</h3>
                        {p.category && <p className="text-[10px] text-zinc-600 mb-2">{p.category.name}</p>}
                        <p className="text-[18px] font-extrabold text-amber-400">${Number(p.price).toFixed(2)}</p>
                        {inCart && (
                          <span className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-[11px] font-bold text-black">
                            {inCart.quantity}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cart */}
              <div className="card overflow-hidden h-fit sticky top-24">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2 bg-white/[0.02]">
                  <ShoppingCart className="w-4 h-4 text-amber-400" />
                  <h2 className="text-[14px] brand-font font-bold text-white">{t('waiterCart')}</h2>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg font-bold ml-auto">{cart.length}</span>
                </div>

                {cart.length === 0 ? (
                  <p className="text-center text-zinc-600 text-sm py-10">{t('cartEmpty')}</p>
                ) : (
                  <>
                    <div className="divide-y divide-white/5 max-h-[320px] overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.product_id} className="px-5 py-3 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">{item.name}</p>
                            <p className="text-[11px] text-zinc-500">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors"><Minus className="w-3 h-3" /></button>
                            <span className="text-[13px] font-bold text-white w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors"><Plus className="w-3 h-3" /></button>
                            <button onClick={() => removeFromCart(item.product_id)} className="w-6 h-6 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors ml-1"><X className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-5 border-t border-white/5 space-y-3 bg-white/[0.02]">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400 font-medium">{t('total')}</span>
                        <span className="text-[22px] font-extrabold text-amber-400">${total.toFixed(2)}</span>
                      </div>
                      <button onClick={submitOrder} disabled={submitting}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                        {submitting ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> {t('send')}</> : <><Send className="w-4 h-4" /> {t('sendToKitchen')}</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-white/5">
                      <th className="text-left px-5 py-3">{t('order')}</th><th className="text-left px-5 py-3">{t('total')}</th>
                      <th className="text-left px-5 py-3">{t('orderType')}</th><th className="text-left px-5 py-3">{t('orderDetails')}</th>
                      <th className="text-left px-5 py-3">{t('statusLabel')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {myOrders.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-12 text-zinc-600">{t('noOrdersFound')}</td></tr>
                    ) : myOrders.map(o => (
                      <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white">#{o.id}</td>
                        <td className="px-5 py-3.5 font-semibold text-zinc-300">${Number(o.total_price).toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-zinc-500 capitalize">{o.type === 'dine-in' ? t('type.dineIn') : t('type.takeaway')}</td>
                        <td className="px-5 py-3.5 text-zinc-500">{o.items?.length || 0}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg ${sc(o.status)}`}>{translateStatus(o.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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
export default WaiterOrders;
