import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import api from '../utils/axios';
import Modal from '../components/Modal';
import AlertDialog from '../components/AlertDialog';
import { useI18n } from '../i18n/I18nProvider';
import { formatMoney } from '../utils/formatting';

const Products = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', is_available: true });
  const [createIngredients, setCreateIngredients] = useState([]);
  const [modifyForm, setModifyForm] = useState({ name: '', description: '', price: '', category_id: '', is_available: true });
  const [modifyIngredients, setModifyIngredients] = useState([]);
  const [catName, setCatName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Alert states
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const [p, c, i] = await Promise.all([api.get('/products'), api.get('/categories'), api.get('/ingredients')]);
      setProducts(p.data.data || p.data || []);
      setCategories(c.data.data || c.data || []);
      setIngredients(i.data.data || i.data || []);
    } catch (e) {
      // keep silent here; alerts are shown on explicit actions
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); }, []);

  const addCreateIngredientRow = () => {
    setCreateIngredients((prev) => [...prev, { ingredient_id: '', quantity: '1' }]);
  };

  const removeCreateIngredientRow = (index) => {
    setCreateIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCreateIngredientRow = (index, key, value) => {
    setCreateIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addModifyIngredientRow = () => {
    setModifyIngredients((prev) => [...prev, { ingredient_id: '', quantity: '1' }]);
  };

  const removeModifyIngredientRow = (index) => {
    setModifyIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateModifyIngredientRow = (index, key, value) => {
    setModifyIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const productPayload = {
        ...form,
        price: Number(form.price),
        category_id: Number(form.category_id),
      };

      const created = await api.post('/products', productPayload);
      const productId = created.data?.data?.id ?? created.data?.id;

      const validIngredients = createIngredients
        .map((row) => ({
          id: Number(row.ingredient_id),
          quantity: Number(row.quantity),
        }))
        .filter((row) => Number.isInteger(row.id) && row.id > 0 && Number.isInteger(row.quantity) && row.quantity > 0);

      if (productId && validIngredients.length > 0) {
        await api.post(`/products/${productId}/ingredients`, { ingredients: validIngredients });
      }

      setShowCreate(false);
      setForm({ name:'',description:'',price:'',category_id:'',is_available:true });
      setCreateIngredients([]);
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetch();
    } catch(e){
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
  };

  const handleDelete = async (id) => {
    setDeleteTarget(id);
    setAlert({
      show: true,
      type: 'error',
      title: t('deleteProduct'),
      message: t('ingredientDeleteConfirm'),
      onConfirm: async () => {
        try {
          await api.delete(`/products/${id}`);
          setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
          fetch();
        } catch(e){
          setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
        }
      }
    });
  };

  const openModifyModal = async (product) => {
    setSelectedId(product.id);
    setModifyForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      category_id: product.category_id ? String(product.category_id) : '',
      is_available: product.is_available !== false,
    });
    setModifyIngredients([]);
    setShowModify(true);

    try {
      const res = await api.get(`/products/${product.id}`);
      const detail = res.data?.data || res.data || {};
      setModifyForm({
        name: detail.name || '',
        description: detail.description || '',
        price: detail.price ?? '',
        category_id: detail.category_id ? String(detail.category_id) : '',
        is_available: detail.is_available !== false,
      });
      setModifyIngredients(
        (detail.ingredients || []).map((ing) => ({
          ingredient_id: String(ing.id),
          quantity: String(ing.pivot?.quantity_used ?? 1),
        }))
      );
    } catch (e) {
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
  };

  const handleModify = async (e) => {
    e.preventDefault();

    const validIngredients = modifyIngredients
      .map((row) => ({
        id: Number(row.ingredient_id),
        quantity: Number(row.quantity),
      }))
      .filter((row) => Number.isInteger(row.id) && row.id > 0 && Number.isInteger(row.quantity) && row.quantity > 0);

    try {
      await api.put(`/products/${selectedId}`, {
        ...modifyForm,
        price: Number(modifyForm.price),
        category_id: Number(modifyForm.category_id),
      });

      await api.post(`/products/${selectedId}/ingredients`, { ingredients: validIngredients });

      setShowModify(false);
      setSelectedId(null);
      setModifyForm({ name: '', description: '', price: '', category_id: '', is_available: true });
      setModifyIngredients([]);
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetch();
    } catch(e){
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
  };

  const handleCat = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', { name: catName });
      setCatName('');
      setShowCat(false);
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetch();
    } catch(e){
      setAlert({ show: true, type: 'error', title: t('error'), message: t('error'), onConfirm: null });
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('menu')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('products')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCat(true)} className="btn-ghost">{t('addCategory')}</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 whitespace-nowrap"><Plus className="w-4 h-4" /> {t('addProduct')}</button>
        </div>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder={`${t('search')}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input-dark w-full max-w-sm"
      />

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span onClick={() => setSelectedCategory(null)} className={`cursor-pointer text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${selectedCategory === null ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300' : 'bg-zinc-800/50 border border-[#27272a] text-zinc-400 hover:border-zinc-600'}`}>
            {t('allCategories')}
          </span>
          {categories.map(c => (
            <span key={c.id} onClick={() => setSelectedCategory(c.id)} className={`cursor-pointer text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${selectedCategory === c.id ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300' : 'bg-zinc-800/50 border border-[#27272a] text-zinc-400 hover:border-zinc-600'}`}>
              {c.name} <span className={`${selectedCategory === c.id ? 'text-amber-200/60' : 'text-zinc-600'}`}>({c.products_count ?? 0})</span>
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(selectedCategory ? products.filter(p => p.category_id === selectedCategory && p.name.toLowerCase().includes(searchTerm.toLowerCase())) : products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 ? (
            <div className="col-span-full card border-dashed flex flex-col items-center justify-center py-16">
              <Package className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500 font-medium">{t('noProductsYet')}</p>
              <p className="text-xs text-zinc-600 mt-1">{t('startByAddProduct')}</p>
            </div>
          ) : (selectedCategory ? products.filter(p => p.category_id === selectedCategory && p.name.toLowerCase().includes(searchTerm.toLowerCase())) : products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))).map(p => (
            <div key={p.id} className="card overflow-hidden group flex flex-col h-full">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-[14px] font-bold text-white">{p.name}</h3>
                  <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${p.is_available !== false ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {p.is_available !== false ? t('active') : t('inactive')}
                  </span>
                </div>
                {p.category && <p className="text-[10px] text-zinc-600 font-medium mb-2">{p.category.name}</p>}
                {p.description && <p className="text-[12px] text-zinc-500 leading-relaxed mb-3 line-clamp-2">{p.description}</p>}
                <p className="text-[22px] font-extrabold text-amber-400">{formatMoney(p.price)}</p>
              </div>
              <div className="flex border-t border-white/5 opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModifyModal(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all border-r border-white/5 rounded-bl-[23px] outline-none">
                  <Pencil className="w-3.5 h-3.5" /> {t('modifyProduct')}
                </button>
                <button onClick={() => handleDelete(p.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-br-[23px] outline-none">
                  <Trash2 className="w-3.5 h-3.5" /> {t('deleteProduct')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Product */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('addProduct')}>
        <form onSubmit={handleCreate} className="space-y-3">
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('name')}</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={`${t('example')} Pizza Margherita`} className="input-dark" /></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('description')}</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder={t('optional')} className="input-dark" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('price')} ($)</label><input required type="number" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0.00" className="input-dark" /></div>
            <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('category')}</label><select required value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} className="input-dark"><option value="">{t('select')}</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{t('ingredients')}</label>
              <button type="button" onClick={addCreateIngredientRow} className="btn-ghost px-3 py-1 text-[11px]">+ {t('createIngredient')}</button>
            </div>
            <div className="space-y-2">
              {createIngredients.length === 0 && (
                <p className="text-[11px] text-zinc-500">{t('noIngredientsSelected')}</p>
              )}
              {createIngredients.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_110px_40px] gap-2 items-center">
                  <select
                    value={row.ingredient_id}
                    onChange={(e) => updateCreateIngredientRow(idx, 'ingredient_id', e.target.value)}
                    className="input-dark"
                  >
                    <option value="">{t('selectIngredient')}</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={row.quantity}
                    onChange={(e) => updateCreateIngredientRow(idx, 'quantity', e.target.value)}
                    className="input-dark"
                  />
                  <button
                    type="button"
                    onClick={() => removeCreateIngredientRow(idx)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={t('deleteIngredient')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">{t('ingredientsAutoDeduction')}</p>
          </div>

          <button type="submit" className="btn-primary w-full mt-2">{t('createProduct')}</button>
        </form>
      </Modal>

      {/* Modify Product */}
      <Modal isOpen={showModify} onClose={() => setShowModify(false)} title={t('modifyProduct')}>
        <form onSubmit={handleModify} className="space-y-3">
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl"><p className="text-[11px] text-amber-300/80">{t('ingredientsAutoDeduction')}</p></div>

          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('name')}</label><input required value={modifyForm.name} onChange={e=>setModifyForm({...modifyForm,name:e.target.value})} className="input-dark" /></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('description')}</label><input value={modifyForm.description} onChange={e=>setModifyForm({...modifyForm,description:e.target.value})} className="input-dark" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('price')} ($)</label><input required type="number" step="0.01" value={modifyForm.price} onChange={e=>setModifyForm({...modifyForm,price:e.target.value})} className="input-dark" /></div>
            <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('category')}</label><select required value={modifyForm.category_id} onChange={e=>setModifyForm({...modifyForm,category_id:e.target.value})} className="input-dark"><option value="">{t('select')}</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('availability')}</label>
            <select value={modifyForm.is_available ? '1' : '0'} onChange={e=>setModifyForm({...modifyForm,is_available:e.target.value === '1'})} className="input-dark">
              <option value="1">{t('active')}</option>
              <option value="0">{t('inactive')}</option>
            </select>
          </div>

          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{t('ingredients')}</label>
              <button type="button" onClick={addModifyIngredientRow} className="btn-ghost px-3 py-1 text-[11px]">+ {t('createIngredient')}</button>
            </div>
            <div className="space-y-2">
              {modifyIngredients.length === 0 && (
                <p className="text-[11px] text-zinc-500">No ingredients selected. This product will not deduct stock.</p>
              )}
              {modifyIngredients.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_110px_40px] gap-2 items-center">
                  <select value={row.ingredient_id} onChange={(e) => updateModifyIngredientRow(idx, 'ingredient_id', e.target.value)} className="input-dark">
                    <option value="">{t('selectIngredient')}</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                  <input type="number" min="1" step="1" value={row.quantity} onChange={(e) => updateModifyIngredientRow(idx, 'quantity', e.target.value)} className="input-dark" />
                  <button type="button" onClick={() => removeModifyIngredientRow(idx)} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10" title={t('deleteIngredient')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-2">{t('modifyProduct')}</button>
        </form>
      </Modal>

      {/* Create Category */}
      <Modal isOpen={showCat} onClose={() => setShowCat(false)} title={t('addCategory')}>
        <form onSubmit={handleCat} className="space-y-3">
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('name')}</label><input required value={catName} onChange={e=>setCatName(e.target.value)} placeholder={`${t('example')}Beverages, Desserts`} className="input-dark" /></div>
          <button type="submit" className="btn-primary w-full mt-2">{t('createCategory')}</button>
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
export default Products;
