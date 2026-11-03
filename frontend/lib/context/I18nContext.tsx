'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getCurrentLanguage, setLanguage as setStoredLanguage, type Language } from '@/lib/copy';
import { tLocale } from '@/lib/locales';

export type AiLanguage = 'en' | 'hi' | 'sa';

interface I18nContextValue {
  language: Language;
  aiLanguage: AiLanguage;
  setLanguage: (lang: Language) => void;
  setAiLanguage: (lang: AiLanguage) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);
const AI_LANGUAGE_STORAGE_KEY = 'ai_language';
const RTL_LANGUAGES = new Set<Language>(['ar']);

const resolveAiLanguage = (): AiLanguage => {
  if (typeof window === 'undefined') {
    return 'en';
  }
  const stored = localStorage.getItem(AI_LANGUAGE_STORAGE_KEY) as AiLanguage | null;
  if (stored === 'en' || stored === 'hi' || stored === 'sa') {
    return stored;
  }
  const fallback = getCurrentLanguage();
  return fallback === 'hi' ? 'hi' : 'en';
};

const interpolate = (value: string, vars?: Record<string, string>): string => {
  if (!vars) {
    return value;
  }
  return value.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] ?? match;
  });
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getCurrentLanguage());
  const [aiLanguage, setAiLanguageState] = useState<AiLanguage>(() => resolveAiLanguage());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
  };

  const setAiLanguage = (lang: AiLanguage) => {
    setAiLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_LANGUAGE_STORAGE_KEY, lang);
    }
  };

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string>) =>
      interpolate(tLocale(key, language), vars);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      aiLanguage,
      setLanguage,
      setAiLanguage,
      t,
    }),
    [language, aiLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
