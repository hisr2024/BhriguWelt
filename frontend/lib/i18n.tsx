"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { LANGUAGE_OPTIONS, translations, type Language, type LanguageOption } from "./i18n-data";

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  availableLanguages: LanguageOption[];
};

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => undefined,
  t: (_key: string, fallback?: string) => fallback || "",
  availableLanguages: LANGUAGE_OPTIONS,
});

function resolveLanguage(preferred?: string): Language {
  const stored = preferred?.toLowerCase();
  const validCodes = new Set(LANGUAGE_OPTIONS.map((option) => option.code));
  if (stored && validCodes.has(stored as Language)) {
    return stored as Language;
  }

  const browserLanguage = typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : undefined;
  if (browserLanguage && validCodes.has(browserLanguage as Language)) {
    return browserLanguage as Language;
  }

  const defaultEnv = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE?.toLowerCase();
  if (defaultEnv && validCodes.has(defaultEnv as Language)) {
    return defaultEnv as Language;
  }

  return "en";
}

function translate(lang: Language, key: string, fallback?: string): string {
  const config = LANGUAGE_OPTIONS.find((option) => option.code === lang);
  const fallbacks = config?.fallbacks || [];
  const lookupOrder: Language[] = [lang, ...fallbacks, "en"];

  for (const candidate of lookupOrder) {
    const translated = translations[candidate]?.[key];
    if (translated) return translated;
  }

  return fallback || key;
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => resolveLanguage(undefined));

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("bhriguwelt.lang") : null;
    if (stored) {
      setLang(resolveLanguage(stored));
    }
  }, []);

  const setLanguage = (value: Language) => {
    setLang(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhriguwelt.lang", value);
    }
  };

  const value = useMemo(
    () => ({
      lang,
      setLang: setLanguage,
      t: (key: string, fallback?: string) => translate(lang, key, fallback),
      availableLanguages: LANGUAGE_OPTIONS,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export type { Language, LanguageOption };
