import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n/i18n'; // Import central i18n config
import { useAuth } from './AuthProvider';
import { apiRequest } from '../lib/apiClient';

export type Language = 'pt' | 'en';
type TranslationParams = Record<string, string | number>;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
  translate: (value: string) => string;
};

const storageKey = 'doctor46.language';
const legacyStorageKey = 'language';
const cookieKey = 'preferred_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'pt';
  
  // Try to load from localStorage
  const saved = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey);
  if (saved === 'en' || saved === 'pt') {
    return saved;
  }

  // Try to load from cookies
  const match = document.cookie.match(/(^|;)\s*preferred_language\s*=\s*([^;]+)/);
  if (match) {
    const cookieLang = match[2];
    if (cookieLang === 'pt' || cookieLang === 'en') {
      return cookieLang;
    }
  }

  return 'pt';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t: translateHook, i18n } = useTranslation();
  const { profile } = useAuth();
  
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Sync state and i18n instance with initial language on mount
  useEffect(() => {
    const initial = getInitialLanguage();
    if (i18n.language !== initial) {
      void i18n.changeLanguage(initial);
    }
  }, [i18n]);

  // Symmetrically apply profile preferred language immediately after login or on profile loads
  useEffect(() => {
    if (profile?.preferred_language) {
      const dbLang = profile.preferred_language as Language;
      if (dbLang === 'pt' || dbLang === 'en') {
        if (language !== dbLang) {
          setLanguageState(dbLang);
          localStorage.setItem(storageKey, dbLang);
          localStorage.setItem(legacyStorageKey, dbLang);
          document.cookie = `${cookieKey}=${dbLang};path=/;max-age=31536000;SameSite=Lax`;
          void i18n.changeLanguage(dbLang);
        }
      }
    }
  }, [profile, language, i18n]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(storageKey, lang);
    localStorage.setItem(legacyStorageKey, lang);
    document.cookie = `${cookieKey}=${lang};path=/;max-age=31536000;SameSite=Lax`;
    
    // Update react-i18next instance
    void i18n.changeLanguage(lang);

    // Sync in background to backend database if logged in
    if (profile?.id) {
      void apiRequest('user.update_language', { language: lang }).catch((error) => {
        console.error('Failed to sync preferred language with Hostinger server', error);
      });
    }
  };

  const value = useMemo<LanguageContextType>(() => {
    return {
      language,
      setLanguage,
      t: (key, params) => {
        const result = translateHook(key, params);
        // Fallback checks and logging missing translations
        if (result === key) {
          // Key was not found, check fallback or output with warnings
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[i18n] Missing translation key: "${key}"`);
          }
        }
        return result;
      },
      translate: (text) => translateHook(text),
    };
  }, [language, translateHook]);

  useEffect(() => {
    document.documentElement.lang = language === 'pt' ? 'pt-MZ' : 'en';
    document.documentElement.dataset.language = language;
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
