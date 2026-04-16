import { useState, useEffect } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../utils/axios';
import { getLocale } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';

const Stock = () => {
  const { t } = useI18n();
  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('alerts');
  const locale = getLocale();
  const recentMovements = Array.isArray(movements) ? movements.slice(0, 100) : [];

  const fetch = async () => { setLoading(true); try { const [s,m] = await Promise.all([api.get('/admin/low-stock'), api.get('/stock-movements')]); setLowStock(s.data.data||[]); setMovements(m.data.data||[]); } catch(e){} finally{setLoading(false);} };
  useEffect(() => { fetch(); }, []);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('stock')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('stockInventory')}</p>
        </div>
        <button onClick={fetch} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#18181b] border border-[#27272a] rounded-xl p-1 w-fit">
        <button onClick={() => setTab('alerts')} className={`text-[11px] font-semibold px-4 py-1.5 rounded-lg transition-all ${tab==='alerts' ? 'bg-amber-500/10 text-amber-400':'text-zinc-500 hover:text-zinc-300'}`}>
          {t('lowStock')} {lowStock.length > 0 && <span className="text-red-400 ml-1">({lowStock.length})</span>}
        </button>
        <button onClick={() => setTab('history')} className={`text-[11px] font-semibold px-4 py-1.5 rounded-lg transition-all ${tab==='history' ? 'bg-amber-500/10 text-amber-400':'text-zinc-500 hover:text-zinc-300'}`}>
          {t('history')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          {tab === 'alerts' && (
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#27272a]">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-[13px] font-bold text-white">{t('lowStockItems')}</h2>
              </div>
              {lowStock.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                  <p className="text-sm text-zinc-400 font-medium">{t('ok')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-[#27272a]">
                      <th className="text-left px-5 py-2.5 whitespace-nowrap">{t('ingredient')}</th><th className="text-left px-5 py-2.5 whitespace-nowrap">{t('stockCurrent')}</th>
                      <th className="text-left px-5 py-2.5 whitespace-nowrap">{t('alertAt')}</th><th className="text-left px-5 py-2.5 whitespace-nowrap">Shortage</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {lowStock.map((item, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-5 py-3 whitespace-nowrap"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50"></span><span className="font-semibold text-white">{item.name}</span></div></td>
                          <td className="px-5 py-3 font-bold text-red-400 whitespace-nowrap">{item.quantity} {item.unit||'pcs'}</td>
                          <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">{item.alert_threshold}</td>
                          <td className="px-5 py-3 text-red-400 font-bold whitespace-nowrap">{Math.max(0, Number(item.alert_threshold) - Number(item.quantity)).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#27272a]"><h2 className="text-[13px] font-bold text-white">{t('stock')}</h2></div>
              {recentMovements.length === 0 ? (
                <p className="text-sm text-zinc-600 p-5 text-center">{t('noData')}</p>
              ) : (
                <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-[#27272a]">
                      <th className="text-left px-5 py-2.5 whitespace-nowrap">{t('statusLabel')}</th><th className="text-left px-5 py-2.5 whitespace-nowrap">{t('ingredient')}</th>
                      <th className="text-left px-5 py-2.5 whitespace-nowrap">{t('stockQty')}</th><th className="text-left px-5 py-2.5 whitespace-nowrap">{t('date')}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {recentMovements.map((m, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-5 py-3 whitespace-nowrap">
                            {m.type === 'in' ? (
                              <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                {t('stockIn')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400 text-xs font-bold">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                {t('stockOut')}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 font-medium text-white whitespace-nowrap">{m.ingredient?.name || `#${m.ingredient_id}`}</td>
                          <td className="px-5 py-3 text-zinc-300 whitespace-nowrap">{m.quantity}</td>
                          <td className="px-5 py-3 text-zinc-500 text-xs whitespace-nowrap">{new Date(m.created_at).toLocaleString(locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default Stock;
