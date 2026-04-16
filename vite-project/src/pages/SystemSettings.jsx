import { useEffect, useMemo, useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Bell,
  Lock,
  Globe,
  Database,
  Store,
  CreditCard,
  ShoppingBag,
  Receipt,
  Upload,
} from 'lucide-react';
import api from '../utils/axios';
import AlertDialog from '../components/AlertDialog';
import { useI18n } from '../i18n/I18nProvider';

const DEFAULT_SETTINGS = {
  // 1) Restaurant Information
  restaurant_name: 'RestauPro',
  restaurant_address: '',
  restaurant_phone: '',
  restaurant_email: '',
  opening_hours: 'Lundi - Dimanche: 08:00 - 23:00',
  restaurant_logo_url: null,

  // 2) Payment Settings
  currency: 'MAD',
  tax_rate: 20,
  payment_cash: true,
  payment_card: true,
  payment_online: false,

  // 3) Order Settings
  order_dine_in: true,
  order_takeaway: true,
  order_delivery: false,
  default_order_status: 'pending',
  auto_update_order_status: false,

  // 4) Notifications
  notify_email: true,
  notify_low_stock: true,
  notify_sms: false,

  // 5) Localization
  language: 'fr',
  timezone: 'Africa/Casablanca',
  date_format: 'd/m/Y',

  // 6) Receipt
  receipt_show_logo: true,
  receipt_footer_message: 'Merci pour votre visite',
  receipt_show_tax_details: true,

  // 7) Stock
  low_stock_threshold: 5,
  auto_stock_deduction: true,

  // 8) Security
  min_password_length: 8,
  session_timeout_minutes: 120,
  enable_2fa: false,

  // compatibility
  maintenance_mode: false,
  backup_enabled: true,
  debug_mode: false,
};

