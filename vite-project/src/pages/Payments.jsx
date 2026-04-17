import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, RefreshCw, CheckCircle, Banknote, Eye, Printer } from 'lucide-react';
import api from '../utils/axios';
import AlertDialog from '../components/AlertDialog';
import ReceiptPreviewModal from '../components/ReceiptPreviewModal';
import { formatMoney, formatDateByTimezone, getAppSettings } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';

const Payments = () => {
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('unpaid');
  const [processing, setProcessing] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });
  const [paymentSettings, setPaymentSettings] = useState({ payment_cash: true, payment_card: true, payment_online: false });
  const [receiptPreview, setReceiptPreview] = useState({ isOpen: false, receipt: null, order: null, payment: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [o, p] = await Promise.all([api.get('/orders'), api.get('/payments')]);
      const allOrders = o.data.data || o.data || [];
      const allPayments = p.data.data || [];
      const paidOrderIds = allPayments.map(pay => pay.order_id);
      // Show only ready/served orders that are NOT paid
      setOrders(allOrders.filter(order => ['ready', 'served'].includes(order.status) && !paidOrderIds.includes(order.id)));
      setPayments(allPayments);
      setPaymentSettings({
        payment_cash: getAppSettings().payment_cash !== false,
        payment_card: getAppSettings().payment_card !== false,
        payment_online: getAppSettings().payment_online === true,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const syncSettings = () => {
      setPaymentSettings({
        payment_cash: getAppSettings().payment_cash !== false,
        payment_card: getAppSettings().payment_card !== false,
        payment_online: getAppSettings().payment_online === true,
      });

      // Force receipt preview to refresh with new settings
      if (receiptPreview.isOpen && receiptPreview.receipt) {
        const appSettings = JSON.parse(localStorage.getItem('app_settings') || '{}');
        setReceiptPreview((prev) => ({
          ...prev,
          receipt: {
            ...prev.receipt,
            show_logo: appSettings.receipt_show_logo !== undefined ? appSettings.receipt_show_logo : prev.receipt.show_logo,
            show_tax_details: appSettings.receipt_show_tax_details !== undefined ? appSettings.receipt_show_tax_details : prev.receipt.show_tax_details,
            footer_message: appSettings.receipt_footer_message || prev.receipt.footer_message,
            restaurant_name: appSettings.restaurant_name || prev.receipt.restaurant_name,
            restaurant_address: appSettings.restaurant_address || prev.receipt.restaurant_address,
            restaurant_phone: appSettings.restaurant_phone || prev.receipt.restaurant_phone,
            restaurant_email: appSettings.restaurant_email || prev.receipt.restaurant_email,
            opening_hours: appSettings.opening_hours || prev.receipt.opening_hours,
          },
        }));
      }
    };
    window.addEventListener('app-settings-updated', syncSettings);
    window.addEventListener('storage', syncSettings);
    return () => {
      window.removeEventListener('app-settings-updated', syncSettings);
      window.removeEventListener('storage', syncSettings);
    };
  }, [receiptPreview]);

  // Calculate total with tax
  const calculateTotalWithTax = (orderTotalPrice) => {
    const appSettings = getAppSettings();
    const taxRate = parseFloat(appSettings.tax_rate || 0);
    const subtotal = parseFloat(orderTotalPrice || 0);
    const taxAmount = (subtotal * taxRate) / 100;
    return subtotal + taxAmount;
  };

  const processPayment = async (orderId, method) => {
    setProcessing(orderId);
    try {
      const selectedOrder = orders.find((o) => o.id === orderId) || null;
      const res = await api.post('/payments', { order_id: orderId, method });
      setReceiptPreview({
        isOpen: true,
        receipt: res.data?.receipt || null,
        order: selectedOrder,
        payment: res.data?.payment || null,
      });
      fetchData();
    } catch (e) {
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
    finally { setProcessing(null); }
  };

  const handlePaymentClick = (orderId, method) => {
    const selectedOrder = orders.find((o) => o.id === orderId);
    const totalWithTax = calculateTotalWithTax(selectedOrder?.total_price);
    setAlert({
      show: true,
      type: 'warning',
      title: t('confirmPayment'),
      message: `${t('askConfirmPayment')} ${t('order')} #${orderId} ${formatMoney(totalWithTax)}?`,
      onConfirm: () => {
        setAlert({ show: false, type: 'info', title: '', message: '', onConfirm: null });
        processPayment(orderId, method);
      }
    });
  };

  const handleViewReceipt = async (paymentId) => {
    try {
      const paymentDetail = payments.find(p => p.id === paymentId);
      if (!paymentDetail) return;

      const orderRes = await api.get(`/orders/${paymentDetail.order_id}`);
      const order = orderRes.data.data || orderRes.data;
      
      const appSettings = getAppSettings();
      const taxRate = parseFloat(appSettings.tax_rate || 0);
      const subtotal = parseFloat(paymentDetail.amount) / (1 + taxRate / 100);
      const taxAmount = paymentDetail.amount - subtotal;

      const receipt = {
        restaurant_name: appSettings.restaurant_name || 'RestauPro',
        restaurant_address: appSettings.restaurant_address || '',
        restaurant_phone: appSettings.restaurant_phone || '',
        restaurant_email: appSettings.restaurant_email || '',
        opening_hours: appSettings.opening_hours || '',
        logo_url: appSettings.restaurant_logo_url || null,
        show_logo: appSettings.receipt_show_logo !== false,
        show_tax_details: appSettings.receipt_show_tax_details !== false,
        footer_message: appSettings.receipt_footer_message || '',
        currency: appSettings.currency || 'MAD',
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: paymentDetail.amount,
      };

      setReceiptPreview({
        isOpen: true,
        receipt: receipt,
        order: order,
        payment: paymentDetail,
      });
    } catch (e) {
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
  };

  const todayPayments = payments.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString());
  const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('payments')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('history')}</p>
        </div>
        <button onClick={fetchData} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/20"><DollarSign className="w-4 h-4" /></div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{t('paymentToday')}</p>
          </div>
          <p className="text-[28px] font-extrabold text-white">{formatMoney(todayTotal)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl text-sky-400 bg-sky-500/10 ring-1 ring-sky-500/20"><CreditCard className="w-4 h-4" /></div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{t('paymentTodayTransactions')}</p>
          </div>
          <p className="text-[28px] font-extrabold text-white">{todayPayments.length}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/20"><Banknote className="w-4 h-4" /></div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{t('awaiting')}</p>
          </div>
          <p className="text-[28px] font-extrabold text-white">{orders.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#18181b]/50 backdrop-blur-sm border border-white/5 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('unpaid')} className={`text-[12px] font-semibold px-4 py-2 rounded-lg transition-all ${tab === 'unpaid' ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          {t('unpaid')} {orders.length > 0 && <span className="text-amber-400 ml-1">({orders.length})</span>}
        </button>
        <button onClick={() => setTab('history')} className={`text-[12px] font-semibold px-4 py-2 rounded-lg transition-all ${tab === 'history' ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          {t('history')} <span className="text-zinc-600 ml-1">({payments.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          {tab === 'unpaid' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="card p-12 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-[15px] font-bold text-zinc-300">{t('paid')}</p>
                  <p className="text-sm text-zinc-600 mt-1">{t('noPayments')}</p>
                </div>
              ) : orders.map(order => (
                <div key={order.id} className="card overflow-hidden">
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[18px] font-extrabold text-white brand-font">#{order.id}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg text-amber-400 bg-amber-500/10">
                          {order.type === 'dine-in' ? t('type.dineIn') : t('type.takeaway')}
                        </span>
                      </div>
                      {order.items?.length > 0 && (
                        <div className="text-[12px] text-zinc-500 space-y-0.5">
                          {order.items.map((it, i) => (
                            <span key={i} className="inline-block mr-3">{it.product?.name || `#${it.product_id}`} ×{it.quantity}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[22px] font-extrabold text-amber-400 mb-3">{formatMoney(calculateTotalWithTax(order.total_price))}</p>
                      <div className="flex gap-2">
                        {paymentSettings.payment_cash && (
                          <button onClick={() => handlePaymentClick(order.id, 'cash')} disabled={processing === order.id}
                            className="text-[12px] font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5" /> {t('cash')}
                          </button>
                        )}
                        {paymentSettings.payment_card && (
                          <button onClick={() => handlePaymentClick(order.id, 'card')} disabled={processing === order.id}
                            className="text-[12px] font-bold px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> {t('card')}
                          </button>
                        )}
                        {paymentSettings.payment_online && (
                          <button onClick={() => handlePaymentClick(order.id, 'mobile')} disabled={processing === order.id}
                            className="text-[12px] font-bold px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> {t('online')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-white/5">
                      <th className="text-left px-5 py-3">ID</th><th className="text-left px-5 py-3">{t('order')}</th>
                      <th className="text-left px-5 py-3">{t('amount')}</th><th className="text-left px-5 py-3">{t('method')}</th>
                      <th className="text-left px-5 py-3">{t('statusLabel')}</th><th className="text-left px-5 py-3">{t('date')}</th>
                      <th className="text-left px-5 py-3">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-12 text-zinc-600">{t('noPayments')}</td></tr>
                    ) : payments.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 text-zinc-400">#{p.id}</td>
                        <td className="px-5 py-3.5 font-bold text-white">#{p.order_id}</td>
                        <td className="px-5 py-3.5 font-semibold text-emerald-400">{formatMoney(p.amount)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg ${p.method === 'cash' ? 'text-emerald-400 bg-emerald-500/10' : p.method === 'card' ? 'text-sky-400 bg-sky-500/10' : 'text-violet-400 bg-violet-500/10'}`}>
                            {p.method === 'cash' ? t('cash') : p.method === 'card' ? t('card') : t('online')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg text-emerald-400 bg-emerald-500/10">{t('paid')}</span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-500 text-xs">{formatDateByTimezone(p.created_at)}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => handleViewReceipt(p.id)} title={t('view')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition-colors">
                            <Eye className="w-4 h-4" /> {t('view')}
                          </button>
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

      <ReceiptPreviewModal
        isOpen={receiptPreview.isOpen}
        onClose={() => setReceiptPreview({ isOpen: false, receipt: null, order: null, payment: null })}
        receipt={receiptPreview.receipt}
        order={receiptPreview.order}
        payment={receiptPreview.payment}
      />
    </div>
  );
};
export default Payments;
