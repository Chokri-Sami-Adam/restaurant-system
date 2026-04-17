import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Eye } from 'lucide-react';
import api from '../utils/axios';
import Modal from '../components/Modal';
import AlertDialog from '../components/AlertDialog';
import { useI18n } from '../i18n/I18nProvider';
import { formatMoney, getAppSettings } from '../utils/formatting';

const AdminOrders = () => {
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });
  const [createModal, setCreateModal] = useState({ show: false });
  const [editModal, setEditModal] = useState({ show: false, order: null });
  const [formItems, setFormItems] = useState([{ product_id: '', quantity: 1 }]);
  const [orderType, setOrderType] = useState('dine-in');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products')
      ]);
      setOrders(ordersRes.data.data || ordersRes.data || []);
      setProducts(productsRes.data.data || productsRes.data || []);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotal = () => {
    return formItems.reduce((sum, item) => {
      const product = products.find(p => p.id === parseInt(item.product_id));
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (formItems.some(item => !item.product_id || item.quantity < 1)) {
      setAlert({ show: true, type: 'error', title: t('error'), message: t('pleaseSelectProducts'), onConfirm: null });
      return;
    }

    try {
      await api.post('/orders', {
        items: formItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        })),
        type: orderType
      });
      setAlert({ show: true, type: 'success', title: t('success'), message: t('orderCreatedSuccessfully'), onConfirm: null });
      setCreateModal({ show: false });
      setFormItems([{ product_id: '', quantity: 1 }]);
      setOrderType('dine-in');
      fetchData();
    } catch (e) {
      const errorMsg = e.response?.data?.message || t('failedToCreateOrder');
      setAlert({ show: true, type: 'error', title: t('error'), message: errorMsg, onConfirm: null });
    }
  };

  const handleEditOrder = async () => {
    if (formItems.some(item => !item.product_id || item.quantity < 1)) {
      setAlert({ show: true, type: 'error', title: t('error'), message: t('pleaseSelectProducts'), onConfirm: null });
      return;
    }

    try {
      await api.put(`/orders/${editModal.order.id}`, {
        items: formItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        })),
        type: orderType
      });
      setAlert({ show: true, type: 'success', title: t('success'), message: t('orderUpdatedSuccessfully'), onConfirm: null });
      setEditModal({ show: false, order: null });
      setFormItems([{ product_id: '', quantity: 1 }]);
      setOrderType('dine-in');
      fetchData();
    } catch (e) {
      const errorMsg = e.response?.data?.message || t('failedToUpdateOrder');
      setAlert({ show: true, type: 'error', title: t('error'), message: errorMsg, onConfirm: null });
    }
  };

  const handleDeleteOrder = (order) => {
    setAlert({
      show: true,
      type: 'warning',
      title: t('deleteOrder'),
      message: t('deleteOrderConfirm'),
      onConfirm: async () => {
        try {
          await api.delete(`/orders/${order.id}`);
          setAlert({ show: true, type: 'success', title: t('success'), message: t('orderDeletedSuccessfully'), onConfirm: null });
          fetchData();
        } catch (e) {
          const errorMsg = e.response?.data?.message || e.message || t('failedToDeleteOrder');
          setAlert({ show: true, type: 'error', title: t('error'), message: errorMsg, onConfirm: null });
        }
      }
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setAlert({ show: true, type: 'success', title: t('success'), message: t('orderStatusUpdated'), onConfirm: null });
      if (selected?.id === orderId) {
        setSelected({ ...selected, status: newStatus });
      }
      fetchData();
    } catch (e) {
      const errorMsg = e.response?.data?.message || t('failedToUpdateStatus');
      setAlert({ show: true, type: 'error', title: t('error'), message: errorMsg, onConfirm: null });
    }
  };

  const getValidNextStatuses = (current) => {
    const flows = {
      pending: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served', 'cancelled'],
      served: ['paid', 'cancelled'],
      paid: [],
      cancelled: []
    };
    return flows[current] || [];
  };

  const openEditModal = (order) => {
    setFormItems(order.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    })));
    setOrderType(order.type || 'dine-in');
    setEditModal({ show: true, order });
  };

  const sc = (s) => ({
    served: 'text-emerald-400 bg-emerald-500/10',
    paid: 'text-green-400 bg-green-500/10',
    preparing: 'text-sky-400 bg-sky-500/10',
    ready: 'text-violet-400 bg-violet-500/10',
    pending: 'text-amber-400 bg-amber-500/10',
    cancelled: 'text-red-400 bg-red-500/10'
  }[s] || 'text-zinc-400 bg-zinc-500/10');

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const canEdit = (order) => !['paid', 'cancelled'].includes(order.status);

  // Calculate total with tax
  const calculateTotalWithTax = (orderTotalPrice) => {
    const appSettings = getAppSettings();
    const taxRate = parseFloat(appSettings.tax_rate || 0);
    const subtotal = parseFloat(orderTotalPrice || 0);
    const taxAmount = (subtotal * taxRate) / 100;
    return subtotal + taxAmount;
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('manageOrders')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('createAndManageOrders')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-ghost flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}
          </button>
          <button onClick={() => {
            setFormItems([{ product_id: '', quantity: 1 }]);
            setOrderType('dine-in');
            setCreateModal({ show: true });
          }} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t('createProduct')}
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-[#18181b]/50 backdrop-blur-sm border border-white/5 rounded-xl p-1 w-fit">
        {['all', 'pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'].map(status => (
          <button key={status} onClick={() => setFilter(status)} className={`text-[12px] font-semibold px-4 py-2 rounded-lg transition-all ${
            filter === status ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}>
            {t(`status.${status}`)} {status === 'all' && <span className="text-amber-400 ml-1">({orders.length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[15px] font-bold text-zinc-300">{t('noOrdersFound')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-white/5">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3">{t('items')}</th>
                  <th className="text-left px-5 py-3">{t('orderType')}</th>
                  <th className="text-left px-5 py-3">{t('total')}</th>
                  <th className="text-left px-5 py-3">{t('statusLabel')}</th>
                  <th className="text-left px-5 py-3">{t('date')}</th>
                  <th className="text-center px-5 py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400 font-bold">#{order.id}</td>
                    <td className="px-5 py-3.5 text-sm">
                      {order.items?.map((item, i) => (
                        <div key={i} className="text-zinc-400">
                          {item.product?.name || `#${item.product_id}`} x{item.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] uppercase font-semibold px-2 py-1 rounded bg-zinc-700 text-zinc-300">
                        {order.type === 'dine-in' ? t('type.dineIn') : order.type === 'takeaway' ? t('type.takeaway') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-amber-400">{formatMoney(calculateTotalWithTax(order.total_price))}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        disabled={!getValidNextStatuses(order.status).length}
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg ${sc(order.status)} disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                      >
                        <option value={order.status} style={{ backgroundColor: '#1f2937', color: '#fff', fontWeight: 'bold', padding: '8px' }}>
                          {t(`status.${order.status}`)}
                        </option>
                        {getValidNextStatuses(order.status).map(s => (
                          <option key={s} value={s} style={{ backgroundColor: '#374151', color: '#fbbf24', fontWeight: '600', padding: '8px' }}>
                            → {t(`status.${s}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex gap-2 justify-center">
                        {canEdit(order) && (
                          <button onClick={() => openEditModal(order)} className="p-1.5 hover:bg-sky-500/10 rounded text-sky-400 transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteOrder(order)} className="p-1.5 hover:bg-red-500/10 rounded text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <Modal isOpen={createModal.show} onClose={() => setCreateModal({ show: false })} title={t('createProduct')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase">{t('orderType')}</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}
              className="w-full mt-2 px-3 py-2 rounded-lg bg-[#18181b] border border-white/10 text-white text-sm focus:border-amber-500 outline-none">
              <option value="dine-in">{t('dineIn')}</option>
              <option value="takeaway">{t('type.takeaway')}</option>
              <option value="delivery">{t('type.delivery')}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase mb-2 block">{t('items')}</label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {formItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <select value={item.product_id} onChange={(e) => {
                    const newItems = [...formItems];
                    newItems[idx].product_id = e.target.value;
                    setFormItems(newItems);
                  }}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#18181b] border border-white/10 text-white text-sm focus:border-amber-500 outline-none">
                    <option value="">{t('selectProduct')}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatMoney(p.price)})</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => {
                    const newItems = [...formItems];
                    newItems[idx].quantity = parseInt(e.target.value) || 1;
                    setFormItems(newItems);
                  }}
                    className="w-20 px-3 py-2 rounded-lg bg-[#18181b] border border-white/10 text-white text-sm focus:border-amber-500 outline-none" />
                  <button onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))}
                    className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold">
                    {t('delete')}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setFormItems([...formItems, { product_id: '', quantity: 1 }])}
              className="mt-2 w-full py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 text-sm font-semibold">
              + {t('addItem')}
            </button>
          </div>

          <div className="border-t border-white/10 pt-4 text-right">
            <p className="text-sm text-zinc-500 mb-3">{t('total')}: <span className="text-amber-400 font-bold text-lg">{formatMoney(calculateTotal())}</span></p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCreateModal({ show: false })} className="btn-ghost">{t('cancel')}</button>
              <button onClick={handleCreateOrder} className="btn-primary">{t('createProduct')}</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Order Modal */}
      <Modal isOpen={editModal.show} onClose={() => setEditModal({ show: false, order: null })} title={`${t('edit')} ${t('order')} #${editModal.order?.id}`}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase">{t('orderType')}</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}
              className="w-full mt-2 px-3 py-2 rounded-lg bg-[#18181b] border border-white/10 text-white text-sm focus:border-amber-500 outline-none">
              <option value="dine-in">{t('dineIn')}</option>
              <option value="takeaway">{t('type.takeaway')}</option>
              <option value="delivery">{t('type.delivery')}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase mb-2 block">{t('items')}</label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {formItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <select value={item.product_id} onChange={(e) => {
                    const newItems = [...formItems];
                    newItems[idx].product_id = e.target.value;
                    setFormItems(newItems);
                  }}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#18181b] border border-white/10 text-white text-sm focus:border-amber-500 outline-none">
                    <option value="">{t('selectProduct')}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatMoney(p.price)})</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => {
                    const newItems = [...formItems];
                    newItems[idx].quantity = parseInt(e.target.value) || 1;
                    setFormItems(newItems);
                  }}
                    className="w-20 px-3 py-2 rounded-lg bg-[#18181b] border border-white/10 text-white text-sm focus:border-amber-500 outline-none" />
                  <button onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))}
                    className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold">
                    {t('delete')}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setFormItems([...formItems, { product_id: '', quantity: 1 }])}
              className="mt-2 w-full py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 text-sm font-semibold">
              + {t('addItem')}
            </button>
          </div>

          <div className="border-t border-white/10 pt-4 text-right">
            <p className="text-sm text-zinc-500 mb-3">{t('total')}: <span className="text-amber-400 font-bold text-lg">{formatMoney(calculateTotal())}</span></p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditModal({ show: false, order: null })} className="btn-ghost">{t('cancel')}</button>
              <button onClick={handleEditOrder} className="btn-primary">{t('save')}</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Order Preview Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`${t('order')} #${selected?.id}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-semibold tracking-wider">{t('orderType')}</p>
                <p className="text-[13px] font-semibold text-white capitalize mt-1">{selected.type === 'dine-in' ? t('type.dineIn') : selected.type === 'takeaway' ? t('type.takeaway') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-semibold tracking-wider">{t('total')}</p>
                <p className="text-[13px] font-semibold text-amber-400 mt-1">{formatMoney(calculateTotalWithTax(selected.total_price))}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-semibold tracking-wider">{t('statusLabel')}</p>
                <select
                  value={selected.status}
                  onChange={e => handleStatusChange(selected.id, e.target.value)}
                  disabled={!getValidNextStatuses(selected.status).length}
                  className={`input-dark w-full text-[11px] font-bold uppercase mt-1 ${sc(selected.status)} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value={selected.status} style={{ backgroundColor: '#1f2937', color: '#fff', fontWeight: 'bold', padding: '8px' }}>
                    {t(`status.${selected.status}`)}
                  </option>
                  {getValidNextStatuses(selected.status).map(s => (
                    <option key={s} value={s} style={{ backgroundColor: '#374151', color: '#fbbf24', fontWeight: '600', padding: '8px' }}>
                      → {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-semibold tracking-wider">{t('date')}</p>
                <p className="text-[13px] font-semibold text-white mt-1">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="text-[10px] text-zinc-600 uppercase font-semibold tracking-wider mb-2">{t('items')}</p>
              <div className="space-y-2">
                {selected.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[13px] text-zinc-400">
                    <span>{item.product?.name || `Product #${item.product_id}`} x{item.quantity}</span>
                    <span className="text-amber-400">{formatMoney(item.price)}</span>
                  </div>
                )) || <p className="text-zinc-500">{t('noItems')}</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>

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

export default AdminOrders;
