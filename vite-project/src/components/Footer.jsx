import { useEffect, useState } from 'react';

const Footer = () => {
  const [appSettings, setAppSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('app_settings') || '{}');
    } catch {
      return {};
    }
  });

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

  return (
    <footer className="border-t border-white/5 bg-white/[0.02] px-10 py-6 flex items-center justify-center gap-6">
      {appSettings.restaurant_logo_url && (
        <img src={appSettings.restaurant_logo_url} alt="Restaurant logo" className="h-12 w-12 object-contain rounded-lg border border-white/10" />
      )}
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-300">{appSettings.restaurant_name || 'RestauPro'}</p>
        <p className="text-xs text-zinc-500 mt-1">{appSettings.restaurant_address || ''}</p>
      </div>
    </footer>
  );
};

export default Footer;
