import { useEffect, useState, useRef } from 'react';
import { LogOut, Bell, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axios';
import { getLocale } from '../utils/formatting';
import { useI18n } from '../i18n/I18nProvider';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'admin';
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || 'User');
  const [lowStock, setLowStock] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [appSettings, setAppSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('app_settings') || '{}');
    } catch {
      return {};
    }
  });
  const notifRef = useRef(null);
  const { t } = useI18n();

  const timezone = appSettings.timezone || 'Africa/Casablanca';
  const notificationsEnabled = appSettings.notifications !== false;
  const locale = getLocale();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    const loadLowStock = () => {
      // We only fetch notifications if admin
      if (role === 'admin' && notificationsEnabled) {
        api.get('/admin/low-stock').then(res => {
          setLowStock(res.data.data || []);
        }).catch(e => console.log(e));
      } else {
        setLowStock([]);
      }
    };

    loadLowStock();

    const handleStockUpdate = () => loadLowStock();

    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener('stock-updated', handleStockUpdate);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('stock-updated', handleStockUpdate);
    };
  }, [role, notificationsEnabled]);

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

  useEffect(() => {
    // Update username from localStorage when storage changes
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    }

    // Listen for storage changes (login from this tab or others)
    const handleStorageChange = () => {
      const updatedName = localStorage.getItem('user_name');
      if (updatedName) {
        setUserName(updatedName);
      }
    };

    // Listen for user profile updates
    const handleUserProfileUpdate = () => {
      const updatedName = localStorage.getItem('user_name');
      if (updatedName) {
        setUserName(updatedName);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-profile-updated', handleUserProfileUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-profile-updated', handleUserProfileUpdate);
    };
  }, []);

  return (
    <header className="h-[88px] bg-[#09090b]/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-30 transition-colors duration-300 dark-mode:bg-[#09090b]/50 light-mode:bg-white/70 light-mode:border-slate-200">
      <div className="hidden sm:block">
        <p className="text-[18px] brand-font font-bold text-white tracking-wide dark-mode:text-white light-mode:text-slate-900 transition-colors duration-300">{t('welcomeBack')} <span className="text-amber-400 dark-mode:text-amber-400 light-mode:text-amber-600 font-semibold">{userName}</span></p>
        <p className="text-[13px] font-medium text-zinc-400 dark-mode:text-zinc-400 light-mode:text-slate-500 mt-0.5 capitalize transition-colors duration-300">{new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', timeZone: timezone })}</p>
      </div>

      {/* Mobile greeting (collapsed) */}
      <div className="sm:hidden">
        <p className="text-[14px] brand-font font-bold text-white dark-mode:text-white light-mode:text-slate-900 transition-colors duration-300">{t('welcomeBack')}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-white rounded-2xl hover:bg-white/5 transition-all outline-none dark-mode:text-zinc-400 dark-mode:hover:text-white light-mode:text-slate-600 light-mode:hover:text-slate-900 light-mode:hover:bg-slate-900/5">
            <Bell className="w-5 h-5" />
            {lowStock.length > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-[#09090b] ring-4 dark-mode:ring-[#09090b] light-mode:ring-white shadow-[0_0_10px_rgba(234,179,8,0.6)]">
                {lowStock.length}
              </span>
            )}
            {lowStock.length === 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 dark-mode:ring-[#09090b] light-mode:ring-white"></span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-2xl bg-[#0f0f14]/95 backdrop-blur-xl border border-white/15 shadow-[0_18px_50px_rgba(0,0,0,0.65)] overflow-hidden z-[70] transform origin-top-right transition-all dark-mode:bg-[#0f0f14]/95 light-mode:bg-white/95 light-mode:border-slate-200 light-mode:shadow-[0_18px_50px_rgba(0,0,0,0.15)]">
               <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03] flex justify-between items-center dark-mode:bg-white/[0.03] light-mode:bg-slate-100 light-mode:border-slate-200">
                 <h3 className="text-[14px] brand-font font-bold text-white dark-mode:text-white light-mode:text-slate-900 transition-colors duration-300">{t('notifications')}</h3>
                 <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg ${lowStock.length > 0 ? 'text-amber-400 bg-amber-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                   {lowStock.length > 0 ? `${lowStock.length} ${t('stockCritical')}` : t('allOk')}
                 </span>
               </div>

               <div className="max-h-[300px] overflow-y-auto">
                 {lowStock.length === 0 ? (
                   <div className="px-5 py-8 text-center">
                     <p className="text-zinc-300 dark-mode:text-zinc-300 light-mode:text-slate-700 text-[14px] font-semibold transition-colors duration-300">{t('allOk')}</p>
                     <p className="text-zinc-500 dark-mode:text-zinc-500 light-mode:text-slate-500 text-[13px] mt-2 leading-relaxed transition-colors duration-300">{t('noNotif')}</p>
                   </div>
                 ) : (
                   <div className="divide-y divide-white/10 dark-mode:divide-white/10 light-mode:divide-slate-200">
                     {lowStock.map((item, i) => (
                       <Link key={i} to="/stock" onClick={() => setShowNotif(false)} className="px-5 py-4 flex gap-3 hover:bg-white/8 dark-mode:hover:bg-white/8 light-mode:hover:bg-slate-100 transition-colors group block">
                         <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                           <AlertTriangle className="w-4 h-4 text-red-500" />
                         </div>
                         <div>
                           <p className="text-[13px] font-bold text-zinc-200 dark-mode:text-zinc-200 light-mode:text-slate-900 group-hover:text-amber-400 transition-colors">{t('stockCritical')}: {item.name}</p>
                           <p className="text-[11px] text-zinc-400 dark-mode:text-zinc-400 light-mode:text-slate-600 mt-1.5 leading-relaxed transition-colors duration-300">
                             {t('lowStockMessage')} <strong className="text-red-400">{item.quantity} {item.unit || 'pcs'}</strong>. {t('thresholdMessage')} {item.alert_threshold}.
                           </p>
                         </div>
                       </Link>
                     ))}
                   </div>
                 )}
               </div>

               {lowStock.length > 0 && (
                 <Link to="/stock" onClick={() => setShowNotif(false)} className="block w-full px-5 py-3 text-center text-[12px] font-bold text-zinc-300 dark-mode:text-zinc-300 light-mode:text-slate-700 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] dark-mode:hover:bg-white/[0.06] light-mode:hover:bg-slate-200 transition-colors border-t border-white/10 dark-mode:border-white/10 light-mode:border-slate-200">
                   {t('manageInventory')}
                 </Link>
               )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="w-px h-8 bg-white/10 hidden sm:block dark-mode:bg-white/10 light-mode:bg-slate-300"></div>

        <button onClick={handleLogout}
          className="flex items-center gap-2 text-[14px] brand-font text-zinc-400 hover:text-red-400 dark-mode:text-zinc-400 dark-mode:hover:text-red-400 light-mode:text-slate-600 light-mode:hover:text-red-600 font-bold px-2 sm:px-4 py-2.5 rounded-2xl hover:bg-red-500/10 transition-all outline-none">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
