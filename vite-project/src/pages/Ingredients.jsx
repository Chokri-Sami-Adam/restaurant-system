import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import api from '../utils/axios';
import Modal from '../components/Modal';
import AlertDialog from '../components/AlertDialog';
import { useI18n } from '../i18n/I18nProvider';

const Ingredients = () => {
  const { t } = useI18n();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', quantity: '', unit: 'pcs', alert_threshold: '' });
  const [restockQty, setRestockQty] = useState('');
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });
  const ingredientsList = Array.isArray(ingredients) ? ingredients : [];

  const isPieceUnit = (unit) => (unit || 'pcs').toLowerCase() === 'pcs';
  const normalizeQty = (value, unit) => {
    const num = Number(value || 0);
    if (!Number.isFinite(num)) return 0;
    return isPieceUnit(unit) ? Math.max(0, Math.round(num)) : Math.max(0, num);
  };
  const formatQty = (value, unit) => {
    const num = Number(value || 0);
    if (!Number.isFinite(num)) return '0';
    return isPieceUnit(unit) ? String(Math.round(num)) : num.toFixed(2);
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get('/ingredients');
      const payload = r.data?.data ?? r.data ?? [];
      setIngredients(Array.isArray(payload) ? payload : []);
    } catch (e) {
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        quantity: normalizeQty(form.quantity, form.unit),
        alert_threshold: normalizeQty(form.alert_threshold, form.unit),
      };
      await api.post('/ingredients', payload);
      setShowCreate(false);
      setForm({ name:'',quantity:'',unit:'pcs',alert_threshold:'' });
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetch();
      window.dispatchEvent(new Event('stock-updated'));
    } catch (e) {
      setAlert({
        show: true,
        type: 'error',
        title: t('error'),
        message: e.response?.data?.message || e.message || t('error'),
        onConfirm: null,
      });
    }
  };
  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selected?.id) {
      setAlert({ show: true, type: 'error', title: t('error'), message: t('error'), onConfirm: null });
      return;
    }
    try {
      const nextQuantity = normalizeQty(Number(selected.quantity) + Number(restockQty), selected.unit);
      await api.put(`/ingredients/${selected.id}`, { quantity: nextQuantity });
      setShowRestock(false);
      setRestockQty('');
      setSelected(null);
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetch();
      window.dispatchEvent(new Event('stock-updated'));
    } catch (e) {
      setAlert({
        show: true,
        type: 'error',
        title: t('error'),
        message: e.response?.data?.message || e.message || t('error'),
        onConfirm: null,
      });
    }
  };

  const handleDelete = (ingredient) => {
    setAlert({
      show: true,
      type: 'warning',
      title: t('deleteIngredient'),
      message: `${t('deleteIngredient')} ${ingredient.name} ?`,
      onConfirm: async () => {
        try {
          await api.delete(`/ingredients/${ingredient.id}`);
          setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
          fetch();
          window.dispatchEvent(new Event('stock-updated'));
        } catch (e) {
          setAlert({
            show: true,
            type: 'error',
            title: t('error'),
            message: e.response?.data?.message || t('error'),
            onConfirm: null,
          });
        }
      },
    });
  };

  const isLow = (item) => Number(item.quantity) <= Number(item.alert_threshold);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('ingredients')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('stockInventory')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" /> {t('createIngredient')}</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-[#27272a]">
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('ingredient')}</th><th className="text-left px-5 py-3 whitespace-nowrap">{t('stock')}</th>
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('stockUnit')}</th><th className="text-left px-5 py-3 whitespace-nowrap">{t('alertAt')}</th>
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('statusLabel')}</th><th className="text-left px-5 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {ingredientsList.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-zinc-600">{t('noIngredientYet')}</td></tr>
                ) : ingredientsList.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-white whitespace-nowrap">{item.name}</td>
                    <td className={`px-5 py-3.5 font-bold whitespace-nowrap ${isLow(item) ? 'text-red-400' : 'text-zinc-300'}`}>{formatQty(item.quantity, item.unit)}</td>
                    <td className="px-5 py-3.5 text-zinc-500 whitespace-nowrap">{item.unit || 'pcs'}</td>
                    <td className="px-5 py-3.5 text-zinc-600 whitespace-nowrap">≤ {formatQty(item.alert_threshold, item.unit)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {isLow(item) ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 inline-flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>{t('low')}</span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">{t('ok')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelected(item); setShowRestock(true); }}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-lg transition-all">{t('restock')}</button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                          title={t('deleteIngredient')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('createIngredient')}>
        <form onSubmit={handleCreate} className="space-y-3">
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Nom</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="ex: Sauce Tomate" className="input-dark" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Qté</label><input required type="number" step={isPieceUnit(form.unit) ? '1' : '0.01'} value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} className="input-dark" /></div>
            <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Unité</label><select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} className="input-dark"><option value="pcs">pcs</option><option value="kg">kg</option><option value="g">g</option><option value="liters">L</option><option value="ml">ml</option></select></div>
            <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Alerte à</label><input required type="number" step={isPieceUnit(form.unit) ? '1' : '0.01'} value={form.alert_threshold} onChange={e=>setForm({...form,alert_threshold:e.target.value})} className="input-dark" /></div>
          </div>
          <button type="submit" className="btn-primary w-full mt-2">{t('createIngredient')}</button>
        </form>
      </Modal>

      {/* Restock */}
      <Modal isOpen={showRestock} onClose={() => { setShowRestock(false); setSelected(null); }} title={`${t('restock')}: ${selected?.name || ''}`}>
        <form onSubmit={handleRestock} className="space-y-3">
          <div className="card-flat p-4 flex justify-between text-sm"><span className="text-zinc-500">{t('stockCurrent')}</span><span className="font-bold text-white">{formatQty(selected?.quantity, selected?.unit)} {selected?.unit||'pcs'}</span></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Ajouter quantité</label><input required type="number" step={isPieceUnit(selected?.unit) ? '1' : '0.01'} min="1" value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder="Combien ?" className="input-dark" /></div>
          {restockQty && <p className="text-xs text-zinc-500">Nouveau total : <span className="font-bold text-emerald-400">{formatQty(Number(selected?.quantity||0)+Number(restockQty), selected?.unit)}</span></p>}
          <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all mt-1">{t('confirm')}</button>
        </form>
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
export default Ingredients;
