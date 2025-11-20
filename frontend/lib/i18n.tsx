'use client';

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "hi";

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
};

const translations: Record<Language, Record<string, string>> = {
  en: {},
  hi: {
    "nav.home": "मुखपृष्ठ",
    "nav.horoscope": "कुंडली",
    "nav.past": "पूर्व जन्म",
    "nav.future": "भविष्य",
    "nav.matchmaking": "विवाह मिलान",
    "nav.calendar": "शक पंचांग",
    "nav.cta": "स्टूडियो आज़माएँ",
    "nav.skip": "सामग्री पर जाएँ",
    "nav.tagline": "जेन ज़ी के लिए, हर पीढ़ी के लिए।",
    "nav.desc": "रिस्पॉन्सिव वेब, वर्सेल प्रीव्यू, और एंड्रॉइड/iOS अनुभवों के लिए तैयार।",
    "hero.eyebrow": "भृगु संहिता स्टूडियो",
    "hero.title": "जेन ज़ी और सभी पीढ़ियों के लिए सटीक ज्योतिष।",
    "hero.body": "आधुनिक खोजकर्ताओं के लिए जीवंत, मोबाइल-फर्स्ट फ्लो। शक और भृगु संहिता की शुद्धता बनाए रखें—लोकल या वर्सेल पर चलाएं, और मोबाइल ऐप्स से जोड़ें।",
    "hero.cta.horoscope": "कुंडली देखें",
    "hero.cta.matchmaking": "आधुनिक मिलान",
    "hero.badge": "शक-संरेखित • रेंडर + वर्सेल",
    "home.grid.navigation.title": "हर अनुष्ठान का अपना पेज",
    "home.grid.navigation.body": "नेविगेशन या कार्ड्स से सीधे कुंडली, पूर्व जन्म, भविष्य, मिलान, या कैलेंडर पर जाएँ।",
    "home.grid.deploy.title": "रेंडर API, वर्सेल UI",
    "home.grid.deploy.body": "NEXT_PUBLIC_BACKEND_URL सेट करें और वही फ्लो Android/iOS पर भी चमकेंगे।",
    "home.grid.accessibility.title": "पहुँच और भाषा",
    "home.grid.accessibility.body": "ARIA लेबल, फोकस प्रबंधन, और हिंदी/अंग्रेज़ी स्विचर स्क्रीनरीडर मित्रवत अनुभव देता है।",
    "form.subtitle": "भृगु संहिता अनुरूप",
    "form.helper": "सभी विवरण भरें ताकि सही संस्कार और उपाय मिल सकें।",
    "form.name": "पूरा नाम",
    "form.birthDate": "जन्म तिथि (YYYY-MM-DD)",
    "form.birthTime": "जन्म समय (HH:MM)",
    "form.birthPlace": "जन्म स्थान",
    "form.lunarTithi": "चंद्र तिथि",
    "form.moonElement": "चंद्र तत्व",
    "form.marsHouse": "मंगल भाव",
    "form.saturnHouse": "शनि भाव",
    "form.venusHouse": "शुक्र भाव",
    "form.rahu": "क्या राहु लग्न को देखता है?",
    "form.yes": "हाँ",
    "form.no": "नहीं",
    "form.submit": "सूझ-बूझ प्राप्त करें",
    "form.loading": "भृगु से परामर्श जारी...",
    "form.accessibility": "सबमिट करने के बाद परिणाम नीचे पढ़ें।",
    "form.error": "अनुरोध विफल हुआ। कृपया विवरण जांचें।",
    "matchmaking.partner": "साथी का विवरण",
    "matchmaking.primary": "प्राथमिक विवरण",
    "matchmaking.preferences": "आधुनिक प्राथमिकताएँ (कॉमा से अलग)",
    "calendar.title": "शक पंचांग रूपांतरण",
    "calendar.helper": "ग्रेगोरियन जन्म विवरण को शक संदर्भ में बदलें।",
    "results.title": "परिणाम",
    "results.helper": "फॉर्म जमा करने के बाद यहाँ JSON दिखाई देगा।",
    "results.helperRaw": "कच्चा JSON मोबाइल या चैट UI में पेस्ट करें।",
    "pages.horoscope.title": "कुंडली",
    "pages.future.title": "भविष्य दिशा",
    "pages.past.title": "पूर्व जन्म स्मरण",
    "pages.matchmaking.title": "आधुनिक मिलान",
    "pages.calendar.title": "शक कैलेंडर",
  },
};

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => undefined,
  t: (_key: string, fallback?: string) => fallback || "",
});

function translate(lang: Language, key: string, fallback?: string): string {
  return translations[lang][key] || translations.en[key] || fallback || key;
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("bhriguwelt.lang") : null;
    if (stored === "hi" || stored === "en") {
      setLang(stored);
    }
  }, []);

  const setLanguage = (value: Language) => {
    setLang(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhriguwelt.lang", value);
    }
  };

  const value = useMemo(() => ({
    lang,
    setLang: setLanguage,
    t: (key: string, fallback?: string) => translate(lang, key, fallback),
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
