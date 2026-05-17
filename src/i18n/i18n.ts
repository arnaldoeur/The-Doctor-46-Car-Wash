import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptPublic from './locales/pt.json';
import enPublic from './locales/en.json';
import ptAdmin from '../locales/pt/admin.json';
import enAdmin from '../locales/en/admin.json';

const resources = {
  pt: {
    translation: {
      ...ptPublic,
      ...ptAdmin,
    },
  },
  en: {
    translation: {
      ...enPublic,
      ...enAdmin,
    },
  },
};

// Retrieve saved language from localStorage, cookies, or default to Portuguese ('pt')
const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') return 'pt';
  
  // Check localStorage
  const localLang = localStorage.getItem('preferred_language');
  if (localLang === 'pt' || localLang === 'en') return localLang;

  // Check cookies
  const match = document.cookie.match(/(^|;)\s*preferred_language\s*=\s*([^;]+)/);
  if (match) {
    const cookieLang = match[2];
    if (cookieLang === 'pt' || cookieLang === 'en') return cookieLang;
  }

  return 'pt';
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    react: {
      useSuspense: false, // Disable suspense to avoid layout flicker or page blanking
    },
  });

export default i18n;
