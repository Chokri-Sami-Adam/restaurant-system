import { useEffect, useState } from 'react';
import { RefreshCw, Eye, Printer, XCircle, Clock, User } from 'lucide-react';
import api from '../utils/axios';
import Modal from '../components/Modal';
import AlertDialog from '../components/AlertDialog';
import { useI18n } from '../i18n/I18nProvider';

const Orders = () => {
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });
  const [appSettings, setAppSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('app_settings') || '{}');
    } catch {
      return {};
    }
  });

  const fetchOrders = async () => { setLoading(true); try { const r = await api.get('/orders'); setOrders(r.data.data || r.data || []); } catch(error) { console.error('Error fetching orders:', error); } finally { setLoading(false); }};
  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    const syncSettings = () => {
      try {
        setAppSettings(JSON.parse(localStorage.getItem('app_settings') || '{}'));
      } catch {
        setAppSettings({});
      }
    };
    window.addEventListener('app-settings-updated', syncSettings);
    window.addEventListener('storage', syncSettings);
    return () => {
      window.removeEventListener('app-settings-updated', syncSettings);
      window.removeEventListener('storage', syncSettings);
    };
  }, []);
  const handleStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setAlert({ show: true, type: 'success', title: t('success'), message: t('orderStatusUpdated'), onConfirm: null });
      fetchOrders();
    } catch(e) {
      const errorMsg = e.response?.data?.message || e.response?.data?.error || e.message || t('failedToUpdateStatus');
      console.error('Status update error:', e);
      setAlert({ show: true, type: 'error', title: t('error'), message: errorMsg, onConfirm: null });
    }
  };
  const sc = (s) => ({ served:'text-emerald-400 bg-emerald-500/10', preparing:'text-sky-400 bg-sky-500/10', ready:'text-violet-400 bg-violet-500/10', pending:'text-amber-400 bg-amber-500/10', cancelled:'text-red-400 bg-red-500/10' }[s] || 'text-zinc-400 bg-zinc-500/10');
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  // Validation: next valid statuses based on current status
  const getValidNextStatuses = (current) => {
    const flows = {
      pending: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served', 'cancelled'],
      served: [],
      cancelled: []
    };
    return flows[current] || [];
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  // Calculate tax (use tax rate from settings)
  const calculateTax = (subtotal) => {
    const taxRate = (appSettings.tax_rate || 20) / 100;
    return subtotal * taxRate;
  };

  // Handle cancel order
  const handleCancelOrder = (order) => {
    setAlert({
      show: true,
      type: 'error',
      title: t('cancelOrderTitle') || 'Cancel Order',
      message: t('cancelOrderConfirm') || 'Are you sure you want to cancel this order?',
      onConfirm: async () => {
        try {
          await api.delete(`/orders/${order.id}`);
          setAlert({ show: true, type: 'success', title: t('success'), message: t('orderCancelledSuccessfully'), onConfirm: null });
          setSelected(null);
          fetchOrders();
        } catch(e) {
          const errorMsg = e.response?.data?.message || e.message || t('failedToCancelOrder');
          console.error('Cancel order error:', e);
          setAlert({ show: true, type: 'error', title: t('error'), message: errorMsg, onConfirm: null });
        }
      }
    });
  };

  // Handle print receipt
  const handlePrint = (order) => {
    const subtotal = order.items?.reduce((sum, item) => sum + Number(item.price), 0) || 0;
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;
    const logoHtml = appSettings.restaurant_logo_url ? `<div style="text-align:center;margin-bottom:15px;"><img src="${appSettings.restaurant_logo_url}" alt="logo" style="max-width:80px;max-height:80px;object-fit:contain;" /></div>` : '';
    
    // Receipt label translations
    const receiptLabels = {
      orderReceipt: t('orderReceipt'),
      orderNumber: t('orderNumber'),
      timeLabel: t('timeLabel'),
      typeLabel: t('typeLabel'),
      itemsLabel: t('itemsLabel'),
      subtotal: t('subtotal'),
      tax: t('tax'),
      total: t('total'),
      thankYou: t('thankYou'),
    };
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: monospace; width: 80mm; margin: 0; padding: 20px; }
          .header { text-align: center; font-weight: bold; margin-bottom: 20px; font-size: 14px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        ${logoHtml}
        <div class="header">${receiptLabels.orderReceipt}</div>
        <div class="divider"></div>
        <div class="item-row"><strong>${receiptLabels.orderNumber} #:</strong> ${order.id}</div>
        <div class="item-row"><strong>${receiptLabels.timeLabel}:</strong> ${formatDate(order.created_at)}</div>
        <div class="item-row"><strong>${receiptLabels.typeLabel}:</strong> ${translateType(order.type)}</div>
        <div class="divider"></div>
        <strong>${receiptLabels.itemsLabel}:</strong>
        ${order.items?.map(it => `
          <div class="item-row">
            <span>${it.product?.name || `Product #${it.product_id}`} x${it.quantity}</span>
            <span>$${Number(it.price).toFixed(2)}</span>
          </div>
        `).join('') || `<div>${t('noItems')}</div>`}
        <div class="divider"></div>
        <div class="item-row"><span>${receiptLabels.subtotal}:</span> <span>$${subtotal.toFixed(2)}</span></div>
        <div class="item-row"><span>${receiptLabels.tax} (${appSettings.tax_rate || 20}%):</span> <span>$${tax.toFixed(2)}</span></div>
        <div class="item-row total"><span>${receiptLabels.total}:</span> <span>$${total.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px;">${receiptLabels.thankYou}</div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  // Translation helpers
  const translateStatus = (s) => t(`status.${s}`) || s;
  const translateType = (type) => (type === 'takeaway' ? t('type.takeaway') : t('type.dineIn'));

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('orders')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('ordersFollowManage')}</p>
        </div>
        <button onClick={fetchOrders} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}</button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 bg-[#18181b] border border-[#27272a] rounded-xl p-1 w-fit overflow-x-auto">
        {['all','pending','preparing','ready','served','cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg capitalize transition-all whitespace-nowrap ${
              filter === f ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            {translateStatus(f)} <span className="text-zinc-600 ml-0.5">({f === 'all' ? orders.length : orders.filter(o => o.status === f).length})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-[#27272a]">
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('order')}</th><th className="text-left px-5 py-3 whitespace-nowrap">{t('total')}</th>
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('orderType')}</th><th className="text-left px-5 py-3 whitespace-nowrap">{t('orderDetails')}</th>
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('statusLabel')}</th><th className="text-left px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-zinc-600">{t('noOrdersFound')}</td></tr>
                ) : filtered.map(o => {
                  const itemsSubtotal = o.items?.reduce((sum, item) => sum + Number(item.price), 0) || 0;
                  const taxAmount = calculateTax(itemsSubtotal);
                  const displayTotal = itemsSubtotal + taxAmount;
                  return (
                  <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">#{o.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-300 whitespace-nowrap">${displayTotal.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-zinc-500 capitalize whitespace-nowrap">{translateType(o.type)}</td>
                    <td className="px-5 py-3.5 text-zinc-500 whitespace-nowrap">{o.items?.length || 0}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg inline-block ${sc(o.status)}`}>{translateStatus(o.status)}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button onClick={() => setSelected(o)} className="p-1.5 text-zinc-600 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`${t('order')} #${selected?.id}`}>
        {selected && (
          <div className="space-y-5">
            {/* Order Header Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card-flat p-3">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {t('orderType')}</p>
                <p className="text-sm font-bold text-white mt-1 capitalize">{translateType(selected.type)}</p>
              </div>
              <div className="card-flat p-3">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{t('statusLabel')}</p>
                <div className={`text-sm font-bold mt-1 capitalize px-2 py-1 rounded inline-block ${sc(selected.status)}`}>{translateStatus(selected.status)}</div>
              </div>
            </div>

            {/* Order Timestamp */}
            <div className="card-flat p-3">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Order Time</p>
              <p className="text-sm text-white mt-1">{formatDate(selected.created_at)}</p>
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-2">{t('orderDetails')}</p>
              <div className="space-y-1.5 bg-zinc-800/30 rounded-lg p-3">
                {selected.items?.length > 0 ? selected.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-700/50 last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-white">{it.product?.name || `#${it.product_id}`}</p>
                      <p className="text-[10px] text-zinc-600">×{it.quantity}</p>
                    </div>
                    <p className="text-[13px] font-bold text-amber-400">${Number(it.price).toFixed(2)}</p>
                  </div>
                )) : <p className="text-xs text-zinc-600 text-center py-3">{t('noItems')}</p>}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-zinc-800/30 rounded-lg p-3 space-y-2">
              {(() => {
                const itemsSubtotal = selected.items?.reduce((sum, item) => sum + Number(item.price), 0) || 0;
                const tax = calculateTax(itemsSubtotal);
                const total = itemsSubtotal + tax;
                return (
                  <>
                    <div className="flex items-center justify-between">
                    <p className="text-[12px] text-zinc-500">{t('subtotal')}:</p>
                      <p className="text-[12px] font-semibold text-zinc-300">${itemsSubtotal.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-zinc-500">{t('tax')} ({appSettings.tax_rate || 20}%):</p>
                      <p className="text-[12px] font-semibold text-zinc-300">${tax.toFixed(2)}</p>
                    </div>
                    <div className="border-t border-zinc-700 pt-2 mt-2 flex items-center justify-between">
                      <p className="text-[13px] font-bold text-white">{t('total')}:</p>
                      <p className="text-lg font-extrabold text-amber-400">${total.toFixed(2)}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Status Control */}
            {selected.status !== 'served' && selected.status !== 'cancelled' && (
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-2">{t('statusLabel')}</p>
                <select
                  value={selected.status}
                  onChange={e => {
                    const nextStatus = e.target.value;
                    handleStatus(selected.id, nextStatus);
                  }}
                  disabled={!getValidNextStatuses(selected.status).length}
                  className={`input-dark w-full ${sc(selected.status)} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value={selected.status}>{translateStatus(selected.status)}</option>
                  {getValidNextStatuses(selected.status).map(s => (
                    <option key={s} value={s}>{translateStatus(s)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handlePrint(selected)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-sky-400 border border-sky-500/30 rounded-lg hover:bg-sky-500/10 transition-all"
              >
                <Printer className="w-4 h-4" /> {t('printReceipt')}
              </button>
              {selected.status !== 'served' && selected.status !== 'cancelled' && (
                <button
                  onClick={() => handleCancelOrder(selected)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  <XCircle className="w-4 h-4" /> {t('deleteOrder')}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

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
export default Orders;
