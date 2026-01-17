import type { Language } from '@/lib/copy';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import ar from '@/locales/ar.json';

type LocaleData = typeof en;

const locales: Record<Language, LocaleData> = {
  en,
  hi,
  ar: ar as LocaleData,
};

function resolveKey(obj: LocaleData, keys: string[]): string | null {
  let value: any = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  return typeof value === 'string' ? value : null;
}

export function tLocale(key: string, lang: Language = 'en'): string {
  const keys = key.split('.');
  const requested = locales[lang] ?? locales.en;
  let value = resolveKey(requested, keys);

  if (value === null && lang !== 'en') {
    console.warn(`Locale key not found: ${key} for language: ${lang}, falling back to English`);
    value = resolveKey(locales.en, keys);
  }

  return value ?? key;
}