const settingGroups = [
  {
    title: 'Restaurant Information',
    icon: Store,
    color: 'text-sky-400',
    settings: [
      { key: 'restaurant_name', label: 'Restaurant Name', type: 'text' },
      { key: 'restaurant_address', label: 'Address', type: 'textarea' },
      { key: 'restaurant_phone', label: 'Phone Number', type: 'text' },
      { key: 'restaurant_email', label: 'Email', type: 'email' },
      { key: 'opening_hours', label: 'Opening Hours', type: 'textarea', rows: 2 },
      { key: 'restaurant_logo', label: 'Logo Upload', type: 'file' },
    ],
  },
  {
    title: 'Payment Settings',
    icon: CreditCard,
    color: 'text-emerald-400',
    settings: [
      { key: 'currency', label: 'Currency', type: 'select', options: ['MAD', 'EUR', 'USD', 'GBP'] },
      { key: 'tax_rate', label: 'Tax (TVA %)', type: 'number', min: 0, max: 100, step: 0.01 },
      { key: 'payment_cash', label: 'Enable Cash', type: 'toggle' },
      { key: 'payment_card', label: 'Enable Card', type: 'toggle' },
      { key: 'payment_online', label: 'Enable Online Payment', type: 'toggle' },
    ],
  },
  {
    title: 'Order Settings',
    icon: ShoppingBag,
    color: 'text-amber-400',
    settings: [
      { key: 'order_dine_in', label: 'Enable Dine-in', type: 'toggle' },
      { key: 'order_takeaway', label: 'Enable Takeaway', type: 'toggle' },
      { key: 'order_delivery', label: 'Enable Delivery', type: 'toggle' },
      {
        key: 'default_order_status',
        label: 'Default Order Status',
        type: 'select',
        options: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
      },
      { key: 'auto_update_order_status', label: 'Auto-update Order Status', type: 'toggle' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    color: 'text-violet-400',
    settings: [
      { key: 'notify_email', label: 'Enable Email Notifications', type: 'toggle' },
      { key: 'notify_low_stock', label: 'Enable Low Stock Alerts', type: 'toggle' },
      { key: 'notify_sms', label: 'Enable SMS Notifications', type: 'toggle' },
    ],
  },
  {
    title: 'Localization',
    icon: Globe,
    color: 'text-cyan-400',
    settings: [
      { key: 'language', label: 'Language', type: 'select', options: ['fr', 'ar', 'en'] },
      {
        key: 'timezone',
        label: 'Timezone',
        type: 'select',
        options: ['Africa/Casablanca', 'UTC', 'Europe/Paris', 'Europe/London'],
      },
      { key: 'date_format', label: 'Date Format', type: 'select', options: ['d/m/Y', 'm/d/Y', 'Y-m-d'] },
    ],
  },
  {
    title: 'Receipt Settings',
    icon: Receipt,
    color: 'text-fuchsia-400',
    settings: [
      { key: 'receipt_show_logo', label: 'Show Logo on Receipt', type: 'toggle' },
      { key: 'receipt_footer_message', label: 'Footer Message', type: 'textarea', rows: 2 },
      { key: 'receipt_show_tax_details', label: 'Show Tax Details', type: 'toggle' },
    ],
  },
  {
    title: 'Stock Settings',
    icon: Database,
    color: 'text-lime-400',
    settings: [
      { key: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number', min: 0, max: 100000, step: 1 },
      { key: 'auto_stock_deduction', label: 'Auto Stock Deduction After Orders', type: 'toggle' },
    ],
  },
  {
    title: 'Security Settings',
    icon: Lock,
    color: 'text-red-400',
    settings: [
      { key: 'min_password_length', label: 'Minimum Password Length', type: 'number', min: 8, max: 64, step: 1 },
      { key: 'session_timeout_minutes', label: 'Session Timeout (minutes)', type: 'number', min: 5, max: 1440, step: 5 },
      { key: 'enable_2fa', label: 'Enable Two-Factor Authentication', type: 'toggle' },
    ],
  },
  {
    title: 'System Compatibility',
    icon: Settings,
    color: 'text-zinc-300',
    settings: [
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'toggle' },
      { key: 'backup_enabled', label: 'Automatic Backups', type: 'toggle' },
      { key: 'debug_mode', label: 'Debug Mode', type: 'toggle' },
    ],
  },
];

const SystemSettings = () => {
  const { t } = useI18n();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null });

  const currentLogo = useMemo(() => logoPreview || settings.restaurant_logo_url, [logoPreview, settings.restaurant_logo_url]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        const merged = { ...DEFAULT_SETTINGS, ...res.data };
        setSettings(merged);
        localStorage.setItem('app_settings', JSON.stringify(merged));
        localStorage.setItem('app_name', merged.restaurant_name || merged.app_name || 'RestauPro');
        window.dispatchEvent(new Event('app-settings-updated'));
      } catch {
        setAlert({ show: true, type: 'error', title: t('error'), message: t('error'), onConfirm: null });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setChanges(true);
  };

  const handleLogoChange = (file) => {
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = new FormData();

      Object.entries(settings).forEach(([key, value]) => {
        if (key === 'restaurant_logo_url') return;
        if (typeof value === 'boolean') {
          payload.append(key, value ? '1' : '0');
        } else if (value !== null && value !== undefined) {
          payload.append(key, String(value));
        }
      });

      if (logoFile) {
        payload.append('restaurant_logo', logoFile);
      }

      const res = await api.post('/admin/settings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const merged = { ...DEFAULT_SETTINGS, ...res.data.data };
      setSettings(merged);
      setLogoFile(null);
      setLogoPreview(null);
      setChanges(false);

      localStorage.setItem('app_settings', JSON.stringify(merged));
      localStorage.setItem('app_name', merged.restaurant_name || 'RestauPro');
      window.dispatchEvent(new Event('app-settings-updated'));

      setAlert({ show: true, type: 'success', title: t('success'), message: t('success'), onConfirm: null });
    } catch (error) {
      const msg = error?.response?.data?.message || t('error');
      setAlert({ show: true, type: 'error', title: t('error'), message: msg, onConfirm: null });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('dashboardSubtitle')}</p>
        </div>
        {changes && (
          <div className="flex gap-2">
            <button onClick={handleReset} className="btn-ghost flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> {t('cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5">
              <Save className="w-4 h-4" /> {saving ? t('loading') : t('save')}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {settingGroups.map((group) => (
          <div key={group.title} className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${group.color} bg-white/5`}>
                <group.icon className="w-5 h-5" />
              </div>
              <h2 className="text-[14px] font-bold text-white">{group.title}</h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.settings.map((setting) => (
                <div key={setting.key} className={setting.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-[12px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    {setting.label}
                  </label>

                  {setting.type === 'text' || setting.type === 'email' ? (
                    <input
                      type={setting.type}
                      value={settings[setting.key] || ''}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      className="input-dark"
                    />
                  ) : null}

                  {setting.type === 'number' ? (
                    <input
                      type="number"
                      min={setting.min}
                      max={setting.max}
                      step={setting.step}
                      value={settings[setting.key]}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      className="input-dark"
                    />
                  ) : null}

                  {setting.type === 'textarea' ? (
                    <textarea
                      rows={setting.rows || 3}
                      value={settings[setting.key] || ''}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      className="input-dark resize-y"
                    />
                  ) : null}

                  {setting.type === 'select' ? (
                    <select
                      value={settings[setting.key] || ''}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      className="input-dark"
                    >
                      {setting.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  {setting.type === 'toggle' ? (
                    <button
                      type="button"
                      onClick={() => handleChange(setting.key, !settings[setting.key])}
                      className={`relative w-14 h-8 rounded-full transition-all ${
                        settings[setting.key] ? 'bg-emerald-600 shadow-lg shadow-emerald-500/50' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          settings[setting.key] ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  ) : null}

                  {setting.type === 'file' ? (
                    <div className="space-y-3">
                      {currentLogo && (
                        <img src={currentLogo} alt="Restaurant logo" className="w-20 h-20 object-cover rounded-xl border border-white/10" />
                      )}
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-sm text-zinc-200">
                        <Upload className="w-4 h-4" />
                        Choisir un logo
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          onChange={(e) => handleLogoChange(e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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

export default SystemSettings;
