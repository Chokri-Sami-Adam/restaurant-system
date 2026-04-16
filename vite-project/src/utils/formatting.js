export const getAppSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('app_settings') || '{}');
  } catch {
    return {};
  }
};

export const getLocale = () => {
  const settings = getAppSettings();
  const lang = settings.language || 'fr';

  if (lang === 'ar') return 'ar-MA';
  if (lang === 'en') return 'en-US';
  return 'fr-MA';
};

export const getLanguageCode = () => {
  const settings = getAppSettings();
  return settings.language || 'fr';
};

export const getTextDirection = () => (getLanguageCode() === 'ar' ? 'rtl' : 'ltr');

export const formatMoney = (value) => {
  const settings = getAppSettings();
  const currency = settings.currency || 'MAD';
  const locale = getLocale();

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency}`;
  }
};

export const formatDateByTimezone = (dateValue, locale = getLocale()) => {
  const settings = getAppSettings();
  const timezone = settings.timezone || 'Africa/Casablanca';
  const dateFormat = settings.date_format || 'd/m/Y';
  const selectedLocale = getLocale();

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(dateValue));

  const day = parts.find((p) => p.type === 'day')?.value || '01';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const year = parts.find((p) => p.type === 'year')?.value || '1970';

  try {
    if (dateFormat === 'Y-m-d') return `${year}-${month}-${day}`;
    if (dateFormat === 'm/d/Y') return `${month}/${day}/${year}`;
    if (dateFormat === 'd/m/Y') return `${day}/${month}/${year}`;

    return new Date(dateValue).toLocaleDateString(selectedLocale, { timeZone: timezone });
  } catch {
    return new Date(dateValue).toLocaleDateString(locale);
  }
};
