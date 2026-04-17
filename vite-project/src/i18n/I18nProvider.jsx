import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getTranslation } from './translations';

const I18nContext = createContext(null);

const getSettingsLanguage = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
    return settings.language || 'fr';
  } catch {
    return 'fr';
  }
};

const getDirection = (language) => (language === 'ar' ? 'rtl' : 'ltr');

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(getSettingsLanguage());

  useEffect(() => {
    const syncLanguage = () => setLanguage(getSettingsLanguage());
    syncLanguage();
    window.addEventListener('app-settings-updated', syncLanguage);
    window.addEventListener('storage', syncLanguage);
    return () => {
      window.removeEventListener('app-settings-updated', syncLanguage);
      window.removeEventListener('storage', syncLanguage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    direction: getDirection(language),
    t: (key, fallback) => getTranslation(language, key) ?? fallback ?? key,
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
