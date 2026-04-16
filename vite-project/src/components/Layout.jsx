import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import api from '../utils/axios';
import { useI18n } from '../i18n/I18nProvider';

const Layout = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    // Fetch settings on app load so they're available everywhere
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        localStorage.setItem('app_settings', JSON.stringify(res.data));
        localStorage.setItem('app_name', res.data.restaurant_name || 'RestauPro');
        window.dispatchEvent(new Event('app-settings-updated'));
      } catch (err) {
        console.log('Failed to fetch settings:', err);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const syncSettings = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
        setMaintenanceMode(Boolean(settings.maintenance_mode));
        document.documentElement.lang = settings.language || 'fr';
        document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
      } catch {
        setMaintenanceMode(false);
        document.documentElement.lang = 'fr';
        document.documentElement.dir = 'ltr';
      }
    };

    syncSettings();
    window.addEventListener('app-settings-updated', syncSettings);
    window.addEventListener('storage', syncSettings);
    return () => {
      window.removeEventListener('app-settings-updated', syncSettings);
      window.removeEventListener('storage', syncSettings);
    };
  }, []);

  return (
  <div className="flex h-screen bg-transparent overflow-hidden font-sans text-zinc-100 relative z-0">
    {/* Animated Background Mesh */}
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#0a0a0c]">
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-500/10 blur-[120px] animate-orb-1"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-orange-600/10 blur-[120px] animate-orb-2"></div>
      <div className="absolute top-[30%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-violet-600/5 blur-[120px] animate-orb-3"></div>

      {/* Texture Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/80"></div>
    </div>

    <Sidebar />
    <div className="flex flex-col flex-1 overflow-hidden backdrop-blur-[2px]">
      <Navbar />
      {maintenanceMode && (
        <div className="mx-6 md:mx-10 mt-4 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-semibold">
          {t('maintenanceOn')}
        </div>
      )}
      <main className="flex-1 overflow-x-hidden overflow-y-auto px-6 md:px-10 py-8 relative">
        <div className="relative z-10 w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);
};

export default Layout;
