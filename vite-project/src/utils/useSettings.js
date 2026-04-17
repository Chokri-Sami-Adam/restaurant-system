import { useState, useEffect } from 'react';
import api from '../utils/axios';

const DEFAULT_SETTINGS = {
  restaurant_name: 'RestauPro',
  restaurant_address: '',
  restaurant_phone: '',
  restaurant_email: '',
  opening_hours: 'Lundi - Dimanche: 08:00 - 23:00',
  restaurant_logo_url: null,

  currency: 'MAD',
  tax_rate: 20,
  payment_cash: true,
  payment_card: true,
  payment_online: false,

  order_dine_in: true,
  order_takeaway: true,
  order_delivery: false,
  default_order_status: 'pending',
  auto_update_order_status: false,

  notify_email: true,
  notify_low_stock: true,
  notify_sms: false,

  language: 'fr',
  timezone: 'Africa/Casablanca',
  date_format: 'd/m/Y',

  receipt_show_logo: true,
  receipt_footer_message: 'Merci pour votre visite',
  receipt_show_tax_details: true,

  low_stock_threshold: 5,
  auto_stock_deduction: true,

  min_password_length: 8,
  session_timeout_minutes: 120,
  enable_2fa: false,

  maintenance_mode: false,
  backup_enabled: true,
  debug_mode: false,
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      const apiData = res.data || {};
      
      // Properly merge settings, ensuring booleans stay as booleans
      const merged = { ...DEFAULT_SETTINGS };
      Object.keys(apiData).forEach(key => {
        const value = apiData[key];
        // Handle string '1'/'0' conversion for booleans
        if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
          if (typeof value === 'string') {
            merged[key] = value === '1' || value === 'true';
          } else if (typeof value === 'boolean') {
            merged[key] = value;
          }
        } else {
          merged[key] = value;
        }
      });
      
      setSettings(merged);
      localStorage.setItem('app_settings', JSON.stringify(merged));
      localStorage.setItem('app_name', merged.restaurant_name || 'RestauPro');
      window.dispatchEvent(new Event('app-settings-updated'));
      return merged;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setChanges(true);
  };

  const saveSettings = async (payload) => {
    try {
      setSaving(true);
      const res = await api.post('/admin/settings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const apiData = res.data.data || {};
      const merged = { ...DEFAULT_SETTINGS };
      Object.keys(apiData).forEach(key => {
        const value = apiData[key];
        // Handle string '1'/'0' conversion for booleans
        if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
          if (typeof value === 'string') {
            merged[key] = value === '1' || value === 'true';
          } else if (typeof value === 'boolean') {
            merged[key] = value;
          }
        } else {
          merged[key] = value;
        }
      });
      
      setSettings(merged);
      setChanges(false);

      localStorage.setItem('app_settings', JSON.stringify(merged));
      localStorage.setItem('app_name', merged.restaurant_name || 'RestauPro');
      window.dispatchEvent(new Event('app-settings-updated'));

      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    setChanges(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    setSettings,
    loading,
    saving,
    changes,
    updateSetting,
    saveSettings,
    fetchSettings,
    reset,
  };
}
