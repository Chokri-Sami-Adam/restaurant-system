import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import api from '../utils/axios';
import Modal from '../components/Modal';
import AlertDialog from '../components/AlertDialog';
import { getLocale } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';

const Users = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showPassword, setShowPassword] = useState({ create: false, edit: false });
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' });
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });
  const currentUserId = parseInt(localStorage.getItem('user_id'));
  const locale = getLocale();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([api.get('/users'), api.get('/roles')]);
      setUsers(u.data.data || []);
      setRoles(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role_id: '' });
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetchData();
    } catch (e) {
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const data = { name: form.name, email: form.email, role_id: form.role_id };
      if (form.password) data.password = form.password;
      await api.put(`/users/${selected.id}`, data);

      // If updating own profile, update localStorage and dispatch event
      if (selected.id === currentUserId) {
        localStorage.setItem('user_name', form.name);
        window.dispatchEvent(new Event('user-profile-updated'));
      }

      setShowEdit(false);
      setSelected(null);
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetchData();
    } catch (e) {
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
      fetchData();
    } catch (e) {
      setAlert({ show: true, type: 'error', title: t('error'), message: e.response?.data?.message || t('error'), onConfirm: null });
    }
  };

  const openEdit = (user) => {
    setSelected(user);
    setForm({ name: user.name, email: user.email, password: '', role_id: user.role_id || '' });
    setShowEdit(true);
  };

  const roleColor = (name) => ({
    admin: 'text-amber-400 bg-amber-500/10',
    manager: 'text-violet-400 bg-violet-500/10',
    serveur: 'text-sky-400 bg-sky-500/10',
    caissier: 'text-emerald-400 bg-emerald-500/10',
    cuisine: 'text-orange-400 bg-orange-500/10',
  }[name] || 'text-zinc-400 bg-zinc-500/10');

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('users')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('settings')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-ghost flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> {t('refresh')}</button>
          <button onClick={() => { setForm({ name: '', email: '', password: '', role_id: '' }); setShowCreate(true); }} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" /> {t('addUser')}</button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {roles.map(r => {
          const count = users.filter(u => u.role?.name === r.name).length;
          return (
            <div key={r.id} className="card-flat px-4 py-2.5 flex items-center gap-2">
              <Shield className={`w-3.5 h-3.5 ${roleColor(r.name).split(' ')[0]}`} />
              <span className="text-[12px] font-bold text-zinc-300 capitalize">{r.name}</span>
              <span className="text-[11px] text-zinc-500 font-semibold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10px] text-zinc-600 uppercase tracking-wider border-b border-white/5">
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('users')}</th>
                  <th className="text-left px-5 py-3 whitespace-nowrap">Email</th>
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('statusLabel')}</th>
                  <th className="text-left px-5 py-3 whitespace-nowrap">{t('date')}</th>
                  <th className="text-right px-5 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-zinc-600">{t('noData')}</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold ${roleColor(user.role?.name)}`}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 whitespace-nowrap">{user.email}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg ${roleColor(user.role?.name)}`}>
                        {user.role?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs whitespace-nowrap">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString(locale) : '-'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end relative z-20">
                        <button type="button" onClick={() => openEdit(user)} className="p-2 text-zinc-500 hover:text-amber-400 rounded-xl hover:bg-amber-500/10 transition-all cursor-pointer outline-none" title="Modifier">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {user.id !== currentUserId && (
                          <button type="button" onClick={() => { setDeleteTarget(user); setShowDeleteConfirm(true); }} className="p-2 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer outline-none" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} title={t('deleteUser')}>
        <div className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <p className="text-[15px] text-white font-semibold">{t('deleteUser')} {deleteTarget?.name} ?</p>
            <p className="text-[13px] text-zinc-500 mt-1">{t('ingredientDeleteConfirm')}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-zinc-400 bg-white/5 hover:bg-white/10 transition-all">{t('cancel')}</button>
            <button type="button" onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all">{t('deleteUser')}</button>
          </div>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Ajouter un Utilisateur">
        <form onSubmit={handleCreate} className="space-y-3">
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('users')}</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" className="input-dark" /></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" className="input-dark" /></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('securitySettings')}</label><div className="relative"><input required type={showPassword.create ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 caractères" className="input-dark pr-10" /><button type="button" onClick={() => setShowPassword({ ...showPassword, create: !showPassword.create })} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors">{showPassword.create ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('statusLabel')}</label>
            <select required value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} className="input-dark">
              <option value="">Sélectionner un rôle...</option>
              {roles.map(r => <option key={r.id} value={r.id} className="capitalize">{r.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-2">{t('success')}</button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Modifier l'Utilisateur">
        <form onSubmit={handleEdit} className="space-y-3">
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('users')}</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" /></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-dark" /></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Nouveau mot de passe</label><div className="relative"><input type={showPassword.edit ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Laisser vide pour ne pas changer" className="input-dark pr-10" /><button type="button" onClick={() => setShowPassword({ ...showPassword, edit: !showPassword.edit })} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors">{showPassword.edit ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          <div><label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Rôle</label>
            <select
              required
              value={form.role_id}
              onChange={e => setForm({ ...form, role_id: e.target.value })}
              className="input-dark"
            >
              <option value="">Sélectionner...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-2">{t('save')}</button>
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
export default Users;
