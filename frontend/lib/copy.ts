/**
 * Internationalization strings for BhriguWelt
 * Supports English, Hindi, and RTL-ready Arabic structure
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const enCopy = {
    common: {
      appName: 'BhriguWelt',
      tagline: "Discover Your Soul's Journey Through Vedic Astrology",
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try Again',
      save: 'Save',
      cancel: 'Cancel',
      continue: 'Continue',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      close: 'Close',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      download: 'Download',
      share: 'Share',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
    },
    navigation: {
      home: 'Home',
      horoscope: 'Horoscope',
      karmicJourney: 'Karmic Journey',
      pastLives: 'Past Lives',
      futureLives: 'Future Lives',
      presentLife: 'Present Life',
      lifeEvents: 'Life Events',
      remedies: 'Remedies',
      predictions: 'Predictions',
      about: 'About',
      contact: 'Contact',
      settings: 'Settings',
      help: 'Help',
      profile: 'Profile',
    },
    horoscope: {
      title: 'Birth Chart',
      subtitle: 'Your Cosmic Blueprint',
      birthDetails: 'Birth Details',
      dateOfBirth: 'Date of Birth',
      timeOfBirth: 'Time of Birth',
      placeOfBirth: 'Place of Birth',
      calculate: 'Calculate Chart',
      zodiacSign: 'Zodiac Sign',
      moonSign: 'Moon Sign',
      ascendant: 'Ascendant (Lagna)',
      nakshatra: 'Nakshatra',
      planets: 'Planetary Positions',
      houses: 'Houses',
      dasha: 'Dasha Period',
      yogas: 'Yogas',
      doshas: 'Doshas',
    },
    predictions: {
      title: 'Predictions',
      daily: 'Daily Prediction',
      weekly: 'Weekly Forecast',
      monthly: 'Monthly Overview',
      yearly: 'Yearly Outlook',
      askQuestion: 'Ask a Question',
      questionPlaceholder: 'What would you like to know about your future?',
      getAnswer: 'Get Answer',
    },
    karmicJourney: {
      title: 'Karmic Journey',
      subtitle: "Understand Your Soul's Path",
      soulPurpose: 'Soul Purpose',
      karmicLessons: 'Karmic Lessons',
      soulEvolution: 'Soul Evolution',
      dharmicPath: 'Dharmic Path',
      karmicDebts: 'Karmic Debts',
      soulGroups: 'Soul Group Connections',
    },
    remedies: {
      title: 'Karmic Remedies',
      subtitle: 'Balance Your Energy',
      mantras: 'Mantras',
      gemstones: 'Gemstones',
      rituals: 'Rituals',
      charity: 'Charitable Acts',
      lifestyle: 'Lifestyle Modifications',
      meditation: 'Meditation Practices',
      yantras: 'Yantras',
    },
    ai: {
      title: 'AI Insights',
      modes: {
        offline: 'Offline Mode',
        hybrid: 'Hybrid Mode',
        conversational: 'Conversational Mode',
      },
      consent: {
        title: 'AI Consent',
        description: 'Choose how you want to use AI features',
        grant: 'Grant Consent',
        decline: 'Decline',
      },
      chat: {
        placeholder: 'Ask about your astrological chart...',
        send: 'Send',
      },
    },
    settings: {
      title: 'Settings',
      theme: 'Theme',
      language: 'Language',
      notifications: 'Notifications',
      privacy: 'Privacy',
      security: 'Security',
      aiMode: 'AI Mode',
      offline: 'Offline Storage',
      export: 'Export Data',
      import: 'Import Data',
      clearData: 'Clear All Data',
    },
    errors: {
      networkError: 'Network error. Please check your connection.',
      serverError: 'Server error. Please try again later.',
      invalidInput: 'Invalid input. Please check your details.',
      notFound: 'Not found.',
      unauthorized: 'Unauthorized access.',
      generic: 'An error occurred. Please try again.',
    },
};

export const copy = {
  en: enCopy,
  hi: {
    common: {
      appName: 'भृगुवेल्ट',
      tagline: 'वैदिक ज्योतिष के माध्यम से अपनी आत्मा की यात्रा खोजें',
      loading: 'लोड हो रहा है...',
      error: 'कुछ गलत हो गया',
      retry: 'पुनः प्रयास करें',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      continue: 'जारी रखें',
      back: 'पीछे',
      next: 'आगे',
      submit: 'जमा करें',
      close: 'बंद करें',
      confirm: 'पुष्टि करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      view: 'देखें',
      download: 'डाउनलोड',
      share: 'साझा करें',
      search: 'खोजें',
      filter: 'फ़िल्टर',
      sort: 'क्रमबद्ध करें',
      refresh: 'ताज़ा करें',
    },
    navigation: {
      home: 'मुख्य पृष्ठ',
      horoscope: 'कुंडली',
      karmicJourney: 'कर्म यात्रा',
      pastLives: 'पूर्व जन्म',
      futureLives: 'भविष्य के जन्म',
      presentLife: 'वर्तमान जीवन',
      lifeEvents: 'जीवन की घटनाएं',
      remedies: 'उपाय',
      predictions: 'भविष्यवाणियां',
      about: 'हमारे बारे में',
      contact: 'संपर्क',
      settings: 'सेटिंग्स',
      help: 'मदद',
      profile: 'प्रोफ़ाइल',
    },
    horoscope: {
      title: 'जन्म कुंडली',
      subtitle: 'आपका ब्रह्मांडीय खाका',
      birthDetails: 'जन्म विवरण',
      dateOfBirth: 'जन्म तिथि',
      timeOfBirth: 'जन्म समय',
      placeOfBirth: 'जन्म स्थान',
      calculate: 'कुंडली बनाएं',
      zodiacSign: 'राशि',
      moonSign: 'चंद्र राशि',
      ascendant: 'लग्न',
      nakshatra: 'नक्षत्र',
      planets: 'ग्रह स्थिति',
      houses: 'भाव',
      dasha: 'दशा काल',
      yogas: 'योग',
      doshas: 'दोष',
    },
    predictions: {
      title: 'भविष्यवाणियां',
      daily: 'दैनिक भविष्यवाणी',
      weekly: 'साप्ताहिक पूर्वानुमान',
      monthly: 'मासिक अवलोकन',
      yearly: 'वार्षिक दृष्टिकोण',
      askQuestion: 'प्रश्न पूछें',
      questionPlaceholder: 'आप अपने भविष्य के बारे में क्या जानना चाहेंगे?',
      getAnswer: 'उत्तर प्राप्त करें',
    },
    karmicJourney: {
      title: 'कर्म यात्रा',
      subtitle: 'अपनी आत्मा के मार्ग को समझें',
      soulPurpose: 'आत्मा का उद्देश्य',
      karmicLessons: 'कर्म पाठ',
      soulEvolution: 'आत्मा विकास',
      dharmicPath: 'धार्मिक मार्ग',
      karmicDebts: 'कर्म ऋण',
      soulGroups: 'आत्मा समूह संबंध',
    },
    remedies: {
      title: 'कर्म उपाय',
      subtitle: 'अपनी ऊर्जा को संतुलित करें',
      mantras: 'मंत्र',
      gemstones: 'रत्न',
      rituals: 'अनुष्ठान',
      charity: 'दान',
      lifestyle: 'जीवनशैली संशोधन',
      meditation: 'ध्यान अभ्यास',
      yantras: 'यंत्र',
    },
    ai: {
      title: 'एआई अंतर्दृष्टि',
      modes: {
        offline: 'ऑफ़लाइन मोड',
        hybrid: 'हाइब्रिड मोड',
        conversational: 'बातचीत मोड',
      },
      consent: {
        title: 'एआई सहमति',
        description: 'चुनें कि आप एआई सुविधाओं का उपयोग कैसे करना चाहते हैं',
        grant: 'सहमति दें',
        decline: 'अस्वीकार करें',
      },
      chat: {
        placeholder: 'अपनी ज्योतिषीय कुंडली के बारे में पूछें...',
        send: 'भेजें',
      },
    },
    settings: {
      title: 'सेटिंग्स',
      theme: 'थीम',
      language: 'भाषा',
      notifications: 'सूचनाएं',
      privacy: 'गोपनीयता',
      security: 'सुरक्षा',
      aiMode: 'एआई मोड',
      offline: 'ऑफ़लाइन स्टोरेज',
      export: 'डेटा निर्यात करें',
      import: 'डेटा आयात करें',
      clearData: 'सभी डेटा साफ़ करें',
    },
    errors: {
      networkError: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
      serverError: 'सर्वर त्रुटि। कृपया बाद में पुन: प्रयास करें।',
      invalidInput: 'अमान्य इनपुट। कृपया अपना विवरण जांचें।',
      notFound: 'नहीं मिला।',
      unauthorized: 'अनधिकृत पहुंच।',
      generic: 'एक त्रुटि हुई। कृपया पुन: प्रयास करें।',
    },
  },
  ar: enCopy,
};

export type Language = 'en' | 'hi' | 'ar';

const LANGUAGE_STORAGE_KEY = 'language';
const LANGUAGE_EVENT = 'bhriguwelt:language';

const subscribeToLanguage = (callback: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(LANGUAGE_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(LANGUAGE_EVENT, handler as EventListener);
  };
};

const getClientLanguage = (): Language => getCurrentLanguage();

/**
 * Resolve nested key in object
 */
