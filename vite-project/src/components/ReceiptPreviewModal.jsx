import { Printer, X } from 'lucide-react';
import { getLocale } from '../utils/formatting';

const ReceiptPreviewModal = ({ isOpen, onClose, receipt, order, payment }) => {
  if (!isOpen || !receipt) return null;
  const locale = getLocale();

  const money = (value) => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: receipt.currency || 'MAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    } catch {
      return `${Number(value || 0).toFixed(2)} ${receipt.currency || 'MAD'}`;
    }
  };

  const printReceipt = () => {
    const logoHtml = receipt.show_logo && receipt.logo_url
      ? `<div style="text-align:center;margin-bottom:10px;"><img src="${receipt.logo_url}" alt="logo" style="max-width:70px;max-height:70px;object-fit:contain;" /></div>`
      : '';

    const itemsHtml = (order?.items || [])
      .map((it) => `<tr><td style="padding:4px 0;">${it.product?.name || `#${it.product_id}`}</td><td style="padding:4px 0;text-align:center;">x${it.quantity}</td><td style="padding:4px 0;text-align:right;">${money(it.price || 0)}</td></tr>`)
      .join('');

    const taxHtml = receipt.show_tax_details
      ? `<div style="display:flex;justify-content:space-between;"><span>TVA (${receipt.tax_rate || 0}%)</span><strong>${money(receipt.tax_amount || 0)}</strong></div>`
      : '';

    const w = window.open('', '_blank', 'width=420,height=720');
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>Reçu #${payment?.id || ''}</title>
          <style>
            body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace; margin: 0; padding: 20px; background: #fff; color: #111; }
            .ticket { max-width: 320px; margin: 0 auto; border: 1px dashed #999; padding: 14px; }
            .center { text-align: center; }
            .muted { color: #555; font-size: 12px; }
            .line { border-top: 1px dashed #999; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .totals div { margin: 4px 0; }
            .big { font-size: 16px; }
            @media print { body { padding: 0; } .ticket { border: none; } }
          </style>
        </head>
        <body>
          <div class="ticket">
            ${logoHtml}
            <div class="center big"><strong>${receipt.restaurant_name || 'Restaurant'}</strong></div>
            ${receipt.restaurant_address ? `<div class="center muted">${receipt.restaurant_address}</div>` : ''}
            ${receipt.restaurant_phone ? `<div class="center muted">Tel: ${receipt.restaurant_phone}</div>` : ''}
            ${receipt.restaurant_email ? `<div class="center muted">${receipt.restaurant_email}</div>` : ''}
            ${receipt.opening_hours ? `<div class="center muted">${receipt.opening_hours}</div>` : ''}

            <div class="line"></div>

            <div class="muted">Commande: #${order?.id || payment?.order_id || ''}</div>
            <div class="muted">Paiement: #${payment?.id || ''}</div>
            <div class="muted">Méthode: ${payment?.method || ''}</div>
            <div class="muted">Date: ${new Date(payment?.created_at || Date.now()).toLocaleString(locale)}</div>

            <div class="line"></div>

            <table>
              <thead>
                <tr><th align="left">Article</th><th align="center">Qté</th><th align="right">Montant</th></tr>
              </thead>
              <tbody>
                ${itemsHtml || '<tr><td colspan="3" style="padding:6px 0;">Aucun détail article</td></tr>'}
              </tbody>
            </table>

            <div class="line"></div>

            <div class="totals">
              <div style="display:flex;justify-content:space-between;"><span>Sous-total</span><strong>${money(receipt.subtotal || 0)}</strong></div>
              ${taxHtml}
              <div style="display:flex;justify-content:space-between;font-size:16px;"><span><strong>Total</strong></span><strong>${money(receipt.total || 0)}</strong></div>
            </div>

            <div class="line"></div>

            <div class="center muted">${receipt.footer_message || 'Merci pour votre visite'}</div>
          </div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);

    w.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-2xl overflow-hidden border border-white/10 bg-[#0f0f12] shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white text-[14px] font-bold">Aperçu du Reçu</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3 flex-1 overflow-auto">
          <div className="bg-white text-black rounded-xl p-2 space-y-1">
            {receipt.show_logo && receipt.logo_url && (
              <div>
                <img src={receipt.logo_url} alt="logo" className="w-14 h-14 mx-auto object-contain" />
              </div>
            )}
            <div className="text-center -mt-1">
              <p className="font-bold text-[14px] leading-tight">{receipt.restaurant_name}</p>
              {receipt.restaurant_address && <p className="text-[10px] text-zinc-600 leading-tight">{receipt.restaurant_address}</p>}
              {receipt.restaurant_phone && <p className="text-[10px] text-zinc-600 leading-tight">Tel: {receipt.restaurant_phone}</p>}
              {receipt.restaurant_email && <p className="text-[10px] text-zinc-600 leading-tight">{receipt.restaurant_email}</p>}
              {receipt.opening_hours && <p className="text-[10px] text-zinc-600 leading-tight">{receipt.opening_hours}</p>}
            </div>

            <div className="border-t border-dashed border-zinc-400 my-1" />

            <div className="text-[11px] text-zinc-700 space-y-0.5">
              <p>Commande: #{order?.id || payment?.order_id || '-'}</p>
              <p>Paiement: #{payment?.id || '-'}</p>
              <p>Méthode: {payment?.method || '-'}</p>
              <p>Date: {new Date(payment?.created_at || Date.now()).toLocaleString(locale)}</p>
            </div>

            <div className="border-t border-dashed border-zinc-400 my-1" />

            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-zinc-600 border-b border-dashed border-zinc-300">
                  <th className="pb-0.5">Article</th>
                  <th className="text-center pb-0.5">Qté</th>
                  <th className="text-right pb-0.5">Montant</th>
                </tr>
              </thead>
              <tbody>
                {(order?.items || []).length > 0 ? (
                  order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-0.5">{it.product?.name || `#${it.product_id}`}</td>
                      <td className="py-0.5 text-center">x{it.quantity}</td>
                      <td className="py-0.5 text-right">{money(it.price || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-1 text-zinc-500">Aucun détail article</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border-t border-dashed border-zinc-400 my-1" />

            <div className="text-[11px] space-y-0.5">
              <div className="flex justify-between"><span>Sous-total</span><span className="font-semibold">{money(receipt.subtotal || 0)}</span></div>
              {receipt.show_tax_details && (
                <div className="flex justify-between"><span>TVA ({receipt.tax_rate || 0}%)</span><span className="font-semibold">{money(receipt.tax_amount || 0)}</span></div>
              )}
              <div className="flex justify-between text-[13px] font-bold border-t border-dashed border-zinc-300 pt-0.5"><span>Total</span><span>{money(receipt.total || 0)}</span></div>
            </div>

            <div className="border-t border-dashed border-zinc-400 my-1" />
            <p className="text-center text-[10px] text-zinc-600">{receipt.footer_message || 'Merci pour votre visite'}</p>
          </div>
        </div>

        <div className="p-3 border-t border-white/10 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold">Fermer</button>
          <button onClick={printReceipt} className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold inline-flex items-center gap-1">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
