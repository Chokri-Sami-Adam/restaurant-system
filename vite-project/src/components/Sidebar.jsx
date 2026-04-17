import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Box, FlaskConical, CreditCard, ChefHat, Users, BarChart3, FileText, Settings } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

const Sidebar = () => {
  const location = useLocation();
  const role = localStorage.getItem('role') || 'admin';
  const [appName, setAppName] = useState(localStorage.getItem('app_name') || 'RestauPro');
  const [appSettings, setAppSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('app_settings') || '{}');
    } catch {
      return {};
    }
  });
  const { t, language } = useI18n();

  useEffect(() => {
    const syncName = () => setAppName(localStorage.getItem('app_name') || 'RestauPro');
    const syncSettings = () => {
      try {
        setAppSettings(JSON.parse(localStorage.getItem('app_settings') || '{}'));
      } catch {
        setAppSettings({});
      }
    };
    window.addEventListener('app-settings-updated', syncName);
    window.addEventListener('app-settings-updated', syncSettings);
    window.addEventListener('storage', syncName);
    window.addEventListener('storage', syncSettings);
    return () => {
      window.removeEventListener('app-settings-updated', syncName);
      window.removeEventListener('app-settings-updated', syncSettings);
      window.removeEventListener('storage', syncName);
      window.removeEventListener('storage', syncSettings);
    };
  }, []);

  const allLinks = [
    // Admin
    { title: t('dashboard'), path: '/', icon: LayoutDashboard, roles: ['admin', 'manager'] },

    // Admin Analytics
    { title: t('analytics'), path: '/analytics', icon: BarChart3, roles: ['admin'] },
    { title: t('reports'), path: '/reports', icon: FileText, roles: ['admin'] },

    // Admin Management
    { title: t('users'), path: '/users', icon: Users, roles: ['admin'] },
    { title: t('settings'), path: '/settings', icon: Settings, roles: ['admin'] },

    // Shared with Manager
    { title: t('orders'), path: '/orders', icon: ShoppingCart, roles: ['admin', 'manager'] },
    { title: t('manageOrders'), path: '/admin-orders', icon: ShoppingCart, roles: ['admin', 'manager'] },
    { title: t('products'), path: '/products', icon: Package, roles: ['admin', 'manager'] },
    { title: t('ingredients'), path: '/ingredients', icon: FlaskConical, roles: ['admin', 'manager'] },
    { title: t('stock'), path: '/stock', icon: Box, roles: ['admin', 'manager'] },
    { title: t('payments'), path: '/payments', icon: CreditCard, roles: ['admin', 'manager'] },

    // Serveur
    { title: t('orders'), path: '/waiter', icon: ShoppingCart, roles: ['serveur'] },

    // Caissier
    { title: t('payments'), path: '/payments', icon: CreditCard, roles: ['caissier'] },

    // Cuisine
    { title: t('kitchen'), path: '/kitchen', icon: ChefHat, roles: ['cuisine'] },
  ];

  const links = allLinks.filter(l => l.roles.includes(role));

  const roleLabel = {
    admin: language === 'ar' ? 'مدير' : (language === 'en' ? 'Administrator' : 'Administrateur'),
    manager: language === 'ar' ? 'مدير' : (language === 'en' ? 'Manager' : 'Gérant'),
    serveur: language === 'ar' ? 'النادل' : (language === 'en' ? 'Waiter' : 'Serveur'),
    caissier: language === 'ar' ? 'أمين الصندوق' : (language === 'en' ? 'Cashier' : 'Caissier'),
    cuisine: language === 'ar' ? 'المطبخ' : (language === 'en' ? 'Kitchen' : 'Cuisine'),
  };

  return (
    <aside className="w-[260px] bg-[#09090b]/80 backdrop-blur-2xl border-r border-white/5 hidden md:flex flex-col h-full shadow-2xl relative z-40 transition-colors duration-300 dark-mode:bg-[#09090b]/80 dark-mode:border-white/5 light-mode:bg-white/80 light-mode:border-slate-200">
      {/* Brand */}
      <div className="px-8 h-[88px] flex items-center gap-4 border-b border-white/5 relative overflow-hidden dark-mode:border-white/5 light-mode:border-slate-200">
        {appSettings.restaurant_logo_url ? (
          <img src={appSettings.restaurant_logo_url} alt="Restaurant logo" className="w-14 h-14 rounded-2xl object-contain border border-white/10 shadow-lg shadow-amber-500/25 relative z-10 dark-mode:border-white/10 light-mode:border-slate-300" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 relative z-10">
            <ChefHat className="w-7 h-7 text-white drop-shadow-sm" />
          </div>
        )}
        <div className="leading-tight relative z-10">
          <p className="text-[18px] brand-font font-bold text-white dark-mode:text-white light-mode:text-slate-900 tracking-wide transition-colors duration-300">{appName}</p>
          <p className="text-[11px] text-zinc-400 dark-mode:text-zinc-400 light-mode:text-slate-500 font-medium tracking-wide uppercase mt-0.5 transition-colors duration-300">{t('appSubtitle')}</p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-amber-500/10 to-transparent opacity-50"></div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto w-full">
        <p className="text-[10px] font-bold text-zinc-500 dark-mode:text-zinc-500 light-mode:text-slate-500 uppercase tracking-widest px-4 mb-4 transition-colors duration-300">{t('navigation')}</p>
        {links.map(link => {
          const active = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link key={link.path} to={link.path}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-300 relative overflow-hidden ${
                active
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 shadow-sm border border-amber-500/10 dark-mode:from-amber-500/20 dark-mode:to-amber-500/5 dark-mode:text-amber-400 light-mode:from-amber-500/10 light-mode:to-amber-500/5 light-mode:text-amber-700 light-mode:border-amber-300/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent dark-mode:text-zinc-400 dark-mode:hover:text-zinc-100 dark-mode:hover:bg-white/5 light-mode:text-slate-600 light-mode:hover:text-slate-900 light-mode:hover:bg-slate-100 transition-colors duration-300'
              }`}>
              <Icon className={`w-[20px] h-[20px] transition-colors duration-300 ${active ? 'text-amber-400 dark-mode:text-amber-400 light-mode:text-amber-700' : 'text-zinc-500 dark-mode:text-zinc-500 light-mode:text-slate-500'}`} />
              {link.title}
              {active && <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-6 border-t border-white/5 bg-white/[0.02] dark-mode:border-white/5 dark-mode:bg-white/[0.02] light-mode:border-slate-200 light-mode:bg-slate-100/50 transition-colors duration-300">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-black/40 transition-colors cursor-pointer group dark-mode:bg-black/20 dark-mode:border-white/5 dark-mode:hover:bg-black/40 light-mode:bg-white/50 light-mode:border-slate-300 light-mode:hover:bg-white/70">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[14px] font-bold text-white shadow-inner group-hover:scale-105 transition-transform duration-300">
            {role?.charAt(0).toUpperCase()}
          </div>
          <div className="leading-tight flex-1">
            <p className="text-[14px] font-bold text-zinc-200 dark-mode:text-zinc-200 light-mode:text-slate-900 capitalize brand-font transition-colors duration-300">{roleLabel[role] || role}</p>
            <p className="text-[11px] text-zinc-500 dark-mode:text-zinc-500 light-mode:text-slate-600 font-medium flex items-center gap-1.5 mt-0.5 transition-colors duration-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse"></span> {t('online')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