function resolveKey(obj: any, keys: string[]): any {
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  return value;
}

/**
 * Get translation string by key
 * @param key - Dot-notation key (e.g., 'common.appName')
 * @param lang - Language code ('en' or 'hi')
 * @returns Translated string
 */
export function t(key: string, lang: Language = 'en'): string {
  const keys = key.split('.');
  
  // Try to get translation in requested language
  const dictionary = copy[lang as keyof typeof copy] ?? copy.en;
  let value = resolveKey(dictionary, keys);
  
  // Fallback to English if not found and not already English
  if (value === null && lang !== 'en') {
    console.warn(`Translation key not found: ${key} for language: ${lang}, falling back to English`);
    value = resolveKey(copy.en, keys);
  }
  
  // Return the value if it's a string, otherwise return the key
  return typeof value === 'string' ? value : key;
}

/**
 * React hook for translations
 * @param lang - Optional language override
 * @returns Translation function
 */
export function useTranslation(lang?: Language) {
  const storeLang = useSyncExternalStore(
    subscribeToLanguage,
    getClientLanguage,
    () => 'en'
  );
  const defaultLang: Language = lang || storeLang;
  const translator = useCallback((key: string) => t(key, defaultLang), [defaultLang]);
  const dictionary = useMemo(() => copy[defaultLang], [defaultLang]);

  return {
    t: translator,
    lang: defaultLang,
    copy: dictionary,
  };
}

/**
 * Get current language from browser or localStorage
 */
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
  if (stored === 'en' || stored === 'hi' || stored === 'ar') {
    return stored;
  }

  // Detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ar')) {
    return 'ar';
  }
  if (browserLang.startsWith('hi')) {
    return 'hi';
  }

  return 'en';
}

/**
 * Set language preference
 */
export function setLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }
}
